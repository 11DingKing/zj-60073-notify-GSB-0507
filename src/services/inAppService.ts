import prisma from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { wsManager } from '../lib/websocket';

export class InAppService {
  async getMessages(userId: string, params: {
    isRead?: boolean;
    page?: number;
    pageSize?: number;
  }) {
    const { isRead, page = 1, pageSize = 20 } = params;

    const where: any = { userId };
    if (isRead !== undefined) where.isRead = isRead;

    const [total, messages] = await Promise.all([
      prisma.inAppMessage.count({ where }),
      prisma.inAppMessage.findMany({
        where,
        include: {
          message: true,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data: messages,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async getUnreadCount(userId: string) {
    return prisma.inAppMessage.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  async markAsRead(userId: string, messageId: string) {
    const message = await prisma.inAppMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new AppError('消息不存在', 404);
    }

    if (message.userId !== userId) {
      throw new AppError('无权操作此消息', 403);
    }

    await prisma.inAppMessage.update({
      where: { id: messageId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    await wsManager.sendUnreadCount(userId);

    return prisma.inAppMessage.findUnique({ where: { id: messageId } });
  }

  async markAllAsRead(userId: string) {
    const result = await prisma.inAppMessage.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    await wsManager.sendUnreadCount(userId);

    return {
      updatedCount: result.count,
    };
  }

  async getMessage(userId: string, messageId: string) {
    const message = await prisma.inAppMessage.findUnique({
      where: { id: messageId },
      include: {
        message: true,
      },
    });

    if (!message) {
      throw new AppError('消息不存在', 404);
    }

    if (message.userId !== userId) {
      throw new AppError('无权访问此消息', 403);
    }

    if (!message.isRead) {
      await prisma.inAppMessage.update({
        where: { id: messageId },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
      await wsManager.sendUnreadCount(userId);
    }

    return message;
  }
}

export const inAppService = new InAppService();

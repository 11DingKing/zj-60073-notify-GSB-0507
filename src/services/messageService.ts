import { MessageStatus, RetryStrategy, ChannelType } from "@prisma/client";
import prisma from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import { templateService } from "./templateService";
import { channelService } from "./channelService";
import { SenderFactory } from "./sender/SenderFactory";
import { env } from "../config/env";
import { wsManager } from "../lib/websocket";
import { preferenceService } from "./preferenceService";

interface SendSingleOptions {
  templateCode?: string;
  channelType?: ChannelType;
  recipient: string;
  recipientId?: string;
  subject?: string;
  content?: string;
  variables: Record<string, any>;
  priority?: number;
  maxRetryCount?: number;
  retryStrategy?: RetryStrategy;
  retryInterval?: number;
}

interface SendBatchOptions extends Omit<
  SendSingleOptions,
  "recipient" | "recipientId"
> {
  recipients: Array<{
    recipient: string;
    recipientId?: string;
    variables?: Record<string, any>;
  }>;
}

export class MessageService {
  async sendSingle(options: SendSingleOptions) {
    const {
      templateCode,
      channelType,
      recipient,
      recipientId,
      subject,
      content,
      variables,
      priority = 0,
      maxRetryCount = env.MAX_RETRY_COUNT,
      retryStrategy = env.RETRY_STRATEGY === "exponential"
        ? RetryStrategy.EXPONENTIAL
        : RetryStrategy.FIXED,
      retryInterval = env.RETRY_INTERVAL,
    } = options;

    let targetChannels: Array<{ channelId: string; channelType: ChannelType }> =
      [];

    if (templateCode) {
      const template = await templateService.getTemplateByCode(templateCode);

      if (!template.isEnabled) {
        throw new AppError("模板已禁用", 400);
      }

      targetChannels = template.channels
        .filter((tc) => tc.isEnabled && tc.channel.isEnabled)
        .map((tc) => ({
          channelId: tc.channelId,
          channelType: tc.channel.type,
        }));

      if (targetChannels.length === 0) {
        throw new AppError("模板未绑定有效的启用渠道", 400);
      }
    } else if (channelType && content) {
      const channels = await channelService.listChannels(channelType, true);
      if (channels.length === 0) {
        throw new AppError("没有可用的启用渠道", 404);
      }
      targetChannels = channels.map((c) => ({
        channelId: c.id,
        channelType: c.type,
      }));
    } else {
      throw new AppError("必须提供 templateCode 或 channelType + content", 400);
    }

    const messages = [];

    for (const { channelId, channelType } of targetChannels) {
      let finalSubject = subject;
      let finalContent = content;

      if (templateCode) {
        const template = await templateService.getTemplateByCode(templateCode);
        finalSubject = template.subject
          ? templateService.renderTemplate(template.subject, variables)
          : undefined;
        finalContent = templateService.renderTemplate(
          template.content,
          variables,
        );
      }

      const message = await prisma.message.create({
        data: {
          templateId: templateCode
            ? (await templateService.getTemplateByCode(templateCode)).id
            : null,
          channelId,
          recipient,
          recipientId,
          subject: finalSubject,
          content: finalContent!,
          variables,
          status: MessageStatus.PENDING,
          priority,
          maxRetryCount,
          retryStrategy,
          retryInterval,
        },
      });

      messages.push(message);

      this.processMessage(message.id);
    }

    return messages;
  }

  async sendBatch(options: SendBatchOptions) {
    const results = [];

    for (const rec of options.recipients) {
      try {
        const messages = await this.sendSingle({
          ...options,
          recipient: rec.recipient,
          recipientId: rec.recipientId,
          variables: rec.variables || options.variables || {},
        });
        results.push({
          recipient: rec.recipient,
          success: true,
          messages: messages.map((m) => m.id),
        });
      } catch (error: any) {
        results.push({
          recipient: rec.recipient,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  async processMessage(messageId: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        channel: true,
        provider: true,
      },
    });

    if (!message) {
      console.error(`消息不存在: ${messageId}`);
      return;
    }

    if (
      message.status !== MessageStatus.PENDING &&
      message.status !== MessageStatus.RETRY
    ) {
      console.log(`消息状态不是待处理: ${message.status}`);
      return;
    }

    await prisma.message.update({
      where: { id: messageId },
      data: { status: MessageStatus.SENDING },
    });

    try {
      if (!message.channel) {
        throw new Error("渠道不存在");
      }

      if (message.recipientId && message.channelId) {
        const notificationType =
          message.channel.type === ChannelType.IN_APP
            ? "in_app"
            : message.channel.type === ChannelType.EMAIL
              ? "email"
              : message.channel.type === ChannelType.SMS
                ? "sms"
                : "websocket";

        const { canSend, reason, quietEnd } =
          await preferenceService.checkCanSend(
            message.recipientId,
            message.channelId,
            notificationType,
          );

        if (!canSend) {
          if (reason === "用户处于免打扰时段") {
            const delay = this.calculateQuietDelay(quietEnd);
            await prisma.message.update({
              where: { id: messageId },
              data: { status: MessageStatus.PENDING },
            });
            setTimeout(() => {
              this.processMessage(messageId);
            }, delay);
            console.log(
              `用户 ${message.recipientId} 处于免打扰时段，消息 ${messageId} 将在 ${delay}ms 后重新处理`,
            );
            return;
          }
          if (reason === "用户已禁用该渠道") {
            await prisma.message.update({
              where: { id: messageId },
              data: {
                status: MessageStatus.FAILED,
                errorMessage: reason,
              },
            });
            console.log(`消息 ${messageId} 被用户偏好拦截: ${reason}`);
            return;
          }
        }
      }

      if (message.channel.type === ChannelType.IN_APP) {
        await this.processInAppMessage(message);
        return;
      }

      if (message.channel.type === ChannelType.WEBSOCKET) {
        await this.processWebSocketMessage(message);
        return;
      }

      const providers = await channelService.getEnabledProviders(
        message.channel.id,
      );

      if (providers.length === 0) {
        throw new Error("该渠道没有可用的供应商");
      }

      const result = await SenderFactory.sendWithProvider(
        message.channel.type,
        {
          recipient: message.recipient,
          recipientId: message.recipientId || undefined,
          subject: message.subject || undefined,
          content: message.content,
          variables: message.variables as Record<string, any>,
        },
        providers,
      );

      if (result.success) {
        await prisma.message.update({
          where: { id: messageId },
          data: {
            status: MessageStatus.SUCCESS,
            providerId: result.providerId,
            sentAt: new Date(),
            deliveredAt: new Date(),
            errorMessage: null,
          },
        });
        console.log(`消息发送成功: ${messageId}`);
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error(`消息发送失败: ${messageId}`, error.message);
      await this.handleSendFailure(messageId, error.message);
    }
  }

  private async processInAppMessage(message: {
    id: string;
    recipientId: string | null;
    subject: string | null;
    content: string;
  }) {
    const userId = message.recipientId;

    if (!userId) {
      await prisma.message.update({
        where: { id: message.id },
        data: {
          status: MessageStatus.FAILED,
          errorMessage: "站内信发送需要 recipientId",
        },
      });
      console.log(`站内信发送失败: ${message.id}，缺少 recipientId`);
      return;
    }

    const inAppMessage = await prisma.inAppMessage.create({
      data: {
        userId,
        messageId: message.id,
        title: message.subject || "站内消息",
        content: message.content,
        isRead: false,
      },
    });

    if (wsManager.isUserConnected(userId)) {
      await wsManager.sendInAppMessage(userId, inAppMessage);
      await wsManager.sendUnreadCount(userId);
    }

    await prisma.message.update({
      where: { id: message.id },
      data: {
        status: MessageStatus.SUCCESS,
        sentAt: new Date(),
        deliveredAt: new Date(),
        errorMessage: null,
      },
    });

    console.log(`站内信发送成功: ${message.id}`);
  }

  private async processWebSocketMessage(message: {
    id: string;
    recipientId: string | null;
    subject: string | null;
    content: string;
  }) {
    const userId = message.recipientId;

    if (!userId) {
      await prisma.message.update({
        where: { id: message.id },
        data: {
          status: MessageStatus.FAILED,
          errorMessage: "WebSocket 发送需要 recipientId",
        },
      });
      console.log(`WebSocket 发送失败: ${message.id}，缺少 recipientId`);
      return;
    }

    if (wsManager.isUserConnected(userId)) {
      const result = await wsManager.sendToUser(userId, {
        type: "push",
        data: {
          title: message.subject,
          content: message.content,
        },
      });

      if (result) {
        await prisma.message.update({
          where: { id: message.id },
          data: {
            status: MessageStatus.SUCCESS,
            sentAt: new Date(),
            deliveredAt: new Date(),
            errorMessage: null,
          },
        });
        console.log(`WebSocket 推送成功: ${message.id}`);
        return;
      }
    }

    console.log(`用户 ${userId} 不在线，WebSocket 消息回退为站内信存储`);

    const inAppMessage = await prisma.inAppMessage.create({
      data: {
        userId,
        messageId: message.id,
        title: message.subject || "推送消息",
        content: message.content,
        isRead: false,
      },
    });

    await prisma.message.update({
      where: { id: message.id },
      data: {
        status: MessageStatus.SUCCESS,
        sentAt: new Date(),
        deliveredAt: new Date(),
        errorMessage: null,
      },
    });

    console.log(`WebSocket 消息已回退为站内信存储: ${message.id}`);
  }

  private async handleSendFailure(messageId: string, errorMessage: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) return;

    const newRetryCount = message.retryCount + 1;

    if (newRetryCount >= message.maxRetryCount) {
      await prisma.message.update({
        where: { id: messageId },
        data: {
          status: MessageStatus.FAILED,
          retryCount: newRetryCount,
          errorMessage,
        },
      });
      console.log(`消息永久失败: ${messageId}，已达到最大重试次数`);
      return;
    }

    const delay = this.calculateDelay(message);

    await prisma.message.update({
      where: { id: messageId },
      data: {
        status: MessageStatus.RETRY,
        retryCount: newRetryCount,
        errorMessage,
      },
    });

    setTimeout(() => {
      this.processMessage(messageId);
    }, delay);

    console.log(
      `消息将在 ${delay}ms 后重试: ${messageId}，第 ${newRetryCount} 次重试`,
    );
  }

  private calculateDelay(message: {
    retryCount: number;
    retryStrategy: RetryStrategy;
    retryInterval: number;
  }): number {
    if (message.retryStrategy === RetryStrategy.EXPONENTIAL) {
      const base = env.RETRY_EXPONENTIAL_BASE;
      return message.retryInterval * Math.pow(base, message.retryCount);
    }
    return message.retryInterval;
  }

  private calculateQuietDelay(quietEnd?: string): number {
    if (!quietEnd) {
      return 60 * 60 * 1000;
    }

    const now = new Date();
    const [endHour, endMin] = quietEnd.split(':').map(Number);
    const endMinutes = endHour * 60 + endMin;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let delayMinutes: number;
    if (endMinutes > currentMinutes) {
      delayMinutes = endMinutes - currentMinutes;
    } else {
      delayMinutes = 24 * 60 - currentMinutes + endMinutes;
    }

    return delayMinutes * 60 * 1000;
  }

  async listMessages(params: {
    recipient?: string;
    recipientId?: string;
    channelId?: string;
    templateId?: string;
    status?: MessageStatus;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }) {
    const {
      recipient,
      recipientId,
      channelId,
      templateId,
      status,
      startDate,
      endDate,
      page = 1,
      pageSize = 20,
    } = params;

    const where: any = {};

    if (recipient) where.recipient = recipient;
    if (recipientId) where.recipientId = recipientId;
    if (channelId) where.channelId = channelId;
    if (templateId) where.templateId = templateId;
    if (status) where.status = status;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [total, messages] = await Promise.all([
      prisma.message.count({ where }),
      prisma.message.findMany({
        where,
        include: {
          channel: true,
          template: true,
          provider: true,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
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

  async getMessage(id: string) {
    const message = await prisma.message.findUnique({
      where: { id },
      include: {
        channel: true,
        template: true,
        provider: true,
        inAppMessage: true,
      },
    });

    if (!message) {
      throw new AppError("消息不存在", 404);
    }

    return message;
  }

  async retryMessage(messageId: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new AppError("消息不存在", 404);
    }

    if (message.status !== MessageStatus.FAILED) {
      throw new AppError("只有失败状态的消息才能重试", 400);
    }

    await prisma.message.update({
      where: { id: messageId },
      data: {
        status: MessageStatus.RETRY,
        retryCount: 0,
        errorMessage: null,
      },
    });

    this.processMessage(messageId);

    return prisma.message.findUnique({ where: { id: messageId } });
  }
}

export const messageService = new MessageService();

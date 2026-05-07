import { ChannelType, ProviderType } from '@prisma/client';
import prisma from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export class ChannelService {
  async createChannel(data: {
    type: ChannelType;
    name: string;
    description?: string;
    config: Record<string, any>;
  }) {
    return prisma.channel.create({
      data,
    });
  }

  async updateChannel(
    id: string,
    data: {
      name?: string;
      description?: string;
      isEnabled?: boolean;
      config?: Record<string, any>;
    }
  ) {
    const channel = await prisma.channel.findUnique({
      where: { id },
    });

    if (!channel) {
      throw new AppError('渠道不存在', 404);
    }

    return prisma.channel.update({
      where: { id },
      data,
    });
  }

  async listChannels(type?: ChannelType, isEnabled?: boolean) {
    const where: any = {};
    if (type) where.type = type;
    if (isEnabled !== undefined) where.isEnabled = isEnabled;

    return prisma.channel.findMany({
      where,
      include: {
        providers: {
          orderBy: { priority: 'desc' },
        },
        _count: {
          select: { templates: true, messages: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getChannel(id: string) {
    const channel = await prisma.channel.findUnique({
      where: { id },
      include: {
        providers: {
          orderBy: { priority: 'desc' },
        },
        templates: {
          include: { template: true },
        },
      },
    });

    if (!channel) {
      throw new AppError('渠道不存在', 404);
    }

    return channel;
  }

  async deleteChannel(id: string) {
    const channel = await prisma.channel.findUnique({
      where: { id },
    });

    if (!channel) {
      throw new AppError('渠道不存在', 404);
    }

    return prisma.channel.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async createProvider(data: {
    channelId: string;
    type: ProviderType;
    name: string;
    description?: string;
    config: Record<string, any>;
    priority?: number;
  }) {
    const channel = await prisma.channel.findUnique({
      where: { id: data.channelId },
    });

    if (!channel) {
      throw new AppError('渠道不存在', 404);
    }

    return prisma.channelProvider.create({
      data: {
        ...data,
        priority: data.priority || 0,
      },
    });
  }

  async updateProvider(
    id: string,
    data: {
      name?: string;
      description?: string;
      isEnabled?: boolean;
      config?: Record<string, any>;
      priority?: number;
    }
  ) {
    const provider = await prisma.channelProvider.findUnique({
      where: { id },
    });

    if (!provider) {
      throw new AppError('供应商不存在', 404);
    }

    return prisma.channelProvider.update({
      where: { id },
      data,
    });
  }

  async getEnabledProviders(channelId: string) {
    return prisma.channelProvider.findMany({
      where: {
        channelId,
        isEnabled: true,
      },
      orderBy: { priority: 'desc' },
    });
  }

  async listAllProviders(params: {
    type?: ProviderType;
    isEnabled?: boolean;
    page?: number;
    pageSize?: number;
  } = {}) {
    const { type, isEnabled, page = 1, pageSize = 20 } = params;

    const where: any = {};
    if (type) where.type = type;
    if (isEnabled !== undefined) where.isEnabled = isEnabled;

    const [total, providers] = await Promise.all([
      prisma.channelProvider.count({ where }),
      prisma.channelProvider.findMany({
        where,
        include: {
          channel: true,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [
          { channelId: 'asc' },
          { priority: 'desc' },
        ],
      }),
    ]);

    return {
      data: providers,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async deleteProvider(id: string) {
    const provider = await prisma.channelProvider.findUnique({
      where: { id },
    });

    if (!provider) {
      throw new AppError('供应商不存在', 404);
    }

    return prisma.channelProvider.delete({
      where: { id },
    });
  }
}

export const channelService = new ChannelService();

import { MessageStatus, ChannelType } from '@prisma/client';
import prisma from '../lib/prisma';

interface TimeRange {
  start?: Date;
  end?: Date;
}

export class StatisticsService {
  async getOverallStats(timeRange?: TimeRange) {
    const where: any = {};
    if (timeRange?.start || timeRange?.end) {
      where.createdAt = {};
      if (timeRange.start) where.createdAt.gte = timeRange.start;
      if (timeRange.end) where.createdAt.lte = timeRange.end;
    }

    const [total, success, failed, pending, messagesWithTime] = await Promise.all([
      prisma.message.count({ where }),
      prisma.message.count({ where: { ...where, status: MessageStatus.SUCCESS } }),
      prisma.message.count({ where: { ...where, status: MessageStatus.FAILED } }),
      prisma.message.count({
        where: {
          ...where,
          status: { in: [MessageStatus.PENDING, MessageStatus.SENDING, MessageStatus.RETRY] },
        },
      }),
      prisma.message.findMany({
        where: { ...where, status: MessageStatus.SUCCESS, sentAt: { not: null } },
        select: { createdAt: true, sentAt: true },
      }),
    ]);

    const avgDelayMs = messagesWithTime.length > 0
      ? messagesWithTime.reduce((sum, msg) => {
          const delay = msg.sentAt!.getTime() - msg.createdAt.getTime();
          return sum + delay;
        }, 0) / messagesWithTime.length
      : 0;

    return {
      total,
      success,
      failed,
      pending,
      successRate: total > 0 ? success / total : 0,
      avgDelayMs,
    };
  }

  async getStatsByChannel(timeRange?: TimeRange) {
    const where: any = {};
    if (timeRange?.start || timeRange?.end) {
      where.createdAt = {};
      if (timeRange.start) where.createdAt.gte = timeRange.start;
      if (timeRange.end) where.createdAt.lte = timeRange.end;
    }

    const messages = await prisma.message.findMany({
      where,
      include: { channel: true },
    });

    const channelStats: Record<string, any> = {};

    for (const msg of messages) {
      if (!msg.channel) continue;

      const key = msg.channelId;
      if (!channelStats[key]) {
        channelStats[key] = {
          channelId: msg.channelId,
          channelType: msg.channel.type,
          channelName: msg.channel.name,
          total: 0,
          success: 0,
          failed: 0,
          pending: 0,
          delays: [] as number[],
        };
      }

      const stat = channelStats[key];
      stat.total++;

      if (msg.status === MessageStatus.SUCCESS) {
        stat.success++;
        if (msg.sentAt) {
          stat.delays.push(msg.sentAt.getTime() - msg.createdAt.getTime());
        }
      } else if (msg.status === MessageStatus.FAILED) {
        stat.failed++;
      } else {
        stat.pending++;
      }
    }

    return Object.values(channelStats).map((stat) => ({
      ...stat,
      successRate: stat.total > 0 ? stat.success / stat.total : 0,
      avgDelayMs: stat.delays.length > 0
        ? stat.delays.reduce((a: number, b: number) => a + b, 0) / stat.delays.length
        : 0,
      delays: undefined,
    }));
  }

  async getStatsByTemplate(timeRange?: TimeRange) {
    const where: any = {};
    if (timeRange?.start || timeRange?.end) {
      where.createdAt = {};
      if (timeRange.start) where.createdAt.gte = timeRange.start;
      if (timeRange.end) where.createdAt.lte = timeRange.end;
    }

    const messages = await prisma.message.findMany({
      where: { ...where, templateId: { not: null } },
      include: { template: true },
    });

    const templateStats: Record<string, any> = {};

    for (const msg of messages) {
      if (!msg.templateId || !msg.template) continue;

      const key = msg.templateId;
      if (!templateStats[key]) {
        templateStats[key] = {
          templateId: msg.templateId,
          templateCode: msg.template.code,
          templateName: msg.template.name,
          total: 0,
          success: 0,
          failed: 0,
          pending: 0,
          delays: [] as number[],
        };
      }

      const stat = templateStats[key];
      stat.total++;

      if (msg.status === MessageStatus.SUCCESS) {
        stat.success++;
        if (msg.sentAt) {
          stat.delays.push(msg.sentAt.getTime() - msg.createdAt.getTime());
        }
      } else if (msg.status === MessageStatus.FAILED) {
        stat.failed++;
      } else {
        stat.pending++;
      }
    }

    return Object.values(templateStats).map((stat) => ({
      ...stat,
      successRate: stat.total > 0 ? stat.success / stat.total : 0,
      avgDelayMs: stat.delays.length > 0
        ? stat.delays.reduce((a: number, b: number) => a + b, 0) / stat.delays.length
        : 0,
      delays: undefined,
    }));
  }

  async getStatsByTime(timeRange?: TimeRange, granularity: 'hour' | 'day' | 'week' | 'month' = 'day') {
    const where: any = {};
    if (timeRange?.start || timeRange?.end) {
      where.createdAt = {};
      if (timeRange.start) where.createdAt.gte = timeRange.start;
      if (timeRange.end) where.createdAt.lte = timeRange.end;
    }

    const messages = await prisma.message.findMany({
      where,
      select: {
        id: true,
        status: true,
        createdAt: true,
        sentAt: true,
      },
    });

    const timeStats: Record<string, any> = {};

    for (const msg of messages) {
      const key = this.getTimeKey(msg.createdAt, granularity);

      if (!timeStats[key]) {
        timeStats[key] = {
          time: key,
          total: 0,
          success: 0,
          failed: 0,
          pending: 0,
          delays: [] as number[],
        };
      }

      const stat = timeStats[key];
      stat.total++;

      if (msg.status === MessageStatus.SUCCESS) {
        stat.success++;
        if (msg.sentAt) {
          stat.delays.push(msg.sentAt.getTime() - msg.createdAt.getTime());
        }
      } else if (msg.status === MessageStatus.FAILED) {
        stat.failed++;
      } else {
        stat.pending++;
      }
    }

    return Object.values(timeStats)
      .map((stat) => ({
        ...stat,
        successRate: stat.total > 0 ? stat.success / stat.total : 0,
        avgDelayMs: stat.delays.length > 0
          ? stat.delays.reduce((a: number, b: number) => a + b, 0) / stat.delays.length
          : 0,
        delays: undefined,
      }))
      .sort((a, b) => a.time.localeCompare(b.time));
  }

  private getTimeKey(date: Date, granularity: string): string {
    const d = new Date(date);
    switch (granularity) {
      case 'hour':
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:00`;
      case 'day':
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      case 'week':
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        return `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
      case 'month':
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      default:
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
  }
}

export const statisticsService = new StatisticsService();

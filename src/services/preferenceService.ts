import prisma from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";

export class PreferenceService {
  async getPreferences(userId: string) {
    return prisma.userPreference.findMany({
      where: { userId },
      include: {
        channel: true,
      },
    });
  }

  async getPreference(
    userId: string,
    channelId: string,
    notificationType: string,
  ) {
    return prisma.userPreference.findUnique({
      where: {
        userId_channelId_notificationType: {
          userId,
          channelId,
          notificationType,
        },
      },
      include: {
        channel: true,
      },
    });
  }

  async setPreference(data: {
    userId: string;
    channelId: string;
    notificationType: string;
    isEnabled?: boolean;
    quietStart?: string;
    quietEnd?: string;
  }) {
    const channel = await prisma.channel.findUnique({
      where: { id: data.channelId },
    });

    if (!channel) {
      throw new AppError("渠道不存在", 404);
    }

    return prisma.userPreference.upsert({
      where: {
        userId_channelId_notificationType: {
          userId: data.userId,
          channelId: data.channelId,
          notificationType: data.notificationType,
        },
      },
      create: {
        userId: data.userId,
        channelId: data.channelId,
        notificationType: data.notificationType,
        isEnabled: data.isEnabled ?? true,
        quietStart: data.quietStart,
        quietEnd: data.quietEnd,
      },
      update: {
        ...(data.isEnabled !== undefined && { isEnabled: data.isEnabled }),
        ...(data.quietStart !== undefined && { quietStart: data.quietStart }),
        ...(data.quietEnd !== undefined && { quietEnd: data.quietEnd }),
      },
      include: {
        channel: true,
      },
    });
  }

  async batchSetPreferences(
    userId: string,
    preferences: Array<{
      channelId: string;
      notificationType: string;
      isEnabled?: boolean;
      quietStart?: string;
      quietEnd?: string;
    }>,
  ) {
    const results = [];

    for (const pref of preferences) {
      try {
        const result = await this.setPreference({
          userId,
          ...pref,
        });
        results.push({ success: true, data: result });
      } catch (error: any) {
        results.push({ success: false, error: error.message });
      }
    }

    return results;
  }

  async isInQuietTime(preference: {
    quietStart?: string | null;
    quietEnd?: string | null;
  }): Promise<boolean> {
    if (!preference.quietStart || !preference.quietEnd) {
      return false;
    }

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMin] = preference.quietStart.split(":").map(Number);
    const [endHour, endMin] = preference.quietEnd.split(":").map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (startMinutes <= endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    } else {
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }
  }

  async checkCanSend(
    userId: string,
    channelId: string,
    notificationType: string,
  ): Promise<{ canSend: boolean; reason?: string; delayMs?: number }> {
    const preference = await this.getPreference(
      userId,
      channelId,
      notificationType,
    );

    if (!preference) {
      return { canSend: true };
    }

    if (!preference.isEnabled) {
      return { canSend: false, reason: "用户已禁用该渠道" };
    }

    if (await this.isInQuietTime(preference)) {
      const delayMs = this.calculateDelayUntilQuietEnd(preference.quietEnd!);
      return { canSend: false, reason: "用户处于免打扰时段", delayMs };
    }

    return { canSend: true };
  }

  calculateDelayUntilQuietEnd(quietEnd: string): number {
    const now = new Date();
    const [endHour, endMin] = quietEnd.split(":").map(Number);

    const endTime = new Date();
    endTime.setHours(endHour, endMin, 0, 0);

    if (endTime <= now) {
      endTime.setDate(endTime.getDate() + 1);
    }

    return endTime.getTime() - now.getTime();
  }

  async deletePreference(
    userId: string,
    channelId: string,
    notificationType: string,
  ) {
    const preference = await prisma.userPreference.findUnique({
      where: {
        userId_channelId_notificationType: {
          userId,
          channelId,
          notificationType,
        },
      },
    });

    if (!preference) {
      throw new AppError("偏好设置不存在", 404);
    }

    return prisma.userPreference.delete({
      where: {
        userId_channelId_notificationType: {
          userId,
          channelId,
          notificationType,
        },
      },
    });
  }
}

export const preferenceService = new PreferenceService();

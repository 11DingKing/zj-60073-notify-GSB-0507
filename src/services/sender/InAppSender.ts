import { ChannelProvider } from '@prisma/client';
import { ISender, SendOptions, SendResult } from './ISender';
import prisma from '../../lib/prisma';
import { wsManager } from '../../lib/websocket';

export class InAppSender implements ISender {
  async send(options: SendOptions, provider: ChannelProvider): Promise<SendResult> {
    try {
      const userId = options.recipientId;

      if (!userId) {
        return {
          success: false,
          message: '站内信发送需要 recipientId',
        };
      }

      const inAppMessage = await prisma.inAppMessage.create({
        data: {
          userId,
          title: options.subject,
          content: options.content,
          isRead: false,
        },
      });

      if (wsManager.isUserConnected(userId)) {
        await wsManager.sendInAppMessage(userId, inAppMessage);
        await wsManager.sendUnreadCount(userId);
      }

      return {
        success: true,
        message: '站内信发送成功',
        providerId: provider.id,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `站内信发送失败: ${error.message}`,
      };
    }
  }
}

import { ChannelProvider } from '@prisma/client';
import { ISender, SendOptions, SendResult } from './ISender';
import { wsManager } from '../../lib/websocket';

export class WebSocketSender implements ISender {
  async send(options: SendOptions, provider: ChannelProvider): Promise<SendResult> {
    try {
      const userId = options.recipientId;

      if (!userId) {
        return {
          success: false,
          message: 'WebSocket 发送需要 recipientId',
        };
      }

      const isConnected = wsManager.isUserConnected(userId);

      if (!isConnected) {
        return {
          success: false,
          message: `用户 ${userId} 未连接 WebSocket`,
        };
      }

      const result = await wsManager.sendToUser(userId, {
        type: 'push',
        data: {
          title: options.subject,
          content: options.content,
          variables: options.variables,
        },
      });

      if (result) {
        return {
          success: true,
          message: 'WebSocket 推送成功',
          providerId: provider.id,
        };
      }

      return {
        success: false,
        message: 'WebSocket 推送失败',
      };
    } catch (error: any) {
      return {
        success: false,
        message: `WebSocket 发送失败: ${error.message}`,
      };
    }
  }
}

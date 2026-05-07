import { ChannelType, ChannelProvider } from '@prisma/client';
import { ISender } from './ISender';
import { EmailSender } from './EmailSender';
import { SmsSender } from './SmsSender';
import { InAppSender } from './InAppSender';
import { WebSocketSender } from './WebSocketSender';

export class SenderFactory {
  private static senders: Map<ChannelType, ISender> = new Map();

  static getSender(channelType: ChannelType): ISender {
    if (this.senders.has(channelType)) {
      return this.senders.get(channelType)!;
    }

    let sender: ISender;
    switch (channelType) {
      case ChannelType.EMAIL:
        sender = new EmailSender();
        break;
      case ChannelType.SMS:
        sender = new SmsSender();
        break;
      case ChannelType.IN_APP:
        sender = new InAppSender();
        break;
      case ChannelType.WEBSOCKET:
        sender = new WebSocketSender();
        break;
      default:
        throw new Error(`不支持的渠道类型: ${channelType}`);
    }

    this.senders.set(channelType, sender);
    return sender;
  }

  static async sendWithProvider(
    channelType: ChannelType,
    options: Parameters<ISender['send']>[0],
    providers: ChannelProvider[]
  ): Promise<ReturnType<ISender['send']>> {
    const sender = this.getSender(channelType);

    for (const provider of providers) {
      const result = await sender.send(options, provider);
      if (result.success) {
        return result;
      }
      console.log(`供应商 ${provider.name} 发送失败，尝试下一个...`);
    }

    return {
      success: false,
      message: '所有供应商发送失败',
    };
  }
}

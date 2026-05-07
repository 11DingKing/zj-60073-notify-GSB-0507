import { ChannelProvider } from '@prisma/client';

export interface SendOptions {
  recipient: string;
  recipientId?: string;
  subject?: string;
  content: string;
  variables?: Record<string, any>;
}

export interface SendResult {
  success: boolean;
  message?: string;
  providerId?: string;
  externalId?: string;
}

export interface ISender {
  send(options: SendOptions, provider: ChannelProvider): Promise<SendResult>;
}

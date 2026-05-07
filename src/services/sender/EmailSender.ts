import { ChannelProvider, ProviderType } from '@prisma/client';
import { ISender, SendOptions, SendResult } from './ISender';
import nodemailer from 'nodemailer';

export class EmailSender implements ISender {
  async send(options: SendOptions, provider: ChannelProvider): Promise<SendResult> {
    const config = provider.config as any;

    if (provider.type === ProviderType.SMTP) {
      return this.sendViaSMTP(options, config);
    } else if (provider.type === ProviderType.SENDGRID) {
      return this.sendViaSendGrid(options, config);
    }

    return {
      success: false,
      message: `不支持的邮件供应商类型: ${provider.type}`,
    };
  }

  private async sendViaSMTP(options: SendOptions, config: any): Promise<SendResult> {
    try {
      const transporter = nodemailer.createTransport({
        host: config.host || process.env.SMTP_HOST,
        port: config.port || parseInt(process.env.SMTP_PORT || '587'),
        secure: config.secure === true,
        auth: {
          user: config.user || process.env.SMTP_USER,
          pass: config.pass || process.env.SMTP_PASS,
        },
      });

      const mailOptions = {
        from: config.from || process.env.SMTP_FROM,
        to: options.recipient,
        subject: options.subject || '通知消息',
        html: options.content,
      };

      const info = await transporter.sendMail(mailOptions);

      return {
        success: true,
        message: '邮件发送成功',
        externalId: info.messageId,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `SMTP 发送失败: ${error.message}`,
      };
    }
  }

  private async sendViaSendGrid(options: SendOptions, config: any): Promise<SendResult> {
    try {
      const apiKey = config.apiKey || process.env.SENDGRID_API_KEY;
      const from = config.from || process.env.SENDGRID_FROM;

      if (!apiKey) {
        return {
          success: false,
          message: 'SendGrid API Key 未配置',
        };
      }

      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: options.recipient }],
            },
          ],
          from: { email: from || 'noreply@example.com' },
          subject: options.subject || '通知消息',
          content: [
            {
              type: 'text/html',
              value: options.content,
            },
          ],
        }),
      });

      if (response.ok) {
        return {
          success: true,
          message: 'SendGrid 发送成功',
        };
      }

      const errorText = await response.text();
      return {
        success: false,
        message: `SendGrid 发送失败: ${response.status} ${errorText}`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `SendGrid 发送失败: ${error.message}`,
      };
    }
  }
}

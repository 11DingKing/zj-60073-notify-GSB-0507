import { ChannelProvider, ProviderType } from '@prisma/client';
import { ISender, SendOptions, SendResult } from './ISender';

export class SmsSender implements ISender {
  async send(options: SendOptions, provider: ChannelProvider): Promise<SendResult> {
    const config = provider.config as any;

    if (provider.type === ProviderType.ALIYUN_SMS) {
      return this.sendViaAliyun(options, config);
    } else if (provider.type === ProviderType.TENCENT_SMS) {
      return this.sendViaTencent(options, config);
    }

    return {
      success: false,
      message: `不支持的短信供应商类型: ${provider.type}`,
    };
  }

  private async sendViaAliyun(options: SendOptions, config: any): Promise<SendResult> {
    try {
      const accessKeyId = config.accessKeyId || process.env.SMS_ACCESS_KEY;
      const accessKeySecret = config.accessKeySecret || process.env.SMS_SECRET_KEY;
      const signName = config.signName || process.env.SMS_SIGN_NAME;
      const templateCode = config.templateCode;

      if (!accessKeyId || !accessKeySecret) {
        return {
          success: false,
          message: '阿里云短信配置不完整',
        };
      }

      console.log('阿里云短信发送:', {
        phone: options.recipient,
        signName,
        templateCode,
        params: options.variables,
      });

      return {
        success: true,
        message: '短信发送成功（模拟）',
        externalId: `aliyun_${Date.now()}`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `阿里云短信发送失败: ${error.message}`,
      };
    }
  }

  private async sendViaTencent(options: SendOptions, config: any): Promise<SendResult> {
    try {
      const secretId = config.secretId || process.env.SMS_ACCESS_KEY;
      const secretKey = config.secretKey || process.env.SMS_SECRET_KEY;
      const smsSdkAppId = config.smsSdkAppId;
      const signName = config.signName || process.env.SMS_SIGN_NAME;

      if (!secretId || !secretKey || !smsSdkAppId) {
        return {
          success: false,
          message: '腾讯云短信配置不完整',
        };
      }

      console.log('腾讯云短信发送:', {
        phone: options.recipient,
        smsSdkAppId,
        signName,
        params: options.variables,
      });

      return {
        success: true,
        message: '短信发送成功（模拟）',
        externalId: `tencent_${Date.now()}`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `腾讯云短信发送失败: ${error.message}`,
      };
    }
  }
}

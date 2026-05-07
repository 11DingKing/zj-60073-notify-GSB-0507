import { PrismaClient, ChannelType, ProviderType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始初始化 seed 数据...');

  console.log('创建渠道...');

  const emailChannel = await prisma.channel.upsert({
    where: { id: 'channel-email' },
    update: {},
    create: {
      id: 'channel-email',
      type: ChannelType.EMAIL,
      name: '邮件通知',
      description: '通过邮件发送通知消息',
      isEnabled: true,
      config: {},
    },
  });

  const smsChannel = await prisma.channel.upsert({
    where: { id: 'channel-sms' },
    update: {},
    create: {
      id: 'channel-sms',
      type: ChannelType.SMS,
      name: '短信通知',
      description: '通过短信发送通知消息',
      isEnabled: true,
      config: {},
    },
  });

  const inAppChannel = await prisma.channel.upsert({
    where: { id: 'channel-inapp' },
    update: {},
    create: {
      id: 'channel-inapp',
      type: ChannelType.IN_APP,
      name: '站内信',
      description: '站内信通知消息',
      isEnabled: true,
      config: {},
    },
  });

  const websocketChannel = await prisma.channel.upsert({
    where: { id: 'channel-websocket' },
    update: {},
    create: {
      id: 'channel-websocket',
      type: ChannelType.WEBSOCKET,
      name: 'WebSocket 推送',
      description: '通过 WebSocket 实时推送通知消息',
      isEnabled: true,
      config: {},
    },
  });

  console.log('创建渠道供应商...');

  await prisma.channelProvider.upsert({
    where: { id: 'provider-smtp' },
    update: {},
    create: {
      id: 'provider-smtp',
      channelId: emailChannel.id,
      type: ProviderType.SMTP,
      name: 'SMTP 邮件服务器',
      description: '通过 SMTP 协议发送邮件',
      isEnabled: true,
      priority: 10,
      config: {
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        user: 'noreply@example.com',
        from: 'noreply@example.com',
      },
    },
  });

  await prisma.channelProvider.upsert({
    where: { id: 'provider-sendgrid' },
    update: {},
    create: {
      id: 'provider-sendgrid',
      channelId: emailChannel.id,
      type: ProviderType.SENDGRID,
      name: 'SendGrid 邮件服务',
      description: '通过 SendGrid API 发送邮件',
      isEnabled: true,
      priority: 5,
      config: {
        from: 'noreply@example.com',
      },
    },
  });

  await prisma.channelProvider.upsert({
    where: { id: 'provider-aliyun-sms' },
    update: {},
    create: {
      id: 'provider-aliyun-sms',
      channelId: smsChannel.id,
      type: ProviderType.ALIYUN_SMS,
      name: '阿里云短信',
      description: '通过阿里云短信服务发送短信',
      isEnabled: true,
      priority: 10,
      config: {
        signName: 'MyApp',
      },
    },
  });

  await prisma.channelProvider.upsert({
    where: { id: 'provider-tencent-sms' },
    update: {},
    create: {
      id: 'provider-tencent-sms',
      channelId: smsChannel.id,
      type: ProviderType.TENCENT_SMS,
      name: '腾讯云短信',
      description: '通过腾讯云短信服务发送短信',
      isEnabled: true,
      priority: 5,
      config: {
        smsSdkAppId: '1400000000',
        signName: 'MyApp',
      },
    },
  });

  await prisma.channelProvider.upsert({
    where: { id: 'provider-inapp' },
    update: {},
    create: {
      id: 'provider-inapp',
      channelId: inAppChannel.id,
      type: ProviderType.INTERNAL,
      name: '站内信系统',
      description: '内部站内信存储系统',
      isEnabled: true,
      priority: 1,
      config: {},
    },
  });

  await prisma.channelProvider.upsert({
    where: { id: 'provider-websocket' },
    update: {},
    create: {
      id: 'provider-websocket',
      channelId: websocketChannel.id,
      type: ProviderType.INTERNAL,
      name: 'WebSocket 服务',
      description: '内部 WebSocket 推送服务',
      isEnabled: true,
      priority: 1,
      config: {},
    },
  });

  console.log('创建模板...');

  const registerTemplate = await prisma.template.upsert({
    where: { code: 'USER_REGISTER' },
    update: {},
    create: {
      id: 'template-register',
      code: 'USER_REGISTER',
      name: '用户注册欢迎',
      description: '用户注册成功后发送的欢迎通知',
      type: 'system',
      subject: '欢迎加入 {{appName}}',
      content: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0;">欢迎加入 {{appName}}</h1>
  </div>
  <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; color: #333; line-height: 1.6;">
      亲爱的 <strong>{{username}}</strong>，
    </p>
    <p style="font-size: 16px; color: #333; line-height: 1.6;">
      感谢您注册 {{appName}}！您的账户已成功创建。
    </p>
    <div style="background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0; color: #666;">注册邮箱：<strong>{{email}}</strong></p>
      <p style="margin: 0; color: #666;">注册时间：<strong>{{registerTime}}</strong></p>
    </div>
    <p style="font-size: 14px; color: #999;">
      如果您没有进行此操作，请忽略此邮件。
    </p>
  </div>
</div>
      `,
      variables: ['appName', 'username', 'email', 'registerTime'],
      isEnabled: true,
    },
  });

  const resetTemplate = await prisma.template.upsert({
    where: { code: 'PASSWORD_RESET' },
    update: {},
    create: {
      id: 'template-reset',
      code: 'PASSWORD_RESET',
      name: '密码重置',
      description: '用户请求密码重置时发送的通知',
      type: 'security',
      subject: '密码重置请求 - {{appName}}',
      content: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; padding: 20px; background: #f44336; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0;">密码重置请求</h1>
  </div>
  <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; color: #333; line-height: 1.6;">
      亲爱的 <strong>{{username}}</strong>，
    </p>
    <p style="font-size: 16px; color: #333; line-height: 1.6;">
      您收到此邮件是因为我们收到了重置您 {{appName}} 账户密码的请求。
    </p>
    <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #ffeaa7;">
      <p style="margin: 0 0 10px 0; color: #856404; font-weight: bold;">重置验证码：</p>
      <p style="margin: 0; font-size: 32px; font-weight: bold; color: #d63384; letter-spacing: 4px; text-align: center;">
        {{resetCode}}
      </p>
      <p style="margin: 10px 0 0 0; color: #856404; font-size: 14px; text-align: center;">
        验证码将在 {{expireMinutes}} 分钟后过期
      </p>
    </div>
    <p style="font-size: 14px; color: #999;">
      如果您没有请求重置密码，请忽略此邮件。您的密码将保持不变。
    </p>
  </div>
</div>
      `,
      variables: ['appName', 'username', 'resetCode', 'expireMinutes'],
      isEnabled: true,
    },
  });

  const orderTemplate = await prisma.template.upsert({
    where: { code: 'ORDER_CONFIRM' },
    update: {},
    create: {
      id: 'template-order',
      code: 'ORDER_CONFIRM',
      name: '订单确认',
      description: '订单创建成功后发送的确认通知',
      type: 'business',
      subject: '订单确认 - #{{orderNumber}}',
      content: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; padding: 20px; background: #28a745; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0;">订单确认</h1>
  </div>
  <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; color: #333; line-height: 1.6;">
      亲爱的 <strong>{{username}}</strong>，
    </p>
    <p style="font-size: 16px; color: #333; line-height: 1.6;">
      您的订单已确认！感谢您的购买。
    </p>
    <div style="background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin: 0 0 15px 0; color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">
        订单详情
      </h3>
      <p style="margin: 8px 0; color: #666;">订单号：<strong>{{orderNumber}}</strong></p>
      <p style="margin: 8px 0; color: #666;">商品：<strong>{{productName}}</strong></p>
      <p style="margin: 8px 0; color: #666;">数量：<strong>{{quantity}}</strong></p>
      <p style="margin: 8px 0; color: #666;">总金额：<strong style="color: #d63384; font-size: 20px;">¥{{totalAmount}}</strong></p>
    </div>
    <p style="font-size: 14px; color: #999;">
      我们将尽快处理您的订单。如有问题，请联系客服。
    </p>
  </div>
</div>
      `,
      variables: ['username', 'orderNumber', 'productName', 'quantity', 'totalAmount'],
      isEnabled: true,
    },
  });

  const systemNoticeTemplate = await prisma.template.upsert({
    where: { code: 'SYSTEM_NOTICE' },
    update: {},
    create: {
      id: 'template-system',
      code: 'SYSTEM_NOTICE',
      name: '系统公告',
      description: '系统公告和重要通知',
      type: 'system',
      subject: '{{title}}',
      content: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; padding: 20px; background: #17a2b8; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0;">系统公告</h1>
  </div>
  <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 8px 8px;">
    <h3 style="margin: 0 0 15px 0; color: #333;">{{title}}</h3>
    <div style="color: #333; line-height: 1.8; font-size: 16px;">
      {{content}}
    </div>
    <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee;">
      <p style="margin: 0; color: #999; font-size: 14px;">
        发布时间：{{publishTime}}
      </p>
    </div>
  </div>
</div>
      `,
      variables: ['title', 'content', 'publishTime'],
      isEnabled: true,
    },
  });

  console.log('绑定模板到渠道...');

  await prisma.templateChannel.upsert({
    where: {
      templateId_channelId: {
        templateId: registerTemplate.id,
        channelId: emailChannel.id,
      },
    },
    update: {},
    create: {
      templateId: registerTemplate.id,
      channelId: emailChannel.id,
      isEnabled: true,
    },
  });

  await prisma.templateChannel.upsert({
    where: {
      templateId_channelId: {
        templateId: registerTemplate.id,
        channelId: inAppChannel.id,
      },
    },
    update: {},
    create: {
      templateId: registerTemplate.id,
      channelId: inAppChannel.id,
      isEnabled: true,
    },
  });

  await prisma.templateChannel.upsert({
    where: {
      templateId_channelId: {
        templateId: resetTemplate.id,
        channelId: emailChannel.id,
      },
    },
    update: {},
    create: {
      templateId: resetTemplate.id,
      channelId: emailChannel.id,
      isEnabled: true,
    },
  });

  await prisma.templateChannel.upsert({
    where: {
      templateId_channelId: {
        templateId: resetTemplate.id,
        channelId: smsChannel.id,
      },
    },
    update: {},
    create: {
      templateId: resetTemplate.id,
      channelId: smsChannel.id,
      isEnabled: true,
    },
  });

  await prisma.templateChannel.upsert({
    where: {
      templateId_channelId: {
        templateId: orderTemplate.id,
        channelId: emailChannel.id,
      },
    },
    update: {},
    create: {
      templateId: orderTemplate.id,
      channelId: emailChannel.id,
      isEnabled: true,
    },
  });

  await prisma.templateChannel.upsert({
    where: {
      templateId_channelId: {
        templateId: orderTemplate.id,
        channelId: inAppChannel.id,
      },
    },
    update: {},
    create: {
      templateId: orderTemplate.id,
      channelId: inAppChannel.id,
      isEnabled: true,
    },
  });

  await prisma.templateChannel.upsert({
    where: {
      templateId_channelId: {
        templateId: orderTemplate.id,
        channelId: websocketChannel.id,
      },
    },
    update: {},
    create: {
      templateId: orderTemplate.id,
      channelId: websocketChannel.id,
      isEnabled: true,
    },
  });

  await prisma.templateChannel.upsert({
    where: {
      templateId_channelId: {
        templateId: systemNoticeTemplate.id,
        channelId: inAppChannel.id,
      },
    },
    update: {},
    create: {
      templateId: systemNoticeTemplate.id,
      channelId: inAppChannel.id,
      isEnabled: true,
    },
  });

  await prisma.templateChannel.upsert({
    where: {
      templateId_channelId: {
        templateId: systemNoticeTemplate.id,
        channelId: websocketChannel.id,
      },
    },
    update: {},
    create: {
      templateId: systemNoticeTemplate.id,
      channelId: websocketChannel.id,
      isEnabled: true,
    },
  });

  console.log('Seed 数据初始化完成！');
  console.log('');
  console.log('创建的渠道：');
  console.log('  - 邮件通知 (EMAIL)');
  console.log('  - 短信通知 (SMS)');
  console.log('  - 站内信 (IN_APP)');
  console.log('  - WebSocket 推送 (WEBSOCKET)');
  console.log('');
  console.log('创建的供应商：');
  console.log('  - SMTP 邮件服务器 (SMTP)');
  console.log('  - SendGrid 邮件服务 (SENDGRID)');
  console.log('  - 阿里云短信 (ALIYUN_SMS)');
  console.log('  - 腾讯云短信 (TENCENT_SMS)');
  console.log('  - 站内信系统 (INTERNAL)');
  console.log('  - WebSocket 服务 (INTERNAL)');
  console.log('');
  console.log('创建的模板：');
  console.log('  - USER_REGISTER: 用户注册欢迎（绑定：邮件、站内信）');
  console.log('  - PASSWORD_RESET: 密码重置（绑定：邮件、短信）');
  console.log('  - ORDER_CONFIRM: 订单确认（绑定：邮件、站内信、WebSocket）');
  console.log('  - SYSTEM_NOTICE: 系统公告（绑定：站内信、WebSocket）');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import swaggerJSDoc from 'swagger-jsdoc';
import { env } from './env';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '多渠道消息通知中心 API',
      version: '1.0.0',
      description: '统一管理和发送各类通知消息的多渠道消息通知中心',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: '开发环境',
      },
    ],
    tags: [
      {
        name: 'Channels',
        description: '通知渠道管理 - 管理邮件/短信/站内信/WebSocket 等通知渠道及其供应商',
      },
      {
        name: 'Templates',
        description: '消息模板管理 - 创建和管理消息模板，支持版本控制',
      },
      {
        name: 'Messages',
        description: '消息发送 - 单发和批量发送消息，查询发送记录',
      },
      {
        name: 'Preferences',
        description: '用户偏好 - 用户消息订阅偏好管理',
      },
      {
        name: 'Statistics',
        description: '统计分析 - 按维度统计发送量、成功率等',
      },
      {
        name: 'InApp',
        description: '站内信 - WebSocket 站内信管理',
      },
    ],
    components: {
      schemas: {
        ChannelType: {
          type: 'string',
          enum: ['EMAIL', 'SMS', 'IN_APP', 'WEBSOCKET'],
          description: '通知渠道类型',
        },
        ProviderType: {
          type: 'string',
          enum: ['SMTP', 'SENDGRID', 'ALIYUN_SMS', 'TENCENT_SMS', 'INTERNAL'],
          description: '供应商类型',
        },
        MessageStatus: {
          type: 'string',
          enum: ['PENDING', 'SENDING', 'SUCCESS', 'FAILED', 'RETRY'],
          description: '消息状态',
        },
        RetryStrategy: {
          type: 'string',
          enum: ['FIXED', 'EXPONENTIAL'],
          description: '重试策略',
        },
        Channel: {
          type: 'object',
          properties: {
            id: { type: 'string', description: '渠道 ID' },
            type: { $ref: '#/components/schemas/ChannelType' },
            name: { type: 'string', description: '渠道名称' },
            description: { type: 'string', description: '渠道描述', nullable: true },
            isEnabled: { type: 'boolean', description: '是否启用' },
            config: { type: 'object', description: '渠道配置' },
            createdAt: { type: 'string', format: 'date-time', description: '创建时间' },
            updatedAt: { type: 'string', format: 'date-time', description: '更新时间' },
          },
        },
        ChannelProvider: {
          type: 'object',
          properties: {
            id: { type: 'string', description: '供应商 ID' },
            channelId: { type: 'string', description: '渠道 ID' },
            type: { $ref: '#/components/schemas/ProviderType' },
            name: { type: 'string', description: '供应商名称' },
            description: { type: 'string', description: '供应商描述', nullable: true },
            isEnabled: { type: 'boolean', description: '是否启用' },
            config: { type: 'object', description: '供应商配置' },
            priority: { type: 'integer', description: '优先级，数字越大优先级越高' },
            createdAt: { type: 'string', format: 'date-time', description: '创建时间' },
            updatedAt: { type: 'string', format: 'date-time', description: '更新时间' },
          },
        },
        Template: {
          type: 'object',
          properties: {
            id: { type: 'string', description: '模板 ID' },
            code: { type: 'string', description: '模板代码，唯一标识' },
            name: { type: 'string', description: '模板名称' },
            description: { type: 'string', description: '模板描述', nullable: true },
            type: { type: 'string', description: '模板类型' },
            subject: { type: 'string', description: '消息主题（邮件等）', nullable: true },
            content: { type: 'string', description: '消息内容，支持 {{variable}} 占位符' },
            variables: { type: 'array', items: { type: 'string' }, description: '变量列表' },
            isEnabled: { type: 'boolean', description: '是否启用' },
            createdAt: { type: 'string', format: 'date-time', description: '创建时间' },
            updatedAt: { type: 'string', format: 'date-time', description: '更新时间' },
          },
        },
        Message: {
          type: 'object',
          properties: {
            id: { type: 'string', description: '消息 ID' },
            templateId: { type: 'string', description: '模板 ID', nullable: true },
            channelId: { type: 'string', description: '渠道 ID', nullable: true },
            providerId: { type: 'string', description: '供应商 ID', nullable: true },
            recipient: { type: 'string', description: '接收人（邮箱/手机号等）' },
            recipientId: { type: 'string', description: '接收人用户 ID', nullable: true },
            subject: { type: 'string', description: '消息主题', nullable: true },
            content: { type: 'string', description: '消息内容' },
            variables: { type: 'object', description: '变量数据' },
            status: { $ref: '#/components/schemas/MessageStatus' },
            priority: { type: 'integer', description: '优先级' },
            retryCount: { type: 'integer', description: '已重试次数' },
            maxRetryCount: { type: 'integer', description: '最大重试次数' },
            retryStrategy: { $ref: '#/components/schemas/RetryStrategy' },
            retryInterval: { type: 'integer', description: '重试间隔（毫秒）' },
            errorMessage: { type: 'string', description: '错误信息', nullable: true },
            sentAt: { type: 'string', format: 'date-time', description: '发送时间', nullable: true },
            deliveredAt: { type: 'string', format: 'date-time', description: '送达时间', nullable: true },
            createdAt: { type: 'string', format: 'date-time', description: '创建时间' },
            updatedAt: { type: 'string', format: 'date-time', description: '更新时间' },
          },
        },
        InAppMessage: {
          type: 'object',
          properties: {
            id: { type: 'string', description: '站内信 ID' },
            messageId: { type: 'string', description: '关联消息 ID' },
            userId: { type: 'string', description: '用户 ID' },
            title: { type: 'string', description: '消息标题', nullable: true },
            content: { type: 'string', description: '消息内容' },
            isRead: { type: 'boolean', description: '是否已读' },
            readAt: { type: 'string', format: 'date-time', description: '阅读时间', nullable: true },
            createdAt: { type: 'string', format: 'date-time', description: '创建时间' },
          },
        },
        UserPreference: {
          type: 'object',
          properties: {
            id: { type: 'string', description: '偏好 ID' },
            userId: { type: 'string', description: '用户 ID' },
            channelId: { type: 'string', description: '渠道 ID' },
            notificationType: { type: 'string', description: '通知类型' },
            isEnabled: { type: 'boolean', description: '是否启用' },
            quietStart: { type: 'string', description: '免打扰开始时间 HH:mm', nullable: true },
            quietEnd: { type: 'string', description: '免打扰结束时间 HH:mm', nullable: true },
            createdAt: { type: 'string', format: 'date-time', description: '创建时间' },
            updatedAt: { type: 'string', format: 'date-time', description: '更新时间' },
          },
        },
        StatisticsSummary: {
          type: 'object',
          properties: {
            total: { type: 'integer', description: '总发送量' },
            success: { type: 'integer', description: '成功数量' },
            failed: { type: 'integer', description: '失败数量' },
            pending: { type: 'integer', description: '待发送数量' },
            successRate: { type: 'number', description: '成功率' },
            avgDelayMs: { type: 'number', description: '平均延迟（毫秒）' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/**/*.ts', './src/controllers/**/*.ts'],
};

export const swaggerSpec = swaggerJSDoc(options);

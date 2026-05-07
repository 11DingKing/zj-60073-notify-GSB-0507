import { Request, Response, NextFunction } from 'express';
import { ChannelType, MessageStatus, RetryStrategy } from '@prisma/client';
import { messageService } from '../services/messageService';
import { AppError } from '../middleware/errorHandler';

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: 消息发送与记录
 */

/**
 * @swagger
 * /api/messages/send:
 *   post:
 *     summary: 发送单条消息
 *     tags: [Messages]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipient
 *               - variables
 *             properties:
 *               templateCode:
 *                 type: string
 *                 description: 模板代码（与 channelType + content 二选一）
 *               channelType:
 *                 $ref: '#/components/schemas/ChannelType'
 *                 description: 渠道类型（与 templateCode 二选一，需要配合 content）
 *               recipient:
 *                 type: string
 *                 description: 接收人（邮箱/手机号等）
 *               recipientId:
 *                 type: string
 *                 description: 接收人用户 ID（用于站内信等）
 *               subject:
 *                 type: string
 *                 description: 消息主题（不使用模板时需要）
 *               content:
 *                 type: string
 *                 description: 消息内容（不使用模板时需要）
 *               variables:
 *                 type: object
 *                 description: 模板变量数据
 *               priority:
 *                 type: integer
 *                 default: 0
 *                 description: 优先级（数字越大优先级越高）
 *               maxRetryCount:
 *                 type: integer
 *                 default: 3
 *                 description: 最大重试次数
 *               retryStrategy:
 *                 $ref: '#/components/schemas/RetryStrategy'
 *               retryInterval:
 *                 type: integer
 *                 default: 5000
 *                 description: 重试间隔（毫秒）
 *     responses:
 *       200:
 *         description: 消息发送成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Message'
 */
export const sendSingle = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      templateCode,
      channelType,
      recipient,
      recipientId,
      subject,
      content,
      variables,
      priority,
      maxRetryCount,
      retryStrategy,
      retryInterval,
    } = req.body;

    if (!recipient) {
      throw new AppError('缺少必要参数: recipient', 400);
    }

    const messages = await messageService.sendSingle({
      templateCode,
      channelType: channelType as ChannelType | undefined,
      recipient,
      recipientId,
      subject,
      content,
      variables: variables || {},
      priority,
      maxRetryCount,
      retryStrategy: retryStrategy as RetryStrategy | undefined,
      retryInterval,
    });

    res.json({ data: messages });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/messages/send-batch:
 *   post:
 *     summary: 批量发送消息
 *     tags: [Messages]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipients
 *               - variables
 *             properties:
 *               templateCode:
 *                 type: string
 *                 description: 模板代码
 *               channelType:
 *                 $ref: '#/components/schemas/ChannelType'
 *               recipients:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - recipient
 *                   properties:
 *                     recipient:
 *                       type: string
 *                       description: 接收人
 *                     recipientId:
 *                       type: string
 *                       description: 接收人用户 ID
 *                     variables:
 *                       type: object
 *                       description: 该接收人的特定变量
 *               subject:
 *                 type: string
 *               content:
 *                 type: string
 *               variables:
 *                 type: object
 *                 description: 公共变量数据
 *               priority:
 *                 type: integer
 *               maxRetryCount:
 *                 type: integer
 *               retryStrategy:
 *                 $ref: '#/components/schemas/RetryStrategy'
 *               retryInterval:
 *                 type: integer
 *     responses:
 *       200:
 *         description: 批量发送结果
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       recipient:
 *                         type: string
 *                       success:
 *                         type: boolean
 *                       messages:
 *                         type: array
 *                         items:
 *                           type: string
 *                       error:
 *                         type: string
 */
export const sendBatch = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      templateCode,
      channelType,
      recipients,
      subject,
      content,
      variables,
      priority,
      maxRetryCount,
      retryStrategy,
      retryInterval,
    } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      throw new AppError('缺少必要参数: recipients（非空数组）', 400);
    }

    const results = await messageService.sendBatch({
      templateCode,
      channelType: channelType as ChannelType | undefined,
      recipients,
      subject,
      content,
      variables: variables || {},
      priority,
      maxRetryCount,
      retryStrategy: retryStrategy as RetryStrategy | undefined,
      retryInterval,
    });

    res.json({ data: results });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/messages:
 *   get:
 *     summary: 获取消息记录列表
 *     tags: [Messages]
 *     parameters:
 *       - in: query
 *         name: recipient
 *         schema:
 *           type: string
 *         description: 接收人过滤
 *       - in: query
 *         name: recipientId
 *         schema:
 *           type: string
 *         description: 接收人用户 ID 过滤
 *       - in: query
 *         name: channelId
 *         schema:
 *           type: string
 *         description: 渠道 ID 过滤
 *       - in: query
 *         name: templateId
 *         schema:
 *           type: string
 *         description: 模板 ID 过滤
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, SENDING, SUCCESS, FAILED, RETRY]
 *         description: 状态过滤
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 开始日期
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 结束日期
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: 消息记录列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Message'
 *                 pagination:
 *                   type: object
 */
export const listMessages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      recipient,
      recipientId,
      channelId,
      templateId,
      status,
      startDate,
      endDate,
      page,
      pageSize,
    } = req.query;

    const result = await messageService.listMessages({
      recipient: recipient as string | undefined,
      recipientId: recipientId as string | undefined,
      channelId: channelId as string | undefined,
      templateId: templateId as string | undefined,
      status: status as MessageStatus | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/messages/{id}:
 *   get:
 *     summary: 获取消息详情
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 消息 ID
 *     responses:
 *       200:
 *         description: 消息详情
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Message'
 *       404:
 *         description: 消息不存在
 */
export const getMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const message = await messageService.getMessage(id);
    res.json({ data: message });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/messages/{id}/retry:
 *   post:
 *     summary: 重试发送失败的消息
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 消息 ID
 *     responses:
 *       200:
 *         description: 重试成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Message'
 */
export const retryMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const message = await messageService.retryMessage(id);
    res.json({ data: message });
  } catch (error) {
    next(error);
  }
};

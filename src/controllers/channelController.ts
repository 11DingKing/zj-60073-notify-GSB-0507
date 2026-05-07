import { Request, Response, NextFunction } from 'express';
import { ChannelType, ProviderType } from '@prisma/client';
import { channelService } from '../services/channelService';
import { AppError } from '../middleware/errorHandler';

/**
 * @swagger
 * tags:
 *   name: Channels
 *   description: 通知渠道管理
 */

/**
 * @swagger
 * /api/channels:
 *   get:
 *     summary: 获取渠道列表
 *     tags: [Channels]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [EMAIL, SMS, IN_APP, WEBSOCKET]
 *         description: 渠道类型过滤
 *       - in: query
 *         name: isEnabled
 *         schema:
 *           type: boolean
 *         description: 是否启用过滤
 *     responses:
 *       200:
 *         description: 渠道列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Channel'
 */
export const listChannels = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { type, isEnabled } = req.query;
    const channels = await channelService.listChannels(
      type as ChannelType | undefined,
      isEnabled !== undefined ? isEnabled === 'true' : undefined
    );
    res.json({ data: channels });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/channels/{id}:
 *   get:
 *     summary: 获取渠道详情
 *     tags: [Channels]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 渠道 ID
 *     responses:
 *       200:
 *         description: 渠道详情
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Channel'
 *       404:
 *         description: 渠道不存在
 */
export const getChannel = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const channel = await channelService.getChannel(id);
    res.json({ data: channel });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/channels:
 *   post:
 *     summary: 创建渠道
 *     tags: [Channels]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - name
 *               - config
 *             properties:
 *               type:
 *                 $ref: '#/components/schemas/ChannelType'
 *               name:
 *                 type: string
 *                 description: 渠道名称
 *               description:
 *                 type: string
 *                 description: 渠道描述
 *               config:
 *                 type: object
 *                 description: 渠道配置
 *     responses:
 *       201:
 *         description: 渠道创建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Channel'
 */
export const createChannel = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { type, name, description, config } = req.body;

    if (!type || !name || !config) {
      throw new AppError('缺少必要参数: type, name, config', 400);
    }

    const channel = await channelService.createChannel({
      type,
      name,
      description,
      config,
    });

    res.status(201).json({ data: channel });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/channels/{id}:
 *   put:
 *     summary: 更新渠道
 *     tags: [Channels]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 渠道 ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               isEnabled:
 *                 type: boolean
 *               config:
 *                 type: object
 *     responses:
 *       200:
 *         description: 渠道更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Channel'
 */
export const updateChannel = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name, description, isEnabled, config } = req.body;

    const channel = await channelService.updateChannel(id, {
      name,
      description,
      isEnabled,
      config,
    });

    res.json({ data: channel });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/channels/{id}:
 *   delete:
 *     summary: 删除渠道（软删除）
 *     tags: [Channels]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 渠道 ID
 *     responses:
 *       200:
 *         description: 渠道删除成功
 */
export const deleteChannel = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    await channelService.deleteChannel(id);
    res.json({ message: '渠道已删除' });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/channels/{channelId}/providers:
 *   get:
 *     summary: 获取渠道的供应商列表
 *     tags: [Channels]
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *         description: 渠道 ID
 *     responses:
 *       200:
 *         description: 供应商列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ChannelProvider'
 */
export const listProviders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { channelId } = req.params;
    const providers = await channelService.getEnabledProviders(channelId);
    res.json({ data: providers });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/channels/{channelId}/providers:
 *   post:
 *     summary: 为渠道添加供应商
 *     tags: [Channels]
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *         description: 渠道 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - name
 *               - config
 *             properties:
 *               type:
 *                 $ref: '#/components/schemas/ProviderType'
 *               name:
 *                 type: string
 *                 description: 供应商名称
 *               description:
 *                 type: string
 *                 description: 供应商描述
 *               config:
 *                 type: object
 *                 description: 供应商配置
 *               priority:
 *                 type: integer
 *                 description: 优先级（数字越大优先级越高）
 *     responses:
 *       201:
 *         description: 供应商创建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChannelProvider'
 */
export const createProvider = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { channelId } = req.params;
    const { type, name, description, config, priority } = req.body;

    if (!type || !name || !config) {
      throw new AppError('缺少必要参数: type, name, config', 400);
    }

    const provider = await channelService.createProvider({
      channelId,
      type,
      name,
      description,
      config,
      priority,
    });

    res.status(201).json({ data: provider });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/providers/{id}:
 *   put:
 *     summary: 更新供应商
 *     tags: [Channels]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 供应商 ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               isEnabled:
 *                 type: boolean
 *               config:
 *                 type: object
 *               priority:
 *                 type: integer
 *     responses:
 *       200:
 *         description: 供应商更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChannelProvider'
 */
export const updateProvider = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name, description, isEnabled, config, priority } = req.body;

    const provider = await channelService.updateProvider(id, {
      name,
      description,
      isEnabled,
      config,
      priority,
    });

    res.json({ data: provider });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/providers/{id}:
 *   delete:
 *     summary: 删除供应商
 *     tags: [Channels]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 供应商 ID
 *     responses:
 *       200:
 *         description: 供应商删除成功
 */
export const deleteProvider = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    await channelService.deleteProvider(id);
    res.json({ message: '供应商已删除' });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/providers:
 *   get:
 *     summary: 获取所有供应商列表
 *     tags: [Channels]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [SMTP, SENDGRID, ALIYUN_SMS, TENCENT_SMS, INTERNAL]
 *         description: 供应商类型过滤
 *       - in: query
 *         name: isEnabled
 *         schema:
 *           type: boolean
 *         description: 是否启用过滤
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 每页数量
 *     responses:
 *       200:
 *         description: 供应商列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ChannelProvider'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     pageSize:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
export const listAllProviders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { type, isEnabled, page, pageSize } = req.query;
    const result = await channelService.listAllProviders({
      type: type as any,
      isEnabled: isEnabled !== undefined ? isEnabled === 'true' : undefined,
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

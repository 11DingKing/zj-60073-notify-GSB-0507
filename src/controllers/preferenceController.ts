import { Request, Response, NextFunction } from 'express';
import { preferenceService } from '../services/preferenceService';
import { AppError } from '../middleware/errorHandler';

/**
 * @swagger
 * tags:
 *   name: Preferences
 *   description: 用户消息订阅偏好管理
 */

/**
 * @swagger
 * /api/preferences/{userId}:
 *   get:
 *     summary: 获取用户的所有偏好设置
 *     tags: [Preferences]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户 ID
 *     responses:
 *       200:
 *         description: 偏好设置列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserPreference'
 */
export const getPreferences = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const preferences = await preferenceService.getPreferences(userId);
    res.json({ data: preferences });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/preferences/{userId}:
 *   post:
 *     summary: 设置用户偏好（单个或批量）
 *     tags: [Preferences]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 required:
 *                   - channelId
 *                   - notificationType
 *                 properties:
 *                   channelId:
 *                     type: string
 *                     description: 渠道 ID
 *                   notificationType:
 *                     type: string
 *                     description: 通知类型
 *                   isEnabled:
 *                     type: boolean
 *                     description: 是否启用该渠道
 *                   quietStart:
 *                     type: string
 *                     description: 免打扰开始时间 HH:mm
 *                   quietEnd:
 *                     type: string
 *                     description: 免打扰结束时间 HH:mm
 *               - type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - channelId
 *                     - notificationType
 *                   properties:
 *                     channelId:
 *                       type: string
 *                     notificationType:
 *                       type: string
 *                     isEnabled:
 *                       type: boolean
 *                     quietStart:
 *                       type: string
 *                     quietEnd:
 *                       type: string
 *     responses:
 *       200:
 *         description: 设置成功
 */
export const setPreferences = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const body = req.body;

    if (Array.isArray(body)) {
      const results = await preferenceService.batchSetPreferences(userId, body);
      res.json({ data: results });
    } else {
      const { channelId, notificationType, isEnabled, quietStart, quietEnd } = body;

      if (!channelId || !notificationType) {
        throw new AppError('缺少必要参数: channelId, notificationType', 400);
      }

      const preference = await preferenceService.setPreference({
        userId,
        channelId,
        notificationType,
        isEnabled,
        quietStart,
        quietEnd,
      });

      res.json({ data: preference });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/preferences/{userId}/{channelId}/{notificationType}:
 *   get:
 *     summary: 获取用户特定的偏好设置
 *     tags: [Preferences]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户 ID
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *         description: 渠道 ID
 *       - in: path
 *         name: notificationType
 *         required: true
 *         schema:
 *           type: string
 *         description: 通知类型
 *     responses:
 *       200:
 *         description: 偏好设置
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/UserPreference'
 */
export const getPreference = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, channelId, notificationType } = req.params;
    const preference = await preferenceService.getPreference(userId, channelId, notificationType);
    res.json({ data: preference || null });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/preferences/{userId}/{channelId}/{notificationType}:
 *   delete:
 *     summary: 删除用户特定的偏好设置
 *     tags: [Preferences]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户 ID
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *         description: 渠道 ID
 *       - in: path
 *         name: notificationType
 *         required: true
 *         schema:
 *           type: string
 *         description: 通知类型
 *     responses:
 *       200:
 *         description: 删除成功
 */
export const deletePreference = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, channelId, notificationType } = req.params;
    await preferenceService.deletePreference(userId, channelId, notificationType);
    res.json({ message: '偏好设置已删除' });
  } catch (error) {
    next(error);
  }
};

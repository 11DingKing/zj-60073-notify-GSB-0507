import { Request, Response, NextFunction } from 'express';
import { inAppService } from '../services/inAppService';
import { AppError } from '../middleware/errorHandler';

/**
 * @swagger
 * tags:
 *   name: InApp
 *   description: 站内信管理
 */

/**
 * @swagger
 * /api/inapp/{userId}:
 *   get:
 *     summary: 获取用户的站内信列表
 *     tags: [InApp]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户 ID
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *         description: 是否已读过滤
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
 *         description: 站内信列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/InAppMessage'
 *                 pagination:
 *                   type: object
 */
export const getMessages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const { isRead, page, pageSize } = req.query;

    const result = await inAppService.getMessages(userId, {
      isRead: isRead !== undefined ? isRead === 'true' : undefined,
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
 * /api/inapp/{userId}/unread-count:
 *   get:
 *     summary: 获取用户未读站内信数量
 *     tags: [InApp]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户 ID
 *     responses:
 *       200:
 *         description: 未读数量
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 */
export const getUnreadCount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const count = await inAppService.getUnreadCount(userId);
    res.json({ data: { count } });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/inapp/{userId}/{messageId}:
 *   get:
 *     summary: 获取站内信详情（自动标记已读）
 *     tags: [InApp]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户 ID
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: 站内信 ID
 *     responses:
 *       200:
 *         description: 站内信详情
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/InAppMessage'
 */
export const getMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, messageId } = req.params;
    const message = await inAppService.getMessage(userId, messageId);
    res.json({ data: message });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/inapp/{userId}/{messageId}/read:
 *   post:
 *     summary: 标记站内信为已读
 *     tags: [InApp]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户 ID
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: 站内信 ID
 *     responses:
 *       200:
 *         description: 标记成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/InAppMessage'
 */
export const markAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, messageId } = req.params;
    const message = await inAppService.markAsRead(userId, messageId);
    res.json({ data: message });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/inapp/{userId}/read-all:
 *   post:
 *     summary: 标记所有站内信为已读
 *     tags: [InApp]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户 ID
 *     responses:
 *       200:
 *         description: 标记成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     updatedCount:
 *                       type: integer
 */
export const markAllAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const result = await inAppService.markAllAsRead(userId);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
};

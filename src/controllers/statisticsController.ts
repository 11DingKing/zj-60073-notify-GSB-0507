import { Request, Response, NextFunction } from 'express';
import { statisticsService } from '../services/statisticsService';
import { AppError } from '../middleware/errorHandler';

/**
 * @swagger
 * tags:
 *   name: Statistics
 *   description: 统计分析
 */

/**
 * @swagger
 * /api/statistics/overall:
 *   get:
 *     summary: 获取整体统计数据
 *     tags: [Statistics]
 *     parameters:
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
 *     responses:
 *       200:
 *         description: 整体统计数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/StatisticsSummary'
 */
export const getOverallStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { startDate, endDate } = req.query;

    const timeRange: { start?: Date; end?: Date } = {};
    if (startDate) timeRange.start = new Date(startDate as string);
    if (endDate) timeRange.end = new Date(endDate as string);

    const stats = await statisticsService.getOverallStats(
      Object.keys(timeRange).length > 0 ? timeRange : undefined
    );

    res.json({ data: stats });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/statistics/by-channel:
 *   get:
 *     summary: 按渠道统计
 *     tags: [Statistics]
 *     parameters:
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
 *     responses:
 *       200:
 *         description: 按渠道统计数据
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
 *                       channelId:
 *                         type: string
 *                       channelType:
 *                         type: string
 *                       channelName:
 *                         type: string
 *                       total:
 *                         type: integer
 *                       success:
 *                         type: integer
 *                       failed:
 *                         type: integer
 *                       pending:
 *                         type: integer
 *                       successRate:
 *                         type: number
 *                       avgDelayMs:
 *                         type: number
 */
export const getStatsByChannel = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { startDate, endDate } = req.query;

    const timeRange: { start?: Date; end?: Date } = {};
    if (startDate) timeRange.start = new Date(startDate as string);
    if (endDate) timeRange.end = new Date(endDate as string);

    const stats = await statisticsService.getStatsByChannel(
      Object.keys(timeRange).length > 0 ? timeRange : undefined
    );

    res.json({ data: stats });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/statistics/by-template:
 *   get:
 *     summary: 按模板统计
 *     tags: [Statistics]
 *     parameters:
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
 *     responses:
 *       200:
 *         description: 按模板统计数据
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
 *                       templateId:
 *                         type: string
 *                       templateCode:
 *                         type: string
 *                       templateName:
 *                         type: string
 *                       total:
 *                         type: integer
 *                       success:
 *                         type: integer
 *                       failed:
 *                         type: integer
 *                       pending:
 *                         type: integer
 *                       successRate:
 *                         type: number
 *                       avgDelayMs:
 *                         type: number
 */
export const getStatsByTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { startDate, endDate } = req.query;

    const timeRange: { start?: Date; end?: Date } = {};
    if (startDate) timeRange.start = new Date(startDate as string);
    if (endDate) timeRange.end = new Date(endDate as string);

    const stats = await statisticsService.getStatsByTemplate(
      Object.keys(timeRange).length > 0 ? timeRange : undefined
    );

    res.json({ data: stats });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/statistics/by-time:
 *   get:
 *     summary: 按时间维度统计
 *     tags: [Statistics]
 *     parameters:
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
 *         name: granularity
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month]
 *           default: day
 *         description: 时间粒度
 *     responses:
 *       200:
 *         description: 按时间统计数据
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
 *                       time:
 *                         type: string
 *                       total:
 *                         type: integer
 *                       success:
 *                         type: integer
 *                       failed:
 *                         type: integer
 *                       pending:
 *                         type: integer
 *                       successRate:
 *                         type: number
 *                       avgDelayMs:
 *                         type: number
 */
export const getStatsByTime = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { startDate, endDate, granularity } = req.query;

    const timeRange: { start?: Date; end?: Date } = {};
    if (startDate) timeRange.start = new Date(startDate as string);
    if (endDate) timeRange.end = new Date(endDate as string);

    const validGranularities = ['hour', 'day', 'week', 'month'];
    const granularityValue = (granularity as string) || 'day';

    if (!validGranularities.includes(granularityValue)) {
      throw new AppError('无效的时间粒度，支持: hour, day, week, month', 400);
    }

    const stats = await statisticsService.getStatsByTime(
      Object.keys(timeRange).length > 0 ? timeRange : undefined,
      granularityValue as any
    );

    res.json({ data: stats });
  } catch (error) {
    next(error);
  }
};

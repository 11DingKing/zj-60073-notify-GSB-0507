import { Request, Response, NextFunction } from 'express';
import { templateService } from '../services/templateService';
import { AppError } from '../middleware/errorHandler';
import prisma from '../lib/prisma';

/**
 * @swagger
 * tags:
 *   name: Templates
 *   description: 消息模板管理
 */

/**
 * @swagger
 * /api/templates:
 *   get:
 *     summary: 获取模板列表
 *     tags: [Templates]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: 模板类型过滤
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
 *         description: 模板列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Template'
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
export const listTemplates = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { type, isEnabled, page, pageSize } = req.query;
    const result = await templateService.listTemplates({
      type: type as string | undefined,
      isEnabled: isEnabled !== undefined ? isEnabled === 'true' : undefined,
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
 * /api/templates/{id}:
 *   get:
 *     summary: 获取模板详情
 *     tags: [Templates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 模板 ID
 *     responses:
 *       200:
 *         description: 模板详情
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Template'
 *       404:
 *         description: 模板不存在
 */
export const getTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const template = await prisma.template.findUnique({
      where: { id },
      include: {
        channels: { include: { channel: true } },
        versions: true,
      },
    });

    if (!template) {
      throw new AppError('模板不存在', 404);
    }

    res.json({ data: template });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/templates/code/{code}:
 *   get:
 *     summary: 通过代码获取模板
 *     tags: [Templates]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: 模板代码
 *     responses:
 *       200:
 *         description: 模板详情
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Template'
 *       404:
 *         description: 模板不存在
 */
export const getTemplateByCode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code } = req.params;
    const template = await templateService.getTemplateByCode(code);
    res.json({ data: template });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/templates:
 *   post:
 *     summary: 创建模板
 *     tags: [Templates]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *               - type
 *               - content
 *               - channelIds
 *             properties:
 *               code:
 *                 type: string
 *                 description: 模板代码（唯一标识）
 *               name:
 *                 type: string
 *                 description: 模板名称
 *               description:
 *                 type: string
 *                 description: 模板描述
 *               type:
 *                 type: string
 *                 description: 模板类型
 *               subject:
 *                 type: string
 *                 description: 消息主题（支持 {{variable}} 变量）
 *               content:
 *                 type: string
 *                 description: 消息内容（支持 {{variable}} 变量占位符）
 *               channelIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 绑定的渠道 ID 列表
 *     responses:
 *       201:
 *         description: 模板创建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Template'
 */
export const createTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code, name, description, type, subject, content, channelIds } = req.body;

    if (!code || !name || !type || !content || !channelIds) {
      throw new AppError('缺少必要参数: code, name, type, content, channelIds', 400);
    }

    const template = await templateService.createTemplate({
      code,
      name,
      description,
      type,
      subject,
      content,
      channelIds,
    });

    res.status(201).json({ data: template });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/templates/{id}:
 *   put:
 *     summary: 更新模板
 *     tags: [Templates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 模板 ID
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
 *               subject:
 *                 type: string
 *               content:
 *                 type: string
 *               isEnabled:
 *                 type: boolean
 *               channelIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: 模板更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Template'
 */
export const updateTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name, description, subject, content, isEnabled, channelIds } = req.body;

    const template = await templateService.updateTemplate(id, {
      name,
      description,
      subject,
      content,
      isEnabled,
      channelIds,
    });

    res.json({ data: template });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/templates/{id}:
 *   delete:
 *     summary: 删除模板（软删除）
 *     tags: [Templates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 模板 ID
 *     responses:
 *       200:
 *         description: 模板删除成功
 */
export const deleteTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    await templateService.deleteTemplate(id);
    res.json({ message: '模板已删除' });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/templates/render:
 *   post:
 *     summary: 渲染模板（测试用）
 *     tags: [Templates]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - variables
 *             properties:
 *               content:
 *                 type: string
 *                 description: 模板内容
 *               variables:
 *                 type: object
 *                 description: 变量数据
 *     responses:
 *       200:
 *         description: 渲染结果
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 rendered:
 *                   type: string
 */
export const renderTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { content, variables } = req.body;
    const rendered = templateService.renderTemplate(content, variables || {});
    res.json({ rendered });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/templates/{id}/versions:
 *   get:
 *     summary: 获取模板历史版本列表
 *     tags: [Templates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 模板 ID
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
 *         description: 模板历史版本列表
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
 *                       id:
 *                         type: string
 *                       templateId:
 *                         type: string
 *                       version:
 *                         type: string
 *                       subject:
 *                         type: string
 *                       content:
 *                         type: string
 *                       variables:
 *                         type: array
 *                         items:
 *                           type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
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
 *       404:
 *         description: 模板不存在
 */
export const getTemplateVersions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { page, pageSize } = req.query;

    const result = await templateService.getTemplateVersions(id, {
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

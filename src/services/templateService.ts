import prisma from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export class TemplateService {
  private resolvePath(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current !== undefined && current !== null ? current[key] : undefined;
    }, obj as any);
  }

  renderTemplate(content: string, variables: Record<string, any>): string {
    return content.replace(/\{\{([\w.]+)\}\}/g, (_, key) => {
      const value = this.resolvePath(variables, key);
      return value !== undefined ? String(value) : `{{${key}}}`;
    });
  }

  extractVariables(content: string): string[] {
    const matches = content.match(/\{\{([\w.]+)\}\}/g);
    if (!matches) return [];
    const variables = new Set<string>();
    matches.forEach((match) => {
      const varName = match.slice(2, -2);
      variables.add(varName);
    });
    return Array.from(variables);
  }

  async getTemplateByCode(code: string) {
    const template = await prisma.template.findUnique({
      where: { code },
      include: {
        channels: {
          include: {
            channel: true,
          },
        },
        versions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!template) {
      throw new AppError(`模板不存在: ${code}`, 404);
    }

    return template;
  }

  async createTemplate(data: {
    code: string;
    name: string;
    description?: string;
    type: string;
    subject?: string;
    content: string;
    channelIds: string[];
  }) {
    const existing = await prisma.template.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new AppError(`模板代码已存在: ${data.code}`, 400);
    }

    const variables = this.extractVariables(data.content);

    const template = await prisma.template.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        type: data.type,
        subject: data.subject,
        content: data.content,
        variables,
        channels: {
          create: data.channelIds.map((channelId) => ({
            channelId,
          })),
        },
        versions: {
          create: {
            version: '1.0.0',
            subject: data.subject,
            content: data.content,
            variables,
          },
        },
      },
      include: {
        channels: {
          include: { channel: true },
        },
        versions: true,
      },
    });

    return template;
  }

  async updateTemplate(
    id: string,
    data: {
      name?: string;
      description?: string;
      subject?: string;
      content?: string;
      isEnabled?: boolean;
      channelIds?: string[];
    }
  ) {
    const template = await prisma.template.findUnique({
      where: { id },
      include: {
        channels: true,
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!template) {
      throw new AppError('模板不存在', 404);
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isEnabled !== undefined) updateData.isEnabled = data.isEnabled;

    let newVersionNeeded = false;
    if (data.content !== undefined) {
      updateData.content = data.content;
      updateData.variables = this.extractVariables(data.content);
      newVersionNeeded = true;
    }
    if (data.subject !== undefined) {
      updateData.subject = data.subject;
      newVersionNeeded = true;
    }

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.template.update({
        where: { id },
        data: updateData,
      });

      if (newVersionNeeded) {
        const lastVersion = template.versions?.[0];
        const versionParts = (lastVersion?.version || '1.0.0').split('.');
        versionParts[2] = String(parseInt(versionParts[2] || '0') + 1);
        const newVersion = versionParts.join('.');

        await tx.templateVersion.create({
          data: {
            templateId: id,
            version: newVersion,
            subject: data.subject || template.subject,
            content: data.content || template.content,
            variables: updateData.variables || template.variables,
          },
        });
      }

      if (data.channelIds) {
        const currentChannelIds = template.channels.map((c) => c.channelId);
        const toRemove = currentChannelIds.filter((cid) => !data.channelIds!.includes(cid));
        const toAdd = data.channelIds.filter((cid) => !currentChannelIds.includes(cid));

        if (toRemove.length > 0) {
          await tx.templateChannel.deleteMany({
            where: {
              templateId: id,
              channelId: { in: toRemove },
            },
          });
        }

        if (toAdd.length > 0) {
          await tx.templateChannel.createMany({
            data: toAdd.map((channelId) => ({
              templateId: id,
              channelId,
            })),
          });
        }
      }

      return tx.template.findUnique({
        where: { id },
        include: {
          channels: { include: { channel: true } },
          versions: true,
        },
      });
    });
  }

  async listTemplates(params: {
    type?: string;
    isEnabled?: boolean;
    page?: number;
    pageSize?: number;
  }) {
    const { type, isEnabled, page = 1, pageSize = 20 } = params;

    const where: any = {};
    if (type) where.type = type;
    if (isEnabled !== undefined) where.isEnabled = isEnabled;

    const [total, templates] = await Promise.all([
      prisma.template.count({ where }),
      prisma.template.findMany({
        where,
        include: {
          channels: {
            include: { channel: true },
          },
          _count: {
            select: { versions: true, messages: true },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data: templates,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async deleteTemplate(id: string) {
    const template = await prisma.template.findUnique({
      where: { id },
    });

    if (!template) {
      throw new AppError('模板不存在', 404);
    }

    return prisma.template.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getTemplateVersions(templateId: string, params: { page?: number; pageSize?: number } = {}) {
    const { page = 1, pageSize = 20 } = params;

    const template = await prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new AppError('模板不存在', 404);
    }

    const [total, versions] = await Promise.all([
      prisma.templateVersion.count({
        where: { templateId },
      }),
      prisma.templateVersion.findMany({
        where: { templateId },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data: versions,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }
}

export const templateService = new TemplateService();

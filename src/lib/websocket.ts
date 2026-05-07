import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import prisma from './prisma';

interface ConnectedUser {
  userId: string;
  ws: WebSocket;
  connectedAt: Date;
}

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private users: Map<string, Set<WebSocket>> = new Map();
  private connections: Map<WebSocket, string> = new Map();

  init(server: any) {
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      this.handleConnection(ws, req);
    });

    console.log('WebSocket 服务已启动');
  }

  private handleConnection(ws: WebSocket, req: IncomingMessage) {
    const url = new URL(req.url || '', `http://localhost`);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      ws.close(1008, '缺少 userId 参数');
      return;
    }

    if (!this.users.has(userId)) {
      this.users.set(userId, new Set());
    }
    this.users.get(userId)!.add(ws);
    this.connections.set(ws, userId);

    console.log(`用户 ${userId} 已连接 WebSocket`);

    this.sendUnreadCount(userId);

    ws.on('message', (data: Buffer) => {
      this.handleMessage(ws, userId, data);
    });

    ws.on('close', () => {
      this.handleDisconnect(ws, userId);
    });

    ws.on('error', (error) => {
      console.error(`WebSocket 错误 (用户 ${userId}):`, error);
      this.handleDisconnect(ws, userId);
    });
  }

  private async handleMessage(ws: WebSocket, userId: string, data: Buffer) {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          break;

        case 'mark_read':
          if (message.messageId) {
            await this.markAsRead(userId, message.messageId);
          }
          break;

        case 'mark_all_read':
          await this.markAllAsRead(userId);
          break;

        case 'get_unread':
          await this.sendUnreadCount(userId);
          break;

        default:
          console.log(`未知的消息类型: ${message.type}`);
      }
    } catch (error) {
      console.error('解析 WebSocket 消息失败:', error);
    }
  }

  private handleDisconnect(ws: WebSocket, userId: string) {
    const userSockets = this.users.get(userId);
    if (userSockets) {
      userSockets.delete(ws);
      if (userSockets.size === 0) {
        this.users.delete(userId);
      }
    }
    this.connections.delete(ws);
    console.log(`用户 ${userId} 已断开 WebSocket`);
  }

  async sendToUser(userId: string, data: any) {
    const userSockets = this.users.get(userId);
    if (!userSockets || userSockets.size === 0) {
      console.log(`用户 ${userId} 未连接 WebSocket`);
      return false;
    }

    const message = JSON.stringify(data);
    let sent = false;

    userSockets.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
        sent = true;
      }
    });

    return sent;
  }

  async sendInAppMessage(userId: string, inAppMessage: any) {
    return this.sendToUser(userId, {
      type: 'new_message',
      data: inAppMessage,
    });
  }

  async sendUnreadCount(userId: string) {
    const count = await prisma.inAppMessage.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return this.sendToUser(userId, {
      type: 'unread_count',
      data: { count },
    });
  }

  private async markAsRead(userId: string, messageId: string) {
    await prisma.inAppMessage.updateMany({
      where: {
        id: messageId,
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    await this.sendUnreadCount(userId);
  }

  private async markAllAsRead(userId: string) {
    await prisma.inAppMessage.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    await this.sendUnreadCount(userId);
  }

  getConnectedUsers(): string[] {
    return Array.from(this.users.keys());
  }

  isUserConnected(userId: string): boolean {
    const sockets = this.users.get(userId);
    return sockets ? sockets.size > 0 : false;
  }
}

export const wsManager = new WebSocketManager();

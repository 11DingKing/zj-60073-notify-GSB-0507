import './config/env';
import http from 'http';
import app from './app';
import { env } from './config/env';
import { wsManager } from './lib/websocket';

const server = http.createServer(app);

wsManager.init(server);

server.listen(env.PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║           多渠道消息通知中心已启动                              ║
╠══════════════════════════════════════════════════════════════╣
║  服务端口: ${String(env.PORT).padEnd(49)}║
║  环境: ${env.NODE_ENV.padEnd(52)}║
╠══════════════════════════════════════════════════════════════╣
║  API 文档: http://localhost:${String(env.PORT).padEnd(39)}║
║  健康检查: http://localhost:${String(env.PORT)}/api/health.padEnd(36)}║
╠══════════════════════════════════════════════════════════════╣
║  WebSocket 连接: ws://localhost:${String(env.PORT)}?userId=xxx.padEnd(34)}║
╚══════════════════════════════════════════════════════════════╝
  `);
});

process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的 Promise 拒绝:', reason);
});

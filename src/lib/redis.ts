import Redis from 'ioredis';
import { env } from '../config/env';

const globalForRedis = global as unknown as { redis: Redis };

export const redis =
  globalForRedis.redis ||
  new Redis(env.REDIS_URL, {
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

if (env.NODE_ENV !== 'production') globalForRedis.redis = redis;

redis.on('connect', () => {
  console.log('Redis 连接成功');
});

redis.on('error', (err) => {
  console.error('Redis 连接错误:', err);
});

export default redis;

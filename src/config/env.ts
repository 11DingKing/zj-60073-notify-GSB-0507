import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(13073),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  MAX_RETRY_COUNT: z.coerce.number().default(3),
  RETRY_STRATEGY: z.enum(['fixed', 'exponential']).default('exponential'),
  RETRY_INTERVAL: z.coerce.number().default(5000),
  RETRY_EXPONENTIAL_BASE: z.coerce.number().default(2),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('环境变量配置错误:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;

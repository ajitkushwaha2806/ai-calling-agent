import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error('REDIS_URL is not defined in environment variables');
}

const globalForRedis = globalThis;

export const redisConnection = globalForRedis.redisConnection || new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

if (process.env.NODE_ENV !== 'production') globalForRedis.redisConnection = redisConnection;

import { Queue } from 'bullmq';
import { redisConnection } from '../../lib/redis.js';

export const QUEUE_NAMES = {
  CALLS: 'calls-queue',
};
export const callsQueue = new Queue(QUEUE_NAMES.CALLS, { connection: redisConnection });

export const allQueues = [
  callsQueue,
];

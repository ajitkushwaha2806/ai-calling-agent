import { Queue } from 'bullmq';
import { redisConnection } from '../../lib/redis.js';

export const QUEUE_NAMES = {
  CALLS: 'calls-queue',
  WHATSAPP: 'whatsapp-queue',
};

export const callsQueue = new Queue(QUEUE_NAMES.CALLS, { connection: redisConnection });
export const whatsappQueue = new Queue(QUEUE_NAMES.WHATSAPP, { connection: redisConnection });

export const allQueues = [
  callsQueue,
  whatsappQueue,
];

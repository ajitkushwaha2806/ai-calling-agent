import 'dotenv/config';
import { Worker } from 'bullmq';
import { QUEUE_NAMES } from '../queues/index.js';
import { redisConnection } from '../../lib/redis.js';
import { processClickToCallJob } from '../jobs/clickToCallJob.js';

export const callsWorker = new Worker(QUEUE_NAMES.CALLS, processClickToCallJob, {
  connection: redisConnection,
  concurrency: 5
});

callsWorker.on('completed', (job) => {
  console.log(`✅ [Job:${job.id}] completed successfully`);
});

callsWorker.on('failed', (job, err) => {
  console.error(`❌ [Job:${job.id}] failed with error:`, err);
});

console.log("🚀 BullMQ Worker (callsWorker) starting...");
console.log("Listening on queue:", callsWorker.name);

process.on('SIGINT', async () => {
  console.log('Shutting down worker...');
  await callsWorker.close();
  process.exit(0);
});

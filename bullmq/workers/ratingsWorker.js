import 'dotenv/config';
import { Worker } from 'bullmq';
import { QUEUE_NAMES } from '../queues/index.js';
import { redisConnection } from '../../lib/redis.js';
import { processFetchRatingsJob } from '../jobs/fetchRatingsJob.js';

export const ratingsWorker = new Worker(QUEUE_NAMES.RATINGS, processFetchRatingsJob, {
  connection: redisConnection,
  concurrency: 3,
  limiter: {
    max: 3,
    duration: 2000
  }
});

ratingsWorker.on('completed', (job) => {
  console.log(`✅ [Job:${job.id}] completed successfully: ${JSON.stringify(job.returnvalue)}`);
});

ratingsWorker.on('failed', (job, err) => {
  console.error(`❌ [Job:${job.id}] failed with error:`, err.message);
});

console.log("🚀 BullMQ Worker (ratingsWorker) starting...");
console.log("Listening on queue:", ratingsWorker.name);

process.on('SIGINT', async () => {
  console.log('Shutting down ratings worker...');
  await ratingsWorker.close();
  process.exit(0);
});

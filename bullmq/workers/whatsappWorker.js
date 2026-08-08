import 'dotenv/config';
import { Worker } from 'bullmq';
import { QUEUE_NAMES } from '../queues/index.js';
import { redisConnection } from '../../lib/redis.js';
import { processWhatsappJob } from '../jobs/whatsappJob.js';

export const whatsappWorker = new Worker(QUEUE_NAMES.WHATSAPP, processWhatsappJob, {
  connection: redisConnection,
  concurrency: 1, 
  limiter: {
    max: 1,        
    duration: 30000 
  }
});

whatsappWorker.on('completed', (job) => {
  console.log(`✅ [Job:${job.id}] WhatsApp message sent successfully`);
});

whatsappWorker.on('failed', (job, err) => {
  console.error(`❌ [Job:${job.id}] failed to send WhatsApp message:`, err);
});

console.log("🚀 BullMQ Worker (whatsappWorker) starting...");
console.log(`Listening on queue: ${whatsappWorker.name} with rate limit: 1 job / 30s`);

process.on('SIGINT', async () => {
  console.log('Shutting down WhatsApp worker...');
  await whatsappWorker.close();
  process.exit(0);
});

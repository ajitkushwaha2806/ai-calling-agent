import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { HonoAdapter } from '@bull-board/hono';
import { serveStatic } from '@hono/node-server/serve-static';
import { allQueues } from '@/bullmq/queues';

const app = new Hono();

const serverAdapter = new HonoAdapter(serveStatic);
serverAdapter.setBasePath('/bull');

createBullBoard({
  queues: allQueues.map(queue => new BullMQAdapter(queue)),
  serverAdapter: serverAdapter,
});

app.route('/bull', serverAdapter.registerPlugin());

app.get('/test', (c) => c.text('Hello Hono!'));

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);

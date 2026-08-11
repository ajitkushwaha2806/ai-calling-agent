import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { HonoAdapter } from '@bull-board/hono';
import { serveStatic } from '@hono/node-server/serve-static';
import { allQueues } from './queues/index.js';

const app = new Hono();

const serverAdapter = new HonoAdapter(serveStatic);
serverAdapter.setBasePath('/bull');

createBullBoard({
  queues: allQueues.map(queue => new BullMQAdapter(queue)),
  serverAdapter: serverAdapter,
});

app.route('/bull', serverAdapter.registerPlugin());

app.get('/', (c) => c.redirect('/bull'));

const port = 1001;
console.log(`Bull Dashboard is running on port ${port}`);

serve({
  fetch: app.fetch,
  port
});

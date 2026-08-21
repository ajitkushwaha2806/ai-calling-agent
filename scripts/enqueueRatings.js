import 'dotenv/config';
import dbConnect from '../lib/dbConnect.js';
import ZomatoOrder from '../models/ZomatoOrder.js';
import { ratingsQueue } from '../bullmq/queues/index.js';
import mongoose from 'mongoose';

async function enqueueRatings() {
  try {
    console.log("Connecting to database...");
    await dbConnect();
    console.log("Connected.");

    console.log("Fetching all Zomato orders...");
    const orders = await ZomatoOrder.find({}).select('tab_id userId');
    
    console.log(`Found ${orders.length} orders. Enqueuing jobs...`);
    
    let count = 0;
    for (const order of orders) {
      if (order.tab_id && order.userId) {
        await ratingsQueue.add('fetch-rating', {
          tab_id: order.tab_id,
          userId: order.userId
        }, {
          jobId: `rating-${order.tab_id}`, 
          removeOnComplete: true,
          removeOnFail: false
        });
        count++;
      }
    }

    console.log(`Successfully enqueued ${count} rating fetch jobs to the queue.`);
  } catch (error) {
    console.error("Error enqueuing ratings:", error);
  } finally {
    await mongoose.connection.close();
    await ratingsQueue.close();
    process.exit(0);
  }
}

enqueueRatings();

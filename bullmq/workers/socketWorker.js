import 'dotenv/config';
import mongoose from 'mongoose';
import { zomatoSocketService } from '../../services/zomatoSocketService.js';
import dbConnect from '../../lib/dbConnect.js';
import ZomatoConfig from '../../models/ZomatoConfig.js';
import ZomatoOrder from '../../models/ZomatoOrder.js';
import ZomatoRestaurant from '../../models/ZomatoRestaurant.js';
import '../../models/CallRecord.js'; // Ensure schema is registered for populate
import { getOrderDetails, getCustomerContact } from '../../services/zomatoService.js';
import { callsQueue } from '../queues/index.js';

async function processOrderEvent(tabId, accountKey) {
  try {
    console.log(`[SocketWorker] Processing order ${tabId} for account ${accountKey}`);
    const data = await getOrderDetails({ tab_id: tabId }, accountKey);
    
    if (!data) return;

    let restaurantId = null;
    if (data?.order?.resId) {
      const resDoc = await ZomatoRestaurant.findOne({ id: Number(data.order.resId) });
      if (resDoc) restaurantId = resDoc._id;
    }

    const existingOrder = await ZomatoOrder.findOne({ tab_id: tabId.toString() });
    let customerNumber = existingOrder?.customer_number;

    if (!customerNumber && data?.order?.state && data.order.state !== "DELIVERED" && data.order.state !== "CANCELLED") {
      try {
        const number = await getCustomerContact(tabId, data.order.resId, accountKey);
        if (number) customerNumber = number;
      } catch (err) {
        console.error(`[SocketWorker] Failed to fetch customer contact for order ${tabId}:`, err);
      }
    }

    const updateData = {
      userId: accountKey,
      tab_id: tabId.toString(),
      data: data
    };

    if (restaurantId) updateData.restaurant = restaurantId;
    if (customerNumber) updateData.customer_number = customerNumber;

    const updatedOrder = await ZomatoOrder.findOneAndUpdate(
      { tab_id: tabId.toString() },
      updateData,
      { upsert: true, returnDocument: 'after' }
    ).populate("callRecords");

    if (data?.order?.state === "DISPATCHED" && customerNumber) {
      const callCount = updatedOrder.callCount || 0;
      const previousState = existingOrder?.data?.order?.state;

      if (previousState !== "DISPATCHED" && callCount === 0) {
        try {
          await callsQueue.add('click-to-call', {
            orderId: updatedOrder._id,
            tabId: tabId.toString(),
            customerNumber: customerNumber,
            customerName: data.order?.creator?.name || "Customer"
          });
          console.log(`[SocketWorker] Queued click-to-call for ${tabId}`);
        } catch (qErr) {
          console.error(`[SocketWorker] Queue error for ${tabId}:`, qErr);
        }
      }
    }
  } catch (err) {
    console.error(`[SocketWorker] Error processing order ${tabId}:`, err);
  }
}

async function startWorker() {
  console.log("Starting Zomato Socket Worker...");
  await dbConnect();
  
  const connectAccounts = async () => {
    const configs = await ZomatoConfig.find({});
    // console.log(`[SocketWorker] Health Check: Found ${configs.length} Zomato accounts.`);
    
    for (const config of configs) {
      const accountKey = config.key;
      if (accountKey) {
        const socket = zomatoSocketService.sockets.get(accountKey);
        
        // If no socket exists or it's completely disconnected, initialize it
        if (!socket || !socket.connected) {
          console.log(`[SocketWorker] Connecting / Auto-reconnecting stream for ${accountKey}`);
          try {
            await zomatoSocketService.joinStream(accountKey);
            
            // Only attach the listener if we just created the socket 
            // (EventEmitter will stack listeners if we aren't careful)
            if (!socket) {
              zomatoSocketService.emitter.removeAllListeners(`zomato_event_${accountKey}`);
              zomatoSocketService.emitter.on(`zomato_event_${accountKey}`, (eventData) => {
                const { eventName, args } = eventData;
                if ((eventName === "res_order" || eventName === "res_order_status_update") && args && args[0]) {
                  const tabId = args[0].tabId;
                  if (tabId) {
                    processOrderEvent(tabId, accountKey);
                  }
                }
              });
            }
          } catch (err) {
            console.error(`[SocketWorker] Failed to join stream for ${accountKey}:`, err.message);
          }
        }
      }
    }
  };

  // Run immediately
  await connectAccounts();

  // Run a health check every 60 seconds
  setInterval(connectAccounts, 60000);
}

startWorker().catch(err => {
  console.error("Socket Worker failed to start:", err);
  process.exit(1);
});

import dbConnect from "@/lib/dbConnect";
import { NextResponse } from "next/server";
import { redisConnection } from "@/lib/redis";
import ZomatoOrder from "@/models/ZomatoOrder";
import CallRecord from "@/models/CallRecord";
import { initiateClickToCallSupport, hangupCall, getLiveCalls, getCallRecords } from "@/services/tataService";

async function waitForHangupOrTimeout(tataRefId, tabId, destNumber, jobId) {
  return new Promise((resolve) => {
    const subscriber = redisConnection.duplicate();
    const channelTata = `call_hangup:${tataRefId}`;
    const channelTab = `call_hangup:${tabId}`;

    subscriber.subscribe(channelTata, (err) => {
      if (err) console.error(`[Job:${jobId}] Failed to subscribe to ${channelTata}:`, err);
    });

    if (tataRefId !== tabId) {
      subscriber.subscribe(channelTab, (err) => {
        if (err) console.error(`[Job:${jobId}] Failed to subscribe to ${channelTab}:`, err);
      });
    }

    let resolved = false;

    const timeout = setTimeout(async () => {
      if (resolved) return;
      resolved = true;
      console.log(`[Job:${jobId}] Call reached 90s maximum duration limit. Forcing hangup.`);

      try {
        let correctCallId = null;
        try {
          const liveCallsResp = await getLiveCalls();
          const callsList = liveCallsResp.data || liveCallsResp.data?.data || (Array.isArray(liveCallsResp) ? liveCallsResp : []);

          if (Array.isArray(callsList)) {
            const activeCall = callsList.find(c =>
              c.ref_id === tataRefId || c.ref_id === tabId ||
              (c.destination_number && c.destination_number.includes(destNumber)) ||
              (c.customer_number && c.customer_number.includes(destNumber))
            );
            if (activeCall && activeCall.call_id) {
              correctCallId = activeCall.call_id;
            }
          }
        } catch (e) {
          console.error(`[Job:${jobId}] Failed to fetch live calls for 90s timeout:`, e.message);
        }

        if (correctCallId) {
          await hangupCall({ call_id: correctCallId });
          console.log(`[Job:${jobId}] ✅ Force hung up call ${correctCallId} after 90s limit`);
        } else {
          console.log(`[Job:${jobId}] ℹ️ Call not found in live calls (likely already hung up). No action needed.`);
        }
      } catch (hangupErr) {
        console.error(`[Job:${jobId}] Error trying to auto-hangup call:`, hangupErr.message);
      }

      subscriber.unsubscribe(channelTata, channelTab);
      subscriber.quit();
      resolve();
    }, 90 * 1000);

    subscriber.on('message', (ch) => {
      if (ch === channelTata || ch === channelTab) {
        if (resolved) return;
        resolved = true;
        console.log(`[Job:${jobId}] Received hangup event on ${ch}! Proceeding.`);
        clearTimeout(timeout);
        subscriber.unsubscribe(channelTata, channelTab);
        subscriber.quit();
        resolve();
      }
    });
  });
}



export async function POST(req) {
  try {
    const jobData = await req.json();
    const { orderId, tabId, customerNumber, customerName, jobId } = jobData;

    await dbConnect();
    const order = await ZomatoOrder.findById(orderId);

    if (!order) {
      console.error(`[Job:${jobId}] Order ${orderId} not found in DB`);
      return NextResponse.json({ success: false, message: 'Order not found' });
    }

    const currentCount = order.callCount || 0;
    if (currentCount >= 2) {
      console.log(`[Job:${jobId}] Order ${tabId} already reached max call limit (2). Skipping.`);
      order.callStatus = 'MAX_RETRIES_REACHED';
      await order.save();
      return NextResponse.json({ success: true, message: 'Max retries reached' });
    }

    let destNumber = customerNumber;
    if (Array.isArray(destNumber)) {
      destNumber = destNumber[0];
    }
    if (destNumber) {
      destNumber = String(destNumber).replace(/\D/g, "");
    }
    console.log(`[Job:${jobId}] Initiating call to ${destNumber} for ${customerName} (Attempt ${currentCount + 1})`);

    order.callCount = currentCount + 1;
    order.callStatus = 'INITIATED';
    await order.save();

    const response = await initiateClickToCallSupport({
      customer_number: destNumber
    });

    const tataRefId = response?.data?.ref_id || response?.ref_id;
    console.log(`[Job:${jobId}] Call initiated successfully. Tata ref_id: ${tataRefId}. Waiting for hangup...`);

    const newRecord = await CallRecord.create({
      orderId: order._id,
      tabId: tabId,
      ref_id: tataRefId || tabId,
      call_to_number: destNumber,
      call_status: 'initiated',
      direction: 'outbound'
    });

    if (!order.callRecords) order.callRecords = [];
    order.callRecords.push(newRecord._id);
    await order.save();

    await waitForHangupOrTimeout(tataRefId, tabId, destNumber, jobId);

    return NextResponse.json({ success: true, data: response });
  } catch (err) {
    console.error(`Failed to process internal call job:`, err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

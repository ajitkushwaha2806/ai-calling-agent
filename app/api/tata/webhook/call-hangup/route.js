import { NextResponse } from "next/server";
import mongoose from "mongoose";

async function handleWebhook(body) {
  const { uuid, ref_id } = body;

  console.log("🔔 [Tata Webhook] Call Hangup Event Received:", { uuid, ref_id });

  if (ref_id) {
    const { redisConnection } = await import("@/lib/redis");
    if (redisConnection) {
      await redisConnection.publish(`call_hangup:${ref_id}`, JSON.stringify({ uuid }));
    }

    // Fetch and store the final CDR
    try {
      const dbConnect = (await import("@/lib/dbConnect")).default;
      const CallRecord = (await import("@/models/CallRecord")).default;
      const ZomatoOrder = (await import("@/models/ZomatoOrder")).default;
      const { getCallRecords } = await import("@/services/tataService");

      await dbConnect();

      await new Promise(r => setTimeout(r, 2000));

      console.log(`[Hangup Webhook] Webhook ref_id (tabId) is: ${ref_id}`);

      let trueTataRefId = ref_id.toString();
      let orderId = null;
      let order = await ZomatoOrder.findOne({ tab_id: ref_id.toString() });
      if (order) orderId = order._id;

      // Find the CallRecord created by process-call to get the true Tata UUID
      const existingRecord = await CallRecord.findOne({ tabId: ref_id.toString() }).sort({ createdAt: -1 });
      if (existingRecord) {
        if (!orderId && existingRecord.orderId) {
          orderId = existingRecord.orderId;
          order = await ZomatoOrder.findById(orderId);
        }
        // The process-call script saved the Tata UUID in the ref_id field
        if (existingRecord.ref_id && existingRecord.ref_id !== ref_id.toString()) {
          trueTataRefId = existingRecord.ref_id;
          console.log(`[Hangup Webhook] Found true Tata ref_id from DB: ${trueTataRefId}`);
        }
      }

      console.log(`[Hangup Webhook] Fetching final CDR for Tata ref_id: ${trueTataRefId}`);
      const cdrResp = await getCallRecords({ ref_id: trueTataRefId, limit: 1 });
      const records = cdrResp.data?.results || cdrResp.results || cdrResp.data || [];

      if (records.length > 0) {
        const actualCdr = records[0];

        const record = await CallRecord.findOneAndUpdate(
          { _id: existingRecord ? existingRecord._id : new mongoose.Types.ObjectId() },
          {
            $set: {
              orderId: orderId,
              tabId: ref_id.toString(),
              ref_id: trueTataRefId,
              ...actualCdr,
              uuid: actualCdr.uuid || actualCdr.call_id || uuid,
              call_status: actualCdr.status || body.call_status || "completed",
              "webhook_payload.answered_seconds": actualCdr.answered_seconds ?? actualCdr.call_duration ?? 0,
              "webhook_payload.recording_url": actualCdr.recording_url || body.recording_url,
            }
          },
          { returnDocument: 'after', upsert: true, sort: { createdAt: -1 } }
        );

        if (order && record) {
          if (!order.callRecords) order.callRecords = [];
          if (!order.callRecords.includes(record._id)) {
            order.callRecords.push(record._id);
          }

          const statusStr = (record.call_status || "").toLowerCase();
          if (statusStr === "completed" || statusStr === "answered") {
            order.callStatus = "COMPLETED";
            console.log(`[Hangup Webhook] Order ${ref_id} call marked as COMPLETED.`);
          } else {
            const count = order.callCount || 0;
            if (count < 2) {
              console.log(`[Hangup Webhook] Call unanswered/failed for order ${ref_id}. Scheduling retry in 2 mins. (Attempt ${count + 1}/2)`);
              const { callsQueue } = await import("@/bullmq/queues/index");
              await callsQueue.add("click-to-call-retry", {
                orderId: order._id,
                tabId: ref_id,
                customerNumber: record.call_to_number,
                customerName: order.data?.order?.creator?.name || "Customer"
              }, { delay: 120000 });
            } else {
              order.callStatus = "FAILED";
              console.log(`[Hangup Webhook] Call failed for order ${ref_id}. Max retries reached.`);
            }
          }
          await order.save();

          // Queue WhatsApp notification only for answered calls within 20-30 second range
          if (order.restaurant) {
            const { whatsappQueue } = await import("@/bullmq/queues/index");

            const cdrStatus = (actualCdr.status || record.call_status || "").toLowerCase();
            const answeredSeconds = actualCdr.answered_seconds || 0;
            const isAnswered = cdrStatus === "answered" && answeredSeconds > 0;

            const orderIdStr = order.data?.order?.id || order.tab_id || "Unknown";
            const customerName = order.data?.order?.creator?.name || "Customer";
            const recordingUrl = actualCdr.recording_url || body.recording_url;
            const messageText = `✅ Answered by customer - Order #${orderIdStr} (${customerName})`;

            if (isAnswered && answeredSeconds >= 20 && answeredSeconds <= 30) {
              try {
                const { getSessions, startSession } = await import("@/services/openwaService");
                const sessions = await getSessions();
                let targetSession = sessions.find(s => s.status === 'ready');

                // Fallback: If no ready session, try to start the first available session
                if (!targetSession && sessions.length > 0) {
                  targetSession = sessions[0];
                  console.log(`[Hangup Webhook] No ready OpenWA session found. Attempting to start session ${targetSession.id}...`);
                  try {
                    await startSession(targetSession.id);
                  } catch (startErr) {
                    console.error(`[Hangup Webhook] Failed to auto-start session:`, startErr.message);
                  }
                }

                if (targetSession) {
                  await whatsappQueue.add("send-call-log", {
                    type: 'call-log',
                    sessionId: targetSession.id,
                    resId: order.restaurant.toString(),
                    url: recordingUrl,
                    text: messageText,
                    isAnswered
                  }, {
                    delay: 180000, // Delay 3 minutes for Cloudphone recording
                    attempts: 3,   // Retry up to 3 times
                    backoff: {
                      type: 'fixed',
                      delay: 60000 // Wait 1 minute between retries
                    }
                  });
                  console.log(`[Hangup Webhook] Queued WhatsApp call-log for order ${orderIdStr} using session ${targetSession.id}`);
                } else {
                  console.log(`[Hangup Webhook] No OpenWA sessions available at all, skipping WhatsApp message.`);
                }
              } catch (waErr) {
                console.error(`[Hangup Webhook] Error queuing WhatsApp message:`, waErr.message);
              }
            } else {
              console.log(`[Hangup Webhook] Skipping WhatsApp message: isAnswered=${isAnswered}, duration=${answeredSeconds}s`);
            }
          }

          console.log(`[Hangup Webhook] Saved final CDR for ${ref_id}`);
        }
      } else {
        console.log(`[Hangup Webhook] No CDR found for ref_id: ${ref_id}`);
      }
    } catch (err) {
      console.error(`[Hangup Webhook] Error fetching/saving CDR for ${ref_id}:`, err.message);
    }
  }

  return NextResponse.json({ success: true });
}

export async function POST(req) {
  try {
    const body = await req.json();
    return await handleWebhook(body);
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const body = Object.fromEntries(searchParams.entries());
    return await handleWebhook(body);
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

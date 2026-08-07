import dbConnect from "@/lib/dbConnect";
import { NextResponse } from "next/server";
import CallRecord from "@/models/CallRecord";
import ZomatoOrder from "@/models/ZomatoOrder";
import { callsQueue } from "@/bullmq/queues/index";
import { hangupCall, getLiveCalls } from "@/services/tataService";

import { exec } from "child_process";
import util from "util";
import path from "path";

const execAsync = util.promisify(exec);

async function processAnsweredWebhook(body) {
  const {
    uuid,
    ref_id,
  } = body;
  const customer_number_with_prefix = body["customer_no_with_prefix "];

  console.log("🔔 [Tata Webhook] Click-to-Call Answered Event Received:", { uuid, ref_id });

  try {
    const audioPath = path.join(process.cwd(), "recording", "recording1.wav");
    let originalDevice = "";

    console.log(`🔊 Playing local audio via sox 'play' to BlackHole 2ch: ${audioPath}`);
    exec(`AUDIODRIVER=coreaudio AUDIODEV="BlackHole 2ch" /opt/homebrew/bin/play "${audioPath}"`, async (error) => {
      if (error) {
        console.error(`⚠️ Failed to play local audio: ${error.message}`);
        return;
      }

      console.log(`✅ Audio finished playing. Waiting 5 seconds before hangup...`);
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log(`Initiating Hangup for call ${uuid}`);
      try {
        let correctCallId = uuid;

        try {
          const liveCallsResp = await getLiveCalls();
          const callsList = liveCallsResp.data || liveCallsResp.data?.data || (Array.isArray(liveCallsResp) ? liveCallsResp : []);

          if (Array.isArray(callsList) && callsList.length > 0) {
            const activeCall = callsList.find(c =>
              c.uuid === uuid ||
              (c.customer_number && c.customer_number.includes(customer_number_with_prefix)) ||
              (c.destination_number && c.destination_number.includes(customer_number_with_prefix)) ||
              c.ref_id === ref_id
            );

            if (activeCall && activeCall.call_id) {
              correctCallId = activeCall.call_id;
              console.log(`🔍 Found correct call_id from live calls API: ${correctCallId}`);
            } else {
              console.log(`⚠️ Could not match this call in live calls API. Raw response snippet:`, JSON.stringify(liveCallsResp).substring(0, 500));
            }
          }
        } catch (liveCallsErr) {
          console.error(`⚠️ Failed to fetch live calls:`, liveCallsErr.message);
        }

        await hangupCall({ call_id: correctCallId });
        console.log(`☎️ Hung up call ${correctCallId}`);
      } catch (err) {
        if (err.response && err.response.status === 422) {
          console.log(`ℹ️ Call ${correctCallId || uuid} was already hung up by the user (422)`);
        } else {
          console.error(`⚠️ Failed to hang up call ${uuid}:`, err.message);
        }
      }
    });

  } catch (err) {
    console.error(`⚠️ Audio/Hangup logic failed:`, err.message);
  }

  return NextResponse.json({ success: true, message: "Webhook processed, audio played." });
}

export async function POST(req) {
  try {
    const data = await req.json()
    return await processAnsweredWebhook(data);
  } catch (err) {
    console.error("❌ [Tata Webhook] POST error:", err.message);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
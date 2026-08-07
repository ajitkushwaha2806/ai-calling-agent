import dbConnect from "@/lib/dbConnect";
import { NextResponse } from "next/server";
import CallRecord from "@/models/CallRecord";

export async function GET(req, { params }) {
  try {
    await dbConnect();
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ success: false, message: "Order ID is required" }, { status: 400 });
    }

    let calls = await CallRecord.find({ orderId: id }).sort({ createdAt: -1 }).lean();

    const { getCallRecords } = require("@/services/tataService");
    
    let updatedAny = false;
    calls = await Promise.all(calls.map(async (call) => {
      if (!call.webhook_payload?.recording_url && call.call_to_number && call.uuid) {
        try {
          const cdrResp = await getCallRecords({ destination: call.call_to_number, limit: 15 });
          const records = cdrResp.data?.results || cdrResp.results || cdrResp.data || [];
          
          const actualCdr = records.find(c => c.uuid === call.uuid);
          if (actualCdr) {
            await CallRecord.updateOne({ _id: call._id }, {
              $set: {
                "webhook_payload.answered_seconds": actualCdr.answered_seconds ?? actualCdr.call_duration ?? 0,
                "webhook_payload.recording_url": actualCdr.recording_url,
                call_status: actualCdr.status || call.call_status,
                call_id: actualCdr.call_id
              }
            });
            
            call.webhook_payload = call.webhook_payload || {};
            call.webhook_payload.answered_seconds = actualCdr.answered_seconds ?? actualCdr.call_duration ?? 0;
            call.webhook_payload.recording_url = actualCdr.recording_url;
            call.call_status = actualCdr.status || call.call_status;
            call.call_id = actualCdr.call_id;
          }
        } catch (e) {
          console.error("Failed to dynamically fetch CDR for call:", call.uuid, e.message);
        }
      }
      return call;
    }));

    return NextResponse.json({ success: true, data: calls });
  } catch (error) {
    console.error("Error fetching order calls:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch order calls", error: error.message }, { status: 500 });
  }
}

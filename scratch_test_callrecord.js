import mongoose from 'mongoose';
import 'dotenv/config';

const CallRecordSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "ZomatoOrder", required: true },
  uuid: { type: String }, 
  ref_id: { type: String },
  call_to_number: { type: String },
  caller_id_number: { type: String },
  direction: { type: String },
  call_status: { type: String },
  answered_agent_number: { type: String },
  customer_ring_time: { type: String },
  webhook_payload: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  const CallRecord = mongoose.models.CallRecord || mongoose.model("CallRecord", CallRecordSchema);
  
  const record = await CallRecord.findOne().sort({ createdAt: -1 });
  console.log(JSON.stringify(record, null, 2));
  mongoose.connection.close();
}
test();

import mongoose from "mongoose";
import dbConnect from "./lib/dbConnect.js";
import CallRecord from "./models/CallRecord.js";
import ZomatoOrder from "./models/ZomatoOrder.js";

async function analyze() {
  await dbConnect();
  const callStatuses = await CallRecord.distinct("status");
  const callCallStatuses = await CallRecord.distinct("call_status");
  const customStatuses = await CallRecord.distinct("custom_status");
  
  const orderCallStatuses = await ZomatoOrder.distinct("callStatus");
  const orderDataStatuses = await ZomatoOrder.distinct("data.status");
  const orderDataOrderStates = await ZomatoOrder.distinct("data.order_state");
  
  console.log("CallRecord status:", callStatuses);
  console.log("CallRecord call_status:", callCallStatuses);
  console.log("CallRecord custom_status:", customStatuses);
  
  console.log("ZomatoOrder callStatus:", orderCallStatuses);
  console.log("ZomatoOrder data.status:", orderDataStatuses);
  console.log("ZomatoOrder data.order_state:", orderDataOrderStates);
  
  process.exit(0);
}

analyze().catch(console.error);

import 'dotenv/config';
import mongoose from "mongoose";
import dbConnect from "./lib/dbConnect.js";
import ZomatoOrder from "./models/ZomatoOrder.js";

async function checkRatings() {
  await dbConnect();
  
  // Find an order that has some kind of rating field
  const orderWithRating = await ZomatoOrder.findOne({
    $or: [
      { "data.rating": { $exists: true } },
      { "data.order.rating": { $exists: true } },
      { "data.feedback": { $exists: true } }
    ]
  }).lean();

  if (orderWithRating) {
    console.log("Found order with rating:", JSON.stringify(orderWithRating.data.rating || orderWithRating.data.order?.rating || orderWithRating.data.feedback, null, 2));
    
    // Check where it actually is
    if (orderWithRating.data.rating) console.log("Path: data.rating");
    if (orderWithRating.data.order?.rating) console.log("Path: data.order.rating");
    if (orderWithRating.data.feedback) console.log("Path: data.feedback");
  } else {
    console.log("No orders found with ratings yet. Please wait for the worker to fetch them.");
  }
  
  process.exit(0);
}

checkRatings().catch(console.error);

import mongoose from "mongoose";

const ZomatoOrderSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  tab_id: {
    type: String,
    required: true,
    unique: true,
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ZomatoRestaurant"
  },
  customer_number: {
    type: String,
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
  },
  callCount: {
    type: Number,
    default: 0,
  },
  callRecords: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "CallRecord",
  }],
  callStatus: {
    type: String,
    enum: ["PENDING", "INITIATED", "ANSWERED", "COMPLETED", "FAILED", "MAX_RETRIES_REACHED"],
    default: "PENDING",
  }
}, { timestamps: true });

export default mongoose.models.ZomatoOrder || mongoose.model("ZomatoOrder", ZomatoOrderSchema);

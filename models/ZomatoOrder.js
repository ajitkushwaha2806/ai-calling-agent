import mongoose from "mongoose";

const ZomatoOrderSchema = new mongoose.Schema({
  tab_id: {
    type: String,
    required: true,
    unique: true,
  },
  data: {
    type: mongoose.Schema.Types.Mixed, 
  }
}, { timestamps: true });

export default mongoose.models.ZomatoOrder || mongoose.model("ZomatoOrder", ZomatoOrderSchema);

import mongoose from "mongoose";

const ZomatoConfigSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
  },
  cookie: {
    type: String,
    required: true,
  },
}, { timestamps: true });

export default mongoose.models.ZomatoConfig || mongoose.model("ZomatoConfig", ZomatoConfigSchema);

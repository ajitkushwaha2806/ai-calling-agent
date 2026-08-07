import mongoose from "mongoose";

const ZomatoConfigSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
  },
  cookie: {
    type: String,
    required: true,
  },
}, { timestamps: true });

export default mongoose.models.ZomatoConfig || mongoose.model("ZomatoConfig", ZomatoConfigSchema);

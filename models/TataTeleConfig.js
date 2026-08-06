import mongoose from "mongoose";

const TataTeleConfigSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
  },
  token: {
    type: String,
    required: true,
  },
}, { timestamps: true });

export default mongoose.models.TataTeleConfig || mongoose.model("TataTeleConfig", TataTeleConfigSchema);

import mongoose from "mongoose";

const ZomatoRestaurantSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  subzone: {
    type: String,
  },
  thumbnail: {
    type: String,
  },
  userId: {
    type: String,
  },
  whatsappChatId: {
    type: String,
    default: "",
  }
}, { timestamps: true });

export default mongoose.models.ZomatoRestaurant || mongoose.model("ZomatoRestaurant", ZomatoRestaurantSchema);

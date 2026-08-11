import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import ZomatoRestaurant from "@/models/ZomatoRestaurant";

export const DEFAULT_CHAT_ID = "120363412040816519@g.us";
// export async function getTargetChatId(identifier) {
//   if (!identifier) return DEFAULT_CHAT_ID;

//   try {
//     await dbConnect();

//     let query = {};
//     // Check if the identifier is a valid MongoDB ObjectId
//     if (mongoose.Types.ObjectId.isValid(identifier) && String(new mongoose.Types.ObjectId(identifier)) === String(identifier)) {
//       query = { _id: identifier };
//     } else {
//       query = { id: identifier };
//     }

//     const restaurant = await ZomatoRestaurant.findOne(query).lean();

//     if (restaurant && restaurant.whatsappChatId && restaurant.whatsappChatId.trim() !== "") {
//       return restaurant.whatsappChatId.trim();
//     }
//   } catch (err) {
//     console.error(`[whatsappUtils] Error fetching chat ID for ${identifier}:`, err);
//   }

//   return DEFAULT_CHAT_ID;
// }

export async function getTargetChatId(identifier) {
  console.log("identifier", identifier)
  return DEFAULT_CHAT_ID;
}
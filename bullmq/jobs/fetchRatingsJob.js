import dbConnect from "../../lib/dbConnect.js";
import ZomatoOrder from "../../models/ZomatoOrder.js";
import { getOrderDetails } from "../../services/zomatoService.js";

export const processFetchRatingsJob = async (job) => {
  const { tab_id, userId } = job.data;

  if (!tab_id || !userId) {
    throw new Error("tab_id and userId are required to fetch order details");
  }

  await dbConnect();

  try {
    const zomatoParams = { tab_id: tab_id.toString() };
    const data = await getOrderDetails(zomatoParams, userId);
    
    if (data && data.order) {
      await ZomatoOrder.updateOne(
        { tab_id: tab_id.toString() },
        { 
          $set: { 
            "data": data 
          }
        }
      );
      
      console.log(`✅ [Job:${job.id}] Successfully fetched and updated order details for tab_id ${tab_id}`);
      return { success: true, tab_id, state: data.order.state };
    } else {
      console.log(`⚠️ [Job:${job.id}] Invalid or empty data returned for tab_id ${tab_id}`);
      return { success: true, tab_id, note: "No valid order data returned" };
    }

  } catch (error) {
    const errorMsg = error.message || error.toString();
    console.error(`❌ [Job:${job.id}] Failed to fetch order details for tab_id ${tab_id}: ${errorMsg}`);
    throw new Error(`API request failed: ${errorMsg}`);
  }
};

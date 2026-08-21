import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import ZomatoOrder from "@/models/ZomatoOrder";
import ZomatoRestaurant from "@/models/ZomatoRestaurant";
import mongoose from "mongoose";

export async function GET(request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const userId = searchParams.get("userId");

    let matchQuery = {};

    if (startDateParam && endDateParam) {
      const start = new Date(`${startDateParam}T00:00:00+05:30`);
      const end = new Date(`${endDateParam}T23:59:59.999+05:30`);
      
      matchQuery.createdAt = {
        $gte: start,
        $lte: end,
      };
    }

    // Ensure models are registered
    if (!mongoose.models.ZomatoRestaurant) {
      require("@/models/ZomatoRestaurant");
    }

    const pipeline = [
      { $match: matchQuery },
      {
        $group: {
          _id: "$restaurant",
          totalCalls: { $sum: 1 },
          acceptedCalls: {
            $sum: {
              $cond: [{ $eq: ["$callStatus", "COMPLETED"] }, 1, 0]
            }
          },
          rejectedCalls: {
            $sum: {
              $cond: [
                { 
                  $in: ["$callStatus", ["FAILED", "MAX_RETRIES_REACHED"]] 
                }, 
                1, 
                0
              ]
            }
          },
          ratingsReceived: {
            $sum: {
              $cond: [
                { $ifNull: ["$data.order.rating.rating", false] },
                1,
                0
              ]
            }
          },
          rating5: { $sum: { $cond: [{ $eq: ["$data.order.rating.rating", 5] }, 1, 0] } },
          rating4: { $sum: { $cond: [{ $eq: ["$data.order.rating.rating", 4] }, 1, 0] } },
          rating3: { $sum: { $cond: [{ $eq: ["$data.order.rating.rating", 3] }, 1, 0] } },
          rating2: { $sum: { $cond: [{ $eq: ["$data.order.rating.rating", 2] }, 1, 0] } },
          rating1: { $sum: { $cond: [{ $eq: ["$data.order.rating.rating", 1] }, 1, 0] } }
        }
      },
      {
        $lookup: {
          from: "zomatorestaurants",
          localField: "_id",
          foreignField: "_id",
          as: "restaurantData"
        }
      },
      {
        $unwind: {
          path: "$restaurantData",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          restaurantName: { $ifNull: ["$restaurantData.name", "Unknown Restaurant"] },
          restaurantId: "$restaurantData.id",
          thumbnail: "$restaurantData.thumbnail",
          totalCalls: 1,
          acceptedCalls: 1,
          rejectedCalls: 1,
          ratingsReceived: 1,
          rating5: 1,
          rating4: 1,
          rating3: 1,
          rating2: 1,
          rating1: 1,
        }
      },
      { $sort: { ratingsReceived: -1 } }
    ];

    const results = await ZomatoOrder.aggregate(pipeline);

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error("Analytics API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

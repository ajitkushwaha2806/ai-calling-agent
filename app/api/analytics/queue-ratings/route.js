import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import ZomatoOrder from "@/models/ZomatoOrder";
import { ratingsQueue } from "@/bullmq/queues/index";

export async function POST(request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    if (!startDateParam || !endDateParam) {
      return NextResponse.json(
        { success: false, error: "startDate and endDate are required" },
        { status: 400 }
      );
    }

    const start = new Date(`${startDateParam}T00:00:00+05:30`);
    const end = new Date(`${endDateParam}T23:59:59.999+05:30`);

    // Fetch orders within the date range in IST
    const orders = await ZomatoOrder.find({
      createdAt: {
        $gte: start,
        $lte: end,
      }
    }).select("tab_id userId");

    let count = 0;
    for (const order of orders) {
      if (order.tab_id && order.userId) {
        await ratingsQueue.add(
          "fetch-rating",
          {
            tab_id: order.tab_id,
            userId: order.userId,
          },
          {
            jobId: `rating-${order.tab_id}`,
            removeOnComplete: true,
            removeOnFail: false,
          }
        );
        count++;
      }
    }

    return NextResponse.json({ success: true, enqueuedCount: count });
  } catch (error) {
    console.error("Queue Ratings Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to queue ratings: " + error.message },
      { status: 500 }
    );
  }
}

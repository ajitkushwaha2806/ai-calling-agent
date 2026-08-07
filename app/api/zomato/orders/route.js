import dbConnect from "@/lib/dbConnect";
import { NextResponse } from "next/server";
import ZomatoOrder from "@/models/ZomatoOrder";
import CallRecord from "@/models/CallRecord";
export async function GET(req) {
  try {
    const url = new URL(req.url);
    const accountKey = url.searchParams.get("accountKey");

    if (!accountKey) {
      return NextResponse.json({ success: false, message: "accountKey is required" }, { status: 400 });
    }

    await dbConnect();
    const orders = await ZomatoOrder.find({ userId: accountKey })
      .populate("restaurant")
      .populate("callRecords")
      .sort({ createdAt: -1 })
      .limit(100);

    return NextResponse.json({ success: true, orders });
  } catch (err) {
    console.error("Error fetching Zomato orders from DB:", err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

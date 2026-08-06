import dbConnect from "@/lib/dbConnect";
import { NextResponse } from "next/server";
import { apiClient } from "@/lib/api/client";
import ZomatoOrder from "@/models/ZomatoOrder";

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const searchParams = url.searchParams;

    const params = {};
    for (const [key, value] of searchParams.entries()) {
      params[key] = value;
    }

    if (!params.tab_id) {
      return NextResponse.json({ success: false, message: "tab_id is required" }, { status: 400 });
    }

    const { accountKey, ...zomatoParams } = params;

    if (!accountKey) {
      return NextResponse.json({ success: false, message: "accountKey is required" }, { status: 400 });
    }

    const data = await apiClient({
      baseURL: "https://www.zomato.com",
      endpoint: "/merchant-api/orders/order-details",
      method: "GET",
      params: zomatoParams,
      headers: {
        "Referer": "https://www.zomato.com/partners/onlineordering",
      },
      accountKey: accountKey,
    });

    if (data) {
      await dbConnect();
      await ZomatoOrder.findOneAndUpdate(
        { tab_id: params.tab_id.toString() },
        {
          tab_id: params.tab_id.toString(),
          data: data
        },
        { upsert: true, new: true }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Error fetching Zomato order details:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Failed to fetch order details" },
      { status: 500 }
    );
  }
}

import dbConnect from "@/lib/dbConnect";
import { NextResponse } from "next/server";
import ZomatoOrder from "@/models/ZomatoOrder";
import ZomatoRestaurant from "@/models/ZomatoRestaurant";
import CallRecord from "@/models/CallRecord";
import { getOrderDetails, getCustomerContact } from "@/services/zomatoService";

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

    const data = await getOrderDetails(zomatoParams, accountKey);

    let customerNumber = null;
    let updatedOrder = null;

    if (data) {
      await dbConnect();

      let restaurantId = null;
      if (data?.order?.resId) {
        const resDoc = await ZomatoRestaurant.findOne({ id: Number(data.order.resId) });
        if (resDoc) restaurantId = resDoc._id;
      }

      const existingOrder = await ZomatoOrder.findOne({ tab_id: params.tab_id.toString() });
      customerNumber = existingOrder?.customer_number;

      if (!customerNumber && data?.order?.state && data.order.state !== "DELIVERED" && data.order.state !== "CANCELLED") {
        try {
          const number = await getCustomerContact(params.tab_id, data.order.resId, accountKey);
          console.log("Numvberfft", number)
          if (number) {
            customerNumber = number;
          }
        } catch (err) {
          console.error(`Failed to fetch customer contact for order ${params.tab_id}:`, err);
        }
      }

      const updateData = {
        userId: accountKey,
        tab_id: params.tab_id.toString(),
        data: data
      };

      if (restaurantId) {
        updateData.restaurant = restaurantId;
      }

      if (customerNumber) {
        updateData.customer_number = customerNumber;
      }

      updatedOrder = await ZomatoOrder.findOneAndUpdate(
        { tab_id: params.tab_id.toString() },
        updateData,
        { upsert: true, returnDocument: 'after' }
      ).populate("callRecords");

      if (data?.order?.state === "DISPATCHED" && customerNumber) {
        const callCount = updatedOrder.callCount || 0;
        const previousState = existingOrder?.data?.order?.state;

        if (previousState !== "DISPATCHED" && callCount === 0) {
          try {
            const { callsQueue } = require("@/bullmq/queues");
            await callsQueue.add('click-to-call', {
              orderId: updatedOrder._id,
              tabId: params.tab_id.toString(),
              customerNumber: customerNumber,
              customerName: data.order?.creator?.name || "Customer"
            });
            console.log(`[Queue] Added click-to-call job for order ${params.tab_id}`);
          } catch (qErr) {
            console.error(`[Queue] Failed to enqueue click-to-call for ${params.tab_id}:`, qErr);
          }
        }
      }
    }

    return NextResponse.json({ success: true, data, customerNumber, callRecords: updatedOrder?.callRecords || [] });
  } catch (err) {
    console.error("Error fetching Zomato order details:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Failed to fetch order details" },
      { status: 500 }
    );
  }
}

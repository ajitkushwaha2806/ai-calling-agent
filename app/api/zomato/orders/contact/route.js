import dbConnect from "@/lib/dbConnect";
import { NextResponse } from "next/server";
import ZomatoOrder from "@/models/ZomatoOrder";
import { getCustomerContact } from "@/services/zomatoService";

export async function POST(req) {
  try {
    const { tab_id, res_id, accountKey } = await req.json();

    if (!tab_id || !res_id || !accountKey) {
      return NextResponse.json({ success: false, message: "Missing required parameters" }, { status: 400 });
    }

    const number = await getCustomerContact(tab_id, res_id, accountKey);
    console.log("number", number)

    if (number) {
      await dbConnect();
      await ZomatoOrder.findOneAndUpdate(
        { tab_id: tab_id.toString() },
        { customer_number: number },
        { new: true }
      );
      return NextResponse.json({ success: true, number });
    }

    return NextResponse.json({ success: false, message: "Phone number not available" }, { status: 404 });
  } catch (error) {
    console.error("Failed to fetch manual contact:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

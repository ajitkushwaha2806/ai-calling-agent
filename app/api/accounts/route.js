import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import ZomatoConfig from "@/models/ZomatoConfig";

export async function GET() {
  try {
    await dbConnect();
    const accounts = await ZomatoConfig.find({ key: { $ne: "ZOMATO_COOKIE" } }).lean();
    return NextResponse.json({ success: true, data: accounts });
  } catch (err) {
    console.error("Error fetching accounts:", err);
    return NextResponse.json({ success: false, message: "Failed to fetch accounts" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { name, cookie } = await req.json();
    
    if (!name || !cookie) {
      return NextResponse.json({ success: false, message: "Account name and cookie are required." }, { status: 400 });
    }

    if (name === "ZOMATO_COOKIE") {
      return NextResponse.json({ success: false, message: "Reserved account name." }, { status: 400 });
    }

    await dbConnect();
    const newAccount = await ZomatoConfig.findOneAndUpdate(
      { key: name },
      { key: name, cookie: cookie },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, data: newAccount });
  } catch (err) {
    console.error("Error saving account:", err);
    return NextResponse.json({ success: false, message: "Failed to save account" }, { status: 500 });
  }
}

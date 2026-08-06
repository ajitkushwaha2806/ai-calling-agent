import dbConnect from "@/lib/dbConnect";
import { NextResponse } from "next/server";
import ZomatoConfig from "@/models/ZomatoConfig";

export async function POST(req) {
  try {
    const { name } = await req.json();
    
    if (!name) {
      return NextResponse.json({ success: false, message: "Account name is required." }, { status: 400 });
    }

    await dbConnect();
    const account = await ZomatoConfig.findOne({ key: name });
    if (!account) {
      return NextResponse.json({ success: false, message: "Account not found." }, { status: 404 });
    }

    await ZomatoConfig.findOneAndUpdate(
      { key: "ZOMATO_COOKIE" },
      { key: "ZOMATO_COOKIE", cookie: account.cookie },
      { upsert: true }
    );

    return NextResponse.json({ success: true, message: `Successfully logged into ${name}` });
  } catch (err) {
    console.error("Error setting active account:", err);
    return NextResponse.json({ success: false, message: "Failed to activate account" }, { status: 500 });
  }
}

export async function GET() {
  try {
    await dbConnect();
    const active = await ZomatoConfig.findOne({ key: "ZOMATO_COOKIE" });
    return NextResponse.json({ success: true, isActive: !!active?.cookie });
  } catch (err) {
    console.error("Error checking active status:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

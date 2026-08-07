import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import ZomatoConfig from "@/models/ZomatoConfig";
import { apiClient } from "../../../lib/api/client";

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

    try {
      const authData = await apiClient({
        endpoint: "/restaurant-onboard-diy/check-auth",
        method: "GET",
        rawCookie: cookie,
        headers: {
          "Referer": `${process.env.ZOMATO_API_BASE_URL}/partners/onlineordering`
        }
      });

      if (!authData || !authData.loggedIn || !authData.userId) {
        return NextResponse.json({ success: false, message: "Invalid cookie or not logged in to Zomato." }, { status: 401 });
      }

      const userId = authData.userId.toString();
      const newAccount = await ZomatoConfig.findOneAndUpdate(
        { key: userId },
        { key: userId, name: name, cookie: cookie },
        { upsert: true, new: true }
      );

      return NextResponse.json({ success: true, data: newAccount });
    } catch (err) {
      console.error("Zomato Auth Error:", err.message);
      return NextResponse.json({ success: false, message: "Failed to authenticate cookie with Zomato" }, { status: 401 });
    }
  } catch (err) {
    console.error("Account POST Error:", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const url = new URL(req.url);
    const key = url.searchParams.get("key");

    if (!key) {
      return NextResponse.json({ success: false, message: "Account key is required." }, { status: 400 });
    }

    await dbConnect();
    await ZomatoConfig.findOneAndDelete({ key: key });

    return NextResponse.json({ success: true, message: "Account deleted successfully." });
  } catch (err) {
    console.error("Account Delete Error:", err.message);
    return NextResponse.json({ success: false, message: "Failed to delete account" }, { status: 500 });
  }
}

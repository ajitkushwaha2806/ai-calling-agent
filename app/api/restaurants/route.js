import dbConnect from "@/lib/dbConnect";
import { NextResponse } from "next/server";
import ZomatoRestaurant from "@/models/ZomatoRestaurant";

export async function GET() {
  try {
    await dbConnect();
    const restaurants = await ZomatoRestaurant.find({}).sort({ name: 1 }).lean();
    return NextResponse.json({ success: true, data: restaurants });
  } catch (err) {
    console.error("Error fetching restaurants from DB:", err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch restaurants from database" },
      { status: 500 }
    );
  }
}

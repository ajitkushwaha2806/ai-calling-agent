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

export async function POST(req) {
  try {
    const { id, whatsappChatId } = await req.json();
    if (!id) {
      return NextResponse.json({ success: false, message: "Restaurant ID is required" }, { status: 400 });
    }

    await dbConnect();
    const updatedRestaurant = await ZomatoRestaurant.findOneAndUpdate(
      { id: id },
      { $set: { whatsappChatId: whatsappChatId || "" } },
      { returnDocument: 'after' }
    );

    if (!updatedRestaurant) {
      return NextResponse.json({ success: false, message: "Restaurant not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedRestaurant });
  } catch (err) {
    console.error("Error updating restaurant:", err);
    return NextResponse.json(
      { success: false, message: "Failed to update restaurant" },
      { status: 500 }
    );
  }
}

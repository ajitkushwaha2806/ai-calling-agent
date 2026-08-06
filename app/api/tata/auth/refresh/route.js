import { NextResponse } from "next/server";
import { refreshSmartfloToken } from "@/services/tataService";

export async function POST() {
  try {
    const data = await refreshSmartfloToken();
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Error in Smartflo refresh API route:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Internal Server Error !" },
      { status: 500 }
    );
  }
}

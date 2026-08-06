import { NextResponse } from "next/server";
import { getCallRecords } from "@/services/tataService";

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const searchParams = url.searchParams;

    const queryParams = {};
    for (const [key, value] of searchParams.entries()) {
      queryParams[key] = value;
    }

    const data = await getCallRecords(queryParams);

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Error in Smartflo CDR API route:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Internal Server Error !" },
      { status: 500 }
    );
  }
}

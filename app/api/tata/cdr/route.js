import { NextResponse } from "next/server";
import { getCallRecords } from "@/services/tataService";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get("limit") || 50;
    const page = searchParams.get("page") || 1;
    const fromDate = searchParams.get("start_date");
    const toDate = searchParams.get("end_date");

    const queryParams = { limit, page };

    if (fromDate) queryParams.start_date = fromDate;
    if (toDate) queryParams.end_date = toDate;

    const response = await getCallRecords(queryParams);

    console.log("Cdr", response)
    if (!response) {
      return NextResponse.json({ success: true, data: [] });
    }

    return NextResponse.json({ success: true, data: response });
  } catch (err) {
    console.error("❌ Error fetching CDRs:", err.message);
    return NextResponse.json({ success: false, message: "Failed to fetch CDRs", error: err.message }, { status: 500 });
  }
}

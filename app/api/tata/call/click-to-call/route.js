import { NextResponse } from "next/server";
import { validateRequiredFields } from "@/lib/validator";
import { initiateClickToCall } from "@/services/tataService";

export async function POST(req) {
  try {
    const body = await req.json();
    const validationError = validateRequiredFields(body, ["destination_number"]);
    if (validationError) return validationError;

    const data = await initiateClickToCall(body);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message || "Internal Server Error !" },
      { status: 500 }
    );
  }
}

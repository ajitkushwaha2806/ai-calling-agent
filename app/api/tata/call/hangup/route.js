import { NextResponse } from "next/server";
import { hangupCall } from "@/services/tataService";
import { validateRequiredFields } from "@/lib/validator";

export async function POST(req) {
  try {
    const body = await req.json();

    const validationError = validateRequiredFields(body, ["call_id"]);
    if (validationError) {
      return validationError;
    }

    const data = await hangupCall(body);

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Error in Smartflo hangup API route:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Internal Server Error !" },
      { status: 500 }
    );
  }
}

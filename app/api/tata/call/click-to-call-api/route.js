import { NextResponse } from "next/server";
import { validateRequiredFields } from "@/lib/validator";
import { initiateClickToCallSupport } from "@/services/tataService";

export async function POST(req) {
  try {
    const body = await req.json();
    const validationError = validateRequiredFields(body, ["customer_number"]);
    if (validationError) return validationError;

    const data = await initiateClickToCallSupport(body);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message || "Internal Server Error !" },
      { status: 500 }
    );
  }
}

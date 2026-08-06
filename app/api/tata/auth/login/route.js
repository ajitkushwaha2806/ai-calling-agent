import { NextResponse } from "next/server";
import { validateRequiredFields } from "@/lib/validator";
import { loginToSmartflo } from "@/services/tataService";

export async function POST(req) {
  try {
    const body = await req.json();

    const validationError = validateRequiredFields(body, ["email", "password"]);
    if (validationError) {
      return validationError;
    }

    const { email, password } = body;
    const data = await loginToSmartflo(email, password);

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Error in Smartflo login API route:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Internal Server Error !" },
      { status: 500 }
    );
  }
}

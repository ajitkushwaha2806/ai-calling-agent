import { NextResponse } from "next/server";

export function validateRequiredFields(body, requiredFields) {
  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { success: false, message: "Invalid request body" },
      { status: 400 }
    );
  }

  const missingFields = requiredFields.filter((field) => !body[field]);

  if (missingFields.length > 0) {
    return NextResponse.json(
      {
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      },
      { status: 400 }
    );
  }

  return null;
}

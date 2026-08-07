import { NextResponse } from "next/server";

export function validateRequiredFields(body, fields) {
  const missing = [];
  for (const field of fields) {
    if (body[field] === undefined || body[field] === null || body[field] === "") {
      missing.push(field);
    }
  }
  
  if (missing.length > 0) {
    return NextResponse.json(
      { success: false, message: `Missing required fields: ${missing.join(", ")}` },
      { status: 400 }
    );
  }
  
  return null;
}

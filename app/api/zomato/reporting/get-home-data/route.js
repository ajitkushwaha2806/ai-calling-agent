import { NextResponse } from "next/server";
import { apiClient } from "@/lib/api/client";

export async function POST(req) {
    try {
        const url = new URL(req.url);
        const accountKey = url.searchParams.get("accountKey");

        if (!accountKey) {
            return NextResponse.json({ success: false, message: "accountKey is required" }, { status: 400 });
        }

        const body = await req.json();

        const data = await apiClient({
            baseURL: process.env.ZOMATO_API_BASE_URL_V2 || "https://api.zomato.com",
            endpoint: "/merchant-gw/web/owner-hub/reporting/get-home-data",
            method: "POST",
            accountKey: accountKey,
            data: body,
        });

        return NextResponse.json({ success: true, data });
    } catch (err) {
        console.error("Error fetching Zomato reporting data:", err);
        return NextResponse.json(
            { success: false, message: err.message || "Failed to fetch reporting data" },
            { status: 500 }
        );
    }
}

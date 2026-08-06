import dbConnect from "@/lib/dbConnect";
import { NextResponse } from "next/server";
import { apiClient } from "@/lib/api/client";
import ZomatoRestaurant from "@/models/ZomatoRestaurant";

export async function GET(req) {
    try {
        const url = new URL(req.url);
        const accountKey = url.searchParams.get("accountKey");

        if (!accountKey) {
            return NextResponse.json({ success: false, message: "accountKey is required" }, { status: 400 });
        }

        const data = await apiClient({
            baseURL: process.env.ZOMATO_API_BASE_URL_V2 || "https://api.zomato.com",
            endpoint: "/merchant-gw/web/restaurant/get-all-minimal-lite",
            method: "GET",
            accountKey: accountKey,
            headers: {
                "x-zomato-source-identifier": "merchant-dashboard",
                "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
                "cache-control": "no-cache",
                "pragma": "no-cache",
                "priority": "u=1, i",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-site",
            }
        });

        if (data && data.entities && Array.isArray(data.entities)) {
            await dbConnect();

            const bulkOps = data.entities.map(restaurant => ({
                updateOne: {
                    filter: { id: restaurant.id },
                    update: {
                        $set: {
                            name: restaurant.name,
                            subzone: restaurant.subzone,
                            thumbnail: restaurant.thumbnail
                        }
                    },
                    upsert: true
                }
            }));

            if (bulkOps.length > 0) {
                await ZomatoRestaurant.bulkWrite(bulkOps);
            }
        }

        return NextResponse.json({ success: true, count: data?.entities?.length || 0, data });
    } catch (err) {
        console.error("Error fetching Zomato restaurants:", err);
        return NextResponse.json(
            { success: false, message: err.message || "Failed to fetch restaurants" },
            { status: 500 }
        );
    }
}

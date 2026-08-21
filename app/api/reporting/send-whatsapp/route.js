import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { uploadToS3 } from "@/services/s3";
import { whatsappQueue } from "@/bullmq/queues";
import { getSessions } from "@/services/openwaService";
import ZomatoRestaurant from "@/models/ZomatoRestaurant";

const MONGODB_URI = process.env.MONGODB_URI;
const TEST_GROUP_CHAT_ID = "120363412040816519@g.us";

export async function POST(req) {
    try {
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(MONGODB_URI);
        }

        const { resId, accountKey, base64Image, dateLabel } = await req.json();

        if (!resId || !base64Image) {
            return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
        }

        const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");

        const s3Response = await uploadToS3({
            file: buffer,
            folder: "reports",
            fileName: `${resId}-${Date.now()}.png`
        });

        if (!s3Response.success || !s3Response.url) {
            throw new Error("Failed to upload image to S3");
        }

        const s3Url = s3Response.url;

        const restaurant = await ZomatoRestaurant.findOne({ id: resId, userId: accountKey });

        if (!restaurant) {
            return NextResponse.json({ success: false, message: "Restaurant not found" }, { status: 404 });
        }


        const sessions = await getSessions();
        if (!sessions || sessions.length === 0) {
            throw new Error("No OpenWA sessions available. Please configure a session in OpenWA.");
        }
        const sessionId = sessions[0].id;

        const caption = `📊 *Zomato Reporting* - ${restaurant.name}
📅 Date: ${dateLabel || 'Report'}

Here is your latest business report!`;

        // await whatsappQueue.add("send-image", {
        //     type: 'image',
        //     sessionId: sessionId,
        //     resId: resId,
        //     url: s3Url,
        //     caption: caption
        // });

        return NextResponse.json({ success: true, message: "Report queued for WhatsApp delivery" });

    } catch (error) {
        console.error("Error in /api/reporting/send-whatsapp:", error);
        return NextResponse.json({ success: false, message: "Failed to queue report" }, { status: 500 });
    }
}

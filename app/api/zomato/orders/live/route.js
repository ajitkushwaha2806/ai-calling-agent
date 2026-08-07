import { NextResponse } from "next/server";
import { zomatoSocketService } from "@/services/zomatoSocketService";

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const url = new URL(req.url);
  const accountKey = url.searchParams.get("accountKey");

  if (!accountKey) {
    return NextResponse.json({ success: false, message: "accountKey (userId) is required" }, { status: 400 });
  }

  try {
    await zomatoSocketService.joinStream(accountKey);

    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "connected", message: "Listening to Zomato Socket..." })}\n\n`));
        const eventName = `zomato_event_${accountKey}`;
        const listener = (data) => {
          const sseData = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(sseData));
        };

        zomatoSocketService.emitter.on(eventName, listener);

        const keepAlive = setInterval(() => {
          controller.enqueue(encoder.encode(`: keepalive\n\n`));
        }, 30000);

        req.signal.addEventListener("abort", () => {
          clearInterval(keepAlive);
          zomatoSocketService.emitter.off(eventName, listener);
          console.log(`[SSE] Client disconnected for user ${accountKey}`);
        });
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });

  } catch (err) {
    console.error(`[SSE Error] Failed to stream for user ${accountKey}:`, err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

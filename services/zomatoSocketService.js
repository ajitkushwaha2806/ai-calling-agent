import io from "socket.io-client";
import dbConnect from "@/lib/dbConnect";
import ZomatoConfig from "@/models/ZomatoConfig";
import ZomatoRestaurant from "@/models/ZomatoRestaurant";
import mongoose from "mongoose";
import { EventEmitter } from "events";

class ZomatoSocketService {
  constructor() {
    this.sockets = new Map(); 
    this.emitter = new EventEmitter();
  }

  async connect(userId) {
    if (this.sockets.has(userId) && this.sockets.get(userId).connected) {
      return this.sockets.get(userId);
    }

    await dbConnect();
    const config = await ZomatoConfig.findOne({ key: userId });
    const cookie = config?.cookie || "";

    if (!cookie) {
      throw new Error(`No Zomato cookie found in DB for user ${userId}`);
    }

    // Fetch resIds for this user so we can subscribe to all their restaurants' orders
    let resIds = [];
    try {
      const restaurants = await mongoose.models.ZomatoRestaurant.find({ userId: userId });
      if (restaurants && restaurants.length > 0) {
        resIds = restaurants.map(r => r.id.toString());
      }
    } catch (err) {
      console.error(`[Socket] Failed to fetch resIds from DB for user ${userId}:`, err.message);
    }

    const socketUrl = process.env.ZOMATO_SOCKET_URL || "https://cc2.zomato.com";
    const baseHeaders = {
      "Cookie": cookie,
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      "Referer": `${process.env.ZOMATO_API_BASE_URL}/`,
      "Origin": `${process.env.ZOMATO_API_BASE_URL}`,
    };

    const socket = io(socketUrl, {
      path: "/socket.io/",
      transports: ["websocket"],
      extraHeaders: baseHeaders,
    });
    
    // Attach fetched resIds so the "hello" auto-reply can use them
    socket.resIds = resIds;

    socket.on("connect", () => {
      console.log(`✅ Connected to Zomato Socket for user ${userId}:`, socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.log(`❌ Disconnected from Zomato Socket for user ${userId}:`, reason);
      this.sockets.delete(userId);
    });

    socket.on("error", (error) => {
      console.error(`⚠️ Zomato Socket Error for user ${userId}:`, error);
    });

    const originalEmit = socket.emit;
    socket.emit = function (eventName, ...args) {
      console.log(`[Socket Emit ${userId}] ${eventName}:`, args);
      originalEmit.apply(this, [eventName, ...args]);
    };
    
    const originalOnEvent = socket.onevent;
    socket.onevent = function (packet) {
      const args = packet.data || [];
      if (args.length > 0) {
        const eventName = args[0];
        const eventArgs = args.slice(1);

        if (eventName === "hello") {
          const payload = {
            user: userId,
            userId: userId,
            resIds: socket.resIds || [], 
            client: "web",
            version: "2",
          };
          console.log(`[Socket Auto-Reply] Emitting 'yello' for user ${userId}`);
          socket.emit("yello", payload);
        }

        console.log(`[Socket Event ${userId}] ${eventName}:`, eventArgs);
        this.emitter.emit(`zomato_event_${userId}`, { eventName, args: eventArgs });
      }
      if (originalOnEvent) {
        originalOnEvent.call(socket, packet);
      }
    }.bind(this);

    this.sockets.set(userId, socket);
    return socket;
  }

  async joinStream(userId) {
    let socket = this.sockets.get(userId);
    if (!socket || !socket.connected) {
      socket = await this.connect(userId);
    }
    // The "hello" auto-reply in connect() already handles sending the correct resIds
  }

  disconnect(userId) {
    const socket = this.sockets.get(userId);
    if (socket) {
      socket.disconnect();
      this.sockets.delete(userId);
    }
  }
}

export const zomatoSocketService = new ZomatoSocketService();

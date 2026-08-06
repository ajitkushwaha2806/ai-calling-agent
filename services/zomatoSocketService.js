import io from "socket.io-client";
import dbConnect from "@/lib/dbConnect";
import ZomatoConfig from "@/models/ZomatoConfig";

class ZomatoSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  async connect() {
    if (this.socket && this.isConnected) return this.socket;

    await dbConnect();
    const config = await ZomatoConfig.findOne({ key: "ZOMATO_COOKIE" });
    const cookie = config?.cookie || "";

    if (!cookie) {
      throw new Error("No Zomato cookie found in DB");
    }

    this.socket = io("https://cc2.zomato.com", {
      path: "/socket.io/",
      transports: ["polling", "websocket"],
      extraHeaders: {
        "Cookie": cookie,
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36",
        "Referer": "https://www.zomato.com/",
        "Accept": "*/*",
      },
    });

    this.socket.on("connect", () => {
      console.log("✅ Connected to Zomato Socket:", this.socket.id);
      this.isConnected = true;
    });

    this.socket.on("disconnect", (reason) => {
      console.log("❌ Disconnected from Zomato Socket:", reason);
      this.isConnected = false;
    });

    this.socket.on("error", (error) => {
      console.error("⚠️ Zomato Socket Error:", error);
    });

    const originalEmit = this.socket.emit;
    this.socket.emit = function (eventName, ...args) {
      console.log(`[Socket Emit] ${eventName}:`, args);
      originalEmit.apply(this, [eventName, ...args]);
    };
    
    this.socket.on("*", (event, data) => {
      console.log(`[Socket Event] ${event}:`, data);
    });

    return this.socket;
  }

  async joinStream(userId, resIds = []) {
    if (!this.isConnected) {
      await this.connect();
    }

    const payload = {
      user: userId,
      userId: userId,
      resIds: resIds, 
      client: "web",
      version: "2",
    };

    console.log("Emitting 'yello' event to Zomato:", payload);
    this.socket.emit("yello", payload);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

export const zomatoSocketService = new ZomatoSocketService();

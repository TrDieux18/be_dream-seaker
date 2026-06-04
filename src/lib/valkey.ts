import Redis from "ioredis";
import { Env } from "../config/env.config";

export const valkey = new Redis(Env.VALKEY_URL, {
   maxRetriesPerRequest: null,
   enableReadyCheck: false,
});

valkey.on("connect", () => {
   console.log("⚡ Valkey/Redis connected successfully");
});

valkey.on("error", (err) => {
   console.error("❌ Valkey/Redis connection error:", err);
});

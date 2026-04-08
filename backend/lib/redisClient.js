import { createClient } from "redis";
import dotenv from "dotenv";
dotenv.config();

const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    connectTimeout: 20_000,
    family: 4,
  },
});

redisClient.on("error", (err) => {
  console.error("[redis]", err.message);
});

redisClient.connect().catch((err) => {
  console.error("[redis] connect failed:", err.message);
});

export default redisClient;

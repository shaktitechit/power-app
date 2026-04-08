import IORedis from "ioredis";
import dotenv from "dotenv";
dotenv.config();

const url = process.env.REDIS_URL;

export const redisConnection = new IORedis(url, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  connectTimeout: 20_000,
  // Prefer IPv4 — Docker Desktop sometimes stalls on IPv6 for internal hostnames.
  family: 4,
  retryStrategy(times) {
    const delay = Math.min(times * 500, 10_000);
    return delay;
  },
});

redisConnection.on("error", (err) => {
  console.error("[ioredis]", err.code || "", err.message);
});

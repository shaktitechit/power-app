import rateLimit from "express-rate-limit";
import logger from "../config/logger.js";
import buildLogMeta from "../utils/buildLogMeta.js";

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50000000,
  standardHeaders: true,
  legacyHeaders: false,

  handler: (req, res) => {
    logger.warn("Rate limit exceeded", {
      ...buildLogMeta(req, {
        statusCode: 429,
        windowMs: 15 * 60 * 1000,
        maxRequests: 50000000,
        userAgent: req.get("user-agent"),
        logCategory: "security",
        abuseDetection: true,
      }),
    });

    res.status(429).json({
      message: "Too many requests, please try again later.",
      requestId: req.requestId || null,
    });
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,
  standardHeaders: true,
  legacyHeaders: false,

  handler: (req, res) => {
    logger.warn("Authentication rate limit exceeded", {
      ...buildLogMeta(req, {
        statusCode: 429,
        windowMs: 15 * 60 * 1000,
        maxRequests: 5000,
        userAgent: req.get("user-agent"),
        email: req.body?.email || null,
        logCategory: "security",
        abuseDetection: true,
        routeType: "auth",
      }),
    });

    res.status(429).json({
      message: "Too many authentication attempts, please try again later.",
      requestId: req.requestId || null,
    });
  },
});

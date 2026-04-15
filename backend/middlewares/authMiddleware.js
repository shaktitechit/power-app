import jwt from "jsonwebtoken";
import User from "../modals/user.js";
import logger from "../config/logger.js";
import buildLogMeta from "../utils/buildLogMeta.js";
import { getAccessSecret } from "../utils/authTokens.js";
import asyncHandler from "./asyncHandler.js";

const unauthorized = (message) => {
  const err = new Error(message);
  err.statusCode = 401;
  return err;
};

// 🔐 Protect routes (access JWT in `jwt` cookie only)
const protect = asyncHandler(async (req, res, next) => {
  const token = req.cookies.jwt;

  if (!token) {
    logger.warn("Authentication failed: token missing", buildLogMeta(req));
    throw unauthorized("Not authorized");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, getAccessSecret());
  } catch (err) {
    logger.warn(
      "Authentication failed: invalid or expired token",
      buildLogMeta(req, {
        errorMessage: err.message,
      }),
    );
    throw unauthorized("Not authorized");
  }

  if (decoded.typ === "refresh") {
    logger.warn(
      "Authentication failed: refresh token used as access",
      buildLogMeta(req),
    );
    throw unauthorized("Not authorized");
  }

  if (decoded.typ && decoded.typ !== "access") {
    throw unauthorized("Not authorized");
  }

  const user = await User.findById(decoded.id).select("-password");

  if (!user) {
    logger.warn("Authentication failed: user not found", buildLogMeta(req));
    throw unauthorized("Not authorized");
  }

  req.user = user;

  // 🔹 keep this as debug (not info to avoid noise)
  logger.debug(
    "Authentication success",
    buildLogMeta(req, {
      authenticatedUserId: user._id,
    }),
  );

  next();
});

// 🔐 Admin check
const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }

  logger.warn(
    "Authorization failed: admin access denied",
    buildLogMeta(req, {
      userId: req.user?._id || null,
      role: req.user?.role || null,
    }),
  );

  res.status(403).json({ message: "Not authorized as an admin." });
};

export { protect, admin };

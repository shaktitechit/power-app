import asyncHandler from "../middlewares/asyncHandler.js";
import User from "../modals/user.js";
import UserSession from "../modals/userSession.js";
import PresenceLog from "../modals/presenceLog.js";
import jwt from "jsonwebtoken";
// import passport from "passport";
// import { emailQueue } from "../queues/emailQueue.js";
import { createRecentActivity } from "../helpers/createRecentActivity.js";
import { buildActivityMessage } from "../helpers/buildActivityMessage.js";
import {
  clearAuthCookies,
  getRefreshExpiresIn,
  getRefreshSecret,
  hashToken,
  parseDurationToMs,
  setAuthCookies,
  signAccessToken,
  signRefreshTokenForSession,
} from "../utils/authTokens.js";

const extractIp = (req) => {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
    return forwardedFor.split(",")[0].trim();
  }
  return req.ip || null;
};

const issueTokensForUser = async (req, res, user) => {
  const accessToken = signAccessToken(user._id);
  const session = new UserSession({
    userId: user._id,
    tokenHash: "",
    userAgent: req.get("user-agent") || null,
    ip: extractIp(req),
    expiresAt: new Date(Date.now() + parseDurationToMs(getRefreshExpiresIn())),
    lastUsedAt: new Date(),
  });

  const refreshToken = signRefreshTokenForSession(user._id, session._id);
  session.tokenHash = hashToken(refreshToken);
  await session.save();

  setAuthCookies(res, {
    accessToken,
    refreshToken,
    role: user.role,
  });
};

//@route POST /api/v1/users/login
//@desc Authenticate user
//@access Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  let user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({ message: "Invalid Credentials" });
  }

  if (user.status !== "active") {
    return res.status(400).json({ message: "Restricted User" });
  }

  if (user.authProvider === "google") {
    return res.status(400).json({
      message: "Please login using Google",
    });
  }

  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return res.status(400).json({ message: "Invalid Credentials" });
  }

  await issueTokensForUser(req, res, user);

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
});

//@route POST /api/v1/users/register
//@desc Register a new user
//@access Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  let user = await User.findOne({ email });

  if (user) {
    return res.status(400).json({ message: "User already exists." });
  }

  user = new User({ name, email, password });
  await user.save();

  res.status(201).json({
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

//@route Get /api/v1/users/profile
//@desc Get logged-in user's profile (Protected Route)
//@access Private
const getUserProfile = asyncHandler(async (req, res) => {
  res.json(req.user);
});

//@route POST /api/v1/users/refresh
//@desc Issue new access + refresh cookies from refresh token
//@access Public (requires refreshToken cookie)
const refreshAccessToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token" });
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, getRefreshSecret());
  } catch {
    return res.status(401).json({ message: "Invalid or expired refresh token" });
  }

  if (decoded.typ !== "refresh") {
    return res.status(401).json({ message: "Invalid token type" });
  }

  if (!decoded.sid) {
    return res.status(401).json({ message: "Invalid refresh session" });
  }

  const [user, session] = await Promise.all([
    User.findById(decoded.id),
    UserSession.findById(decoded.sid).select("+tokenHash +previousTokenHash"),
  ]);

  if (!user || user.status !== "active") {
    return res.status(401).json({ message: "User not found or inactive" });
  }

  if (!session || String(session.userId) !== String(user._id)) {
    return res.status(401).json({ message: "Refresh token revoked" });
  }

  if (session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
    return res.status(401).json({ message: "Refresh token revoked" });
  }

  const incomingRefreshHash = hashToken(refreshToken);
  const isCurrentToken = session.tokenHash === incomingRefreshHash;
  const isPreviousToken = session.previousTokenHash === incomingRefreshHash;

  if (!isCurrentToken && !isPreviousToken) {
    return res.status(401).json({ message: "Refresh token revoked" });
  }

  const accessToken = signAccessToken(user._id);
  const newRefreshToken = signRefreshTokenForSession(user._id, session._id);
  session.previousTokenHash = session.tokenHash;
  session.tokenHash = hashToken(newRefreshToken);
  session.lastUsedAt = new Date();
  session.expiresAt = new Date(Date.now() + parseDurationToMs(getRefreshExpiresIn()));
  await session.save();

  setAuthCookies(res, {
    accessToken,
    refreshToken: newRefreshToken,
    role: user.role,
  });

  res.json({ ok: true });
});

//@route POST /api/v1/users/logout
//@desc POST logged-out user
//@access Private
const userLogout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, getRefreshSecret());
      if (decoded?.sid && String(decoded?.id) === String(req.user._id)) {
        await UserSession.findOneAndUpdate(
          { _id: decoded.sid, userId: req.user._id, revokedAt: null },
          { revokedAt: new Date() },
        );
      }
    } catch {
      // Ignore invalid refresh token on logout and still clear cookies.
    }
  }

  clearAuthCookies(res);

  res.json({ message: "Logged out" });
});

//@route Get /api/v1/users/auditors
//@desc Get all auditors (Protected Route)
//@access Private
const getAuditors = asyncHandler(async (req, res) => {
  // 1. Get auditors
  const auditors = await User.find(
    { role: "auditor", status: "active" },
    "_id name email phone status role",
  )
    .sort({ createdAt: -1 })
    .lean();

  if (!auditors.length) {
    return res.status(200).json({
      success: true,
      count: 0,
      data: [],
    });
  }

  const userIds = auditors.map((u) => String(u._id));

  // 2. Get latest presence per user
  const presence = await PresenceLog.aggregate([
    {
      $match: {
        userId: { $in: userIds },
      },
    },
    {
      $sort: { timestamp: -1 },
    },
    {
      $group: {
        _id: "$userId",
        status: { $first: "$status" },
        timestamp: { $first: "$timestamp" },
      },
    },
  ]);

  const presenceMap = new Map(
    presence.map((p) => [
      String(p._id),
      {
        status: p.status,
        lastSeen: p.timestamp,
      },
    ]),
  );

  // 3. Merge user + presence
  const result = auditors.map((user) => {
    const p = presenceMap.get(String(user._id));

    return {
      ...user,
      appearance: {
        status: p?.status || "offline",
        lastSeen: p?.lastSeen || null,
      },
    };
  });

  res.status(200).json({
    success: true,
    count: result.length,
    data: result,
  });
});

const updateUser = asyncHandler(async (req, res) => {
  const { name, email, role, password, status } = req.body;

  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email });

    if (existingUser && existingUser._id.toString() !== user._id.toString()) {
      res.status(400);
      throw new Error("Email already in use");
    }
  }

  const updatedFields = [];

  if (name !== undefined && name !== user.name) {
    updatedFields.push("name");
  }

  if (email !== undefined && email !== user.email) {
    updatedFields.push("email");
  }

  if (role !== undefined && role !== user.role) {
    updatedFields.push("role");
  }

  if (status !== undefined && status !== user.status) {
    updatedFields.push("status");
  }

  if (password && password.trim() !== "") {
    updatedFields.push("password");
  }

  user.name = name ?? user.name;
  user.email = email ?? user.email;
  user.role = role ?? user.role;
  user.status = status ?? user.status;

  if (password && password.trim() !== "") {
    user.password = password;
  }

  const updatedUser = await user.save();

  await createRecentActivity({
    actor: req.user,
    action: "updated",
    entity_type: "user",
    entity_id: updatedUser._id,
    entity_name: updatedUser.name,
    message: buildActivityMessage({
      actorName: req.user?.name || "User",
      action: "updated",
      entityLabel: "user",
      entityName: updatedUser.name || "",
    }),
    meta: {
      updated_fields: [...new Set(updatedFields)],
      email: updatedUser.email,
      role: updatedUser.role,
      status: updatedUser.status,
    },
  });

  res.status(200).json({
    success: true,
    data: {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      status: updatedUser.status,
    },
  });
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const entityName = user.name;
  const email = user.email;
  const role = user.role;
  const status = user.status;

  await user.deleteOne();

  await createRecentActivity({
    actor: req.user,
    action: "deleted",
    entity_type: "user",
    entity_id: user._id,
    entity_name: entityName,
    message: buildActivityMessage({
      actorName: req.user?.name || "User",
      action: "deleted",
      entityLabel: "user",
      entityName: entityName || "",
    }),
    meta: {
      email,
      role,
      status,
    },
  });

  res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
});

export {
  loginUser,
  registerUser,
  getUserProfile,
  refreshAccessToken,
  userLogout,
  getAuditors,
  updateUser,
  deleteUser,
};

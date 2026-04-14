import crypto from "crypto";
import jwt from "jsonwebtoken";

const cookieDefaults = () => ({
  httpOnly: true,
  secure: true,
  sameSite: "none",
  path: "/",
});

export const getAccessSecret = () =>
  process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;

export const getRefreshSecret = () =>
  process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

export const getAccessExpiresIn = () =>
  process.env.JWT_ACCESS_EXPIRES || "15m";

export const getRefreshExpiresIn = () =>
  process.env.JWT_REFRESH_EXPIRES || "7d";

/** Parse "15m", "7d", "12h" to milliseconds for cookie maxAge */
export const parseDurationToMs = (value) => {
  const s = String(value || "").trim();
  const m = /^(\d+)([smhd])$/i.exec(s);
  if (!m) return 15 * 60 * 1000;
  const n = parseInt(m[1], 10);
  const unit = m[2].toLowerCase();
  const mult = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return n * (mult[unit] || 60000);
};

export const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const signAccessToken = (userId) =>
  jwt.sign({ id: userId, typ: "access" }, getAccessSecret(), {
    expiresIn: getAccessExpiresIn(),
  });

export const signRefreshToken = (userId) =>
  jwt.sign({ id: userId, typ: "refresh" }, getRefreshSecret(), {
    expiresIn: getRefreshExpiresIn(),
  });

export const setAuthCookies = (res, { accessToken, refreshToken, role }) => {
  const opts = cookieDefaults();
  const accessMs = parseDurationToMs(getAccessExpiresIn());
  const refreshMs = parseDurationToMs(getRefreshExpiresIn());

  res.cookie("jwt", accessToken, {
    ...opts,
    maxAge: accessMs,
  });

  res.cookie("refreshToken", refreshToken, {
    ...opts,
    maxAge: refreshMs,
  });

  if (role !== undefined && role !== null) {
    res.cookie("role", role, {
      ...opts,
      maxAge: refreshMs,
    });
  }
};

export const clearAuthCookies = (res) => {
  const expired = { ...cookieDefaults(), expires: new Date(0) };
  res.cookie("jwt", "", expired);
  res.cookie("refreshToken", "", expired);
  res.cookie("role", "", expired);
};

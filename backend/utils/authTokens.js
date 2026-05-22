import crypto from "crypto";
import jwt from "jsonwebtoken";

/**
 * Cookie options for auth tokens.
 * - Development (HTTP): secure must be false or browsers won't store/send cookies.
 * - Production (HTTPS): secure true; same-site Next.js `/api` proxy → default `lax`.
 * - Cross-origin API only: set COOKIE_SAMESITE=none and COOKIE_SECURE=true (SameSite=None requires Secure).
 * - Subdomains (app + API): set COOKIE_DOMAIN=.example.com so jwt is sent to both.
 */
export const cookieDefaults = () => {
  const secure =
    process.env.COOKIE_SECURE === "false"
      ? false
      : process.env.COOKIE_SECURE === "true"
        ? true
        : process.env.NODE_ENV === "production";

  let sameSite = process.env.COOKIE_SAMESITE || "lax";
  if (sameSite === "none" && !secure) {
    sameSite = "lax";
  }

  const domain = process.env.COOKIE_DOMAIN?.trim();
  const base = {
    httpOnly: process.env.NODE_ENV === "production" ? true : false,
    secure,
    sameSite,
    path: "/",
  };
  if (domain) {
    base.domain = domain;
  }
  return base;
};

/** `Authorization: Bearer <access>` when cookies are not sent (API clients, some cross-origin setups). */
export function getBearerAccessToken(req) {
  const h = req.headers?.authorization;
  if (!h || typeof h !== "string") return null;
  const m = /^Bearer\s+(\S+)/i.exec(h.trim());
  return m ? m[1] : null;
}

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

export const signAccessToken = (userId, sessionId = null) => {
  const payload = { id: userId, typ: "access" };
  if (sessionId) payload.sid = String(sessionId);
  return jwt.sign(payload, getAccessSecret(), {
    expiresIn: getAccessExpiresIn(),
  });
};

export const signRefreshTokenForSession = (userId, sessionId) =>
  jwt.sign({ id: userId, sid: String(sessionId), typ: "refresh" }, getRefreshSecret(), {
    expiresIn: getRefreshExpiresIn(),
  });

const hasPermission = (permissions = [], resource, action, scope = "all") => {
  if (!Array.isArray(permissions)) return false;
  const actionAliases = {
    view_report: "read",
    generate_report: "create",
    view_document: "read",
    edit: "update",
  };
  const actionsToCheck = [action, actionAliases[action]].filter(Boolean);

  return permissions.some((permission) => {
    const resourceMatch =
      permission?.resource === "*" || permission?.resource === resource;
    const actionMatch =
      Array.isArray(permission?.actions) &&
      (permission.actions.includes("*") ||
        actionsToCheck.some((candidate) => permission.actions.includes(candidate)));
    const scopeMatch = permission?.scope === scope;
    return resourceMatch && actionMatch && scopeMatch;
  });
};

export const deriveAccessFlags = ({ role, permissions = [] }) => {
  const usersHub =
    role === "super_admin" ||
    role === "admin" ||
    hasPermission(permissions, "user", "read", "all") ||
    hasPermission(permissions, "report", "read", "all");

  return {
    usersHub: usersHub ? "1" : "0",
  };
};

export const setAuthCookies = (
  res,
  { accessToken, refreshToken, role, accessFlags },
) => {
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

  if (accessFlags?.usersHub !== undefined) {
    res.cookie("usersHub", String(accessFlags.usersHub), {
      ...opts,
      maxAge: refreshMs,
    });
  }

  res.cookie("sessionTimer", String(Date.now() + 10 * 60 * 1000), {
    ...opts,
    sameSite: "lax",
    maxAge: 10 * 60 * 1000,
    httpOnly: false, // Force false so frontend can read it
  });
};

export const clearAuthCookies = (res) => {
  const expired = { ...cookieDefaults(), expires: new Date(0) };
  res.cookie("jwt", "", expired);
  res.cookie("refreshToken", "", expired);
  res.cookie("role", "", expired);
  res.cookie("reportsHub", "", expired);
  res.cookie("usersHub", "", expired);
  res.cookie("mode", "", expired);
  res.cookie("sessionTimer", "", expired);
};

import PresenceLog from "../modals/presenceLog.js";
import redisClient from "../lib/redisClient.js";
import User from "../modals/user.js";
import logger from "../config/logger.js";

const onlineUsers = new Map();
const heartbeatTimeouts = new Map();
const forcedHeartbeatLogoutSockets = new Set();

const HEARTBEAT_TIMEOUT_SECONDS = 10 * 60;
const HEARTBEAT_TIMEOUT_MS = HEARTBEAT_TIMEOUT_SECONDS * 1000;
const PRESENCE_TTL_SECONDS = HEARTBEAT_TIMEOUT_SECONDS;

const buildSocketLogMeta = (socket, extra = {}) => {
  const userId = socket?.handshake?.auth?.userId || null;
  const forwardedFor = socket?.handshake?.headers?.["x-forwarded-for"];

  let ip = null;

  if (Array.isArray(forwardedFor)) {
    ip = forwardedFor[0];
  } else if (typeof forwardedFor === "string") {
    ip = forwardedFor.split(",")[0].trim();
  } else {
    ip = socket?.handshake?.address || null;
  }

  return {
    socketId: socket?.id || null,
    userId,
    ip,
    userAgent: socket?.handshake?.headers?.["user-agent"] || null,
    transport: socket?.conn?.transport?.name || null,
    ...extra,
  };
};

const setPresenceStatus = async ({ userId, status, ttl = null }) => {
  const key = `presence:${userId}`;

  if (ttl) {
    await redisClient.set(key, status, { EX: ttl });
  } else {
    await redisClient.set(key, status);
  }
};

const parseCookieMode = (cookieHeader) => {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/(?:^|;\s*)mode=([^;]*)/);
  const value = match ? decodeURIComponent(match[1]) : null;
  return value === "onsite" || value === "offsite" ? value : null;
};

const createPresenceLog = async ({ userId, status, sessionId = null, reason = null, mode = null }) => {
  await PresenceLog.create({
    userId,
    status,
    sessionId,
    reason,
    mode,
  });
};

const socketServer = (io) => {
  io.on("connection", async (socket) => {
    const userId = socket.handshake.auth.userId;
    const sessionId = `${socket.id}:${Date.now()}`;
    // Read mode cookie from the handshake so presence logs are mode-aware.
    const cookieMode = parseCookieMode(socket.handshake.headers.cookie || "");

    const clearHeartbeatTimeout = () => {
      const timeoutId = heartbeatTimeouts.get(socket.id);
      if (timeoutId) {
        clearTimeout(timeoutId);
        heartbeatTimeouts.delete(socket.id);
      }
    };

    const markOffline = async ({ reason, event }) => {
      onlineUsers.delete(userId);
      await setPresenceStatus({
        userId,
        status: "offline",
      });
      await createPresenceLog({
        userId,
        status: "offline",
        sessionId,
        reason,
      });
      io.emit("user-offline", { userId, reason });
      logger.info(
        "User status changed to offline",
        buildSocketLogMeta(socket, {
          event,
          status: "offline",
          reason,
        }),
      );
    };

    const scheduleHeartbeatTimeout = () => {
      clearHeartbeatTimeout();
      const timeoutId = setTimeout(async () => {
        try {
          forcedHeartbeatLogoutSockets.add(socket.id);
          await markOffline({
            reason: "heartbeat_timeout",
            event: "heartbeat-timeout",
          });
          socket.emit("force-logout", {
            reason: "heartbeat_timeout",
            message: "Logged out due to no heartbeat for 10 minutes.",
          });
          socket.disconnect(true);
        } catch (error) {
          logger.error(
            "Heartbeat timeout handling failed",
            buildSocketLogMeta(socket, {
              event: "heartbeat-timeout",
              error: error?.message,
              stack: error?.stack,
            }),
          );
        } finally {
          clearHeartbeatTimeout();
        }
      }, HEARTBEAT_TIMEOUT_MS);
      heartbeatTimeouts.set(socket.id, timeoutId);
    };

    if (!userId) {
      logger.logSecurity({
        message: "Socket connection rejected: missing userId",
        type: "socket_auth_invalid",
        ip:
          socket.handshake.headers["x-forwarded-for"] ||
          socket.handshake.address ||
          null,
        meta: {
          socketId: socket.id,
          userAgent: socket.handshake.headers["user-agent"] || null,
        },
      });

      socket.disconnect();
      return;
    }

    try {
      logger.info(
        "Socket user connected",
        buildSocketLogMeta(socket, { event: "connection" }),
      );

      onlineUsers.set(userId, socket.id);

      await setPresenceStatus({
        userId,
        status: "online",
        ttl: PRESENCE_TTL_SECONDS,
      });

      await createPresenceLog({
        userId,
        status: "online",
        sessionId,
        reason: "connection",
        mode: cookieMode,
      });

      io.emit("user-online", { userId });
      scheduleHeartbeatTimeout();

      logger.info(
        "User marked online",
        buildSocketLogMeta(socket, { status: "online" }),
      );

      const users = await User.find({}, "_id").lean();

      const entries = await Promise.all(
        users.map(async (user) => {
          const id = user._id.toString();
          const status = (await redisClient.get(`presence:${id}`)) || "offline";

          return [id, status];
        }),
      );

      socket.emit("presence-snapshot", Object.fromEntries(entries));

      logger.info(
        "Presence snapshot sent",
        buildSocketLogMeta(socket, {
          usersCount: users.length,
          event: "presence-snapshot",
        }),
      );
    } catch (error) {
      logger.error(
        "Failed during socket connection setup",
        buildSocketLogMeta(socket, {
          error: error?.message,
          stack: error?.stack,
        }),
      );
    }

    socket.on("heartbeat", async () => {
      try {
        const currentStatus = await redisClient.get(`presence:${userId}`);

        const statusToKeep =
          currentStatus === "away" || currentStatus === "online"
            ? currentStatus
            : "online";

        await setPresenceStatus({
          userId,
          status: statusToKeep,
          ttl: PRESENCE_TTL_SECONDS,
        });
        scheduleHeartbeatTimeout();

        logger.info(
          "Heartbeat received",
          buildSocketLogMeta(socket, {
            event: "heartbeat",
            status: statusToKeep,
          }),
        );
      } catch (error) {
        logger.error(
          "Heartbeat handling failed",
          buildSocketLogMeta(socket, {
            event: "heartbeat",
            error: error?.message,
            stack: error?.stack,
          }),
        );
      }
    });

    socket.on("user-online", async () => {
      try {
        await setPresenceStatus({
          userId,
          status: "online",
          ttl: PRESENCE_TTL_SECONDS,
        });

        await createPresenceLog({
          userId,
          status: "online",
          sessionId,
          reason: "user-online",
          mode: cookieMode,
        });

        io.emit("user-online", { userId });
        scheduleHeartbeatTimeout();

        logger.info(
          "User status changed to online",
          buildSocketLogMeta(socket, {
            event: "user-online",
            status: "online",
          }),
        );
      } catch (error) {
        logger.error(
          "Failed to set user online",
          buildSocketLogMeta(socket, {
            event: "user-online",
            error: error?.message,
            stack: error?.stack,
          }),
        );
      }
    });

    socket.on("user-away", async () => {
      try {
        await setPresenceStatus({
          userId,
          status: "away",
          ttl: PRESENCE_TTL_SECONDS,
        });

        await createPresenceLog({
          userId,
          status: "away",
          sessionId,
          reason: "user-away",
        });

        io.emit("user-away", { userId });
        scheduleHeartbeatTimeout();

        logger.info(
          "User status changed to away",
          buildSocketLogMeta(socket, {
            event: "user-away",
            status: "away",
          }),
        );
      } catch (error) {
        logger.error(
          "Failed to set user away",
          buildSocketLogMeta(socket, {
            event: "user-away",
            error: error?.message,
            stack: error?.stack,
          }),
        );
      }
    });

    socket.on("user-offline", async () => {
      try {
        clearHeartbeatTimeout();
        await markOffline({
          reason: "user-offline",
          event: "user-offline",
        });
      } catch (error) {
        logger.error(
          "Failed to set user offline",
          buildSocketLogMeta(socket, {
            event: "user-offline",
            error: error?.message,
            stack: error?.stack,
          }),
        );
      }
    });

    socket.on("disconnect", async (reason) => {
      try {
        clearHeartbeatTimeout();

        if (forcedHeartbeatLogoutSockets.has(socket.id)) {
          forcedHeartbeatLogoutSockets.delete(socket.id);
          return;
        }

        await markOffline({
          reason: "disconnect",
          event: "disconnect",
        });
      } catch (error) {
        logger.error(
          "Disconnect handling failed",
          buildSocketLogMeta(socket, {
            event: "disconnect",
            reason,
            error: error?.message,
            stack: error?.stack,
          }),
        );
      }
    });
  });
};

export default socketServer;

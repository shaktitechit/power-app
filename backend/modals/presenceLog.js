import mongoose from "mongoose";

const presenceSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["online", "away", "offline"],
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      default: null,
      index: true,
    },
    reason: {
      type: String,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  },
);

presenceSchema.index({ userId: 1, timestamp: -1 });

const clampRange = (start, end, min, max) => {
  const clampedStart = start > min ? start : min;
  const clampedEnd = end < max ? end : max;
  if (clampedEnd <= clampedStart) return 0;
  return clampedEnd.getTime() - clampedStart.getTime();
};

presenceSchema.statics.getDailySummary = async function ({
  userId,
  dayStart,
  dayEnd,
}) {
  if (!userId) {
    throw new Error("userId is required");
  }
  if (!dayStart || !dayEnd) {
    throw new Error("dayStart and dayEnd are required");
  }

  const start = new Date(dayStart);
  const end = new Date(dayEnd);

  const logs = await this.find({
    userId: String(userId),
    timestamp: {
      $gte: new Date(start.getTime() - 24 * 60 * 60 * 1000),
      $lte: end,
    },
  })
    .sort({ timestamp: 1, _id: 1 })
    .lean();

  const firstLoginLog = logs.find(
    (entry) => entry.status === "online" && entry.timestamp >= start && entry.timestamp < end,
  );
  const lastLogoutLog = [...logs]
    .reverse()
    .find(
      (entry) =>
        entry.status === "offline" &&
        entry.timestamp >= start &&
        entry.timestamp < end,
    );

  let activeSince = null;
  let totalMs = 0;
  for (const entry of logs) {
    const ts = new Date(entry.timestamp);
    if (entry.status === "online") {
      if (!activeSince) activeSince = ts;
      continue;
    }
    if (entry.status === "offline" && activeSince) {
      totalMs += clampRange(activeSince, ts, start, end);
      activeSince = null;
    }
  }
  if (activeSince) {
    totalMs += clampRange(activeSince, end, start, end);
  }

  return {
    userId: String(userId),
    dayStart: start,
    dayEnd: end,
    firstLoginAt: firstLoginLog?.timestamp || null,
    lastLogoutAt: lastLogoutLog?.timestamp || null,
    screenTimeMs: totalMs,
    screenTimeMinutes: Number((totalMs / 60000).toFixed(2)),
    screenTimeHours: Number((totalMs / 3600000).toFixed(2)),
  };
};

const PresenceLog = mongoose.model("PresenceLog", presenceSchema);

export default PresenceLog;

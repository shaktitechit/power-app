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
    mode: {
      type: String,
      enum: ["onsite", "offsite", null],
      default: null,
      index: true,
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

  // First onsite / offsite login timestamps
  const onsiteLoginLog = logs.find(
    (entry) =>
      entry.status === "online" &&
      entry.mode === "onsite" &&
      entry.timestamp >= start &&
      entry.timestamp < end,
  );
  const offsiteLoginLog = logs.find(
    (entry) =>
      entry.status === "online" &&
      entry.mode === "offsite" &&
      entry.timestamp >= start &&
      entry.timestamp < end,
  );

  // Track screen time split by mode using the mode that was active
  // at the time of each login event.
  let activeSince = null;
  let activeMode = null;
  let totalMs = 0;
  let onsiteMs = 0;
  let offsiteMs = 0;

  for (const entry of logs) {
    const ts = new Date(entry.timestamp);
    if (entry.status === "online") {
      if (!activeSince) {
        activeSince = ts;
        activeMode = entry.mode || null;
      }
      continue;
    }
    if (entry.status === "offline" && activeSince) {
      const ms = clampRange(activeSince, ts, start, end);
      totalMs += ms;
      if (activeMode === "onsite") onsiteMs += ms;
      else if (activeMode === "offsite") offsiteMs += ms;
      activeSince = null;
      activeMode = null;
    }
  }
  if (activeSince) {
    const ms = clampRange(activeSince, end, start, end);
    totalMs += ms;
    if (activeMode === "onsite") onsiteMs += ms;
    else if (activeMode === "offsite") offsiteMs += ms;
  }

  return {
    userId: String(userId),
    dayStart: start,
    dayEnd: end,
    firstLoginAt: firstLoginLog?.timestamp || null,
    lastLogoutAt: lastLogoutLog?.timestamp || null,
    onsiteLoginAt: onsiteLoginLog?.timestamp || null,
    offsiteLoginAt: offsiteLoginLog?.timestamp || null,
    screenTimeMs: totalMs,
    screenTimeMinutes: Number((totalMs / 60000).toFixed(2)),
    screenTimeHours: Number((totalMs / 3600000).toFixed(2)),
    onsiteScreenTimeMs: onsiteMs,
    onsiteScreenTimeMinutes: Number((onsiteMs / 60000).toFixed(2)),
    onsiteScreenTimeHours: Number((onsiteMs / 3600000).toFixed(2)),
    offsiteScreenTimeMs: offsiteMs,
    offsiteScreenTimeMinutes: Number((offsiteMs / 60000).toFixed(2)),
    offsiteScreenTimeHours: Number((offsiteMs / 3600000).toFixed(2)),
  };
};

const PresenceLog = mongoose.model("PresenceLog", presenceSchema);

export default PresenceLog;

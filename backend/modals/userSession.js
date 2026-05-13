import mongoose from "mongoose";

const userSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      select: false,
    },
    previousTokenHash: {
      type: String,
      default: null,
      select: false,
    },
    userAgent: {
      type: String,
      default: null,
    },
    ip: {
      type: String,
      default: null,
    },
    location: {
      type: {
        lat: Number,
        lng: Number,
        name: String,
      },
      default: null,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    revokedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

userSessionSchema.index({ userId: 1, revokedAt: 1 });

const UserSession = mongoose.model("UserSession", userSessionSchema);

export default UserSession;

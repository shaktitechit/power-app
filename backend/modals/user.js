import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { softDeletePlugin } from "./plugins/softDelete.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      match: [/.+\@.+\..+/, "Please enter a valid email address"],
    },

    password: {
      type: String,
      minLength: 6,
    },

    role: {
      type: String,
      required: true,
      enum: ["super_admin", "admin", "manager", "auditor"],
      default: "auditor",
    },

    /** Optional per-user policy rows merged after rolePolicies[role]. */
    permissions: [
      {
        resource: { type: String, trim: true },
        actions: [{ type: String, trim: true }],
        scope: {
          type: String,
          enum: ["all", "assigned", "own", "none"],
          default: "none",
        },
      },
    ],

    phone: {
      type: String,
      trim: true,
      default: null,
    },

    status: {
      type: String,
      required: true,
      enum: ["active", "inactive"],
      default: "active",
    },

    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // 🔐 Auth Providers
    googleId: {
      type: String,
      default: null,
    },

    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    // 📸 Selfie Verification
    latestSelfieUrl: {
      type: String,
      default: null,
    },

    lastSelfieAt: {
      type: Date,
      default: null,
    },

  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
);

userSchema.plugin(softDeletePlugin);
userSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { deleted_at: null } },
);

// 🔐 Password Hash Middleware
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// 🔑 Match Password Method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;

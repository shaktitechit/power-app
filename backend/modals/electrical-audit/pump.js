import mongoose from "mongoose";

import { softDeletePlugin } from "../plugins/softDelete.js";

const pumpSchema = new mongoose.Schema(
  {
    facility_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Facility",
      required: true,
    },

    utility_account_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UtilityAccount",
      required: true,
    },

    pump_tag_number: {
      type: String,
      required: true,
      trim: true,
    },

    make_model: {
      type: String,
      trim: true,
    },

    rated_power_kW_or_HP: {
      type: Number,
      min: 0,
    },

    rated_flow_m3_per_hr: {
      type: Number,
      min: 0,
    },

    rated_head_m: {
      type: Number,
      min: 0,
    },

    rated_speed_RPM: {
      type: Number,
      min: 0,
    },

    number_of_stages: {
      type: Number,
      min: 0,
    },

    year_of_installation: {
      type: Number,
      min: 1900,
      max: new Date().getFullYear(),
    },

    // 🔍 Audit metadata (recommended)
    audit_date: {
      type: Date,
      default: Date.now,
    },

    auditor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // 📂 Documents (manuals, pump curves, images, reports)
    documents: [
      {
        fileUrl: {
          type: String,
          required: true,
        },
        fileType: {
          type: String,
          enum: ["image", "pdf"],
          required: true,
        },
        fileName: {
          type: String,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
);

pumpSchema.plugin(softDeletePlugin);

// 🔒 Prevent duplicate pump tag per utility account (among non-deleted rows)
pumpSchema.index(
  { utility_account_id: 1, pump_tag_number: 1 },
  { unique: true, partialFilterExpression: { deleted_at: null } },
);

// 🔍 Indexes
pumpSchema.index({ facility_id: 1 });
pumpSchema.index({ utility_account_id: 1 });

const Pump = mongoose.model("Pump", pumpSchema);

export default Pump;

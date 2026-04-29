import mongoose from "mongoose";
import safetyAuditChecklistItemSchema from "./safetyAuditChecklistItem.js";
import safetyAuditDocumentSchema from "./safetyAuditDocuments.js";

const safetyThermographyAuditSchema = new mongoose.Schema(
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

    inspection_date: Date,
    inspected_by: String,
    location: String,
    max_temperature_c: Number,
    delta_temperature_c: Number,

    urgency: {
      type: String,
      enum: ["normal", "medium", "high", "critical", ""],
      default: "",
    },

    images: [
      {
        thermal_image_url: String,
        visible_image_url: String,
        remarks: String,
      },
    ],

    audit_date: {
      type: Date,
      default: Date.now,
    },

    auditor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    items: [safetyAuditChecklistItemSchema],

    documents: [safetyAuditDocumentSchema],

    status: {
      type: String,
      enum: ["draft", "completed", "approved"],
      default: "draft",
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

safetyThermographyAuditSchema.index({
  facility_id: 1,
  utility_account_id: 1,
  audit_date: -1,
});

export default mongoose.model(
  "SafetyThermographyAudit",
  safetyThermographyAuditSchema
);
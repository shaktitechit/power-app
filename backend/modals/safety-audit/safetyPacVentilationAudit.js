import mongoose from "mongoose";
import safetyAuditChecklistItemSchema from "./safetyAuditChecklistItem.js";
import safetyAuditDocumentSchema from "./safetyAuditDocuments.js";

const safetyPacVentilationAuditSchema = new mongoose.Schema(
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

    unit_name: String,

    unit_type: {
      type: String,
      enum: ["pac", "ac", "ventilation", "exhaust", "other"],
      default: "pac",
    },

    location: String,
    room_temperature_c: Number,
    relative_humidity_percent: Number,

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

safetyPacVentilationAuditSchema.index({
  facility_id: 1,
  utility_account_id: 1,
  audit_date: -1,
});

export default mongoose.model(
  "SafetyPacVentilationAudit",
  safetyPacVentilationAuditSchema
);
import mongoose from "mongoose";
import safetyAuditChecklistItemSchema from "./safetyAuditChecklistItem.js";
import safetyAuditDocumentSchema from "./safetyAuditDocuments.js";

const safetyEarthingAuditSchema = new mongoose.Schema(
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

    pit_name: String,

    pit_type: {
      type: String,
      enum: ["power", "neutral", "body", "instrument", "la", "other", ""],
      default: "",
    },

    resistance_ohm: Number,
    test_date: Date,
    due_date: Date,
    location: String,

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

safetyEarthingAuditSchema.index({
  facility_id: 1,
  utility_account_id: 1,
  audit_date: -1,
});

export default mongoose.model(
  "SafetyEarthingAudit",
  safetyEarthingAuditSchema
);
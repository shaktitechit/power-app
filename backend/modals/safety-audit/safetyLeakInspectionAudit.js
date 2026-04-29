import mongoose from "mongoose";
import safetyAuditChecklistItemSchema from "./safetyAuditChecklistItem.js";
import safetyAuditDocumentSchema from "./safetyAuditDocuments.js";

const safetyLeakInspectionAuditSchema = new mongoose.Schema(
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

    equipment_type: {
      type: String,
      enum: ["transformer", "ups_battery", "dg", "ac", "other"],
      required: true,
    },

    equipment_name: String,
    location: String,
    leakage_found: {
      type: Boolean,
      default: false,
    },

    remarks: String,

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

safetyLeakInspectionAuditSchema.index({
  facility_id: 1,
  utility_account_id: 1,
  audit_date: -1,
});

export default mongoose.model(
  "SafetyLeakInspectionAudit",
  safetyLeakInspectionAuditSchema
);
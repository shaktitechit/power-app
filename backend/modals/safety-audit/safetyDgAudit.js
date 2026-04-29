import mongoose from "mongoose";
import safetyAuditChecklistItemSchema from "./safetyAuditChecklistItem.js";
import safetyAuditDocumentSchema from "./safetyAuditDocuments.js";

const safetyDgAuditSchema = new mongoose.Schema(
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

    dg_set_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DGSet",
    },

    name: String,
    capacity_kva: Number,
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

safetyDgAuditSchema.index({
  facility_id: 1,
  utility_account_id: 1,
  dg_set_id: 1,
  audit_date: -1,
});

export default mongoose.model("SafetyDgAudit", safetyDgAuditSchema);
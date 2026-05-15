import mongoose from "mongoose";

import { softDeletePlugin } from "../plugins/softDelete.js";
import safetyAuditChecklistItemSchema from "./safetyAuditChecklistItem.js";
import safetyAuditDocumentSchema from "./safetyAuditDocuments.js";

const safetyTransformerAuditSchema = new mongoose.Schema(
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

    transformer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transformer",
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

safetyTransformerAuditSchema.plugin(softDeletePlugin);

safetyTransformerAuditSchema.index({
  facility_id: 1,
  utility_account_id: 1,
  transformer_id: 1,
  audit_date: -1,
});

export default mongoose.model(
  "SafetyTransformerAudit",
  safetyTransformerAuditSchema
);
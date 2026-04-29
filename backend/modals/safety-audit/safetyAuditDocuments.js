import mongoose from "mongoose";

/** Stored attachment metadata — uploads go through `file-management` via `uploadBufferToFileManagement`. */
const safetyAuditDocumentSchema = new mongoose.Schema(
  {
    fileUrl: { type: String },
    fileType: {
      type: String,
      enum: ["image", "pdf"],
    },
    fileName: { type: String },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

export default safetyAuditDocumentSchema;

import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null, // null for system notifications
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    message: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ["facility", "utility", "enquiry", "system"],
        required: true,
    },
    referenceId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true,
    },
    superAdminRead: {
        type: Boolean,
        default: false,
        index: true,
    },
}, {
    timestamps: {
        createdAt: "created_at",
        updatedAt: "updated_at",
    },
});

notificationSchema.index({ recipient: 1, created_at: -1 });

export default mongoose.model("Notification", notificationSchema);

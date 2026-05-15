import mongoose from "mongoose";

import { softDeletePlugin } from "./plugins/softDelete.js";

const followUpSchema = new mongoose.Schema({
    enquiry_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Enquiry",
        required: true,
    },

    followup_date: {
        type: Date,
        required: true,
    },

    mode: {
        type: String,
        enum: ["call", "email", "meeting", "whatsapp"],
    },

    remarks: String,

    outcome: {
        type: String,
        enum: [
            "no_response",
            "interested",
            "not_interested",
            "callback_later",
            "meeting_scheduled"
        ],
    },

    next_followup_date: Date,

    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

}, {
    timestamps: true,
});

followUpSchema.plugin(softDeletePlugin);

// Activity timeline per enquiry (prefix covers enquiry_id-only lookups)
followUpSchema.index({ enquiry_id: 1, createdAt: -1 });

// Creator activity reports
followUpSchema.index({ created_by: 1, followup_date: -1 });

export default mongoose.model("FollowUp", followUpSchema);

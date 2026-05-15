import mongoose from "mongoose";

import { softDeletePlugin } from "./plugins/softDelete.js";

const quotationSchema = new mongoose.Schema({
    enquiry_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Enquiry",
        required: true,
    },

    quotation_number: {
        type: String,
        trim: true,
    },

    amount: {
        type: Number,
        required: true,
    },

    line_items: [
        {
            audit_type: {
                type: String,
                enum: [
                    "Electrical Energy Audit",
                    "Electrical Safety Audit",
                    "Thermal Audit",
                    "Lightning Arrester Audit"
                ],
            },
            description: String,
            price: Number,
        }
    ],

    status: {
        type: String,
        /** Keep in sync with `QUOTATION_STATUSES` in `enquiryController.js`. */
        enum: [
            "draft",
            "pending_approval",
            "sent",
            "viewed",
            "revision_requested",
            "approved",
            "rejected",
            "expired"
        ],
        default: "draft",
    },

    valid_till: Date,

    document_url: String,

    notes: String,

    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

}, {
    timestamps: true,
});

quotationSchema.plugin(softDeletePlugin);

// Non-deleted rows only — allows reusing a number after soft-delete
quotationSchema.index(
    { quotation_number: 1 },
    {
        unique: true,
        partialFilterExpression: {
            deleted_at: null,
            quotation_number: { $exists: true, $nin: [null, ""] },
        },
    },
);

quotationSchema.index({ enquiry_id: 1, createdAt: -1 });

quotationSchema.index({ status: 1, updatedAt: -1 });

export default mongoose.model("Quotation", quotationSchema);

import asyncHandler from "../middlewares/asyncHandler.js";
import crypto from "crypto";
import mongoose from "mongoose";
import Enquiry from "../modals/enquiry.js";
import FollowUp from "../modals/followUp.js";
import Quotation from "../modals/quotation.js";
import Facility from "../modals/facility.js";
import { createRecentActivity } from "../helpers/createRecentActivity.js";
import { buildActivityMessage } from "../helpers/buildActivityMessage.js";
import { isAdmin } from "../services/authorization/index.js";
import { createNotification } from "../services/notificationService.js";

const ENQUIRY_STATUSES = [
  "new",
  "contacted",
  "in_discussion",
  "quoted",
  "negotiation",
  "won",
  "lost",
  "dropped",
];

/** Keep in sync with `backend/modals/quotation.js` `status.enum`. */
const QUOTATION_STATUSES = [
  "draft",
  "pending_approval",
  "sent",
  "viewed",
  "revision_requested",
  "approved",
  "rejected",
  "expired",
];

const AUDIT_TYPES = [
  "Electrical Energy Audit",
  "Electrical Safety Audit",
  "Thermal Audit",
  "Lightning Arrester Audit",
];

function parseClientRepresentatives(client_representatives) {
  if (!client_representatives) return [];

  let parsed = [];
  if (Array.isArray(client_representatives)) {
    parsed = client_representatives;
  } else {
    try {
      parsed = JSON.parse(client_representatives);
    } catch {
      parsed = [];
    }
  }

  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((rep) => ({
      name: String(rep?.name || "").trim(),
      contact_number: String(rep?.contact_number || "").trim(),
      email: String(rep?.email || "").trim(),
    }))
    .filter((rep) => rep.name || rep.contact_number || rep.email);
}

async function generateUniqueQuotationNumber() {
  const maxAttempts = 12;
  for (let i = 0; i < maxAttempts; i++) {
    const d = new Date();
    const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(
      2,
      "0",
    )}${String(d.getDate()).padStart(2, "0")}`;
    const rand = crypto
      .randomBytes(4)
      .toString("hex")
      .toUpperCase()
      .slice(0, 8);
    const candidate = `QT-${ymd}-${rand}`;
    const taken = await Quotation.findOne({
      quotation_number: candidate,
      deleted_at: null,
    })
      .select("_id")
      .lean();
    if (!taken) return candidate;
  }
  return `QT-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

function parseRequestedAuditTypes(value) {
  if (value == null) return undefined;
  let arr = value;
  if (typeof value === "string") {
    try {
      arr = JSON.parse(value);
    } catch {
      arr = [value];
    }
  }
  if (!Array.isArray(arr)) return undefined;
  return arr.filter((t) => AUDIT_TYPES.includes(t));
}

function parseOptionalObjectId(value) {
  if (value == null || value === "") return null;
  if (!mongoose.Types.ObjectId.isValid(value)) return undefined;
  return new mongoose.Types.ObjectId(value);
}

function displayEnquiryName(enquiry) {
  return enquiry?.name?.trim() || "Enquiry";
}

/**
 * @param {{ _id?: unknown } | null | undefined} user
 * @param {string} enquiryId
 */
async function resolveAccessibleEnquiry(user, enquiryId) {
  if (!user?._id || !enquiryId) return null;
  if (!mongoose.Types.ObjectId.isValid(enquiryId)) return null;

  const enquiry = await Enquiry.findById(enquiryId);
  if (!enquiry) return null;

  if (isAdmin(user)) return enquiry;

  const uid = user._id.toString();
  if (enquiry.created_by?.toString() === uid) return enquiry;

  const assignee = enquiry.assigned_to;
  if (assignee && assignee.toString() === uid) return enquiry;

  return null;
}

function buildEnquiryPopulate() {
  return [
    { path: "assigned_to", select: "name email role" },
    { path: "created_by", select: "name email role" },
    { path: "converted_facility_id", select: "name city status" },
  ];
}

// --- Enquiries ---

// @route   POST /api/v1/enquiries
const createEnquiry = asyncHandler(async (req, res) => {
  const {
    name,
    city,
    address,
    client_representative,
    client_contact_number,
    client_email,
    client_representatives,
    assigned_to: assignedRaw,
    enquiry_status,
    source,
    expected_value,
    requested_audit_types,
    notes,
    next_followup_date,
  } = req.body;

  if (!name || !city) {
    res.status(400);
    throw new Error("Name and city are required");
  }

  const parsedClientReps = parseClientRepresentatives(client_representatives);
  const fallbackClientReps =
    parsedClientReps.length > 0
      ? parsedClientReps
      : client_representative || client_contact_number || client_email
        ? [
            {
              name: String(client_representative || "").trim(),
              contact_number: String(client_contact_number || "").trim(),
              email: String(client_email || "").trim(),
            },
          ]
        : [];

  const assigned_to = parseOptionalObjectId(assignedRaw);
  if (assignedRaw && assigned_to === undefined) {
    res.status(400);
    throw new Error("Invalid assigned_to");
  }

  if (
    enquiry_status != null &&
    !ENQUIRY_STATUSES.includes(String(enquiry_status))
  ) {
    res.status(400);
    throw new Error("Invalid enquiry_status");
  }

  const auditTypes = parseRequestedAuditTypes(requested_audit_types);

  let nextFollowup = undefined;
  if (next_followup_date) {
    const d = new Date(next_followup_date);
    if (Number.isNaN(d.getTime())) {
      res.status(400);
      throw new Error("Invalid next_followup_date");
    }
    nextFollowup = d;
  }

  const enquiry = await Enquiry.create({
    name: String(name).trim(),
    city: String(city).trim(),
    address: address != null ? String(address).trim() : undefined,
    client_representative:
      client_representative != null
        ? String(client_representative).trim()
        : undefined,
    client_contact_number,
    client_email,
    client_representatives: fallbackClientReps,
    assigned_to: assigned_to || undefined,
    enquiry_status: enquiry_status || "new",
    source: source != null ? String(source).trim() : undefined,
    expected_value:
      expected_value !== undefined && expected_value !== ""
        ? Number(expected_value)
        : undefined,
    requested_audit_types: auditTypes ?? [],
    notes: notes != null ? String(notes).trim() : undefined,
    next_followup_date: nextFollowup,
    created_by: req.user._id,
  });

  await enquiry.populate(buildEnquiryPopulate());

  if (enquiry.assigned_to) {
    const io = req.app.get("io");
    await createNotification(io, {
      recipient: enquiry.assigned_to._id,
      sender: req.user._id,
      title: "New Enquiry Assigned",
      message: `You have been assigned to enquiry: ${displayEnquiryName(enquiry)}`,
      type: "enquiry",
      referenceId: enquiry._id,
    });
  }

  await createRecentActivity({
    actor: req.user,
    action: "created",
    entity_type: "enquiry",
    entity_id: enquiry._id,
    entity_name: displayEnquiryName(enquiry),
    message: buildActivityMessage({
      actorName: req.user?.name || "User",
      action: "created",
      entityLabel: "enquiry",
      entityName: displayEnquiryName(enquiry),
    }),
    meta: { city: enquiry.city, enquiry_status: enquiry.enquiry_status },
  });

  res.status(201).json({
    success: true,
    message: "Enquiry created successfully",
    data: enquiry,
  });
});

// @route   GET /api/v1/enquiries
const getEnquiries = asyncHandler(async (req, res) => {
  const query = {};

  if (req.query.enquiry_status) {
    if (!ENQUIRY_STATUSES.includes(String(req.query.enquiry_status))) {
      res.status(400);
      throw new Error("Invalid enquiry_status filter");
    }
    query.enquiry_status = req.query.enquiry_status;
  }

  if (req.query.city) {
    query.city = new RegExp(String(req.query.city).trim(), "i");
  }

  if (req.query.assigned_to) {
    const aid = parseOptionalObjectId(req.query.assigned_to);
    if (!aid) {
      res.status(400);
      throw new Error("Invalid assigned_to filter");
    }
    query.assigned_to = aid;
  }

  let cursor;

  if (isAdmin(req.user)) {
    cursor = Enquiry.find(query);
  } else {
    query.$or = [
      { created_by: req.user._id },
      { assigned_to: req.user._id },
    ];
    cursor = Enquiry.find(query);
  }

  const enquiries = await cursor
    .populate(buildEnquiryPopulate())
    .sort({ created_at: -1 });

  res.status(200).json({
    success: true,
    count: enquiries.length,
    data: enquiries,
  });
});

// @route   GET /api/v1/enquiries/:id
const getEnquiryById = asyncHandler(async (req, res) => {
  const enquiry = await resolveAccessibleEnquiry(req.user, req.params.id);

  if (!enquiry) {
    res.status(404);
    throw new Error("Enquiry not found");
  }

  await enquiry.populate(buildEnquiryPopulate());

  res.status(200).json({
    success: true,
    data: enquiry,
  });
});

// @route   PUT /api/v1/enquiries/:id
const updateEnquiry = asyncHandler(async (req, res) => {
  const enquiry = await resolveAccessibleEnquiry(req.user, req.params.id);

  if (!enquiry) {
    res.status(404);
    throw new Error("Enquiry not found");
  }

  const {
    name,
    city,
    address,
    client_representative,
    client_contact_number,
    client_email,
    client_representatives,
    assigned_to: assignedRaw,
    enquiry_status,
    source,
    expected_value,
    requested_audit_types,
    notes,
    next_followup_date,
    is_converted_to_facility,
    converted_facility_id: convertedFacilityRaw,
  } = req.body;

  const updatedFields = Object.keys(req.body || {});

  if (name !== undefined) enquiry.name = String(name).trim();
  if (city !== undefined) enquiry.city = String(city).trim();
  if (address !== undefined) enquiry.address = String(address).trim();

  if (client_representative !== undefined) {
    enquiry.client_representative = client_representative
      ? String(client_representative).trim()
      : "";
  }
  if (client_contact_number !== undefined) {
    enquiry.client_contact_number = client_contact_number;
  }
  if (client_email !== undefined) enquiry.client_email = client_email;

  if (client_representatives !== undefined) {
    enquiry.client_representatives =
      parseClientRepresentatives(client_representatives);
  }

  if (assignedRaw !== undefined) {
    if (assignedRaw === null || assignedRaw === "") {
      enquiry.assigned_to = undefined;
    } else {
      const aid = parseOptionalObjectId(assignedRaw);
      if (!aid) {
        res.status(400);
        throw new Error("Invalid assigned_to");
      }
      enquiry.assigned_to = aid;
    }
  }

  if (enquiry_status !== undefined) {
    if (!ENQUIRY_STATUSES.includes(String(enquiry_status))) {
      res.status(400);
      throw new Error("Invalid enquiry_status");
    }
    enquiry.enquiry_status = enquiry_status;
  }

  if (source !== undefined) enquiry.source = source ? String(source).trim() : "";
  if (expected_value !== undefined) {
    enquiry.expected_value =
      expected_value === "" || expected_value == null
        ? undefined
        : Number(expected_value);
  }

  if (requested_audit_types !== undefined) {
    const auditTypes = parseRequestedAuditTypes(requested_audit_types);
    enquiry.requested_audit_types = auditTypes ?? [];
  }

  if (notes !== undefined) enquiry.notes = notes ? String(notes).trim() : "";

  if (next_followup_date !== undefined) {
    if (next_followup_date === null || next_followup_date === "") {
      enquiry.next_followup_date = undefined;
    } else {
      const d = new Date(next_followup_date);
      if (Number.isNaN(d.getTime())) {
        res.status(400);
        throw new Error("Invalid next_followup_date");
      }
      enquiry.next_followup_date = d;
    }
  }

  if (is_converted_to_facility !== undefined) {
    enquiry.is_converted_to_facility = Boolean(is_converted_to_facility);
  }

  if (convertedFacilityRaw !== undefined) {
    if (convertedFacilityRaw === null || convertedFacilityRaw === "") {
      enquiry.converted_facility_id = undefined;
    } else {
      const fid = parseOptionalObjectId(convertedFacilityRaw);
      if (!fid) {
        res.status(400);
        throw new Error("Invalid converted_facility_id");
      }
      const facilityExists = await Facility.exists({ _id: fid });
      if (!facilityExists) {
        res.status(400);
        throw new Error("Facility not found");
      }
      enquiry.converted_facility_id = fid;
    }
  }

  const updated = await enquiry.save();
  await updated.populate(buildEnquiryPopulate());

  await createRecentActivity({
    actor: req.user,
    action: "updated",
    entity_type: "enquiry",
    entity_id: updated._id,
    entity_name: displayEnquiryName(updated),
    message: buildActivityMessage({
      actorName: req.user?.name || "User",
      action: "updated",
      entityLabel: "enquiry",
      entityName: displayEnquiryName(updated),
    }),
    meta: {
      updated_fields: [...new Set(updatedFields)],
      enquiry_status: updated.enquiry_status,
    },
  });

  const io = req.app.get("io");
  
  if (assignedRaw !== undefined && updated.assigned_to) {
      await createNotification(io, {
          recipient: updated.assigned_to._id,
          sender: req.user._id,
          title: "New Enquiry Assigned",
          message: `You have been assigned to enquiry: ${displayEnquiryName(updated)}`,
          type: "enquiry",
          referenceId: updated._id,
      });
  }

  if (enquiry_status !== undefined) {
      const recipientId = updated.assigned_to?._id || updated.created_by?._id;
      if (recipientId) {
          await createNotification(io, {
              recipient: recipientId,
              sender: req.user._id,
              title: "Enquiry Status Updated",
              message: `Enquiry ${displayEnquiryName(updated)} status changed to ${updated.enquiry_status}`,
              type: "enquiry",
              referenceId: updated._id,
          });
      }
  }

  res.status(200).json({
    success: true,
    message: "Enquiry updated successfully",
    data: updated,
  });
});

// @route   DELETE /api/v1/enquiries/:id
const deleteEnquiry = asyncHandler(async (req, res) => {
  const enquiry = await resolveAccessibleEnquiry(req.user, req.params.id);

  if (!enquiry) {
    res.status(404);
    throw new Error("Enquiry not found");
  }

  const name = displayEnquiryName(enquiry);

  await FollowUp.softDeleteMany({ enquiry_id: enquiry._id });
  await Quotation.softDeleteMany({ enquiry_id: enquiry._id });
  await enquiry.softDelete();

  await createRecentActivity({
    actor: req.user,
    action: "deleted",
    entity_type: "enquiry",
    entity_id: enquiry._id,
    entity_name: name,
    message: buildActivityMessage({
      actorName: req.user?.name || "User",
      action: "deleted",
      entityLabel: "enquiry",
      entityName: name,
    }),
  });

  res.status(200).json({
    success: true,
    message: "Enquiry deleted successfully",
  });
});

// --- Follow-ups ---

// @route   GET /api/v1/enquiries/:enquiryId/follow-ups
const getFollowUps = asyncHandler(async (req, res) => {
  const enquiry = await resolveAccessibleEnquiry(req.user, req.params.enquiryId);
  if (!enquiry) {
    res.status(404);
    throw new Error("Enquiry not found");
  }

  const rows = await FollowUp.find({ enquiry_id: enquiry._id })
    .populate("created_by", "name email role")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: rows.length,
    data: rows,
  });
});

// @route   POST /api/v1/enquiries/:enquiryId/follow-ups
const createFollowUp = asyncHandler(async (req, res) => {
  const enquiry = await resolveAccessibleEnquiry(req.user, req.params.enquiryId);
  if (!enquiry) {
    res.status(404);
    throw new Error("Enquiry not found");
  }

  const {
    followup_date,
    mode,
    remarks,
    outcome,
    next_followup_date,
  } = req.body;

  if (!followup_date) {
    res.status(400);
    throw new Error("followup_date is required");
  }

  const fd = new Date(followup_date);
  if (Number.isNaN(fd.getTime())) {
    res.status(400);
    throw new Error("Invalid followup_date");
  }

  let nextFd = undefined;
  if (next_followup_date) {
    const nd = new Date(next_followup_date);
    if (Number.isNaN(nd.getTime())) {
      res.status(400);
      throw new Error("Invalid next_followup_date");
    }
    nextFd = nd;
  }

  const row = await FollowUp.create({
    enquiry_id: enquiry._id,
    followup_date: fd,
    mode,
    remarks: remarks != null ? String(remarks).trim() : undefined,
    outcome,
    next_followup_date: nextFd,
    created_by: req.user._id,
  });

  await row.populate("created_by", "name email role");

  await createRecentActivity({
    actor: req.user,
    action: "created",
    entity_type: "follow_up",
    entity_id: row._id,
    entity_name: displayEnquiryName(enquiry),
    message: buildActivityMessage({
      actorName: req.user?.name || "User",
      action: "created",
      entityLabel: "follow-up",
      entityName: displayEnquiryName(enquiry),
    }),
    meta: { enquiry_id: enquiry._id },
  });

  res.status(201).json({
    success: true,
    message: "Follow-up recorded successfully",
    data: row,
  });
});

// @route   GET /api/v1/enquiries/:enquiryId/follow-ups/:followUpId
const getFollowUpById = asyncHandler(async (req, res) => {
  const enquiry = await resolveAccessibleEnquiry(req.user, req.params.enquiryId);
  if (!enquiry) {
    res.status(404);
    throw new Error("Enquiry not found");
  }

  const row = await FollowUp.findOne({
    _id: req.params.followUpId,
    enquiry_id: enquiry._id,
  }).populate("created_by", "name email role");

  if (!row) {
    res.status(404);
    throw new Error("Follow-up not found");
  }

  res.status(200).json({ success: true, data: row });
});

// @route   PUT /api/v1/enquiries/:enquiryId/follow-ups/:followUpId
const updateFollowUp = asyncHandler(async (req, res) => {
  const enquiry = await resolveAccessibleEnquiry(req.user, req.params.enquiryId);
  if (!enquiry) {
    res.status(404);
    throw new Error("Enquiry not found");
  }

  const row = await FollowUp.findOne({
    _id: req.params.followUpId,
    enquiry_id: enquiry._id,
  });

  if (!row) {
    res.status(404);
    throw new Error("Follow-up not found");
  }

  const {
    followup_date,
    mode,
    remarks,
    outcome,
    next_followup_date,
  } = req.body;

  const updatedFields = Object.keys(req.body || {});

  if (followup_date !== undefined) {
    const d = new Date(followup_date);
    if (Number.isNaN(d.getTime())) {
      res.status(400);
      throw new Error("Invalid followup_date");
    }
    row.followup_date = d;
  }
  if (mode !== undefined) row.mode = mode;
  if (remarks !== undefined) row.remarks = String(remarks).trim();
  if (outcome !== undefined) row.outcome = outcome;

  if (next_followup_date !== undefined) {
    if (next_followup_date === null || next_followup_date === "") {
      row.next_followup_date = undefined;
    } else {
      const nd = new Date(next_followup_date);
      if (Number.isNaN(nd.getTime())) {
        res.status(400);
        throw new Error("Invalid next_followup_date");
      }
      row.next_followup_date = nd;
    }
  }

  const updated = await row.save();
  await updated.populate("created_by", "name email role");

  await createRecentActivity({
    actor: req.user,
    action: "updated",
    entity_type: "follow_up",
    entity_id: updated._id,
    entity_name: displayEnquiryName(enquiry),
    message: buildActivityMessage({
      actorName: req.user?.name || "User",
      action: "updated",
      entityLabel: "follow-up",
      entityName: displayEnquiryName(enquiry),
    }),
    meta: { enquiry_id: enquiry._id, updated_fields: [...new Set(updatedFields)] },
  });

  res.status(200).json({
    success: true,
    message: "Follow-up updated successfully",
    data: updated,
  });
});

// @route   DELETE /api/v1/enquiries/:enquiryId/follow-ups/:followUpId
const deleteFollowUp = asyncHandler(async (req, res) => {
  const enquiry = await resolveAccessibleEnquiry(req.user, req.params.enquiryId);
  if (!enquiry) {
    res.status(404);
    throw new Error("Enquiry not found");
  }

  const row = await FollowUp.findOne({
    _id: req.params.followUpId,
    enquiry_id: enquiry._id,
  });

  if (!row) {
    res.status(404);
    throw new Error("Follow-up not found");
  }

  await row.softDelete();

  await createRecentActivity({
    actor: req.user,
    action: "deleted",
    entity_type: "follow_up",
    entity_id: row._id,
    entity_name: displayEnquiryName(enquiry),
    message: buildActivityMessage({
      actorName: req.user?.name || "User",
      action: "deleted",
      entityLabel: "follow-up",
      entityName: displayEnquiryName(enquiry),
    }),
    meta: { enquiry_id: enquiry._id },
  });

  res.status(200).json({
    success: true,
    message: "Follow-up deleted successfully",
  });
});

// --- Quotations ---

// @route   GET /api/v1/enquiries/pending-quotations
// @access  super_admin only — quotations awaiting internal approval
const getPendingQuotationsForApproval = asyncHandler(async (req, res) => {
  if (!isAdmin(req.user)) {
    res.status(403);
    throw new Error("Not authorized");
  }

  const rows = await Quotation.find({
    status: "pending_approval",
    deleted_at: null,
  })
    .populate("enquiry_id", "name city enquiry_status")
    .populate("created_by", "name email role")
    .sort({ updatedAt: -1 });

  res.status(200).json({
    success: true,
    count: rows.length,
    data: rows,
  });
});

// @route   GET /api/v1/enquiries/:enquiryId/quotations
const getQuotations = asyncHandler(async (req, res) => {
  const enquiry = await resolveAccessibleEnquiry(req.user, req.params.enquiryId);
  if (!enquiry) {
    res.status(404);
    throw new Error("Enquiry not found");
  }

  const rows = await Quotation.find({ enquiry_id: enquiry._id })
    .populate("created_by", "name email role")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: rows.length,
    data: rows,
  });
});

// @route   POST /api/v1/enquiries/:enquiryId/quotations
const createQuotation = asyncHandler(async (req, res) => {
  const enquiry = await resolveAccessibleEnquiry(req.user, req.params.enquiryId);
  if (!enquiry) {
    res.status(404);
    throw new Error("Enquiry not found");
  }

  const { amount, line_items, valid_till, document_url, notes } = req.body;

  if (amount === undefined || amount === "") {
    res.status(400);
    throw new Error("amount is required");
  }

  const amt = Number(amount);
  if (Number.isNaN(amt)) {
    res.status(400);
    throw new Error("Invalid amount");
  }

  let validTill = undefined;
  if (valid_till) {
    const vt = new Date(valid_till);
    if (Number.isNaN(vt.getTime())) {
      res.status(400);
      throw new Error("Invalid valid_till");
    }
    validTill = vt;
  }

  let lines = [];
  if (Array.isArray(line_items)) {
    lines = line_items;
  } else if (typeof line_items === "string") {
    try {
      lines = JSON.parse(line_items);
    } catch {
      lines = [];
    }
  }

  try {
    const quotation_number = await generateUniqueQuotationNumber();
    const row = await Quotation.create({
      enquiry_id: enquiry._id,
      quotation_number,
      amount: amt,
      line_items: lines,
      status: "draft",
      valid_till: validTill,
      document_url:
        document_url != null ? String(document_url).trim() : undefined,
      notes: notes != null ? String(notes).trim() : undefined,
      created_by: req.user._id,
    });

    await row.populate("created_by", "name email role");

    await createRecentActivity({
      actor: req.user,
      action: "created",
      entity_type: "quotation",
      entity_id: row._id,
      entity_name: row.quotation_number || displayEnquiryName(enquiry),
      message: buildActivityMessage({
        actorName: req.user?.name || "User",
        action: "created",
        entityLabel: "quotation",
        entityName: row.quotation_number || displayEnquiryName(enquiry),
      }),
      meta: { enquiry_id: enquiry._id, amount: row.amount },
    });

    res.status(201).json({
      success: true,
      message: "Quotation created successfully",
      data: row,
    });
  } catch (err) {
    if (err?.code === 11000) {
      res.status(409);
      throw new Error("Quotation number already in use");
    }
    throw err;
  }
});

// @route   GET /api/v1/enquiries/:enquiryId/quotations/:quotationId
const getQuotationById = asyncHandler(async (req, res) => {
  const enquiry = await resolveAccessibleEnquiry(req.user, req.params.enquiryId);
  if (!enquiry) {
    res.status(404);
    throw new Error("Enquiry not found");
  }

  const row = await Quotation.findOne({
    _id: req.params.quotationId,
    enquiry_id: enquiry._id,
  }).populate("created_by", "name email role");

  if (!row) {
    res.status(404);
    throw new Error("Quotation not found");
  }

  res.status(200).json({ success: true, data: row });
});

// @route   PUT /api/v1/enquiries/:enquiryId/quotations/:quotationId
const updateQuotation = asyncHandler(async (req, res) => {
  const enquiry = await resolveAccessibleEnquiry(req.user, req.params.enquiryId);
  if (!enquiry) {
    res.status(404);
    throw new Error("Enquiry not found");
  }

  const row = await Quotation.findOne({
    _id: req.params.quotationId,
    enquiry_id: enquiry._id,
  });

  if (!row) {
    res.status(404);
    throw new Error("Quotation not found");
  }

  const {
    quotation_number,
    amount,
    line_items,
    status,
    valid_till,
    document_url,
    notes,
    workflow_remark,
  } = req.body;

  const updatedFields = Object.keys(req.body || {});

  if (quotation_number !== undefined) {
    row.quotation_number = quotation_number
      ? String(quotation_number).trim()
      : undefined;
  }
  if (amount !== undefined) {
    const amt = Number(amount);
    if (Number.isNaN(amt)) {
      res.status(400);
      throw new Error("Invalid amount");
    }
    row.amount = amt;
  }

  if (line_items !== undefined) {
    let lines = [];
    if (Array.isArray(line_items)) {
      lines = line_items;
    } else if (typeof line_items === "string") {
      try {
        lines = JSON.parse(line_items);
      } catch {
        lines = [];
      }
    }
    row.line_items = lines;
  }

  if (status !== undefined) {
    const s = String(status);
    if (!QUOTATION_STATUSES.includes(s)) {
      res.status(400);
      throw new Error("Invalid quotation status");
    }
    row.status = s;
  }

  if (valid_till !== undefined) {
    if (valid_till === null || valid_till === "") {
      row.valid_till = undefined;
    } else {
      const vt = new Date(valid_till);
      if (Number.isNaN(vt.getTime())) {
        res.status(400);
        throw new Error("Invalid valid_till");
      }
      row.valid_till = vt;
    }
  }

  if (document_url !== undefined) {
    row.document_url = document_url ? String(document_url).trim() : "";
  }
  if (notes !== undefined) row.notes = notes ? String(notes).trim() : "";

  if (
    workflow_remark != null &&
    String(workflow_remark).trim() !== ""
  ) {
    const wr = String(workflow_remark).trim();
    const statusLabel =
      status !== undefined ? String(status) : row.status;
    const line = `[${new Date().toISOString()}] Quotation workflow (${statusLabel}): ${wr}`;
    row.notes = row.notes ? `${row.notes}\n\n${line}` : line;
  }

  try {
    const updated = await row.save();
    await updated.populate("created_by", "name email role");

    await createRecentActivity({
      actor: req.user,
      action: "updated",
      entity_type: "quotation",
      entity_id: updated._id,
      entity_name: updated.quotation_number || displayEnquiryName(enquiry),
      message: buildActivityMessage({
        actorName: req.user?.name || "User",
        action: "updated",
        entityLabel: "quotation",
        entityName: updated.quotation_number || displayEnquiryName(enquiry),
      }),
      meta: {
        enquiry_id: enquiry._id,
        updated_fields: [...new Set(updatedFields)],
      },
    });

    res.status(200).json({
      success: true,
      message: "Quotation updated successfully",
      data: updated,
    });
  } catch (err) {
    if (err?.code === 11000) {
      res.status(409);
      throw new Error("Quotation number already in use");
    }
    throw err;
  }
});

// @route   DELETE /api/v1/enquiries/:enquiryId/quotations/:quotationId
const deleteQuotation = asyncHandler(async (req, res) => {
  const enquiry = await resolveAccessibleEnquiry(req.user, req.params.enquiryId);
  if (!enquiry) {
    res.status(404);
    throw new Error("Enquiry not found");
  }

  const row = await Quotation.findOne({
    _id: req.params.quotationId,
    enquiry_id: enquiry._id,
  });

  if (!row) {
    res.status(404);
    throw new Error("Quotation not found");
  }

  const wf = req.body?.workflow_remark;
  if (wf != null && String(wf).trim() !== "") {
    const line = `[${new Date().toISOString()}] Quotation deleted: ${String(wf).trim()}`;
    row.notes = row.notes ? `${row.notes}\n\n${line}` : line;
    await row.save();
  }

  await row.softDelete();

  await createRecentActivity({
    actor: req.user,
    action: "deleted",
    entity_type: "quotation",
    entity_id: row._id,
    entity_name: row.quotation_number || displayEnquiryName(enquiry),
    message: buildActivityMessage({
      actorName: req.user?.name || "User",
      action: "deleted",
      entityLabel: "quotation",
      entityName: row.quotation_number || displayEnquiryName(enquiry),
    }),
    meta: { enquiry_id: enquiry._id },
  });

  res.status(200).json({
    success: true,
    message: "Quotation deleted successfully",
  });
});

export {
  createEnquiry,
  getEnquiries,
  getEnquiryById,
  updateEnquiry,
  deleteEnquiry,
  getFollowUps,
  createFollowUp,
  getFollowUpById,
  updateFollowUp,
  deleteFollowUp,
  getQuotations,
  getPendingQuotationsForApproval,
  createQuotation,
  getQuotationById,
  updateQuotation,
  deleteQuotation,
};

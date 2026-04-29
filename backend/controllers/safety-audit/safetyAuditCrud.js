import asyncHandler from "../../middlewares/asyncHandler.js";
import mongoose from "mongoose";
import { uploadBufferToFileManagement } from "../../utils/fileManagementUpload.js";
import { createRecentActivity } from "../../helpers/createRecentActivity.js";
import { buildActivityMessage } from "../../helpers/buildActivityMessage.js";
import {
  isAdmin,
  resolveAccessibleFacility,
  resolveAccessibleUtilityAccount,
} from "../../services/authorization/index.js";

/**
 * Normalize JSON fields that may arrive as strings (e.g. multipart).
 * @param {Record<string, unknown>} body
 */
function normalizePayload(body) {
  const payload = { ...body };
  if (typeof payload.items === "string" && payload.items.trim()) {
    try {
      payload.items = JSON.parse(payload.items);
    } catch {
      delete payload.items;
    }
  }
  if (payload.audit_date && typeof payload.audit_date === "string") {
    const d = new Date(payload.audit_date);
    if (!Number.isNaN(d.getTime())) payload.audit_date = d;
  }
  return payload;
}

const DEFAULT_SAFETY_AUDIT_FOLDER = "safety-audits";

/**
 * @param {import("multer").File[]} files
 * @param {import("mongoose").Types.ObjectId | string} recordId
 * @param {string} folderKey
 */
async function uploadSafetyAuditDocuments(files = [], recordId, folderKey) {
  const uploadedDocuments = [];

  for (const file of files || []) {
    if (!file) continue;

    const uploaded = await uploadBufferToFileManagement(
      file,
      folderKey,
      recordId,
    );

    uploadedDocuments.push({
      fileUrl: uploaded.secure_url,
      fileType: file.mimetype === "application/pdf" ? "pdf" : "image",
      fileName: file.originalname,
    });
  }

  return uploadedDocuments;
}

/**
 * Standard list/detail populates. Only includes `transformer_id` / `dg_set_id` when that path
 * exists on the model (Mongoose strictPopulate rejects unknown paths).
 */
function applySafetyAuditPopulates(Model, query) {
  const paths = Model.schema.paths;
  let q = query
    .populate("facility_id", "name city")
    .populate("utility_account_id", "account_number")
    .populate("auditor_id", "name email");
  if (paths.transformer_id) {
    q = q.populate("transformer_id", "name capacity_kVA");
  }
  if (paths.dg_set_id) {
    q = q.populate("dg_set_id", "name capacity_kVA");
  }
  return q;
}

function defaultDisplayName(record) {
  return (
    record.name ||
    record.panel_name ||
    record.area_name ||
    record.equipment_name ||
    record.pit_name ||
    record.ups_name ||
    record.ldb_name ||
    record.unit_name ||
    record.elevator_name ||
    record.location ||
    (record.transformer_id ? "Transformer safety audit" : null) ||
    (record.dg_set_id ? "DG safety audit" : null) ||
    "Safety audit"
  );
}

/**
 * @param {import("mongoose").Model} Model
 * @param {{
 *   entityType: string;
 *   entityLabel: string;
 *   getDisplayName?: (record: Record<string, unknown>) => string;
 *   extraQueryKeys?: string[];
 *   documentsFolderKey?: string;
 * }} options
 */
export function createSafetyAuditCrudController(Model, options) {
  const {
    entityType,
    entityLabel,
    getDisplayName = defaultDisplayName,
    extraQueryKeys = [],
    documentsFolderKey = DEFAULT_SAFETY_AUDIT_FOLDER,
  } = options;

  const buildQueryFromRequest = (req) => {
    const { facility_id, utility_account_id, ...rest } = req.query;
    const query = {};
    if (facility_id) query.facility_id = facility_id;
    if (utility_account_id) query.utility_account_id = utility_account_id;
    for (const key of extraQueryKeys) {
      if (rest[key]) query[key] = rest[key];
    }
    return query;
  };

  const create = asyncHandler(async (req, res) => {
    const raw = normalizePayload(req.body || {});
    delete raw.documents;
    const { facility_id, utility_account_id } = raw;

    if (!facility_id || !utility_account_id) {
      res.status(400);
      throw new Error("facility_id and utility_account_id are required");
    }

    const facility = await resolveAccessibleFacility(req.user, facility_id);
    if (!facility) {
      res.status(403);
      throw new Error("No access to facility");
    }

    const utility = await resolveAccessibleUtilityAccount(
      req.user,
      utility_account_id,
    );
    if (!utility) {
      res.status(403);
      throw new Error("No access to utility account");
    }

    if (utility.facility_id.toString() !== String(facility_id)) {
      res.status(400);
      throw new Error("Utility account does not belong to selected facility");
    }

    const recordId = new mongoose.Types.ObjectId();
    const docs = await uploadSafetyAuditDocuments(
      req.files || [],
      recordId,
      documentsFolderKey,
    );

    const record = await Model.create({
      _id: recordId,
      ...raw,
      documents: docs,
      auditor_id: req.user?._id || raw.auditor_id,
    });

    await createRecentActivity({
      actor: req.user,
      action: "created",
      entity_type: entityType,
      entity_id: record._id,
      entity_name: getDisplayName(record),
      facility_id: record.facility_id,
      utility_account_id: record.utility_account_id,
      message: buildActivityMessage({
        actorName: req.user?.name || "User",
        action: "created",
        entityLabel: entityLabel,
        entityName: getDisplayName(record),
      }),
      meta: { status: record.status },
    });

    res.status(201).json({ success: true, data: record });
  });

  const getAll = asyncHandler(async (req, res) => {
    const query = buildQueryFromRequest(req);

    let records;

    if (isAdmin(req.user)) {
      records = await applySafetyAuditPopulates(Model, Model.find(query)).sort({
        created_at: -1,
      });
    } else {
      const allRecords = await Model.find(query);
      const allowedIds = [];

      for (const rec of allRecords) {
        const access = await resolveAccessibleUtilityAccount(
          req.user,
          rec.utility_account_id,
        );
        if (access) allowedIds.push(rec._id);
      }

      records = await applySafetyAuditPopulates(
        Model,
        Model.find({ _id: { $in: allowedIds } }),
      ).sort({ created_at: -1 });
    }

    res.json({ success: true, count: records.length, data: records });
  });

  const getById = asyncHandler(async (req, res) => {
    const record = await applySafetyAuditPopulates(
      Model,
      Model.findById(req.params.id),
    );

    if (!record) {
      res.status(404);
      throw new Error("Record not found");
    }

    const access = await resolveAccessibleUtilityAccount(
      req.user,
      record.utility_account_id,
    );
    if (!access) {
      res.status(403);
      throw new Error("Access denied");
    }

    res.json({ success: true, data: record });
  });

  const update = asyncHandler(async (req, res) => {
    const record = await Model.findById(req.params.id);
    if (!record) {
      res.status(404);
      throw new Error("Record not found");
    }

    const existingAccess = await resolveAccessibleUtilityAccount(
      req.user,
      record.utility_account_id,
    );
    if (!existingAccess) {
      res.status(403);
      throw new Error("Access denied");
    }

    const raw = normalizePayload(req.body || {});
    delete raw.documents;
    const nextFacilityId = raw.facility_id || record.facility_id?.toString();
    const nextUtilityId =
      raw.utility_account_id || record.utility_account_id?.toString();

    if (!nextFacilityId || !nextUtilityId) {
      res.status(400);
      throw new Error("facility_id and utility_account_id are required");
    }

    const facility = await resolveAccessibleFacility(req.user, nextFacilityId);
    if (!facility) {
      res.status(403);
      throw new Error("No access to facility");
    }

    const nextUtility = await resolveAccessibleUtilityAccount(
      req.user,
      nextUtilityId,
    );
    if (!nextUtility) {
      res.status(403);
      throw new Error("No access to utility account");
    }

    if (nextUtility.facility_id.toString() !== String(nextFacilityId)) {
      res.status(400);
      throw new Error("Utility account does not belong to selected facility");
    }

    const updatedFields = Object.keys(raw);
    const merged = normalizePayload({
      ...record.toObject(),
      ...raw,
    });
    record.set(merged);

    const newDocs = await uploadSafetyAuditDocuments(
      req.files || [],
      record._id,
      documentsFolderKey,
    );
    if (newDocs.length > 0) {
      record.documents ??= [];
      record.documents.push(...newDocs);
    }

    const updated = await record.save();

    await createRecentActivity({
      actor: req.user,
      action: "updated",
      entity_type: entityType,
      entity_id: updated._id,
      entity_name: getDisplayName(updated),
      facility_id: updated.facility_id,
      utility_account_id: updated.utility_account_id,
      message: buildActivityMessage({
        actorName: req.user?.name || "User",
        action: "updated",
        entityLabel: entityLabel,
        entityName: getDisplayName(updated),
      }),
      meta: { updated_fields: [...new Set(updatedFields)], status: updated.status },
    });

    res.json({ success: true, data: updated });
  });

  const remove = asyncHandler(async (req, res) => {
    const record = await Model.findById(req.params.id);
    if (!record) {
      res.status(404);
      throw new Error("Record not found");
    }

    const utility = await resolveAccessibleUtilityAccount(
      req.user,
      record.utility_account_id,
    );
    if (!utility) {
      res.status(403);
      throw new Error("Access denied");
    }

    const name = getDisplayName(record);
    const facilityId = record.facility_id;
    const utilityId = record.utility_account_id;

    await record.deleteOne();

    await createRecentActivity({
      actor: req.user,
      action: "deleted",
      entity_type: entityType,
      entity_id: record._id,
      entity_name: name,
      facility_id: facilityId,
      utility_account_id: utilityId,
      message: buildActivityMessage({
        actorName: req.user?.name || "User",
        action: "deleted",
        entityLabel: entityLabel,
        entityName: name,
      }),
    });

    res.json({ success: true, message: "Deleted successfully" });
  });

  return { create, getAll, getById, update, remove };
}

export { normalizePayload, defaultDisplayName };

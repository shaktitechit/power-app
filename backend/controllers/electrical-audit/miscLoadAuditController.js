import asyncHandler from "../../middlewares/asyncHandler.js";
import mongoose from "mongoose";
import MiscLoadAuditRecord from "../../modals/electrical-audit/miscLoadAuditRecord.js";
import UtilityAccount from "../../modals/utilityAccount.js";
import { uploadBufferToFileManagement } from "../../utils/fileManagementUpload.js";
import { createRecentActivity } from "../../helpers/createRecentActivity.js";
import { buildActivityMessage } from "../../helpers/buildActivityMessage.js";
import {
  resolveAccessibleFacility,
  resolveAccessibleUtilityAccount,
} from "../../services/authorization/index.js";
import { getAccessibleUtilityAccountIds } from "../../services/authorization/getAccessibleUtilityIds.js";

// 📂 Upload documents
const uploadMiscLoadDocuments = async (files = [], recordId) => {
  const docs = [];

  for (const file of files || []) {
    const uploaded = await uploadBufferToFileManagement(
      file,
      "misc-load-audits",
      recordId,
    );

    docs.push({
      fileUrl: uploaded.secure_url,
      fileType: file.mimetype === "application/pdf" ? "pdf" : "image",
      fileName: file.originalname,
    });
  }

  return docs;
};

// ✅ Auto calculation
const computeValues = (data) => {
  const quantity = Number(data.quantity) || 0;
  const ratedPower = Number(data.rated_power_kW) || 0;
  const avgHours = Number(data.average_operating_hours_per_day) || 0;
  const operatingDays = Number(data.operating_days_per_year) || 0;
  const loadFactorPercent = Number(data.load_factor_percent);

  const loadFactor =
    !Number.isNaN(loadFactorPercent) && loadFactorPercent >= 0
      ? loadFactorPercent / 100
      : 1;

  data.estimated_annual_energy_kWh =
    quantity * ratedPower * avgHours * operatingDays * loadFactor;

  return data;
};

//
// 🚀 CREATE
//
const createMiscLoadAuditRecord = asyncHandler(async (req, res) => {
  const { facility_id, utility_account_id } = req.body;

  if (!facility_id || !utility_account_id) {
    res.status(400);
    throw new Error("facility_id & utility_account_id required");
  }

  // 🔒 Facility access
  const facility = await resolveAccessibleFacility(req.user, facility_id);
  if (!facility) {
    res.status(403);
    throw new Error("No access to facility");
  }

  // 🔒 Utility access
  const utility = await resolveAccessibleUtilityAccount(
    req.user,
    utility_account_id,
  );

  if (!utility) {
    res.status(403);
    throw new Error("No access to utility");
  }

  // ⚠️ Utility must belong to selected facility
  if (utility.facility_id.toString() !== facility_id) {
    res.status(400);
    throw new Error("Utility does not belong to selected facility");
  }

  let payload = { ...req.body };
  payload = computeValues(payload);

  const recordId = new mongoose.Types.ObjectId();
  const docs = await uploadMiscLoadDocuments(req.files || [], recordId);

  const record = await MiscLoadAuditRecord.create({
    _id: recordId,
    ...payload,
    auditor_id: req.user?._id || req.body.auditor_id,
    documents: docs,
  });

  await createRecentActivity({
    actor: req.user,
    action: "created",
    entity_type: "misc_load",
    entity_id: record._id,
    entity_name: record.equipment_name || record.category || "Misc Load Audit",
    facility_id: record.facility_id,
    utility_account_id: record.utility_account_id,
    message: buildActivityMessage({
      actorName: req.user?.name || "User",
      action: "created",
      entityLabel: "misc load audit",
      entityName: record.equipment_name || record.category || "",
    }),
    meta: {
      category: record.category,
      quantity: record.quantity,
      rated_power_kW: record.rated_power_kW,
      estimated_annual_energy_kWh: record.estimated_annual_energy_kWh,
    },
  });

  res.status(201).json({
    success: true,
    data: record,
  });
});

//
// 📥 GET ALL
//
const getMiscLoadAuditRecords = asyncHandler(async (req, res) => {
  const { facility_id, utility_account_id, category } = req.query;

  const query = {};

  if (facility_id) query.facility_id = facility_id;
  if (utility_account_id) query.utility_account_id = utility_account_id;
  if (category) query.category = category;

  let records;

  const allowedIds = await getAccessibleUtilityAccountIds(req.user);

  if (allowedIds === null) {
    if (utility_account_id) query.utility_account_id = utility_account_id;
    if (category) query.category = category;
  } else {
    if (utility_account_id) {
      const isAllowed = allowedIds.some(
        (id) => id.toString() === utility_account_id.toString(),
      );
      if (!isAllowed) return res.json({ success: true, count: 0, data: [] });
      query.utility_account_id = utility_account_id;
    } else {
      query.utility_account_id = { $in: allowedIds };
    }
  }

  records = await MiscLoadAuditRecord.find(query)
    .populate("facility_id", "name city")
    .populate("utility_account_id", "account_number")
    .populate("auditor_id", "name email")
    .sort({ created_at: -1 });

  res.json({
    success: true,
    count: records.length,
    data: records,
  });
});

//
// 📄 GET SINGLE
//
const getMiscLoadAuditRecordById = asyncHandler(async (req, res) => {
  const record = await MiscLoadAuditRecord.findById(req.params.id)
    .populate("facility_id", "name city")
    .populate("utility_account_id", "account_number")
    .populate("auditor_id", "name email");

  if (!record) {
    res.status(404);
    throw new Error("Misc load audit record not found");
  }

  const access = await resolveAccessibleUtilityAccount(
    req.user,
    record.utility_account_id,
  );

  if (!access) {
    res.status(403);
    throw new Error("Access denied");
  }

  res.json({
    success: true,
    data: record,
  });
});

//
// ✏️ UPDATE
//
const updateMiscLoadAuditRecord = asyncHandler(async (req, res) => {
  const record = await MiscLoadAuditRecord.findById(req.params.id);

  if (!record) {
    res.status(404);
    throw new Error("Misc load audit record not found");
  }

  const utility = await resolveAccessibleUtilityAccount(
    req.user,
    record.utility_account_id,
  );

  if (!utility) {
    res.status(403);
    throw new Error("Access denied");
  }

  // If utility_account_id is being changed
  if (req.body.utility_account_id) {
    const newUtility = await resolveAccessibleUtilityAccount(
      req.user,
      req.body.utility_account_id,
    );

    if (!newUtility) {
      res.status(403);
      throw new Error("No access to new utility");
    }

    const facilityIdToCheck =
      req.body.facility_id || record.facility_id.toString();

    if (newUtility.facility_id.toString() !== facilityIdToCheck) {
      res.status(400);
      throw new Error("Utility does not belong to selected facility");
    }
  }

  // If facility_id is being changed
  if (req.body.facility_id) {
    const newFacility = await resolveAccessibleFacility(
      req.user,
      req.body.facility_id,
    );

    if (!newFacility) {
      res.status(403);
      throw new Error("No access to new facility");
    }

    const utilityIdToCheck =
      req.body.utility_account_id || record.utility_account_id.toString();

    const utilityToCheck = await UtilityAccount.findById(utilityIdToCheck);

    if (!utilityToCheck) {
      res.status(404);
      throw new Error("Utility not found");
    }

    if (utilityToCheck.facility_id.toString() !== req.body.facility_id) {
      res.status(400);
      throw new Error("Utility does not belong to selected facility");
    }
  }

  const updatedFields = Object.keys(req.body || {});

  let payload = { ...record.toObject(), ...req.body };
  payload = computeValues(payload);

  Object.assign(record, payload);

  const docs = await uploadMiscLoadDocuments(req.files || [], record._id);

  if (docs.length > 0) {
    record.documents.push(...docs);
    updatedFields.push("documents");
  }

  const updated = await record.save();

  await createRecentActivity({
    actor: req.user,
    action: "updated",
    entity_type: "misc_load",
    entity_id: updated._id,
    entity_name:
      updated.equipment_name || updated.category || "Misc Load Audit",
    facility_id: updated.facility_id,
    utility_account_id: updated.utility_account_id,
    message: buildActivityMessage({
      actorName: req.user?.name || "User",
      action: "updated",
      entityLabel: "misc load audit",
      entityName: updated.equipment_name || updated.category || "",
    }),
    meta: {
      updated_fields: [...new Set(updatedFields)],
      estimated_annual_energy_kWh: updated.estimated_annual_energy_kWh,
    },
  });

  res.json({
    success: true,
    data: updated,
  });
});

//
// ❌ DELETE
//
const deleteMiscLoadAuditRecord = asyncHandler(async (req, res) => {
  const record = await MiscLoadAuditRecord.findById(req.params.id);

  if (!record) {
    res.status(404);
    throw new Error("Misc load audit record not found");
  }

  const utility = await resolveAccessibleUtilityAccount(
    req.user,
    record.utility_account_id,
  );

  if (!utility) {
    res.status(403);
    throw new Error("Access denied");
  }

  const entityName =
    record.equipment_name || record.category || "Misc Load Audit";
  const facilityId = record.facility_id;
  const utilityId = record.utility_account_id;

  await record.softDelete();

  await createRecentActivity({
    actor: req.user,
    action: "deleted",
    entity_type: "misc_load",
    entity_id: record._id,
    entity_name: entityName,
    facility_id: facilityId,
    utility_account_id: utilityId,
    message: buildActivityMessage({
      actorName: req.user?.name || "User",
      action: "deleted",
      entityLabel: "misc load audit",
      entityName,
    }),
  });

  res.json({
    success: true,
    message: "Misc load audit record deleted successfully",
  });
});

export {
  createMiscLoadAuditRecord,
  getMiscLoadAuditRecords,
  getMiscLoadAuditRecordById,
  updateMiscLoadAuditRecord,
  deleteMiscLoadAuditRecord,
};

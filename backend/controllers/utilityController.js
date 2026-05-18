import asyncHandler from "../middlewares/asyncHandler.js";
import mongoose from "mongoose";
import Facility from "../modals/facility.js";
import FacilityAuditor from "../modals/facilityAuditor.js";
import UtilityAccount from "../modals/utilityAccount.js";
import User from "../modals/user.js";
import HVACAudit from "../modals/electrical-audit/hvacAudit.js";
import ACAuditRecord from "../modals/electrical-audit/acAuditRecord.js";
import LightingAuditRecord from "../modals/electrical-audit/lightingAuditRecord.js";
import FanAuditRecord from "../modals/electrical-audit/fanAuditRecord.js";
import LuxMeasurement from "../modals/electrical-audit/luxMeasurement.js";
import MiscLoadAuditRecord from "../modals/electrical-audit/miscLoadAuditRecord.js";
import SafetyTransformerAudit from "../modals/safety-audit/safetyTransformerAudit.js";
import SafetyMeteringRoomAudit from "../modals/safety-audit/safetyMeteringRoomAudit.js";
import SafetyPanelRoomAudit from "../modals/safety-audit/safetyPanelRoomAudit.js";
import SafetyLdbAudit from "../modals/safety-audit/safetyLdbAudit.js";
import SafetyDgAudit from "../modals/safety-audit/safetyDgAudit.js";
import SafetyEarthingAudit from "../modals/safety-audit/safetyEarthingAudit.js";
import SafetyUpsAudit from "../modals/safety-audit/safetyUpsAudit.js";
import SafetyGeneralAudit from "../modals/safety-audit/safetyGeneralAudit.js";
import SafetyWiringAudit from "../modals/safety-audit/safetyWiringAudit.js";
import SafetyLoadAnalysisAudit from "../modals/safety-audit/safetyLoadAnalysisAudit.js";
import SafetyLeakInspectionAudit from "../modals/safety-audit/safetyLeakInspectionAudit.js";
import SafetyThermographyAudit from "../modals/safety-audit/safetyThermographyAudit.js";
import SafetyElevatorAudit from "../modals/safety-audit/safetyElevatorAudit.js";
import SafetyPacVentilationAudit from "../modals/safety-audit/safetyPacVentilationAudit.js";
import SafetyPumpCompressorAudit from "../modals/safety-audit/safetyPumpCompressorAudit.js";
import SafetyAdditionalItemsAudit from "../modals/safety-audit/safetyAdditionalItemsAudit.js";
import SafetyDocumentsAudit from "../modals/safety-audit/safetyDocumentsAudit.js";
import { uploadBufferToFileManagement } from "../utils/fileManagementUpload.js";

import { createRecentActivity } from "../helpers/createRecentActivity.js";
import { buildActivityMessage } from "../helpers/buildActivityMessage.js";
import { isFacilityAuditClosed } from "../helpers/auditState.js";
import {
  hasOrgWideUtilityAccountRead,
  resolveAccessibleFacility,
} from "../services/authorization/index.js";
import { createNotification } from "../services/notificationService.js";

// helper: upload documents
const uploadUtilityDocuments = async (files = [], utilityAccountId) => {
  const uploadedDocuments = [];

  if (files && files.length > 0) {
    for (const file of files) {
      const uploaded = await uploadBufferToFileManagement(
        file,
        "utility-accounts",
        utilityAccountId,
      );

      uploadedDocuments.push({
        fileUrl: uploaded.secure_url,
        fileType: file.mimetype === "application/pdf" ? "pdf" : "image",
        fileName: file.originalname,
      });
    }
  }

  return uploadedDocuments;
};

const ALLOWED_AUDIT_STEPS = [
  "tarrif",
  "utility-billing-records",
  "solar-plants",
  "dg-sets",
  "transformer",
  "pump",
  "hvac",
  "ac",
  "lighting",
  "fan",
  "lux",
  "misc",
  "preview-and-submit",
  /** Legacy: older clients stored safety final here; allow unlock of old records. */
  "safety-preview-and-submit",
];

/** Steps that may be explicitly marked as "no data" (load audits only). */
const NO_DATA_AUDIT_STEPS = ["hvac", "ac", "lighting", "fan", "lux", "misc"];

/** Electrical safety checklist tabs — same keys as frontend `safety-audit-workflow`. */
const SAFETY_NO_DATA_AUDIT_STEPS = [
  "transformers",
  "metering-room",
  "panel-room",
  "light-db",
  "dg-set",
  "earthing-system",
  "ups-battery",
  "general-safety",
  "wiring-inspection",
  "load-analysis",
  "leak-inspection",
  "thermography",
  "elevator-safety",
  "pac-ventilation",
  "pump-compressor",
  "additional-items",
  "documents-review",
];

const ALL_NO_DATA_AUDIT_STEPS = [
  ...NO_DATA_AUDIT_STEPS,
  ...SAFETY_NO_DATA_AUDIT_STEPS,
];

const countSafetyNoDataStepRecords = async (step, utilityAccountId) => {
  const q = { utility_account_id: utilityAccountId };
  switch (step) {
    case "transformers":
      return SafetyTransformerAudit.countDocuments(q);
    case "metering-room":
      return SafetyMeteringRoomAudit.countDocuments(q);
    case "panel-room":
      return SafetyPanelRoomAudit.countDocuments(q);
    case "light-db":
      return SafetyLdbAudit.countDocuments(q);
    case "dg-set":
      return SafetyDgAudit.countDocuments(q);
    case "earthing-system":
      return SafetyEarthingAudit.countDocuments(q);
    case "ups-battery":
      return SafetyUpsAudit.countDocuments(q);
    case "general-safety":
      return SafetyGeneralAudit.countDocuments(q);
    case "wiring-inspection":
      return SafetyWiringAudit.countDocuments(q);
    case "load-analysis":
      return SafetyLoadAnalysisAudit.countDocuments(q);
    case "leak-inspection":
      return SafetyLeakInspectionAudit.countDocuments(q);
    case "thermography":
      return SafetyThermographyAudit.countDocuments(q);
    case "elevator-safety":
      return SafetyElevatorAudit.countDocuments(q);
    case "pac-ventilation":
      return SafetyPacVentilationAudit.countDocuments(q);
    case "pump-compressor":
      return SafetyPumpCompressorAudit.countDocuments(q);
    case "additional-items":
      return SafetyAdditionalItemsAudit.countDocuments(q);
    case "documents-review":
      return SafetyDocumentsAudit.countDocuments(q);
    default:
      return -1;
  }
};

const countNoDataStepRecords = async (step, utilityAccountId) => {
  const q = { utility_account_id: utilityAccountId };
  switch (step) {
    case "hvac":
      return HVACAudit.countDocuments(q);
    case "ac":
      return ACAuditRecord.countDocuments(q);
    case "lighting":
      return LightingAuditRecord.countDocuments(q);
    case "fan":
      return FanAuditRecord.countDocuments(q);
    case "lux":
      return LuxMeasurement.countDocuments(q);
    case "misc":
      return MiscLoadAuditRecord.countDocuments(q);
    default:
      if (SAFETY_NO_DATA_AUDIT_STEPS.includes(step)) {
        return countSafetyNoDataStepRecords(step, utilityAccountId);
      }
      return -1;
  }
};

// helper: parse booleans safely
const parseBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === "")
    return defaultValue;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }
  return Boolean(value);
};

const calculateKVA = (value, unit) => {
  if (value === undefined || value === null || value === "") return undefined;
  const val = Number(value);
  if (unit === "kW") return val / 0.9;
  if (unit === "BHP") return (val * 0.746) / 0.9;
  return val; // kVA
};

// @route POST
const createUtilityAccount = asyncHandler(async (req, res) => {
  const {
    facility_id,
    account_number,
    connection_type,
    category,
    location,
    sanctioned_demand_value,
    sanctioned_demand_unit,
    provider,
    billing_cycle,
    audit_date,
    auditor_id,
    is_solar_connected,
    is_dg_connected,
    is_transformer_connected,
    is_pump_connected,
    is_transformer_maintained_by_facility,
    is_active,
  } = req.body;

  if (!facility_id || !account_number || !connection_type) {
    res.status(400);
    throw new Error(
      "facility_id, account_number and connection_type are required",
    );
  }

  const facility = await resolveAccessibleFacility(req.user, facility_id);

  if (!facility) {
    res.status(404);
    throw new Error("Facility not found or access denied");
  }

  const existingUtilityAccount = await UtilityAccount.findOne({
    facility_id,
    account_number: account_number.trim(),
  });

  if (existingUtilityAccount) {
    res.status(400);
    throw new Error("Utility account already exists for this facility");
  }

  const utilityAccountId = new mongoose.Types.ObjectId();
  const uploadedDocuments = await uploadUtilityDocuments(
    req.files,
    utilityAccountId,
  );

  const utilityAccount = await UtilityAccount.create({
    _id: utilityAccountId,
    facility_id,
    account_number: account_number.trim(),
    connection_type,
    category,
    location,
    sanctioned_demand_value:
      sanctioned_demand_value !== undefined && sanctioned_demand_value !== ""
        ? Number(sanctioned_demand_value)
        : undefined,
    sanctioned_demand_unit: sanctioned_demand_unit || "kVA",
    sanctioned_demand_kVA: calculateKVA(sanctioned_demand_value, sanctioned_demand_unit),
    provider,
    billing_cycle,
    audit_date: audit_date || undefined,
    auditor_id: auditor_id || undefined,
    is_solar_connected: parseBoolean(is_solar_connected, false),
    is_dg_connected: parseBoolean(is_dg_connected, false),
    is_transformer_connected: parseBoolean(is_transformer_connected, false),
    is_pump_connected: parseBoolean(is_pump_connected, false),
    is_transformer_maintained_by_facility: parseBoolean(
      is_transformer_maintained_by_facility,
      false,
    ),
    is_active: parseBoolean(is_active, true),
    documents: uploadedDocuments,
  });

  // ✅ ACTIVITY
  await createRecentActivity({
    actor: req.user,
    action: "created",
    entity_type: "utility_account",
    entity_id: utilityAccount._id,
    entity_name: utilityAccount.account_number,
    facility_id: utilityAccount.facility_id,
    utility_account_id: utilityAccount._id,
    message: buildActivityMessage({
      actorName: req.user?.name || "User",
      action: "created",
      entityLabel: "utility account",
      entityName: utilityAccount.account_number,
    }),
    meta: {
      connection_type: utilityAccount.connection_type,
      provider: utilityAccount.provider,
    },
  });

  res.status(201).json({
    success: true,
    message: "Utility account created successfully",
    data: utilityAccount,
  });
});

// GET ALL (unchanged)
const getUtilityAccounts = asyncHandler(async (req, res) => {
  const { facility_id } = req.query;

  let utilities = [];

  if (hasOrgWideUtilityAccountRead(req.user)) {
    const query = facility_id ? { facility_id } : {};
    utilities = await UtilityAccount.find(query)
      .populate("facility_id", "name city")
      .populate("auditor_id", "name email")
      .sort({ created_at: -1 });
  } else {
    const assignedFacilityIds = await FacilityAuditor.find({
      user_id: req.user._id,
    }).distinct("facility_id");

    const ownedFacilities = await Facility.find({
      owner_user_id: req.user._id,
    }).distinct("_id");

    const accessibleFacilityIds = [...ownedFacilities, ...assignedFacilityIds];

    const query = {
      facility_id: {
        $in: facility_id
          ? accessibleFacilityIds.filter(
              (id) => id.toString() === facility_id.toString(),
            )
          : accessibleFacilityIds,
      },
    };

    utilities = await UtilityAccount.find(query)
      .populate("facility_id", "name city")
      .populate("auditor_id", "name email")
      .sort({ created_at: -1 });
  }

  res.status(200).json({
    success: true,
    count: utilities.length,
    data: utilities,
  });
});

// GET SINGLE (unchanged)
const getUtilityAccountById = asyncHandler(async (req, res) => {
  const utilityAccount = await UtilityAccount.findById(req.params.id)
    .populate("facility_id", "name city address owner_user_id")
    .populate("auditor_id", "name email");

  if (!utilityAccount) {
    res.status(404);
    throw new Error("Utility account not found");
  }

  const facility = await resolveAccessibleFacility(
    req.user,
    utilityAccount.facility_id._id,
  );

  if (!facility) {
    res.status(403);
    throw new Error("Access denied");
  }

  const payload = utilityAccount.toObject();
  const subsOut = { ...(payload.audit_step_submissions || {}) };
  for (const previewKey of ["preview-and-submit", "safety-preview-and-submit"]) {
    const preview = subsOut[previewKey];
    if (preview?.submitted_by) {
      const userDoc = await User.findById(preview.submitted_by)
        .select("name email")
        .lean();
      subsOut[previewKey] = {
        ...preview,
        submitted_by: userDoc || preview.submitted_by,
      };
    }
  }
  payload.audit_step_submissions = subsOut;

  res.status(200).json({
    success: true,
    data: payload,
  });
});

// POST submit audit step (locks tab workflow on client)
const submitUtilityAuditStep = asyncHandler(async (req, res) => {
  const step = req.body?.step;
  if (!step || typeof step !== "string" || !ALLOWED_AUDIT_STEPS.includes(step)) {
    res.status(400);
    throw new Error("Invalid audit step");
  }

  const utilityAccount = await UtilityAccount.findById(req.params.id);

  if (!utilityAccount) {
    res.status(404);
    throw new Error("Utility account not found");
  }

  const facility = await resolveAccessibleFacility(
    req.user,
    utilityAccount.facility_id,
  );

  if (!facility) {
    res.status(403);
    throw new Error("Access denied");
  }

  const prev =
    utilityAccount.audit_step_submissions &&
    typeof utilityAccount.audit_step_submissions === "object" &&
    !Array.isArray(utilityAccount.audit_step_submissions)
      ? { ...utilityAccount.audit_step_submissions }
      : {};

  prev[step] = {
    submitted_at: new Date(),
    submitted_by: req.user._id,
  };
  if (step === "preview-and-submit") {
    delete prev["safety-preview-and-submit"];
  }

  utilityAccount.audit_step_submissions = prev;
  utilityAccount.markModified("audit_step_submissions");

  const updated = await utilityAccount.save();

  await createRecentActivity({
    actor: req.user,
    action: "updated",
    entity_type: "utility_account",
    entity_id: updated._id,
    entity_name: updated.account_number,
    facility_id: updated.facility_id,
    utility_account_id: updated._id,
    message: buildActivityMessage({
      actorName: req.user?.name || "User",
      action: "updated",
      entityLabel: "utility account (audit step submitted)",
      entityName: step,
    }),
    meta: {
      audit_step: step,
    },
  });

  if (step === "preview-and-submit" || step === "safety-preview-and-submit") {
      const io = req.app.get("io");
      
      await createNotification(io, {
          recipient: facility.owner_user_id,
          sender: req.user._id,
          title: "Utility Account Submitted",
          message: `Utility account ${updated.account_number} has been submitted for facility: ${facility.name}`,
          type: "utility",
          referenceId: updated._id,
      });
  }

  res.status(200).json({
    success: true,
    message: "Audit step submitted",
    data: updated,
  });
});

// POST allow editing again for a submitted audit step (policy-controlled)
const allowUtilityAuditStep = asyncHandler(async (req, res) => {
  const step = req.body?.step;
  if (!step || typeof step !== "string" || !ALLOWED_AUDIT_STEPS.includes(step)) {
    res.status(400);
    throw new Error("Invalid audit step");
  }

  const utilityAccount = await UtilityAccount.findById(req.params.id);

  if (!utilityAccount) {
    res.status(404);
    throw new Error("Utility account not found");
  }

  const facility = await resolveAccessibleFacility(
    req.user,
    utilityAccount.facility_id,
  );

  if (!facility) {
    res.status(403);
    throw new Error("Access denied");
  }

  const prev =
    utilityAccount.audit_step_submissions &&
    typeof utilityAccount.audit_step_submissions === "object" &&
    !Array.isArray(utilityAccount.audit_step_submissions)
      ? { ...utilityAccount.audit_step_submissions }
      : {};

  if (step === "preview-and-submit" || step === "safety-preview-and-submit") {
    delete prev["preview-and-submit"];
    delete prev["safety-preview-and-submit"];
  } else {
    delete prev[step];
  }

  utilityAccount.audit_step_submissions = prev;
  utilityAccount.markModified("audit_step_submissions");

  const updated = await utilityAccount.save();

  await createRecentActivity({
    actor: req.user,
    action: "updated",
    entity_type: "utility_account",
    entity_id: updated._id,
    entity_name: updated.account_number,
    facility_id: updated.facility_id,
    utility_account_id: updated._id,
    message: buildActivityMessage({
      actorName: req.user?.name || "User",
      action: "updated",
      entityLabel: "utility account (audit step editing allowed)",
      entityName: step,
    }),
    meta: {
      audit_step: step,
      audit_allow_editing: true,
    },
  });

  res.status(200).json({
    success: true,
    message: "Audit step unlocked for editing",
    data: updated,
  });
});

// POST declare "no data" for a load-audit tab (only when zero records; facility must be open)
const declareAuditStepNoData = asyncHandler(async (req, res) => {
  const step = req.body?.step;
  if (
    !step ||
    typeof step !== "string" ||
    !ALL_NO_DATA_AUDIT_STEPS.includes(step)
  ) {
    res.status(400);
    throw new Error("Invalid audit step for no-data declaration");
  }

  const utilityAccount = await UtilityAccount.findById(req.params.id);

  if (!utilityAccount) {
    res.status(404);
    throw new Error("Utility account not found");
  }

  const facility = await resolveAccessibleFacility(
    req.user,
    utilityAccount.facility_id,
  );

  if (!facility) {
    res.status(403);
    throw new Error("Access denied");
  }

  const facilityDoc = await Facility.findById(utilityAccount.facility_id);
  if (isFacilityAuditClosed(facilityDoc)) {
    res.status(403);
    throw new Error("Facility audit is closed");
  }

  const count = await countNoDataStepRecords(step, utilityAccount._id);
  if (count < 0) {
    res.status(400);
    throw new Error("Invalid step");
  }
  if (count > 0) {
    res.status(400);
    throw new Error("Cannot declare no data while audit records exist for this step");
  }

  const prev =
    utilityAccount.audit_step_no_data &&
    typeof utilityAccount.audit_step_no_data === "object" &&
    !Array.isArray(utilityAccount.audit_step_no_data)
      ? { ...utilityAccount.audit_step_no_data }
      : {};

  prev[step] = {
    declared_at: new Date(),
    declared_by: req.user._id,
  };

  utilityAccount.audit_step_no_data = prev;
  utilityAccount.markModified("audit_step_no_data");

  const updated = await utilityAccount.save();

  await createRecentActivity({
    actor: req.user,
    action: "updated",
    entity_type: "utility_account",
    entity_id: updated._id,
    entity_name: updated.account_number,
    facility_id: updated.facility_id,
    utility_account_id: updated._id,
    message: buildActivityMessage({
      actorName: req.user?.name || "User",
      action: "updated",
      entityLabel: "utility account (audit — no data declared)",
      entityName: step,
    }),
    meta: {
      audit_step_no_data: step,
    },
  });

  res.status(200).json({
    success: true,
    message: "No data declared for this audit step",
    data: updated,
  });
});

// POST clear "no data" declaration (policy-controlled — re-enables adding records)
const clearAuditStepNoData = asyncHandler(async (req, res) => {
  const step = req.body?.step;
  if (
    !step ||
    typeof step !== "string" ||
    !ALL_NO_DATA_AUDIT_STEPS.includes(step)
  ) {
    res.status(400);
    throw new Error("Invalid audit step for no-data clear");
  }

  const utilityAccount = await UtilityAccount.findById(req.params.id);

  if (!utilityAccount) {
    res.status(404);
    throw new Error("Utility account not found");
  }

  const facility = await resolveAccessibleFacility(
    req.user,
    utilityAccount.facility_id,
  );

  if (!facility) {
    res.status(403);
    throw new Error("Access denied");
  }

  const facilityDoc = await Facility.findById(utilityAccount.facility_id);
  if (isFacilityAuditClosed(facilityDoc)) {
    res.status(403);
    throw new Error("Facility audit is closed");
  }

  const prev =
    utilityAccount.audit_step_no_data &&
    typeof utilityAccount.audit_step_no_data === "object" &&
    !Array.isArray(utilityAccount.audit_step_no_data)
      ? { ...utilityAccount.audit_step_no_data }
      : {};

  delete prev[step];

  utilityAccount.audit_step_no_data = prev;
  utilityAccount.markModified("audit_step_no_data");

  const updated = await utilityAccount.save();

  await createRecentActivity({
    actor: req.user,
    action: "updated",
    entity_type: "utility_account",
    entity_id: updated._id,
    entity_name: updated.account_number,
    facility_id: updated.facility_id,
    utility_account_id: updated._id,
    message: buildActivityMessage({
      actorName: req.user?.name || "User",
      action: "updated",
      entityLabel: "utility account (audit — no data cleared)",
      entityName: step,
    }),
    meta: {
      audit_step_no_data_cleared: step,
    },
  });

  res.status(200).json({
    success: true,
    message: "No-data declaration cleared; you can add records again",
    data: updated,
  });
});

// UPDATE
const updateUtilityAccount = asyncHandler(async (req, res) => {
  const {
    account_number,
    connection_type,
    category,
    location,
    sanctioned_demand_value,
    sanctioned_demand_unit,
    provider,
    billing_cycle,
    audit_date,
    auditor_id,
    is_solar_connected,
    is_dg_connected,
    is_transformer_connected,
    is_pump_connected,
    is_transformer_maintained_by_facility,
    is_active,
  } = req.body;

  const utilityAccount = await UtilityAccount.findById(req.params.id);

  if (!utilityAccount) {
    res.status(404);
    throw new Error("Utility account not found");
  }

  const facility = await resolveAccessibleFacility(
    req.user,
    utilityAccount.facility_id,
  );

  if (!facility) {
    res.status(403);
    throw new Error("Access denied");
  }

  if (
    account_number !== undefined &&
    account_number.trim() !== utilityAccount.account_number
  ) {
    const existingUtilityAccount = await UtilityAccount.findOne({
      facility_id: utilityAccount.facility_id,
      account_number: account_number.trim(),
      _id: { $ne: utilityAccount._id },
    });

    if (existingUtilityAccount) {
      res.status(400);
      throw new Error("Utility account already exists for this facility");
    }
  }

  const uploadedDocuments = await uploadUtilityDocuments(
    req.files,
    utilityAccount._id,
  );

  const updatedFields = Object.keys(req.body || {});

  utilityAccount.account_number =
    account_number !== undefined
      ? account_number.trim()
      : utilityAccount.account_number;

  utilityAccount.connection_type =
    connection_type ?? utilityAccount.connection_type;

  utilityAccount.category = category ?? utilityAccount.category;
  utilityAccount.location = location ?? utilityAccount.location;

  if (sanctioned_demand_value !== undefined) {
    utilityAccount.sanctioned_demand_value = sanctioned_demand_value !== "" ? Number(sanctioned_demand_value) : undefined;
    utilityAccount.sanctioned_demand_unit = sanctioned_demand_unit || utilityAccount.sanctioned_demand_unit || "kVA";
    utilityAccount.sanctioned_demand_kVA = calculateKVA(utilityAccount.sanctioned_demand_value, utilityAccount.sanctioned_demand_unit);
  } else if (sanctioned_demand_unit !== undefined) {
    utilityAccount.sanctioned_demand_unit = sanctioned_demand_unit;
    utilityAccount.sanctioned_demand_kVA = calculateKVA(utilityAccount.sanctioned_demand_value, utilityAccount.sanctioned_demand_unit);
  }

  utilityAccount.provider = provider ?? utilityAccount.provider;
  utilityAccount.billing_cycle = billing_cycle ?? utilityAccount.billing_cycle;
  utilityAccount.audit_date = audit_date ?? utilityAccount.audit_date;
  utilityAccount.auditor_id = auditor_id ?? utilityAccount.auditor_id;

  if (is_solar_connected !== undefined) {
    utilityAccount.is_solar_connected = parseBoolean(is_solar_connected);
  }

  if (is_dg_connected !== undefined) {
    utilityAccount.is_dg_connected = parseBoolean(is_dg_connected);
  }

  if (is_transformer_connected !== undefined) {
    utilityAccount.is_transformer_connected = parseBoolean(
      is_transformer_connected,
    );
  }

  if (is_pump_connected !== undefined) {
    utilityAccount.is_pump_connected = parseBoolean(is_pump_connected);
  }

  if (is_transformer_maintained_by_facility !== undefined) {
    utilityAccount.is_transformer_maintained_by_facility = parseBoolean(
      is_transformer_maintained_by_facility,
    );
  }

  if (is_active !== undefined) {
    utilityAccount.is_active = parseBoolean(is_active, true);
  }

  if (uploadedDocuments.length > 0) {
    utilityAccount.documents = [
      ...(utilityAccount.documents || []),
      ...uploadedDocuments,
    ];
    updatedFields.push("documents");
  }

  const updatedUtilityAccount = await utilityAccount.save();

  // ✅ ACTIVITY
  await createRecentActivity({
    actor: req.user,
    action: "updated",
    entity_type: "utility_account",
    entity_id: updatedUtilityAccount._id,
    entity_name: updatedUtilityAccount.account_number,
    facility_id: updatedUtilityAccount.facility_id,
    utility_account_id: updatedUtilityAccount._id,
    message: buildActivityMessage({
      actorName: req.user?.name || "User",
      action: "updated",
      entityLabel: "utility account",
      entityName: updatedUtilityAccount.account_number,
    }),
    meta: {
      updated_fields: [...new Set(updatedFields)],
      connection_type: updatedUtilityAccount.connection_type,
    },
  });

  res.status(200).json({
    success: true,
    message: "Utility account updated successfully",
    data: updatedUtilityAccount,
  });
});

// DELETE
const deleteUtilityAccount = asyncHandler(async (req, res) => {
  const utilityAccount = await UtilityAccount.findById(req.params.id);

  if (!utilityAccount) {
    res.status(404);
    throw new Error("Utility account not found");
  }

  const facility = await resolveAccessibleFacility(
    req.user,
    utilityAccount.facility_id,
  );

  if (!facility) {
    res.status(403);
    throw new Error("Access denied");
  }

  const entityName = utilityAccount.account_number;
  const facilityId = utilityAccount.facility_id;

  await utilityAccount.softDelete();

  // ✅ ACTIVITY
  await createRecentActivity({
    actor: req.user,
    action: "deleted",
    entity_type: "utility_account",
    entity_id: utilityAccount._id,
    entity_name: entityName,
    facility_id: facilityId,
    utility_account_id: utilityAccount._id,
    message: buildActivityMessage({
      actorName: req.user?.name || "User",
      action: "deleted",
      entityLabel: "utility account",
      entityName,
    }),
  });

  res.status(200).json({
    success: true,
    message: "Utility account deleted successfully",
  });
});

export {
  createUtilityAccount,
  getUtilityAccounts,
  getUtilityAccountById,
  submitUtilityAuditStep,
  allowUtilityAuditStep,
  declareAuditStepNoData,
  clearAuditStepNoData,
  updateUtilityAccount,
  deleteUtilityAccount,
};

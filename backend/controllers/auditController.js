import asyncHandler from "../middlewares/asyncHandler.js";
import mongoose from "mongoose";
import { resolveAccessibleFacility } from "../services/authorization/index.js";
import {
  aggregateElectricalEnergyAuditForFacility,
  aggregateElectricalSafetyAuditForFacility,
  ELECTRICAL_ENERGY_AUDIT_LABEL,
  ELECTRICAL_SAFETY_AUDIT_LABEL,
} from "../services/audit/facilityAuditAggregate.js";

const throwError = (message, statusCode = 400) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  throw err;
};

function parseFacilityId(raw) {
  const id = String(raw || "").trim();
  if (!id) return null;
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return id;
}

/** Normalize `audit_type` query to energy | safety | null */
function resolveAuditTypeVariant(raw) {
  const t = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_")
    .replace(/\s+/g, "_");

  if (
    t === "electrical_energy_audit" ||
    t === "electrical_energy" ||
    t === "energy" ||
    t === "eea"
  ) {
    return "energy";
  }

  if (
    t === "electrical_safety_audit" ||
    t === "electrical_safety" ||
    t === "safety" ||
    t === "esa"
  ) {
    return "safety";
  }

  const compact = t.replace(/_/g, "");
  if (compact === "electricalenergyaudit") return "energy";
  if (compact === "electricalsafetyaudit") return "safety";

  return null;
}

async function loadSnapshotForUser(user, facilityIdString, variant) {
  const facility = await resolveAccessibleFacility(user, facilityIdString);
  if (!facility) {
    throwError("Facility not found or access denied", 404);
  }

  if (variant === "energy") {
    return aggregateElectricalEnergyAuditForFacility(facility._id);
  }
  return aggregateElectricalSafetyAuditForFacility(facility._id);
}

/**
 * GET /api/v1/audits/electrical-energy?facility_id=
 */
export const getElectricalEnergyAudit = asyncHandler(async (req, res) => {
  const facility_id = parseFacilityId(req.query.facility_id);
  if (!facility_id) throwError("Valid facility_id query parameter is required", 400);

  const data = await loadSnapshotForUser(req.user, facility_id, "energy");
  res.status(200).json({ success: true, data });
});

/**
 * GET /api/v1/audits/electrical-safety?facility_id=
 */
export const getElectricalSafetyAudit = asyncHandler(async (req, res) => {
  const facility_id = parseFacilityId(req.query.facility_id);
  if (!facility_id) throwError("Valid facility_id query parameter is required", 400);

  const data = await loadSnapshotForUser(req.user, facility_id, "safety");
  res.status(200).json({ success: true, data });
});

/**
 * GET /api/v1/audits/facility-snapshot?audit_type=&facility_id=
 * `audit_type`: Electrical Energy Audit | Electrical Safety Audit | aliases (electrical_energy, safety, …)
 */
export const getFacilityAuditSnapshot = asyncHandler(async (req, res) => {
  const facility_id = parseFacilityId(req.query.facility_id);
  if (!facility_id) throwError("Valid facility_id query parameter is required", 400);

  const rawType = req.query.audit_type;
  if (rawType === undefined || rawType === null || String(rawType).trim() === "") {
    throwError("audit_type query parameter is required", 400);
  }

  const trimmed = String(rawType).trim();
  let variant = resolveAuditTypeVariant(trimmed);

  if (!variant) {
    if (trimmed === ELECTRICAL_ENERGY_AUDIT_LABEL) variant = "energy";
    else if (trimmed === ELECTRICAL_SAFETY_AUDIT_LABEL) variant = "safety";
  }

  if (!variant) {
    throwError(
      `Invalid audit_type. Use "${ELECTRICAL_ENERGY_AUDIT_LABEL}", "${ELECTRICAL_SAFETY_AUDIT_LABEL}", or aliases such as electrical_energy / electrical_safety`,
      400,
    );
  }

  const data = await loadSnapshotForUser(req.user, facility_id, variant);
  res.status(200).json({ success: true, data });
});

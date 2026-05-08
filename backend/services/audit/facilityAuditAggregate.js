import mongoose from "mongoose";

import Facility from "../../modals/facility.js";
import UtilityAccount from "../../modals/utilityAccount.js";
import UtilityTariff from "../../modals/electrical-audit/utilityTarrif.js";
import UtilityBillingRecord from "../../modals/electrical-audit/utilityBillingRecord.js";
import SolarPlant from "../../modals/electrical-audit/solarPlant.js";
import DGSet from "../../modals/electrical-audit/dgSet.js";
import Transformer from "../../modals/electrical-audit/transformer.js";
import Pump from "../../modals/electrical-audit/pump.js";
import HVACAudit from "../../modals/electrical-audit/hvacAudit.js";
import LightingAuditRecord from "../../modals/electrical-audit/lightingAuditRecord.js";
import LuxMeasurement from "../../modals/electrical-audit/luxMeasurement.js";
import MiscLoadAuditRecord from "../../modals/electrical-audit/miscLoadAuditRecord.js";
import SolarGenerationRecord from "../../modals/electrical-audit/solarGenerationRecord.js";
import DGAuditRecord from "../../modals/electrical-audit/dgAuditRecord.js";
import TransformerAuditRecord from "../../modals/electrical-audit/transformerAuditRecord.js";
import PumpAuditRecord from "../../modals/electrical-audit/pumpAuditRecord.js";
import ACAuditRecord from "../../modals/electrical-audit/acAuditRecord.js";
import FanAuditRecord from "../../modals/electrical-audit/fanAuditRecord.js";

import {
  SafetyAdditionalItemsAudit,
  SafetyDgAudit,
  SafetyDocumentsAudit,
  SafetyEarthingAudit,
  SafetyElevatorAudit,
  SafetyGeneralAudit,
  SafetyLeakInspectionAudit,
  SafetyLdbAudit,
  SafetyLoadAnalysisAudit,
  SafetyMeteringRoomAudit,
  SafetyPacVentilationAudit,
  SafetyPanelRoomAudit,
  SafetyPumpCompressorAudit,
  SafetyThermographyAudit,
  SafetyTransformerAudit,
  SafetyUpsAudit,
  SafetyWiringAudit,
} from "../../modals/safety-audit/index.js";

/** Aligns with safety report registry keys for stable nested JSON. */
const SAFETY_AUDIT_MODEL_ENTRIES = Object.freeze([
  { key: "safety_general", Model: SafetyGeneralAudit },
  { key: "safety_documents", Model: SafetyDocumentsAudit },
  { key: "safety_earthing", Model: SafetyEarthingAudit },
  { key: "safety_panel_room", Model: SafetyPanelRoomAudit },
  { key: "safety_metering_room", Model: SafetyMeteringRoomAudit },
  { key: "safety_ldb", Model: SafetyLdbAudit },
  { key: "safety_transformer", Model: SafetyTransformerAudit },
  { key: "safety_dg", Model: SafetyDgAudit },
  { key: "safety_ups", Model: SafetyUpsAudit },
  { key: "safety_wiring", Model: SafetyWiringAudit },
  { key: "safety_load_analysis", Model: SafetyLoadAnalysisAudit },
  { key: "safety_leak_inspection", Model: SafetyLeakInspectionAudit },
  { key: "safety_thermography", Model: SafetyThermographyAudit },
  { key: "safety_pump_compressor", Model: SafetyPumpCompressorAudit },
  { key: "safety_elevator", Model: SafetyElevatorAudit },
  { key: "safety_pac_ventilation", Model: SafetyPacVentilationAudit },
  { key: "safety_additional_items", Model: SafetyAdditionalItemsAudit },
]);

export const ELECTRICAL_ENERGY_AUDIT_LABEL = "Electrical Energy Audit";
export const ELECTRICAL_SAFETY_AUDIT_LABEL = "Electrical Safety Audit";

function createEnergyBuckets(accounts) {
  /** @type {Map<string, Record<string, unknown>>} */
  const map = new Map();
  for (const acc of accounts) {
    map.set(String(acc._id), {
      utility_account: acc,
      tariffs: [],
      billing_records: [],
      solar_plants: [],
      dg_sets: [],
      transformers: [],
      pumps: [],
      hvac_audits: [],
      lighting_audits: [],
      lux_measurements: [],
      misc_load_audits: [],
      ac_audit_records: [],
      fan_audit_records: [],
    });
  }
  return map;
}

function createSafetyBuckets(accounts) {
  /** @type {Map<string, Record<string, unknown>>} */
  const map = new Map();
  for (const acc of accounts) {
    map.set(String(acc._id), {
      utility_account: acc,
      safety_sections: Object.fromEntries(
        SAFETY_AUDIT_MODEL_ENTRIES.map(({ key }) => [key, []]),
      ),
    });
  }
  return map;
}

/**
 * @param {Map<string, Record<string, unknown>>} buckets
 * @param {object[]} docs
 * @param {string} bucketArrayKey
 */
function distributeByUtilityAccountId(buckets, docs, bucketArrayKey) {
  for (const doc of docs) {
    const uaId = doc?.utility_account_id;
    if (!uaId) continue;
    const row = buckets.get(String(uaId));
    if (!row) continue;
    const arr = row[bucketArrayKey];
    if (Array.isArray(arr)) arr.push(doc);
  }
}

/** @param {object[]} docs @param {string} parentField */
function groupDocsByParentIdField(docs, parentField) {
  /** @type {Map<string, object[]>} */
  const map = new Map();
  for (const doc of docs || []) {
    const pid = doc?.[parentField];
    if (pid == null) continue;
    const key = String(pid);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(doc);
  }
  return map;
}

/**
 * Attach solar/DG/transformer/pump audit rows under their parent equipment document per utility bucket.
 * @param {Map<string, Record<string, unknown>>} buckets
 * @param {object[]} solarGenRecords
 * @param {object[]} dgAuditRecords
 * @param {object[]} transformerAuditRecords
 * @param {object[]} pumpAuditRecords
 */
function nestEnergyAuditRecordsUnderEquipment(
  buckets,
  solarGenRecords,
  dgAuditRecords,
  transformerAuditRecords,
  pumpAuditRecords,
) {
  const bySolarPlant = groupDocsByParentIdField(solarGenRecords, "solar_plant_id");
  const byDgSet = groupDocsByParentIdField(dgAuditRecords, "dg_set_id");
  const byTransformer = groupDocsByParentIdField(
    transformerAuditRecords,
    "transformer_id",
  );
  const byPump = groupDocsByParentIdField(pumpAuditRecords, "pump_id");

  for (const row of buckets.values()) {
    row.solar_plants = (row.solar_plants || []).map((plant) => ({
      ...plant,
      solar_generation_records:
        bySolarPlant.get(String(plant._id)) ?? [],
    }));
    row.dg_sets = (row.dg_sets || []).map((dg) => ({
      ...dg,
      dg_audit_records: byDgSet.get(String(dg._id)) ?? [],
    }));
    row.transformers = (row.transformers || []).map((t) => ({
      ...t,
      transformer_audit_records: byTransformer.get(String(t._id)) ?? [],
    }));
    row.pumps = (row.pumps || []).map((p) => ({
      ...p,
      pump_audit_records: byPump.get(String(p._id)) ?? [],
    }));
  }
}

function toFacilityObjectId(facilityRef) {
  return facilityRef instanceof mongoose.Types.ObjectId
    ? facilityRef
    : new mongoose.Types.ObjectId(String(facilityRef));
}

/**
 * Electrical Energy Audit domain: tariffs, billing, equipment & audit records nested under each utility account.
 * @param {import("mongoose").Types.ObjectId | string} facilityRef
 */
export async function aggregateElectricalEnergyAuditForFacility(facilityRef) {
  const fid = toFacilityObjectId(facilityRef);

  const facilityDoc = await Facility.findById(fid).lean();
  const accounts = await UtilityAccount.find({ facility_id: fid })
    .sort({ account_number: 1 })
    .lean();

  const accountIds = accounts.map((a) => a._id);

  const [
    tariffs,
    billingRecords,
    solarPlants,
    dgSets,
    transformers,
    pumps,
    hvacAudits,
    lightingAudits,
    luxMeasurements,
    miscLoads,
    solarGenRecords,
    dgAuditRecords,
    transformerAuditRecords,
    pumpAuditRecords,
    acAuditRecords,
    fanAuditRecords,
  ] = await Promise.all([
    accountIds.length
      ? UtilityTariff.find({ utility_account_id: { $in: accountIds } }).lean()
      : [],
    accountIds.length
      ? UtilityBillingRecord.find({
          utility_account_id: { $in: accountIds },
        }).lean()
      : [],
    SolarPlant.find({ facility_id: fid }).lean(),
    DGSet.find({ facility_id: fid }).lean(),
    Transformer.find({ facility_id: fid }).lean(),
    Pump.find({ facility_id: fid }).lean(),
    HVACAudit.find({ facility_id: fid }).lean(),
    LightingAuditRecord.find({ facility_id: fid }).lean(),
    LuxMeasurement.find({ facility_id: fid }).lean(),
    MiscLoadAuditRecord.find({ facility_id: fid }).lean(),
    SolarGenerationRecord.find({ facility_id: fid }).lean(),
    DGAuditRecord.find({ facility_id: fid }).lean(),
    TransformerAuditRecord.find({ facility_id: fid }).lean(),
    PumpAuditRecord.find({ facility_id: fid }).lean(),
    ACAuditRecord.find({ facility_id: fid }).lean(),
    FanAuditRecord.find({ facility_id: fid }).lean(),
  ]);

  const buckets = createEnergyBuckets(accounts);

  distributeByUtilityAccountId(buckets, tariffs, "tariffs");
  distributeByUtilityAccountId(buckets, billingRecords, "billing_records");
  distributeByUtilityAccountId(buckets, solarPlants, "solar_plants");
  distributeByUtilityAccountId(buckets, dgSets, "dg_sets");
  distributeByUtilityAccountId(buckets, transformers, "transformers");
  distributeByUtilityAccountId(buckets, pumps, "pumps");
  distributeByUtilityAccountId(buckets, hvacAudits, "hvac_audits");
  distributeByUtilityAccountId(buckets, lightingAudits, "lighting_audits");
  distributeByUtilityAccountId(buckets, luxMeasurements, "lux_measurements");
  distributeByUtilityAccountId(buckets, miscLoads, "misc_load_audits");
  nestEnergyAuditRecordsUnderEquipment(
    buckets,
    solarGenRecords,
    dgAuditRecords,
    transformerAuditRecords,
    pumpAuditRecords,
  );
  distributeByUtilityAccountId(buckets, acAuditRecords, "ac_audit_records");
  distributeByUtilityAccountId(buckets, fanAuditRecords, "fan_audit_records");

  return {
    audit_type: ELECTRICAL_ENERGY_AUDIT_LABEL,
    facility_id: String(fid),
    facility: facilityDoc,
    utility_accounts: [...buckets.values()],
  };
}

/**
 * Electrical Safety Audit: all checklist collections nested under `safety_sections` per utility account.
 * @param {import("mongoose").Types.ObjectId | string} facilityRef
 */
export async function aggregateElectricalSafetyAuditForFacility(facilityRef) {
  const fid = toFacilityObjectId(facilityRef);

  const facilityDoc = await Facility.findById(fid)
    .populate("auditor_id", "name email")
    .lean();
  const accounts = await UtilityAccount.find({ facility_id: fid })
    .sort({ account_number: 1 })
    .lean();

  const buckets = createSafetyBuckets(accounts);

  const auditorPopulate = { path: "auditor_id", select: "name email" };
  const safetyDocArrays = await Promise.all(
    SAFETY_AUDIT_MODEL_ENTRIES.map(({ Model }) =>
      Model.find({ facility_id: fid }).populate(auditorPopulate).lean(),
    ),
  );

  SAFETY_AUDIT_MODEL_ENTRIES.forEach(({ key }, idx) => {
    const docs = safetyDocArrays[idx] || [];
    for (const doc of docs) {
      const uaId = doc?.utility_account_id;
      if (!uaId) continue;
      const row = buckets.get(String(uaId));
      if (!row?.safety_sections?.[key]) continue;
      row.safety_sections[key].push(doc);
    }
  });

  return {
    audit_type: ELECTRICAL_SAFETY_AUDIT_LABEL,
    facility_id: String(fid),
    facility: facilityDoc,
    utility_accounts: [...buckets.values()],
  };
}

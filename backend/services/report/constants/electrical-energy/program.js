/** Matches `facility.audit_type` enum in `modals/facility.js`. */
export const ELECTRICAL_ENERGY_AUDIT = "Electrical Energy Audit";

export const isElectricalEnergyAuditFacility = (facility) =>
  facility?.audit_type === ELECTRICAL_ENERGY_AUDIT;

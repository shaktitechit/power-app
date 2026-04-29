/**
 * Authorization resource keys (API / domain vocabulary).
 * Keep in sync with policies/rolePolicies.js and services/authorization.
 */
export const RESOURCES = {
  FACILITY: "facility",
  UTILITY_ACCOUNT: "utility_account",
  UTILITY_AUDIT_FLOW: "utility_audit_flow",

  UTILITY_BILLING: "utility_billing",
  UTILITY_TARIFF: "utility_tariff",

  SOLAR_PLANT: "solar_plant",
  SOLAR_GENERATION: "solar_generation",
  DG_SET: "dg_set",
  DG_AUDIT: "dg_audit",
  TRANSFORMER: "transformer",
  TRANSFORMER_AUDIT: "transformer_audit",
  PUMP: "pump",
  PUMP_AUDIT: "pump_audit",
  HVAC_AUDIT: "hvac_audit",
  AC_AUDIT: "ac_audit",
  LIGHTING_AUDIT: "lighting_audit",
  FAN_AUDIT: "fan_audit",
  LUX_MEASUREMENT: "lux_measurement",
  MISC_LOAD_AUDIT: "misc_load_audit",

  REPORT: "report",
  USER: "user",
  USER_PROFILE: "user_profile",
  USER_PERFORMANCE: "user_performance",

  DASHBOARD: "dashboard",
  ANALYTICS: "analytics",
  FILE: "file",
};

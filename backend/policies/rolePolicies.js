import { RESOURCES } from "../constants/resources.js";
import { ACTIONS } from "../constants/actions.js";

const R = RESOURCES;
const A = ACTIONS;

/**
 * Default policy bundles per role. User.permissions[] merges after these (additive).
 * Scopes: "all" = org-wide for that resource/action; "assigned" = owner or FacilityAuditor;
 * "own" = resource owner / self only; "none" = no access (explicit deny slot).
 */
export const rolePolicies = {
  super_admin: [{ resource: "*", actions: ["*"], scope: "all" }],

  admin: [
    { resource: R.FACILITY, actions: [A.CREATE, A.READ, A.UPDATE, A.DELETE], scope: "all" },
    {
      resource: R.FACILITY,
      actions: [A.CLOSE_FACILITY_AUDIT, A.REOPEN_FACILITY_AUDIT],
      scope: "all",
    },
    {
      resource: R.UTILITY_ACCOUNT,
      actions: [A.CREATE, A.READ, A.UPDATE, A.DELETE],
      scope: "all",
    },
    {
      resource: R.UTILITY_AUDIT_FLOW,
      actions: [
        A.SUBMIT_AUDIT_STEP,
        A.ALLOW_AUDIT_STEP,
        A.DECLARE_NO_DATA,
        A.CLEAR_NO_DATA,
      ],
      scope: "all",
    },
    {
      resource: R.UTILITY_BILLING,
      actions: [A.CREATE, A.READ, A.UPDATE, A.DELETE],
      scope: "all",
    },
    {
      resource: R.UTILITY_TARIFF,
      actions: [A.CREATE, A.READ, A.UPDATE, A.DELETE],
      scope: "all",
    },
    {
      resource: R.SOLAR_PLANT,
      actions: [A.CREATE, A.READ, A.UPDATE, A.DELETE],
      scope: "all",
    },
    {
      resource: R.SOLAR_GENERATION,
      actions: [A.CREATE, A.READ, A.UPDATE, A.DELETE],
      scope: "all",
    },
    {
      resource: R.DG_SET,
      actions: [A.CREATE, A.READ, A.UPDATE, A.DELETE],
      scope: "all",
    },
    {
      resource: R.DG_AUDIT,
      actions: [A.CREATE, A.READ, A.UPDATE, A.DELETE],
      scope: "all",
    },
    {
      resource: R.TRANSFORMER,
      actions: [A.CREATE, A.READ, A.UPDATE, A.DELETE],
      scope: "all",
    },
    {
      resource: R.TRANSFORMER_AUDIT,
      actions: [A.CREATE, A.READ, A.UPDATE, A.DELETE],
      scope: "all",
    },
    {
      resource: R.PUMP,
      actions: [A.CREATE, A.READ, A.UPDATE, A.DELETE],
      scope: "all",
    },
    {
      resource: R.PUMP_AUDIT,
      actions: [A.CREATE, A.READ, A.UPDATE, A.DELETE],
      scope: "all",
    },
    {
      resource: R.HVAC_AUDIT,
      actions: [A.CREATE, A.READ, A.UPDATE, A.DELETE],
      scope: "all",
    },
    {
      resource: R.AC_AUDIT,
      actions: [A.CREATE, A.READ, A.UPDATE, A.DELETE],
      scope: "all",
    },
    {
      resource: R.LIGHTING_AUDIT,
      actions: [A.CREATE, A.READ, A.UPDATE, A.DELETE],
      scope: "all",
    },
    {
      resource: R.FAN_AUDIT,
      actions: [A.CREATE, A.READ, A.UPDATE, A.DELETE],
      scope: "all",
    },
    {
      resource: R.LUX_MEASUREMENT,
      actions: [A.CREATE, A.READ, A.UPDATE, A.DELETE],
      scope: "all",
    },
    {
      resource: R.MISC_LOAD_AUDIT,
      actions: [A.CREATE, A.READ, A.UPDATE, A.DELETE],
      scope: "all",
    },
    {
      resource: R.REPORT,
      actions: [
        A.CREATE,
        A.READ,
        A.UPDATE,
        A.DELETE,
        A.EXPORT,
        A.DOWNLOAD,
        A.GENERATE_REPORT,
        A.VIEW_REPORT,
      ],
      scope: "all",
    },
    {
      resource: R.USER,
      actions: [A.CREATE, A.READ, A.UPDATE, A.DELETE],
      scope: "all",
    },
    { resource: R.USER_PERFORMANCE, actions: [A.READ], scope: "all" },
    { resource: R.DASHBOARD, actions: [A.READ], scope: "all" },
    { resource: R.ANALYTICS, actions: [A.READ], scope: "all" },
    { resource: R.FILE, actions: [A.READ, A.DOWNLOAD, A.VIEW_DOCUMENT], scope: "all" },
  ],

  manager: [
    {
      resource: R.FACILITY,
      actions: [
        A.READ,
        A.UPDATE,
        A.ASSIGN,
        A.CLOSE_FACILITY_AUDIT,
        A.REOPEN_FACILITY_AUDIT,
      ],
      scope: "assigned",
    },
    {
      resource: R.UTILITY_ACCOUNT,
      actions: [A.CREATE, A.READ, A.UPDATE],
      scope: "assigned",
    },
    {
      resource: R.UTILITY_AUDIT_FLOW,
      actions: [
        A.SUBMIT_AUDIT_STEP,
        A.ALLOW_AUDIT_STEP,
        A.DECLARE_NO_DATA,
        A.CLEAR_NO_DATA,
      ],
      scope: "assigned",
    },
    {
      resource: R.UTILITY_BILLING,
      actions: [A.CREATE, A.READ, A.UPDATE, A.DELETE],
      scope: "assigned",
    },
    {
      resource: R.UTILITY_TARIFF,
      actions: [A.CREATE, A.READ, A.UPDATE, A.DELETE],
      scope: "assigned",
    },
    {
      resource: R.SOLAR_PLANT,
      actions: [A.CREATE, A.READ, A.UPDATE, A.DELETE],
      scope: "assigned",
    },
    {
      resource: R.SOLAR_GENERATION,
      actions: [A.CREATE, A.READ, A.UPDATE, A.DELETE],
      scope: "assigned",
    },
    {
      resource: R.DG_SET,
      actions: [A.CREATE, A.READ, A.UPDATE, A.DELETE],
      scope: "assigned",
    },
    {
      resource: R.DG_AUDIT,
      actions: [A.CREATE, A.READ, A.UPDATE, A.DELETE],
      scope: "assigned",
    },
    {
      resource: R.TRANSFORMER,
      actions: [A.CREATE, A.READ, A.UPDATE, A.DELETE],
      scope: "assigned",
    },
    {
      resource: R.TRANSFORMER_AUDIT,
      actions: [A.CREATE, A.READ, A.UPDATE, A.DELETE],
      scope: "assigned",
    },
    {
      resource: R.PUMP,
      actions: [A.CREATE, A.READ, A.UPDATE, A.DELETE],
      scope: "assigned",
    },
    {
      resource: R.PUMP_AUDIT,
      actions: [A.CREATE, A.READ, A.UPDATE, A.DELETE],
      scope: "assigned",
    },
    {
      resource: R.HVAC_AUDIT,
      actions: [A.CREATE, A.READ, A.UPDATE, A.DELETE],
      scope: "assigned",
    },
    {
      resource: R.AC_AUDIT,
      actions: [A.CREATE, A.READ, A.UPDATE, A.DELETE],
      scope: "assigned",
    },
    {
      resource: R.LIGHTING_AUDIT,
      actions: [A.CREATE, A.READ, A.UPDATE, A.DELETE],
      scope: "assigned",
    },
    {
      resource: R.FAN_AUDIT,
      actions: [A.CREATE, A.READ, A.UPDATE, A.DELETE],
      scope: "assigned",
    },
    {
      resource: R.LUX_MEASUREMENT,
      actions: [A.CREATE, A.READ, A.UPDATE, A.DELETE],
      scope: "assigned",
    },
    {
      resource: R.MISC_LOAD_AUDIT,
      actions: [A.CREATE, A.READ, A.UPDATE, A.DELETE],
      scope: "assigned",
    },
    {
      resource: R.REPORT,
      actions: [
        A.CREATE,
        A.READ,
        A.UPDATE,
        A.DELETE,
        A.EXPORT,
        A.DOWNLOAD,
        A.GENERATE_REPORT,
        A.VIEW_REPORT,
      ],
      scope: "assigned",
    },
    {
      resource: R.FILE,
      actions: [A.READ, A.DOWNLOAD, A.VIEW_DOCUMENT],
      scope: "all",
    },
    { resource: R.DASHBOARD, actions: [A.READ], scope: "all" },
    { resource: R.ANALYTICS, actions: [A.READ], scope: "all" },
  ],

  auditor: [
    {
      resource: R.FACILITY,
      actions: [A.READ, A.UPDATE, A.CLOSE_FACILITY_AUDIT],
      scope: "assigned",
    },
    { resource: R.FACILITY, actions: [A.DELETE], scope: "own" },
    {
      resource: R.UTILITY_ACCOUNT,
      actions: [A.CREATE, A.READ, A.UPDATE, A.DELETE],
      scope: "assigned",
    },
    {
      resource: R.UTILITY_AUDIT_FLOW,
      actions: [A.SUBMIT_AUDIT_STEP, A.DECLARE_NO_DATA, A.CLEAR_NO_DATA],
      scope: "assigned",
    },
    {
      resource: R.UTILITY_BILLING,
      actions: [A.CREATE, A.READ, A.UPDATE, A.DELETE],
      scope: "assigned",
    },
    {
      resource: R.UTILITY_TARIFF,
      actions: [A.CREATE, A.READ, A.UPDATE, A.DELETE],
      scope: "assigned",
    },
    {
      resource: R.SOLAR_PLANT,
      actions: [A.CREATE, A.READ, A.UPDATE, A.DELETE],
      scope: "assigned",
    },
    {
      resource: R.SOLAR_GENERATION,
      actions: [A.CREATE, A.READ, A.UPDATE, A.DELETE],
      scope: "assigned",
    },
    {
      resource: R.DG_SET,
      actions: [A.CREATE, A.READ, A.UPDATE, A.DELETE],
      scope: "assigned",
    },
    {
      resource: R.DG_AUDIT,
      actions: [A.CREATE, A.READ, A.UPDATE, A.DELETE],
      scope: "assigned",
    },
    {
      resource: R.TRANSFORMER,
      actions: [A.CREATE, A.READ, A.UPDATE, A.DELETE],
      scope: "assigned",
    },
    {
      resource: R.TRANSFORMER_AUDIT,
      actions: [A.CREATE, A.READ, A.UPDATE, A.DELETE],
      scope: "assigned",
    },
    {
      resource: R.PUMP,
      actions: [A.CREATE, A.READ, A.UPDATE, A.DELETE],
      scope: "assigned",
    },
    {
      resource: R.PUMP_AUDIT,
      actions: [A.CREATE, A.READ, A.UPDATE, A.DELETE],
      scope: "assigned",
    },
    {
      resource: R.HVAC_AUDIT,
      actions: [A.CREATE, A.READ, A.UPDATE, A.DELETE],
      scope: "assigned",
    },
    {
      resource: R.AC_AUDIT,
      actions: [A.CREATE, A.READ, A.UPDATE, A.DELETE],
      scope: "assigned",
    },
    {
      resource: R.LIGHTING_AUDIT,
      actions: [A.CREATE, A.READ, A.UPDATE, A.DELETE],
      scope: "assigned",
    },
    {
      resource: R.FAN_AUDIT,
      actions: [A.CREATE, A.READ, A.UPDATE, A.DELETE],
      scope: "assigned",
    },
    {
      resource: R.LUX_MEASUREMENT,
      actions: [A.CREATE, A.READ, A.UPDATE, A.DELETE],
      scope: "assigned",
    },
    {
      resource: R.MISC_LOAD_AUDIT,
      actions: [A.CREATE, A.READ, A.UPDATE, A.DELETE],
      scope: "assigned",
    },
    {
      resource: R.REPORT,
      actions: [
        A.READ,
        A.CREATE,
        A.UPDATE,
        A.DELETE,
        A.EXPORT,
        A.DOWNLOAD,
        A.GENERATE_REPORT,
        A.VIEW_REPORT,
      ],
      scope: "assigned",
    },
    {
      resource: R.FILE,
      actions: [A.READ, A.DOWNLOAD, A.VIEW_DOCUMENT],
      scope: "all",
    },
    { resource: R.USER_PROFILE, actions: [A.READ, A.UPDATE], scope: "own" },
    { resource: R.USER_PERFORMANCE, actions: [A.READ], scope: "own" },
    { resource: R.DASHBOARD, actions: [A.READ], scope: "assigned" },
  ],

};

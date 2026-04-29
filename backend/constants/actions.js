/**
 * Authorization action keys.
 * Keep in sync with policies/rolePolicies.js.
 */
export const ACTIONS = {
  CREATE: "create",
  READ: "read",
  EDIT: "edit",
  UPDATE: "update",
  DELETE: "delete",
  ASSIGN: "assign",
  APPROVE: "approve",
  EXPORT: "export",
  DOWNLOAD: "download",
  VIEW_REPORT: "view_report",
  GENERATE_REPORT: "generate_report",
  VIEW_DOCUMENT: "view_document",

  SUBMIT_AUDIT_STEP: "submit_audit_step",
  ALLOW_AUDIT_STEP: "allow_audit_step",
  DECLARE_NO_DATA: "declare_no_data",
  CLEAR_NO_DATA: "clear_no_data",

  CLOSE_FACILITY_AUDIT: "close_facility_audit",
  REOPEN_FACILITY_AUDIT: "reopen_facility_audit",
};

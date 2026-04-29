import type { SafetyAuditListArg } from "./safetyAuditTypes";

export function listParams(arg: SafetyAuditListArg) {
  if (!arg) return {};
  return {
    ...(arg.facility_id ? { facility_id: arg.facility_id } : {}),
    ...(arg.utility_account_id
      ? { utility_account_id: arg.utility_account_id }
      : {}),
    ...(arg.transformer_id ? { transformer_id: arg.transformer_id } : {}),
    ...(arg.dg_set_id ? { dg_set_id: arg.dg_set_id } : {}),
  };
}

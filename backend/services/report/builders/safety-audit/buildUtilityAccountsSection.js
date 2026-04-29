import { buildUtilityAccountsPayload } from "../shared/utility-accounts/buildUtilityAccountsPayload.js";

/** Electrical Safety Audit: utility list without energy-audit connection flags. */
export const buildUtilityAccountsSection = (args) =>
  buildUtilityAccountsPayload({ ...args, includeEnergyConnectionFields: false });

export default buildUtilityAccountsSection;

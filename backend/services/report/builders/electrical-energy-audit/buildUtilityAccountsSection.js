import { buildUtilityAccountsPayload } from "../shared/utility-accounts/buildUtilityAccountsPayload.js";

/** Electrical Energy Audit: include solar/DG/transformer/pump connection columns in utility payloads. */
export const buildUtilityAccountsSection = (args) =>
  buildUtilityAccountsPayload({ ...args, includeEnergyConnectionFields: true });

export default buildUtilityAccountsSection;

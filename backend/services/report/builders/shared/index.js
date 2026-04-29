/**
 * Cross-program report sections (cover, facility snapshot, recommendations).
 * Utility accounts: use {@link buildUtilityAccountsPayload} or program
 * `buildUtilityAccountsSection` under `electrical-energy-audit/` / `safety-audit/`.
 */
export { buildCoverSection } from "./buildCoverSection.js";
export { buildFacilityInfoSection } from "./buildFacilityInfoSection.js";
export { buildUtilityAccountsPayload } from "./utility-accounts/buildUtilityAccountsPayload.js";
export { buildRecommendationsSection } from "./buildRecommendationsSection.js";

import { type AuditTypeOption } from "./facilityConstants";

const AUDIT_TYPE_TO_SLUG: Record<AuditTypeOption, string> = {
  "Electrical Energy Audit": "electrical-energy-audit",
  "Electrical Safety Audit": "electrical-safety-audit",
  "Thermal Audit": "thermal-audit",
  "Lightning Arrester Audit": "lightning-arrester-audit",
};

const SLUG_TO_LABEL = Object.fromEntries(
  (Object.keys(AUDIT_TYPE_TO_SLUG) as AuditTypeOption[]).map((label) => [
    AUDIT_TYPE_TO_SLUG[label],
    label,
  ]),
) as Record<string, string>;

/** URL segment for `/facility/[auditType]/...` — same values as `auditTypeToSlug()`. */
export const AUDIT_TYPE_SLUG = {
  ELECTRICAL_ENERGY: AUDIT_TYPE_TO_SLUG["Electrical Energy Audit"],
  ELECTRICAL_SAFETY: AUDIT_TYPE_TO_SLUG["Electrical Safety Audit"],
  THERMAL: AUDIT_TYPE_TO_SLUG["Thermal Audit"],
  LIGHTNING_ARRESTER: AUDIT_TYPE_TO_SLUG["Lightning Arrester Audit"],
} as const;

export function isUtilityAccountWorkspaceSupportedSlug(
  slug: string | null | undefined,
): boolean {
  if (!slug) return false;
  return (
    slug === AUDIT_TYPE_SLUG.ELECTRICAL_ENERGY ||
    slug === AUDIT_TYPE_SLUG.ELECTRICAL_SAFETY
  );
}

export function isUtilityAccountComingSoonSlug(
  slug: string | null | undefined,
): boolean {
  if (!slug) return false;
  return (
    slug === AUDIT_TYPE_SLUG.THERMAL ||
    slug === AUDIT_TYPE_SLUG.LIGHTNING_ARRESTER
  );
}

const MONGO_OBJECT_ID = /^[a-f0-9]{24}$/i;

/** Path segment for the facility’s audit type, e.g. `electrical-energy-audit` */
export function auditTypeToSlug(
  auditType: string | null | undefined,
): string {
  if (auditType && auditType in AUDIT_TYPE_TO_SLUG) {
    return AUDIT_TYPE_TO_SLUG[auditType as AuditTypeOption];
  }
  if (!auditType?.trim()) return "electrical-energy-audit";
  return auditType
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export function slugToAuditTypeLabel(
  slug: string | null | undefined,
): string | null {
  if (!slug) return null;
  return SLUG_TO_LABEL[slug] ?? null;
}

export function isMongoObjectIdString(s: string): boolean {
  return MONGO_OBJECT_ID.test(s);
}

/** `/facility/{auditTypeSlug}/{facilityId}` */
export function facilityPath(
  auditType: string | null | undefined,
  facilityId: string,
): string {
  return `/facility/${auditTypeToSlug(auditType)}/${facilityId}`;
}

export function facilityUtilityPath(
  auditType: string | null | undefined,
  facilityId: string,
  utilityAccountId: string,
): string {
  return `${facilityPath(auditType, facilityId)}/utility-account/${utilityAccountId}`;
}

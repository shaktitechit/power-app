/**
 * Application roles (aligned with backend User.role enum).
 */
export const USER_ROLES = [
  "super_admin",
  "admin",
  "manager",
  "auditor",
] as const;

export type AppUserRole = (typeof USER_ROLES)[number];
export type PermissionScope = "all" | "assigned" | "own" | "none";

export interface UserPermission {
  resource: string;
  actions: string[];
  scope: PermissionScope;
}

const ACTION_ALIASES: Record<string, string> = {
  edit: "update",
  update: "edit",
  view_report: "read",
  read: "view_report",
  generate_report: "create",
  create: "generate_report",
  view_document: "read",
};

const ROLE_FALLBACK_PERMISSIONS: Record<string, Record<string, string[]>> = {
  manager: {
    facility: [
      "read",
      "update",
      "assign",
      "close_facility_audit",
      "reopen_facility_audit",
    ],
    utility_account: ["create", "read", "update"],
    utility_audit_flow: [
      "submit_audit_step",
      "allow_audit_step",
      "declare_no_data",
      "clear_no_data",
    ],
    utility_billing: ["create", "read", "update", "delete"],
    utility_tariff: ["create", "read", "update", "delete"],
    solar_plant: ["create", "read", "update", "delete"],
    solar_generation: ["create", "read", "update", "delete"],
    dg_set: ["create", "read", "update", "delete"],
    dg_audit: ["create", "read", "update", "delete"],
    transformer: ["create", "read", "update", "delete"],
    transformer_audit: ["create", "read", "update", "delete"],
    pump: ["create", "read", "update", "delete"],
    pump_audit: ["create", "read", "update", "delete"],
    hvac_audit: ["create", "read", "update", "delete"],
    ac_audit: ["create", "read", "update", "delete"],
    lighting_audit: ["create", "read", "update", "delete"],
    fan_audit: ["create", "read", "update", "delete"],
    lux_measurement: ["create", "read", "update", "delete"],
    misc_load_audit: ["create", "read", "update", "delete"],
    report: [
      "read",
      "create",
      "update",
      "delete",
      "download",
      "export",
      "generate_report",
      "view_report",
    ],
    dashboard: ["read"],
    analytics: ["read"],
  },
  auditor: {
    facility: ["read", "update", "close_facility_audit"],
    utility_account: ["create", "read", "update", "delete"],
    utility_audit_flow: [
      "submit_audit_step",
      "declare_no_data",
      "clear_no_data",
    ],
    utility_billing: ["create", "read", "update", "delete"],
    utility_tariff: ["create", "read", "update", "delete"],
    solar_plant: ["create", "read", "update", "delete"],
    solar_generation: ["create", "read", "update", "delete"],
    dg_set: ["create", "read", "update", "delete"],
    dg_audit: ["create", "read", "update", "delete"],
    transformer: ["create", "read", "update", "delete"],
    transformer_audit: ["create", "read", "update", "delete"],
    pump: ["create", "read", "update", "delete"],
    pump_audit: ["create", "read", "update", "delete"],
    hvac_audit: ["create", "read", "update", "delete"],
    ac_audit: ["create", "read", "update", "delete"],
    lighting_audit: ["create", "read", "update", "delete"],
    fan_audit: ["create", "read", "update", "delete"],
    lux_measurement: ["create", "read", "update", "delete"],
    misc_load_audit: ["create", "read", "update", "delete"],
    report: [
      "read",
      "create",
      "update",
      "delete",
      "export",
      "download",
      "generate_report",
      "view_report",
    ],
    user_profile: ["read", "update"],
    user_performance: ["read"],
    dashboard: ["read"],
  },
};

function hasRoleFallbackPermission(
  role: string | null | undefined,
  resource: string,
  action: string,
): boolean {
  if (!role) return false;
  const roleMap = ROLE_FALLBACK_PERMISSIONS[role];
  if (!roleMap) return false;
  const allowedActions = roleMap[resource];
  if (!allowedActions?.length) return false;

  const reverseAliases = Object.entries(ACTION_ALIASES)
    .filter(([, mapped]) => mapped === action)
    .map(([source]) => source);
  const actionCandidates = Array.from(
    new Set([action, ACTION_ALIASES[action], ...reverseAliases].filter(Boolean)),
  );

  return actionCandidates.some((candidate) => allowedActions.includes(candidate));
}

/** Roles that may be assigned when creating/editing users in the admin UI. */
export const ASSIGNABLE_USER_ROLES: AppUserRole[] = [...USER_ROLES];

export function isPlatformAdmin(
  role: string | null | undefined,
): boolean {
  return role === "admin" || role === "super_admin";
}

export function hasPermission(
  role: string | null | undefined,
  permissions: UserPermission[] = [],
  resource: string,
  action: string,
  scope: PermissionScope | "any" = "any",
): boolean {
  if (isPlatformAdmin(role)) return true;

  const reverseAliases = Object.entries(ACTION_ALIASES)
    .filter(([, mapped]) => mapped === action)
    .map(([source]) => source);
  const actionCandidates = Array.from(
    new Set([action, ACTION_ALIASES[action], ...reverseAliases].filter(Boolean)),
  );
  return permissions.some((permission) => {
    const resourceMatch =
      permission.resource === "*" || permission.resource === resource;
    const actionMatch =
      permission.actions?.includes("*") ||
      actionCandidates.some((candidate) => permission.actions?.includes(candidate));
    const scopeMatch = scope === "any" || permission.scope === scope;
    return resourceMatch && actionMatch && scopeMatch;
  });
}

export function hasPermissionStrict(
  permissions: UserPermission[] = [],
  resource: string,
  action: string,
  scope: PermissionScope = "all",
): boolean {
  const reverseAliases = Object.entries(ACTION_ALIASES)
    .filter(([, mapped]) => mapped === action)
    .map(([source]) => source);
  const actionCandidates = Array.from(
    new Set([action, ACTION_ALIASES[action], ...reverseAliases].filter(Boolean)),
  );

  return permissions.some((permission) => {
    const resourceMatch =
      permission.resource === "*" || permission.resource === resource;
    const actionMatch =
      permission.actions?.includes("*") ||
      actionCandidates.some((candidate) => permission.actions?.includes(candidate));
    const scopeMatch = permission.scope === scope;
    return resourceMatch && actionMatch && scopeMatch;
  });
}

/**
 * Can open the /reports app (not the users hub).
 * Admin/super_admin: all facilities. Manager/auditor: use reports for assigned facilities only (API enforces).
 */
export function canAccessReportsHub(
  role: string | null | undefined,
  permissions: UserPermission[] = [],
): boolean {
  if (isPlatformAdmin(role)) return true;
  if (role === "manager" || role === "auditor") {
    return (
      hasRoleFallbackPermission(role, "report", "read") ||
      hasRoleFallbackPermission(role, "report", "view_report") ||
      hasPermission(role, permissions, "report", "read")
    );
  }
  return hasPermissionStrict(permissions, "report", "read", "all");
}

export function canAccessUsersHub(
  role: string | null | undefined,
  permissions: UserPermission[] = [],
): boolean {
  if (role === "super_admin" || role === "admin") return true;

  return (
    hasPermissionStrict(permissions, "user", "read", "all") ||
    hasPermissionStrict(permissions, "report", "read", "all")
  );
}

/** Performance hub: list and view user performance (admin / super admin only). */
export function canAccessPerformanceHub(
  role: string | null | undefined,
): boolean {
  return role === "super_admin" || role === "admin";
}

/**
 * View uploaded documents anywhere in the app. Only super admin, admin, and manager;
 * enforced server-side for `/files/*` routes as well.
 */
export function canViewDocuments(
  role: string | null | undefined,
  _permissions: UserPermission[] = [],
): boolean {
  return (
    role === "super_admin" ||
    role === "admin" ||
    role === "manager" ||
    role === "auditor"
  );
}

export function canManageResource(
  role: string | null | undefined,
  permissions: UserPermission[] = [],
  resource: string,
  action: string,
): boolean {
  if (hasRoleFallbackPermission(role, resource, action)) return true;
  return hasPermission(role, permissions, resource, action);
}

export function canGenerateReports(
  role: string | null | undefined,
  permissions: UserPermission[] = [],
): boolean {
  return (
    canManageResource(role, permissions, "report", "generate_report") ||
    canManageResource(role, permissions, "report", "create")
  );
}

export function formatRoleLabel(role: string | undefined | null): string {
  if (!role) return "—";
  return role
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Can delete audit records (electrical, safety, etc.).
 * Only super_admin and admin are allowed to delete records.
 * Copy-paste of `user?.role === 'super_admin' || user?.role === 'admin'`
 * centralised here to avoid 14+ duplicate definitions across audit components.
 */
export function canDeleteAuditRecords(
  role: string | null | undefined,
): boolean {
  return role === "super_admin" || role === "admin";
}

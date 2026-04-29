import UtilityAccount from "../../../../../modals/utilityAccount.js";
import User from "../../../../../modals/user.js";
import {
  FINAL_UTILITY_AUDIT_STEP,
  LEGACY_FINAL_UTILITY_AUDIT_STEP,
} from "../../../../../helpers/auditState.js";

/** Energy-audit-only connection flags; hidden when `includeEnergyConnectionFields` is false. */
const ENERGY_CONNECTION_FIELD_LABELS = new Set([
  "Solar Connected",
  "DG Connected",
  "Transformer Connected",
  "Pump Connected",
  "Transformer Maintained By Facility",
]);

const normalizeText = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const normalizeNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
};

const normalizeBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null) return defaultValue;
  return Boolean(value);
};

const getId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value?._id) return String(value._id);
  if (value?.id) return String(value.id);
  if (value?.toString && typeof value.toString === "function") {
    const str = String(value.toString());
    return str === "[object Object]" ? "" : str;
  }
  return "";
};

const normalizeDocument = (doc) => {
  if (!doc) return null;

  return {
    fileUrl: normalizeText(doc.fileUrl),
    fileName: normalizeText(doc.fileName),
    fileType: normalizeText(doc.fileType),
    uploadedAt: doc.uploadedAt || null,
  };
};

const formatNumber = (value, decimals = 2) => {
  const num = normalizeNumber(value);
  if (num === null) return "";
  return num.toFixed(decimals);
};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB");
};

const getUserDisplayName = (user) => {
  if (!user) return "";
  if (typeof user === "string") return "";
  return normalizeText(user?.name) || normalizeText(user?.email);
};

const extractSubmissionEntries = (account) => {
  const submissions = account?.audit_step_submissions;
  return (
    submissions && typeof submissions === "object"
      ? Object.entries(submissions)
          .map(([step, item]) => ({ step, ...(item || {}) }))
          .filter((item) => item && typeof item === "object")
      : []
  );
};

const resolveAuditUserLabel = (userId, userMap) => {
  const id = getId(userId);
  if (!id) return "";
  return userMap.get(id) || "Unknown User";
};

const getAuditDetails = (account, userMap) => {
  const entries = extractSubmissionEntries(account)
    .map((entry) => ({
      ...entry,
      submitted_at_date: entry?.submitted_at ? new Date(entry.submitted_at) : null,
      submitted_by_id: getId(entry?.submitted_by),
    }))
    .filter(
      (entry) =>
        entry.submitted_at_date && !Number.isNaN(entry.submitted_at_date.getTime()),
    );

  const sortedByDateAsc = [...entries].sort(
    (a, b) => a.submitted_at_date.getTime() - b.submitted_at_date.getTime(),
  );
  const startEntry = sortedByDateAsc[0] || null;

  const completedEntry =
    entries.find(
      (entry) =>
        entry.step === FINAL_UTILITY_AUDIT_STEP ||
        entry.step === LEGACY_FINAL_UTILITY_AUDIT_STEP,
    ) || null;

  const auditStartedAt = account?.created_at || account?.createdAt || null;
  const auditCompletedAt = completedEntry?.submitted_at || null;
  const startedBy =
    resolveAuditUserLabel(account?.auditor_id, userMap) ||
    resolveAuditUserLabel(startEntry?.submitted_by_id, userMap);
  const completedBy = resolveAuditUserLabel(completedEntry?.submitted_by_id, userMap);

  return {
    audit_start_date: auditStartedAt,
    audit_start_date_label: formatDate(auditStartedAt),
    started_by: startedBy,
    audit_completed_date: auditCompletedAt,
    audit_completed_date_label: formatDate(auditCompletedAt),
    completed_by: completedBy,
    submitted_steps: entries.length,
    is_completed: Boolean(auditCompletedAt),
    audit_status: auditCompletedAt
      ? "Completed"
      : entries.length > 0
        ? "In Progress"
        : "Not Started",
  };
};

const normalizeUtilityAccount = (
  account,
  index = 0,
  omitEnergyConnectionFields = false,
) => {
  const sanctionedDemand = normalizeNumber(account?.sanctioned_demand_kVA);

  const normalized = {
    id: getId(account),
    _id: getId(account),
    sr_no: index + 1,

    facility_id: getId(account?.facility_id),

    account_number: normalizeText(account?.account_number),
    connection_type: normalizeText(account?.connection_type),
    category: normalizeText(account?.category),

    sanctioned_demand_kVA: sanctionedDemand,
    sanctioned_demand_kVA_label:
      sanctionedDemand !== null ? formatNumber(sanctionedDemand) : "",

    is_solar_connected: normalizeBoolean(account?.is_solar_connected),
    is_dg_connected: normalizeBoolean(account?.is_dg_connected),
    is_transformer_connected: normalizeBoolean(
      account?.is_transformer_connected,
    ),
    is_pump_connected: normalizeBoolean(account?.is_pump_connected),
    is_transformer_maintained_by_facility: normalizeBoolean(
      account?.is_transformer_maintained_by_facility,
    ),
    is_active:
      account?.is_active === undefined
        ? true
        : normalizeBoolean(account?.is_active, true),

    flags: {
      solar: normalizeBoolean(account?.is_solar_connected),
      dg: normalizeBoolean(account?.is_dg_connected),
      transformer: normalizeBoolean(account?.is_transformer_connected),
      pump: normalizeBoolean(account?.is_pump_connected),
      transformer_maintained_by_facility: normalizeBoolean(
        account?.is_transformer_maintained_by_facility,
      ),
      active:
        account?.is_active === undefined
          ? true
          : normalizeBoolean(account?.is_active, true),
    },

    documents: Array.isArray(account?.documents)
      ? account.documents.map(normalizeDocument).filter(Boolean)
      : [],
    audit_step_submissions:
      account?.audit_step_submissions &&
      typeof account.audit_step_submissions === "object"
        ? account.audit_step_submissions
        : {},
    audit_date: account?.audit_date || null,
    audit_date_label: formatDate(account?.audit_date),
    auditor_id: getId(account?.auditor_id),

    created_at: account?.createdAt || account?.created_at || null,
    updated_at: account?.updatedAt || account?.updated_at || null,
  };

  const audit = {
    audit_start_date: null,
    audit_start_date_label: "",
    started_by: "",
    audit_completed_date: null,
    audit_completed_date_label: "",
    completed_by: "",
    submitted_steps: 0,
    is_completed: false,
    audit_status: "Not Started",
  };
  normalized.audit = audit;

  const displayRowsAll = [
    {
      label: "Account Number",
      value: normalized.account_number,
    },
    {
      label: "Connection Type",
      value: normalized.connection_type,
    },
    {
      label: "Category",
      value: normalized.category,
    },
    {
      label: "Sanctioned Demand (kVA)",
      value: normalized.sanctioned_demand_kVA ?? "",
    },
    {
      label: "Solar Connected",
      value: normalized.is_solar_connected ? "Yes" : "No",
    },
    {
      label: "DG Connected",
      value: normalized.is_dg_connected ? "Yes" : "No",
    },
    {
      label: "Transformer Connected",
      value: normalized.is_transformer_connected ? "Yes" : "No",
    },
    {
      label: "Pump Connected",
      value: normalized.is_pump_connected ? "Yes" : "No",
    },
    {
      label: "Transformer Maintained By Facility",
      value: normalized.is_transformer_maintained_by_facility ? "Yes" : "No",
    },
    {
      label: "Status",
      value: normalized.is_active ? "Active" : "Inactive",
    },
  ];
  normalized.display_rows = displayRowsAll
    .filter((row) => row.value !== "")
    .filter(
      (row) =>
        !omitEnergyConnectionFields ||
        !ENERGY_CONNECTION_FIELD_LABELS.has(row.label),
    );

  normalized.summary_cards = [
    {
      key: "account_number",
      label: "Account Number",
      value: normalized.account_number || "-",
    },
    {
      key: "connection_type",
      label: "Connection Type",
      value: normalized.connection_type || "-",
    },
    {
      key: "category",
      label: "Category",
      value: normalized.category || "-",
    },
    {
      key: "sanctioned_demand_kVA",
      label: "Sanctioned Demand (kVA)",
      value:
        normalized.sanctioned_demand_kVA !== null
          ? normalized.sanctioned_demand_kVA
          : "-",
    },
  ];

  return normalized;
};

const fetchFacilityUtilityAccounts = async (facilityId) => {
  if (!facilityId) return [];

  const accounts = await UtilityAccount.find({ facility_id: facilityId })
    .sort({ createdAt: 1, created_at: 1 })
    .lean();

  return Array.isArray(accounts) ? accounts : [];
};

const buildUserMap = async (accounts = []) => {
  const userIds = new Set();

  accounts.forEach((account) => {
    const auditorId = getId(account?.auditor_id);
    if (auditorId) userIds.add(auditorId);

    extractSubmissionEntries(account).forEach((entry) => {
      const submittedById = getId(entry?.submitted_by);
      if (submittedById) userIds.add(submittedById);
    });
  });

  if (!userIds.size) return new Map();

  const users = await User.find({ _id: { $in: [...userIds] } })
    .select("name email")
    .lean();

  return new Map(
    users.map((user) => [getId(user), getUserDisplayName(user)]).filter(([, v]) => v),
  );
};

const buildSummary = (
  utilityAccounts = [],
  omitEnergyConnectionFields = false,
) => {
  const base = {
    total_utility_accounts: utilityAccounts.length,
    total_active_utility_accounts: utilityAccounts.filter(
      (item) => item.is_active,
    ).length,
    total_inactive_utility_accounts: utilityAccounts.filter(
      (item) => !item.is_active,
    ).length,
  };
  if (omitEnergyConnectionFields) return base;
  return {
    ...base,
    total_solar_connected: utilityAccounts.filter(
      (item) => item.is_solar_connected,
    ).length,
    total_dg_connected: utilityAccounts.filter((item) => item.is_dg_connected)
      .length,
    total_transformer_connected: utilityAccounts.filter(
      (item) => item.is_transformer_connected,
    ).length,
    total_pump_connected: utilityAccounts.filter(
      (item) => item.is_pump_connected,
    ).length,
    total_transformer_maintained_by_facility: utilityAccounts.filter(
      (item) => item.is_transformer_maintained_by_facility,
    ).length,
  };
};

const buildGroupedSections = (
  accounts = [],
  omitEnergyConnectionFields = false,
) => {
  const sections = [];

  accounts.forEach((item) => {
    const accountDetailRows = [
      { field: "Account Number", value: item.account_number || "" },
      { field: "Connection Type", value: item.connection_type || "" },
      { field: "Category", value: item.category || "" },
      {
        field: "Sanctioned Demand (kVA)",
        value: item.sanctioned_demand_kVA ?? "",
      },
      {
        field: "Solar Connected",
        value: item.is_solar_connected ? "Yes" : "No",
      },
      { field: "DG Connected", value: item.is_dg_connected ? "Yes" : "No" },
      {
        field: "Transformer Connected",
        value: item.is_transformer_connected ? "Yes" : "No",
      },
      {
        field: "Pump Connected",
        value: item.is_pump_connected ? "Yes" : "No",
      },
      {
        field: "Transformer Maintained By Facility",
        value: item.is_transformer_maintained_by_facility ? "Yes" : "No",
      },
      { field: "Status", value: item.is_active ? "Active" : "Inactive" },
    ].filter(
      (row) =>
        !omitEnergyConnectionFields ||
        !ENERGY_CONNECTION_FIELD_LABELS.has(row.field),
    );

    sections.push({
      heading: `${item.account_number || "Utility Account"} - Account Details`,
      columns: ["field", "value"],
      rows: accountDetailRows,
    });

    sections.push({
      heading: `${item.account_number || "Utility Account"} - Audit Details`,
      columns: ["field", "value"],
      rows: [
        {
          field: "Audit Start Date",
          value: item.audit?.audit_start_date_label || "",
        },
        { field: "Started By", value: item.audit?.started_by || "" },
        { field: "Audit Status", value: item.audit?.audit_status || "" },
        {
          field: "Submitted Steps",
          value:
            item.audit?.submitted_steps !== null &&
            item.audit?.submitted_steps !== undefined
              ? String(item.audit.submitted_steps)
              : "",
        },
        {
          field: "Audit Completed Date",
          value: item.audit?.audit_completed_date_label || "",
        },
        { field: "Completed By", value: item.audit?.completed_by || "" },
      ],
    });
  });

  const summary = buildSummary(accounts, omitEnergyConnectionFields);

  const summaryRows = [
    {
      metric: "Total Utility Accounts",
      value: summary.total_utility_accounts,
    },
    {
      metric: "Active Accounts",
      value: summary.total_active_utility_accounts,
    },
    {
      metric: "Inactive Accounts",
      value: summary.total_inactive_utility_accounts,
    },
  ];
  if (!omitEnergyConnectionFields) {
    summaryRows.push(
      {
        metric: "Solar Connected",
        value: summary.total_solar_connected,
      },
      {
        metric: "DG Connected",
        value: summary.total_dg_connected,
      },
      {
        metric: "Transformer Connected",
        value: summary.total_transformer_connected,
      },
      {
        metric: "Pump Connected",
        value: summary.total_pump_connected,
      },
      {
        metric: "Transformer Maintained By Facility",
        value: summary.total_transformer_maintained_by_facility,
      },
    );
  }

  sections.push({
    heading: "Utility Account Summary",
    columns: ["metric", "value"],
    rows: summaryRows,
  });

  return sections;
};

/**
 * Program-agnostic utility account list + tables for report payloads.
 * Callers set `includeEnergyConnectionFields` (energy audit vs safety audit, etc.).
 */
export const buildUtilityAccountsPayload = async ({
  report,
  meta,
  facility,
  utilityAccount = null,
  scope = "facility",
  includeEnergyConnectionFields = true,
}) => {
  if (!report) {
    const error = new Error(
      "report is required in buildUtilityAccountsPayload",
    );
    error.statusCode = 500;
    throw error;
  }

  if (!facility) {
    const error = new Error(
      "facility is required in buildUtilityAccountsPayload",
    );
    error.statusCode = 500;
    throw error;
  }

  const omitEnergyConnectionFields = !includeEnergyConnectionFields;

  let accounts = [];

  if (scope === "utility_account") {
    if (utilityAccount) {
      accounts = [utilityAccount];
    } else if (meta?.utility_account_id) {
      const found = await UtilityAccount.findById(
        meta.utility_account_id,
      ).lean();
      if (found) accounts = [found];
    }
  } else {
    accounts = await fetchFacilityUtilityAccounts(
      facility?._id || facility?.id,
    );
  }

  const normalizedAccounts = accounts
    .filter(Boolean)
    .map((account, index) =>
      normalizeUtilityAccount(account, index, omitEnergyConnectionFields),
    );

  const userMap = await buildUserMap(accounts);
  normalizedAccounts.forEach((item, index) => {
    item.audit = getAuditDetails(accounts[index], userMap);
  });

  const summary = buildSummary(normalizedAccounts, omitEnergyConnectionFields);
  const sections = buildGroupedSections(
    normalizedAccounts,
    omitEnergyConnectionFields,
  );

  const tableColumnsBase = [
    { key: "sr_no", label: "Sr No", type: "integer" },
    { key: "account_number", label: "Account Number" },
    { key: "connection_type", label: "Connection Type" },
    { key: "category", label: "Category" },
    { key: "sanctioned_demand_kVA", label: "Sanctioned Demand (kVA)" },
  ];
  const energyConnectionColumns = [
    { key: "is_solar_connected", label: "Solar Connected" },
    { key: "is_dg_connected", label: "DG Connected" },
    { key: "is_transformer_connected", label: "Transformer Connected" },
    { key: "is_pump_connected", label: "Pump Connected" },
  ];
  const tableColumns = [
    ...tableColumnsBase,
    ...(omitEnergyConnectionFields ? [] : energyConnectionColumns),
    { key: "is_active", label: "Status" },
  ];

  return {
    title: "Utility Accounts",
    key: "utility_accounts",
    scope,
    facility_id: getId(facility),
    report_type: report?.report_type || meta?.report_type || "",
    total_accounts: normalizedAccounts.length,

    items: normalizedAccounts,
    summary,

    sections,

    table_columns: tableColumns,

    table_rows: normalizedAccounts.map((item) => {
      const row = {
        sr_no: item.sr_no,
        account_number: item.account_number,
        connection_type: item.connection_type,
        category: item.category,
        sanctioned_demand_kVA: item.sanctioned_demand_kVA ?? null,
        is_active: item.is_active ? "Active" : "Inactive",
      };
      if (!omitEnergyConnectionFields) {
        row.is_solar_connected = item.is_solar_connected ? "Yes" : "No";
        row.is_dg_connected = item.is_dg_connected ? "Yes" : "No";
        row.is_transformer_connected = item.is_transformer_connected
          ? "Yes"
          : "No";
        row.is_pump_connected = item.is_pump_connected ? "Yes" : "No";
      }
      return row;
    }),
  };
};

export default buildUtilityAccountsPayload;

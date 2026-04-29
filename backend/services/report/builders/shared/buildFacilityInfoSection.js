import FacilityAuditor from "../../../../modals/facilityAuditor.js";
import User from "../../../../modals/user.js";

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB");
};

const calculateDaysTaken = (from, to) => {
  if (!from || !to) return null;
  const fromDate = new Date(from);
  const toDate = new Date(to);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) return null;
  if (toDate < fromDate) return null;
  const diffMs = toDate.getTime() - fromDate.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
};

const normalizeText = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const normalizeNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
};

const getId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value?._id) return String(value._id);
  if (value?.toString) return String(value.toString());
  return "";
};

const getUserDisplayName = (user) => {
  if (!user) return "";
  if (typeof user === "string") {
    // Avoid displaying raw ObjectId-like strings as user names.
    const isObjectIdLike = /^[a-fA-F0-9]{24}$/.test(user);
    return isObjectIdLike ? "" : user;
  }
  return normalizeText(user?.name) || normalizeText(user?.email);
};

const buildFullAddress = (facility) => {
  const parts = [
    normalizeText(facility?.address),
    normalizeText(facility?.city),
  ].filter(Boolean);

  return parts.join(", ");
};

const buildPrimaryContact = (facility) => {
  return {
    representative: normalizeText(facility?.client_representative),
    phone: normalizeText(facility?.client_contact_number),
    email: normalizeText(facility?.client_email),
  };
};

const buildMetaSnapshot = ({ meta, facility, utilityAccount }) => {
  return {
    facility_name:
      normalizeText(meta?.snapshot_meta?.facility_name) ||
      normalizeText(facility?.name),
    facility_city:
      normalizeText(meta?.snapshot_meta?.facility_city) ||
      normalizeText(facility?.city),
    utility_account_number:
      normalizeText(meta?.snapshot_meta?.utility_account_number) ||
      normalizeText(utilityAccount?.account_number),
    report_period_from: meta?.snapshot_meta?.report_period_from || null,
    report_period_to: meta?.snapshot_meta?.report_period_to || null,
  };
};

const buildUtilityAccountMini = (utilityAccount) => {
  if (!utilityAccount) return null;

  return {
    id: getId(utilityAccount),
    account_number: normalizeText(utilityAccount?.account_number),
    connection_type: normalizeText(utilityAccount?.connection_type),
    category: normalizeText(utilityAccount?.category),
    sanctioned_demand_kVA: normalizeNumber(
      utilityAccount?.sanctioned_demand_kVA,
    ),

    is_solar_connected: Boolean(utilityAccount?.is_solar_connected),
    is_dg_connected: Boolean(utilityAccount?.is_dg_connected),
    is_transformer_connected: Boolean(utilityAccount?.is_transformer_connected),
    is_pump_connected: Boolean(utilityAccount?.is_pump_connected),
    is_transformer_maintained_by_facility: Boolean(
      utilityAccount?.is_transformer_maintained_by_facility,
    ),
    is_active:
      utilityAccount?.is_active === undefined
        ? true
        : Boolean(utilityAccount?.is_active),
  };
};

const fetchAssignedAuditors = async (facilityId) => {
  if (!facilityId) return [];

  const assignments = await FacilityAuditor.find({
    facility_id: facilityId,
  })
    .populate("user_id", "name email")
    .select("user_id assigned_role assigned_at")
    .lean();

  return assignments
    .map((assignment) => ({
      id: getId(assignment?.user_id),
      name: getUserDisplayName(assignment?.user_id),
      role: normalizeText(assignment?.assigned_role),
      assigned_at: assignment?.assigned_at || null,
      assigned_at_label: formatDate(assignment?.assigned_at),
    }))
    .filter((auditor) => Boolean(auditor.name));
};

const resolveClosedByLabel = async (facility) => {
  const rawClosedBy = facility?.audit_closure?.closed_by;
  if (rawClosedBy && typeof rawClosedBy === "object") {
    const directLabel = getUserDisplayName(rawClosedBy);
    if (directLabel) return directLabel;
  }

  const closedById = getId(rawClosedBy);
  if (!closedById) return "";

  const user = await User.findById(closedById).select("name email").lean();
  return getUserDisplayName(user) || "Unknown User";
};

export const buildFacilityInfoSection = async ({
  report,
  meta,
  facility,
  utilityAccount = null,
  scope = "facility",
}) => {
  if (!report) {
    const error = new Error("report is required in buildFacilityInfoSection");
    error.statusCode = 500;
    throw error;
  }

  if (!facility) {
    const error = new Error("facility is required in buildFacilityInfoSection");
    error.statusCode = 500;
    throw error;
  }

  const snapshot = buildMetaSnapshot({ meta, facility, utilityAccount });
  const primaryContact = buildPrimaryContact(facility);
  const utilityAccountMini = buildUtilityAccountMini(utilityAccount);
  const auditors = await fetchAssignedAuditors(getId(facility));
  const auditorsLabel = auditors.map((auditor) => auditor.name).join(", ");
  const auditStartDateLabel = formatDate(facility?.audit_date);
  const auditClosedAtLabel = formatDate(facility?.audit_closure?.closed_at);
  const auditClosedByLabel = await resolveClosedByLabel(facility);
  const isAuditClosed = Boolean(facility?.audit_closure?.closed_at);
  const periodFrom = facility?.audit_date || null;
  const periodTo = facility?.audit_closure?.closed_at || null;
  const periodDaysTaken = calculateDaysTaken(periodFrom, periodTo);

  const baseData = {
    facility_name: normalizeText(facility?.name),
    city: normalizeText(facility?.city),
    address: normalizeText(facility?.address),
    full_address: buildFullAddress(facility),
    facility_type: normalizeText(facility?.facility_type),
    status: normalizeText(facility?.status),

    representative: primaryContact.representative,
    phone: primaryContact.phone,
    email: primaryContact.email,

    account_number: utilityAccountMini?.account_number || "",
    connection_type: utilityAccountMini?.connection_type || "",
    category: utilityAccountMini?.category || "",
    sanctioned_demand_kVA: utilityAccountMini?.sanctioned_demand_kVA ?? null,

    report_period_from: periodFrom ? formatDate(periodFrom) : "",
    report_period_to: periodTo ? formatDate(periodTo) : "",
    report_period_days_taken:
      periodDaysTaken !== null ? String(periodDaysTaken) : "",
    auditors: auditorsLabel,
    audit_start_date: auditStartDateLabel,
    audit_closed_at: auditClosedAtLabel,
    audit_closed_by: auditClosedByLabel,
  };

  return {
    id: getId(facility),
    title: "Facility Information",
    scope,
    report_type: report?.report_type || meta?.report_type || "",

    facility: {
      id: getId(facility),
      name: baseData.facility_name,
      city: baseData.city,
      address: baseData.address,
      full_address: baseData.full_address,
      facility_type: baseData.facility_type,
      status: baseData.status,
      closure_date: facility?.closure_date || null,
      closure_date_label: formatDate(facility?.closure_date),
      owner_user_id: getId(facility?.owner_user_id),
      created_by: getId(facility?.created_by),
      created_at: facility?.createdAt || null,
      updated_at: facility?.updatedAt || null,
      created_at_label: formatDate(facility?.createdAt),
      updated_at_label: formatDate(facility?.updatedAt),
    },

    audit: {
      is_closed: isAuditClosed,
      start_date: facility?.audit_date || null,
      start_date_label: auditStartDateLabel,
      closed_at: facility?.audit_closure?.closed_at || null,
      closed_at_label: auditClosedAtLabel,
      closed_by: auditClosedByLabel,
    },

    report_period: {
      from: periodFrom,
      from_label: baseData.report_period_from,
      to: periodTo,
      to_label: baseData.report_period_to,
      days_taken: periodDaysTaken,
      days_taken_label: baseData.report_period_days_taken,
    },

    auditors,

    contact: {
      representative: baseData.representative,
      phone: baseData.phone,
      email: baseData.email,
      has_contact:
        Boolean(baseData.representative) ||
        Boolean(baseData.phone) ||
        Boolean(baseData.email),
    },

    utility_account: utilityAccountMini,

    connectivity_flags: {
      has_selected_utility_account: Boolean(utilityAccountMini),
      is_solar_connected: utilityAccountMini?.is_solar_connected || false,
      is_dg_connected: utilityAccountMini?.is_dg_connected || false,
      is_transformer_connected:
        utilityAccountMini?.is_transformer_connected || false,
      is_pump_connected: utilityAccountMini?.is_pump_connected || false,
      is_transformer_maintained_by_facility:
        utilityAccountMini?.is_transformer_maintained_by_facility || false,
    },

    snapshot_meta: snapshot,

    sections: [
      {
        heading: "Facility Details",
        columns: ["label", "value"],
        rows: [
          { label: "Facility Name", value: baseData.facility_name },
          { label: "City", value: baseData.city },
          { label: "Address", value: baseData.address },
          { label: "Full Address", value: baseData.full_address },
          { label: "Facility Type", value: baseData.facility_type },
          { label: "Status", value: baseData.status },
        ].filter((r) => r.value !== ""),
      },

      {
        heading: "Client Contact Details",
        columns: ["label", "value"],
        rows: [
          { label: "Representative", value: baseData.representative },
          { label: "Phone", value: baseData.phone },
          { label: "Email", value: baseData.email },
        ].filter((r) => r.value !== ""),
      },

      ...(scope === "utility_account" && utilityAccountMini
        ? [
            {
              heading: "Utility Account Details",
              columns: ["label", "value"],
              rows: [
                {
                  label: "Account Number",
                  value: baseData.account_number,
                },
                {
                  label: "Connection Type",
                  value: baseData.connection_type,
                },
                {
                  label: "Category",
                  value: baseData.category,
                },
                {
                  label: "Sanctioned Demand (kVA)",
                  value:
                    baseData.sanctioned_demand_kVA !== null
                      ? String(baseData.sanctioned_demand_kVA)
                      : "",
                },
              ].filter((r) => r.value !== ""),
            },
          ]
        : []),

      {
        heading: "Report Period",
        columns: ["label", "value"],
        rows: [
          { label: "From", value: baseData.report_period_from },
          { label: "To", value: baseData.report_period_to },
          { label: "Days Taken", value: baseData.report_period_days_taken },
        ].filter((r) => r.value !== ""),
      },
      {
        heading: "Audit Details",
        columns: ["label", "value"],
        rows: [
          { label: "Auditors", value: baseData.auditors },
          { label: "Audit Start Date", value: baseData.audit_start_date },
          { label: "Audit Status", value: isAuditClosed ? "Closed" : "Open" },
          ...(isAuditClosed
            ? [
                { label: "Audit Close Date", value: baseData.audit_closed_at },
                { label: "Audit Closed By", value: baseData.audit_closed_by },
              ]
            : []),
        ].filter((r) => r.value !== ""),
      },
    ],

    display_rows: [
      { label: "Facility Name", value: baseData.facility_name },
      { label: "City", value: baseData.city },
      { label: "Address", value: baseData.address },
      { label: "Facility Type", value: baseData.facility_type },
      { label: "Status", value: baseData.status },
      { label: "Client Representative", value: baseData.representative },
      { label: "Client Contact Number", value: baseData.phone },
      { label: "Client Email", value: baseData.email },
      { label: "Auditors", value: baseData.auditors },
      { label: "Audit Start Date", value: baseData.audit_start_date },
      { label: "Audit Status", value: isAuditClosed ? "Closed" : "Open" },
      ...(isAuditClosed
        ? [
            { label: "Audit Close Date", value: baseData.audit_closed_at },
            { label: "Audit Closed By", value: baseData.audit_closed_by },
          ]
        : []),
      ...(scope === "utility_account" && utilityAccountMini
        ? [
            {
              label: "Utility Account Number",
              value: utilityAccountMini.account_number,
            },
            {
              label: "Connection Type",
              value: utilityAccountMini.connection_type,
            },
            {
              label: "Category",
              value: utilityAccountMini.category,
            },
            {
              label: "Sanctioned Demand (kVA)",
              value:
                utilityAccountMini.sanctioned_demand_kVA !== null
                  ? String(utilityAccountMini.sanctioned_demand_kVA)
                  : "",
            },
          ]
        : []),
    ].filter((row) => row.value !== ""),

    summary_cards: [
      {
        key: "facility_type",
        label: "Facility Type",
        value: baseData.facility_type || "-",
      },
      {
        key: "status",
        label: "Status",
        value: baseData.status || "-",
      },
      {
        key: "city",
        label: "City",
        value: baseData.city || "-",
      },
      ...(scope === "utility_account" && utilityAccountMini
        ? [
            {
              key: "account_number",
              label: "Account Number",
              value: utilityAccountMini.account_number || "-",
            },
            {
              key: "connection_type",
              label: "Connection Type",
              value: utilityAccountMini.connection_type || "-",
            },
          ]
        : []),
    ],
  };
};

export default buildFacilityInfoSection;

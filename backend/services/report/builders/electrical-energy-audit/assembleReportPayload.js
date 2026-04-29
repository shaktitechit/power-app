import { buildCoverSection } from "../shared/buildCoverSection.js";
import { ELECTRICAL_ENERGY_COVER_REPORT_TYPE_LABELS } from "./coverReportTypeLabels.js";
import { buildFacilityInfoSection } from "../shared/buildFacilityInfoSection.js";
import { buildUtilityAccountsSection } from "./buildUtilityAccountsSection.js";
import {
  buildTariffSection,
  buildBillingSection,
  buildSolarSection,
  buildDGSection,
  buildTransformerSection,
  buildPumpSection,
  buildHVACSection,
  buildACSection,
  buildFanSection,
  buildLightingSection,
  buildLuxSection,
  buildMiscSection,
} from "./sections/index.js";
import { buildRecommendationsSection } from "../shared/buildRecommendationsSection.js";
import { shouldIncludeElectricalEnergyReportSection } from "../../constants/electrical-energy/sectionInclusion.js";
import { ELECTRICAL_ENERGY_REPORT_TYPES } from "../../constants/electrical-energy/reportTypes.js";

const throwError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};

const normalizeReportType = (type, scope) => {
  if (!type) return "full_audit_report";
  if (!ELECTRICAL_ENERGY_REPORT_TYPES.includes(type)) {
    const ctx =
      scope === "utility_account" ? "utility account" : "facility";
    throwError(`Invalid ${ctx} report type: ${type}`, 400);
  }
  return type;
};

const getId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value?._id) return String(value._id);
  if (value?.id) return String(value.id);
  if (value?.utility_account_id?._id)
    return String(value.utility_account_id._id);
  if (value?.utility_account_id?.id) return String(value.utility_account_id.id);
  if (value?.utility_account_id) return String(value.utility_account_id);
  return "";
};

const normalizeUtilityAccountsForQueries = (items = []) => {
  if (!Array.isArray(items)) return [];

  const seen = new Set();

  return items
    .map((item) => {
      const id = getId(item);
      if (!id || seen.has(id)) return null;
      seen.add(id);

      return {
        _id: id,
        id,
        utility_account_id: id,
        account_number:
          item?.account_number ||
          item?.utility_account_number ||
          item?.account_no ||
          "",
        connection_type: item?.connection_type || "",
        category: item?.category || "",
        facility_id: item?.facility_id || "",
      };
    })
    .filter(Boolean);
};

const createEmptyResult = (meta) => ({
  meta,
  cover: null,
  facility_info: null,
  utility_accounts: [],
  utility_accounts_summary: null,
  tariffs: [],
  tariff_summary: null,
  billing_records: [],
  billing_summary: null,
  solar_systems: [],
  solar_summary: null,
  dg_sets: [],
  dg_summary: null,
  transformers: [],
  transformer_summary: null,
  pumps: [],
  pump_summary: null,
  hvac_records: [],
  hvac_summary: null,
  ac_records: [],
  ac_summary: null,
  fan_records: [],
  fan_summary: null,
  lighting_records: [],
  lighting_summary: null,
  lux_records: [],
  lux_summary: null,
  misc_records: [],
  misc_summary: null,
  recommendations: [],
  summary: null,
  sections: [],
  sheet_sections: [],
});

const shouldIncludeSection = shouldIncludeElectricalEnergyReportSection;

const buildPushSectionIfValid = (scope) => {
  return (result, section) => {
    if (!section || typeof section !== "object") return;

    if (Array.isArray(section.blocks) && section.blocks.length) {
      result.sheet_sections.push(section);
      return;
    }

    const hasItems = Array.isArray(section.items) && section.items.length;
    const hasNestedSections =
      Array.isArray(section.sections) && section.sections.length;
    const hasTableRows =
      Array.isArray(section.table_rows) && section.table_rows.length;

    if (scope === "utility_account") {
      if (hasItems) result.sections.push(section);
      return;
    }

    if (hasItems || hasNestedSections || hasTableRows) {
      result.sections.push(section);
    }
  };
};

const buildSafeSection = (scope) => {
  const label =
    scope === "utility_account" ? "utility-account" : "facility";
  return async (builder, fallback, sectionLabel = "section") => {
    try {
      const result = await builder();
      return result ?? fallback;
    } catch (error) {
      console.error(
        `Failed to build electrical-energy ${label} ${sectionLabel}:`,
        error,
      );
      return fallback;
    }
  };
};

const buildFacilitySummary = ({
  facility,
  utilityAccounts = [],
  tariffs = [],
  billingRecords = [],
  solarSystems = [],
  dgSets = [],
  transformers = [],
  pumps = [],
  hvacRecords = [],
  acRecords = [],
  fanRecords = [],
  lightingRecords = [],
  luxRecords = [],
  miscRecords = [],
  recommendations = [],
}) => ({
  facility_name: facility?.name || "",
  facility_city: facility?.city || "",
  total_utility_accounts: utilityAccounts.length,
  total_tariffs: tariffs.length,
  total_billing_records: billingRecords.length,
  total_solar_systems: solarSystems.length,
  total_dg_sets: dgSets.length,
  total_transformers: transformers.length,
  total_pumps: pumps.length,
  total_hvac_records: hvacRecords.length,
  total_ac_records: acRecords.length,
  total_fan_records: fanRecords.length,
  total_lighting_records: lightingRecords.length,
  total_lux_records: luxRecords.length,
  total_misc_records: miscRecords.length,
  total_recommendations: recommendations.length,
});

const buildUtilityAccountSummary = ({
  facility,
  utilityAccount,
  tariffs = [],
  billingRecords = [],
  solarSystems = [],
  dgSets = [],
  transformers = [],
  pumps = [],
  hvacRecords = [],
  acRecords = [],
  fanRecords = [],
  lightingRecords = [],
  luxRecords = [],
  miscRecords = [],
  recommendations = [],
}) => ({
  facility_name: facility?.name || "",
  facility_city: facility?.city || "",
  utility_account_id: utilityAccount?._id?.toString?.() || "",
  utility_account_number: utilityAccount?.account_number || "",
  connection_type: utilityAccount?.connection_type || "",
  category: utilityAccount?.category || "",
  total_tariffs: tariffs.length,
  total_billing_records: billingRecords.length,
  total_solar_systems: solarSystems.length,
  total_dg_sets: dgSets.length,
  total_transformers: transformers.length,
  total_pumps: pumps.length,
  total_hvac_records: hvacRecords.length,
  total_ac_records: acRecords.length,
  total_fan_records: fanRecords.length,
  total_lighting_records: lightingRecords.length,
  total_lux_records: luxRecords.length,
  total_misc_records: miscRecords.length,
  total_recommendations: recommendations.length,
});

/**
 * Shared Electrical Energy Audit pipeline (facility or utility-account scope).
 *
 * @param {object} params
 * @param {"facility" | "utility_account"} params.scope
 */
export const assembleReportPayload = async ({
  report,
  facility,
  utilityAccount,
  meta,
  scope,
}) => {
  if (!report) {
    throwError("report is required in assembleReportPayload", 500);
  }
  if (!facility) {
    throwError("facility is required in assembleReportPayload", 500);
  }
  if (scope !== "facility" && scope !== "utility_account") {
    throwError(`Invalid scope for energy assembleReportPayload: ${scope}`, 500);
  }
  if (scope === "utility_account" && !utilityAccount) {
    throwError(
      "utilityAccount is required for utility_account scope report",
      500,
    );
  }

  const reportType = normalizeReportType(report.report_type, scope);
  const result = createEmptyResult(meta);
  const pushSectionIfValid = buildPushSectionIfValid(scope);
  const safeSection = buildSafeSection(scope);

  const scopedUtilityAccount =
    scope === "utility_account" ? utilityAccount : null;

  let utilityAccountsForQueries = [];

  if (shouldIncludeSection(reportType, "cover")) {
    result.cover = await safeSection(
      () =>
        buildCoverSection({
          report,
          meta,
          facility,
          utilityAccount: scopedUtilityAccount,
          scope,
          reportTypeLabels: ELECTRICAL_ENERGY_COVER_REPORT_TYPE_LABELS,
        }),
      null,
      "cover",
    );
  }

  if (shouldIncludeSection(reportType, "facility_info")) {
    result.facility_info = await safeSection(
      () =>
        buildFacilityInfoSection({
          report,
          meta,
          facility,
          utilityAccount: scopedUtilityAccount,
          scope,
        }),
      null,
      "facility_info",
    );
    if (scope === "facility") {
      pushSectionIfValid(result, result.facility_info);
    }
  }

  if (shouldIncludeSection(reportType, "utility_accounts")) {
    const utilityAccountsSection = await safeSection(
      () =>
        buildUtilityAccountsSection({
          report,
          meta,
          facility,
          utilityAccount: scopedUtilityAccount,
          scope,
        }),
      {
        key: "utility_accounts",
        title: "Utility Accounts",
        items: [],
        summary: null,
        columns: [],
      },
      "utility_accounts",
    );

    result.utility_accounts = utilityAccountsSection.items || [];
    result.utility_accounts_summary = utilityAccountsSection.summary || null;

    if (scope === "facility") {
      utilityAccountsForQueries = normalizeUtilityAccountsForQueries(
        utilityAccountsSection.items || [],
      );
      pushSectionIfValid(result, utilityAccountsSection);
    } else if (result.utility_accounts.length === 0 && utilityAccount) {
      result.utility_accounts = [utilityAccount];
    }
  }

  const accountsForDomainSections =
    scope === "facility" ? utilityAccountsForQueries : result.utility_accounts;

  if (shouldIncludeSection(reportType, "tariffs")) {
    const tariffSection = await safeSection(
      () =>
        buildTariffSection({
          report,
          meta,
          facility,
          utilityAccount: scopedUtilityAccount,
          utilityAccounts: accountsForDomainSections,
          scope,
        }),
      {
        key: "tariffs",
        title: "Tariffs",
        items: [],
        summary: null,
        columns: [],
      },
      "tariffs",
    );

    result.tariffs = tariffSection.items || [];
    result.tariff_summary = tariffSection.summary || null;
    pushSectionIfValid(result, tariffSection);
  }

  if (shouldIncludeSection(reportType, "billing_records")) {
    const billingSection = await safeSection(
      () =>
        buildBillingSection({
          report,
          meta,
          facility,
          utilityAccount: scopedUtilityAccount,
          utilityAccounts: accountsForDomainSections,
          scope,
        }),
      {
        key: "billing_records",
        title: "Billing Records",
        items: [],
        summary: null,
        columns: [],
      },
      "billing_records",
    );

    result.billing_records = billingSection.items || [];
    result.billing_summary = billingSection.summary || null;
    pushSectionIfValid(result, billingSection);
  }

  if (shouldIncludeSection(reportType, "solar_systems")) {
    const solarSection = await safeSection(
      () =>
        buildSolarSection({
          report,
          meta,
          facility,
          utilityAccount: scopedUtilityAccount,
          utilityAccounts: accountsForDomainSections,
          scope,
        }),
      {
        key: "solar_systems",
        title: "Solar Records",
        items: [],
        summary: null,
        columns: [],
      },
      "solar_systems",
    );

    result.solar_systems = solarSection.items || [];
    result.solar_summary = solarSection.summary || null;
    pushSectionIfValid(result, solarSection);
  }

  if (shouldIncludeSection(reportType, "dg_sets")) {
    const dgSection = await safeSection(
      () =>
        buildDGSection({
          report,
          meta,
          facility,
          utilityAccount: scopedUtilityAccount,
          utilityAccounts: accountsForDomainSections,
          scope,
        }),
      {
        key: "dg_sets",
        title: "DG Records",
        items: [],
        summary: null,
        columns: [],
      },
      "dg_sets",
    );

    result.dg_sets = dgSection.items || [];
    result.dg_summary = dgSection.summary || null;
    pushSectionIfValid(result, dgSection);
  }

  if (shouldIncludeSection(reportType, "transformers")) {
    const transformerSection = await safeSection(
      () =>
        buildTransformerSection({
          report,
          meta,
          facility,
          utilityAccount: scopedUtilityAccount,
          utilityAccounts: accountsForDomainSections,
          scope,
        }),
      {
        key: "transformers",
        title: "Transformer Records",
        items: [],
        summary: null,
        columns: [],
      },
      "transformers",
    );

    result.transformers = transformerSection.items || [];
    result.transformer_summary = transformerSection.summary || null;
    pushSectionIfValid(result, transformerSection);
  }

  if (shouldIncludeSection(reportType, "pumps")) {
    const pumpSection = await safeSection(
      () =>
        buildPumpSection({
          report,
          meta,
          facility,
          utilityAccount: scopedUtilityAccount,
          utilityAccounts: accountsForDomainSections,
          scope,
        }),
      {
        key: "pumps",
        title: "Pump Records",
        items: [],
        summary: null,
        columns: [],
      },
      "pumps",
    );

    result.pumps = pumpSection.items || [];
    result.pump_summary = pumpSection.summary || null;
    pushSectionIfValid(result, pumpSection);
  }

  if (shouldIncludeSection(reportType, "hvac_records")) {
    const hvacSection = await safeSection(
      () =>
        buildHVACSection({
          report,
          meta,
          facility,
          utilityAccount: scopedUtilityAccount,
          utilityAccounts: accountsForDomainSections,
          scope,
        }),
      {
        key: "hvac_records",
        title: "HVAC Records",
        items: [],
        summary: null,
        columns: [],
      },
      "hvac_records",
    );

    result.hvac_records = hvacSection.items || [];
    result.hvac_summary = hvacSection.summary || null;
    pushSectionIfValid(result, hvacSection);
  }

  if (shouldIncludeSection(reportType, "ac_records")) {
    const acSection = await safeSection(
      () =>
        buildACSection({
          report,
          meta,
          facility,
          utilityAccount: scopedUtilityAccount,
          utilityAccounts: accountsForDomainSections,
          scope,
        }),
      {
        key: "ac_records",
        title: "AC Records",
        items: [],
        summary: null,
        columns: [],
      },
      "ac_records",
    );

    result.ac_records = acSection.items || [];
    result.ac_summary = acSection.summary || null;
    pushSectionIfValid(result, acSection);
  }

  if (shouldIncludeSection(reportType, "fan_records")) {
    const fanSection = await safeSection(
      () =>
        buildFanSection({
          report,
          meta,
          facility,
          utilityAccount: scopedUtilityAccount,
          utilityAccounts: accountsForDomainSections,
          scope,
        }),
      {
        key: "fan_records",
        title: "Fan Records",
        items: [],
        summary: null,
        columns: [],
      },
      "fan_records",
    );

    result.fan_records = fanSection.items || [];
    result.fan_summary = fanSection.summary || null;
    pushSectionIfValid(result, fanSection);
  }

  if (shouldIncludeSection(reportType, "lighting_records")) {
    const lightingSection = await safeSection(
      () =>
        buildLightingSection({
          report,
          meta,
          facility,
          utilityAccount: scopedUtilityAccount,
          utilityAccounts: accountsForDomainSections,
          scope,
        }),
      {
        key: "lighting_records",
        title: "Lighting Records",
        items: [],
        summary: null,
        columns: [],
      },
      "lighting_records",
    );

    result.lighting_records = lightingSection.items || [];
    result.lighting_summary = lightingSection.summary || null;
    pushSectionIfValid(result, lightingSection);
  }

  if (shouldIncludeSection(reportType, "lux_records")) {
    const luxSection = await safeSection(
      () =>
        buildLuxSection({
          report,
          meta,
          facility,
          utilityAccount: scopedUtilityAccount,
          utilityAccounts: accountsForDomainSections,
          scope,
        }),
      {
        key: "lux_records",
        title: "Lux Measurements",
        items: [],
        summary: null,
        columns: [],
      },
      "lux_records",
    );

    result.lux_records = luxSection.items || [];
    result.lux_summary = luxSection.summary || null;
    pushSectionIfValid(result, luxSection);
  }

  if (shouldIncludeSection(reportType, "misc_records")) {
    const miscSection = await safeSection(
      () =>
        buildMiscSection({
          report,
          meta,
          facility,
          utilityAccount: scopedUtilityAccount,
          utilityAccounts: accountsForDomainSections,
          scope,
        }),
      {
        key: "misc_records",
        title: "Misc Records",
        items: [],
        summary: null,
        columns: [],
      },
      "misc_records",
    );

    result.misc_records = miscSection.items || [];
    result.misc_summary = miscSection.summary || null;
    pushSectionIfValid(result, miscSection);
  }

  if (shouldIncludeSection(reportType, "recommendations")) {
    result.recommendations = await safeSection(
      () =>
        buildRecommendationsSection({
          report,
          meta,
          facility,
          utilityAccount: scopedUtilityAccount,
          utilityAccounts: accountsForDomainSections,
          tariffs: result.tariffs,
          billing_records: result.billing_records,
          solar_systems: result.solar_systems,
          dg_sets: result.dg_sets,
          transformers: result.transformers,
          pumps: result.pumps,
          hvac_records: result.hvac_records,
          ac_records: result.ac_records,
          fan_records: result.fan_records,
          lighting_records: result.lighting_records,
          lux_records: result.lux_records,
          misc_records: result.misc_records,
          scope,
        }),
      [],
      "recommendations",
    );
  }

  if (shouldIncludeSection(reportType, "summary")) {
    result.summary =
      scope === "facility"
        ? buildFacilitySummary({
            facility,
            utilityAccounts: result.utility_accounts,
            tariffs: result.tariffs,
            billingRecords: result.billing_records,
            solarSystems: result.solar_systems,
            dgSets: result.dg_sets,
            transformers: result.transformers,
            pumps: result.pumps,
            hvacRecords: result.hvac_records,
            acRecords: result.ac_records,
            fanRecords: result.fan_records,
            lightingRecords: result.lighting_records,
            luxRecords: result.lux_records,
            miscRecords: result.misc_records,
            recommendations: result.recommendations,
          })
        : buildUtilityAccountSummary({
            facility,
            utilityAccount,
            tariffs: result.tariffs,
            billingRecords: result.billing_records,
            solarSystems: result.solar_systems,
            dgSets: result.dg_sets,
            transformers: result.transformers,
            pumps: result.pumps,
            hvacRecords: result.hvac_records,
            acRecords: result.ac_records,
            fanRecords: result.fan_records,
            lightingRecords: result.lighting_records,
            luxRecords: result.lux_records,
            miscRecords: result.misc_records,
            recommendations: result.recommendations,
          });
  }

  return result;
};

export default assembleReportPayload;

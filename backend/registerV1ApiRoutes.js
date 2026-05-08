import { apiRateLimiter } from "./middlewares/rateLimitLoggerMiddleware.js";

// Core & shared
import usersRoute from "./routes/usersRoute.js";
import facilityRoute from "./routes/facilityRoute.js";
import auditRoutes from "./routes/auditRoutes.js";
import utilityRoutes from "./routes/utilityRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import userProfileRoutes from "./routes/userProfileRoutes.js";
import userPerformanceRoutes from "./routes/userPerformanceRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import emailRoutes from "./routes/emailRoutes.js";
import fileManagementRoute from "./routes/fileManagementRoute.js";

// Electrical audit (utility account domain)
import utilityTarrifRoutes from "./routes/electrical-audit/utilityTarrifRoutes.js";
import utilityBillingRecordRoutes from "./routes/electrical-audit/utilityBillingRecordRoutes.js";
import solarPlantRoutes from "./routes/electrical-audit/solarPlantRoutes.js";
import dgSetRoutes from "./routes/electrical-audit/dgSetRoutes.js";
import transformerRoutes from "./routes/electrical-audit/transformerRoutes.js";
import pumpRoutes from "./routes/electrical-audit/pumpRoutes.js";
import hvacAuditRoutes from "./routes/electrical-audit/hvacAuditRoutes.js";
import lightingAuditRoutes from "./routes/electrical-audit/lightingAuditRoutes.js";
import luxMeasurementRoutes from "./routes/electrical-audit/luxMeasurementRoutes.js";
import miscLoadAuditRoutes from "./routes/electrical-audit/miscLoadAuditRoutes.js";
import solarGenerationRecordRoutes from "./routes/electrical-audit/solarGenerationRecordRoutes.js";
import dgAuditRecordRoutes from "./routes/electrical-audit/dgAuditRecordRoutes.js";
import transformerAuditRecordRoutes from "./routes/electrical-audit/transformerAuditRecordRoutes.js";
import pumpAuditRecordRoutes from "./routes/electrical-audit/pumpAuditRecordRoutes.js";
import acAuditRecordRoutes from "./routes/electrical-audit/acAuditRecordRoutes.js";
import fanAuditRecordRoutes from "./routes/electrical-audit/fanAuditRecordRoutes.js";

// Safety audit
import safetyGeneralAuditRoutes from "./routes/safety-audit/safetyGeneralAuditRoutes.js";
import safetyDocumentsAuditRoutes from "./routes/safety-audit/safetyDocumentsAuditRoutes.js";
import safetyTransformerAuditRoutes from "./routes/safety-audit/safetyTransformerAuditRoutes.js";
import safetyMeteringRoomAuditRoutes from "./routes/safety-audit/safetyMeteringRoomAuditRoutes.js";
import safetyPanelRoomAuditRoutes from "./routes/safety-audit/safetyPanelRoomAuditRoutes.js";
import safetyLdbAuditRoutes from "./routes/safety-audit/safetyLdbAuditRoutes.js";
import safetyDgAuditRoutes from "./routes/safety-audit/safetyDgAuditRoutes.js";
import safetyEarthingAuditRoutes from "./routes/safety-audit/safetyEarthingAuditRoutes.js";
import safetyUpsAuditRoutes from "./routes/safety-audit/safetyUpsAuditRoutes.js";
import safetyThermographyAuditRoutes from "./routes/safety-audit/safetyThermographyAuditRoutes.js";
import safetyElevatorAuditRoutes from "./routes/safety-audit/safetyElevatorAuditRoutes.js";
import safetyLoadAnalysisAuditRoutes from "./routes/safety-audit/safetyLoadAnalysisAuditRoutes.js";
import safetyLeakInspectionAuditRoutes from "./routes/safety-audit/safetyLeakInspectionAuditRoutes.js";
import safetyPacVentilationAuditRoutes from "./routes/safety-audit/safetyPacVentilationAuditRoutes.js";
import safetyWiringAuditRoutes from "./routes/safety-audit/safetyWiringAuditRoutes.js";
import safetyPumpCompressorAuditRoutes from "./routes/safety-audit/safetyPumpCompressorAuditRoutes.js";
import safetyAdditionalItemsAuditRoutes from "./routes/safety-audit/safetyAdditionalItemsAuditRoutes.js";

/**
 * Mounts `/api` rate limiter and all `/api/v1/...` routers.
 * @param {import("express").Application} app
 */
export function registerV1ApiRoutes(app) {
  app.use("/api", apiRateLimiter);

  // --- Email & files ---
  app.use("/api/v1/email", emailRoutes);
  app.use("/api/v1/file-management", fileManagementRoute);

  // --- Users, facilities, utilities (root shared) ---
  app.use("/api/v1/users", usersRoute);
  app.use("/api/v1/facilities", facilityRoute);
  app.use("/api/v1/audits", auditRoutes);
  app.use("/api/v1/utilities", utilityRoutes);

  // --- Electrical audit (`routes/electrical-audit`): tariffs, billing, equipment, records ---
  app.use("/api/v1/utility-tariffs", utilityTarrifRoutes);
  app.use("/api/v1/utility-billing-records", utilityBillingRecordRoutes);
  app.use("/api/v1/solar-plants", solarPlantRoutes);
  app.use("/api/v1/dg-sets", dgSetRoutes);
  app.use("/api/v1/transformers", transformerRoutes);
  app.use("/api/v1/pumps", pumpRoutes);
  app.use("/api/v1/hvac-audits", hvacAuditRoutes);
  app.use("/api/v1/lighting-audits", lightingAuditRoutes);
  app.use("/api/v1/lux-measurements", luxMeasurementRoutes);
  app.use("/api/v1/misc-load-audits", miscLoadAuditRoutes);
  app.use("/api/v1/solar-generation-records", solarGenerationRecordRoutes);
  app.use("/api/v1/dg-audit-records", dgAuditRecordRoutes);
  app.use("/api/v1/transformer-audit-records", transformerAuditRecordRoutes);
  app.use("/api/v1/pump-audit-records", pumpAuditRecordRoutes);
  app.use("/api/v1/ac-audit-records", acAuditRecordRoutes);
  app.use("/api/v1/fan-audit-records", fanAuditRecordRoutes);

  // --- Safety audit (`routes/safety-audit`): checklists & inspections ---
  app.use("/api/v1/safety-general-audits", safetyGeneralAuditRoutes);
  app.use("/api/v1/safety-documents-audits", safetyDocumentsAuditRoutes);
  app.use("/api/v1/safety-transformer-audits", safetyTransformerAuditRoutes);
  app.use("/api/v1/safety-metering-room-audits", safetyMeteringRoomAuditRoutes);
  app.use("/api/v1/safety-panel-room-audits", safetyPanelRoomAuditRoutes);
  app.use("/api/v1/safety-ldb-audits", safetyLdbAuditRoutes);
  app.use("/api/v1/safety-dg-audits", safetyDgAuditRoutes);
  app.use("/api/v1/safety-earthing-audits", safetyEarthingAuditRoutes);
  app.use("/api/v1/safety-ups-audits", safetyUpsAuditRoutes);
  app.use("/api/v1/safety-thermography-audits", safetyThermographyAuditRoutes);
  app.use("/api/v1/safety-elevator-audits", safetyElevatorAuditRoutes);
  app.use("/api/v1/safety-load-analysis-audits", safetyLoadAnalysisAuditRoutes);
  app.use("/api/v1/safety-leak-inspection-audits", safetyLeakInspectionAuditRoutes);
  app.use("/api/v1/safety-pac-ventilation-audits", safetyPacVentilationAuditRoutes);
  app.use("/api/v1/safety-wiring-audits", safetyWiringAuditRoutes);
  app.use("/api/v1/safety-pump-compressor-audits", safetyPumpCompressorAuditRoutes);
  app.use("/api/v1/safety-additional-items-audits", safetyAdditionalItemsAuditRoutes);

  // --- Reports, dashboard, analytics, profiles ---
  app.use("/api/v1/reports", reportRoutes);
  app.use("/api/v1/dashboard", dashboardRoutes);
  app.use("/api/v1/analytics", analyticsRoutes);
  app.use("/api/v1/user", userProfileRoutes);
  app.use("/api/v1/user-performance", userPerformanceRoutes);

  // --- Admin ---
  app.use("/api/v1/admin/users", adminRoutes);
}

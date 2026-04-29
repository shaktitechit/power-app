import Report from "../../../modals/report.js";

import logger from "../../../config/logger.js";
import buildWorkerLogMeta from "../../../utils/buildWorkerLogMeta.js";

import { createRecentActivity } from "../../../helpers/createRecentActivity.js";
import { buildActivityMessage } from "../../../helpers/buildActivityMessage.js";

import { loadFacilityAndUtilityForReport } from "./loadReportLinkedEntities.js";
import { produceAndUploadReportArtifacts } from "./reportArtifactPipeline.js";

export const executeReportGenerationJob = async ({ job }) => {
  const { reportId, requestedBy, action } = job.data;
  const isRegenerate = action === "regenerate";
  const activityAction = "generated";

  const baseMeta = buildWorkerLogMeta(job, {
    reportId,
    requestedBy,
    action,
  });

  logger.info("Report job started", baseMeta);

  const report = await Report.findById(reportId);

  if (!report) {
    logger.error("Report not found", baseMeta);
    throw new Error("Report not found");
  }

  report.status = "processing";
  report.error_message = "";
  await report.save();

  try {
    await job.updateProgress(10);

    logger.info(
      "Report loaded and marked processing",
      buildWorkerLogMeta(job, {
        reportId: String(report._id),
        title: report.title,
        scope: report.report_scope,
        type: report.report_type,
      }),
    );

    const { facility, utilityAccount } = await loadFacilityAndUtilityForReport(
      report,
    );

    logger.info(
      "Facility loaded",
      buildWorkerLogMeta(job, {
        facilityId: String(facility._id),
        facilityName: facility.name,
      }),
    );

    if (utilityAccount) {
      logger.info(
        "Utility account loaded",
        buildWorkerLogMeta(job, {
          utilityAccountId: String(utilityAccount._id),
          accountNumber: utilityAccount.account_number,
        }),
      );
    }

    await job.updateProgress(25);

    logger.info(
      "Starting report artifact pipeline (build → render → upload)",
      buildWorkerLogMeta(job, { reportId }),
    );

    const { reportData, uploadedFiles } = await produceAndUploadReportArtifacts({
      report,
      facility,
      utilityAccount,
      onProgress: async (p) => {
        await job.updateProgress(p);
      },
    });

    logger.info(
      "Report artifact pipeline completed",
      buildWorkerLogMeta(job, {
        hasReportData: Boolean(reportData),
        sectionsCount: Array.isArray(reportData?.sections)
          ? reportData.sections.length
          : 0,
        uploadedKeys: uploadedFiles ? Object.keys(uploadedFiles) : [],
      }),
    );

    if (uploadedFiles?.excel_file) {
      report.excel_file = uploadedFiles.excel_file;
    }

    if (uploadedFiles?.pdf_file) {
      report.pdf_file = uploadedFiles.pdf_file;
    }

    report.status = "completed";
    report.generated_at = new Date();
    report.error_message = "";
    await report.save();

    await job.updateProgress(100);

    logger.info(
      "Report marked completed",
      buildWorkerLogMeta(job, {
        excelUrl: report.excel_file?.fileUrl || null,
        pdfUrl: report.pdf_file?.fileUrl || null,
      }),
    );

    await createRecentActivity({
      actor: requestedBy ? { _id: requestedBy, name: "User" } : null,
      action: activityAction,
      entity_type: "report",
      entity_id: report._id,
      entity_name: report.title || "Report",
      facility_id: report.facility_id,
      utility_account_id: report.utility_account_id,
      message: buildActivityMessage({
        actorName: "User",
        action: activityAction,
        entityLabel: "report",
        entityName: report.title || "",
      }),
      meta: {
        request_action: isRegenerate ? "regenerate" : "generate",
        report_scope: report.report_scope,
        report_type: report.report_type,
        status: report.status,
      },
    });

    logger.info(
      "Activity created for report",
      buildWorkerLogMeta(job, { reportId }),
    );

    return {
      success: true,
      reportId: String(report._id),
      status: report.status,
    };
  } catch (error) {
    logger.error(
      "Report job failed",
      buildWorkerLogMeta(job, {
        reportId,
        error: error?.message,
        stack: error?.stack,
      }),
    );

    report.status = "failed";
    report.generated_at = new Date();
    report.error_message = error?.message || "Report generation failed";

    await report.save();

    throw error;
  }
};

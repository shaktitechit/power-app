import { buildReportData } from "../builders/buildReportData.js";
import { generateExcelReport } from "../render/excel/generateExcelReport.js";

/**
 * On-demand Excel export (HTTP download). Auth is enforced in the controller.
 */
export async function buildExcelBufferForReport({
  report,
  facility,
  utilityAccount,
}) {
  const reportData = await buildReportData({
    report,
    facility,
    utilityAccount,
  });

  return generateExcelReport({ reportData });
}

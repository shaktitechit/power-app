import { buildReportData } from "../builders/buildReportData.js";
import { generateReportFiles } from "../render/generateReportFiles.js";
import { uploadReportFiles } from "../render/uploadReportFiles.js";

/**
 * Builds structured report data, renders Excel+PDF buffers, uploads to storage.
 * @param {object} params
 * @param {(progress: number) => Promise<void> | void} [params.onProgress] - optional Bull job progress (e.g. 55, 70).
 */
export async function produceAndUploadReportArtifacts({
  report,
  facility,
  utilityAccount,
  onProgress,
}) {
  const reportData = await buildReportData({
    report,
    facility,
    utilityAccount,
  });

  await onProgress?.(55);

  const generatedFiles = await generateReportFiles({
    report,
    reportData,
  });

  await onProgress?.(70);

  const uploadedFiles = await uploadReportFiles({
    report,
    generatedFiles,
  });

  await onProgress?.(80);

  return { reportData, generatedFiles, uploadedFiles };
}

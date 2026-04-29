import { uploadBufferToFileManagement } from "../../../utils/fileManagementUpload.js";

const throwError = (message, statusCode = 500) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};

const createUploadFile = (generatedFile) => ({
  originalname: generatedFile.fileName,
  mimetype: generatedFile.mimeType,
  buffer: generatedFile.buffer,
});

const mapUploadedFile = (result, fallbackFileName, fileType) => ({
  fileUrl: result?.secure_url || "",
  fileName: fallbackFileName,
  fileType,
  publicId: result?.public_id || "",
  uploadedAt: new Date(),
});

export const uploadReportFiles = async ({ report, generatedFiles }) => {
  if (!report) throwError("report is required in uploadReportFiles");
  if (!generatedFiles) {
    throwError("generatedFiles is required in uploadReportFiles");
  }

  const resourceId = report._id;
  if (!resourceId) {
    throwError("report must have _id before uploadReportFiles");
  }

  const uploads = {};

  if (generatedFiles.excel?.buffer) {
    const excelUpload = await uploadBufferToFileManagement(
      createUploadFile(generatedFiles.excel),
      "reports/excel",
      resourceId,
    );
    uploads.excel_file = mapUploadedFile(
      excelUpload,
      generatedFiles.excel.fileName,
      "xlsx",
    );
  }

  if (generatedFiles.pdf?.buffer) {
    const pdfUpload = await uploadBufferToFileManagement(
      createUploadFile(generatedFiles.pdf),
      "reports/pdf",
      resourceId,
    );
    uploads.pdf_file = mapUploadedFile(
      pdfUpload,
      generatedFiles.pdf.fileName,
      "pdf",
    );
  }

  return uploads;
};

export default uploadReportFiles;

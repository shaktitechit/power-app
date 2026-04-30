import {
  API_PUBLIC_BASE_URL,
  FILE_DOCUMENT_LINKS_RELATIVE,
} from "../config/fileManagement.js";
import { uploadMulterFile } from "../services/fileManagement/index.js";

/**
 * Legacy Cloudinary folder keys → file-management `resourceType`.
 */
export const FOLDER_TO_RESOURCE_TYPE = {
  "facilities": "facility",
  "utility-accounts": "utility_account",
  "utility-tariffs": "utility_tariff",
  "utility-billing-records": "utility_billing_record",
  "transformers": "transformer",
  "pumps": "pump",
  "dg-sets": "dg_set",
  "solar-plants": "solar_plant",
  "hvac-audits": "hvac_audit",
  "lighting-audits": "lighting_audit",
  "misc-load-audits": "misc_load_audit",
  "lux-measurements": "lux_measurement",
  "fan-audits": "fan_audit",
  "ac-audits": "ac_audit",
  "dg-audit-records": "dg_audit_record",
  "pump-audit-records": "pump_audit_record",
  "transformer-audit-records": "transformer_audit_record",
  "solar-generation-records": "solar_generation_record",
  "reports/excel": "report",
  "reports/pdf": "report",
  "safety-audits": "safety_audit",
};

export function buildProxyViewUrl(fileId) {
  const path = `/api/v1/file-management/files/${fileId}/view`;
  if (FILE_DOCUMENT_LINKS_RELATIVE) {
    return path;
  }
  return `${API_PUBLIC_BASE_URL}${path}`;
}

/**
 * @param {import("multer").File} file
 * @param {string} folderKey - key in {@link FOLDER_TO_RESOURCE_TYPE}
 * @param {import("mongoose").Types.ObjectId | string} resourceObjectId
 * @returns {Promise<{ secure_url: string, public_id: string }>}
 */
export async function uploadBufferToFileManagement(
  file,
  folderKey = "facilities",
  resourceObjectId,
) {
  const resourceType =
    FOLDER_TO_RESOURCE_TYPE[folderKey] || folderKey || "facility";
  const resourceId = String(resourceObjectId);
  const fileId = await uploadMulterFile(file, resourceType, resourceId);
  return {
    secure_url: buildProxyViewUrl(fileId),
    public_id: fileId,
  };
}

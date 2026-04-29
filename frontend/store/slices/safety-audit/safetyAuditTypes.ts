/** Aligns with `backend/modals/safety-audit/safetyAuditChecklistItem.js` */

export type SafetyCompliance = "yes" | "no" | "na" | "partial" | "";

export type SafetySeverity = "low" | "medium" | "high" | "critical" | "";

export interface SafetyChecklistPhoto {
  fileUrl?: string;
  fileName?: string;
  fileType?: "image" | "pdf";
  uploadedAt?: string;
}

/** Top-level audit attachments (PDF + images) from file-management. */
export interface SafetyAuditAttachment {
  fileUrl: string;
  fileName: string;
  fileType: "image" | "pdf";
  uploadedAt?: string;
}

export interface SafetyChecklistItem {
  sr_no?: number;
  activity_description: string;
  requirement?: string;
  compliance?: SafetyCompliance;
  remarks?: string;
  recommendations?: string;
  severity?: SafetySeverity;
  photos?: SafetyChecklistPhoto[];
}

export type SafetyAuditStatus = "draft" | "completed" | "approved";

/** Loose document shape: every safety audit has facility + utility + optional checklist. */
export interface SafetyAuditRecord {
  _id: string;
  facility_id: string | { _id?: string; name?: string; city?: string };
  utility_account_id: string | { _id?: string; account_number?: string };
  audit_date?: string;
  auditor_id?: string | { _id?: string; name?: string; email?: string };
  items?: SafetyChecklistItem[];
  documents?: SafetyAuditAttachment[];
  status?: SafetyAuditStatus;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface ListSafetyAuditsResponse {
  success: boolean;
  count: number;
  data: SafetyAuditRecord[];
}

export interface GetSafetyAuditByIdResponse {
  success: boolean;
  data: SafetyAuditRecord;
}

export interface MutateSafetyAuditResponse {
  success: boolean;
  message?: string;
  data: SafetyAuditRecord;
}

export interface DeleteSafetyAuditResponse {
  success: boolean;
  message: string;
}

export interface CreateSafetyAuditRequest {
  facility_id: string;
  utility_account_id: string;
  audit_date?: string;
  status?: SafetyAuditStatus;
  items?: SafetyChecklistItem[];
  /** New uploads only; multipart field `documents`. */
  documents?: File[];
  [key: string]: unknown;
}

export interface UpdateSafetyAuditRequest {
  id: string;
  facility_id?: string;
  utility_account_id?: string;
  audit_date?: string;
  status?: SafetyAuditStatus;
  items?: SafetyChecklistItem[];
  documents?: File[];
  [key: string]: unknown;
}

/** `SafetyMeteringRoomAudit` — one logical record per utility account; no tag/name or location fields. */
export interface CreateMeteringRoomSafetyAuditRequest {
  facility_id: string;
  utility_account_id: string;
  audit_date?: string;
  status?: SafetyAuditStatus;
  items?: SafetyChecklistItem[];
  documents?: File[];
}

export type UpdateMeteringRoomSafetyAuditRequest = {
  id: string;
  facility_id?: string;
  utility_account_id?: string;
  audit_date?: string;
  status?: SafetyAuditStatus;
  items?: SafetyChecklistItem[];
  documents?: File[];
};

/** Query params for `GET` list endpoints across safety-audit resources. */
export type SafetyAuditListArg =
  | {
      facility_id?: string;
      utility_account_id?: string;
      transformer_id?: string;
      dg_set_id?: string;
    }
  | void;

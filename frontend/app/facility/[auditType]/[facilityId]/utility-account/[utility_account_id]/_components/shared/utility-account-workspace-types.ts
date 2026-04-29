export type TabItem = {
  id: string;
  label: string;
  count?: number;
  completed?: boolean;
};

export type UtilityDocument = {
  fileUrl: string;
  fileType: "image" | "pdf";
  fileName?: string;
  uploadedAt?: string;
};

export function formatUtilityAuditSubmittedBy(
  ref:
    | string
    | { _id?: string; name?: string; email?: string }
    | null
    | undefined,
): string {
  if (ref == null || ref === "") return "-";
  if (typeof ref === "object") {
    return ref.name || ref.email || ref._id || "-";
  }
  return String(ref);
}

/**
 * Multipart body builder for safety-audit create/update (matches `uploadDocuments` field name `documents`).
 * Parity with electrical-audit FormData patterns.
 */
export function buildSafetyAuditFormData(
  data: Record<string, unknown>
): FormData {
  const formData = new FormData();
  const docFiles =
    Array.isArray(data.documents) &&
    (data.documents as unknown[]).every((x) => x instanceof File)
      ? (data.documents as File[])
      : [];

  for (const [key, val] of Object.entries(data)) {
    if (key === "documents" || key === "id") continue;
    if (val === undefined || val === null) continue;

    if (key === "items") {
      formData.append("items", JSON.stringify(val));
      continue;
    }

    if (typeof val === "string") {
      formData.append(key, val);
    } else if (typeof val === "number" || typeof val === "boolean") {
      formData.append(key, String(val));
    } else if (val instanceof Date) {
      formData.append(key, val.toISOString());
    } else if (
      typeof val === "object" &&
      val !== null &&
      !Array.isArray(val) &&
      "_id" in (val as object)
    ) {
      const v = val as { _id?: unknown };
      formData.append(key, String(v._id ?? ""));
    } else if (typeof val === "object" && val !== null) {
      formData.append(key, JSON.stringify(val));
    }
  }

  docFiles.forEach((file) => formData.append("documents", file));
  return formData;
}

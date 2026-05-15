import type { Enquiry } from "@/store/slices/enquiryApiSlice";

export function resolveUserId(
  ref: string | { _id?: string } | null | undefined,
): string | null {
  if (ref == null) return null;
  if (typeof ref === "string") return ref;
  return ref._id ?? null;
}

export function canEditEnquiry(
  userId: string | undefined,
  row: Enquiry,
): boolean {
  if (!userId) return false;
  const creator = resolveUserId(row.created_by);
  const assignee = resolveUserId(row.assigned_to ?? undefined);
  return creator === userId || assignee === userId;
}

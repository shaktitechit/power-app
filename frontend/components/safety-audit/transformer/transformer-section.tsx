"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus,
  Pencil,
  Save,
  X,
  Trash2,
  Upload,
  FileText,
  ImageIcon,
} from "lucide-react";
import {
  useCreateSafetyTransformerAuditMutation,
  useDeleteSafetyTransformerAuditMutation,
  useGetSafetyTransformerAuditsQuery,
  useUpdateSafetyTransformerAuditMutation,
} from "@/store/slices/safety-audit/safetyTransformerAuditApiSlice";
import { useGetTransformersQuery } from "@/store/slices/electrical-audit/transformerApiSlice";
import { toastHandler } from "@/lib/toast";
import { toast } from "sonner";
import { useAppSelector } from "@/store/hooks";
import {
  type SafetyAuditAttachment,
  type SafetyAuditRecord,
  type SafetyChecklistItem,
  type SafetyCompliance,
  type SafetySeverity,
} from "@/store/slices/safety-audit/safetyAuditTypes";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { canViewDocuments, type UserPermission } from "@/lib/authRoles";
import { AuditNoDataEmptyState } from "@/components/electrical-audit/utility-audit/audit-no-data-empty-state";
import { SAFETY_AUDIT_STEP_LABELS } from "@/lib/electrical-audit/safety-audit-workflow";
import { useSafetyAuditNoDataStep } from "@/components/safety-audit/use-safety-audit-no-data-step";
import type { AuditStepNoDataEntry } from "@/store/slices/electrical-audit/utilityApiSlice";

/** Read-only / auto fields — light blue (aligned with electrical `autoInputClass`). */
const frozenFieldClass =
  "cursor-not-allowed border border-dashed border-sky-300 bg-sky-100 text-sky-900 opacity-100 dark:border-sky-700 dark:bg-sky-950/60 dark:text-sky-100";

/** Native `<select>` styling (same idea as `lux-measurement-section` — avoids Radix portal/scroll-lock). */
function nativeSelectClassForm(editing: boolean, locked: boolean) {
  const disabled = !editing || locked;
  return cn(
    "flex h-10 w-full rounded-md border px-3 py-2 text-sm",
    disabled
      ? frozenFieldClass
      : "border-input bg-background text-foreground",
  );
}

function nativeSelectClassTable(editing: boolean, locked: boolean) {
  const disabled = !editing || locked;
  return cn(
    "h-8 w-full rounded-md border px-2 py-1 text-xs",
    disabled ? frozenFieldClass : "border-input bg-background text-foreground",
  );
}

const SAFETY_AUDIT_TAB_ID = "transformers";

export interface SafetyTransformerSectionProps {
  facilityId: string;
  utilityAccountId: string;
  auditStepLocked?: boolean;
  auditStepNoData?: Record<string, AuditStepNoDataEntry>;
}

type ChecklistRow = {
  localKey: string;
  sr_no: number;
  activity_description: string;
  requirement: string;
  compliance: SafetyCompliance;
  remarks: string;
  recommendations: string;
  severity: SafetySeverity;
};

type SafetyTransformerFormState = {
  id?: string;
  localId: string;
  isNew: boolean;
  isEditing: boolean;
  name: string;
  location: string;
  capacity_kva: string;
  transformer_id: string;
  /** Set when the API populates a linked transformer; used if it is not in the dropdown list yet. */
  transformerLabel?: string;
  audit_date: string;
  status: "draft" | "completed" | "approved" | "";
  items: ChecklistRow[];
  /** Pending uploads (multipart `documents`). */
  documents: File[];
  /** Persisted uploads from API. */
  existingDocuments: SafetyAuditAttachment[];
};

const MAX_UPLOAD_FILES = 10;

const COMPLIANCE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "—" },
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "na", label: "N/A" },
  { value: "partial", label: "Partial" },
];

const SEVERITY_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "—" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const STATUS_OPTIONS: { value: "draft" | "completed" | "approved"; label: string }[] =
  [
    { value: "draft", label: "Draft" },
    { value: "completed", label: "Completed" },
    { value: "approved", label: "Approved" },
  ];

const editableInputClass =
  "border-input bg-background text-foreground focus:border-primary focus:ring-1 focus:ring-primary";
const readOnlyClass = frozenFieldClass;

const toDateInput = (value?: string | null) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
};

const toString = (v: unknown) => (v == null ? "" : String(v));

const toNumber = (s: string) => {
  const t = s.trim();
  if (!t) return undefined;
  const n = Number(t);
  return Number.isNaN(n) ? undefined : n;
};

const nextKey = () =>
  `row-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

/** Default transformer safety checklist (activity + requirement); compliance/remarks filled in the field. */
const DEFAULT_TRANSFORMER_CHECKLIST_SPEC: readonly {
  activity_description: string;
  requirement: string;
}[] = [
  {
    activity_description: "Check the neutral earthing of the transformer",
    requirement: "'N' should earth.",
  },
  {
    activity_description: "Check the condition of silica gel breather",
    requirement: "Free from moisture",
  },
  {
    activity_description: "Check fencing of the transformer yard",
    requirement: "Should prevent unauthorized entry.",
  },
  {
    activity_description: "Visual check for oil level",
    requirement: "Should above min. level",
  },
  {
    activity_description: "Check for fencing earth",
    requirement: "Earth loops should intact.",
  },
  {
    activity_description: "Measured no-load losses",
    requirement: "Within ±10% of nameplate values",
  },
  {
    activity_description: "Measured load losses",
    requirement: "Within ±10% of nameplate values",
  },
  {
    activity_description: "Loss trend analysis present",
    requirement: "Historical comparison documented",
  },
];

function defaultTransformerChecklistRows(): ChecklistRow[] {
  return DEFAULT_TRANSFORMER_CHECKLIST_SPEC.map((row, i) => ({
    localKey: nextKey(),
    sr_no: i + 1,
    activity_description: row.activity_description,
    requirement: row.requirement,
    compliance: "",
    remarks: "",
    recommendations: "",
    severity: "",
  }));
}

const createEmptyForm = (): SafetyTransformerFormState => ({
  localId: `new-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  isNew: true,
  isEditing: true,
  name: "",
  location: "",
  capacity_kva: "",
  transformer_id: "",
  transformerLabel: undefined,
  audit_date: "",
  status: "draft",
  items: defaultTransformerChecklistRows(),
  documents: [],
  existingDocuments: [],
});

function normalizeExistingDocuments(raw: unknown): SafetyAuditAttachment[] {
  if (!Array.isArray(raw)) return [];
  const out: SafetyAuditAttachment[] = [];
  for (const d of raw) {
    if (!d || typeof d !== "object") continue;
    const o = d as Record<string, unknown>;
    const fileUrl =
      typeof o.fileUrl === "string" ? o.fileUrl : String(o.fileUrl ?? "");
    if (!fileUrl) continue;
    const fileType =
      o.fileType === "pdf" ? "pdf" : o.fileType === "image" ? "image" : "image";
    out.push({
      fileUrl,
      fileName:
        typeof o.fileName === "string" ? o.fileName : String(o.fileName ?? ""),
      fileType,
      uploadedAt:
        typeof o.uploadedAt === "string"
          ? o.uploadedAt
          : o.uploadedAt instanceof Date
            ? o.uploadedAt.toISOString()
            : undefined,
    });
  }
  return out;
}

const itemToRow = (it: SafetyChecklistItem, index: number): ChecklistRow => ({
  localKey: nextKey(),
  sr_no: it.sr_no ?? index + 1,
  activity_description: it.activity_description || "",
  requirement: it.requirement || "",
  compliance: (it.compliance as SafetyCompliance) ?? "",
  remarks: it.remarks || "",
  recommendations: it.recommendations || "",
  severity: (it.severity as SafetySeverity) ?? "",
});

function recordToForm(r: SafetyAuditRecord & Record<string, unknown>): SafetyTransformerFormState {
  const items = Array.isArray(r.items) && r.items.length > 0
    ? (r.items as SafetyChecklistItem[]).map((it, i) => itemToRow(it, i))
    : defaultTransformerChecklistRows();

  const trId = r.transformer_id;
  let transformerLabel: string | undefined;
  const transformerIdStr =
    typeof trId === "string"
      ? trId
      : trId && typeof trId === "object" && "_id" in trId
        ? String((trId as { _id: string })._id)
        : "";
  if (trId && typeof trId === "object" && "name" in (trId as object)) {
    const n = (trId as { name?: string }).name;
    if (n) transformerLabel = String(n);
  }

  const raw = r as Record<string, unknown>;
  const id =
    (typeof raw._id === "string" || typeof raw._id === "number"
      ? String(raw._id)
      : null) ||
    (typeof raw.id === "string" || typeof raw.id === "number"
      ? String(raw.id)
      : null) ||
    "";

  return {
    id: id || undefined,
    localId: id || `orphan-${nextKey()}`,
    isNew: false,
    isEditing: false,
    name: toString(raw.name),
    location: toString(raw.location),
    capacity_kva: toString(raw.capacity_kva),
    transformer_id: transformerIdStr,
    transformerLabel,
    audit_date: toDateInput(r.audit_date),
    status: (r.status as SafetyTransformerFormState["status"]) || "draft",
    items,
    documents: [],
    existingDocuments: normalizeExistingDocuments(raw.documents),
  };
}

const rowsToPayloadItems = (rows: ChecklistRow[]): SafetyChecklistItem[] =>
  rows
    .filter((row) => row.activity_description.trim() !== "" || row.requirement.trim() !== "")
    .map((row, i) => ({
      sr_no: i + 1,
      activity_description: row.activity_description,
      requirement: row.requirement || undefined,
      compliance: row.compliance || undefined,
      remarks: row.remarks || undefined,
      recommendations: row.recommendations || undefined,
      severity: row.severity || undefined,
    }));

function getErrorMessage(err: unknown) {
  const e = err as { data?: { message?: string }; error?: string; message?: string };
  return e?.data?.message || e?.error || e?.message || "Request failed";
}

/**
 * Safety transformer audit records (checklist) for the electrical safety flow.
 * Pattern aligned with `hvac-audit-section` / `lighting-audit-section`: list, add, edit, save, delete.
 */
export function SafetyTransformerSection({
  facilityId,
  utilityAccountId,
  auditStepLocked = false,
  auditStepNoData,
}: SafetyTransformerSectionProps) {
  const { isNoDataAdmin, noDataDeclared } = useSafetyAuditNoDataStep(
    SAFETY_AUDIT_TAB_ID,
    auditStepNoData,
  );
  const user = useAppSelector((s) => s.auth.user);
  const canViewDocumentsFlag = canViewDocuments(
    user?.role,
    (user?.permissions as UserPermission[]) || [],
  );
  const canDeleteRecords =
    user?.role === "super_admin" || user?.role === "admin";
  const idReady = Boolean(facilityId?.trim() && utilityAccountId?.trim());
  const {
    data,
    isLoading,
    isFetching,
    isError,
    error: listError,
    refetch,
  } = useGetSafetyTransformerAuditsQuery(
    { facility_id: facilityId, utility_account_id: utilityAccountId },
    { skip: !idReady },
  );
  const { data: transformerList } = useGetTransformersQuery(
    { facility_id: facilityId, utility_account_id: utilityAccountId },
    { skip: !idReady },
  );
  const transformers = useMemo(
    () => transformerList?.data ?? [],
    [transformerList],
  );

  const [createRec, { isLoading: isCreating }] =
    useCreateSafetyTransformerAuditMutation();
  const [updateRec, { isLoading: isUpdating }] =
    useUpdateSafetyTransformerAuditMutation();
  const [deleteRec, { isLoading: isDeleting }] =
    useDeleteSafetyTransformerAuditMutation();

  const audits = useMemo(() => {
    const raw = data?.data;
    return Array.isArray(raw)
      ? (raw as (SafetyAuditRecord & Record<string, unknown>)[])
      : [];
  }, [data]);
  const [forms, setForms] = useState<SafetyTransformerFormState[]>([]);
  const [backendError, setBackendError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] =
    useState<SafetyTransformerFormState | null>(null);

  useEffect(() => {
    if (!auditStepLocked) return;
    setForms((p) => p.map((f) => ({ ...f, isEditing: false })));
  }, [auditStepLocked]);

  useEffect(() => {
    const mapped = audits.map(recordToForm);
    setForms((prev) => {
      const fresh = prev.filter((f) => f.isNew);
      return [...fresh, ...mapped];
    });
  }, [audits]);

  const updateForm = (
    localId: string,
    up: (f: SafetyTransformerFormState) => SafetyTransformerFormState,
  ) => {
    setForms((p) => p.map((f) => (f.localId === localId ? up(f) : f)));
  };

  const replaceForm = (localId: string, next: SafetyTransformerFormState) => {
    setForms((p) => p.map((f) => (f.localId === localId ? next : f)));
  };
  const removeForm = (localId: string) => {
    setForms((p) => p.filter((f) => f.localId !== localId));
  };
  const toggleEdit = (localId: string, e: boolean) => {
    setForms((p) =>
      p.map((f) => (f.localId === localId ? { ...f, isEditing: e } : f)),
    );
  };

  const handleAddMore = () => {
    setForms((p) => [createEmptyForm(), ...p]);
  };

  const auditRecordId = (a: SafetyAuditRecord & Record<string, unknown>) =>
    String(a._id ?? (a as Record<string, unknown>).id ?? "");

  const handleCancel = (form: SafetyTransformerFormState) => {
    if (form.isNew) {
      removeForm(form.localId);
      return;
    }
    const o = audits.find((a) => auditRecordId(a) === form.id);
    if (!o) return;
    replaceForm(form.localId, recordToForm(o as SafetyAuditRecord & Record<string, unknown>));
    toggleEdit(form.localId, false);
  };

  const handleDocumentsChange = (
    formLocalId: string,
    files: FileList | null,
  ) => {
    if (!files?.length) return;
    updateForm(formLocalId, (f) => {
      const merged = [...f.documents, ...Array.from(files)];
      if (merged.length > MAX_UPLOAD_FILES) {
        toast.error(
          `At most ${MAX_UPLOAD_FILES} new files per save. Remove some first.`,
        );
        return f;
      }
      return { ...f, documents: merged };
    });
  };

  const removeNewDocument = (formLocalId: string, index: number) => {
    updateForm(formLocalId, (f) => ({
      ...f,
      documents: f.documents.filter((_, i) => i !== index),
    }));
  };

  const inputClass = (editing: boolean) =>
    !editing || auditStepLocked ? readOnlyClass : editableInputClass;

  const handleSave = async (form: SafetyTransformerFormState) => {
    setBackendError("");
    const items = rowsToPayloadItems(form.items);
    if (items.length === 0) {
      setBackendError("Add at least one checklist row with an activity or requirement.");
      return;
    }
    const payload = {
      facility_id: facilityId,
      utility_account_id: utilityAccountId,
      name: form.name.trim() || undefined,
      location: form.location.trim() || undefined,
      capacity_kva: toNumber(form.capacity_kva),
      transformer_id: form.transformer_id.trim() || undefined,
      audit_date: form.audit_date || undefined,
      status: (form.status || "draft") as "draft" | "completed" | "approved",
      items,
      ...(form.documents.length > 0 ? { documents: form.documents } : {}),
    };
    try {
      await toastHandler({
        action: () => {
          if (form.isNew) {
            return createRec(payload as never).unwrap();
          }
          if (form.id) {
            return updateRec({ id: form.id, ...payload } as never).unwrap();
          }
          return Promise.reject(new Error("Missing record id"));
        },
        loading: form.isNew ? "Creating record..." : "Saving...",
        success: form.isNew ? "Transformer safety audit created" : "Saved",
      });
      await refetch();
    } catch (err) {
      setBackendError(getErrorMessage(err));
    }
  };

  const onDelete = (f: SafetyTransformerFormState) => {
    if (!f.id) return;
    setDeleteTarget(f);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;
    try {
      await toastHandler({
        action: () => deleteRec(deleteTarget.id as string).unwrap(),
        loading: "Deleting...",
        success: "Record deleted",
      });
      setDeleteOpen(false);
      setDeleteTarget(null);
      await refetch();
    } catch (e) {
      console.error(e);
    }
  };

  const updateRow = (
    formLocalId: string,
    rowKey: string,
    patch: Partial<ChecklistRow>,
  ) => {
    updateForm(formLocalId, (f) => ({
      ...f,
      items: f.items.map((r) =>
        r.localKey === rowKey ? { ...r, ...patch } : r,
      ),
    }));
  };

  const saving = isCreating || isUpdating || isDeleting;

  const listLoading =
    idReady && (isLoading || (isFetching && !data && !isError));

  if (!idReady) {
    return (
      <div className="text-sm text-muted-foreground">
        Loading utility context…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive">
          Could not load safety transformer audits. {getErrorMessage(listError)}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void refetch()}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (listLoading) {
    return (
      <div className="text-sm text-muted-foreground">Loading safety transformer audits…</div>
    );
  }

  return (
    <div className="relative space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-base font-medium text-foreground sm:text-lg">
          Safety — Transformer
        </h3>
        {!auditStepLocked && (
          <Button
            onClick={handleAddMore}
            disabled={noDataDeclared}
            className="w-full shrink-0 sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add record
          </Button>
        )}
      </div>

      {backendError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {backendError}
        </div>
      )}

      {forms.length === 0 ? (
        <AuditNoDataEmptyState
          utilityAccountId={utilityAccountId}
          stepId={SAFETY_AUDIT_TAB_ID}
          sectionLabel={SAFETY_AUDIT_STEP_LABELS[SAFETY_AUDIT_TAB_ID]}
          auditStepLocked={auditStepLocked}
          isAdmin={isNoDataAdmin}
          noDataDeclared={noDataDeclared}
        />
      ) : (
        forms.map((form, index) => (
          <Card key={form.localId}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                Record {forms.length - index}
                {form.isNew ? " (new)" : ""}
                {form.name ? ` — ${form.name}` : ""}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                {!form.isEditing ? (
                  <>
                    {!auditStepLocked && (
                      <Button
                        type="button"
                        onClick={() => toggleEdit(form.localId, true)}
                        size="sm"
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    )}
                    {canDeleteRecords && form.id ? (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => onDelete(form)}
                        disabled={saving || auditStepLocked}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    ) : null}
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancel(form)}
                      disabled={saving}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => void handleSave(form)}
                      disabled={saving || auditStepLocked}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {saving ? "Saving…" : "Save"}
                    </Button>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Audit name / tag</Label>
                  <Input
                    className={inputClass(
                      form.isEditing && !auditStepLocked,
                    )}
                    value={form.name}
                    onChange={(e) =>
                      updateForm(form.localId, (f) => ({
                        ...f,
                        name: e.target.value,
                      }))
                    }
                    readOnly={!form.isEditing || auditStepLocked}
                    placeholder="e.g. HT transformer T1"
                  />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input
                    className={inputClass(
                      form.isEditing && !auditStepLocked,
                    )}
                    value={form.location}
                    onChange={(e) =>
                      updateForm(form.localId, (f) => ({
                        ...f,
                        location: e.target.value,
                      }))
                    }
                    readOnly={!form.isEditing || auditStepLocked}
                  />
                </div>
                <div>
                  <Label>Capacity (kVA)</Label>
                  <Input
                    className={inputClass(
                      form.isEditing && !auditStepLocked,
                    )}
                    type="number"
                    value={form.capacity_kva}
                    onChange={(e) =>
                      updateForm(form.localId, (f) => ({
                        ...f,
                        capacity_kva: e.target.value,
                      }))
                    }
                    readOnly={!form.isEditing || auditStepLocked}
                  />
                </div>
                <div>
                  <Label>Link to installed transformer (optional)</Label>
                  <select
                    className={nativeSelectClassForm(
                      form.isEditing,
                      auditStepLocked,
                    )}
                    value={form.transformer_id}
                    onChange={(e) => {
                      const id = e.target.value;
                      const inList = Boolean(
                        id && transformers.some((t) => t._id === id),
                      );
                      updateForm(form.localId, (f) => ({
                        ...f,
                        transformer_id: id,
                        transformerLabel: inList ? undefined : f.transformerLabel,
                      }));
                    }}
                    disabled={!form.isEditing || auditStepLocked}
                  >
                    <option value="">None</option>
                    {form.transformer_id &&
                    !transformers.some((t) => t._id === form.transformer_id) ? (
                      <option value={form.transformer_id}>
                        {form.transformerLabel ||
                          `Linked transformer (${form.transformer_id})`}
                      </option>
                    ) : null}
                    {transformers.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.transformer_tag || t._id}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Audit date</Label>
                  <Input
                    className={inputClass(
                      form.isEditing && !auditStepLocked,
                    )}
                    type="date"
                    value={form.audit_date}
                    onChange={(e) =>
                      updateForm(form.localId, (f) => ({
                        ...f,
                        audit_date: e.target.value,
                      }))
                    }
                    readOnly={!form.isEditing || auditStepLocked}
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <select
                    className={nativeSelectClassForm(
                      form.isEditing,
                      auditStepLocked,
                    )}
                    value={form.status || "draft"}
                    onChange={(e) =>
                      updateForm(form.localId, (f) => ({
                        ...f,
                        status: e.target
                          .value as SafetyTransformerFormState["status"],
                      }))
                    }
                    disabled={!form.isEditing || auditStepLocked}
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="mb-2">
                  <Label>Checklist</Label>
                </div>
                <div className="relative max-h-[min(60vh,520px)] min-h-0 overflow-auto rounded-md border">
                  <table className="w-full min-w-[720px] text-sm">
                    <thead className="sticky top-0 z-20">
                      <tr className="border-b border-border bg-muted/95 text-left text-xs text-muted-foreground shadow-sm backdrop-blur supports-[backdrop-filter]:bg-muted/90">
                        <th className="p-2">#</th>
                        <th className="p-2">Activity / observation</th>
                        <th className="p-2">Requirement</th>
                        <th className="p-2 w-28">Compliance</th>
                        <th className="p-2">Remarks</th>
                        <th className="p-2">Recommendations</th>
                        <th className="p-2 w-28">Severity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.items.map((row) => (
                        <tr
                          key={row.localKey}
                          className="border-b last:border-0"
                        >
                          <td className="p-1 align-top text-muted-foreground">
                            {row.sr_no}
                          </td>
                          <td className="p-1">
                            <Textarea
                              className={readOnlyClass}
                              rows={2}
                              value={row.activity_description}
                              readOnly
                            />
                          </td>
                          <td className="p-1">
                            <Textarea
                              className={readOnlyClass}
                              rows={2}
                              value={row.requirement}
                              readOnly
                            />
                          </td>
                          <td className="p-1">
                            <select
                              className={nativeSelectClassTable(
                                form.isEditing,
                                auditStepLocked,
                              )}
                              value={row.compliance || ""}
                              onChange={(e) =>
                                updateRow(form.localId, row.localKey, {
                                  compliance: e.target
                                    .value as SafetyCompliance,
                                })
                              }
                              disabled={!form.isEditing || auditStepLocked}
                            >
                              {COMPLIANCE_OPTIONS.map((o) => (
                                <option
                                  key={o.value || "compliance-empty"}
                                  value={o.value}
                                >
                                  {o.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-1">
                            <Textarea
                              className={inputClass(
                                form.isEditing && !auditStepLocked,
                              )}
                              rows={2}
                              value={row.remarks}
                              onChange={(e) =>
                                updateRow(form.localId, row.localKey, {
                                  remarks: e.target.value,
                                })
                              }
                              readOnly={!form.isEditing || auditStepLocked}
                            />
                          </td>
                          <td className="p-1">
                            <Textarea
                              className={inputClass(
                                form.isEditing && !auditStepLocked,
                              )}
                              rows={2}
                              value={row.recommendations}
                              onChange={(e) =>
                                updateRow(form.localId, row.localKey, {
                                  recommendations: e.target.value,
                                })
                              }
                              readOnly={!form.isEditing || auditStepLocked}
                            />
                          </td>
                          <td className="p-1">
                            <select
                              className={nativeSelectClassTable(
                                form.isEditing,
                                auditStepLocked,
                              )}
                              value={row.severity || ""}
                              onChange={(e) =>
                                updateRow(form.localId, row.localKey, {
                                  severity: e.target
                                    .value as SafetySeverity,
                                })
                              }
                              disabled={!form.isEditing || auditStepLocked}
                            >
                              {SEVERITY_OPTIONS.map((o) => (
                                <option
                                  key={o.value || "severity-empty"}
                                  value={o.value}
                                >
                                  {o.label}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-xl border p-4">
                <h4 className="mb-4 text-base font-semibold text-foreground">
                  Documents
                </h4>

                <div className="space-y-2">
                  <Label>Upload documents (PDF or images)</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="file"
                      multiple
                      accept=".pdf,image/*"
                      onChange={(e) =>
                        handleDocumentsChange(
                          form.localId,
                          e.target.files,
                        )
                      }
                      disabled={!form.isEditing || auditStepLocked}
                      className={inputClass(form.isEditing && !auditStepLocked)}
                    />
                    <Upload className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Up to {MAX_UPLOAD_FILES} files per save. Max ~10 MB each.
                  </p>
                </div>

                {canViewDocumentsFlag && form.existingDocuments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <Label>Saved documents</Label>
                    <div className="space-y-2">
                      {form.existingDocuments.map((doc, docIndex) => (
                        <div
                          key={`${doc.fileUrl}-${docIndex}`}
                          className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {doc.fileType === "pdf" ? (
                              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                            ) : (
                              <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                            )}
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="truncate text-primary hover:underline"
                            >
                              {doc.fileName || `Document ${docIndex + 1}`}
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {!canViewDocumentsFlag && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Only super admin, admin, and manager can open saved document
                    links.
                  </p>
                )}

                {form.documents.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <Label>Selected for upload</Label>
                    <div className="space-y-2">
                      {form.documents.map((file, fileIndex) => (
                        <div
                          key={`${file.name}-${fileIndex}-${file.size}`}
                          className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {file.type === "application/pdf" ? (
                              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                            ) : (
                              <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                            )}
                            <span className="truncate">{file.name}</span>
                          </div>
                          {form.isEditing && !auditStepLocked && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="shrink-0"
                              onClick={() =>
                                removeNewDocument(form.localId, fileIndex)
                              }
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the safety transformer audit. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmDelete()}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

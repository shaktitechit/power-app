"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toSameOriginFileManagementUrl } from "@/lib/fileManagementUrls";
import {
  Pencil,
  Save,
  X,
  Trash2,
  Upload,
  FileText,
  ImageIcon,
} from "lucide-react";
import {
  useCreateSafetyLoadAnalysisAuditMutation,
  useDeleteSafetyLoadAnalysisAuditMutation,
  useGetSafetyLoadAnalysisAuditsQuery,
  useUpdateSafetyLoadAnalysisAuditMutation,
} from "@/store/slices/safety-audit/safetyLoadAnalysisAuditApiSlice";
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

const frozenFieldClass =
  "cursor-not-allowed border border-dashed border-sky-300 bg-sky-100 text-sky-900 opacity-100 dark:border-sky-700 dark:bg-sky-950/60 dark:text-sky-100";

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

const SAFETY_AUDIT_TAB_ID = "load-analysis";

export interface SafetyLoadAnalysisSectionProps {
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

type SafetyLoadAnalysisFormState = {
  id?: string;
  localId: string;
  isNew: boolean;
  isEditing: boolean;
  transformer_loading_percent: string;
  panel_breaker_loading_percent: string;
  current_unbalance_percent: string;
  voltage_unbalance_percent: string;
  audit_date: string;
  status: "draft" | "completed" | "approved" | "";
  items: ChecklistRow[];
  documents: File[];
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

const STATUS_OPTIONS: {
  value: "draft" | "completed" | "approved";
  label: string;
}[] = [
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

/** Display optional numeric backend field in controlled inputs */
function numToInput(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? String(n) : "";
  }
  return "";
}

function optionalParsedNumber(raw: string): number | undefined {
  const t = raw.trim();
  if (t === "") return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

const nextKey = () =>
  `row-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const DEFAULT_LOAD_ANALYSIS_CHECKLIST_SPEC: readonly {
  activity_description: string;
  requirement: string;
}[] = [
  {
    activity_description: "Transformer loading",
    requirement: "≤ 80% continuous, ≤ 100% peak",
  },
  {
    activity_description: "Panel/DB breaker loading",
    requirement: "≤ 90% of MCB rating",
  },
  {
    activity_description: "Current unbalance (3Φ)",
    requirement: "≤ 10% variation",
  },
  {
    activity_description: "Voltage unbalance (3Φ)",
    requirement: "≤ 2% variation",
  },
];

function defaultLoadAnalysisChecklistRows(): ChecklistRow[] {
  return DEFAULT_LOAD_ANALYSIS_CHECKLIST_SPEC.map((row, i) => ({
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

const createEmptyForm = (): SafetyLoadAnalysisFormState => ({
  localId: `new-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  isNew: true,
  isEditing: true,
  transformer_loading_percent: "",
  panel_breaker_loading_percent: "",
  current_unbalance_percent: "",
  voltage_unbalance_percent: "",
  audit_date: "",
  status: "draft",
  items: defaultLoadAnalysisChecklistRows(),
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

function recordToForm(
  r: SafetyAuditRecord & Record<string, unknown>,
): SafetyLoadAnalysisFormState {
  const items =
    Array.isArray(r.items) && r.items.length > 0
      ? (r.items as SafetyChecklistItem[]).map((it, i) => itemToRow(it, i))
      : defaultLoadAnalysisChecklistRows();

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
    transformer_loading_percent: numToInput(raw.transformer_loading_percent),
    panel_breaker_loading_percent: numToInput(raw.panel_breaker_loading_percent),
    current_unbalance_percent: numToInput(raw.current_unbalance_percent),
    voltage_unbalance_percent: numToInput(raw.voltage_unbalance_percent),
    audit_date: toDateInput(r.audit_date),
    status:
      (r.status as SafetyLoadAnalysisFormState["status"]) || "draft",
    items,
    documents: [],
    existingDocuments: normalizeExistingDocuments(raw.documents),
  };
}

const rowsToPayloadItems = (rows: ChecklistRow[]): SafetyChecklistItem[] =>
  rows
    .filter(
      (row) =>
        row.activity_description.trim() !== "" || row.requirement.trim() !== "",
    )
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
  const e = err as {
    data?: { message?: string };
    error?: string;
    message?: string;
  };
  return e?.data?.message || e?.error || e?.message || "Request failed";
}

/** Electrical safety — load analysis (`SafetyLoadAnalysisAudit`). Single record per utility account in the UI. */
export function SafetyLoadAnalysisSection({
  facilityId,
  utilityAccountId,
  auditStepLocked = false,
  auditStepNoData,
}: SafetyLoadAnalysisSectionProps) {
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
  } = useGetSafetyLoadAnalysisAuditsQuery(
    { facility_id: facilityId, utility_account_id: utilityAccountId },
    { skip: !idReady },
  );

  const [createRec, { isLoading: isCreating }] =
    useCreateSafetyLoadAnalysisAuditMutation();
  const [updateRec, { isLoading: isUpdating }] =
    useUpdateSafetyLoadAnalysisAuditMutation();
  const [deleteRec, { isLoading: isDeleting }] =
    useDeleteSafetyLoadAnalysisAuditMutation();

  const audits = useMemo(() => {
    const raw = data?.data;
    return Array.isArray(raw)
      ? (raw as (SafetyAuditRecord & Record<string, unknown>)[])
      : [];
  }, [data]);

  const serverRecord = audits[0];

  const [form, setForm] = useState<SafetyLoadAnalysisFormState | null>(null);
  const [backendError, setBackendError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] =
    useState<SafetyLoadAnalysisFormState | null>(null);

  useEffect(() => {
    if (!auditStepLocked) return;
    setForm((f) => (f ? { ...f, isEditing: false } : null));
  }, [auditStepLocked]);

  useEffect(() => {
    setForm((prev) => {
      if (prev?.isEditing) return prev;
      if (!serverRecord) {
        return prev?.isNew ? prev : null;
      }
      return recordToForm(serverRecord);
    });
  }, [serverRecord]);

  const auditRecordId = (a: SafetyAuditRecord & Record<string, unknown>) =>
    String(a._id ?? (a as Record<string, unknown>).id ?? "");

  const patchForm = (
    up: (f: SafetyLoadAnalysisFormState) => SafetyLoadAnalysisFormState,
  ) => {
    setForm((f) => (f ? up(f) : f));
  };

  const toggleEdit = (e: boolean) => {
    setForm((f) => (f ? { ...f, isEditing: e } : null));
  };

  const handleStartCreate = () => {
    if (auditStepLocked) return;
    setForm(createEmptyForm());
  };

  const handleCancel = (f: SafetyLoadAnalysisFormState) => {
    if (f.isNew) {
      setForm(null);
      return;
    }
    const o = serverRecord;
    if (!o || auditRecordId(o) !== f.id) return;
    setForm(recordToForm(o as SafetyAuditRecord & Record<string, unknown>));
  };

  const handleDocumentsChange = (files: FileList | null) => {
    if (!files?.length) return;
    patchForm((f) => {
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

  const removeNewDocument = (index: number) => {
    patchForm((f) => ({
      ...f,
      documents: f.documents.filter((_, i) => i !== index),
    }));
  };

  const inputClass = (editing: boolean) =>
    !editing || auditStepLocked ? readOnlyClass : editableInputClass;

  const numericPayload = (f: SafetyLoadAnalysisFormState) => {
    const transformer_loading_percent = optionalParsedNumber(
      f.transformer_loading_percent,
    );
    const panel_breaker_loading_percent = optionalParsedNumber(
      f.panel_breaker_loading_percent,
    );
    const current_unbalance_percent = optionalParsedNumber(
      f.current_unbalance_percent,
    );
    const voltage_unbalance_percent = optionalParsedNumber(
      f.voltage_unbalance_percent,
    );
    return {
      ...(transformer_loading_percent !== undefined
        ? { transformer_loading_percent }
        : {}),
      ...(panel_breaker_loading_percent !== undefined
        ? { panel_breaker_loading_percent }
        : {}),
      ...(current_unbalance_percent !== undefined
        ? { current_unbalance_percent }
        : {}),
      ...(voltage_unbalance_percent !== undefined
        ? { voltage_unbalance_percent }
        : {}),
    };
  };

  const handleSave = async (form: SafetyLoadAnalysisFormState) => {
    setBackendError("");
    const items = rowsToPayloadItems(form.items);
    if (items.length === 0) {
      setBackendError(
        "Add at least one checklist row with an activity or requirement.",
      );
      return;
    }
    const payload = {
      facility_id: facilityId,
      utility_account_id: utilityAccountId,
      audit_date: form.audit_date || undefined,
      status: (form.status || "draft") as "draft" | "completed" | "approved",
      items,
      ...numericPayload(form),
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
        success: form.isNew
          ? "Load analysis safety audit created"
          : "Saved",
      });
      setForm((f) => (f ? { ...f, isEditing: false, isNew: false } : f));
      await refetch();
    } catch (err) {
      setBackendError(getErrorMessage(err));
    }
  };

  const onDelete = (f: SafetyLoadAnalysisFormState) => {
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

  const updateRow = (rowKey: string, patch: Partial<ChecklistRow>) => {
    patchForm((f) => ({
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
          Could not load load analysis safety audits.{" "}
          {getErrorMessage(listError)}
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
      <div className="text-sm text-muted-foreground">
        Loading load analysis safety audits…
      </div>
    );
  }

  return (
    <div className="relative space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-base font-medium text-foreground sm:text-lg">
          Safety — Load analysis
        </h3>
        {!auditStepLocked && !serverRecord && !form && (
          <Button
            type="button"
            onClick={handleStartCreate}
            disabled={noDataDeclared}
            className="w-full shrink-0 sm:w-auto"
          >
            Create load analysis audit
          </Button>
        )}
      </div>

      {audits.length > 1 && (
        <p className="text-xs text-muted-foreground">
          Multiple load analysis records exist for this account; only the newest is
          shown and edited here.
        </p>
      )}

      {backendError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {backendError}
        </div>
      )}

      {!form ? (
        serverRecord ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Loading…
            </CardContent>
          </Card>
        ) : (
          <AuditNoDataEmptyState
            utilityAccountId={utilityAccountId}
            stepId={SAFETY_AUDIT_TAB_ID}
            sectionLabel={SAFETY_AUDIT_STEP_LABELS[SAFETY_AUDIT_TAB_ID]}
            auditStepLocked={auditStepLocked}
            isAdmin={isNoDataAdmin}
            noDataDeclared={noDataDeclared}
          />
        )
      ) : (
        <Card key={form.localId}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              Load analysis safety audit
              {form.isNew ? " (unsaved)" : ""}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              {!form.isEditing ? (
                <>
                  {!auditStepLocked && (
                    <Button
                      type="button"
                      onClick={() => toggleEdit(true)}
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
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label>Transformer loading (%)</Label>
                <Input
                  className={inputClass(form.isEditing && !auditStepLocked)}
                  inputMode="decimal"
                  value={form.transformer_loading_percent}
                  onChange={(e) =>
                    patchForm((f) => ({
                      ...f,
                      transformer_loading_percent: e.target.value,
                    }))
                  }
                  readOnly={!form.isEditing || auditStepLocked}
                  placeholder="e.g. 72"
                />
              </div>
              <div>
                <Label>Panel / breaker loading (%)</Label>
                <Input
                  className={inputClass(form.isEditing && !auditStepLocked)}
                  inputMode="decimal"
                  value={form.panel_breaker_loading_percent}
                  onChange={(e) =>
                    patchForm((f) => ({
                      ...f,
                      panel_breaker_loading_percent: e.target.value,
                    }))
                  }
                  readOnly={!form.isEditing || auditStepLocked}
                  placeholder="e.g. 65"
                />
              </div>
              <div>
                <Label>Current unbalance (%)</Label>
                <Input
                  className={inputClass(form.isEditing && !auditStepLocked)}
                  inputMode="decimal"
                  value={form.current_unbalance_percent}
                  onChange={(e) =>
                    patchForm((f) => ({
                      ...f,
                      current_unbalance_percent: e.target.value,
                    }))
                  }
                  readOnly={!form.isEditing || auditStepLocked}
                  placeholder="e.g. 8"
                />
              </div>
              <div>
                <Label>Voltage unbalance (%)</Label>
                <Input
                  className={inputClass(form.isEditing && !auditStepLocked)}
                  inputMode="decimal"
                  value={form.voltage_unbalance_percent}
                  onChange={(e) =>
                    patchForm((f) => ({
                      ...f,
                      voltage_unbalance_percent: e.target.value,
                    }))
                  }
                  readOnly={!form.isEditing || auditStepLocked}
                  placeholder="e.g. 1.5"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Audit date</Label>
                <Input
                  className={inputClass(form.isEditing && !auditStepLocked)}
                  type="date"
                  value={form.audit_date}
                  onChange={(e) =>
                    patchForm((f) => ({
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
                    patchForm((f) => ({
                      ...f,
                      status: e.target
                        .value as SafetyLoadAnalysisFormState["status"],
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
                              updateRow(row.localKey, {
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
                              updateRow(row.localKey, {
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
                              updateRow(row.localKey, {
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
                              updateRow(row.localKey, {
                                severity: e.target.value as SafetySeverity,
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
                    onChange={(e) => handleDocumentsChange(e.target.files)}
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
                        <div className="flex min-w-0 items-center gap-2">
                          {doc.fileType === "pdf" ? (
                            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                          ) : (
                            <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                          )}
                          <a
                            href={toSameOriginFileManagementUrl(doc.fileUrl)}
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
                        <div className="flex min-w-0 items-center gap-2">
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
                            onClick={() => removeNewDocument(fileIndex)}
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
      )}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this load analysis safety audit. This
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

"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
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
  Upload,
  Trash2,
  FileText,
  ImageIcon,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import {
  useCreateFanAuditRecordMutation,
  useGetFanAuditRecordsQuery,
  useUpdateFanAuditRecordMutation,
} from "@/store/slices/fanAuditRecordApiSlice";
import {
  downloadFanAuditExcelTemplate,
  fanAuditFormToExcelPrefill,
  parseFanAuditExcel,
} from "@/lib/fan-audit-record-excel";
import { toastHandler } from "@/lib/toast";
import { toast } from "sonner";
import { useAppSelector } from "@/store/hooks";
import { UTILITY_AUDIT_STEP_IDS } from "@/lib/utility-audit-steps";
import { AuditStepSubmitBar } from "@/components/utility-audit/audit-step-submit-bar";
import { AuditStepLockedOverlay } from "@/components/utility-audit/audit-step-locked-overlay";
import { AuditNoDataEmptyState } from "@/components/utility-audit/audit-no-data-empty-state";
import type { AuditStepNoDataEntry } from "@/store/slices/utilityApiSlice";

interface FanAuditRecordSectionProps {
  facilityId: string;
  utilityAccountId: string;
  auditStepLocked?: boolean;
  auditStepNoData?: Record<string, AuditStepNoDataEntry>;
}

type ExistingDocument = {
  fileUrl: string;
  fileType: "image" | "pdf";
  fileName?: string;
  uploadedAt?: string;
};

type FanAuditFormState = {
  id?: string;
  localId: string;
  isNew: boolean;
  isEditing: boolean;

  building_block: string;
  area_location: string;
  fan_type:
    | "ceiling"
    | "exhaust"
    | "pedestal"
    | "wall"
    | "industrial"
    | "other"
    | "";
  make_model: string;

  rated_power_W: string;
  measured_power_W: string;
  quantity_nos: string;

  speed_control_type: "regulator" | "electronic" | "vfd" | "none" | "";

  operating_hours_per_day: string;
  operating_days_per_year: string;

  loading_factor_percent: string;
  connected_load_kW: string;
  annual_energy_consumption_kWh: string;

  condition: "good" | "old" | "inefficient" | "";
  remarks: string;

  audit_date: string;
  auditor_id: string;

  existingDocuments: ExistingDocument[];
  newDocuments: File[];
};

const editableInputClass =
  "border-input bg-background text-foreground placeholder:text-muted-foreground";
const autoInputClass =
  "cursor-not-allowed border border-dashed border-sky-300 bg-sky-100 text-sky-900 opacity-100 dark:border-sky-700 dark:bg-sky-950/60 dark:text-sky-100";

const createEmptyForm = (): FanAuditFormState => ({
  localId: `new-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  isNew: true,
  isEditing: true,

  building_block: "",
  area_location: "",
  fan_type: "",
  make_model: "",

  rated_power_W: "",
  measured_power_W: "",
  quantity_nos: "1",

  speed_control_type: "",

  operating_hours_per_day: "",
  operating_days_per_year: "",

  loading_factor_percent: "",
  connected_load_kW: "",
  annual_energy_consumption_kWh: "",

  condition: "",
  remarks: "",

  audit_date: "",
  auditor_id: "",

  existingDocuments: [],
  newDocuments: [],
});

function toDateInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
}

const toStringValue = (value: unknown) =>
  value === undefined || value === null ? "" : String(value);

const toNumber = (value: string) => {
  if (!value || value.trim() === "") return undefined;
  const num = Number(value);
  return Number.isNaN(num) ? undefined : num;
};

const round2 = (num: number) => Number(num.toFixed(2));

const updateComputedValues = (form: FanAuditFormState): FanAuditFormState => {
  const ratedPower = Number(form.rated_power_W);
  const measuredPower = Number(form.measured_power_W);
  const quantity = Number(form.quantity_nos);
  const hoursPerDay = Number(form.operating_hours_per_day);
  const daysPerYear = Number(form.operating_days_per_year);

  const loadingFactor =
    !Number.isNaN(measuredPower) && !Number.isNaN(ratedPower) && ratedPower > 0
      ? round2((measuredPower / ratedPower) * 100)
      : undefined;

  const connectedLoad =
    !Number.isNaN(measuredPower) && !Number.isNaN(quantity)
      ? round2((measuredPower * quantity) / 1000)
      : undefined;

  const annualEnergy =
    connectedLoad !== undefined &&
    !Number.isNaN(hoursPerDay) &&
    !Number.isNaN(daysPerYear)
      ? round2(connectedLoad * hoursPerDay * daysPerYear)
      : undefined;

  return {
    ...form,
    loading_factor_percent:
      loadingFactor !== undefined ? String(loadingFactor) : "",
    connected_load_kW: connectedLoad !== undefined ? String(connectedLoad) : "",
    annual_energy_consumption_kWh:
      annualEnergy !== undefined ? String(annualEnergy) : "",
  };
};

function auditToForm(record: any): FanAuditFormState {
  return updateComputedValues({
    id: record._id,
    localId: record._id,
    isNew: false,
    isEditing: false,

    building_block: record.building_block || "",
    area_location: record.area_location || "",
    fan_type: record.fan_type || "",
    make_model: record.make_model || "",

    rated_power_W: toStringValue(record.rated_power_W),
    measured_power_W: toStringValue(record.measured_power_W),
    quantity_nos: toStringValue(record.quantity_nos || 1),

    speed_control_type: record.speed_control_type || "",

    operating_hours_per_day: toStringValue(record.operating_hours_per_day),
    operating_days_per_year: toStringValue(record.operating_days_per_year),

    loading_factor_percent: toStringValue(record.loading_factor_percent),
    connected_load_kW: toStringValue(record.connected_load_kW),
    annual_energy_consumption_kWh: toStringValue(
      record.annual_energy_consumption_kWh,
    ),

    condition: record.condition || "",
    remarks: record.remarks || "",

    audit_date: toDateInput(record.audit_date),
    auditor_id: record.auditor_id?._id || record.auditor_id || "",

    existingDocuments: record.documents || [],
    newDocuments: [],
  });
}

export function FanAuditRecordSection({
  facilityId,
  utilityAccountId,
  auditStepLocked = false,
  auditStepNoData,
}: FanAuditRecordSectionProps) {
  const user = useAppSelector((state) => state.auth.user);
  const canViewDocuments = user?.role === "admin";
  const isAdmin = user?.role === "admin";
  const noDataDeclared = Boolean(
    auditStepNoData?.[UTILITY_AUDIT_STEP_IDS.FAN]?.declared_at,
  );
  const { data, isLoading, refetch } = useGetFanAuditRecordsQuery({
    utility_account_id: utilityAccountId,
  });

  const [createFanAuditRecord, { isLoading: isCreating }] =
    useCreateFanAuditRecordMutation();

  const [updateFanAuditRecord, { isLoading: isUpdating }] =
    useUpdateFanAuditRecordMutation();

  const records = useMemo(() => data?.data || [], [data]);
  const [forms, setForms] = useState<FanAuditFormState[]>([]);
  const [excelImporting, setExcelImporting] = useState(false);
  const [backendError, setBackendError] = useState("");

  useEffect(() => {
    const mapped = records
      .map(auditToForm)
      .sort(
        (a, b) =>
          new Date(b.audit_date || 0).getTime() -
          new Date(a.audit_date || 0).getTime(),
      );

    setForms((prev) => {
      const unsaved = prev.filter((item) => item.isNew);
      return [...unsaved, ...mapped];
    });
  }, [records]);

  const replaceForm = (localId: string, nextForm: FanAuditFormState) => {
    setForms((prev) =>
      prev.map((form) => (form.localId === localId ? nextForm : form)),
    );
  };

  const updateForm = (
    localId: string,
    updater: (form: FanAuditFormState) => FanAuditFormState,
  ) => {
    setForms((prev) =>
      prev.map((form) =>
        form.localId === localId ? updateComputedValues(updater(form)) : form,
      ),
    );
  };

  const toggleEdit = (localId: string, editing: boolean) => {
    setForms((prev) =>
      prev.map((form) =>
        form.localId === localId ? { ...form, isEditing: editing } : form,
      ),
    );
  };

  const removeForm = (localId: string) => {
    setForms((prev) => prev.filter((form) => form.localId !== localId));
  };

  const handleAddMore = () => {
    setForms((prev) => [createEmptyForm(), ...prev]);
  };

  const handleCancel = (form: FanAuditFormState) => {
    if (form.isNew) {
      removeForm(form.localId);
      return;
    }

    const original = records.find((item: any) => item._id === form.id);
    if (!original) return;

    replaceForm(form.localId, auditToForm(original));
  };

  const handleDownloadFanAuditExcel = (form: FanAuditFormState) => {
    downloadFanAuditExcelTemplate(
      fanAuditFormToExcelPrefill({ ...form } as Record<string, unknown>),
    );
  };

  const handleFanAuditExcelImport = async (
    localId: string,
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const name = file.name.toLowerCase();
    if (!name.endsWith(".xlsx") && !name.endsWith(".xls")) {
      toast.error("Please choose an Excel file (.xlsx or .xls).");
      return;
    }

    setExcelImporting(true);
    try {
      const parsed = await parseFanAuditExcel(file);
      if (!Object.keys(parsed).length) {
        toast.error(
          "No recognized fields found. Use the downloaded template (2 sheets).",
        );
        return;
      }

      setForms((prev) =>
        prev.map((f) => {
          if (f.localId !== localId) return f;
          const next = { ...f, isEditing: true } as FanAuditFormState;
          const mutable = next as unknown as Record<string, unknown>;
          for (const [k, v] of Object.entries(parsed)) {
            if (v === undefined) continue;
            mutable[k] = v;
          }
          return updateComputedValues(next);
        }),
      );
      toast.success("Fan audit updated from Excel.");
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error
          ? err.message
          : "Could not read that Excel file.",
      );
    } finally {
      setExcelImporting(false);
    }
  };

  const getErrorMessage = (error: any) => {
    return (
      error?.data?.message ||
      error?.error ||
      error?.message ||
      "Something went wrong while saving fan audit record."
    );
  };

  const handleSave = async (form: FanAuditFormState) => {
    setBackendError("");

    const payload = {
      facility_id: facilityId,
      utility_account_id: utilityAccountId,

      building_block: form.building_block || undefined,
      area_location: form.area_location || undefined,
      fan_type: form.fan_type || undefined,
      make_model: form.make_model || undefined,

      rated_power_W: toNumber(form.rated_power_W),
      measured_power_W: toNumber(form.measured_power_W),
      quantity_nos: toNumber(form.quantity_nos),

      speed_control_type: form.speed_control_type || undefined,

      operating_hours_per_day: toNumber(form.operating_hours_per_day),
      operating_days_per_year: toNumber(form.operating_days_per_year),

      loading_factor_percent: toNumber(form.loading_factor_percent),
      connected_load_kW: toNumber(form.connected_load_kW),
      annual_energy_consumption_kWh: toNumber(
        form.annual_energy_consumption_kWh,
      ),

      condition: form.condition || undefined,
      remarks: form.remarks || undefined,

      audit_date: form.audit_date || undefined,
      auditor_id: form.auditor_id || undefined,

      documents: form.newDocuments.length ? form.newDocuments : undefined,
    };

    try {
      await toastHandler({
        action: async () => {
          if (form.isNew) {
            await createFanAuditRecord(payload as any).unwrap();
            return;
          }

          if (form.id) {
            await updateFanAuditRecord({
              id: form.id,
              ...payload,
            } as any).unwrap();
            return;
          }

          throw new Error("Fan audit record ID is missing.");
        },
        loading: form.isNew
          ? "Creating fan audit record..."
          : "Updating fan audit record...",
        success: form.isNew
          ? "Fan audit record created successfully"
          : "Fan audit record updated successfully",
      });

      setBackendError("");
      await refetch();
    } catch (error: any) {
      setBackendError(getErrorMessage(error));
      console.error("Failed to save fan audit record:", error);
    }
  };

  const saving = isCreating || isUpdating;

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground">
        Loading fan audit records...
      </div>
    );
  }

  const renderAutoInput = (label: string, value: string) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value} disabled className={autoInputClass} />
    </div>
  );

  return (
    <div className="relative space-y-4">
      <AuditStepSubmitBar
        utilityAccountId={utilityAccountId}
        stepId={UTILITY_AUDIT_STEP_IDS.FAN}
        auditStepLocked={auditStepLocked}
      />

      <div className="relative">
        <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-base font-medium text-foreground sm:text-lg">
          Fan Audit Records
        </h3>

        <Button
          onClick={handleAddMore}
          disabled={auditStepLocked || noDataDeclared}
          className="w-full shrink-0 sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add More
        </Button>
      </div>

      {backendError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {backendError}
        </div>
      )}

      {forms.length === 0 ? (
        <AuditNoDataEmptyState
          utilityAccountId={utilityAccountId}
          stepId={UTILITY_AUDIT_STEP_IDS.FAN}
          auditStepLocked={auditStepLocked}
          isAdmin={isAdmin}
          noDataDeclared={noDataDeclared}
        />
      ) : (
        forms.map((form, index) => (
          <Card key={form.localId}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                Fan Audit {forms.length - index}
                {form.isNew ? " (New)" : ""}
              </CardTitle>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  id={`fan-audit-excel-import-${form.localId}`}
                  type="file"
                  accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  className="hidden"
                  onChange={(e) => handleFanAuditExcelImport(form.localId, e)}
                  disabled={excelImporting}
                />

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadFanAuditExcel(form)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Excel template
                </Button>

                <Label
                  htmlFor={`fan-audit-excel-import-${form.localId}`}
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground ${
                    excelImporting ? "pointer-events-none opacity-50" : ""
                  }`}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  {excelImporting ? "Reading…" : "Import Excel"}
                </Label>

                {!form.isEditing ? (
                  <Button
                    onClick={() => toggleEdit(form.localId, true)}
                    size="sm"
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleCancel(form)}
                      size="sm"
                      disabled={saving}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                    <Button
                      onClick={() => handleSave(form)}
                      size="sm"
                      disabled={saving}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {saving ? "Saving..." : "Save"}
                    </Button>
                  </>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-8">
              <div className="rounded-xl border p-4">
                <h4 className="mb-4 text-base font-semibold text-foreground">
                  Fan Details
                </h4>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Building / Block</Label>
                    <Input
                      value={form.building_block}
                      onChange={(e) =>
                        updateForm(form.localId, (prev) => ({
                          ...prev,
                          building_block: e.target.value,
                        }))
                      }
                      disabled={!form.isEditing}
                      className={editableInputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Area / Location</Label>
                    <Input
                      value={form.area_location}
                      onChange={(e) =>
                        updateForm(form.localId, (prev) => ({
                          ...prev,
                          area_location: e.target.value,
                        }))
                      }
                      disabled={!form.isEditing}
                      className={editableInputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Fan Type</Label>
                    <select
                      value={form.fan_type}
                      onChange={(e) =>
                        updateForm(form.localId, (prev) => ({
                          ...prev,
                          fan_type: e.target
                            .value as FanAuditFormState["fan_type"],
                        }))
                      }
                      disabled={!form.isEditing}
                      className={`flex h-10 w-full rounded-md px-3 py-2 text-sm ${editableInputClass}`}
                    >
                      <option value="">Select Fan Type</option>
                      <option value="ceiling">Ceiling</option>
                      <option value="exhaust">Exhaust</option>
                      <option value="pedestal">Pedestal</option>
                      <option value="wall">Wall</option>
                      <option value="industrial">Industrial</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Make & Model</Label>
                    <Input
                      value={form.make_model}
                      onChange={(e) =>
                        updateForm(form.localId, (prev) => ({
                          ...prev,
                          make_model: e.target.value,
                        }))
                      }
                      disabled={!form.isEditing}
                      className={editableInputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Rated Power (W)</Label>
                    <Input
                      type="number"
                      value={form.rated_power_W}
                      onChange={(e) =>
                        updateForm(form.localId, (prev) => ({
                          ...prev,
                          rated_power_W: e.target.value,
                        }))
                      }
                      disabled={!form.isEditing}
                      className={editableInputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Measured Power (W)</Label>
                    <Input
                      type="number"
                      value={form.measured_power_W}
                      onChange={(e) =>
                        updateForm(form.localId, (prev) => ({
                          ...prev,
                          measured_power_W: e.target.value,
                        }))
                      }
                      disabled={!form.isEditing}
                      className={editableInputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Quantity (Nos)</Label>
                    <Input
                      type="number"
                      value={form.quantity_nos}
                      onChange={(e) =>
                        updateForm(form.localId, (prev) => ({
                          ...prev,
                          quantity_nos: e.target.value,
                        }))
                      }
                      disabled={!form.isEditing}
                      className={editableInputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Speed Control Type</Label>
                    <select
                      value={form.speed_control_type}
                      onChange={(e) =>
                        updateForm(form.localId, (prev) => ({
                          ...prev,
                          speed_control_type: e.target
                            .value as FanAuditFormState["speed_control_type"],
                        }))
                      }
                      disabled={!form.isEditing}
                      className={`flex h-10 w-full rounded-md px-3 py-2 text-sm ${editableInputClass}`}
                    >
                      <option value="">Select Speed Control</option>
                      <option value="regulator">Regulator</option>
                      <option value="electronic">Electronic</option>
                      <option value="vfd">VFD</option>
                      <option value="none">None</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Operating Hrs / Day</Label>
                    <Input
                      type="number"
                      value={form.operating_hours_per_day}
                      onChange={(e) =>
                        updateForm(form.localId, (prev) => ({
                          ...prev,
                          operating_hours_per_day: e.target.value,
                        }))
                      }
                      disabled={!form.isEditing}
                      className={editableInputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Operating Days / Year</Label>
                    <Input
                      type="number"
                      value={form.operating_days_per_year}
                      onChange={(e) =>
                        updateForm(form.localId, (prev) => ({
                          ...prev,
                          operating_days_per_year: e.target.value,
                        }))
                      }
                      disabled={!form.isEditing}
                      className={editableInputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Condition</Label>
                    <select
                      value={form.condition}
                      onChange={(e) =>
                        updateForm(form.localId, (prev) => ({
                          ...prev,
                          condition: e.target
                            .value as FanAuditFormState["condition"],
                        }))
                      }
                      disabled={!form.isEditing}
                      className={`flex h-10 w-full rounded-md px-3 py-2 text-sm ${editableInputClass}`}
                    >
                      <option value="">Select Condition</option>
                      <option value="good">Good</option>
                      <option value="old">Old</option>
                      <option value="inefficient">Inefficient</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Audit Date</Label>
                    <Input
                      type="date"
                      value={form.audit_date}
                      onChange={(e) =>
                        updateForm(form.localId, (prev) => ({
                          ...prev,
                          audit_date: e.target.value,
                        }))
                      }
                      disabled={!form.isEditing}
                      className={editableInputClass}
                    />
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <Label>Remarks</Label>
                  <Textarea
                    value={form.remarks}
                    onChange={(e) =>
                      updateForm(form.localId, (prev) => ({
                        ...prev,
                        remarks: e.target.value,
                      }))
                    }
                    disabled={!form.isEditing}
                    className={editableInputClass}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-warning/40 bg-warning/10 p-4">
                <h4 className="mb-4 text-base font-semibold text-foreground">
                  Calculation Section (Auto Formula Based)
                </h4>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {renderAutoInput(
                    "Loading Factor (%)",
                    form.loading_factor_percent,
                  )}
                  {renderAutoInput(
                    "Connected Load (kW)",
                    form.connected_load_kW,
                  )}
                  {renderAutoInput(
                    "Annual Energy Consumption (kWh)",
                    form.annual_energy_consumption_kWh,
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-base">Documents</Label>

                {canViewDocuments && form.existingDocuments.length > 0 && (
                  <div className="space-y-2">
                    <Label>Uploaded Documents</Label>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      {form.existingDocuments.map((doc, idx) => (
                        <a
                          key={idx}
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 text-sm hover:bg-muted/50"
                        >
                          {doc.fileType === "pdf" ? (
                            <FileText className="h-4 w-4 text-destructive" />
                          ) : (
                            <ImageIcon className="h-4 w-4 text-primary" />
                          )}
                          <span className="truncate">
                            {doc.fileName || `Document ${idx + 1}`}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {!canViewDocuments && (
                  <p className="text-sm text-muted-foreground">
                    Existing documents are visible to admin users only.
                  </p>
                )}

                <div className="space-y-2">
                  <Label>Add New Documents</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="file"
                      multiple
                      accept="image/*,.pdf"
                      disabled={!form.isEditing}
                      className={editableInputClass}
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        updateForm(form.localId, (prev) => ({
                          ...prev,
                          newDocuments: [...prev.newDocuments, ...files],
                        }));
                        e.target.value = "";
                      }}
                    />
                    <Upload className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                {form.newDocuments.length > 0 && (
                  <div className="space-y-2">
                    <Label>Pending Upload</Label>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      {form.newDocuments.map((file, idx) => (
                        <div
                          key={`${file.name}-${idx}`}
                          className="flex items-center justify-between rounded-lg border border-border bg-card p-3 text-sm"
                        >
                          <div className="min-w-0 flex items-center gap-3">
                            {file.type === "application/pdf" ? (
                              <FileText className="h-4 w-4 shrink-0 text-destructive" />
                            ) : (
                              <ImageIcon className="h-4 w-4 shrink-0 text-primary" />
                            )}
                            <span className="truncate">{file.name}</span>
                          </div>

                          {form.isEditing && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                updateForm(form.localId, (prev) => ({
                                  ...prev,
                                  newDocuments: prev.newDocuments.filter(
                                    (_, i) => i !== idx,
                                  ),
                                }))
                              }
                            >
                              <Trash2 className="h-4 w-4" />
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
        </div>
        {auditStepLocked ? <AuditStepLockedOverlay /> : null}
      </div>
    </div>
  );
}

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
  useCreateLightingAuditMutation,
  useGetLightingAuditsQuery,
  useUpdateLightingAuditMutation,
} from "@/store/slices/lightingAuditApiSlice";
import {
  downloadLightingAuditExcelTemplate,
  lightingAuditFormToExcelPrefill,
  parseLightingAuditExcel,
} from "@/lib/lighting-audit-record-excel";
import { toastHandler } from "@/lib/toast";
import { toast } from "sonner";
import { useAppSelector } from "@/store/hooks";
import { UTILITY_AUDIT_STEP_IDS } from "@/lib/utility-audit-steps";
import { AuditStepSubmitBar } from "@/components/utility-audit/audit-step-submit-bar";
import { AuditStepLockedOverlay } from "@/components/utility-audit/audit-step-locked-overlay";
import { AuditNoDataEmptyState } from "@/components/utility-audit/audit-no-data-empty-state";
import type { AuditStepNoDataEntry } from "@/store/slices/utilityApiSlice";

interface LightingAuditSectionProps {
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

type LightingAuditFormState = {
  id?: string;
  localId: string;
  isNew: boolean;
  isEditing: boolean;

  facility_id: string;
  utility_account_id: string;

  area_location: string;
  fixture_type:
    | ""
    | "tube_light"
    | "bulb"
    | "led_panel"
    | "flood_light"
    | "street_light"
    | "other";
  lamp_type:
    | ""
    | "LED"
    | "CFL"
    | "fluorescent"
    | "halogen"
    | "incandescent"
    | "other";
  wattage_W: string;
  quantity_nos: string;
  control_type: "" | "manual" | "sensor" | "timer" | "bms" | "other";
  working_hours_per_day: string;
  working_days_per_year: string;
  connected_load_kW: string;
  annual_energy_kWh: string;
  remarks: string;

  existingDocuments: ExistingDocument[];
  newDocuments: File[];
};
const editableInputClass =
  "border-input bg-background text-foreground focus:border-primary focus:ring-1 focus:ring-primary";

const autoInputClass =
  "cursor-not-allowed border border-dashed border-border bg-muted text-muted-foreground";

const getInputClass = (disabled: boolean) =>
  disabled ? autoInputClass : editableInputClass;

const toDateInput = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
};

const toStringValue = (value: unknown) =>
  value === undefined || value === null ? "" : String(value);

const toNumber = (value: string) => {
  if (!value || value.trim() === "") return undefined;
  const num = Number(value);
  return Number.isNaN(num) ? undefined : num;
};

const computeLightingValues = (form: LightingAuditFormState) => {
  const wattage = Number(form.wattage_W);
  const quantity = Number(form.quantity_nos);
  const hoursPerDay = Number(form.working_hours_per_day);
  const daysPerYear = Number(form.working_days_per_year);

  let connectedLoad = "";
  let annualEnergy = "";

  if (!Number.isNaN(wattage) && !Number.isNaN(quantity)) {
    connectedLoad = String(Number(((wattage * quantity) / 1000).toFixed(2)));
  }

  if (
    !Number.isNaN(wattage) &&
    !Number.isNaN(quantity) &&
    !Number.isNaN(hoursPerDay) &&
    !Number.isNaN(daysPerYear)
  ) {
    annualEnergy = String(
      Number(
        (((wattage * quantity) / 1000) * hoursPerDay * daysPerYear).toFixed(2),
      ),
    );
  }

  return {
    ...form,
    connected_load_kW: connectedLoad,
    annual_energy_kWh: annualEnergy,
  };
};

const createEmptyForm = (
  facilityId: string,
  utilityAccountId: string,
): LightingAuditFormState =>
  computeLightingValues({
    localId: `new-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    isNew: true,
    isEditing: true,

    facility_id: facilityId,
    utility_account_id: utilityAccountId,

    area_location: "",
    fixture_type: "",
    lamp_type: "",
    wattage_W: "",
    quantity_nos: "",
    control_type: "",
    working_hours_per_day: "",
    working_days_per_year: "",
    connected_load_kW: "",
    annual_energy_kWh: "",
    remarks: "",

    existingDocuments: [],
    newDocuments: [],
  });

const auditToForm = (record: any): LightingAuditFormState =>
  computeLightingValues({
    id: record._id,
    localId: record._id,
    isNew: false,
    isEditing: false,

    facility_id: record.facility_id?._id || record.facility_id || "",
    utility_account_id:
      record.utility_account_id?._id || record.utility_account_id || "",

    area_location: record.area_location || "",
    fixture_type: record.fixture_type || "",
    lamp_type: record.lamp_type || "",
    wattage_W: toStringValue(record.wattage_W),
    quantity_nos: toStringValue(record.quantity_nos),
    control_type: record.control_type || "",
    working_hours_per_day: toStringValue(record.working_hours_per_day),
    working_days_per_year: toStringValue(record.working_days_per_year),
    connected_load_kW: toStringValue(record.connected_load_kW),
    annual_energy_kWh: toStringValue(record.annual_energy_kWh),
    remarks: record.remarks || "",

    existingDocuments: record.documents || [],
    newDocuments: [],
  });

export function LightingAuditSection({
  facilityId,
  utilityAccountId,
  auditStepLocked = false,
  auditStepNoData,
}: LightingAuditSectionProps) {
  const user = useAppSelector((state) => state.auth.user);
  const canViewDocuments = user?.role === "admin";
  const isAdmin = user?.role === "admin";
  const noDataDeclared = Boolean(
    auditStepNoData?.[UTILITY_AUDIT_STEP_IDS.LIGHTING]?.declared_at,
  );
  const { data, isLoading, refetch } = useGetLightingAuditsQuery({
    facility_id: facilityId,
    utility_account_id: utilityAccountId,
  });

  const [createLightingAudit, { isLoading: isCreating }] =
    useCreateLightingAuditMutation();

  const [updateLightingAudit, { isLoading: isUpdating }] =
    useUpdateLightingAuditMutation();

  const lightingAudits = useMemo(() => data?.data || [], [data]);
  const [forms, setForms] = useState<LightingAuditFormState[]>([]);
  const [excelImporting, setExcelImporting] = useState(false);
  const [backendError, setBackendError] = useState("");

  useEffect(() => {
    const mapped = lightingAudits.map(auditToForm);

    setForms((prev) => {
      const unsavedForms = prev.filter((item) => item.isNew);
      return [...unsavedForms, ...mapped];
    });
  }, [lightingAudits]);

  const updateForm = (
    localId: string,
    updater: (form: LightingAuditFormState) => LightingAuditFormState,
  ) => {
    setForms((prev) =>
      prev.map((form) =>
        form.localId === localId ? computeLightingValues(updater(form)) : form,
      ),
    );
  };

  const replaceForm = (localId: string, nextForm: LightingAuditFormState) => {
    setForms((prev) =>
      prev.map((form) => (form.localId === localId ? nextForm : form)),
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
    setForms((prev) => [
      createEmptyForm(facilityId, utilityAccountId),
      ...prev,
    ]);
  };

  const handleCancel = (form: LightingAuditFormState) => {
    if (form.isNew) {
      removeForm(form.localId);
      return;
    }

    const original = lightingAudits.find((item: any) => item._id === form.id);
    if (!original) return;

    replaceForm(form.localId, auditToForm(original));
  };

  const handleDownloadLightingAuditExcel = (form: LightingAuditFormState) => {
    downloadLightingAuditExcelTemplate(
      lightingAuditFormToExcelPrefill({ ...form } as Record<string, unknown>),
    );
  };

  const handleLightingAuditExcelImport = async (
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
      const parsed = await parseLightingAuditExcel(file);
      if (!Object.keys(parsed).length) {
        toast.error(
          "No recognized fields found. Use the downloaded template (2 sheets).",
        );
        return;
      }

      setForms((prev) =>
        prev.map((f) => {
          if (f.localId !== localId) return f;
          const next = { ...f, isEditing: true } as LightingAuditFormState;
          const mutable = next as unknown as Record<string, unknown>;
          for (const [k, v] of Object.entries(parsed)) {
            if (v === undefined) continue;
            mutable[k] = v;
          }
          return computeLightingValues(next);
        }),
      );
      toast.success("Lighting audit updated from Excel.");
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

  const getErrorMessage = (error: any) =>
    error?.data?.message ||
    error?.error ||
    error?.message ||
    "Something went wrong while saving lighting audit.";

  const handleSave = async (form: LightingAuditFormState) => {
    setBackendError("");

    const payload = {
      facility_id: facilityId,
      utility_account_id: utilityAccountId,
      area_location: form.area_location || undefined,
      fixture_type: form.fixture_type || undefined,
      lamp_type: form.lamp_type || undefined,
      wattage_W: toNumber(form.wattage_W),
      quantity_nos: toNumber(form.quantity_nos),
      control_type: form.control_type || undefined,
      working_hours_per_day: toNumber(form.working_hours_per_day),
      working_days_per_year: toNumber(form.working_days_per_year),
      connected_load_kW: toNumber(form.connected_load_kW),
      annual_energy_kWh: toNumber(form.annual_energy_kWh),
      remarks: form.remarks || undefined,
      documents: form.newDocuments.length ? form.newDocuments : undefined,
    };

    try {
      await toastHandler({
        action: () => {
          if (form.isNew) {
            return createLightingAudit(payload as any).unwrap();
          }

          if (form.id) {
            return updateLightingAudit({
              id: form.id,
              ...payload,
            } as any).unwrap();
          }

          return Promise.reject(new Error("Lighting audit ID is missing."));
        },
        loading: form.isNew
          ? "Creating lighting audit..."
          : "Updating lighting audit...",
        success: form.isNew
          ? "Lighting audit created successfully"
          : "Lighting audit updated successfully",
      });

      setBackendError("");
      await refetch();
    } catch (error: any) {
      const message = getErrorMessage(error);
      setBackendError(message);
      console.error("Failed to save lighting audit:", error);
    }
  };

  const saving = isCreating || isUpdating;

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground">
        Loading lighting audits...
      </div>
    );
  }

  return (
    <div className="relative space-y-4">
      <AuditStepSubmitBar
        utilityAccountId={utilityAccountId}
        stepId={UTILITY_AUDIT_STEP_IDS.LIGHTING}
        auditStepLocked={auditStepLocked}
      />

      <div className="relative">
        <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-base font-medium text-foreground sm:text-lg">
          Lighting Audit Records
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
          stepId={UTILITY_AUDIT_STEP_IDS.LIGHTING}
          auditStepLocked={auditStepLocked}
          isAdmin={isAdmin}
          noDataDeclared={noDataDeclared}
        />
      ) : (
        forms.map((form, index) => (
          <Card key={form.localId}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                Lighting Audit {forms.length - index}
                {form.isNew ? " (New)" : ""}
              </CardTitle>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  id={`lighting-audit-excel-import-${form.localId}`}
                  type="file"
                  accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  className="hidden"
                  onChange={(e) =>
                    handleLightingAuditExcelImport(form.localId, e)
                  }
                  disabled={excelImporting}
                />

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadLightingAuditExcel(form)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Excel template
                </Button>

                <Label
                  htmlFor={`lighting-audit-excel-import-${form.localId}`}
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
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                    className={getInputClass(!form.isEditing)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Fixture Type</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.fixture_type}
                    onChange={(e) =>
                      updateForm(form.localId, (prev) => ({
                        ...prev,
                        fixture_type: e.target
                          .value as LightingAuditFormState["fixture_type"],
                      }))
                    }
                    disabled={!form.isEditing}
                  >
                    <option value="">Select fixture type</option>
                    <option value="tube_light">Tube Light</option>
                    <option value="bulb">Bulb</option>
                    <option value="led_panel">LED Panel</option>
                    <option value="flood_light">Flood Light</option>
                    <option value="street_light">Street Light</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Lamp Type</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.lamp_type}
                    onChange={(e) =>
                      updateForm(form.localId, (prev) => ({
                        ...prev,
                        lamp_type: e.target
                          .value as LightingAuditFormState["lamp_type"],
                      }))
                    }
                    disabled={!form.isEditing}
                  >
                    <option value="">Select lamp type</option>
                    <option value="LED">LED</option>
                    <option value="CFL">CFL</option>
                    <option value="fluorescent">Fluorescent</option>
                    <option value="halogen">Halogen</option>
                    <option value="incandescent">Incandescent</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Control Type</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.control_type}
                    onChange={(e) =>
                      updateForm(form.localId, (prev) => ({
                        ...prev,
                        control_type: e.target
                          .value as LightingAuditFormState["control_type"],
                      }))
                    }
                    disabled={!form.isEditing}
                  >
                    <option value="">Select control type</option>
                    <option value="manual">Manual</option>
                    <option value="sensor">Sensor</option>
                    <option value="timer">Timer</option>
                    <option value="bms">BMS</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Wattage (W)</Label>
                  <Input
                    type="number"
                    value={form.wattage_W}
                    onChange={(e) =>
                      updateForm(form.localId, (prev) => ({
                        ...prev,
                        wattage_W: e.target.value,
                      }))
                    }
                    disabled={!form.isEditing}
                    className={getInputClass(!form.isEditing)}
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
                    className={getInputClass(!form.isEditing)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Working Hours / Day</Label>
                  <Input
                    type="number"
                    value={form.working_hours_per_day}
                    onChange={(e) =>
                      updateForm(form.localId, (prev) => ({
                        ...prev,
                        working_hours_per_day: e.target.value,
                      }))
                    }
                    disabled={!form.isEditing}
                    className={getInputClass(!form.isEditing)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Working Days / Year</Label>
                  <Input
                    type="number"
                    value={form.working_days_per_year}
                    onChange={(e) =>
                      updateForm(form.localId, (prev) => ({
                        ...prev,
                        working_days_per_year: e.target.value,
                      }))
                    }
                    disabled={!form.isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Connected Load (kW)</Label>
                  <Input
                    value={form.connected_load_kW}
                    disabled
                    className={getInputClass(!form.isEditing)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Annual Energy (kWh)</Label>
                  <Input
                    value={form.annual_energy_kWh}
                    disabled
                    className={getInputClass(!form.isEditing)}
                  />
                </div>
              </div>

              <div className="space-y-2">
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
                  className={getInputClass(!form.isEditing)}
                />
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
                          className="flex items-center gap-3 rounded-lg border p-3 text-sm hover:bg-muted/50"
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
                          className="flex items-center justify-between rounded-lg border p-3 text-sm"
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

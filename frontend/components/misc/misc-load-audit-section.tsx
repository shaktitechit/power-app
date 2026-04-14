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
  useCreateMiscLoadAuditMutation,
  useGetMiscLoadAuditsQuery,
  useUpdateMiscLoadAuditMutation,
} from "@/store/slices/miscLoadAuditApiSlice";
import {
  downloadMiscLoadAuditExcelTemplate,
  miscLoadAuditFormToExcelPrefill,
  parseMiscLoadAuditExcel,
} from "@/lib/misc-load-audit-excel";
import { toastHandler } from "@/lib/toast";
import { toast } from "sonner";
import { useAppSelector } from "@/store/hooks";
import { UTILITY_AUDIT_STEP_IDS } from "@/lib/utility-audit-steps";
import { AuditStepSubmitBar } from "@/components/utility-audit/audit-step-submit-bar";
import { AuditStepLockedOverlay } from "@/components/utility-audit/audit-step-locked-overlay";
import { AuditNoDataEmptyState } from "@/components/utility-audit/audit-no-data-empty-state";
import type { AuditStepNoDataEntry } from "@/store/slices/utilityApiSlice";

interface MiscLoadAuditSectionProps {
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

type MiscLoadAuditFormState = {
  id?: string;
  localId: string;
  isNew: boolean;
  isEditing: boolean;

  facility_id: string;
  utility_account_id: string;

  equipment_name: string;
  category: string;
  location_department: string;

  quantity: string;
  rated_power_kW: string;
  average_operating_hours_per_day: string;
  operating_days_per_year: string;
  load_factor_percent: string;
  estimated_annual_energy_kWh: string;

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

const computeMiscLoadValues = (form: MiscLoadAuditFormState) => {
  const quantity = Number(form.quantity);
  const ratedPower = Number(form.rated_power_kW);
  const avgHours = Number(form.average_operating_hours_per_day);
  const operatingDays = Number(form.operating_days_per_year);
  const loadFactorPercent = Number(form.load_factor_percent);

  const validQuantity = Number.isNaN(quantity) ? 0 : quantity;
  const validRatedPower = Number.isNaN(ratedPower) ? 0 : ratedPower;
  const validAvgHours = Number.isNaN(avgHours) ? 0 : avgHours;
  const validOperatingDays = Number.isNaN(operatingDays) ? 0 : operatingDays;
  const validLoadFactorPercent = Number.isNaN(loadFactorPercent)
    ? 100
    : loadFactorPercent;

  const estimatedAnnualEnergy =
    validQuantity *
    validRatedPower *
    validAvgHours *
    validOperatingDays *
    (validLoadFactorPercent / 100);

  return {
    ...form,
    estimated_annual_energy_kWh:
      estimatedAnnualEnergy > 0
        ? String(Number(estimatedAnnualEnergy.toFixed(2)))
        : "",
  };
};

const createEmptyForm = (
  facilityId: string,
  utilityAccountId: string,
): MiscLoadAuditFormState =>
  computeMiscLoadValues({
    localId: `new-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    isNew: true,
    isEditing: true,

    facility_id: facilityId,
    utility_account_id: utilityAccountId,

    equipment_name: "",
    category: "",
    location_department: "",

    quantity: "",
    rated_power_kW: "",
    average_operating_hours_per_day: "",
    operating_days_per_year: "",
    load_factor_percent: "100",
    estimated_annual_energy_kWh: "",

    existingDocuments: [],
    newDocuments: [],
  });

const miscLoadAuditToForm = (record: any): MiscLoadAuditFormState =>
  computeMiscLoadValues({
    id: record._id,
    localId: record._id,
    isNew: false,
    isEditing: false,

    facility_id: record.facility_id?._id || record.facility_id || "",
    utility_account_id:
      record.utility_account_id?._id || record.utility_account_id || "",

    equipment_name: record.equipment_name || "",
    category: record.category || "",
    location_department: record.location_department || "",

    quantity: toStringValue(record.quantity),
    rated_power_kW: toStringValue(record.rated_power_kW),
    average_operating_hours_per_day: toStringValue(
      record.average_operating_hours_per_day,
    ),
    operating_days_per_year: toStringValue(record.operating_days_per_year),
    load_factor_percent: toStringValue(record.load_factor_percent),
    estimated_annual_energy_kWh: toStringValue(
      record.estimated_annual_energy_kWh,
    ),

    existingDocuments: record.documents || [],
    newDocuments: [],
  });

export function MiscLoadAuditSection({
  facilityId,
  utilityAccountId,
  auditStepLocked = false,
  auditStepNoData,
}: MiscLoadAuditSectionProps) {
  const user = useAppSelector((state) => state.auth.user);
  const canViewDocuments = user?.role === "admin";
  const isAdmin = user?.role === "admin";
  const noDataDeclared = Boolean(
    auditStepNoData?.[UTILITY_AUDIT_STEP_IDS.MISC]?.declared_at,
  );
  const { data, isLoading, refetch } = useGetMiscLoadAuditsQuery({
    facility_id: facilityId,
    utility_account_id: utilityAccountId,
  });

  const [createMiscLoadAudit, { isLoading: isCreating }] =
    useCreateMiscLoadAuditMutation();

  const [updateMiscLoadAudit, { isLoading: isUpdating }] =
    useUpdateMiscLoadAuditMutation();

  const miscLoadAudits = useMemo(() => data?.data || [], [data]);
  const [forms, setForms] = useState<MiscLoadAuditFormState[]>([]);
  const [excelImporting, setExcelImporting] = useState(false);
  const [backendError, setBackendError] = useState("");

  useEffect(() => {
    const mapped = miscLoadAudits.map(miscLoadAuditToForm);

    setForms((prev) => {
      const unsavedForms = prev.filter((item) => item.isNew);
      return [...unsavedForms, ...mapped];
    });
  }, [miscLoadAudits]);

  const updateForm = (
    localId: string,
    updater: (form: MiscLoadAuditFormState) => MiscLoadAuditFormState,
  ) => {
    setForms((prev) =>
      prev.map((form) =>
        form.localId === localId ? computeMiscLoadValues(updater(form)) : form,
      ),
    );
  };

  const replaceForm = (localId: string, nextForm: MiscLoadAuditFormState) => {
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

  const handleCancel = (form: MiscLoadAuditFormState) => {
    if (form.isNew) {
      removeForm(form.localId);
      return;
    }

    const original = miscLoadAudits.find((item: any) => item._id === form.id);
    if (!original) return;

    replaceForm(form.localId, miscLoadAuditToForm(original));
  };

  const handleDownloadMiscLoadAuditExcel = (form: MiscLoadAuditFormState) => {
    downloadMiscLoadAuditExcelTemplate(
      miscLoadAuditFormToExcelPrefill({ ...form } as Record<string, unknown>),
    );
  };

  const handleMiscLoadAuditExcelImport = async (
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
      const parsed = await parseMiscLoadAuditExcel(file);
      if (!Object.keys(parsed).length) {
        toast.error(
          "No recognized fields found. Use the downloaded template (2 sheets).",
        );
        return;
      }

      setForms((prev) =>
        prev.map((f) => {
          if (f.localId !== localId) return f;
          const next = { ...f, isEditing: true } as MiscLoadAuditFormState;
          const mutable = next as unknown as Record<string, unknown>;
          for (const [k, v] of Object.entries(parsed)) {
            if (v === undefined) continue;
            mutable[k] = v;
          }
          return computeMiscLoadValues(next);
        }),
      );
      toast.success("Misc load audit updated from Excel.");
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
    "Something went wrong while saving misc load audit record.";

  const handleSave = async (form: MiscLoadAuditFormState) => {
    setBackendError("");

    const payload = {
      facility_id: facilityId,
      utility_account_id: utilityAccountId,
      equipment_name: form.equipment_name || undefined,
      category: form.category || undefined,
      location_department: form.location_department || undefined,
      quantity: toNumber(form.quantity),
      rated_power_kW: toNumber(form.rated_power_kW),
      average_operating_hours_per_day: toNumber(
        form.average_operating_hours_per_day,
      ),
      operating_days_per_year: toNumber(form.operating_days_per_year),
      load_factor_percent: toNumber(form.load_factor_percent),
      estimated_annual_energy_kWh: toNumber(form.estimated_annual_energy_kWh),
      documents: form.newDocuments.length ? form.newDocuments : undefined,
    };

    try {
      await toastHandler({
        action: () => {
          if (form.isNew) {
            return createMiscLoadAudit(payload as any).unwrap();
          }

          if (form.id) {
            return updateMiscLoadAudit({
              id: form.id,
              ...payload,
            } as any).unwrap();
          }

          return Promise.reject(
            new Error("Misc load audit record ID is missing."),
          );
        },
        loading: form.isNew
          ? "Creating misc load audit record..."
          : "Updating misc load audit record...",
        success: form.isNew
          ? "Misc load audit record created successfully"
          : "Misc load audit record updated successfully",
      });

      setBackendError("");
      await refetch();
    } catch (error: any) {
      const message = getErrorMessage(error);
      setBackendError(message);
      console.error("Failed to save misc load audit record:", error);
    }
  };

  const saving = isCreating || isUpdating;

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground">
        Loading misc load audit records...
      </div>
    );
  }

  return (
    <div className="relative space-y-4">
      <AuditStepSubmitBar
        utilityAccountId={utilityAccountId}
        stepId={UTILITY_AUDIT_STEP_IDS.MISC}
        auditStepLocked={auditStepLocked}
      />

      <div className="relative">
        <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-base font-medium text-foreground sm:text-lg">
          Misc Load Audit Records
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
          stepId={UTILITY_AUDIT_STEP_IDS.MISC}
          auditStepLocked={auditStepLocked}
          isAdmin={isAdmin}
          noDataDeclared={noDataDeclared}
        />
      ) : (
        forms.map((form, index) => (
          <Card key={form.localId}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                Misc Load Audit {forms.length - index}
                {form.isNew ? " (New)" : ""}
              </CardTitle>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  id={`misc-load-audit-excel-import-${form.localId}`}
                  type="file"
                  accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  className="hidden"
                  onChange={(e) =>
                    handleMiscLoadAuditExcelImport(form.localId, e)
                  }
                  disabled={excelImporting}
                />

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadMiscLoadAuditExcel(form)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Excel template
                </Button>

                <Label
                  htmlFor={`misc-load-audit-excel-import-${form.localId}`}
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
                  <Label>Equipment Name</Label>
                  <Input
                    value={form.equipment_name}
                    onChange={(e) =>
                      updateForm(form.localId, (prev) => ({
                        ...prev,
                        equipment_name: e.target.value,
                      }))
                    }
                    disabled={!form.isEditing}
                    className={getInputClass(!form.isEditing)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input
                    value={form.category}
                    onChange={(e) =>
                      updateForm(form.localId, (prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    disabled={!form.isEditing}
                    className={getInputClass(!form.isEditing)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Location / Department</Label>
                  <Input
                    value={form.location_department}
                    onChange={(e) =>
                      updateForm(form.localId, (prev) => ({
                        ...prev,
                        location_department: e.target.value,
                      }))
                    }
                    disabled={!form.isEditing}
                    className={getInputClass(!form.isEditing)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    value={form.quantity}
                    onChange={(e) =>
                      updateForm(form.localId, (prev) => ({
                        ...prev,
                        quantity: e.target.value,
                      }))
                    }
                    disabled={!form.isEditing}
                    className={getInputClass(!form.isEditing)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Rated Power (kW)</Label>
                  <Input
                    type="number"
                    value={form.rated_power_kW}
                    onChange={(e) =>
                      updateForm(form.localId, (prev) => ({
                        ...prev,
                        rated_power_kW: e.target.value,
                      }))
                    }
                    disabled={!form.isEditing}
                    className={getInputClass(!form.isEditing)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Average Operating Hours / Day</Label>
                  <Input
                    type="number"
                    value={form.average_operating_hours_per_day}
                    onChange={(e) =>
                      updateForm(form.localId, (prev) => ({
                        ...prev,
                        average_operating_hours_per_day: e.target.value,
                      }))
                    }
                    disabled={!form.isEditing}
                    className={getInputClass(!form.isEditing)}
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
                    className={getInputClass(!form.isEditing)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Load Factor (%)</Label>
                  <Input
                    type="number"
                    value={form.load_factor_percent}
                    onChange={(e) =>
                      updateForm(form.localId, (prev) => ({
                        ...prev,
                        load_factor_percent: e.target.value,
                      }))
                    }
                    disabled={!form.isEditing}
                    className={getInputClass(!form.isEditing)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Estimated Annual Energy (kWh)</Label>
                  <Input
                    value={form.estimated_annual_energy_kWh}
                    disabled
                    className={getInputClass(!form.isEditing)}
                  />
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

              <div className="space-y-2">
                <Label>Remarks / Notes</Label>
                <Textarea
                  value=""
                  readOnly
                  placeholder="No remarks field in misc load audit schema"
                  disabled
                  className={getInputClass(!form.isEditing)}
                />
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

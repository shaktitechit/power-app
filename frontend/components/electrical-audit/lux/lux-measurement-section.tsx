"use client";

import {
  canManageResource,
  canViewDocuments,
  type UserPermission,
} from "@/lib/authRoles";
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
  useCreateLuxMeasurementMutation,
  useDeleteLuxMeasurementMutation,
  useGetLuxMeasurementsQuery,
  useUpdateLuxMeasurementMutation,
} from "@/store/slices/electrical-audit/luxMeasurementApiSlice";
import {
  downloadLuxMeasurementExcelTemplate,
  luxComplianceExcelToBoolean,
  luxMeasurementFormToExcelPrefill,
  parseLuxMeasurementExcel,
} from "@/lib/electrical-audit/lux-measurement-excel";
import { toastHandler } from "@/lib/toast";
import { toast } from "sonner";
import { useAppSelector } from "@/store/hooks";
import { UTILITY_AUDIT_STEP_IDS } from "@/lib/electrical-audit/utility-audit-steps";
import { AuditStepSubmitBar } from "@/components/electrical-audit/utility-audit/audit-step-submit-bar";
import {
  AUDIT_DOC_NEW_FILENAME_SPAN,
  AUDIT_DOC_ROW_ACTION_BTN,
  AUDIT_DOC_ROW_COMFORTABLE,
  AUDIT_DOC_ROW_LEFT_CLUSTER,
} from "@/components/electrical-audit/audit-document-layout";
import { AuditNoDataEmptyState } from "@/components/electrical-audit/utility-audit/audit-no-data-empty-state";
import { cnHideUtilityAuditEdits } from "@/lib/electrical-audit/utility-audit-edits-visibility";
import { cn } from "@/lib/utils";
import type { AuditStepNoDataEntry } from "@/store/slices/electrical-audit/utilityApiSlice";
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

interface LuxMeasurementSectionProps {
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

type LuxMeasurementFormState = {
  id?: string;
  localId: string;
  isNew: boolean;
  isEditing: boolean;

  facility_id: string;
  utility_account_id: string;

  area_location: string;
  room_type:
    | ""
    | "office"
    | "corridor"
    | "warehouse"
    | "hospital"
    | "classroom"
    | "outdoor"
    | "other";

  required_lux: string;
  measured_lux_point_1: string;
  measured_lux_point_2: string;
  measured_lux_point_3: string;
  average_lux: string;
  compliance: boolean | undefined;
  remarks: string;

  existingDocuments: ExistingDocument[];
  newDocuments: File[];
};

const editableInputClass =
  "border-input bg-background text-foreground focus:border-primary focus:ring-1 focus:ring-primary";

const autoInputClass =
  "cursor-not-allowed border border-dashed border-sky-300 bg-sky-100 text-sky-900 opacity-100 dark:border-sky-700 dark:bg-sky-950/60 dark:text-sky-100";

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

const computeLuxValues = (form: LuxMeasurementFormState) => {
  const p1 = Number(form.measured_lux_point_1);
  const p2 = Number(form.measured_lux_point_2);
  const p3 = Number(form.measured_lux_point_3);
  const requiredLux = Number(form.required_lux);

  const validPoints = [p1, p2, p3].filter((value) => !Number.isNaN(value));

  let averageLux = "";
  let compliance: boolean | undefined = undefined;

  if (validPoints.length > 0) {
    averageLux = String(
      Number(
        (
          validPoints.reduce((sum, value) => sum + value, 0) /
          validPoints.length
        ).toFixed(2),
      ),
    );
  }

  if (!Number.isNaN(requiredLux) && averageLux !== "") {
    compliance = Number(averageLux) >= requiredLux;
  }

  return {
    ...form,
    average_lux: averageLux,
    compliance,
  };
};

const createEmptyForm = (
  facilityId: string,
  utilityAccountId: string,
): LuxMeasurementFormState =>
  computeLuxValues({
    localId: `new-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    isNew: true,
    isEditing: true,

    facility_id: facilityId,
    utility_account_id: utilityAccountId,

    area_location: "",
    room_type: "",
    required_lux: "",
    measured_lux_point_1: "",
    measured_lux_point_2: "",
    measured_lux_point_3: "",
    average_lux: "",
    compliance: undefined,
    remarks: "",

    existingDocuments: [],
    newDocuments: [],
  });

const luxToForm = (record: any): LuxMeasurementFormState =>
  computeLuxValues({
    id: record._id,
    localId: record._id,
    isNew: false,
    isEditing: false,

    facility_id: record.facility_id?._id || record.facility_id || "",
    utility_account_id:
      record.utility_account_id?._id || record.utility_account_id || "",

    area_location: record.area_location || "",
    room_type: record.room_type || "",
    required_lux: toStringValue(record.required_lux),
    measured_lux_point_1: toStringValue(record.measured_lux_point_1),
    measured_lux_point_2: toStringValue(record.measured_lux_point_2),
    measured_lux_point_3: toStringValue(record.measured_lux_point_3),
    average_lux: toStringValue(record.average_lux),
    compliance:
      typeof record.compliance === "boolean" ? record.compliance : undefined,
    remarks: record.remarks || "",

    existingDocuments: record.documents || [],
    newDocuments: [],
  });

export function LuxMeasurementSection({
  facilityId,
  utilityAccountId,
  auditStepLocked = false,
  auditStepNoData,
}: LuxMeasurementSectionProps) {
  const user = useAppSelector((state) => state.auth.user);
  const canDeleteRecords =
    user?.role === "super_admin" || user?.role === "admin";
  const canViewDocumentsFlag = canViewDocuments(
    user?.role,
    (user?.permissions as UserPermission[]) || [],
  );
  const isAdmin = canManageResource(
    user?.role,
    (user?.permissions as UserPermission[]) || [],
    "utility_audit_flow",
    "clear_no_data",
  );
  const noDataDeclared = Boolean(
    auditStepNoData?.[UTILITY_AUDIT_STEP_IDS.LUX]?.declared_at,
  );
  const { data, isLoading, refetch } = useGetLuxMeasurementsQuery({
    facility_id: facilityId,
    utility_account_id: utilityAccountId,
  });

  const [createLuxMeasurement, { isLoading: isCreating }] =
    useCreateLuxMeasurementMutation();

  const [updateLuxMeasurement, { isLoading: isUpdating }] =
    useUpdateLuxMeasurementMutation();
  const [deleteLuxMeasurement, { isLoading: isDeleting }] =
    useDeleteLuxMeasurementMutation();

  const luxMeasurements = useMemo(() => data?.data || [], [data]);
  const [forms, setForms] = useState<LuxMeasurementFormState[]>([]);

  useEffect(() => {
    if (!auditStepLocked) return;
    setForms((prev) => prev.map((f) => ({ ...f, isEditing: false })));
  }, [auditStepLocked]);

  const [excelImporting, setExcelImporting] = useState(false);
  const [backendError, setBackendError] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LuxMeasurementFormState | null>(
    null,
  );

  useEffect(() => {
    const mapped = luxMeasurements.map(luxToForm);

    setForms((prev) => {
      const unsavedForms = prev.filter((item) => item.isNew);
      return [...unsavedForms, ...mapped];
    });
  }, [luxMeasurements]);

  const updateForm = (
    localId: string,
    updater: (form: LuxMeasurementFormState) => LuxMeasurementFormState,
  ) => {
    setForms((prev) =>
      prev.map((form) =>
        form.localId === localId ? computeLuxValues(updater(form)) : form,
      ),
    );
  };

  const replaceForm = (localId: string, nextForm: LuxMeasurementFormState) => {
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

  const handleCancel = (form: LuxMeasurementFormState) => {
    if (form.isNew) {
      removeForm(form.localId);
      return;
    }

    const original = luxMeasurements.find((item: any) => item._id === form.id);
    if (!original) return;

    replaceForm(form.localId, luxToForm(original));
  };

  const handleDownloadLuxMeasurementExcel = (form: LuxMeasurementFormState) => {
    downloadLuxMeasurementExcelTemplate(
      luxMeasurementFormToExcelPrefill({ ...form } as Record<string, unknown>),
    );
  };

  const handleLuxMeasurementExcelImport = async (
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
      const parsed = await parseLuxMeasurementExcel(file);
      if (!Object.keys(parsed).length) {
        toast.error(
          "No recognized fields found. Use the downloaded template (2 sheets).",
        );
        return;
      }

      setForms((prev) =>
        prev.map((f) => {
          if (f.localId !== localId) return f;
          const next = { ...f, isEditing: true } as LuxMeasurementFormState;
          const mutable = next as unknown as Record<string, unknown>;
          for (const [k, v] of Object.entries(parsed)) {
            if (v === undefined) continue;
            if (k === "compliance") {
              next.compliance = luxComplianceExcelToBoolean(v);
              continue;
            }
            mutable[k] = v;
          }
          return computeLuxValues(next);
        }),
      );
      toast.success("Lux measurement updated from Excel.");
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
    "Something went wrong while saving lux measurement.";

  const handleSave = async (form: LuxMeasurementFormState) => {
    setBackendError("");

    const payload = {
      facility_id: facilityId,
      utility_account_id: utilityAccountId,
      area_location: form.area_location || undefined,
      room_type: form.room_type || undefined,
      required_lux: toNumber(form.required_lux),
      measured_lux_point_1: toNumber(form.measured_lux_point_1),
      measured_lux_point_2: toNumber(form.measured_lux_point_2),
      measured_lux_point_3: toNumber(form.measured_lux_point_3),
      average_lux: toNumber(form.average_lux),
      compliance: form.compliance,
      remarks: form.remarks || undefined,
      documents: form.newDocuments.length ? form.newDocuments : undefined,
    };

    try {
      await toastHandler({
        action: () => {
          if (form.isNew) {
            return createLuxMeasurement(payload as any).unwrap();
          }

          if (form.id) {
            return updateLuxMeasurement({
              id: form.id,
              ...payload,
            } as any).unwrap();
          }

          return Promise.reject(new Error("Lux measurement ID is missing."));
        },
        loading: form.isNew
          ? "Creating lux measurement..."
          : "Updating lux measurement...",
        success: form.isNew
          ? "Lux measurement created successfully"
          : "Lux measurement updated successfully",
      });

      setBackendError("");
      await refetch();
    } catch (error: any) {
      const message = getErrorMessage(error);
      setBackendError(message);
      console.error("Failed to save lux measurement:", error);
    }
  };

  const handleDelete = (form: LuxMeasurementFormState) => {
    if (!form.id || !canDeleteRecords) return;
    setDeleteTarget(form);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget?.id || !canDeleteRecords) return;
    try {
      await toastHandler({
        action: () => deleteLuxMeasurement(deleteTarget.id as string).unwrap(),
        loading: "Deleting lux measurement...",
        success: "Lux measurement deleted successfully",
      });
      await refetch();
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error("Failed to delete lux measurement record:", error);
    }
  };

  const saving = isCreating || isUpdating || isDeleting;

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground">
        Loading lux measurements...
      </div>
    );
  }

  return (
    <div className="relative space-y-4">
      <AuditStepSubmitBar
        utilityAccountId={utilityAccountId}
        stepId={UTILITY_AUDIT_STEP_IDS.LUX}
        auditStepLocked={auditStepLocked}
      />

      <div className="relative">
        <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-base font-medium text-foreground sm:text-lg">
          Lux Measurements
        </h3>

        <Button
          onClick={handleAddMore}
          className={cnHideUtilityAuditEdits(
            auditStepLocked || noDataDeclared,
            "w-full shrink-0 sm:w-auto",
          )}
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
          stepId={UTILITY_AUDIT_STEP_IDS.LUX}
          auditStepLocked={auditStepLocked}
          isAdmin={isAdmin}
          noDataDeclared={noDataDeclared}
        />
      ) : (
        forms.map((form, index) => (
          <Card key={form.localId}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                Lux Measurement {forms.length - index}
                {form.isNew ? " (New)" : ""}
              </CardTitle>

              <div
                className={cnHideUtilityAuditEdits(
                  auditStepLocked,
                  "flex flex-wrap items-center gap-2",
                )}
              >
                <input
                  id={`lux-measurement-excel-import-${form.localId}`}
                  type="file"
                  accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  className="hidden"
                  onChange={(e) =>
                    handleLuxMeasurementExcelImport(form.localId, e)
                  }
                  disabled={excelImporting}
                />

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadLuxMeasurementExcel(form)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Excel template
                </Button>

                <Label
                  htmlFor={`lux-measurement-excel-import-${form.localId}`}
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground ${
                    excelImporting ? "pointer-events-none opacity-50" : ""
                  }`}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  {excelImporting ? "Reading…" : "Import Excel"}
                </Label>

                {!form.isEditing ? (
                  <>
                    <Button
                      onClick={() => toggleEdit(form.localId, true)}
                      size="sm"
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    {canDeleteRecords && form.id ? (
                      <Button
                        variant="destructive"
                        onClick={() => handleDelete(form)}
                        size="sm"
                        disabled={saving}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    ) : null}
                  </>
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
                  <Label>Room Type</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.room_type}
                    onChange={(e) =>
                      updateForm(form.localId, (prev) => ({
                        ...prev,
                        room_type: e.target
                          .value as LuxMeasurementFormState["room_type"],
                      }))
                    }
                    disabled={!form.isEditing}
                  >
                    <option value="">Select room type</option>
                    <option value="office">Office</option>
                    <option value="corridor">Corridor</option>
                    <option value="warehouse">Warehouse</option>
                    <option value="hospital">Hospital</option>
                    <option value="classroom">Classroom</option>
                    <option value="outdoor">Outdoor</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Required Lux</Label>
                  <Input
                    type="number"
                    value={form.required_lux}
                    onChange={(e) =>
                      updateForm(form.localId, (prev) => ({
                        ...prev,
                        required_lux: e.target.value,
                      }))
                    }
                    disabled={!form.isEditing}
                    className={getInputClass(!form.isEditing)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Measured Lux Point 1</Label>
                  <Input
                    type="number"
                    value={form.measured_lux_point_1}
                    onChange={(e) =>
                      updateForm(form.localId, (prev) => ({
                        ...prev,
                        measured_lux_point_1: e.target.value,
                      }))
                    }
                    disabled={!form.isEditing}
                    className={getInputClass(!form.isEditing)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Measured Lux Point 2</Label>
                  <Input
                    type="number"
                    value={form.measured_lux_point_2}
                    onChange={(e) =>
                      updateForm(form.localId, (prev) => ({
                        ...prev,
                        measured_lux_point_2: e.target.value,
                      }))
                    }
                    disabled={!form.isEditing}
                    className={getInputClass(!form.isEditing)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Measured Lux Point 3</Label>
                  <Input
                    type="number"
                    value={form.measured_lux_point_3}
                    onChange={(e) =>
                      updateForm(form.localId, (prev) => ({
                        ...prev,
                        measured_lux_point_3: e.target.value,
                      }))
                    }
                    disabled={!form.isEditing}
                    className={getInputClass(!form.isEditing)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Average Lux</Label>
                  <Input
                    value={form.average_lux}
                    disabled
                    className={autoInputClass}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Compliance</Label>
                  <Input
                    value={
                      form.compliance === undefined
                        ? ""
                        : form.compliance
                          ? "Compliant"
                          : "Non-compliant"
                    }
                    disabled
                    className={autoInputClass}
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

            {canViewDocumentsFlag && form.existingDocuments.length > 0 && (
                  <div className="space-y-2">
                    <Label>Uploaded Documents</Label>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      {form.existingDocuments.map((doc, idx) => (
                        <a
                          key={idx}
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          title={doc.fileName || `Document ${idx + 1}`}
                          className={cn(
                            AUDIT_DOC_ROW_COMFORTABLE,
                            "cursor-pointer text-sm hover:bg-muted/50",
                          )}
                        >
                          <div className={AUDIT_DOC_ROW_LEFT_CLUSTER}>
                            {doc.fileType === "pdf" ? (
                              <FileText className="h-4 w-4 shrink-0 text-destructive" />
                            ) : (
                              <ImageIcon className="h-4 w-4 shrink-0 text-primary" />
                            )}
                            <span
                              className={cn(
                                AUDIT_DOC_NEW_FILENAME_SPAN,
                                "text-primary",
                              )}
                            >
                              {doc.fileName || `Document ${idx + 1}`}
                            </span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
            {!canViewDocumentsFlag && (
                  <p className="text-sm text-muted-foreground">
                    Only super admin, admin, and manager can view uploaded documents.
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
                          className={AUDIT_DOC_ROW_COMFORTABLE}
                        >
                          <div className={AUDIT_DOC_ROW_LEFT_CLUSTER}>
                            {file.type === "application/pdf" ? (
                              <FileText className="h-4 w-4 shrink-0 text-destructive" />
                            ) : (
                              <ImageIcon className="h-4 w-4 shrink-0 text-primary" />
                            )}
                            <span
                              title={file.name}
                              className={AUDIT_DOC_NEW_FILENAME_SPAN}
                            >
                              {file.name}
                            </span>
                          </div>

                          {form.isEditing && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className={AUDIT_DOC_ROW_ACTION_BTN}
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
      </div>
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete lux measurement?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. It will permanently delete this lux measurement record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleConfirmDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

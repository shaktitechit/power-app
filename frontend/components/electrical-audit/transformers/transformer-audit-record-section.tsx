"use client";

import { canViewDocuments, type UserPermission } from "@/lib/authRoles";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { toSameOriginFileManagementUrl } from "@/lib/fileManagementUrls";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Pencil,
  Save,
  X,
  Upload,
  FileText,
  ImageIcon,
  Download,
  FileSpreadsheet,
  Trash2,
} from "lucide-react";
import {
  useCreateTransformerAuditRecordMutation,
  useDeleteTransformerAuditRecordMutation,
  useGetTransformerAuditRecordsQuery,
  useUpdateTransformerAuditRecordMutation,
} from "@/store/slices/electrical-audit/transformerAuditRecordApiSlice";
import { useGetUtilityBillingRecordsQuery } from "@/store/slices/electrical-audit/utilityBillingRecordApiSlice";
import { calculateGridCostPerKVAHForOneYear } from "@/lib/electrical-audit/calculateGridCostPerKVAHForOneYear";
import {
  downloadTransformerAuditTemplate,
  parseTransformerAuditExcel,
  type TransformerAuditExcelFormState,
} from "@/lib/electrical-audit/transformer-audit-record-excel";
import { useGetTransformerByIdQuery } from "@/store/slices/electrical-audit/transformerApiSlice";
import { toastHandler } from "@/lib/toast";
import { toast } from "sonner";
import { useAppSelector } from "@/store/hooks";
import { cnHideUtilityAuditEdits } from "@/lib/electrical-audit/utility-audit-edits-visibility";
import {
  AUDIT_DOCUMENTS_PANEL_CLASS,
  AUDIT_DOC_LINK_INLINE,
  AUDIT_DOC_NEW_FILENAME_SPAN,
  AUDIT_DOC_ROW_ACTION_BTN,
  AUDIT_DOC_ROW_DENSE,
  AUDIT_DOC_ROW_LEFT_CLUSTER,
} from "@/components/electrical-audit/audit-document-layout";

interface TransformerAuditRecordSectionProps {
  facilityId: string;
  utilityAccountId: string;
  transformerId: string;
  auditStepLocked?: boolean;
  hideAuditSubmitChrome?: boolean;
}

type ExistingDocument = {
  fileUrl: string;
  fileType: "image" | "pdf";
  fileName?: string;
  uploadedAt?: string;
};

type TransformerAuditFormState = {
  id?: string;
  isNew: boolean;
  isEditing: boolean;

  total_losses_kW: string;
  average_load_kVA: string;
  percent_loading: string;
  max_load_kVA: string;
  load_factor_percent: string;

  operating_hours_per_year: string;
  annual_energy_supplied_kWh: string;
  annual_energy_losses_kWh: string;

  per_unit_cost_rs: string;
  cost_of_losses_rs: string;

  power_factor_LT: string;
  harmonics_THD_percent: string;

  neutral_earth_resistance_ohms: string;
  body_to_earth_resistance_ohms: string;

  silica_gel_cobalt_type: "" | "good" | "moderate" | "poor";
  silica_gel_non_cobalt_type: "" | "good" | "moderate" | "poor";
  oil_level: "" | "low" | "normal" | "high";

  line_voltage_Vr: string;
  line_voltage_Vy: string;
  line_voltage_Vb: string;

  phase_voltage_Vr_n: string;
  phase_voltage_Vy_n: string;
  phase_voltage_Vb_n: string;

  line_current_Ir: string;
  line_current_Iy: string;
  line_current_Ib: string;

  audit_date: string;

  documents: File[];
  existingDocuments: ExistingDocument[];
};

function toDateInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
}

const editableInputClass =
  "border-input bg-background text-foreground focus:border-primary focus:ring-1 focus:ring-primary";

const autoInputClass =
  "cursor-not-allowed border border-dashed border-sky-300 bg-sky-100 text-sky-900 opacity-100 dark:border-sky-700 dark:bg-sky-950/60 dark:text-sky-100";

const getInputClass = (disabled: boolean) =>
  disabled ? autoInputClass : editableInputClass;

const createEmptyForm = (): TransformerAuditFormState => ({
  isNew: true,
  isEditing: true,

  total_losses_kW: "",
  average_load_kVA: "",
  percent_loading: "",
  max_load_kVA: "",
  load_factor_percent: "",

  operating_hours_per_year: "",
  annual_energy_supplied_kWh: "",
  annual_energy_losses_kWh: "",

  per_unit_cost_rs: "",
  cost_of_losses_rs: "",

  power_factor_LT: "",
  harmonics_THD_percent: "",

  neutral_earth_resistance_ohms: "",
  body_to_earth_resistance_ohms: "",

  silica_gel_cobalt_type: "",
  silica_gel_non_cobalt_type: "",
  oil_level: "",

  line_voltage_Vr: "",
  line_voltage_Vy: "",
  line_voltage_Vb: "",

  phase_voltage_Vr_n: "",
  phase_voltage_Vy_n: "",
  phase_voltage_Vb_n: "",

  line_current_Ir: "",
  line_current_Iy: "",
  line_current_Ib: "",

  audit_date: "",

  documents: [],
  existingDocuments: [],
});

function recordToForm(record: any): TransformerAuditFormState {
  return {
    id: record._id,
    isNew: false,
    isEditing: false,

    total_losses_kW: record.total_losses_kW?.toString() || "",
    average_load_kVA: record.average_load_kVA?.toString() || "",
    percent_loading: record.percent_loading?.toString() || "",
    max_load_kVA: record.max_load_kVA?.toString() || "",
    load_factor_percent: record.load_factor_percent?.toString() || "",

    operating_hours_per_year: record.operating_hours_per_year?.toString() || "",
    annual_energy_supplied_kWh:
      record.annual_energy_supplied_kWh?.toString() || "",
    annual_energy_losses_kWh: record.annual_energy_losses_kWh?.toString() || "",

    per_unit_cost_rs: record.per_unit_cost_rs?.toString() || "",
    cost_of_losses_rs: record.cost_of_losses_rs?.toString() || "",

    power_factor_LT: record.power_factor_LT?.toString() || "",
    harmonics_THD_percent: record.harmonics_THD_percent?.toString() || "",

    neutral_earth_resistance_ohms:
      record.neutral_earth_resistance_ohms?.toString() || "",
    body_to_earth_resistance_ohms:
      record.body_to_earth_resistance_ohms?.toString() || "",

    silica_gel_cobalt_type: record.silica_gel_cobalt_type || "",
    silica_gel_non_cobalt_type: record.silica_gel_non_cobalt_type || "",
    oil_level: record.oil_level || "",

    line_voltage_Vr: record.line_voltage_Vr?.toString() || "",
    line_voltage_Vy: record.line_voltage_Vy?.toString() || "",
    line_voltage_Vb: record.line_voltage_Vb?.toString() || "",

    phase_voltage_Vr_n: record.phase_voltage_Vr_n?.toString() || "",
    phase_voltage_Vy_n: record.phase_voltage_Vy_n?.toString() || "",
    phase_voltage_Vb_n: record.phase_voltage_Vb_n?.toString() || "",

    line_current_Ir: record.line_current_Ir?.toString() || "",
    line_current_Iy: record.line_current_Iy?.toString() || "",
    line_current_Ib: record.line_current_Ib?.toString() || "",

    audit_date: toDateInput(record.audit_date),

    documents: [],
    existingDocuments: record.documents || [],
  };
}

const toNumber = (value: string | number | undefined | null) => {
  if (value === "" || value === undefined || value === null) return 0;
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const formatAuto = (value: number, decimals = 2) => {
  if (!Number.isFinite(value)) return "";
  return value.toFixed(decimals);
};

export function TransformerAuditRecordSection({
  facilityId,
  utilityAccountId,
  transformerId,
  auditStepLocked = false,
  hideAuditSubmitChrome = false,
}: TransformerAuditRecordSectionProps) {
  const user = useAppSelector((state) => state.auth.user);
  const canViewDocumentsFlag = canViewDocuments(
    user?.role,
    (user?.permissions as UserPermission[]) || [],
  );
  const canDeleteRecords = user?.role === "super_admin" || user?.role === "admin";
  const { data, isLoading, refetch } = useGetTransformerAuditRecordsQuery({
    facility_id: facilityId,
    utility_account_id: utilityAccountId,
    transformer_id: transformerId,
  });

  const { data: transformerResponse } =
    useGetTransformerByIdQuery(transformerId);

  const { data: billingResponse } = useGetUtilityBillingRecordsQuery({
    utility_account_id: utilityAccountId,
  });

  const gridCostSummary = useMemo(() => {
    return calculateGridCostPerKVAHForOneYear(billingResponse?.data || []);
  }, [billingResponse]);

  const [createTransformerAuditRecord, { isLoading: isCreating }] =
    useCreateTransformerAuditRecordMutation();

  const [updateTransformerAuditRecord, { isLoading: isUpdating }] =
    useUpdateTransformerAuditRecordMutation();
  const [deleteTransformerAuditRecord, { isLoading: isDeleting }] =
    useDeleteTransformerAuditRecordMutation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const records = useMemo(() => data?.data || [], [data]);
  const transformer = transformerResponse?.data;

  const latestRecord = useMemo(() => {
    if (!records.length) return null;

    return [...records].sort((a: any, b: any) => {
      const aTime = new Date(
        a.audit_date || a.created_at || a.createdAt || 0,
      ).getTime();
      const bTime = new Date(
        b.audit_date || b.created_at || b.createdAt || 0,
      ).getTime();
      return bTime - aTime;
    })[0];
  }, [records]);

  const [form, setForm] =
    useState<TransformerAuditFormState>(createEmptyForm());
  const [excelImporting, setExcelImporting] = useState(false);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  useEffect(() => {
    if (!auditStepLocked) return;
    setForm((prev) => ({ ...prev, isEditing: false }));
  }, [auditStepLocked]);

  useEffect(() => {
    if (latestRecord) {
      setForm(recordToForm(latestRecord));
    } else {
      setForm(createEmptyForm());
    }
  }, [latestRecord]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      per_unit_cost_rs:
        gridCostSummary?.gridCostPerKVAH !== undefined &&
        gridCostSummary?.gridCostPerKVAH !== null
          ? String(gridCostSummary.gridCostPerKVAH)
          : prev.per_unit_cost_rs,
    }));

    setFromDate(toDateInput(gridCostSummary?.fromDate));
    setToDate(toDateInput(gridCostSummary?.toDate));
  }, [gridCostSummary]);

  const calculatedValues = useMemo(() => {
    const noLoadLoss = toNumber(transformer?.no_load_loss_kW);
    const fullLoadLoss = toNumber(transformer?.full_load_loss_kW);
    const ratedCapacity = toNumber(transformer?.rated_capacity_kVA);

    const averageLoad = toNumber(form.average_load_kVA);
    const maxLoad = toNumber(form.max_load_kVA);
    const operatingHours = toNumber(form.operating_hours_per_year);
    const perUnitCost = toNumber(form.per_unit_cost_rs);

    // Total losses at full load = no load loss + full load loss
    const totalLosses = noLoadLoss + fullLoadLoss;

    // % loading = (average load / rated capacity) * 100
    const percentLoading =
      ratedCapacity > 0 ? (averageLoad / ratedCapacity) * 100 : 0;

    // load factor = (average load / maximum load) * 100
    const loadFactor = maxLoad > 0 ? (averageLoad / maxLoad) * 100 : 0;

    // annual energy loss = (no load loss + full load loss * (%loading/100)) * operating hours
    const annualEnergyLosses =
      (noLoadLoss + fullLoadLoss * (percentLoading / 100)) * operatingHours;

    // cost of losses = per unit cost * annual energy losses
    const costOfLosses = perUnitCost * annualEnergyLosses;

    return {
      totalLosses,
      percentLoading,
      loadFactor,
      annualEnergyLosses,
      costOfLosses,
      noLoadLoss,
      fullLoadLoss,
      ratedCapacity,
    };
  }, [
    transformer?.no_load_loss_kW,
    transformer?.full_load_loss_kW,
    transformer?.rated_capacity_kVA,
    form.average_load_kVA,
    form.max_load_kVA,
    form.operating_hours_per_year,
    form.per_unit_cost_rs,
  ]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      total_losses_kW: formatAuto(calculatedValues.totalLosses),
      percent_loading: formatAuto(calculatedValues.percentLoading),
      load_factor_percent: formatAuto(calculatedValues.loadFactor),
      annual_energy_losses_kWh: formatAuto(calculatedValues.annualEnergyLosses),
      cost_of_losses_rs: formatAuto(calculatedValues.costOfLosses),
    }));
  }, [calculatedValues]);

  const updateForm = (key: keyof TransformerAuditFormState, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleDownloadTransformerAuditExcelTemplate = () => {
    const rowPrefill: Partial<
      Record<keyof TransformerAuditExcelFormState, string>
    > = {
      average_load_kVA: form.average_load_kVA,
      max_load_kVA: form.max_load_kVA,
      operating_hours_per_year: form.operating_hours_per_year,
      annual_energy_supplied_kWh: form.annual_energy_supplied_kWh,
      per_unit_cost_rs: form.per_unit_cost_rs,
      power_factor_LT: form.power_factor_LT,
      harmonics_THD_percent: form.harmonics_THD_percent,
      neutral_earth_resistance_ohms: form.neutral_earth_resistance_ohms,
      body_to_earth_resistance_ohms: form.body_to_earth_resistance_ohms,
      silica_gel_cobalt_type: form.silica_gel_cobalt_type,
      silica_gel_non_cobalt_type: form.silica_gel_non_cobalt_type,
      oil_level: form.oil_level,
      line_voltage_Vr: form.line_voltage_Vr,
      line_voltage_Vy: form.line_voltage_Vy,
      line_voltage_Vb: form.line_voltage_Vb,
      phase_voltage_Vr_n: form.phase_voltage_Vr_n,
      phase_voltage_Vy_n: form.phase_voltage_Vy_n,
      phase_voltage_Vb_n: form.phase_voltage_Vb_n,
      line_current_Ir: form.line_current_Ir,
      line_current_Iy: form.line_current_Iy,
      line_current_Ib: form.line_current_Ib,
      audit_date: form.audit_date,
    };
    downloadTransformerAuditTemplate({ rowPrefill });
  };

  const handleTransformerAuditExcelFileChange = async (
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
      const parsed = await parseTransformerAuditExcel(file);
      if (!Object.keys(parsed).length) {
        toast.error("No recognized fields found. Use the downloaded template.");
        return;
      }

      setForm((prev) => {
        const next: TransformerAuditFormState = { ...prev, isEditing: true };
        const mutable = next as unknown as Record<string, unknown>;
        for (const [k, v] of Object.entries(parsed)) {
          if (v === undefined) continue;
          mutable[k] = v;
        }
        return next;
      });
      toast.success("Form filled from Excel.");
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

  const handleCancel = () => {
    if (latestRecord) {
      setForm(recordToForm(latestRecord));
    } else {
      setForm(createEmptyForm());
    }
  };

  const handleDocumentsChange = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files);

    setForm((prev) => ({
      ...prev,
      documents: [...prev.documents, ...newFiles],
    }));
  };

  const removeNewDocument = (index: number) => {
    setForm((prev) => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    const payload = {
      transformer_id: transformerId,
      utility_account_id: utilityAccountId,
      facility_id: facilityId,

      total_losses_kW: form.total_losses_kW || undefined,
      average_load_kVA: form.average_load_kVA || undefined,
      percent_loading: form.percent_loading || undefined,
      max_load_kVA: form.max_load_kVA || undefined,
      load_factor_percent: form.load_factor_percent || undefined,

      operating_hours_per_year: form.operating_hours_per_year || undefined,
      annual_energy_supplied_kWh: form.annual_energy_supplied_kWh || undefined,
      annual_energy_losses_kWh: form.annual_energy_losses_kWh || undefined,

      per_unit_cost_rs: form.per_unit_cost_rs || undefined,
      cost_of_losses_rs: form.cost_of_losses_rs || undefined,

      power_factor_LT: form.power_factor_LT || undefined,
      harmonics_THD_percent: form.harmonics_THD_percent || undefined,

      neutral_earth_resistance_ohms:
        form.neutral_earth_resistance_ohms || undefined,
      body_to_earth_resistance_ohms:
        form.body_to_earth_resistance_ohms || undefined,

      silica_gel_cobalt_type: form.silica_gel_cobalt_type || undefined,
      silica_gel_non_cobalt_type: form.silica_gel_non_cobalt_type || undefined,
      oil_level: form.oil_level || undefined,

      line_voltage_Vr: form.line_voltage_Vr || undefined,
      line_voltage_Vy: form.line_voltage_Vy || undefined,
      line_voltage_Vb: form.line_voltage_Vb || undefined,

      phase_voltage_Vr_n: form.phase_voltage_Vr_n || undefined,
      phase_voltage_Vy_n: form.phase_voltage_Vy_n || undefined,
      phase_voltage_Vb_n: form.phase_voltage_Vb_n || undefined,

      line_current_Ir: form.line_current_Ir || undefined,
      line_current_Iy: form.line_current_Iy || undefined,
      line_current_Ib: form.line_current_Ib || undefined,

      audit_date: form.audit_date || undefined,

      documents: form.documents.length ? form.documents : undefined,
    };

    try {
      await toastHandler({
        action: () => {
          if (form.isNew) {
            return createTransformerAuditRecord(payload).unwrap();
          }

          if (form.id) {
            return updateTransformerAuditRecord({
              id: form.id,
              ...payload,
            }).unwrap();
          }

          return Promise.reject(
            new Error("Transformer audit record ID is missing."),
          );
        },
        loading: form.isNew
          ? "Creating transformer audit record..."
          : "Updating transformer audit record...",
        success: form.isNew
          ? "Transformer audit record created successfully"
          : "Transformer audit record updated successfully",
      });

      await refetch();
    } catch (error: any) {
      console.error("Failed to save transformer audit record:", error);
    }
  };

  const handleConfirmDelete = async () => {
    if (!form.id || !canDeleteRecords) return;
    try {
      await deleteTransformerAuditRecord(form.id).unwrap();
      setDeleteDialogOpen(false);
      await refetch();
    } catch (error) {
      console.error("Failed to delete transformer audit record:", error);
    }
  };

  const saving = isCreating || isUpdating || isDeleting;

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground">
        Loading transformer audit record...
      </div>
    );
  }

  return (
    <div className="relative space-y-4">
      <div className="relative">
        <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-foreground">
          Transformer Audit Record
        </h3>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            {form.isNew
              ? "Create Transformer Audit Record"
              : "Transformer Audit Record"}
          </CardTitle>

          <div
            className={cnHideUtilityAuditEdits(
              auditStepLocked,
              "flex flex-wrap items-center gap-2",
            )}
          >
            <input
              id="transformer-audit-excel-import"
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              className="hidden"
              onChange={handleTransformerAuditExcelFileChange}
              disabled={excelImporting}
            />

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadTransformerAuditExcelTemplate}
            >
              <Download className="mr-2 h-4 w-4" />
              Excel template
            </Button>

            <Label
              htmlFor="transformer-audit-excel-import"
              className={`inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground ${
                excelImporting ? "pointer-events-none opacity-50" : ""
              }`}
            >
              <FileSpreadsheet className="h-4 w-4" />
              {excelImporting ? "Reading…" : "Import Excel"}
            </Label>

            {canDeleteRecords && form.id ? (
              <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
                size="sm"
                disabled={saving}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            ) : null}
            {!form.isEditing ? (
              <Button
                onClick={() =>
                  setForm((prev) => ({ ...prev, isEditing: true }))
                }
                size="sm"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  size="sm"
                  disabled={saving}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button onClick={handleSave} size="sm" disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : "Save"}
                </Button>
              </>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="rounded-xl border p-4">
            <h4 className="mb-4 text-base font-semibold text-foreground">
              Performance & Losses
            </h4>

            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>No Load Loss from Nameplate (kW)</Label>
                <Input
                  type="number"
                  value={formatAuto(calculatedValues.noLoadLoss)}
                  disabled
                  className={autoInputClass}
                />
              </div>

              <div className="space-y-2">
                <Label>Full Load Loss from Nameplate (kW)</Label>
                <Input
                  type="number"
                  value={formatAuto(calculatedValues.fullLoadLoss)}
                  disabled
                  className={autoInputClass}
                />
              </div>

              <div className="space-y-2">
                <Label>Rated Capacity from Nameplate (kVA)</Label>
                <Input
                  type="number"
                  value={formatAuto(calculatedValues.ratedCapacity)}
                  disabled
                  className={autoInputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Total Losses at Full Load (kW)</Label>
                <Input
                  type="number"
                  value={form.total_losses_kW}
                  disabled
                  className={autoInputClass}
                />
              </div>

              <div className="space-y-2">
                <Label>Average Load Measured (kVA)</Label>
                <Input
                  type="number"
                  value={form.average_load_kVA}
                  onChange={(e) =>
                    updateForm("average_load_kVA", e.target.value)
                  }
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
              </div>

              <div className="space-y-2">
                <Label>% Loading</Label>
                <Input
                  type="number"
                  value={form.percent_loading}
                  disabled
                  className={autoInputClass}
                />
              </div>

              <div className="space-y-2">
                <Label>Maximum Load (kVA)</Label>
                <Input
                  type="number"
                  value={form.max_load_kVA}
                  onChange={(e) => updateForm("max_load_kVA", e.target.value)}
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
              </div>

              <div className="space-y-2">
                <Label>Load Factor (%)</Label>
                <Input
                  type="number"
                  value={form.load_factor_percent}
                  disabled
                  className={autoInputClass}
                />
              </div>

              <div className="space-y-2">
                <Label>Operating Hours / Year</Label>
                <Input
                  type="number"
                  value={form.operating_hours_per_year}
                  onChange={(e) =>
                    updateForm("operating_hours_per_year", e.target.value)
                  }
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
              </div>

              <div className="space-y-2">
                <Label>Annual Energy Supplied (kWh)</Label>
                <Input
                  type="number"
                  value={form.annual_energy_supplied_kWh}
                  onChange={(e) =>
                    updateForm("annual_energy_supplied_kWh", e.target.value)
                  }
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
              </div>

              <div className="space-y-2">
                <Label>Annual Energy Losses (kWh)</Label>
                <Input
                  type="number"
                  value={form.annual_energy_losses_kWh}
                  disabled
                  className={autoInputClass}
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Per Unit Cost (Rs)
                  {fromDate && toDate ? ` (${fromDate} to ${toDate})` : ""}
                </Label>
                <Input
                  type="number"
                  value={form.per_unit_cost_rs}
                  onChange={(e) =>
                    updateForm("per_unit_cost_rs", e.target.value)
                  }
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
              </div>

              <div className="space-y-2">
                <Label>Cost of Losses (Rs)</Label>
                <Input
                  type="number"
                  value={form.cost_of_losses_rs}
                  disabled
                  className={autoInputClass}
                />
              </div>

              <div className="space-y-2">
                <Label>Audit Date</Label>
                <Input
                  type="date"
                  value={form.audit_date}
                  onChange={(e) => updateForm("audit_date", e.target.value)}
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <h4 className="mb-4 text-base font-semibold text-foreground">
              Electrical Quality
            </h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Power Factor LT</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.power_factor_LT}
                  onChange={(e) =>
                    updateForm("power_factor_LT", e.target.value)
                  }
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
              </div>

              <div className="space-y-2">
                <Label>Harmonics THD (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.harmonics_THD_percent}
                  onChange={(e) =>
                    updateForm("harmonics_THD_percent", e.target.value)
                  }
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <h4 className="mb-4 text-base font-semibold text-foreground">
              Safety & Earthing
            </h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Neutral to Earth Resistance (Ohms)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.neutral_earth_resistance_ohms}
                  onChange={(e) =>
                    updateForm("neutral_earth_resistance_ohms", e.target.value)
                  }
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
              </div>

              <div className="space-y-2">
                <Label>Body to Earth Resistance (Ohms)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.body_to_earth_resistance_ohms}
                  onChange={(e) =>
                    updateForm("body_to_earth_resistance_ohms", e.target.value)
                  }
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <h4 className="mb-4 text-base font-semibold text-foreground">
              Maintenance Indicators
            </h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Silica Gel Cobalt Type</Label>
                <select
                  value={form.silica_gel_cobalt_type}
                  onChange={(e) =>
                    updateForm("silica_gel_cobalt_type", e.target.value)
                  }
                  disabled={!form.isEditing}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select condition</option>
                  <option value="good">Good</option>
                  <option value="moderate">Moderate</option>
                  <option value="poor">Poor</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Silica Gel Non-Cobalt Type</Label>
                <select
                  value={form.silica_gel_non_cobalt_type}
                  onChange={(e) =>
                    updateForm("silica_gel_non_cobalt_type", e.target.value)
                  }
                  disabled={!form.isEditing}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select condition</option>
                  <option value="good">Good</option>
                  <option value="moderate">Moderate</option>
                  <option value="poor">Poor</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Oil Level</Label>
                <select
                  value={form.oil_level}
                  onChange={(e) => updateForm("oil_level", e.target.value)}
                  disabled={!form.isEditing}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select oil level</option>
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <h4 className="mb-4 text-base font-semibold text-foreground">
              Voltage Measurements
            </h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Line Voltage Vr</Label>
                <Input
                  type="number"
                  value={form.line_voltage_Vr}
                  onChange={(e) =>
                    updateForm("line_voltage_Vr", e.target.value)
                  }
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
              </div>

              <div className="space-y-2">
                <Label>Line Voltage Vy</Label>
                <Input
                  type="number"
                  value={form.line_voltage_Vy}
                  onChange={(e) =>
                    updateForm("line_voltage_Vy", e.target.value)
                  }
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
              </div>

              <div className="space-y-2">
                <Label>Line Voltage Vb</Label>
                <Input
                  type="number"
                  value={form.line_voltage_Vb}
                  onChange={(e) =>
                    updateForm("line_voltage_Vb", e.target.value)
                  }
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
              </div>

              <div className="space-y-2">
                <Label>Phase Voltage Vr-N</Label>
                <Input
                  type="number"
                  value={form.phase_voltage_Vr_n}
                  onChange={(e) =>
                    updateForm("phase_voltage_Vr_n", e.target.value)
                  }
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
              </div>

              <div className="space-y-2">
                <Label>Phase Voltage Vy-N</Label>
                <Input
                  type="number"
                  value={form.phase_voltage_Vy_n}
                  onChange={(e) =>
                    updateForm("phase_voltage_Vy_n", e.target.value)
                  }
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
              </div>

              <div className="space-y-2">
                <Label>Phase Voltage Vb-N</Label>
                <Input
                  type="number"
                  value={form.phase_voltage_Vb_n}
                  onChange={(e) =>
                    updateForm("phase_voltage_Vb_n", e.target.value)
                  }
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <h4 className="mb-4 text-base font-semibold text-foreground">
              Current Measurements
            </h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Line Current Ir</Label>
                <Input
                  type="number"
                  value={form.line_current_Ir}
                  onChange={(e) =>
                    updateForm("line_current_Ir", e.target.value)
                  }
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
              </div>

              <div className="space-y-2">
                <Label>Line Current Iy</Label>
                <Input
                  type="number"
                  value={form.line_current_Iy}
                  onChange={(e) =>
                    updateForm("line_current_Iy", e.target.value)
                  }
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
              </div>

              <div className="space-y-2">
                <Label>Line Current Ib</Label>
                <Input
                  type="number"
                  value={form.line_current_Ib}
                  onChange={(e) =>
                    updateForm("line_current_Ib", e.target.value)
                  }
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
              </div>
            </div>
          </div>

          <div className={AUDIT_DOCUMENTS_PANEL_CLASS}>
            <h4 className="mb-4 text-base font-semibold text-foreground">
              Documents
            </h4>

            <div className="space-y-2">
              <Label>Upload Documents</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  multiple
                  accept=".pdf,image/*"
                  onChange={(e) => handleDocumentsChange(e.target.files)}
                  disabled={!form.isEditing}
                />
                <Upload className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            {canViewDocumentsFlag && form.existingDocuments.length > 0 && (
              <div className="mt-4 space-y-2">
                <Label>Existing Documents</Label>
                <div className="space-y-2">
                  {form.existingDocuments.map((doc, docIndex) => (
                    <div
                      key={`${doc.fileUrl}-${docIndex}`}
                      className={AUDIT_DOC_ROW_DENSE}
                    >
                      <div className={AUDIT_DOC_ROW_LEFT_CLUSTER}>
                        {doc.fileType === "pdf" ? (
                          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                        ) : (
                          <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                        <a
                          href={toSameOriginFileManagementUrl(doc.fileUrl)}
                          target="_blank"
                          rel="noreferrer"
                          title={
                            doc.fileName || `Document ${docIndex + 1}`
                          }
                          className={AUDIT_DOC_LINK_INLINE}
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
                Only super admin, admin, and manager can view uploaded documents.
              </p>
            )}

            {form.documents.length > 0 && (
              <div className="mt-4 space-y-2">
                <Label>New Selected Documents</Label>
                <div className="space-y-2">
                  {form.documents.map((file, fileIndex) => (
                    <div
                      key={`${file.name}-${fileIndex}`}
                      className={AUDIT_DOC_ROW_DENSE}
                    >
                      <div className={AUDIT_DOC_ROW_LEFT_CLUSTER}>
                        {file.type === "application/pdf" ? (
                          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                        ) : (
                          <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
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
                          variant="outline"
                          size="sm"
                          className={AUDIT_DOC_ROW_ACTION_BTN}
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
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete transformer audit record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the current transformer audit record.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                void handleConfirmDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
        </div>
      </div>
    </div>
  );
}

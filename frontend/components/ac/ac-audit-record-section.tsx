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
  useCreateACAuditRecordMutation,
  useGetACAuditRecordsQuery,
  useUpdateACAuditRecordMutation,
} from "@/store/slices/acAuditRecordApiSlice";
import {
  acAuditFormToExcelPrefill,
  downloadACAuditExcelTemplate,
  parseACAuditExcel,
} from "@/lib/ac-audit-record-excel";
import { toastHandler } from "@/lib/toast";
import { toast } from "sonner";
import { useAppSelector } from "@/store/hooks";

interface ACAuditRecordSectionProps {
  facilityId: string;
  utilityAccountId: string;
}

type ExistingDocument = {
  fileUrl: string;
  fileType: "image" | "pdf";
  fileName?: string;
  uploadedAt?: string;
};

type ACAuditFormState = {
  id?: string;
  localId: string;
  isNew: boolean;
  isEditing: boolean;

  unit_id: string;
  building_block: string;
  area_location: string;
  ac_type: "window" | "split" | "ductable" | "";
  make: string;
  model: string;
  cooling_capacity_TR: string;
  rated_input_power_kW: string;
  bee_star_rating: string;
  refrigerant: string;
  year_of_installation: string;
  control_type:
    | "manual"
    | "thermostat"
    | "bms"
    | "timer"
    | "inverter"
    | "other"
    | "";
  quantity_nos: string;
  running_status: "running" | "not_running" | "standby" | "";
  condition: "good" | "average" | "poor" | "";
  remarks: string;

  voltage_V: string;
  current_A: string;
  power_factor: string;
  measured_power_kW: string;
  return_air_temp_C: string;
  supply_air_temp_C: string;
  ambient_temp_C: string;
  thermostat_set_temp_C: string;
  operating_hours_per_day: string;
  operating_days_per_year: string;
  compressor_fan_cycling: "normal" | "frequent" | "continuous" | "";
  filter_evaporator_condition: "clean" | "moderate" | "dirty" | "";
  condenser_condition: "clean" | "moderate" | "dirty" | "";
  airflow_noise_leakage: string;
  measurement_remarks: string;

  airside_delta_T: string;
  loading_factor_percent: string;
  connected_load_kW: string;
  annual_energy_consumption_kWh: string;
  specific_power_kW_per_TR: string;
  age_years: string;
  om_flag: string;
  replacement_flag: string; // yes / no
  control_flag: string;
  overall_ecm_suggestion: string;
  priority: "low" | "medium" | "high" | "";
  indicative_basis: string;

  audit_date: string;

  existingDocuments: ExistingDocument[];
  newDocuments: File[];
};

const editableInputClass =
  "border-input bg-background text-foreground placeholder:text-muted-foreground";
const autoInputClass =
  "border-warning/50 bg-warning/10 text-foreground placeholder:text-muted-foreground";

const createEmptyForm = (): ACAuditFormState => ({
  localId: `new-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  isNew: true,
  isEditing: true,

  unit_id: "",
  building_block: "",
  area_location: "",
  ac_type: "",
  make: "",
  model: "",
  cooling_capacity_TR: "",
  rated_input_power_kW: "",
  bee_star_rating: "",
  refrigerant: "",
  year_of_installation: "",
  control_type: "",
  quantity_nos: "1",
  running_status: "running",
  condition: "",
  remarks: "",

  voltage_V: "",
  current_A: "",
  power_factor: "",
  measured_power_kW: "",
  return_air_temp_C: "",
  supply_air_temp_C: "",
  ambient_temp_C: "",
  thermostat_set_temp_C: "",
  operating_hours_per_day: "",
  operating_days_per_year: "",
  compressor_fan_cycling: "",
  filter_evaporator_condition: "",
  condenser_condition: "",
  airflow_noise_leakage: "",
  measurement_remarks: "",

  airside_delta_T: "",
  loading_factor_percent: "",
  connected_load_kW: "",
  annual_energy_consumption_kWh: "",
  specific_power_kW_per_TR: "",
  age_years: "",
  om_flag: "",
  replacement_flag: "",
  control_flag: "",
  overall_ecm_suggestion: "",
  priority: "",
  indicative_basis: "",

  audit_date: "",

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

const normalizeObjectId = (value: any): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value._id) return String(value._id);
  return "";
};

const updateComputedValues = (form: ACAuditFormState): ACAuditFormState => {
  const returnAir = toNumber(form.return_air_temp_C);
  const supplyAir = toNumber(form.supply_air_temp_C);
  const measuredPower = toNumber(form.measured_power_kW);
  const quantity = toNumber(form.quantity_nos);
  const operatingHours = toNumber(form.operating_hours_per_day);
  const operatingDays = toNumber(form.operating_days_per_year);
  const coolingTR = toNumber(form.cooling_capacity_TR);
  const ratedPower = toNumber(form.rated_input_power_kW);
  const installationYear = toNumber(form.year_of_installation);

  const airsideDeltaT =
    returnAir !== undefined && supplyAir !== undefined
      ? round2(returnAir - supplyAir)
      : undefined;

  const loadingFactor =
    measuredPower !== undefined && ratedPower !== undefined && ratedPower > 0
      ? round2((measuredPower / ratedPower) * 100)
      : undefined;

  const connectedLoad =
    ratedPower !== undefined && quantity !== undefined
      ? round2(ratedPower * quantity)
      : undefined;

  const annualEnergy =
    measuredPower !== undefined &&
    quantity !== undefined &&
    operatingHours !== undefined &&
    operatingDays !== undefined
      ? round2(measuredPower * quantity * operatingHours * operatingDays)
      : undefined;

  const specificPower =
    measuredPower !== undefined && coolingTR !== undefined && coolingTR > 0
      ? round2(measuredPower / coolingTR)
      : undefined;

  const ageYears =
    installationYear !== undefined
      ? new Date().getFullYear() - installationYear
      : undefined;

  const hasOMIssue =
    form.filter_evaporator_condition === "moderate" ||
    form.filter_evaporator_condition === "dirty" ||
    form.condenser_condition === "moderate" ||
    form.condenser_condition === "dirty" ||
    (airsideDeltaT !== undefined && airsideDeltaT < 8);

  const omFlag = hasOMIssue
    ? "Clean filter/coils; check airflow and refrigerant charge"
    : "No major O&M flag";

  const replacementNeeded =
    ageYears !== undefined &&
    specificPower !== undefined &&
    ageYears >= 10 &&
    specificPower > 1.35;

  const replacementFlag = replacementNeeded ? "yes" : "no";

  const replacementSuggestion = replacementNeeded
    ? "Consider replacement with BEE 5-star inverter AC"
    : "";

  const controlFlag =
    form.control_type === "manual" ||
    form.control_type === "thermostat" ||
    !form.control_type
      ? "Review setpoint, scheduling, timer or inverter control"
      : "Control appears acceptable";

  const overallSuggestion = replacementSuggestion
    ? replacementSuggestion
    : omFlag !== "No major O&M flag"
      ? omFlag
      : controlFlag !== "Control appears acceptable"
        ? controlFlag
        : "Maintain and monitor performance";

  const priority: ACAuditFormState["priority"] = replacementNeeded
    ? "high"
    : omFlag !== "No major O&M flag" ||
        controlFlag !== "Control appears acceptable"
      ? "medium"
      : "low";

  let indicativeBasis = "";

  if (airsideDeltaT !== undefined && airsideDeltaT < 8) {
    indicativeBasis = "Low ΔT or dirty heat exchange surfaces";
  } else if (replacementNeeded) {
    indicativeBasis = "Old unit with high specific power";
  } else if (
    form.filter_evaporator_condition === "moderate" ||
    form.filter_evaporator_condition === "dirty" ||
    form.condenser_condition === "moderate" ||
    form.condenser_condition === "dirty"
  ) {
    indicativeBasis = "Dirty heat exchange surfaces";
  } else if (form.unit_id) {
    indicativeBasis = "Standard performance";
  }

  return {
    ...form,
    airside_delta_T: airsideDeltaT !== undefined ? String(airsideDeltaT) : "",
    loading_factor_percent:
      loadingFactor !== undefined ? String(loadingFactor) : "",
    connected_load_kW: connectedLoad !== undefined ? String(connectedLoad) : "",
    annual_energy_consumption_kWh:
      annualEnergy !== undefined ? String(annualEnergy) : "",
    specific_power_kW_per_TR:
      specificPower !== undefined ? String(specificPower) : "",
    age_years: ageYears !== undefined ? String(ageYears) : "",
    om_flag: form.unit_id ? omFlag : "",
    replacement_flag: form.unit_id ? replacementFlag : "",
    control_flag: form.unit_id ? controlFlag : "",
    overall_ecm_suggestion: form.unit_id ? overallSuggestion : "",
    priority: form.unit_id ? priority : "",
    indicative_basis: form.unit_id ? indicativeBasis : "",
  };
};

function auditToForm(record: any): ACAuditFormState {
  const form: ACAuditFormState = {
    id: record._id,
    localId: record._id,
    isNew: false,
    isEditing: false,

    unit_id: toStringValue(record.unit_id),
    building_block: toStringValue(record.building_block),
    area_location: toStringValue(record.area_location),
    ac_type: (record.ac_type || "") as ACAuditFormState["ac_type"],
    make: toStringValue(record.make),
    model: toStringValue(record.model),
    cooling_capacity_TR: toStringValue(record.cooling_capacity_TR),
    rated_input_power_kW: toStringValue(record.rated_input_power_kW),
    bee_star_rating: toStringValue(record.bee_star_rating),
    refrigerant: toStringValue(record.refrigerant),
    year_of_installation: toStringValue(record.year_of_installation),
    control_type: (record.control_type ||
      "") as ACAuditFormState["control_type"],
    quantity_nos: toStringValue(record.quantity_nos || 1),
    running_status: (record.running_status ||
      "") as ACAuditFormState["running_status"],
    condition: (record.condition || "") as ACAuditFormState["condition"],
    remarks: toStringValue(record.remarks),

    voltage_V: toStringValue(record.voltage_V),
    current_A: toStringValue(record.current_A),
    power_factor: toStringValue(record.power_factor),
    measured_power_kW: toStringValue(record.measured_power_kW),
    return_air_temp_C: toStringValue(record.return_air_temp_C),
    supply_air_temp_C: toStringValue(record.supply_air_temp_C),
    ambient_temp_C: toStringValue(record.ambient_temp_C),
    thermostat_set_temp_C: toStringValue(record.thermostat_set_temp_C),
    operating_hours_per_day: toStringValue(record.operating_hours_per_day),
    operating_days_per_year: toStringValue(record.operating_days_per_year),
    compressor_fan_cycling: (record.compressor_fan_cycling ||
      "") as ACAuditFormState["compressor_fan_cycling"],
    filter_evaporator_condition: (record.filter_evaporator_condition ||
      "") as ACAuditFormState["filter_evaporator_condition"],
    condenser_condition: (record.condenser_condition ||
      "") as ACAuditFormState["condenser_condition"],
    airflow_noise_leakage: toStringValue(record.airflow_noise_leakage),
    measurement_remarks: toStringValue(record.measurement_remarks),

    airside_delta_T: toStringValue(record.airside_delta_T),
    loading_factor_percent: toStringValue(record.loading_factor_percent),
    connected_load_kW: toStringValue(record.connected_load_kW),
    annual_energy_consumption_kWh: toStringValue(
      record.annual_energy_consumption_kWh,
    ),
    specific_power_kW_per_TR: toStringValue(record.specific_power_kW_per_TR),
    age_years: toStringValue(record.age_years),
    om_flag: toStringValue(record.om_flag),
    replacement_flag: toStringValue(record.replacement_flag),
    control_flag: toStringValue(record.control_flag),
    overall_ecm_suggestion: toStringValue(record.overall_ecm_suggestion),
    priority: (record.priority || "") as ACAuditFormState["priority"],
    indicative_basis: toStringValue(record.indicative_basis),

    audit_date: toDateInput(record.audit_date),

    existingDocuments: Array.isArray(record.documents) ? record.documents : [],
    newDocuments: [],
  };

  return updateComputedValues(form);
}

export function ACAuditRecordSection({
  facilityId,
  utilityAccountId,
}: ACAuditRecordSectionProps) {
  const user = useAppSelector((state) => state.auth.user);
  const canViewDocuments = user?.role === "admin";
  const { data, isLoading, refetch } = useGetACAuditRecordsQuery({
    utility_account_id: utilityAccountId,
  });

  const [createACAuditRecord, { isLoading: isCreating }] =
    useCreateACAuditRecordMutation();

  const [updateACAuditRecord, { isLoading: isUpdating }] =
    useUpdateACAuditRecordMutation();

  const records = useMemo(() => data?.data || [], [data]);
  const [forms, setForms] = useState<ACAuditFormState[]>([]);
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

  const replaceForm = (localId: string, nextForm: ACAuditFormState) => {
    setForms((prev) =>
      prev.map((form) => (form.localId === localId ? nextForm : form)),
    );
  };

  const updateForm = (
    localId: string,
    updater: (form: ACAuditFormState) => ACAuditFormState,
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

  const handleCancel = (form: ACAuditFormState) => {
    if (form.isNew) {
      removeForm(form.localId);
      return;
    }

    const original = records.find((item: any) => item._id === form.id);
    if (!original) return;

    replaceForm(form.localId, auditToForm(original));
  };

  const handleDownloadACAuditExcel = (form: ACAuditFormState) => {
    downloadACAuditExcelTemplate(
      acAuditFormToExcelPrefill({ ...form } as Record<string, unknown>),
    );
  };

  const handleACAuditExcelImport = async (
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
      const parsed = await parseACAuditExcel(file);
      if (!Object.keys(parsed).length) {
        toast.error(
          "No recognized fields found. Use the downloaded template (3 sheets).",
        );
        return;
      }

      setForms((prev) =>
        prev.map((f) => {
          if (f.localId !== localId) return f;
          const next = { ...f, isEditing: true } as ACAuditFormState;
          const mutable = next as unknown as Record<string, unknown>;
          for (const [k, v] of Object.entries(parsed)) {
            if (v === undefined) continue;
            mutable[k] = v;
          }
          return updateComputedValues(next);
        }),
      );
      toast.success("AC audit updated from Excel.");
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
      "Something went wrong while saving AC audit record."
    );
  };

  const handleSave = async (form: ACAuditFormState) => {
    setBackendError("");

    const pf = toNumber(form.power_factor);
    const safePowerFactor =
      pf !== undefined ? Math.min(Math.max(pf, 0), 1) : undefined;

    const payload = {
      facility_id: facilityId,
      utility_account_id: utilityAccountId,

      unit_id: form.unit_id || undefined,
      building_block: form.building_block || undefined,
      area_location: form.area_location || undefined,
      ac_type: form.ac_type || undefined,
      make: form.make || undefined,
      model: form.model || undefined,
      cooling_capacity_TR: toNumber(form.cooling_capacity_TR),
      rated_input_power_kW: toNumber(form.rated_input_power_kW),
      bee_star_rating: toNumber(form.bee_star_rating),
      refrigerant: form.refrigerant || undefined,
      year_of_installation: toNumber(form.year_of_installation),
      control_type: form.control_type || undefined,
      quantity_nos: toNumber(form.quantity_nos),
      running_status: form.running_status || undefined,
      condition: form.condition || undefined,
      remarks: form.remarks || undefined,

      voltage_V: toNumber(form.voltage_V),
      current_A: toNumber(form.current_A),
      power_factor: safePowerFactor,
      measured_power_kW: toNumber(form.measured_power_kW),
      return_air_temp_C: toNumber(form.return_air_temp_C),
      supply_air_temp_C: toNumber(form.supply_air_temp_C),
      ambient_temp_C: toNumber(form.ambient_temp_C),
      thermostat_set_temp_C: toNumber(form.thermostat_set_temp_C),
      operating_hours_per_day: toNumber(form.operating_hours_per_day),
      operating_days_per_year: toNumber(form.operating_days_per_year),
      compressor_fan_cycling: form.compressor_fan_cycling || undefined,
      filter_evaporator_condition:
        form.filter_evaporator_condition || undefined,
      condenser_condition: form.condenser_condition || undefined,
      airflow_noise_leakage: form.airflow_noise_leakage || undefined,
      measurement_remarks: form.measurement_remarks || undefined,

      airside_delta_T: toNumber(form.airside_delta_T),
      loading_factor_percent: toNumber(form.loading_factor_percent),
      connected_load_kW: toNumber(form.connected_load_kW),
      annual_energy_consumption_kWh: toNumber(
        form.annual_energy_consumption_kWh,
      ),
      specific_power_kW_per_TR: toNumber(form.specific_power_kW_per_TR),
      age_years: toNumber(form.age_years),
      om_flag: form.om_flag || undefined,
      replacement_flag: form.replacement_flag || undefined,
      control_flag: form.control_flag || undefined,
      overall_ecm_suggestion: form.overall_ecm_suggestion || undefined,
      priority: form.priority || undefined,
      indicative_basis: form.indicative_basis || undefined,

      audit_date: form.audit_date || undefined,

      documents: form.newDocuments,
    };

    try {
      await toastHandler({
        action: async () => {
          if (form.isNew) {
            await createACAuditRecord(payload as any).unwrap();
          } else if (form.id) {
            await updateACAuditRecord({
              id: form.id,
              ...payload,
            } as any).unwrap();
          }
        },
        loading: form.isNew
          ? "Creating AC audit record..."
          : "Updating AC audit record...",
        success: form.isNew
          ? "AC audit record created successfully"
          : "AC audit record updated successfully",
      });

      setBackendError("");
      await refetch();
    } catch (error: any) {
      setBackendError(getErrorMessage(error));
      console.error("Failed to save AC audit record:", error);
    }
  };

  const saving = isCreating || isUpdating;

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground">
        Loading AC audit records...
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-foreground">
          AC Audit Records
        </h3>

        <Button onClick={handleAddMore}>
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
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            No AC audit records found. Click{" "}
            <span className="font-medium">Add More</span> to create one.
          </CardContent>
        </Card>
      ) : (
        forms.map((form, index) => (
          <Card key={form.localId}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                AC Audit {forms.length - index}
                {form.isNew ? " (New)" : ""}
              </CardTitle>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  id={`ac-audit-excel-import-${form.localId}`}
                  type="file"
                  accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  className="hidden"
                  onChange={(e) => handleACAuditExcelImport(form.localId, e)}
                  disabled={excelImporting}
                />

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadACAuditExcel(form)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Excel template
                </Button>

                <Label
                  htmlFor={`ac-audit-excel-import-${form.localId}`}
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
                  Basic Details
                </h4>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Unit ID</Label>
                    <Input
                      value={form.unit_id}
                      onChange={(e) =>
                        updateForm(form.localId, (prev) => ({
                          ...prev,
                          unit_id: e.target.value,
                        }))
                      }
                      disabled={!form.isEditing}
                      className={editableInputClass}
                    />
                  </div>

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
                    <Label>AC Type</Label>
                    <select
                      value={form.ac_type}
                      onChange={(e) =>
                        updateForm(form.localId, (prev) => ({
                          ...prev,
                          ac_type: e.target
                            .value as ACAuditFormState["ac_type"],
                        }))
                      }
                      disabled={!form.isEditing}
                      className={`flex h-10 w-full rounded-md px-3 py-2 text-sm ${editableInputClass}`}
                    >
                      <option value="">Select AC Type</option>
                      <option value="window">Window</option>
                      <option value="split">Split</option>
                      <option value="ductable">Ductable</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Make</Label>
                    <Input
                      value={form.make}
                      onChange={(e) =>
                        updateForm(form.localId, (prev) => ({
                          ...prev,
                          make: e.target.value,
                        }))
                      }
                      disabled={!form.isEditing}
                      className={editableInputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Input
                      value={form.model}
                      onChange={(e) =>
                        updateForm(form.localId, (prev) => ({
                          ...prev,
                          model: e.target.value,
                        }))
                      }
                      disabled={!form.isEditing}
                      className={editableInputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Cooling Capacity (TR)</Label>
                    <Input
                      type="number"
                      value={form.cooling_capacity_TR}
                      onChange={(e) =>
                        updateForm(form.localId, (prev) => ({
                          ...prev,
                          cooling_capacity_TR: e.target.value,
                        }))
                      }
                      disabled={!form.isEditing}
                      className={editableInputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Rated Input Power (kW)</Label>
                    <Input
                      type="number"
                      value={form.rated_input_power_kW}
                      onChange={(e) =>
                        updateForm(form.localId, (prev) => ({
                          ...prev,
                          rated_input_power_kW: e.target.value,
                        }))
                      }
                      disabled={!form.isEditing}
                      className={editableInputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>BEE Star Rating</Label>
                    <Input
                      type="number"
                      value={form.bee_star_rating}
                      onChange={(e) =>
                        updateForm(form.localId, (prev) => ({
                          ...prev,
                          bee_star_rating: e.target.value,
                        }))
                      }
                      disabled={!form.isEditing}
                      className={editableInputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Refrigerant</Label>
                    <Input
                      value={form.refrigerant}
                      onChange={(e) =>
                        updateForm(form.localId, (prev) => ({
                          ...prev,
                          refrigerant: e.target.value,
                        }))
                      }
                      disabled={!form.isEditing}
                      className={editableInputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Year of Installation</Label>
                    <Input
                      type="number"
                      value={form.year_of_installation}
                      onChange={(e) =>
                        updateForm(form.localId, (prev) => ({
                          ...prev,
                          year_of_installation: e.target.value,
                        }))
                      }
                      disabled={!form.isEditing}
                      className={editableInputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Control Type</Label>
                    <select
                      value={form.control_type}
                      onChange={(e) =>
                        updateForm(form.localId, (prev) => ({
                          ...prev,
                          control_type: e.target
                            .value as ACAuditFormState["control_type"],
                        }))
                      }
                      disabled={!form.isEditing}
                      className={`flex h-10 w-full rounded-md px-3 py-2 text-sm ${editableInputClass}`}
                    >
                      <option value="">Select Control</option>
                      <option value="manual">Manual</option>
                      <option value="thermostat">Thermostat</option>
                      <option value="bms">BMS</option>
                      <option value="timer">Timer</option>
                      <option value="inverter">Inverter</option>
                      <option value="other">Other</option>
                    </select>
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
                    <Label>Running Status</Label>
                    <select
                      value={form.running_status}
                      onChange={(e) =>
                        updateForm(form.localId, (prev) => ({
                          ...prev,
                          running_status: e.target
                            .value as ACAuditFormState["running_status"],
                        }))
                      }
                      disabled={!form.isEditing}
                      className={`flex h-10 w-full rounded-md px-3 py-2 text-sm ${editableInputClass}`}
                    >
                      <option value="">Select Status</option>
                      <option value="running">Running</option>
                      <option value="not_running">Not Running</option>
                      <option value="standby">Standby</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Condition</Label>
                    <select
                      value={form.condition}
                      onChange={(e) =>
                        updateForm(form.localId, (prev) => ({
                          ...prev,
                          condition: e.target
                            .value as ACAuditFormState["condition"],
                        }))
                      }
                      disabled={!form.isEditing}
                      className={`flex h-10 w-full rounded-md px-3 py-2 text-sm ${editableInputClass}`}
                    >
                      <option value="">Select Condition</option>
                      <option value="good">Good</option>
                      <option value="average">Average</option>
                      <option value="poor">Poor</option>
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

              <div className="rounded-xl border p-4">
                <h4 className="mb-4 text-base font-semibold text-foreground">
                  Measurement Section
                </h4>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Voltage (V)</Label>
                    <Input
                      type="number"
                      value={form.voltage_V}
                      onChange={(e) =>
                        updateForm(form.localId, (prev) => ({
                          ...prev,
                          voltage_V: e.target.value,
                        }))
                      }
                      disabled={!form.isEditing}
                      className={editableInputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Current (A)</Label>
                    <Input
                      type="number"
                      value={form.current_A}
                      onChange={(e) =>
                        updateForm(form.localId, (prev) => ({
                          ...prev,
                          current_A: e.target.value,
                        }))
                      }
                      disabled={!form.isEditing}
                      className={editableInputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Power Factor</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={form.power_factor}
                      onChange={(e) =>
                        updateForm(form.localId, (prev) => ({
                          ...prev,
                          power_factor: e.target.value,
                        }))
                      }
                      disabled={!form.isEditing}
                      className={editableInputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Measured Power (kW)</Label>
                    <Input
                      type="number"
                      value={form.measured_power_kW}
                      onChange={(e) =>
                        updateForm(form.localId, (prev) => ({
                          ...prev,
                          measured_power_kW: e.target.value,
                        }))
                      }
                      disabled={!form.isEditing}
                      className={editableInputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Return Air Temp (°C)</Label>
                    <Input
                      type="number"
                      value={form.return_air_temp_C}
                      onChange={(e) =>
                        updateForm(form.localId, (prev) => ({
                          ...prev,
                          return_air_temp_C: e.target.value,
                        }))
                      }
                      disabled={!form.isEditing}
                      className={editableInputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Supply Air Temp (°C)</Label>
                    <Input
                      type="number"
                      value={form.supply_air_temp_C}
                      onChange={(e) =>
                        updateForm(form.localId, (prev) => ({
                          ...prev,
                          supply_air_temp_C: e.target.value,
                        }))
                      }
                      disabled={!form.isEditing}
                      className={editableInputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Ambient Temp (°C)</Label>
                    <Input
                      type="number"
                      value={form.ambient_temp_C}
                      onChange={(e) =>
                        updateForm(form.localId, (prev) => ({
                          ...prev,
                          ambient_temp_C: e.target.value,
                        }))
                      }
                      disabled={!form.isEditing}
                      className={editableInputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Thermostat Set Temp (°C)</Label>
                    <Input
                      type="number"
                      value={form.thermostat_set_temp_C}
                      onChange={(e) =>
                        updateForm(form.localId, (prev) => ({
                          ...prev,
                          thermostat_set_temp_C: e.target.value,
                        }))
                      }
                      disabled={!form.isEditing}
                      className={editableInputClass}
                    />
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
                    <Label>Compressor / Fan Cycling</Label>
                    <select
                      value={form.compressor_fan_cycling}
                      onChange={(e) =>
                        updateForm(form.localId, (prev) => ({
                          ...prev,
                          compressor_fan_cycling: e.target
                            .value as ACAuditFormState["compressor_fan_cycling"],
                        }))
                      }
                      disabled={!form.isEditing}
                      className={`flex h-10 w-full rounded-md px-3 py-2 text-sm ${editableInputClass}`}
                    >
                      <option value="">Select</option>
                      <option value="normal">Normal</option>
                      <option value="frequent">Frequent</option>
                      <option value="continuous">Continuous</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Filter / Evaporator Condition</Label>
                    <select
                      value={form.filter_evaporator_condition}
                      onChange={(e) =>
                        updateForm(form.localId, (prev) => ({
                          ...prev,
                          filter_evaporator_condition: e.target
                            .value as ACAuditFormState["filter_evaporator_condition"],
                        }))
                      }
                      disabled={!form.isEditing}
                      className={`flex h-10 w-full rounded-md px-3 py-2 text-sm ${editableInputClass}`}
                    >
                      <option value="">Select</option>
                      <option value="clean">Clean</option>
                      <option value="moderate">Moderate</option>
                      <option value="dirty">Dirty</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Condenser Condition</Label>
                    <select
                      value={form.condenser_condition}
                      onChange={(e) =>
                        updateForm(form.localId, (prev) => ({
                          ...prev,
                          condenser_condition: e.target
                            .value as ACAuditFormState["condenser_condition"],
                        }))
                      }
                      disabled={!form.isEditing}
                      className={`flex h-10 w-full rounded-md px-3 py-2 text-sm ${editableInputClass}`}
                    >
                      <option value="">Select</option>
                      <option value="clean">Clean</option>
                      <option value="moderate">Moderate</option>
                      <option value="dirty">Dirty</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Airflow / Noise / Leakage Observation</Label>
                    <Textarea
                      value={form.airflow_noise_leakage}
                      onChange={(e) =>
                        updateForm(form.localId, (prev) => ({
                          ...prev,
                          airflow_noise_leakage: e.target.value,
                        }))
                      }
                      disabled={!form.isEditing}
                      className={editableInputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Measurement Remarks</Label>
                    <Textarea
                      value={form.measurement_remarks}
                      onChange={(e) =>
                        updateForm(form.localId, (prev) => ({
                          ...prev,
                          measurement_remarks: e.target.value,
                        }))
                      }
                      disabled={!form.isEditing}
                      className={editableInputClass}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border p-4">
                <h4 className="mb-4 text-base font-semibold text-foreground">
                  Calculation Section (Auto Formula Based)
                </h4>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {renderAutoInput("Air-side ΔT (°C)", form.airside_delta_T)}
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
                  {renderAutoInput(
                    "Specific Power (kW/TR)",
                    form.specific_power_kW_per_TR,
                  )}
                  {renderAutoInput("Age (Years)", form.age_years)}
                  {renderAutoInput("O&M Flag", form.om_flag)}
                  {renderAutoInput("Replacement Flag", form.replacement_flag)}
                  {renderAutoInput("Control Flag", form.control_flag)}
                  {renderAutoInput(
                    "Overall ECM Suggestion",
                    form.overall_ecm_suggestion,
                  )}
                  {renderAutoInput("Priority", form.priority)}
                  {renderAutoInput("Indicative Basis", form.indicative_basis)}
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
  );
}

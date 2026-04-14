"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import {
  useCreatePumpAuditRecordMutation,
  useGetPumpAuditRecordsQuery,
  useUpdatePumpAuditRecordMutation,
} from "@/store/slices/pumpAuditRecordApiSlice";
import {
  downloadPumpAuditTemplate,
  parsePumpAuditExcel,
  type PumpAuditExcelFormState,
} from "@/lib/pump-audit-record-excel";
import { toastHandler } from "@/lib/toast";
import { toast } from "sonner";
import { useAppSelector } from "@/store/hooks";
import { AuditStepLockedOverlay } from "@/components/utility-audit/audit-step-locked-overlay";

interface PumpAuditRecordSectionProps {
  facilityId: string;
  utilityAccountId: string;
  pumpId: string;
  auditStepLocked?: boolean;
  hideAuditSubmitChrome?: boolean;
}

type ExistingDocument = {
  fileUrl: string;
  fileType: "image" | "pdf";
  fileName?: string;
  uploadedAt?: string;
};

type PumpAuditFormState = {
  id?: string;
  isNew: boolean;
  isEditing: boolean;

  suction_head_m: string;
  discharge_static_head_m: string;
  delivery_pipe_diameter_inches: string;
  tank_or_sump_capacity: string;
  time_to_fill_tank_minutes: string;
  actual_flow_m3_per_hr: string;

  voltage_V: string;
  current_A: string;
  power_factor: string;
  input_power_kW: string;
  operating_hours_per_day: string;
  daily_energy_consumption_kWh: string;

  total_dynamic_head_m: string;
  hydraulic_output_power_kW: string;
  overall_pump_set_efficiency_percent: string;
  motor_loading_percent: string;
  specific_energy_consumption_kWh_per_m3: string;
  annual_energy_consumption_kWh: string;

  control_valve_throttling: boolean;
  vfd_installed: boolean;
  pump_condition: "" | "good" | "moderate" | "poor";
  leakages_observed: boolean;
  recommendations: string;

  audit_date: string;

  documents: File[];
  existingDocuments: ExistingDocument[];
};

const editableInputClass =
  "border-input bg-background text-foreground focus:border-primary focus:ring-1 focus:ring-primary";

const autoInputClass =
  "cursor-not-allowed border border-dashed border-border bg-muted/50 text-muted-foreground opacity-90";

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-90";

const textareaClass =
  "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-90";

const getInputClass = (disabled: boolean) =>
  disabled ? autoInputClass : editableInputClass;

function toDateInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
}

const toNumber = (value: string) => {
  const num = parseFloat(value);
  return Number.isFinite(num) ? num : 0;
};

const formatAutoValue = (value: number) => {
  return Number.isFinite(value) && value !== 0 ? value.toFixed(2) : "";
};

function calculatePumpAutoFields(form: PumpAuditFormState) {
  const suctionHead = toNumber(form.suction_head_m);
  const dischargeStaticHead = toNumber(form.discharge_static_head_m);
  const actualFlow = toNumber(form.actual_flow_m3_per_hr);
  const dailyEnergy = toNumber(form.daily_energy_consumption_kWh);

  const totalDynamicHead = suctionHead + dischargeStaticHead;

  const hydraulicOutputPower =
    (actualFlow * totalDynamicHead * 1000 * 9.81) / 3600000;

  const annualEnergyConsumption = dailyEnergy * 365;

  return {
    total_dynamic_head_m: formatAutoValue(totalDynamicHead),
    hydraulic_output_power_kW: formatAutoValue(hydraulicOutputPower),
    annual_energy_consumption_kWh: formatAutoValue(annualEnergyConsumption),
  };
}

const createEmptyForm = (): PumpAuditFormState => ({
  isNew: true,
  isEditing: true,

  suction_head_m: "",
  discharge_static_head_m: "",
  delivery_pipe_diameter_inches: "",
  tank_or_sump_capacity: "",
  time_to_fill_tank_minutes: "",
  actual_flow_m3_per_hr: "",

  voltage_V: "",
  current_A: "",
  power_factor: "",
  input_power_kW: "",
  operating_hours_per_day: "",
  daily_energy_consumption_kWh: "",

  total_dynamic_head_m: "",
  hydraulic_output_power_kW: "",
  overall_pump_set_efficiency_percent: "",
  motor_loading_percent: "",
  specific_energy_consumption_kWh_per_m3: "",
  annual_energy_consumption_kWh: "",

  control_valve_throttling: false,
  vfd_installed: false,
  pump_condition: "",
  leakages_observed: false,
  recommendations: "",

  audit_date: "",

  documents: [],
  existingDocuments: [],
});

function recordToForm(record: any): PumpAuditFormState {
  return {
    id: record._id,
    isNew: false,
    isEditing: false,

    suction_head_m: record.suction_head_m?.toString() || "",
    discharge_static_head_m: record.discharge_static_head_m?.toString() || "",
    delivery_pipe_diameter_inches:
      record.delivery_pipe_diameter_inches?.toString() || "",
    tank_or_sump_capacity: record.tank_or_sump_capacity?.toString() || "",
    time_to_fill_tank_minutes:
      record.time_to_fill_tank_minutes?.toString() || "",
    actual_flow_m3_per_hr: record.actual_flow_m3_per_hr?.toString() || "",

    voltage_V: record.voltage_V?.toString() || "",
    current_A: record.current_A?.toString() || "",
    power_factor: record.power_factor?.toString() || "",
    input_power_kW: record.input_power_kW?.toString() || "",
    operating_hours_per_day: record.operating_hours_per_day?.toString() || "",
    daily_energy_consumption_kWh:
      record.daily_energy_consumption_kWh?.toString() || "",

    total_dynamic_head_m: record.total_dynamic_head_m?.toString() || "",
    hydraulic_output_power_kW:
      record.hydraulic_output_power_kW?.toString() || "",
    overall_pump_set_efficiency_percent:
      record.overall_pump_set_efficiency_percent?.toString() || "",
    motor_loading_percent: record.motor_loading_percent?.toString() || "",
    specific_energy_consumption_kWh_per_m3:
      record.specific_energy_consumption_kWh_per_m3?.toString() || "",
    annual_energy_consumption_kWh:
      record.annual_energy_consumption_kWh?.toString() || "",

    control_valve_throttling: Boolean(record.control_valve_throttling),
    vfd_installed: Boolean(record.vfd_installed),
    pump_condition: record.pump_condition || "",
    leakages_observed: Boolean(record.leakages_observed),
    recommendations: record.recommendations || "",

    audit_date: toDateInput(record.audit_date),

    documents: [],
    existingDocuments: record.documents || [],
  };
}

export function PumpAuditRecordSection({
  facilityId,
  utilityAccountId,
  pumpId,
  auditStepLocked = false,
  hideAuditSubmitChrome = false,
}: PumpAuditRecordSectionProps) {
  const user = useAppSelector((state) => state.auth.user);
  const canViewDocuments = user?.role === "admin";
  const { data, isLoading, refetch } = useGetPumpAuditRecordsQuery({
    facility_id: facilityId,
    utility_account_id: utilityAccountId,
    pump_id: pumpId,
  });

  const [createPumpAuditRecord, { isLoading: isCreating }] =
    useCreatePumpAuditRecordMutation();

  const [updatePumpAuditRecord, { isLoading: isUpdating }] =
    useUpdatePumpAuditRecordMutation();

  const records = useMemo(() => data?.data || [], [data]);

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

  const [form, setForm] = useState<PumpAuditFormState>(() => {
    const emptyForm = createEmptyForm();
    return {
      ...emptyForm,
      ...calculatePumpAutoFields(emptyForm),
    };
  });
  const [excelImporting, setExcelImporting] = useState(false);

  useEffect(() => {
    if (latestRecord) {
      const mappedForm = recordToForm(latestRecord);
      setForm({
        ...mappedForm,
        ...calculatePumpAutoFields(mappedForm),
      });
    } else {
      const emptyForm = createEmptyForm();
      setForm({
        ...emptyForm,
        ...calculatePumpAutoFields(emptyForm),
      });
    }
  }, [latestRecord]);

  const updateForm = (
    key: keyof PumpAuditFormState,
    value: string | boolean | File[] | ExistingDocument[],
  ) => {
    setForm((prev) => {
      const updatedForm = {
        ...prev,
        [key]: value,
      } as PumpAuditFormState;

      const calculatedFields = calculatePumpAutoFields(updatedForm);

      return {
        ...updatedForm,
        ...calculatedFields,
      };
    });
  };

  const handleDownloadPumpAuditExcelTemplate = () => {
    const rowPrefill: Partial<
      Record<keyof PumpAuditExcelFormState, string | boolean>
    > = {
      suction_head_m: form.suction_head_m,
      discharge_static_head_m: form.discharge_static_head_m,
      delivery_pipe_diameter_inches: form.delivery_pipe_diameter_inches,
      tank_or_sump_capacity: form.tank_or_sump_capacity,
      time_to_fill_tank_minutes: form.time_to_fill_tank_minutes,
      actual_flow_m3_per_hr: form.actual_flow_m3_per_hr,
      voltage_V: form.voltage_V,
      current_A: form.current_A,
      power_factor: form.power_factor,
      input_power_kW: form.input_power_kW,
      operating_hours_per_day: form.operating_hours_per_day,
      daily_energy_consumption_kWh: form.daily_energy_consumption_kWh,
      total_dynamic_head_m: form.total_dynamic_head_m,
      hydraulic_output_power_kW: form.hydraulic_output_power_kW,
      overall_pump_set_efficiency_percent:
        form.overall_pump_set_efficiency_percent,
      motor_loading_percent: form.motor_loading_percent,
      specific_energy_consumption_kWh_per_m3:
        form.specific_energy_consumption_kWh_per_m3,
      annual_energy_consumption_kWh: form.annual_energy_consumption_kWh,
      control_valve_throttling: form.control_valve_throttling,
      vfd_installed: form.vfd_installed,
      pump_condition: form.pump_condition,
      leakages_observed: form.leakages_observed,
      recommendations: form.recommendations,
      audit_date: form.audit_date,
    };
    downloadPumpAuditTemplate({ rowPrefill });
  };

  const handlePumpAuditExcelFileChange = async (
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
      const parsed = await parsePumpAuditExcel(file);
      if (!Object.keys(parsed).length) {
        toast.error("No recognized fields found. Use the downloaded template.");
        return;
      }

      setForm((prev) => {
        const next: PumpAuditFormState = { ...prev, isEditing: true };
        const mutable = next as unknown as Record<string, unknown>;
        for (const [k, v] of Object.entries(parsed)) {
          if (v === undefined) continue;
          mutable[k] = v;
        }
        return {
          ...next,
          ...calculatePumpAutoFields(next),
        };
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
      const mappedForm = recordToForm(latestRecord);
      setForm({
        ...mappedForm,
        ...calculatePumpAutoFields(mappedForm),
      });
    } else {
      const emptyForm = createEmptyForm();
      setForm({
        ...emptyForm,
        ...calculatePumpAutoFields(emptyForm),
      });
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
      pump_id: pumpId,
      utility_account_id: utilityAccountId,
      facility_id: facilityId,

      suction_head_m: form.suction_head_m || undefined,
      discharge_static_head_m: form.discharge_static_head_m || undefined,
      delivery_pipe_diameter_inches:
        form.delivery_pipe_diameter_inches || undefined,
      tank_or_sump_capacity: form.tank_or_sump_capacity || undefined,
      time_to_fill_tank_minutes: form.time_to_fill_tank_minutes || undefined,
      actual_flow_m3_per_hr: form.actual_flow_m3_per_hr || undefined,

      voltage_V: form.voltage_V || undefined,
      current_A: form.current_A || undefined,
      power_factor: form.power_factor || undefined,
      input_power_kW: form.input_power_kW || undefined,
      operating_hours_per_day: form.operating_hours_per_day || undefined,
      daily_energy_consumption_kWh:
        form.daily_energy_consumption_kWh || undefined,

      total_dynamic_head_m: form.total_dynamic_head_m || undefined,
      hydraulic_output_power_kW: form.hydraulic_output_power_kW || undefined,
      overall_pump_set_efficiency_percent:
        form.overall_pump_set_efficiency_percent || undefined,
      motor_loading_percent: form.motor_loading_percent || undefined,
      specific_energy_consumption_kWh_per_m3:
        form.specific_energy_consumption_kWh_per_m3 || undefined,
      annual_energy_consumption_kWh:
        form.annual_energy_consumption_kWh || undefined,

      control_valve_throttling: form.control_valve_throttling,
      vfd_installed: form.vfd_installed,
      pump_condition: form.pump_condition || undefined,
      leakages_observed: form.leakages_observed,
      recommendations: form.recommendations || undefined,

      audit_date: form.audit_date || undefined,

      documents: form.documents.length ? form.documents : undefined,
    };

    try {
      await toastHandler({
        action: () => {
          if (form.isNew) {
            return createPumpAuditRecord(payload).unwrap();
          }

          if (form.id) {
            return updatePumpAuditRecord({
              id: form.id,
              ...payload,
            }).unwrap();
          }

          return Promise.reject(new Error("Pump audit record ID is missing."));
        },
        loading: form.isNew
          ? "Creating pump audit record..."
          : "Updating pump audit record...",
        success: form.isNew
          ? "Pump audit record created successfully"
          : "Pump audit record updated successfully",
      });

      await refetch();
    } catch (error: any) {
      console.error("Failed to save pump audit record:", error);
    }
  };

  const saving = isCreating || isUpdating;

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground">
        Loading pump audit record...
      </div>
    );
  }

  return (
    <div className="relative space-y-4">
      {auditStepLocked && !hideAuditSubmitChrome ? (
        <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-950 dark:border-blue-500/30 dark:bg-blue-950/40 dark:text-blue-100">
          Pump audit for this utility account has been submitted and is locked
          for editing.
        </div>
      ) : null}

      <div className="relative">
        <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-foreground">
          Pump Audit Record
        </h3>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            {form.isNew ? "Create Pump Audit Record" : "Pump Audit Record"}
          </CardTitle>

          <div className="flex flex-wrap items-center gap-2">
            <input
              id="pump-audit-excel-import"
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              className="hidden"
              onChange={handlePumpAuditExcelFileChange}
              disabled={excelImporting}
            />

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadPumpAuditExcelTemplate}
            >
              <Download className="mr-2 h-4 w-4" />
              Excel template
            </Button>

            <Label
              htmlFor="pump-audit-excel-import"
              className={`inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground ${
                excelImporting ? "pointer-events-none opacity-50" : ""
              }`}
            >
              <FileSpreadsheet className="h-4 w-4" />
              {excelImporting ? "Reading…" : "Import Excel"}
            </Label>

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
              Hydraulic Parameters
            </h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Suction Head (m)</Label>
                <Input
                  type="number"
                  value={form.suction_head_m}
                  onChange={(e) => updateForm("suction_head_m", e.target.value)}
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
              </div>

              <div className="space-y-2">
                <Label>Discharge Static Head (m)</Label>
                <Input
                  type="number"
                  value={form.discharge_static_head_m}
                  onChange={(e) =>
                    updateForm("discharge_static_head_m", e.target.value)
                  }
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
              </div>

              <div className="space-y-2">
                <Label>Delivery Pipe Diameter (inches)</Label>
                <Input
                  type="number"
                  value={form.delivery_pipe_diameter_inches}
                  onChange={(e) =>
                    updateForm("delivery_pipe_diameter_inches", e.target.value)
                  }
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
              </div>

              <div className="space-y-2">
                <Label>Tank / Sump Capacity</Label>
                <Input
                  type="number"
                  value={form.tank_or_sump_capacity}
                  onChange={(e) =>
                    updateForm("tank_or_sump_capacity", e.target.value)
                  }
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
              </div>

              <div className="space-y-2">
                <Label>Time to Fill Tank (minutes)</Label>
                <Input
                  type="number"
                  value={form.time_to_fill_tank_minutes}
                  onChange={(e) =>
                    updateForm("time_to_fill_tank_minutes", e.target.value)
                  }
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
              </div>

              <div className="space-y-2">
                <Label>Actual Flow (m³/hr)</Label>
                <Input
                  type="number"
                  value={form.actual_flow_m3_per_hr}
                  onChange={(e) =>
                    updateForm("actual_flow_m3_per_hr", e.target.value)
                  }
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <h4 className="mb-4 text-base font-semibold text-foreground">
              Electrical Parameters
            </h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Voltage (V)</Label>
                <Input
                  type="number"
                  value={form.voltage_V}
                  onChange={(e) => updateForm("voltage_V", e.target.value)}
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
              </div>

              <div className="space-y-2">
                <Label>Current (A)</Label>
                <Input
                  type="number"
                  value={form.current_A}
                  onChange={(e) => updateForm("current_A", e.target.value)}
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
              </div>

              <div className="space-y-2">
                <Label>Power Factor</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.power_factor}
                  onChange={(e) => updateForm("power_factor", e.target.value)}
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
              </div>

              <div className="space-y-2">
                <Label>Input Power (kW)</Label>
                <Input
                  type="number"
                  value={form.input_power_kW}
                  onChange={(e) => updateForm("input_power_kW", e.target.value)}
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
              </div>

              <div className="space-y-2">
                <Label>Operating Hours / Day</Label>
                <Input
                  type="number"
                  value={form.operating_hours_per_day}
                  onChange={(e) =>
                    updateForm("operating_hours_per_day", e.target.value)
                  }
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
              </div>

              <div className="space-y-2">
                <Label>Daily Energy Consumption (kWh)</Label>
                <Input
                  type="number"
                  value={form.daily_energy_consumption_kWh}
                  onChange={(e) =>
                    updateForm("daily_energy_consumption_kWh", e.target.value)
                  }
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <h4 className="mb-4 text-base font-semibold text-foreground">
              Performance
            </h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Total Dynamic Head (m)</Label>
                <Input
                  type="number"
                  value={form.total_dynamic_head_m}
                  disabled
                  className={autoInputClass}
                />
              </div>

              <div className="space-y-2">
                <Label>Hydraulic Output Power (kW)</Label>
                <Input
                  type="number"
                  value={form.hydraulic_output_power_kW}
                  disabled
                  className={autoInputClass}
                />
              </div>

              <div className="space-y-2">
                <Label>Overall Pump Set Efficiency (%)</Label>
                <Input
                  type="number"
                  value={form.overall_pump_set_efficiency_percent}
                  onChange={(e) =>
                    updateForm(
                      "overall_pump_set_efficiency_percent",
                      e.target.value,
                    )
                  }
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
              </div>

              <div className="space-y-2">
                <Label>Motor Loading (%)</Label>
                <Input
                  type="number"
                  value={form.motor_loading_percent}
                  onChange={(e) =>
                    updateForm("motor_loading_percent", e.target.value)
                  }
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
              </div>

              <div className="space-y-2">
                <Label>Specific Energy Consumption (kWh/m³)</Label>
                <Input
                  type="number"
                  value={form.specific_energy_consumption_kWh_per_m3}
                  onChange={(e) =>
                    updateForm(
                      "specific_energy_consumption_kWh_per_m3",
                      e.target.value,
                    )
                  }
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
              </div>

              <div className="space-y-2">
                <Label>Annual Energy Consumption (kWh)</Label>
                <Input
                  type="number"
                  value={form.annual_energy_consumption_kWh}
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
              Operational Observations
            </h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Control Valve Throttling</Label>
                <select
                  value={String(form.control_valve_throttling)}
                  onChange={(e) =>
                    updateForm(
                      "control_valve_throttling",
                      e.target.value === "true",
                    )
                  }
                  disabled={!form.isEditing}
                  className={selectClass}
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>VFD Installed</Label>
                <select
                  value={String(form.vfd_installed)}
                  onChange={(e) =>
                    updateForm("vfd_installed", e.target.value === "true")
                  }
                  disabled={!form.isEditing}
                  className={selectClass}
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Pump Condition</Label>
                <select
                  value={form.pump_condition}
                  onChange={(e) => updateForm("pump_condition", e.target.value)}
                  disabled={!form.isEditing}
                  className={selectClass}
                >
                  <option value="">Select condition</option>
                  <option value="good">Good</option>
                  <option value="moderate">Moderate</option>
                  <option value="poor">Poor</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Leakages Observed</Label>
                <select
                  value={String(form.leakages_observed)}
                  onChange={(e) =>
                    updateForm("leakages_observed", e.target.value === "true")
                  }
                  disabled={!form.isEditing}
                  className={selectClass}
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>

              <div className="space-y-2 md:col-span-2 lg:col-span-3">
                <Label>Recommendations</Label>
                <textarea
                  value={form.recommendations}
                  onChange={(e) =>
                    updateForm("recommendations", e.target.value)
                  }
                  disabled={!form.isEditing}
                  rows={4}
                  className={textareaClass}
                  placeholder="Enter recommendations"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border p-4">
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

            {canViewDocuments && form.existingDocuments.length > 0 && (
              <div className="mt-4 space-y-2">
                <Label>Existing Documents</Label>
                <div className="space-y-2">
                  {form.existingDocuments.map((doc, docIndex) => (
                    <div
                      key={`${doc.fileUrl}-${docIndex}`}
                      className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        {doc.fileType === "pdf" ? (
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        )}
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline"
                        >
                          {doc.fileName || `Document ${docIndex + 1}`}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!canViewDocuments && (
              <p className="mt-2 text-sm text-muted-foreground">
                Existing documents are visible to admin users only.
              </p>
            )}

            {form.documents.length > 0 && (
              <div className="mt-4 space-y-2">
                <Label>New Selected Documents</Label>
                <div className="space-y-2">
                  {form.documents.map((file, fileIndex) => (
                    <div
                      key={`${file.name}-${fileIndex}`}
                      className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        {file.type === "application/pdf" ? (
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span>{file.name}</span>
                      </div>

                      {form.isEditing && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
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
        </div>
        {auditStepLocked ? <AuditStepLockedOverlay /> : null}
      </div>
    </div>
  );
}

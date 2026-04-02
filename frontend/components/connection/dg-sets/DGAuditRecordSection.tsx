"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
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
  useCreateDGAuditRecordMutation,
  useGetDGAuditRecordsQuery,
  useUpdateDGAuditRecordMutation,
} from "@/store/slices/dgAuditRecordApiSlice";
import { useGetUtilityBillingRecordsQuery } from "@/store/slices/utilityBillingRecordApiSlice";
import { calculateGridCostPerKVAHForOneYear } from "@/lib/calculateGridCostPerKVAHForOneYear";
import {
  downloadDGAuditTemplate,
  parseDGAuditExcel,
  type DGAuditExcelFormState,
} from "@/lib/dg-audit-record-excel";
import { toastHandler } from "@/lib/toast";
import { toast } from "sonner";

interface DGAuditRecordSectionProps {
  facilityId: string;
  utilityAccountId: string;
  dgSetId: string;
}

type ExistingDocument = {
  fileUrl: string;
  fileType: "image" | "pdf";
  fileName?: string;
  uploadedAt?: string;
};

type DGAuditFormState = {
  id?: string;
  isNew: boolean;
  isEditing: boolean;

  measured_voltage_LL: string;
  measured_current_avg: string;
  measured_kW_output: string;
  measured_kVA_output: string;
  power_factor: string;
  frequency_Hz: string;

  max_load_observed_kW: string;
  min_load_observed_kW: string;
  average_loading_percent: string;
  load_factor_percent: string;
  idle_running_observed: boolean;
  parallel_operation: boolean;

  annual_fuel_consumption_liters: string;
  units_generated_per_year_kWh: string;
  total_working_hours_per_year: string;
  units_generated_per_hour_kWh: string;
  fuel_consumption_per_hour_liters: string;

  fuel_consumption_during_test_lph: string;
  units_generated_during_test_kWh: string;

  specific_fuel_consumption_l_per_kWh: string;
  manufacturer_sfc_l_per_kWh: string;
  sfc_deviation_percent: string;

  fuel_cost_rs_per_liter: string;
  annual_fuel_cost_rs: string;
  dg_cost_per_kWh_rs: string;
  grid_cost_per_kWh_rs: string;

  calculated_efficiency_percent: string;
  manufacturer_efficiency_percent: string;
  efficiency_deviation_percent: string;

  exhaust_temperature_C: string;
  cooling_water_temperature_C: string;
  lube_oil_pressure_bar: string;
  lube_oil_consumption_liters_per_year: string;

  total_operating_hours: string;
  hours_since_last_overhaul: string;

  air_fuel_filter_condition: "" | "good" | "moderate" | "poor";
  visible_smoke_or_abnormal_vibration: boolean;

  remarks: string;

  documents: File[];
  existingDocuments: ExistingDocument[];
};

type GridCostSummary = {
  totalBillAmount: number;
  totalKVAH: number;
  gridCostPerKVAH: number;
  recordCount: number;
  fromDate: string | null;
  toDate: string | null;
};

function toDateInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
}

const editableInputClass =
  "bg-white border border-gray-300 text-black focus:border-primary focus:ring-1 focus:ring-primary";

const autoInputClass =
  "bg-white border border-dashed border-gray-400 text-black cursor-not-allowed opacity-90";

const getInputClass = (disabled: boolean) =>
  disabled ? autoInputClass : editableInputClass;

const toNumber = (value: string) => {
  if (!value || value.trim() === "") return undefined;
  const num = Number(value);
  return Number.isNaN(num) ? undefined : num;
};

const calculatePowerFactor = (
  measuredKVA: string,
  measuredKW: string,
): string => {
  const kvaNum = toNumber(measuredKVA);
  const kwNum = toNumber(measuredKW);

  if (kvaNum === undefined || kwNum === undefined || kvaNum === 0) {
    return "";
  }

  return String(Number((kwNum / kvaNum).toFixed(4)));
};

const calculateLoadFactor = (
  averageLoading: string,
  minimumLoadObserved: string,
): string => {
  const avgNum = toNumber(averageLoading);
  const minNum = toNumber(minimumLoadObserved);

  if (avgNum === undefined || minNum === undefined || minNum === 0) {
    return "";
  }

  return String(Number(((avgNum / minNum) * 100).toFixed(2)));
};

const calculateUnitsGeneratedPerHour = (
  unitsGeneratedPerYear: string,
  totalWorkingHoursPerYear: string,
): string => {
  const unitsNum = toNumber(unitsGeneratedPerYear);
  const hoursNum = toNumber(totalWorkingHoursPerYear);

  if (unitsNum === undefined || hoursNum === undefined || hoursNum === 0) {
    return "";
  }

  return String(Number((unitsNum / hoursNum).toFixed(2)));
};

const calculateFuelConsumptionPerHour = (
  annualFuelConsumption: string,
  totalWorkingHoursPerYear: string,
): string => {
  const fuelNum = toNumber(annualFuelConsumption);
  const hoursNum = toNumber(totalWorkingHoursPerYear);

  if (fuelNum === undefined || hoursNum === undefined || hoursNum === 0) {
    return "";
  }

  return String(Number((fuelNum / hoursNum).toFixed(2)));
};

const calculateSpecificFuelConsumption = (
  annualFuelConsumption: string,
  unitsGeneratedPerYear: string,
): string => {
  const fuelNum = toNumber(annualFuelConsumption);
  const unitsNum = toNumber(unitsGeneratedPerYear);

  if (fuelNum === undefined || unitsNum === undefined || unitsNum === 0) {
    return "";
  }

  return String(Number((fuelNum / unitsNum).toFixed(4)));
};

const calculateSfcDeviationPercent = (
  specificFuelConsumption: string,
  manufacturerSfc: string,
): string => {
  const sfcNum = toNumber(specificFuelConsumption);
  const manufacturerNum = toNumber(manufacturerSfc);

  if (
    sfcNum === undefined ||
    manufacturerNum === undefined ||
    manufacturerNum === 0
  ) {
    return "";
  }

  return String(
    Number((((sfcNum - manufacturerNum) / manufacturerNum) * 100).toFixed(2)),
  );
};

const calculateAnnualFuelCost = (
  annualFuelConsumption: string,
  fuelCostPerLiter: string,
): string => {
  const fuelNum = toNumber(annualFuelConsumption);
  const costNum = toNumber(fuelCostPerLiter);

  if (fuelNum === undefined || costNum === undefined) {
    return "";
  }

  return String(Number((fuelNum * costNum).toFixed(2)));
};

const calculateDgCostPerKwh = (
  annualFuelCost: string,
  unitsGeneratedPerYear: string,
): string => {
  const annualCostNum = toNumber(annualFuelCost);
  const unitsNum = toNumber(unitsGeneratedPerYear);

  if (annualCostNum === undefined || unitsNum === undefined || unitsNum === 0) {
    return "";
  }

  return String(Number((annualCostNum / unitsNum).toFixed(2)));
};

const calculateCalculatedDgEfficiency = (
  unitsGeneratedPerHour: string,
  fuelConsumptionPerHour: string,
): string => {
  const unitsNum = toNumber(unitsGeneratedPerHour);
  const fuelNum = toNumber(fuelConsumptionPerHour);

  if (unitsNum === undefined || fuelNum === undefined || fuelNum === 0) {
    return "";
  }

  return String(Number((unitsNum / (fuelNum * 10) / 100).toFixed(4)));
};

const calculateEfficiencyDeviation = (
  manufacturerEfficiency: string,
  calculatedEfficiency: string,
): string => {
  const manufacturerNum = toNumber(manufacturerEfficiency);
  const calculatedNum = toNumber(calculatedEfficiency);

  if (
    manufacturerNum === undefined ||
    calculatedNum === undefined ||
    manufacturerNum === 0
  ) {
    return "";
  }

  return String(
    Number(
      (((manufacturerNum - calculatedNum) / manufacturerNum) * 100).toFixed(2),
    ),
  );
};

function applyDGAuditDerivedCalculations(
  form: DGAuditFormState,
): DGAuditFormState {
  const updated = { ...form };

  updated.power_factor = calculatePowerFactor(
    updated.measured_kVA_output,
    updated.measured_kW_output,
  );

  updated.load_factor_percent = calculateLoadFactor(
    updated.average_loading_percent,
    updated.min_load_observed_kW,
  );

  updated.units_generated_per_hour_kWh = calculateUnitsGeneratedPerHour(
    updated.units_generated_per_year_kWh,
    updated.total_working_hours_per_year,
  );

  updated.fuel_consumption_per_hour_liters = calculateFuelConsumptionPerHour(
    updated.annual_fuel_consumption_liters,
    updated.total_working_hours_per_year,
  );

  updated.specific_fuel_consumption_l_per_kWh =
    calculateSpecificFuelConsumption(
      updated.annual_fuel_consumption_liters,
      updated.units_generated_per_year_kWh,
    );

  updated.sfc_deviation_percent = calculateSfcDeviationPercent(
    updated.specific_fuel_consumption_l_per_kWh,
    updated.manufacturer_sfc_l_per_kWh,
  );

  updated.annual_fuel_cost_rs = calculateAnnualFuelCost(
    updated.annual_fuel_consumption_liters,
    updated.fuel_cost_rs_per_liter,
  );

  updated.dg_cost_per_kWh_rs = calculateDgCostPerKwh(
    updated.annual_fuel_cost_rs,
    updated.units_generated_per_year_kWh,
  );

  updated.calculated_efficiency_percent = calculateCalculatedDgEfficiency(
    updated.units_generated_per_hour_kWh,
    updated.fuel_consumption_per_hour_liters,
  );

  updated.efficiency_deviation_percent = calculateEfficiencyDeviation(
    updated.manufacturer_efficiency_percent,
    updated.calculated_efficiency_percent,
  );

  return updated;
}

const createEmptyForm = (): DGAuditFormState => ({
  isNew: true,
  isEditing: true,

  measured_voltage_LL: "",
  measured_current_avg: "",
  measured_kW_output: "",
  measured_kVA_output: "",
  power_factor: "",
  frequency_Hz: "",

  max_load_observed_kW: "",
  min_load_observed_kW: "",
  average_loading_percent: "",
  load_factor_percent: "",
  idle_running_observed: false,
  parallel_operation: false,

  annual_fuel_consumption_liters: "",
  units_generated_per_year_kWh: "",
  total_working_hours_per_year: "",
  units_generated_per_hour_kWh: "",
  fuel_consumption_per_hour_liters: "",

  fuel_consumption_during_test_lph: "",
  units_generated_during_test_kWh: "",

  specific_fuel_consumption_l_per_kWh: "",
  manufacturer_sfc_l_per_kWh: "",
  sfc_deviation_percent: "",

  fuel_cost_rs_per_liter: "",
  annual_fuel_cost_rs: "",
  dg_cost_per_kWh_rs: "",
  grid_cost_per_kWh_rs: "",

  calculated_efficiency_percent: "",
  manufacturer_efficiency_percent: "",
  efficiency_deviation_percent: "",

  exhaust_temperature_C: "",
  cooling_water_temperature_C: "",
  lube_oil_pressure_bar: "",
  lube_oil_consumption_liters_per_year: "",

  total_operating_hours: "",
  hours_since_last_overhaul: "",

  air_fuel_filter_condition: "",
  visible_smoke_or_abnormal_vibration: false,

  remarks: "",

  documents: [],
  existingDocuments: [],
});

function recordToForm(record: any): DGAuditFormState {
  return {
    id: record._id,
    isNew: false,
    isEditing: false,

    measured_voltage_LL: record.measured_voltage_LL?.toString() || "",
    measured_current_avg: record.measured_current_avg?.toString() || "",
    measured_kW_output: record.measured_kW_output?.toString() || "",
    measured_kVA_output: record.measured_kVA_output?.toString() || "",
    power_factor: record.power_factor?.toString() || "",
    frequency_Hz: record.frequency_Hz?.toString() || "",

    max_load_observed_kW: record.max_load_observed_kW?.toString() || "",
    min_load_observed_kW: record.min_load_observed_kW?.toString() || "",
    average_loading_percent: record.average_loading_percent?.toString() || "",
    load_factor_percent: record.load_factor_percent?.toString() || "",
    idle_running_observed: !!record.idle_running_observed,
    parallel_operation: !!record.parallel_operation,

    annual_fuel_consumption_liters:
      record.annual_fuel_consumption_liters?.toString() || "",
    units_generated_per_year_kWh:
      record.units_generated_per_year_kWh?.toString() || "",
    total_working_hours_per_year:
      record.total_working_hours_per_year?.toString() || "",
    units_generated_per_hour_kWh:
      record.units_generated_per_hour_kWh?.toString() || "",
    fuel_consumption_per_hour_liters:
      record.fuel_consumption_per_hour_liters?.toString() || "",

    fuel_consumption_during_test_lph:
      record.fuel_consumption_during_test_lph?.toString() || "",
    units_generated_during_test_kWh:
      record.units_generated_during_test_kWh?.toString() || "",

    specific_fuel_consumption_l_per_kWh:
      record.specific_fuel_consumption_l_per_kWh?.toString() || "",
    manufacturer_sfc_l_per_kWh:
      record.manufacturer_sfc_l_per_kWh?.toString() || "",
    sfc_deviation_percent: record.sfc_deviation_percent?.toString() || "",

    fuel_cost_rs_per_liter: record.fuel_cost_rs_per_liter?.toString() || "",
    annual_fuel_cost_rs: record.annual_fuel_cost_rs?.toString() || "",
    dg_cost_per_kWh_rs: record.dg_cost_per_kWh_rs?.toString() || "",
    grid_cost_per_kWh_rs: record.grid_cost_per_kWh_rs?.toString() || "",

    calculated_efficiency_percent:
      record.calculated_efficiency_percent?.toString() || "",
    manufacturer_efficiency_percent:
      record.manufacturer_efficiency_percent?.toString() || "",
    efficiency_deviation_percent:
      record.efficiency_deviation_percent?.toString() || "",

    exhaust_temperature_C: record.exhaust_temperature_C?.toString() || "",
    cooling_water_temperature_C:
      record.cooling_water_temperature_C?.toString() || "",
    lube_oil_pressure_bar: record.lube_oil_pressure_bar?.toString() || "",
    lube_oil_consumption_liters_per_year:
      record.lube_oil_consumption_liters_per_year?.toString() || "",

    total_operating_hours: record.total_operating_hours?.toString() || "",
    hours_since_last_overhaul:
      record.hours_since_last_overhaul?.toString() || "",

    air_fuel_filter_condition: record.air_fuel_filter_condition || "",
    visible_smoke_or_abnormal_vibration:
      !!record.visible_smoke_or_abnormal_vibration,

    remarks: record.remarks || "",

    documents: [],
    existingDocuments: record.documents || [],
  };
}

export function DGAuditRecordSection({
  facilityId,
  utilityAccountId,
  dgSetId,
}: DGAuditRecordSectionProps) {
  const { data, isLoading, refetch } = useGetDGAuditRecordsQuery({
    facility_id: facilityId,
    utility_account_id: utilityAccountId,
    dg_set_id: dgSetId,
  });
  const { data: billingResponse } = useGetUtilityBillingRecordsQuery({
    utility_account_id: utilityAccountId,
  });

  const gridCostSummary = useMemo(() => {
    return calculateGridCostPerKVAHForOneYear(billingResponse?.data || []);
  }, [billingResponse]);

  const [createDGAuditRecord, { isLoading: isCreating }] =
    useCreateDGAuditRecordMutation();

  const [updateDGAuditRecord, { isLoading: isUpdating }] =
    useUpdateDGAuditRecordMutation();

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

  const [form, setForm] = useState<DGAuditFormState>(createEmptyForm());
  const [excelImporting, setExcelImporting] = useState(false);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

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
      grid_cost_per_kWh_rs:
        gridCostSummary?.gridCostPerKVAH !== undefined &&
        gridCostSummary?.gridCostPerKVAH !== null
          ? String(gridCostSummary.gridCostPerKVAH)
          : "",
    }));

    setFromDate(toDateInput(gridCostSummary?.fromDate));
    setToDate(toDateInput(gridCostSummary?.toDate));
  }, [gridCostSummary]);

  const updateForm = (key: keyof DGAuditFormState, value: string | boolean) => {
    setForm((prev) => {
      const updated = { ...prev, [key]: value } as DGAuditFormState;
      return applyDGAuditDerivedCalculations(updated);
    });
  };

  const handleDownloadDGAuditExcelTemplate = () => {
    const rowPrefill: Partial<
      Record<keyof DGAuditExcelFormState, string | boolean>
    > = {
      measured_voltage_LL: form.measured_voltage_LL,
      measured_current_avg: form.measured_current_avg,
      measured_kW_output: form.measured_kW_output,
      measured_kVA_output: form.measured_kVA_output,
      power_factor: form.power_factor,
      frequency_Hz: form.frequency_Hz,
      max_load_observed_kW: form.max_load_observed_kW,
      min_load_observed_kW: form.min_load_observed_kW,
      average_loading_percent: form.average_loading_percent,
      load_factor_percent: form.load_factor_percent,
      idle_running_observed: form.idle_running_observed,
      parallel_operation: form.parallel_operation,
      annual_fuel_consumption_liters: form.annual_fuel_consumption_liters,
      units_generated_per_year_kWh: form.units_generated_per_year_kWh,
      total_working_hours_per_year: form.total_working_hours_per_year,
      units_generated_per_hour_kWh: form.units_generated_per_hour_kWh,
      fuel_consumption_per_hour_liters: form.fuel_consumption_per_hour_liters,
      fuel_consumption_during_test_lph: form.fuel_consumption_during_test_lph,
      units_generated_during_test_kWh: form.units_generated_during_test_kWh,
      specific_fuel_consumption_l_per_kWh:
        form.specific_fuel_consumption_l_per_kWh,
      manufacturer_sfc_l_per_kWh: form.manufacturer_sfc_l_per_kWh,
      sfc_deviation_percent: form.sfc_deviation_percent,
      fuel_cost_rs_per_liter: form.fuel_cost_rs_per_liter,
      annual_fuel_cost_rs: form.annual_fuel_cost_rs,
      dg_cost_per_kWh_rs: form.dg_cost_per_kWh_rs,
      grid_cost_per_kWh_rs: form.grid_cost_per_kWh_rs,
      calculated_efficiency_percent: form.calculated_efficiency_percent,
      manufacturer_efficiency_percent: form.manufacturer_efficiency_percent,
      efficiency_deviation_percent: form.efficiency_deviation_percent,
      exhaust_temperature_C: form.exhaust_temperature_C,
      cooling_water_temperature_C: form.cooling_water_temperature_C,
      lube_oil_pressure_bar: form.lube_oil_pressure_bar,
      lube_oil_consumption_liters_per_year:
        form.lube_oil_consumption_liters_per_year,
      total_operating_hours: form.total_operating_hours,
      hours_since_last_overhaul: form.hours_since_last_overhaul,
      air_fuel_filter_condition: form.air_fuel_filter_condition,
      visible_smoke_or_abnormal_vibration:
        form.visible_smoke_or_abnormal_vibration,
      remarks: form.remarks,
    };
    downloadDGAuditTemplate({ rowPrefill });
  };

  const handleDGAuditExcelFileChange = async (
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
      const parsed = await parseDGAuditExcel(file);
      if (!Object.keys(parsed).length) {
        toast.error("No recognized fields found. Use the downloaded template.");
        return;
      }

      setForm((prev) => {
        const next: DGAuditFormState = { ...prev, isEditing: true };
        const mutable = next as unknown as Record<string, unknown>;
        for (const [k, v] of Object.entries(parsed)) {
          if (v === undefined) continue;
          mutable[k] = v;
        }
        return applyDGAuditDerivedCalculations(next);
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
      dg_set_id: dgSetId,
      utility_account_id: utilityAccountId,
      facility_id: facilityId,

      measured_voltage_LL: form.measured_voltage_LL || undefined,
      measured_current_avg: form.measured_current_avg || undefined,
      measured_kW_output: form.measured_kW_output || undefined,
      measured_kVA_output: form.measured_kVA_output || undefined,
      power_factor: form.power_factor || undefined,
      frequency_Hz: form.frequency_Hz || undefined,

      max_load_observed_kW: form.max_load_observed_kW || undefined,
      min_load_observed_kW: form.min_load_observed_kW || undefined,
      average_loading_percent: form.average_loading_percent || undefined,
      load_factor_percent: form.load_factor_percent || undefined,
      idle_running_observed: form.idle_running_observed,
      parallel_operation: form.parallel_operation,

      annual_fuel_consumption_liters:
        form.annual_fuel_consumption_liters || undefined,
      units_generated_per_year_kWh:
        form.units_generated_per_year_kWh || undefined,
      total_working_hours_per_year:
        form.total_working_hours_per_year || undefined,
      units_generated_per_hour_kWh:
        form.units_generated_per_hour_kWh || undefined,
      fuel_consumption_per_hour_liters:
        form.fuel_consumption_per_hour_liters || undefined,

      fuel_consumption_during_test_lph:
        form.fuel_consumption_during_test_lph || undefined,
      units_generated_during_test_kWh:
        form.units_generated_during_test_kWh || undefined,

      specific_fuel_consumption_l_per_kWh:
        form.specific_fuel_consumption_l_per_kWh || undefined,
      manufacturer_sfc_l_per_kWh: form.manufacturer_sfc_l_per_kWh || undefined,
      sfc_deviation_percent: form.sfc_deviation_percent || undefined,

      fuel_cost_rs_per_liter: form.fuel_cost_rs_per_liter || undefined,
      annual_fuel_cost_rs: form.annual_fuel_cost_rs || undefined,
      dg_cost_per_kWh_rs: form.dg_cost_per_kWh_rs || undefined,
      grid_cost_per_kWh_rs: form.grid_cost_per_kWh_rs || undefined,

      calculated_efficiency_percent:
        form.calculated_efficiency_percent || undefined,
      manufacturer_efficiency_percent:
        form.manufacturer_efficiency_percent || undefined,
      efficiency_deviation_percent:
        form.efficiency_deviation_percent || undefined,

      exhaust_temperature_C: form.exhaust_temperature_C || undefined,
      cooling_water_temperature_C:
        form.cooling_water_temperature_C || undefined,
      lube_oil_pressure_bar: form.lube_oil_pressure_bar || undefined,
      lube_oil_consumption_liters_per_year:
        form.lube_oil_consumption_liters_per_year || undefined,

      total_operating_hours: form.total_operating_hours || undefined,
      hours_since_last_overhaul: form.hours_since_last_overhaul || undefined,

      air_fuel_filter_condition: form.air_fuel_filter_condition || undefined,
      visible_smoke_or_abnormal_vibration:
        form.visible_smoke_or_abnormal_vibration,

      documents: form.documents.length ? form.documents : undefined,
    };

    try {
      await toastHandler({
        action: () => {
          if (form.isNew) {
            return createDGAuditRecord(payload).unwrap();
          }

          if (form.id) {
            return updateDGAuditRecord({
              id: form.id,
              ...payload,
            }).unwrap();
          }

          return Promise.reject(new Error("DG audit record ID is missing."));
        },
        loading: form.isNew
          ? "Creating DG audit record..."
          : "Updating DG audit record...",
        success: form.isNew
          ? "DG audit record created successfully"
          : "DG audit record updated successfully",
      });

      await refetch();
    } catch (error: any) {
      console.error("Failed to save DG audit record:", error);
    }
  };

  const saving = isCreating || isUpdating;

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground">
        Loading DG audit record...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-foreground">DG Audit Record</h3>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            {form.isNew ? "Create DG Audit Record" : "DG Audit Record"}
          </CardTitle>

          <div className="flex flex-wrap items-center gap-2">
            <input
              id="dg-audit-excel-import"
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              className="hidden"
              onChange={handleDGAuditExcelFileChange}
              disabled={excelImporting}
            />

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadDGAuditExcelTemplate}
            >
              <Download className="mr-2 h-4 w-4" />
              Excel template
            </Button>

            <Label
              htmlFor="dg-audit-excel-import"
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
          {/* Electrical Measurements */}
          <div className="rounded-xl border p-4">
            <h4 className="mb-4 text-base font-semibold text-foreground">
              Electrical Measurements
            </h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Measured Voltage L-L</Label>
                <Input
                  type="number"
                  value={form.measured_voltage_LL}
                  onChange={(e) =>
                    updateForm("measured_voltage_LL", e.target.value)
                  }
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
              </div>

              <div className="space-y-2">
                <Label>Measured Current Avg</Label>
                <Input
                  type="number"
                  value={form.measured_current_avg}
                  onChange={(e) =>
                    updateForm("measured_current_avg", e.target.value)
                  }
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
              </div>

              <div className="space-y-2">
                <Label>Measured kW Output</Label>
                <Input
                  type="number"
                  value={form.measured_kW_output}
                  onChange={(e) =>
                    updateForm("measured_kW_output", e.target.value)
                  }
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
              </div>

              <div className="space-y-2">
                <Label>Measured kVA Output</Label>
                <Input
                  type="number"
                  value={form.measured_kVA_output}
                  onChange={(e) =>
                    updateForm("measured_kVA_output", e.target.value)
                  }
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
                  disabled
                  className={getInputClass(true)}
                />
              </div>

              <div className="space-y-2">
                <Label>Frequency (Hz)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.frequency_Hz}
                  onChange={(e) => updateForm("frequency_Hz", e.target.value)}
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
              </div>
            </div>
          </div>

          {/* Load Analysis */}
          <div className="rounded-xl border p-4">
            <h4 className="mb-4 text-base font-semibold text-foreground">
              Load Analysis
            </h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>Max Load Observed (kW)</Label>
                <Input
                  type="number"
                  value={form.max_load_observed_kW}
                  onChange={(e) =>
                    updateForm("max_load_observed_kW", e.target.value)
                  }
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
              </div>

              <div className="space-y-2">
                <Label>Min Load Observed (kW)</Label>
                <Input
                  type="number"
                  value={form.min_load_observed_kW}
                  onChange={(e) =>
                    updateForm("min_load_observed_kW", e.target.value)
                  }
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
              </div>

              <div className="space-y-2">
                <Label>Average Loading (%)</Label>
                <Input
                  type="number"
                  value={form.average_loading_percent}
                  onChange={(e) =>
                    updateForm("average_loading_percent", e.target.value)
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
                  disabled
                  className={getInputClass(true)}
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.idle_running_observed}
                  onChange={(e) =>
                    updateForm("idle_running_observed", e.target.checked)
                  }
                  disabled={!form.isEditing}
                />
                Idle Running Observed
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.parallel_operation}
                  onChange={(e) =>
                    updateForm("parallel_operation", e.target.checked)
                  }
                  disabled={!form.isEditing}
                />
                Parallel Operation
              </label>
            </div>
          </div>

          {/* Fuel & Generation */}
          <div className="rounded-xl border p-4">
            <h4 className="mb-4 text-base font-semibold text-foreground">
              Fuel & Generation
            </h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Annual Fuel Consumption (Liters)</Label>
                <Input
                  type="number"
                  value={form.annual_fuel_consumption_liters}
                  onChange={(e) =>
                    updateForm("annual_fuel_consumption_liters", e.target.value)
                  }
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
              </div>

              <div className="space-y-2">
                <Label>Units Generated Per Year (kWh)</Label>
                <Input
                  type="number"
                  value={form.units_generated_per_year_kWh}
                  onChange={(e) =>
                    updateForm("units_generated_per_year_kWh", e.target.value)
                  }
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
              </div>

              <div className="space-y-2">
                <Label>Total Working Hours Per Year</Label>
                <Input
                  type="number"
                  value={form.total_working_hours_per_year}
                  onChange={(e) =>
                    updateForm("total_working_hours_per_year", e.target.value)
                  }
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
              </div>

              <div className="space-y-2">
                <Label>Units Generated Per Hour (kWh)</Label>
                <Input
                  type="number"
                  value={form.units_generated_per_hour_kWh}
                  disabled
                  className={getInputClass(!form.isEditing)}
                />
              </div>

              <div className="space-y-2">
                <Label>Fuel Consumption Per Hour (Liters)</Label>
                <Input
                  type="number"
                  value={form.fuel_consumption_per_hour_liters}
                  disabled
                  className={getInputClass(!form.isEditing)}
                />
              </div>

              <div className="space-y-2">
                <Label>Fuel Consumption During Test (LPH)</Label>
                <Input
                  type="number"
                  value={form.fuel_consumption_during_test_lph}
                  onChange={(e) =>
                    updateForm(
                      "fuel_consumption_during_test_lph",
                      e.target.value,
                    )
                  }
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
              </div>

              <div className="space-y-2">
                <Label>Units Generated During Test (kWh)</Label>
                <Input
                  type="number"
                  value={form.units_generated_during_test_kWh}
                  onChange={(e) =>
                    updateForm(
                      "units_generated_during_test_kWh",
                      e.target.value,
                    )
                  }
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
              </div>

              <div className="space-y-2">
                <Label>Specific Fuel Consumption (L/kWh)</Label>
                <Input
                  type="number"
                  value={form.specific_fuel_consumption_l_per_kWh}
                  disabled
                  className={getInputClass(!form.isEditing)}
                />
              </div>

              <div className="space-y-2">
                <Label>Manufacturer SFC (L/kWh)</Label>
                <Input
                  type="number"
                  value={form.manufacturer_sfc_l_per_kWh}
                  onChange={(e) =>
                    updateForm("manufacturer_sfc_l_per_kWh", e.target.value)
                  }
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
              </div>

              <div className="space-y-2">
                <Label>SFC Deviation (%)</Label>
                <Input
                  type="number"
                  value={form.sfc_deviation_percent}
                  disabled
                  className={getInputClass(!form.isEditing)}
                />
              </div>
            </div>
          </div>

          {/* Cost Analysis */}
          <div className="rounded-xl border p-4">
            <h4 className="mb-4 text-base font-semibold text-foreground">
              Cost Analysis
            </h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>Fuel Cost (Rs/Liter)</Label>
                <Input
                  type="number"
                  value={form.fuel_cost_rs_per_liter}
                  onChange={(e) =>
                    updateForm("fuel_cost_rs_per_liter", e.target.value)
                  }
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
              </div>

              <div className="space-y-2">
                <Label>Annual Fuel Cost (Rs)</Label>
                <Input
                  type="number"
                  value={form.annual_fuel_cost_rs}
                  disabled
                  className={getInputClass(!form.isEditing)}
                />
              </div>

              <div className="space-y-2">
                <Label>DG Cost Per kWh (Rs)</Label>
                <Input
                  type="number"
                  value={form.dg_cost_per_kWh_rs}
                  disabled
                  className={getInputClass(!form.isEditing)}
                />
              </div>

              <div className="space-y-2 ">
                <Label>Grid Cost Per kWh (Rs)</Label>
                <Input
                  type="number"
                  value={form.grid_cost_per_kWh_rs}
                  onChange={(e) =>
                    updateForm("grid_cost_per_kWh_rs", e.target.value)
                  }
                  disabled
                  className={getInputClass(!form.isEditing)}
                />
                <span className="text-xs text-gray-100 flex justify-center">
                  From {fromDate} - To {toDate}
                </span>
                <span className="text-xs text-gray-100 flex justify-center">
                  *this data is calculated on the basis of utility billing
                  records. Please fill 1 year data to get accurate data.
                </span>
              </div>
            </div>
          </div>

          {/* Efficiency */}
          <div className="rounded-xl border p-4">
            <h4 className="mb-4 text-base font-semibold text-foreground">
              Efficiency
            </h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Calculated Efficiency (%)</Label>
                <Input
                  type="number"
                  value={form.calculated_efficiency_percent}
                  disabled
                  className={getInputClass(true)}
                />
              </div>

              <div className="space-y-2">
                <Label>Manufacturer Efficiency (%)</Label>
                <Input
                  type="number"
                  value={form.manufacturer_efficiency_percent}
                  onChange={(e) =>
                    updateForm(
                      "manufacturer_efficiency_percent",
                      e.target.value,
                    )
                  }
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
              </div>

              <div className="space-y-2">
                <Label>Efficiency Deviation (%)</Label>
                <Input
                  type="number"
                  value={form.efficiency_deviation_percent}
                  disabled
                  className={getInputClass(true)}
                />
              </div>
            </div>
          </div>

          {/* Operating Conditions */}
          <div className="rounded-xl border p-4">
            <h4 className="mb-4 text-base font-semibold text-foreground">
              Operating Conditions
            </h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Exhaust Temperature (°C)</Label>
                <Input
                  type="number"
                  value={form.exhaust_temperature_C}
                  onChange={(e) =>
                    updateForm("exhaust_temperature_C", e.target.value)
                  }
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
              </div>

              <div className="space-y-2">
                <Label>Cooling Water Temperature (°C)</Label>
                <Input
                  type="number"
                  value={form.cooling_water_temperature_C}
                  onChange={(e) =>
                    updateForm("cooling_water_temperature_C", e.target.value)
                  }
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
              </div>

              <div className="space-y-2">
                <Label>Lube Oil Pressure (bar)</Label>
                <Input
                  type="number"
                  value={form.lube_oil_pressure_bar}
                  onChange={(e) =>
                    updateForm("lube_oil_pressure_bar", e.target.value)
                  }
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
              </div>

              <div className="space-y-2">
                <Label>Lube Oil Consumption (Liters/Year)</Label>
                <Input
                  type="number"
                  value={form.lube_oil_consumption_liters_per_year}
                  onChange={(e) =>
                    updateForm(
                      "lube_oil_consumption_liters_per_year",
                      e.target.value,
                    )
                  }
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
              </div>

              <div className="space-y-2">
                <Label>Total Operating Hours</Label>
                <Input
                  type="number"
                  value={form.total_operating_hours}
                  onChange={(e) =>
                    updateForm("total_operating_hours", e.target.value)
                  }
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
              </div>

              <div className="space-y-2">
                <Label>Hours Since Last Overhaul</Label>
                <Input
                  type="number"
                  value={form.hours_since_last_overhaul}
                  onChange={(e) =>
                    updateForm("hours_since_last_overhaul", e.target.value)
                  }
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
              </div>

              <div className="space-y-2">
                <Label>Air / Fuel Filter Condition</Label>
                <select
                  value={form.air_fuel_filter_condition}
                  onChange={(e) =>
                    updateForm("air_fuel_filter_condition", e.target.value)
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
            </div>

            <div className="mt-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.visible_smoke_or_abnormal_vibration}
                  onChange={(e) =>
                    updateForm(
                      "visible_smoke_or_abnormal_vibration",
                      e.target.checked,
                    )
                  }
                  disabled={!form.isEditing}
                  className={getInputClass(!form.isEditing)}
                />
                Visible Smoke or Abnormal Vibration
              </label>
            </div>
          </div>

          {/* Remarks */}
          <div className="rounded-xl border p-4">
            <h4 className="mb-4 text-base font-semibold text-foreground">
              Remarks
            </h4>
            <div className="space-y-2">
              <Label>Remarks / Notes</Label>
              <Textarea
                value={form.remarks}
                onChange={(e) => updateForm("remarks", e.target.value)}
                disabled={!form.isEditing}
                className={getInputClass(!form.isEditing)}
                rows={4}
                placeholder="Write any audit observations here..."
              />
            </div>
          </div>

          {/* Documents */}
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

            {form.existingDocuments.length > 0 && (
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
  );
}

"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
  useCreateHVACAuditMutation,
  useGetHVACAuditsQuery,
  useUpdateHVACAuditMutation,
} from "@/store/slices/hvacAuditApiSlice";
import { useGetFacilityByIdQuery } from "@/store/slices/facilityApiSlice";
import {
  downloadHVACAuditExcelTemplate,
  parseHVACAuditExcel,
  type HVACAuditExcelParsed,
} from "@/lib/hvac-audit-excel";
import { toastHandler } from "@/lib/toast";
import { toast } from "sonner";
import { useAppSelector } from "@/store/hooks";
import { UTILITY_AUDIT_STEP_IDS } from "@/lib/utility-audit-steps";
import { AuditStepSubmitBar } from "@/components/utility-audit/audit-step-submit-bar";
import { AuditStepLockedOverlay } from "@/components/utility-audit/audit-step-locked-overlay";
import { AuditNoDataEmptyState } from "@/components/utility-audit/audit-no-data-empty-state";
import type { AuditStepNoDataEntry } from "@/store/slices/utilityApiSlice";

interface HVACAuditSectionProps {
  facilityId: string;
  utilityAccountId: string;
  auditStepLocked?: boolean;
  auditStepNoData?: Record<string, AuditStepNoDataEntry>;
}

type ChecklistItemState = {
  available: boolean;
  remarks: string;
};

type EquipmentItemState = {
  equipment_name: string;
  type: string;
  capacity: string;
  power_rating_kW: string;
  quantity: string;
  remarks: string;
};

type ChillerReadingState = {
  chiller_load_TR: string;
  power_input_kW: string;
  chilled_water_in_temp: string;
  chilled_water_out_temp: string;
  condenser_water_in_temp: string;
  condenser_water_out_temp: string;
};

type AuxiliaryComponentState = {
  name: string;
  power_kW: string;
};

type CoolingTowerReadingState = {
  inlet_temp: string;
  outlet_temp: string;
  ambient_temp: string;
};

type ExistingDocument = {
  fileUrl: string;
  fileType: "image" | "pdf";
  fileName?: string;
};

type FacilityPrefill = {
  name?: string;
  address?: string;
  client_representative?: string;
  client_contact_number?: string;
  client_email?: string;
  facility_type?: string;
};

type DocumentsRecordsState = {
  single_line_diagram_electrical: ChecklistItemState;
  hvac_layout_piping_drawing: ChecklistItemState;
  chiller_operation_maintenance_log: ChecklistItemState;
  water_treatment_records: ChecklistItemState;
  cooling_tower_maintenance_record: ChecklistItemState;
  hvac_equipment_capacity_list: ChecklistItemState;
  bms_setpoints_schedule: ChecklistItemState;
};

type HVACAuditFormState = {
  id?: string;
  localId: string;
  isNew: boolean;
  isEditing: boolean;

  pre_audit_information: {
    facility_name: string;
    location_address: string;
    client_contact_person: string;
    contact_number_email: string;
    type_of_facility: string;
    audit_dates: string[];
    auditor_team_members_names: string[];
    total_operating_hours_per_day: string;
    hvac_operating_hours_per_day: string;
    season_ambient_conditions: string;
  };

  documents_records_to_collect: DocumentsRecordsState;

  hvac_equipment_register: EquipmentItemState[];

  chiller_field_test: {
    readings: ChillerReadingState[];
    average: {
      avg_load_TR: string;
      avg_power_kW: string;
    };
  };

  auxiliary_power: {
    components: AuxiliaryComponentState[];
    total_auxiliary_power_used_kW: string;
  };

  cooling_tower_quick_test: {
    readings: CoolingTowerReadingState[];
    average: {
      avg_inlet_temp: string;
      avg_outlet_temp: string;
    };
  };

  summary: {
    average_cooling_produced_TR: string;
    average_chiller_power_used_kW: string;
    total_auxiliary_power_used_kW: string;
    total_plant_power_kW: string;
    plant_efficiency_kW_per_TR: string;
    coefficient_of_performance: string;
  };

  audit_date: string;
  auditor_id: string;

  existingDocuments: ExistingDocument[];
  newDocuments: File[];
};

const editableInputClass =
  "border-input bg-background text-foreground focus:border-primary focus:ring-1 focus:ring-primary";

const autoInputClass =
  "cursor-not-allowed border border-dashed border-sky-300 bg-sky-100 text-sky-900 opacity-100 dark:border-sky-700 dark:bg-sky-950/60 dark:text-sky-100";

const getInputClass = (disabled: boolean) =>
  disabled ? autoInputClass : editableInputClass;

const createChecklistItem = (): ChecklistItemState => ({
  available: false,
  remarks: "",
});

const createDocumentsChecklist = (): DocumentsRecordsState => ({
  single_line_diagram_electrical: createChecklistItem(),
  hvac_layout_piping_drawing: createChecklistItem(),
  chiller_operation_maintenance_log: createChecklistItem(),
  water_treatment_records: createChecklistItem(),
  cooling_tower_maintenance_record: createChecklistItem(),
  hvac_equipment_capacity_list: createChecklistItem(),
  bms_setpoints_schedule: createChecklistItem(),
});

const mergeDocumentsChecklist = (
  checklist?: Partial<DocumentsRecordsState> | null,
): DocumentsRecordsState => {
  const defaults = createDocumentsChecklist();

  return {
    single_line_diagram_electrical: {
      ...defaults.single_line_diagram_electrical,
      ...(checklist?.single_line_diagram_electrical || {}),
    },
    hvac_layout_piping_drawing: {
      ...defaults.hvac_layout_piping_drawing,
      ...(checklist?.hvac_layout_piping_drawing || {}),
    },
    chiller_operation_maintenance_log: {
      ...defaults.chiller_operation_maintenance_log,
      ...(checklist?.chiller_operation_maintenance_log || {}),
    },
    water_treatment_records: {
      ...defaults.water_treatment_records,
      ...(checklist?.water_treatment_records || {}),
    },
    cooling_tower_maintenance_record: {
      ...defaults.cooling_tower_maintenance_record,
      ...(checklist?.cooling_tower_maintenance_record || {}),
    },
    hvac_equipment_capacity_list: {
      ...defaults.hvac_equipment_capacity_list,
      ...(checklist?.hvac_equipment_capacity_list || {}),
    },
    bms_setpoints_schedule: {
      ...defaults.bms_setpoints_schedule,
      ...(checklist?.bms_setpoints_schedule || {}),
    },
  };
};

const createEquipmentItem = (): EquipmentItemState => ({
  equipment_name: "",
  type: "",
  capacity: "",
  power_rating_kW: "",
  quantity: "",
  remarks: "",
});

const createChillerReading = (): ChillerReadingState => ({
  chiller_load_TR: "",
  power_input_kW: "",
  chilled_water_in_temp: "",
  chilled_water_out_temp: "",
  condenser_water_in_temp: "",
  condenser_water_out_temp: "",
});

const createAuxiliaryComponent = (): AuxiliaryComponentState => ({
  name: "",
  power_kW: "",
});

const createCoolingTowerReading = (): CoolingTowerReadingState => ({
  inlet_temp: "",
  outlet_temp: "",
  ambient_temp: "",
});

const getFacilityContactValue = (facility?: FacilityPrefill) => {
  const phone = facility?.client_contact_number?.trim() || "";
  const email = facility?.client_email?.trim() || "";

  if (phone && email) return `${phone} / ${email}`;
  if (phone) return phone;
  if (email) return email;
  return "";
};

const createEmptyForm = (facility?: FacilityPrefill): HVACAuditFormState => ({
  localId: `new-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  isNew: true,
  isEditing: true,

  pre_audit_information: {
    facility_name: facility?.name || "",
    location_address: facility?.address || "",
    client_contact_person: facility?.client_representative || "",
    contact_number_email: getFacilityContactValue(facility),
    type_of_facility: facility?.facility_type || "",
    audit_dates: [""],
    auditor_team_members_names: [""],
    total_operating_hours_per_day: "",
    hvac_operating_hours_per_day: "",
    season_ambient_conditions: "",
  },

  documents_records_to_collect: createDocumentsChecklist(),

  hvac_equipment_register: [createEquipmentItem()],

  chiller_field_test: {
    readings: [createChillerReading()],
    average: {
      avg_load_TR: "",
      avg_power_kW: "",
    },
  },

  auxiliary_power: {
    components: [createAuxiliaryComponent()],
    total_auxiliary_power_used_kW: "",
  },

  cooling_tower_quick_test: {
    readings: [createCoolingTowerReading()],
    average: {
      avg_inlet_temp: "",
      avg_outlet_temp: "",
    },
  },

  summary: {
    average_cooling_produced_TR: "",
    average_chiller_power_used_kW: "",
    total_auxiliary_power_used_kW: "",
    total_plant_power_kW: "",
    plant_efficiency_kW_per_TR: "",
    coefficient_of_performance: "",
  },

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

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value) || value.length === 0) return [""];
  return value.map((item) => toStringValue(item));
};

function auditToForm(record: any): HVACAuditFormState {
  return {
    id: record._id,
    localId: record._id,
    isNew: false,
    isEditing: false,

    pre_audit_information: {
      facility_name: record.pre_audit_information?.facility_name || "",
      location_address: record.pre_audit_information?.location_address || "",
      client_contact_person:
        record.pre_audit_information?.client_contact_person || "",
      contact_number_email:
        record.pre_audit_information?.contact_number_email || "",
      type_of_facility: record.pre_audit_information?.type_of_facility || "",
      audit_dates: toStringArray(
        record.pre_audit_information?.audit_dates?.map((d: string) =>
          toDateInput(d),
        ),
      ),
      auditor_team_members_names: toStringArray(
        record.pre_audit_information?.auditor_team_members_names,
      ),
      total_operating_hours_per_day: toStringValue(
        record.pre_audit_information?.total_operating_hours_per_day,
      ),
      hvac_operating_hours_per_day: toStringValue(
        record.pre_audit_information?.hvac_operating_hours_per_day,
      ),
      season_ambient_conditions:
        record.pre_audit_information?.season_ambient_conditions || "",
    },

    documents_records_to_collect: mergeDocumentsChecklist(
      record.documents_records_to_collect,
    ),

    hvac_equipment_register:
      record.hvac_equipment_register?.length > 0
        ? record.hvac_equipment_register.map((item: any) => ({
            equipment_name: item.equipment_name || "",
            type: item.type || "",
            capacity: toStringValue(item.capacity),
            power_rating_kW: toStringValue(item.power_rating_kW),
            quantity: toStringValue(item.quantity),
            remarks: item.remarks || "",
          }))
        : [createEquipmentItem()],

    chiller_field_test: {
      readings:
        record.chiller_field_test?.readings?.length > 0
          ? record.chiller_field_test.readings.map((item: any) => ({
              chiller_load_TR: toStringValue(item.chiller_load_TR),
              power_input_kW: toStringValue(item.power_input_kW),
              chilled_water_in_temp: toStringValue(item.chilled_water_in_temp),
              chilled_water_out_temp: toStringValue(
                item.chilled_water_out_temp,
              ),
              condenser_water_in_temp: toStringValue(
                item.condenser_water_in_temp,
              ),
              condenser_water_out_temp: toStringValue(
                item.condenser_water_out_temp,
              ),
            }))
          : [createChillerReading()],
      average: {
        avg_load_TR: toStringValue(
          record.chiller_field_test?.average?.avg_load_TR,
        ),
        avg_power_kW: toStringValue(
          record.chiller_field_test?.average?.avg_power_kW,
        ),
      },
    },

    auxiliary_power: {
      components:
        record.auxiliary_power?.components?.length > 0
          ? record.auxiliary_power.components.map((item: any) => ({
              name: item.name || "",
              power_kW: toStringValue(item.power_kW),
            }))
          : [createAuxiliaryComponent()],
      total_auxiliary_power_used_kW: toStringValue(
        record.auxiliary_power?.total_auxiliary_power_used_kW,
      ),
    },

    cooling_tower_quick_test: {
      readings:
        record.cooling_tower_quick_test?.readings?.length > 0
          ? record.cooling_tower_quick_test.readings.map((item: any) => ({
              inlet_temp: toStringValue(item.inlet_temp),
              outlet_temp: toStringValue(item.outlet_temp),
              ambient_temp: toStringValue(item.ambient_temp),
            }))
          : [createCoolingTowerReading()],
      average: {
        avg_inlet_temp: toStringValue(
          record.cooling_tower_quick_test?.average?.avg_inlet_temp,
        ),
        avg_outlet_temp: toStringValue(
          record.cooling_tower_quick_test?.average?.avg_outlet_temp,
        ),
      },
    },

    summary: {
      average_cooling_produced_TR: toStringValue(
        record.summary?.average_cooling_produced_TR,
      ),
      average_chiller_power_used_kW: toStringValue(
        record.summary?.average_chiller_power_used_kW,
      ),
      total_auxiliary_power_used_kW: toStringValue(
        record.summary?.total_auxiliary_power_used_kW,
      ),
      total_plant_power_kW: toStringValue(record.summary?.total_plant_power_kW),
      plant_efficiency_kW_per_TR: toStringValue(
        record.summary?.plant_efficiency_kW_per_TR,
      ),
      coefficient_of_performance: toStringValue(
        record.summary?.coefficient_of_performance,
      ),
    },

    audit_date: toDateInput(record.audit_date),
    auditor_id: record.auditor_id?._id || record.auditor_id || "",

    existingDocuments: record.documents || [],
    newDocuments: [],
  };
}

const toNumber = (value: string) => {
  if (!value || value.trim() === "") return undefined;
  const num = Number(value);
  return Number.isNaN(num) ? undefined : num;
};

const averageOf = (values: string[]) => {
  const nums = values
    .map((item) => Number(item))
    .filter((num) => !Number.isNaN(num) && num > 0);

  if (nums.length === 0) return "";
  return String(
    Number((nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2)),
  );
};

const updateComputedValues = (form: HVACAuditFormState): HVACAuditFormState => {
  const avgLoad = averageOf(
    form.chiller_field_test.readings.map((r) => r.chiller_load_TR),
  );
  const avgPower = averageOf(
    form.chiller_field_test.readings.map((r) => r.power_input_kW),
  );
  const avgInlet = averageOf(
    form.cooling_tower_quick_test.readings.map((r) => r.inlet_temp),
  );
  const avgOutlet = averageOf(
    form.cooling_tower_quick_test.readings.map((r) => r.outlet_temp),
  );

  const auxTotal = form.auxiliary_power.components
    .map((c) => Number(c.power_kW))
    .filter((n) => !Number.isNaN(n))
    .reduce((sum, n) => sum + n, 0);

  const avgLoadNum = toNumber(avgLoad);
  const avgPowerNum = toNumber(avgPower);
  const auxTotalNum = auxTotal || 0;

  const totalPlantPower =
    avgPowerNum !== undefined
      ? Number((avgPowerNum + auxTotalNum).toFixed(2))
      : undefined;

  const plantEfficiency =
    totalPlantPower !== undefined && avgLoadNum !== undefined && avgLoadNum > 0
      ? Number((totalPlantPower / avgLoadNum).toFixed(2))
      : undefined;

  const cop =
    avgPowerNum !== undefined && avgPowerNum > 0 && avgLoadNum !== undefined
      ? Number(((avgLoadNum * 3.517) / avgPowerNum).toFixed(2))
      : undefined;

  return {
    ...form,
    documents_records_to_collect: mergeDocumentsChecklist(
      form.documents_records_to_collect,
    ),
    chiller_field_test: {
      ...form.chiller_field_test,
      average: {
        avg_load_TR: avgLoad,
        avg_power_kW: avgPower,
      },
    },
    auxiliary_power: {
      ...form.auxiliary_power,
      total_auxiliary_power_used_kW:
        auxTotal > 0 ? String(Number(auxTotal.toFixed(2))) : "",
    },
    cooling_tower_quick_test: {
      ...form.cooling_tower_quick_test,
      average: {
        avg_inlet_temp: avgInlet,
        avg_outlet_temp: avgOutlet,
      },
    },
    summary: {
      ...form.summary,
      average_cooling_produced_TR: avgLoad,
      average_chiller_power_used_kW: avgPower,
      total_auxiliary_power_used_kW:
        auxTotal > 0 ? String(Number(auxTotal.toFixed(2))) : "",
      total_plant_power_kW:
        totalPlantPower !== undefined ? String(totalPlantPower) : "",
      plant_efficiency_kW_per_TR:
        plantEfficiency !== undefined ? String(plantEfficiency) : "",
      coefficient_of_performance: cop !== undefined ? String(cop) : "",
    },
  };
};

function applyHVACExcelParsed(
  form: HVACAuditFormState,
  parsed: HVACAuditExcelParsed,
): HVACAuditFormState {
  let next: HVACAuditFormState = { ...form };

  if (parsed.audit_date !== undefined) {
    next = { ...next, audit_date: parsed.audit_date };
  }

  if (parsed.pre_audit_information) {
    const p = parsed.pre_audit_information;
    next = {
      ...next,
      pre_audit_information: {
        ...next.pre_audit_information,
        ...p,
        audit_dates:
          p.audit_dates !== undefined
            ? p.audit_dates
            : next.pre_audit_information.audit_dates,
        auditor_team_members_names:
          p.auditor_team_members_names !== undefined
            ? p.auditor_team_members_names
            : next.pre_audit_information.auditor_team_members_names,
      },
    };
  }

  if (parsed.documents_records_to_collect) {
    const merged = { ...next.documents_records_to_collect };
    for (const [k, v] of Object.entries(parsed.documents_records_to_collect)) {
      const key = k as keyof DocumentsRecordsState;
      if (!v) continue;
      merged[key] = {
        available:
          v.available !== undefined
            ? v.available
            : merged[key].available,
        remarks:
          v.remarks !== undefined ? v.remarks : merged[key].remarks,
      };
    }
    next = {
      ...next,
      documents_records_to_collect: mergeDocumentsChecklist(merged),
    };
  }

  if (parsed.hvac_equipment_register !== undefined) {
    next.hvac_equipment_register =
      parsed.hvac_equipment_register.length > 0
        ? parsed.hvac_equipment_register
        : [createEquipmentItem()];
  }

  if (parsed.chiller_field_test?.readings !== undefined) {
    next.chiller_field_test = {
      ...next.chiller_field_test,
      readings:
        parsed.chiller_field_test.readings.length > 0
          ? parsed.chiller_field_test.readings
          : [createChillerReading()],
    };
  }

  if (parsed.auxiliary_power?.components !== undefined) {
    next.auxiliary_power = {
      ...next.auxiliary_power,
      components:
        parsed.auxiliary_power.components.length > 0
          ? parsed.auxiliary_power.components
          : [createAuxiliaryComponent()],
    };
  }

  if (parsed.cooling_tower_quick_test?.readings !== undefined) {
    next.cooling_tower_quick_test = {
      ...next.cooling_tower_quick_test,
      readings:
        parsed.cooling_tower_quick_test.readings.length > 0
          ? parsed.cooling_tower_quick_test.readings
          : [createCoolingTowerReading()],
    };
  }

  if (parsed.summary) {
    next = {
      ...next,
      summary: { ...next.summary, ...parsed.summary },
    };
  }

  return updateComputedValues(next);
}

export function HVACAuditSection({
  facilityId,
  utilityAccountId,
  auditStepLocked = false,
  auditStepNoData,
}: HVACAuditSectionProps) {
  const user = useAppSelector((state) => state.auth.user);
  const canViewDocuments = user?.role === "admin";
  const isAdmin = user?.role === "admin";
  const noDataDeclared = Boolean(
    auditStepNoData?.[UTILITY_AUDIT_STEP_IDS.HVAC]?.declared_at,
  );
  const { data, isLoading, refetch } = useGetHVACAuditsQuery({
    utility_account_id: utilityAccountId,
  });

  const { data: facilityResponse } = useGetFacilityByIdQuery(facilityId, {
    skip: !facilityId,
  });

  const facility = facilityResponse?.data?.facility;

  const [createHVACAudit, { isLoading: isCreating }] =
    useCreateHVACAuditMutation();

  const [updateHVACAudit, { isLoading: isUpdating }] =
    useUpdateHVACAuditMutation();

  const hvacAudits = useMemo(() => data?.data || [], [data]);
  const [forms, setForms] = useState<HVACAuditFormState[]>([]);
  const [excelImporting, setExcelImporting] = useState(false);
  const [backendError, setBackendError] = useState<string>("");

  useEffect(() => {
    const mapped = hvacAudits
      .map(auditToForm)
      .sort(
        (a, b) =>
          new Date(b.audit_date || 0).getTime() -
          new Date(a.audit_date || 0).getTime(),
      );

    setForms((prev) => {
      const unsavedForms = prev.filter((item) => item.isNew);
      return [...unsavedForms, ...mapped];
    });
  }, [hvacAudits]);

  useEffect(() => {
    if (!facility) return;

    setForms((prev) =>
      prev.map((form) => ({
        ...form,
        pre_audit_information: {
          ...form.pre_audit_information,
          facility_name: facility.name || "",
          location_address: facility.address || "",
          client_contact_person: facility.client_representative || "",
          contact_number_email: getFacilityContactValue(facility),
          type_of_facility: facility.facility_type || "",
        },
      })),
    );
  }, [facility]);
  const facilityAutoInputClass = getInputClass(true);

  const replaceForm = (localId: string, nextForm: HVACAuditFormState) => {
    setForms((prev) =>
      prev.map((form) => (form.localId === localId ? nextForm : form)),
    );
  };

  const updateForm = (
    localId: string,
    updater: (form: HVACAuditFormState) => HVACAuditFormState,
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
    setForms((prev) => [createEmptyForm(facility), ...prev]);
  };

  const handleCancel = (form: HVACAuditFormState) => {
    if (form.isNew) {
      removeForm(form.localId);
      return;
    }

    const original = hvacAudits.find((item: any) => item._id === form.id);
    if (!original) return;

    replaceForm(form.localId, auditToForm(original));
  };

  const handleDownloadHVACExcel = (form: HVACAuditFormState) => {
    downloadHVACAuditExcelTemplate({
      audit_date: form.audit_date,
      pre_audit_information: form.pre_audit_information,
      documents_records_to_collect: form.documents_records_to_collect,
      hvac_equipment_register: form.hvac_equipment_register,
      chiller_field_test: form.chiller_field_test,
      auxiliary_power: form.auxiliary_power,
      cooling_tower_quick_test: form.cooling_tower_quick_test,
      summary: form.summary,
    });
  };

  const handleHVACExcelImport = async (
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
      const parsed = await parseHVACAuditExcel(file);
      if (!Object.keys(parsed).length) {
        toast.error(
          "No recognized data found. Use the downloaded multi-sheet template.",
        );
        return;
      }

      setForms((prev) =>
        prev.map((f) =>
          f.localId === localId
            ? { ...applyHVACExcelParsed(f, parsed), isEditing: true }
            : f,
        ),
      );
      toast.success("HVAC audit updated from Excel.");
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
      "Something went wrong while saving HVAC audit."
    );
  };

  const handleSave = async (form: HVACAuditFormState) => {
    setBackendError("");

    const mergedChecklist = mergeDocumentsChecklist(
      form.documents_records_to_collect,
    );

    const payload = {
      facility_id: facilityId,
      utility_account_id: utilityAccountId,
      pre_audit_information: {
        ...form.pre_audit_information,
        audit_dates: form.pre_audit_information.audit_dates.filter(Boolean),
        auditor_team_members_names:
          form.pre_audit_information.auditor_team_members_names.filter(Boolean),
        total_operating_hours_per_day: toNumber(
          form.pre_audit_information.total_operating_hours_per_day,
        ),
        hvac_operating_hours_per_day: toNumber(
          form.pre_audit_information.hvac_operating_hours_per_day,
        ),
      },
      documents_records_to_collect: mergedChecklist,
      hvac_equipment_register: form.hvac_equipment_register.map((item) => ({
        equipment_name: item.equipment_name || undefined,
        type: item.type || undefined,
        capacity: toNumber(item.capacity),
        power_rating_kW: toNumber(item.power_rating_kW),
        quantity: toNumber(item.quantity),
        remarks: item.remarks || undefined,
      })),
      chiller_field_test: {
        readings: form.chiller_field_test.readings.map((item) => ({
          chiller_load_TR: toNumber(item.chiller_load_TR),
          power_input_kW: toNumber(item.power_input_kW),
          chilled_water_in_temp: toNumber(item.chilled_water_in_temp),
          chilled_water_out_temp: toNumber(item.chilled_water_out_temp),
          condenser_water_in_temp: toNumber(item.condenser_water_in_temp),
          condenser_water_out_temp: toNumber(item.condenser_water_out_temp),
        })),
        average: {
          avg_load_TR: toNumber(form.chiller_field_test.average.avg_load_TR),
          avg_power_kW: toNumber(form.chiller_field_test.average.avg_power_kW),
        },
      },
      auxiliary_power: {
        components: form.auxiliary_power.components.map((item) => ({
          name: item.name || undefined,
          power_kW: toNumber(item.power_kW),
        })),
        total_auxiliary_power_used_kW: toNumber(
          form.auxiliary_power.total_auxiliary_power_used_kW,
        ),
      },
      cooling_tower_quick_test: {
        readings: form.cooling_tower_quick_test.readings.map((item) => ({
          inlet_temp: toNumber(item.inlet_temp),
          outlet_temp: toNumber(item.outlet_temp),
          ambient_temp: toNumber(item.ambient_temp),
        })),
        average: {
          avg_inlet_temp: toNumber(
            form.cooling_tower_quick_test.average.avg_inlet_temp,
          ),
          avg_outlet_temp: toNumber(
            form.cooling_tower_quick_test.average.avg_outlet_temp,
          ),
        },
      },
      summary: {
        average_cooling_produced_TR: toNumber(
          form.summary.average_cooling_produced_TR,
        ),
        average_chiller_power_used_kW: toNumber(
          form.summary.average_chiller_power_used_kW,
        ),
        total_auxiliary_power_used_kW: toNumber(
          form.summary.total_auxiliary_power_used_kW,
        ),
        total_plant_power_kW: toNumber(form.summary.total_plant_power_kW),
        plant_efficiency_kW_per_TR: toNumber(
          form.summary.plant_efficiency_kW_per_TR,
        ),
        coefficient_of_performance: toNumber(
          form.summary.coefficient_of_performance,
        ),
      },
      audit_date: form.audit_date || undefined,
      auditor_id: form.auditor_id || undefined,
      documents: form.newDocuments.length ? form.newDocuments : undefined,
    };

    try {
      await toastHandler({
        action: () => {
          if (form.isNew) {
            return createHVACAudit(payload as any).unwrap();
          }

          if (form.id) {
            return updateHVACAudit({
              id: form.id,
              ...payload,
            } as any).unwrap();
          }

          return Promise.reject(new Error("HVAC audit ID is missing."));
        },
        loading: form.isNew
          ? "Creating HVAC audit..."
          : "Updating HVAC audit...",
        success: form.isNew
          ? "HVAC audit created successfully"
          : "HVAC audit updated successfully",
      });

      setBackendError("");
      await refetch();
    } catch (error: any) {
      const message = getErrorMessage(error);
      setBackendError(message);
      console.error("Failed to save HVAC audit:", error);
    }
  };

  const saving = isCreating || isUpdating;

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground">
        Loading HVAC audits...
      </div>
    );
  }

  const checklistFields: {
    key: keyof HVACAuditFormState["documents_records_to_collect"];
    label: string;
  }[] = [
    {
      key: "single_line_diagram_electrical",
      label: "Single Line Diagram Electrical",
    },
    {
      key: "hvac_layout_piping_drawing",
      label: "HVAC Layout / Piping Drawing",
    },
    {
      key: "chiller_operation_maintenance_log",
      label: "Chiller Operation & Maintenance Log",
    },
    {
      key: "water_treatment_records",
      label: "Water Treatment Records",
    },
    {
      key: "cooling_tower_maintenance_record",
      label: "Cooling Tower Maintenance Record",
    },
    {
      key: "hvac_equipment_capacity_list",
      label: "HVAC Equipment Capacity List",
    },
    {
      key: "bms_setpoints_schedule",
      label: "BMS Setpoints Schedule",
    },
  ];

  return (
    <div className="relative space-y-4">
      <AuditStepSubmitBar
        utilityAccountId={utilityAccountId}
        stepId={UTILITY_AUDIT_STEP_IDS.HVAC}
        auditStepLocked={auditStepLocked}
      />

      <div className="relative">
        <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-base font-medium text-foreground sm:text-lg">
          HVAC Audits
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
          stepId={UTILITY_AUDIT_STEP_IDS.HVAC}
          auditStepLocked={auditStepLocked}
          isAdmin={isAdmin}
          noDataDeclared={noDataDeclared}
        />
      ) : (
        forms.map((form, index) => (
          <Card key={form.localId}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                HVAC Audit {forms.length - index}
                {form.isNew ? " (New)" : ""}
              </CardTitle>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  id={`hvac-audit-excel-import-${form.localId}`}
                  type="file"
                  accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  className="hidden"
                  onChange={(e) => handleHVACExcelImport(form.localId, e)}
                  disabled={excelImporting}
                />

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadHVACExcel(form)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Excel template
                </Button>

                <Label
                  htmlFor={`hvac-audit-excel-import-${form.localId}`}
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
                  <Label>Facility Name</Label>
                  <Input
                    value={form.pre_audit_information.facility_name}
                    className={facilityAutoInputClass}
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <Label>Location Address</Label>
                  <Input
                    value={form.pre_audit_information.location_address}
                    className={facilityAutoInputClass}
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <Label>Client Contact Person</Label>
                  <Input
                    value={form.pre_audit_information.client_contact_person}
                    className={facilityAutoInputClass}
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <Label>Contact Number / Email</Label>
                  <Input
                    value={form.pre_audit_information.contact_number_email}
                    className={facilityAutoInputClass}
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <Label>Type of Facility</Label>
                  <Input
                    value={form.pre_audit_information.type_of_facility}
                    onChange={(e) =>
                      updateForm(form.localId, (prev) => ({
                        ...prev,
                        pre_audit_information: {
                          ...prev.pre_audit_information,
                          type_of_facility: e.target.value,
                        },
                      }))
                    }
                    className={getInputClass(!form.isEditing)}
                    disabled={!form.isEditing}
                  />
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
                    className={getInputClass(!form.isEditing)}
                    disabled={!form.isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Total Operating Hours / Day</Label>
                  <Input
                    type="number"
                    value={
                      form.pre_audit_information.total_operating_hours_per_day
                    }
                    onChange={(e) =>
                      updateForm(form.localId, (prev) => ({
                        ...prev,
                        pre_audit_information: {
                          ...prev.pre_audit_information,
                          total_operating_hours_per_day: e.target.value,
                        },
                      }))
                    }
                    className={getInputClass(!form.isEditing)}
                    disabled={!form.isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label>HVAC Operating Hours / Day</Label>
                  <Input
                    type="number"
                    value={
                      form.pre_audit_information.hvac_operating_hours_per_day
                    }
                    onChange={(e) =>
                      updateForm(form.localId, (prev) => ({
                        ...prev,
                        pre_audit_information: {
                          ...prev.pre_audit_information,
                          hvac_operating_hours_per_day: e.target.value,
                        },
                      }))
                    }
                    className={getInputClass(!form.isEditing)}
                    disabled={!form.isEditing}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Season / Ambient Conditions</Label>
                <Textarea
                  value={form.pre_audit_information.season_ambient_conditions}
                  onChange={(e) =>
                    updateForm(form.localId, (prev) => ({
                      ...prev,
                      pre_audit_information: {
                        ...prev.pre_audit_information,
                        season_ambient_conditions: e.target.value,
                      },
                    }))
                  }
                  className={getInputClass(!form.isEditing)}
                  disabled={!form.isEditing}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base">Audit Dates</Label>
                  {form.isEditing && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        updateForm(form.localId, (prev) => ({
                          ...prev,
                          pre_audit_information: {
                            ...prev.pre_audit_information,
                            audit_dates: [
                              ...prev.pre_audit_information.audit_dates,
                              "",
                            ],
                          },
                        }))
                      }
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Date
                    </Button>
                  )}
                </div>

                {form.pre_audit_information.audit_dates.map((date, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) =>
                        updateForm(form.localId, (prev) => {
                          const next = [
                            ...prev.pre_audit_information.audit_dates,
                          ];
                          next[idx] = e.target.value;
                          return {
                            ...prev,
                            pre_audit_information: {
                              ...prev.pre_audit_information,
                              audit_dates: next,
                            },
                          };
                        })
                      }
                      className={getInputClass(!form.isEditing)}
                      disabled={!form.isEditing}
                    />
                    {form.isEditing &&
                      form.pre_audit_information.audit_dates.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            updateForm(form.localId, (prev) => ({
                              ...prev,
                              pre_audit_information: {
                                ...prev.pre_audit_information,
                                audit_dates:
                                  prev.pre_audit_information.audit_dates.filter(
                                    (_, i) => i !== idx,
                                  ),
                              },
                            }))
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base">Auditor Team Members</Label>
                  {form.isEditing && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        updateForm(form.localId, (prev) => ({
                          ...prev,
                          pre_audit_information: {
                            ...prev.pre_audit_information,
                            auditor_team_members_names: [
                              ...prev.pre_audit_information
                                .auditor_team_members_names,
                              "",
                            ],
                          },
                        }))
                      }
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Member
                    </Button>
                  )}
                </div>

                {form.pre_audit_information.auditor_team_members_names.map(
                  (member, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        value={member}
                        onChange={(e) =>
                          updateForm(form.localId, (prev) => {
                            const next = [
                              ...prev.pre_audit_information
                                .auditor_team_members_names,
                            ];
                            next[idx] = e.target.value;
                            return {
                              ...prev,
                              pre_audit_information: {
                                ...prev.pre_audit_information,
                                auditor_team_members_names: next,
                              },
                            };
                          })
                        }
                        className={getInputClass(!form.isEditing)}
                        disabled={!form.isEditing}
                        placeholder={`Member ${idx + 1}`}
                      />
                      {form.isEditing &&
                        form.pre_audit_information.auditor_team_members_names
                          .length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              updateForm(form.localId, (prev) => ({
                                ...prev,
                                pre_audit_information: {
                                  ...prev.pre_audit_information,
                                  auditor_team_members_names:
                                    prev.pre_audit_information.auditor_team_members_names.filter(
                                      (_, i) => i !== idx,
                                    ),
                                },
                              }))
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                    </div>
                  ),
                )}
              </div>

              <div className="space-y-4">
                <Label className="text-base">Documents Checklist</Label>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {checklistFields.map((item) => (
                    <div
                      key={item.key}
                      className="space-y-3 rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={
                            form.documents_records_to_collect[item.key]
                              ?.available || false
                          }
                          onCheckedChange={(checked) =>
                            updateForm(form.localId, (prev) => ({
                              ...prev,
                              documents_records_to_collect:
                                mergeDocumentsChecklist({
                                  ...prev.documents_records_to_collect,
                                  [item.key]: {
                                    ...prev.documents_records_to_collect[
                                      item.key
                                    ],
                                    available: Boolean(checked),
                                  },
                                }),
                            }))
                          }
                          className={getInputClass(!form.isEditing)}
                          disabled={!form.isEditing}
                        />
                        <Label>{item.label}</Label>
                      </div>
                      <Textarea
                        placeholder="Remarks"
                        value={
                          form.documents_records_to_collect[item.key]
                            ?.remarks || ""
                        }
                        onChange={(e) =>
                          updateForm(form.localId, (prev) => ({
                            ...prev,
                            documents_records_to_collect:
                              mergeDocumentsChecklist({
                                ...prev.documents_records_to_collect,
                                [item.key]: {
                                  ...prev.documents_records_to_collect[
                                    item.key
                                  ],
                                  remarks: e.target.value,
                                },
                              }),
                          }))
                        }
                        className={getInputClass(!form.isEditing)}
                        disabled={!form.isEditing}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base">HVAC Equipment Register</Label>
                  {form.isEditing && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        updateForm(form.localId, (prev) => ({
                          ...prev,
                          hvac_equipment_register: [
                            ...prev.hvac_equipment_register,
                            createEquipmentItem(),
                          ],
                        }))
                      }
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Equipment
                    </Button>
                  )}
                </div>

                {form.hvac_equipment_register.map((item, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 gap-4 rounded-lg border p-4 md:grid-cols-3"
                  >
                    <div className="space-y-2">
                      <Label>Equipment Name</Label>
                      <Input
                        value={item.equipment_name}
                        onChange={(e) =>
                          updateForm(form.localId, (prev) => {
                            const next = [...prev.hvac_equipment_register];
                            next[idx] = {
                              ...next[idx],
                              equipment_name: e.target.value,
                            };
                            return { ...prev, hvac_equipment_register: next };
                          })
                        }
                        className={getInputClass(!form.isEditing)}
                        disabled={!form.isEditing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Input
                        value={item.type}
                        onChange={(e) =>
                          updateForm(form.localId, (prev) => {
                            const next = [...prev.hvac_equipment_register];
                            next[idx] = { ...next[idx], type: e.target.value };
                            return { ...prev, hvac_equipment_register: next };
                          })
                        }
                        className={getInputClass(!form.isEditing)}
                        disabled={!form.isEditing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Capacity</Label>
                      <Input
                        type="number"
                        value={item.capacity}
                        onChange={(e) =>
                          updateForm(form.localId, (prev) => {
                            const next = [...prev.hvac_equipment_register];
                            next[idx] = {
                              ...next[idx],
                              capacity: e.target.value,
                            };
                            return { ...prev, hvac_equipment_register: next };
                          })
                        }
                        className={getInputClass(!form.isEditing)}
                        disabled={!form.isEditing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Power Rating (kW)</Label>
                      <Input
                        type="number"
                        value={item.power_rating_kW}
                        onChange={(e) =>
                          updateForm(form.localId, (prev) => {
                            const next = [...prev.hvac_equipment_register];
                            next[idx] = {
                              ...next[idx],
                              power_rating_kW: e.target.value,
                            };
                            return { ...prev, hvac_equipment_register: next };
                          })
                        }
                        className={getInputClass(!form.isEditing)}
                        disabled={!form.isEditing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          updateForm(form.localId, (prev) => {
                            const next = [...prev.hvac_equipment_register];
                            next[idx] = {
                              ...next[idx],
                              quantity: e.target.value,
                            };
                            return { ...prev, hvac_equipment_register: next };
                          })
                        }
                        className={getInputClass(!form.isEditing)}
                        disabled={!form.isEditing}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-3">
                      <Label>Remarks</Label>
                      <Textarea
                        value={item.remarks}
                        onChange={(e) =>
                          updateForm(form.localId, (prev) => {
                            const next = [...prev.hvac_equipment_register];
                            next[idx] = {
                              ...next[idx],
                              remarks: e.target.value,
                            };
                            return { ...prev, hvac_equipment_register: next };
                          })
                        }
                        className={getInputClass(!form.isEditing)}
                        disabled={!form.isEditing}
                      />
                    </div>

                    {form.isEditing &&
                      form.hvac_equipment_register.length > 1 && (
                        <div className="flex justify-end md:col-span-3">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              updateForm(form.localId, (prev) => ({
                                ...prev,
                                hvac_equipment_register:
                                  prev.hvac_equipment_register.filter(
                                    (_, i) => i !== idx,
                                  ),
                              }))
                            }
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove
                          </Button>
                        </div>
                      )}
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base">
                    Chiller Field Test Readings
                  </Label>
                  {form.isEditing && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        updateForm(form.localId, (prev) => ({
                          ...prev,
                          chiller_field_test: {
                            ...prev.chiller_field_test,
                            readings: [
                              ...prev.chiller_field_test.readings,
                              createChillerReading(),
                            ],
                          },
                        }))
                      }
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Reading
                    </Button>
                  )}
                </div>

                {form.chiller_field_test.readings.map((item, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 gap-4 rounded-lg border p-4 md:grid-cols-3"
                  >
                    <div className="space-y-2">
                      <Label>Chiller Load (TR)</Label>
                      <Input
                        type="number"
                        value={item.chiller_load_TR}
                        onChange={(e) =>
                          updateForm(form.localId, (prev) => {
                            const next = [...prev.chiller_field_test.readings];
                            next[idx] = {
                              ...next[idx],
                              chiller_load_TR: e.target.value,
                            };
                            return {
                              ...prev,
                              chiller_field_test: {
                                ...prev.chiller_field_test,
                                readings: next,
                              },
                            };
                          })
                        }
                        className={getInputClass(!form.isEditing)}
                        disabled={!form.isEditing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Power Input (kW)</Label>
                      <Input
                        type="number"
                        value={item.power_input_kW}
                        onChange={(e) =>
                          updateForm(form.localId, (prev) => {
                            const next = [...prev.chiller_field_test.readings];
                            next[idx] = {
                              ...next[idx],
                              power_input_kW: e.target.value,
                            };
                            return {
                              ...prev,
                              chiller_field_test: {
                                ...prev.chiller_field_test,
                                readings: next,
                              },
                            };
                          })
                        }
                        className={getInputClass(!form.isEditing)}
                        disabled={!form.isEditing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>CHW In Temp</Label>
                      <Input
                        type="number"
                        value={item.chilled_water_in_temp}
                        onChange={(e) =>
                          updateForm(form.localId, (prev) => {
                            const next = [...prev.chiller_field_test.readings];
                            next[idx] = {
                              ...next[idx],
                              chilled_water_in_temp: e.target.value,
                            };
                            return {
                              ...prev,
                              chiller_field_test: {
                                ...prev.chiller_field_test,
                                readings: next,
                              },
                            };
                          })
                        }
                        className={getInputClass(!form.isEditing)}
                        disabled={!form.isEditing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>CHW Out Temp</Label>
                      <Input
                        type="number"
                        value={item.chilled_water_out_temp}
                        onChange={(e) =>
                          updateForm(form.localId, (prev) => {
                            const next = [...prev.chiller_field_test.readings];
                            next[idx] = {
                              ...next[idx],
                              chilled_water_out_temp: e.target.value,
                            };
                            return {
                              ...prev,
                              chiller_field_test: {
                                ...prev.chiller_field_test,
                                readings: next,
                              },
                            };
                          })
                        }
                        className={getInputClass(!form.isEditing)}
                        disabled={!form.isEditing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Condenser Water In Temp</Label>
                      <Input
                        type="number"
                        value={item.condenser_water_in_temp}
                        onChange={(e) =>
                          updateForm(form.localId, (prev) => {
                            const next = [...prev.chiller_field_test.readings];
                            next[idx] = {
                              ...next[idx],
                              condenser_water_in_temp: e.target.value,
                            };
                            return {
                              ...prev,
                              chiller_field_test: {
                                ...prev.chiller_field_test,
                                readings: next,
                              },
                            };
                          })
                        }
                        className={getInputClass(!form.isEditing)}
                        disabled={!form.isEditing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Condenser Water Out Temp</Label>
                      <Input
                        type="number"
                        value={item.condenser_water_out_temp}
                        onChange={(e) =>
                          updateForm(form.localId, (prev) => {
                            const next = [...prev.chiller_field_test.readings];
                            next[idx] = {
                              ...next[idx],
                              condenser_water_out_temp: e.target.value,
                            };
                            return {
                              ...prev,
                              chiller_field_test: {
                                ...prev.chiller_field_test,
                                readings: next,
                              },
                            };
                          })
                        }
                        className={getInputClass(!form.isEditing)}
                        disabled={!form.isEditing}
                      />
                    </div>

                    {form.isEditing &&
                      form.chiller_field_test.readings.length > 1 && (
                        <div className="flex justify-end md:col-span-3">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              updateForm(form.localId, (prev) => ({
                                ...prev,
                                chiller_field_test: {
                                  ...prev.chiller_field_test,
                                  readings:
                                    prev.chiller_field_test.readings.filter(
                                      (_, i) => i !== idx,
                                    ),
                                },
                              }))
                            }
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove
                          </Button>
                        </div>
                      )}
                  </div>
                ))}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Average Load (TR)</Label>
                    <Input
                      value={form.chiller_field_test.average.avg_load_TR}
                      disabled
                      className={getInputClass(!form.isEditing)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Average Power (kW)</Label>
                    <Input
                      value={form.chiller_field_test.average.avg_power_kW}
                      disabled
                      className={getInputClass(!form.isEditing)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base">
                    Auxiliary Power Components
                  </Label>
                  {form.isEditing && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        updateForm(form.localId, (prev) => ({
                          ...prev,
                          auxiliary_power: {
                            ...prev.auxiliary_power,
                            components: [
                              ...prev.auxiliary_power.components,
                              createAuxiliaryComponent(),
                            ],
                          },
                        }))
                      }
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Component
                    </Button>
                  )}
                </div>

                {form.auxiliary_power.components.map((item, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 gap-4 rounded-lg border p-4 md:grid-cols-2"
                  >
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={item.name}
                        onChange={(e) =>
                          updateForm(form.localId, (prev) => {
                            const next = [...prev.auxiliary_power.components];
                            next[idx] = { ...next[idx], name: e.target.value };
                            return {
                              ...prev,
                              auxiliary_power: {
                                ...prev.auxiliary_power,
                                components: next,
                              },
                            };
                          })
                        }
                        disabled={!form.isEditing}
                        className={getInputClass(!form.isEditing)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Power (kW)</Label>
                      <Input
                        type="number"
                        value={item.power_kW}
                        onChange={(e) =>
                          updateForm(form.localId, (prev) => {
                            const next = [...prev.auxiliary_power.components];
                            next[idx] = {
                              ...next[idx],
                              power_kW: e.target.value,
                            };
                            return {
                              ...prev,
                              auxiliary_power: {
                                ...prev.auxiliary_power,
                                components: next,
                              },
                            };
                          })
                        }
                        disabled={!form.isEditing}
                        className={getInputClass(!form.isEditing)}
                      />
                    </div>

                    {form.isEditing &&
                      form.auxiliary_power.components.length > 1 && (
                        <div className="flex justify-end md:col-span-2">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              updateForm(form.localId, (prev) => ({
                                ...prev,
                                auxiliary_power: {
                                  ...prev.auxiliary_power,
                                  components:
                                    prev.auxiliary_power.components.filter(
                                      (_, i) => i !== idx,
                                    ),
                                },
                              }))
                            }
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove
                          </Button>
                        </div>
                      )}
                  </div>
                ))}

                <div className="space-y-2">
                  <Label>Total Auxiliary Power Used (kW)</Label>
                  <Input
                    value={form.auxiliary_power.total_auxiliary_power_used_kW}
                    disabled
                    className={getInputClass(!form.isEditing)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base">Cooling Tower Quick Test</Label>
                  {form.isEditing && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        updateForm(form.localId, (prev) => ({
                          ...prev,
                          cooling_tower_quick_test: {
                            ...prev.cooling_tower_quick_test,
                            readings: [
                              ...prev.cooling_tower_quick_test.readings,
                              createCoolingTowerReading(),
                            ],
                          },
                        }))
                      }
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Reading
                    </Button>
                  )}
                </div>

                {form.cooling_tower_quick_test.readings.map((item, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 gap-4 rounded-lg border p-4 md:grid-cols-3"
                  >
                    <div className="space-y-2">
                      <Label>Inlet Temp</Label>
                      <Input
                        type="number"
                        value={item.inlet_temp}
                        onChange={(e) =>
                          updateForm(form.localId, (prev) => {
                            const next = [
                              ...prev.cooling_tower_quick_test.readings,
                            ];
                            next[idx] = {
                              ...next[idx],
                              inlet_temp: e.target.value,
                            };
                            return {
                              ...prev,
                              cooling_tower_quick_test: {
                                ...prev.cooling_tower_quick_test,
                                readings: next,
                              },
                            };
                          })
                        }
                        disabled={!form.isEditing}
                        className={getInputClass(!form.isEditing)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Outlet Temp</Label>
                      <Input
                        type="number"
                        value={item.outlet_temp}
                        onChange={(e) =>
                          updateForm(form.localId, (prev) => {
                            const next = [
                              ...prev.cooling_tower_quick_test.readings,
                            ];
                            next[idx] = {
                              ...next[idx],
                              outlet_temp: e.target.value,
                            };
                            return {
                              ...prev,
                              cooling_tower_quick_test: {
                                ...prev.cooling_tower_quick_test,
                                readings: next,
                              },
                            };
                          })
                        }
                        disabled={!form.isEditing}
                        className={getInputClass(!form.isEditing)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Ambient Temp</Label>
                      <Input
                        type="number"
                        value={item.ambient_temp}
                        onChange={(e) =>
                          updateForm(form.localId, (prev) => {
                            const next = [
                              ...prev.cooling_tower_quick_test.readings,
                            ];
                            next[idx] = {
                              ...next[idx],
                              ambient_temp: e.target.value,
                            };
                            return {
                              ...prev,
                              cooling_tower_quick_test: {
                                ...prev.cooling_tower_quick_test,
                                readings: next,
                              },
                            };
                          })
                        }
                        disabled={!form.isEditing}
                        className={getInputClass(!form.isEditing)}
                      />
                    </div>

                    {form.isEditing &&
                      form.cooling_tower_quick_test.readings.length > 1 && (
                        <div className="flex justify-end md:col-span-3">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              updateForm(form.localId, (prev) => ({
                                ...prev,
                                cooling_tower_quick_test: {
                                  ...prev.cooling_tower_quick_test,
                                  readings:
                                    prev.cooling_tower_quick_test.readings.filter(
                                      (_, i) => i !== idx,
                                    ),
                                },
                              }))
                            }
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove
                          </Button>
                        </div>
                      )}
                  </div>
                ))}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Average Inlet Temp</Label>
                    <Input
                      value={
                        form.cooling_tower_quick_test.average.avg_inlet_temp
                      }
                      disabled
                      className={getInputClass(!form.isEditing)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Average Outlet Temp</Label>
                    <Input
                      value={
                        form.cooling_tower_quick_test.average.avg_outlet_temp
                      }
                      disabled
                      className={getInputClass(!form.isEditing)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-base">Summary</Label>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Average Cooling Produced (TR)</Label>
                    <Input
                      value={form.summary.average_cooling_produced_TR}
                      disabled
                      className={getInputClass(!form.isEditing)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Average Chiller Power Used (kW)</Label>
                    <Input
                      value={form.summary.average_chiller_power_used_kW}
                      disabled
                      className={getInputClass(!form.isEditing)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Total Auxiliary Power Used (kW)</Label>
                    <Input
                      value={form.summary.total_auxiliary_power_used_kW}
                      disabled
                      className={getInputClass(!form.isEditing)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Total Plant Power (kW)</Label>
                    <Input
                      value={form.summary.total_plant_power_kW}
                      disabled
                      className={getInputClass(!form.isEditing)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Plant Efficiency (kW/TR)</Label>
                    <Input
                      value={form.summary.plant_efficiency_kW_per_TR}
                      disabled
                      className={getInputClass(!form.isEditing)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Coefficient of Performance</Label>
                    <Input
                      value={form.summary.coefficient_of_performance}
                      disabled
                      className={getInputClass(!form.isEditing)}
                    />
                  </div>
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

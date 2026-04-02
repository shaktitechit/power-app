import { apiSlice } from "./apiSlice";

export interface HVACAuditDocument {
  fileUrl: string;
  fileType: "image" | "pdf";
  fileName?: string;
  uploadedAt?: string;
}

export interface PreAuditInformation {
  facility_name?: string;
  location_address?: string;
  client_contact_person?: string;
  contact_number_email?: string;
  type_of_facility?: string;
  audit_dates?: string[];
  auditor_team_members_names?: string[];
  total_operating_hours_per_day?: number | string;
  hvac_operating_hours_per_day?: number | string;
  season_ambient_conditions?: string;
}

export interface DocumentChecklistItem {
  available?: boolean;
  remarks?: string;
}

export interface DocumentsRecordsToCollect {
  single_line_diagram_electrical?: DocumentChecklistItem;
  hvac_layout_piping_drawing?: DocumentChecklistItem;
  chiller_operation_maintenance_log?: DocumentChecklistItem;
  water_treatment_records?: DocumentChecklistItem;
  cooling_tower_maintenance_record?: DocumentChecklistItem;
  hvac_equipment_capacity_list?: DocumentChecklistItem;
  bms_setpoints_schedule?: DocumentChecklistItem;
}

export interface HVACEquipmentRegisterItem {
  equipment_name?: string;
  type?: string;
  capacity?: number | string;
  power_rating_kW?: number | string;
  quantity?: number | string;
  remarks?: string;
}

export interface ChillerFieldTestReading {
  chiller_load_TR?: number | string;
  power_input_kW?: number | string;
  chilled_water_in_temp?: number | string;
  chilled_water_out_temp?: number | string;
  condenser_water_in_temp?: number | string;
  condenser_water_out_temp?: number | string;
}

export interface ChillerFieldTest {
  readings?: ChillerFieldTestReading[];
  average?: {
    avg_load_TR?: number | string;
    avg_power_kW?: number | string;
  };
}

export interface AuxiliaryPowerComponent {
  name?: string;
  power_kW?: number | string;
}

export interface AuxiliaryPower {
  components?: AuxiliaryPowerComponent[];
  total_auxiliary_power_used_kW?: number | string;
}

export interface CoolingTowerQuickTestReading {
  inlet_temp?: number | string;
  outlet_temp?: number | string;
  ambient_temp?: number | string;
}

export interface CoolingTowerQuickTest {
  readings?: CoolingTowerQuickTestReading[];
  average?: {
    avg_inlet_temp?: number | string;
    avg_outlet_temp?: number | string;
  };
}

export interface HVACAuditSummary {
  average_cooling_produced_TR?: number | string;
  average_chiller_power_used_kW?: number | string;
  total_auxiliary_power_used_kW?: number | string;
  total_plant_power_kW?: number | string;
  plant_efficiency_kW_per_TR?: number | string;
  coefficient_of_performance?: number | string;
}

export interface HVACAudit {
  _id: string;
  facility_id: string;
  utility_account_id: string;

  pre_audit_information?: PreAuditInformation;
  documents_records_to_collect?: DocumentsRecordsToCollect;
  hvac_equipment_register?: HVACEquipmentRegisterItem[];
  chiller_field_test?: ChillerFieldTest;
  auxiliary_power?: AuxiliaryPower;
  cooling_tower_quick_test?: CoolingTowerQuickTest;
  summary?: HVACAuditSummary;

  audit_date?: string;
  auditor_id?: string;

  documents: HVACAuditDocument[];

  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateHVACAuditRequest {
  facility_id: string;
  utility_account_id: string;

  pre_audit_information?: PreAuditInformation;
  documents_records_to_collect?: DocumentsRecordsToCollect;
  hvac_equipment_register?: HVACEquipmentRegisterItem[];
  chiller_field_test?: ChillerFieldTest;
  auxiliary_power?: AuxiliaryPower;
  cooling_tower_quick_test?: CoolingTowerQuickTest;
  summary?: HVACAuditSummary;

  audit_date?: string;
  auditor_id?: string;

  documents?: File[];
}

export interface UpdateHVACAuditRequest {
  id: string;

  facility_id?: string;
  utility_account_id?: string;

  pre_audit_information?: PreAuditInformation;
  documents_records_to_collect?: DocumentsRecordsToCollect;
  hvac_equipment_register?: HVACEquipmentRegisterItem[];
  chiller_field_test?: ChillerFieldTest;
  auxiliary_power?: AuxiliaryPower;
  cooling_tower_quick_test?: CoolingTowerQuickTest;
  summary?: HVACAuditSummary;

  audit_date?: string;
  auditor_id?: string;

  documents?: File[];
}

export interface CreateHVACAuditResponse {
  success: boolean;
  message: string;
  data: HVACAudit;
}

export interface GetHVACAuditsResponse {
  success: boolean;
  count: number;
  data: HVACAudit[];
}

export interface GetHVACAuditByIdResponse {
  success: boolean;
  data: HVACAudit;
}

export interface UpdateHVACAuditResponse {
  success: boolean;
  message: string;
  data: HVACAudit;
}

export interface DeleteHVACAuditResponse {
  success: boolean;
  message: string;
}

const getDefaultChecklistItem = (): DocumentChecklistItem => ({
  available: false,
  remarks: "",
});

const getDefaultDocumentsRecordsToCollect = (): DocumentsRecordsToCollect => ({
  single_line_diagram_electrical: getDefaultChecklistItem(),
  hvac_layout_piping_drawing: getDefaultChecklistItem(),
  chiller_operation_maintenance_log: getDefaultChecklistItem(),
  water_treatment_records: getDefaultChecklistItem(),
  cooling_tower_maintenance_record: getDefaultChecklistItem(),
  hvac_equipment_capacity_list: getDefaultChecklistItem(),
  bms_setpoints_schedule: getDefaultChecklistItem(),
});

const mergeChecklist = (
  checklist?: DocumentsRecordsToCollect
): DocumentsRecordsToCollect => {
  const defaults = getDefaultDocumentsRecordsToCollect();

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

const buildHVACAuditFormData = (
  data: Partial<CreateHVACAuditRequest | UpdateHVACAuditRequest>
) => {
  const formData = new FormData();

  if ("facility_id" in data && data.facility_id !== undefined) {
    formData.append("facility_id", data.facility_id);
  }

  if ("utility_account_id" in data && data.utility_account_id !== undefined) {
    formData.append("utility_account_id", data.utility_account_id);
  }

  formData.append(
    "pre_audit_information",
    JSON.stringify(data.pre_audit_information || {})
  );

  formData.append(
    "documents_records_to_collect",
    JSON.stringify(mergeChecklist(data.documents_records_to_collect))
  );

  formData.append(
    "hvac_equipment_register",
    JSON.stringify(data.hvac_equipment_register || [])
  );

  formData.append(
    "chiller_field_test",
    JSON.stringify(data.chiller_field_test || {})
  );

  formData.append(
    "auxiliary_power",
    JSON.stringify(data.auxiliary_power || {})
  );

  formData.append(
    "cooling_tower_quick_test",
    JSON.stringify(data.cooling_tower_quick_test || {})
  );

  formData.append("summary", JSON.stringify(data.summary || {}));

  if (data.audit_date !== undefined && data.audit_date !== null) {
    formData.append("audit_date", data.audit_date);
  }

  if (data.auditor_id !== undefined && data.auditor_id !== null) {
    formData.append("auditor_id", data.auditor_id);
  }

  if (data.documents?.length) {
    data.documents.forEach((file) => {
      formData.append("documents", file);
    });
  }

  return formData;
};

export const hvacAuditApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createHVACAudit: builder.mutation<
      CreateHVACAuditResponse,
      CreateHVACAuditRequest
    >({
      query: (data) => ({
        url: "/v1/hvac-audits",
        method: "POST",
        body: buildHVACAuditFormData(data),
      }),
      invalidatesTags: ["HVACAudit", "UtilityAccount", "Facility"],
    }),

    getHVACAudits: builder.query<
      GetHVACAuditsResponse,
      { facility_id?: string; utility_account_id?: string } | void
    >({
      query: (params) => ({
        url: "/v1/hvac-audits",
        method: "GET",
        params: {
          ...(params?.facility_id ? { facility_id: params.facility_id } : {}),
          ...(params?.utility_account_id
            ? { utility_account_id: params.utility_account_id }
            : {}),
        },
      }),
      providesTags: ["HVACAudit"],
    }),

    getHVACAuditById: builder.query<GetHVACAuditByIdResponse, string>({
      query: (id) => ({
        url: `/v1/hvac-audits/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "HVACAudit", id }],
    }),

    updateHVACAudit: builder.mutation<
      UpdateHVACAuditResponse,
      UpdateHVACAuditRequest
    >({
      query: ({ id, ...data }) => ({
        url: `/v1/hvac-audits/${id}`,
        method: "PUT",
        body: buildHVACAuditFormData(data),
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "HVACAudit",
        { type: "HVACAudit", id },
        "UtilityAccount",
        "Facility",
      ],
    }),

    deleteHVACAudit: builder.mutation<DeleteHVACAuditResponse, string>({
      query: (id) => ({
        url: `/v1/hvac-audits/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        "HVACAudit",
        { type: "HVACAudit", id },
        "UtilityAccount",
        "Facility",
      ],
    }),
  }),
});

export const {
  useCreateHVACAuditMutation,
  useGetHVACAuditsQuery,
  useGetHVACAuditByIdQuery,
  useUpdateHVACAuditMutation,
  useDeleteHVACAuditMutation,
} = hvacAuditApiSlice;
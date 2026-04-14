export type ID = string;
export type ISODateString = string | Date;

export type UserRole = "admin" | "auditor";
export type UserStatus = "active" | "inactive" | "suspended";
export type ConnectionType = "LT" | "HT";

/* =========================
   USERS
========================= */
export interface User {
  _id: ID;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  status: UserStatus;
  latestSelfieUrl: string;
  lastSelfieAt: ISODateString;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface SelfieLog {
  _id: ID;
  userId: ID;
  imageUrl: string;
  capturedAt: ISODateString;
  sessionId: string;
  loginAt: ISODateString;
  createdAt: ISODateString;
}

/* =========================
   FACILITIES
========================= */
export interface Facility {
  _id: ID;
  owner_user_id: ID;
  name: string;
  city: string;
  address: string;
  client_representative: string;
  client_contact_number: string;
  client_email: string;
  facility_type: string;
  status: string;
  audit_closure?: {
    closed_at?: ISODateString;
    closed_by?: ID;
    reopened_at?: ISODateString;
    reopened_by?: ID;
  };
  created_by: ID;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface FacilityAuditor {
  _id: ID;
  facility_id: ID;
  user_id: ID;
  assigned_role: string;
  assigned_at: ISODateString;
  assigned_by: ID;
}

/* =========================
   UTILITY ACCOUNTS
========================= */
export interface UtilityAccount {
  _id: ID;
  facility_id: ID;
  account_number: string;
  connection_type: ConnectionType;
  category: string;
  sanctioned_demand_kVA: number;
  is_solar_connected: boolean;
  is_dg_connected: boolean;
  is_transformer_connected: boolean;
  is_pump_connected: boolean;
   is_transformer_maintained_by_facility: boolean;
  is_active: boolean;
  audit_step_submissions?: Record<
    string,
    { submitted_at?: ISODateString; submitted_by?: ID }
  >;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface UtilityTariff {
  _id: ID;
  utility_account_id: ID;
  effective_from: ISODateString;
  effective_to: ISODateString | null;
  basic_energy_charges_rs_per_unit: number;
  fixed_charges_rs_per_kW_or_per_kVA: number;
  ed_percent: number;
  octroi_rs_per_unit: number;
  surcharge_rs: number;
  cow_cess_rs: number;
  rental_rs: number;
  infracess_rs: number;
  other_charges_or_rebates_rs: number;
  any_other_rs: number;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface UtilityBillingRecord {
  _id: ID;
  utility_account_id: ID;
  billing_period_start: ISODateString;
  billing_period_end: ISODateString;
  billing_days: number;
  bill_no: string;
  mdi_kVA: number;
  units_kWh: number;
  units_kVAh: number;
  pf: number;
  fixed_charges_rs: number;
  energy_charges_rs: number;
  taxes_and_rent_rs: number;
  other_charges_rs: number;
  monthly_electricity_bill_rs: number;
  unit_consumption_per_day_kVAh: number;
  average_per_unit_cost_rs: number;
  created_at: ISODateString;
  updated_at: ISODateString;
}

/* =========================
   SOLAR
========================= */
export interface SolarPlant {
  _id: ID;
  facility_id: ID;
  utility_account_id: ID;
  plant_name: string;
  rating_kWp: number;
  panel_rating_watt: number;
  no_of_panels: number;
  inverter_make: string;
  inverter_rating_kW: number;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface SolarGenerationRecord {
  _id: ID;
  solar_plant_id: ID;
  utility_account_id: ID;
  billing_period_start: ISODateString;
  billing_period_end: ISODateString;
  billing_days: number;
  bill_no: string;
  import_kWh: number;
  import_kVAh: number;
  import_kVA: number;
  export_kWh: number;
  export_kVAh: number;
  export_kVA: number;
  net_kWh: number;
  net_kVAh: number;
  net_kVA: number;
  solar_generation_kWh: number;
  solar_generation_kVAh: number;
  solar_generation_kVA: number;
  created_at: ISODateString;
  updated_at: ISODateString;
}

/* =========================
   DG
========================= */
export interface DGSet {
  _id: ID;
  facility_id: ID;
  utility_account_id: ID;
  dg_number: string;
  make_model: string;
  year_of_installation: number;
  rated_capacity_kVA: number;
  rated_active_power_kW: number;
  rated_voltage_V: number;
  rated_speed_RPM: number;
  fuel_type: string;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface DGAuditRecord {
  _id: ID;
  dg_set_id: ID;
  utility_account_id: ID;
  measured_voltage_LL: number;
  measured_current_avg: number;
  measured_kW_output: number;
  measured_kVA_output: number;
  power_factor: number;
  frequency_Hz: number;
  max_load_observed_kW: number;
  min_load_observed_kW: number;
  average_loading_percent: number;
  load_factor_percent: number;
  idle_running_observed: boolean;
  parallel_operation: boolean;
  annual_fuel_consumption_liters: number;
  units_generated_per_year_kWh: number;
  total_working_hours_per_year: number;
  units_generated_per_hour_kWh: number;
  fuel_consumption_per_hour_liters: number;
  fuel_consumption_during_test_lph: number;
  units_generated_during_test_kWh: number;
  specific_fuel_consumption_l_per_kWh: number;
  manufacturer_sfc_l_per_kWh: number;
  sfc_deviation_percent: number;
  fuel_cost_rs_per_liter: number;
  annual_fuel_cost_rs: number;
  dg_cost_per_kWh_rs: number;
  grid_cost_per_kWh_rs: number;
  calculated_efficiency_percent: number;
  manufacturer_efficiency_percent: number;
  efficiency_deviation_percent: number;
  exhaust_temperature_C: number;
  cooling_water_temperature_C: number;
  lube_oil_pressure_bar: number;
  lube_oil_consumption_liters_per_year: number;
  total_operating_hours: number;
  hours_since_last_overhaul: number;
  air_fuel_filter_condition: string;
  visible_smoke_or_abnormal_vibration: boolean;
  created_at: ISODateString;
  updated_at: ISODateString;
}

/* =========================
   TRANSFORMERS
========================= */
export interface Transformer {
  _id: ID;
  facility_id: ID;
  utility_account_id: ID;
  transformer_tag: string;
  rated_capacity_kVA: number;
  type_of_cooling: string;
  rated_HV_kV: number;
  rated_LV_V: number;
  rated_HV_current_A: number;
  rated_LV_current_A: number;
  no_load_loss_kW: number;
  full_load_loss_kW: number;
  nameplate_efficiency_percent: number;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface TransformerAuditRecord {
  _id: ID;
  transformer_id: ID;
  utility_account_id: ID;
  total_losses_kW: number;
  average_load_kVA: number;
  percent_loading: number;
  max_load_kVA: number;
  load_factor_percent: number;
  operating_hours_per_year: number;
  annual_energy_supplied_kWh: number;
  annual_energy_losses_kWh: number;
  per_unit_cost_rs: number;
  cost_of_losses_rs: number;
  power_factor_LT: number;
  harmonics_THD_percent: number;
  neutral_earth_resistance_ohms: number;
  body_to_earth_resistance_ohms: number;
  silica_gel_cobalt_type: string;
  silica_gel_non_cobalt_type: string;
  oil_level: string;
  line_voltage_Vr: number;
  line_voltage_Vy: number;
  line_voltage_Vb: number;
  phase_voltage_Vr_n: number;
  phase_voltage_Vy_n: number;
  phase_voltage_Vb_n: number;
  line_current_Ir: number;
  line_current_Iy: number;
  line_current_Ib: number;
  created_at: ISODateString;
  updated_at: ISODateString;
}

/* =========================
   FAN
========================= */
export interface FanAuditRecord {
  _id: ID;
  utility_account_id: ID;
  building_block: string;
  area_location: string;
  fan_type: string;
  make_model: string;
  rated_power_W: number;
  measured_power_W: number;
  quantity_nos: number;
  speed_control_type: string;
  operating_hours_per_day: number;
  operating_days_per_year: number;
  loading_factor_percent: number;
  connected_load_kW: number;
  annual_energy_consumption_kWh: number;
  condition: string;
  remarks: string;
  created_at: ISODateString;
  updated_at: ISODateString;
}

/* =========================
   LIGHTING
========================= */
export interface LightingAuditRecord {
  _id: ID;
  utility_account_id: ID;
  area_location: string;
  fixture_type: string;
  lamp_type: string;
  wattage_W: number;
  quantity_nos: number;
  control_type: string;
  working_hours_per_day: number;
  working_days_per_year: number;
  connected_load_kW: number;
  annual_energy_kWh: number;
  remarks: string;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface LuxMeasurement {
  _id: ID;
  utility_account_id: ID;
  area_location: string;
  room_type: string;
  required_lux: number;
  measured_lux_point_1: number;
  measured_lux_point_2: number;
  measured_lux_point_3: number;
  average_lux: number;
  compliance: boolean;
  remarks: string;
  created_at: ISODateString;
  updated_at: ISODateString;
}

/* =========================
   HVAC
========================= */
export interface HVACDocumentRecordItem {
  available: boolean;
  remarks: string;
}

export interface HVACPreAuditInformation {
  facility_name: string;
  location_address: string;
  client_contact_person: string;
  contact_number_email: string;
  type_of_facility: string;
  audit_dates: ISODateString[];
  auditor_team_members_names: string[];
  total_operating_hours_per_day: number;
  hvac_operating_hours_per_day: number;
  season_ambient_conditions: string;
}

export interface HVACDocumentsRecordsToCollect {
  single_line_diagram_electrical: HVACDocumentRecordItem;
  hvac_layout_piping_drawing: HVACDocumentRecordItem;
  chiller_operation_maintenance_log: HVACDocumentRecordItem;
  water_treatment_records: HVACDocumentRecordItem;
  cooling_tower_maintenance_record: HVACDocumentRecordItem;
  hvac_equipment_capacity_list: HVACDocumentRecordItem;
  bms_setpoints_schedule: HVACDocumentRecordItem;
}

export interface HVACEquipmentRegisterItem {
  equipment_name: string;
  equipment_type: string;
  make_model: string;
  rated_capacity_TR: number;
  rated_power_kW: number;
  year_of_installation: number;
  remarks: string;
}

export interface HVACChillerFieldTestReading {
  chilled_water_inlet_temp_C: number;
  chilled_water_outlet_temp_C: number;
  condenser_water_inlet_temp_C: number;
  condenser_water_outlet_temp_C: number;
  flow_rate_m3_per_hr: number;
  power_input_kW: number;
  cooling_produced_TR: number;
}

export interface HVACChillerFieldTest {
  readings: HVACChillerFieldTestReading[];
  average: HVACChillerFieldTestReading;
}

export interface HVACAuxiliaryPowerComponent {
  component_name: string;
  power_kW: number;
}

export interface HVACAuxiliaryPower {
  components: HVACAuxiliaryPowerComponent[];
  total_auxiliary_power_used_kW: number;
}

export interface HVACCoolingTowerQuickTestReading {
  hot_water_temp_C: number;
  cold_water_temp_C: number;
  wet_bulb_temp_C: number;
  approach_C: number;
  range_C: number;
}

export interface HVACCoolingTowerQuickTest {
  readings: HVACCoolingTowerQuickTestReading[];
  average: HVACCoolingTowerQuickTestReading;
}

export interface HVACSummary {
  average_cooling_produced_TR: number;
  average_chiller_power_used_kW: number;
  total_auxiliary_power_used_kW: number;
  total_plant_power_kW: number;
  plant_efficiency_kW_per_TR: number;
  coefficient_of_performance: number;
}

export interface HVACAudit {
  _id: ID;
  utility_account_id: ID;
  pre_audit_information: HVACPreAuditInformation;
  documents_records_to_collect: HVACDocumentsRecordsToCollect;
  hvac_equipment_register: HVACEquipmentRegisterItem[];
  chiller_field_test: HVACChillerFieldTest;
  auxiliary_power: HVACAuxiliaryPower;
  cooling_tower_quick_test: HVACCoolingTowerQuickTest;
  summary: HVACSummary;
  created_at: ISODateString;
  updated_at: ISODateString;
}

/* =========================
   MISC LOAD
========================= */
export interface MiscLoadAuditRecord {
  _id: ID;
  utility_account_id: ID;
  equipment_name: string;
  category: string;
  location_department: string;
  quantity: number;
  rated_power_kW: number;
  average_operating_hours_per_day: number;
  operating_days_per_year: number;
  load_factor_percent: number;
  estimated_annual_energy_kWh: number;
  created_at: ISODateString;
  updated_at: ISODateString;
}

/* =========================
   PUMPS
========================= */
export interface Pump {
  _id: ID;
  facility_id: ID;
  utility_account_id: ID;
  pump_tag_number: string;
  make_model: string;
  rated_power_kW_or_HP: number;
  rated_flow_m3_per_hr: number;
  rated_head_m: number;
  rated_speed_RPM: number;
  number_of_stages: number;
  year_of_installation: number;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface PumpAuditRecord {
  _id: ID;
  pump_id: ID;
  utility_account_id: ID;
  suction_head_m: number;
  discharge_static_head_m: number;
  delivery_pipe_diameter_inches: number;
  tank_or_sump_capacity: number;
  time_to_fill_tank_minutes: number;
  actual_flow_m3_per_hr: number;
  voltage_V: number;
  current_A: number;
  power_factor: number;
  input_power_kW: number;
  operating_hours_per_day: number;
  daily_energy_consumption_kWh: number;
  total_dynamic_head_m: number;
  hydraulic_output_power_kW: number;
  overall_pump_set_efficiency_percent: number;
  motor_loading_percent: number;
  specific_energy_consumption_kWh_per_m3: number;
  annual_energy_consumption_kWh: number;
  control_valve_throttling: boolean;
  vfd_installed: boolean;
  pump_condition: string;
  leakages_observed: boolean;
  recommendations: string;
  created_at: ISODateString;
  updated_at: ISODateString;
}

/* =========================
   OPTIONAL COLLECTION MAP
========================= */
export interface DatabaseCollections {
  users: User[];
  selfie_logs: SelfieLog[];
  facilities: Facility[];
  facility_auditors: FacilityAuditor[];
  utility_accounts: UtilityAccount[];
  utility_tariffs: UtilityTariff[];
  utility_billing_records: UtilityBillingRecord[];
  solar_plants: SolarPlant[];
  solar_generation_records: SolarGenerationRecord[];
  dg_sets: DGSet[];
  dg_audit_records: DGAuditRecord[];
  transformers: Transformer[];
  transformer_audit_records: TransformerAuditRecord[];
  fan_audit_records: FanAuditRecord[];
  lighting_audit_records: LightingAuditRecord[];
  lux_measurements: LuxMeasurement[];
  hvac_audits: HVACAudit[];
  misc_load_audit_records: MiscLoadAuditRecord[];
  pumps: Pump[];
  pump_audit_records: PumpAuditRecord[];
}
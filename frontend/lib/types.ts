// User Types
export type UserRole = 'admin' | 'auditor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  lastActive: string;
}

// Facility Types
export type FacilityStatus = 'pending' | 'in-progress' | 'completed' | 'approved';

export interface Facility {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  status: FacilityStatus;
  auditorId: string;
  auditorName: string;
  createdAt: string;
  updatedAt: string;
  connectionCount: number;
  totalCapacity: number;
}

// Connection Types
export type ConnectionType = 'HT' | 'LT' | 'Industrial' | 'Commercial' | 'Residential';

export interface Connection {
  id: string;
  facilityId: string;
  name: string;
  type: ConnectionType;
  sanctionedLoad: number;
  contractDemand: number;
  connectedLoad: number;
  supplyVoltage: number;
  meterNumber: string;
  accountNumber: string;
  createdAt: string;
  updatedAt: string;
  dgCount: number;
  solarCount: number;
}

// DG System Types
export type FuelType = 'Diesel' | 'Natural Gas' | 'Dual Fuel' | 'Bio-diesel';

export interface DGSystem {
  id: string;
  connectionId: string;
  make: string;
  model: string;
  serialNumber: string;
  capacity: number;
  fuelType: FuelType;
  yearOfInstallation: number;
  runningHours: number;
  lastServiceDate: string;
  status: 'operational' | 'maintenance' | 'non-operational';
}

// Solar System Types
export type InverterType = 'String' | 'Central' | 'Micro' | 'Hybrid';

export interface SolarSystem {
  id: string;
  connectionId: string;
  panelMake: string;
  panelModel: string;
  panelCapacity: number;
  numberOfPanels: number;
  totalCapacity: number;
  inverterMake: string;
  inverterModel: string;
  inverterCapacity: number;
  inverterType: InverterType;
  installationDate: string;
  status: 'operational' | 'maintenance' | 'non-operational';
}

// Wizard Step Types
export interface WizardStep {
  id: string;
  title: string;
  description?: string;
}

// Analytics Types
export interface AnalyticsData {
  totalFacilities: number;
  totalConnections: number;
  totalDGSystems: number;
  totalSolarSystems: number;
  completedAudits: number;
  pendingAudits: number;
  totalCapacity: number;
  solarCapacity: number;
  dgCapacity: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  fill?: string;
}

export interface TimeSeriesDataPoint {
  date: string;
  audits: number;
  capacity: number;
}

export interface AuditSession {
  id: string;
  auditId: string;
  connectionId: string;
  auditName: string;
  auditDate: string;
  auditorName: string;
  status: 'draft' | 'in-progress' | 'completed';
}

export interface AuditSession {
  id: string;
  auditId: string;
  facilityId: string;
  connectionId: string;
  auditName: string;
  auditDate: string;
  auditorName: string;
  status: "draft" | "in-progress" | "completed";
}

export interface UtilityBillingRecord {
  id: string;
  auditId: string;
  billingMonth: string;
  unitsConsumed: number;
  billingAmount: number;
  maxDemand: number;
  powerFactor: number;
}

export interface SolarGenerationRecord {
  id: string;
  auditId: string;
  date: string;
  generation: number;
  exportedEnergy: number;
  remarks: string;
}

export interface DGAuditRecord {
  id: string;
  auditId: string;
  dgName: string;
  capacity: number;
  fuelType: string;
  runningHours: number;
  status: "active" | "standby" | "maintenance";
}

export interface TransformerAuditRecord {
  id: string;
  auditId: string;
  transformerName: string;
  capacity: number;
  voltageLevel: string;
  loadingPercent: number;
  status: "normal" | "warning" | "critical";
}

export interface FanAuditRecord {
  id: string;
  auditId: string;
  fanTag: string;
  location: string;
  ratedPower: number;
  quantity: number;
  workingHoursPerDay: number;
}

export interface LightingAuditRecord {
  id: string;
  auditId: string;
  fixtureTag: string;
  location: string;
  lampType: string;
  wattage: number;
  quantity: number;
}

export interface LuxMeasurement {
  id: string;
  auditId: string;
  areaLocation: string;
  roomType: string;
  requiredLux: number;
  measuredLuxPoint1: number;
  measuredLuxPoint2: number;
  measuredLuxPoint3: number;
  averageLux: number;
  compliance: "Yes" | "No";
  remarks: string;
}

export interface HVACAudit {
  id: string;
  auditId: string;
  equipmentName: string;
  equipmentType: string;
  capacityTR: number;
  powerConsumption: number;
  status: "running" | "idle" | "fault";
}

export interface MiscLoadAuditRecord {
  id: string;
  auditId: string;
  equipmentName: string;
  location: string;
  connectedLoad: number;
  workingHoursPerDay: number;
  remarks: string;
}

export interface PumpAuditRecord {
  id: string;
  auditId: string;
  pumpName: string;
  location: string;
  motorCapacity: number;
  flowRate: string;
  status: "running" | "standby" | "fault";
}
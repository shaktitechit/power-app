import { fetchBaseQuery, createApi } from "@reduxjs/toolkit/query/react";

// Base query
const baseQuery = fetchBaseQuery({
  baseUrl: "/api",
  credentials: "include",
   headers: {
    "Content-Type": "application/json",
  },
});

// API Slice
export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: ["User","Facility","UtilityAccount","UtilityTariff","UtilityBillingRecord","SolarPlant", "DGSet","Transformer","Pump","HVACAudit","LightingAudit","LuxMeasurement","MiscLoadAudit","SolarGenerationRecord","DGAuditRecord","TransformerAuditRecord","PumpAuditRecord","ACAuditRecord","FanAuditRecord","Report","Dashboard", "RecentActivity", "PresenceLog","Analytics"],
  endpoints: () => ({}),
});
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import { fetchBaseQuery, createApi } from "@reduxjs/toolkit/query/react";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: "/api",
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshPromise: Promise<unknown> | null = null;

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status !== 401) {
    return result;
  }

  const url = typeof args === "string" ? args : args.url;
  if (String(url).includes("/users/refresh")) {
    return result;
  }

  if (!refreshPromise) {
    refreshPromise = rawBaseQuery(
      { url: "/v1/users/refresh", method: "POST" },
      api,
      extraOptions,
    ).finally(() => {
      refreshPromise = null;
    });
  }

  const refreshResult = await refreshPromise;
  if (refreshResult.error) {
    return result;
  }

  return rawBaseQuery(args, api, extraOptions);
};

// API Slice
export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "User",
    "Facility",
    "UtilityAccount",
    "UtilityTariff",
    "UtilityBillingRecord",
    "SolarPlant",
    "DGSet",
    "Transformer",
    "Pump",
    "HVACAudit",
    "LightingAudit",
    "LuxMeasurement",
    "MiscLoadAudit",
    "SolarGenerationRecord",
    "DGAuditRecord",
    "TransformerAuditRecord",
    "PumpAuditRecord",
    "ACAuditRecord",
    "FanAuditRecord",
    "Report",
    "Dashboard",
    "RecentActivity",
    "PresenceLog",
    "Analytics",
  ],
  endpoints: () => ({}),
});

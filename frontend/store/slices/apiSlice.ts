import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import { fetchBaseQuery, createApi } from "@reduxjs/toolkit/query/react";

function isHttpUnauthorized(error: FetchBaseQueryError | undefined) {
  if (!error) return false;
  const s = error.status;
  return s === 401 || String(s) === "401";
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: "/api",
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
  fetchFn: (input, init) =>
    fetch(input, { ...init, cache: init?.cache ?? "no-store" }),
});

type RawQueryResult = Awaited<ReturnType<typeof rawBaseQuery>>;

let refreshPromise: Promise<RawQueryResult> | null = null;

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result: RawQueryResult = await rawBaseQuery(args, api, extraOptions);

  if (!isHttpUnauthorized(result.error)) {
    return result;
  }

  const url = typeof args === "string" ? args : args.url;
  if (String(url).includes("/users/refresh")) {
    return result;
  }

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        return await rawBaseQuery(
          { url: "/v1/users/refresh", method: "POST", body: {} },
          api,
          extraOptions,
        );
      } finally {
        refreshPromise = null;
      }
    })();
  }

  const refreshResult = await refreshPromise;
  if (refreshResult.error) {
    // Surface refresh failure (e.g. no/expired refresh cookie) instead of the original 401
    return refreshResult;
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
    "SafetyGeneralAudit",
    "SafetyDocumentsAudit",
    "SafetyTransformerAudit",
    "SafetyMeteringRoomAudit",
    "SafetyPanelRoomAudit",
    "SafetyLdbAudit",
    "SafetyDgAudit",
    "SafetyEarthingAudit",
    "SafetyUpsAudit",
    "SafetyThermographyAudit",
    "SafetyElevatorAudit",
    "SafetyLoadAnalysisAudit",
    "SafetyLeakInspectionAudit",
    "SafetyPacVentilationAudit",
    "SafetyWiringAudit",
    "SafetyPumpCompressorAudit",
    "SafetyAdditionalItemsAudit",
    "AuditSnapshot",
    "Mode",
  ],
  endpoints: () => ({}),
});

/** RTK `builder` in `apiSlice.injectEndpoints({ endpoints: (builder) => ... })` */
export type AppEndpointBuilder = Parameters<
  NonNullable<Parameters<typeof apiSlice.injectEndpoints>[0]["endpoints"]>
>[0];

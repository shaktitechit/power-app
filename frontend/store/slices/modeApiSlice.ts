import { apiSlice } from "./apiSlice";

// ─── Types ───────────────────────────────────────────────────────────────────

export type AppMode = "onsite" | "offsite";

export interface ModeResponse {
  success: boolean;
  message?: string;
  data: {
    mode: AppMode | null;
  };
}

export interface SetModeRequest {
  mode: AppMode;
  location?: {
    lat: number;
    lng: number;
    name?: string;
  };
}

// ─── Slice ───────────────────────────────────────────────────────────────────

export const modeApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * GET /api/v1/mode
     * Returns the current mode stored in the httpOnly cookie.
     */
    getMode: builder.query<ModeResponse, void>({
      query: () => ({
        url: "/v1/mode",
        method: "GET",
      }),
      providesTags: ["Mode"],
    }),

    /**
     * POST /api/v1/mode/set
     * Sets the mode httpOnly cookie to "onsite" or "offsite".
     */
    setMode: builder.mutation<ModeResponse, SetModeRequest>({
      query: (data) => ({
        url: "/v1/mode/set",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Mode"],
    }),

    /**
     * DELETE /api/v1/mode
     * Clears the mode httpOnly cookie.
     */
    clearMode: builder.mutation<ModeResponse, void>({
      query: () => ({
        url: "/v1/mode",
        method: "DELETE",
      }),
      invalidatesTags: ["Mode"],
    }),
  }),
});

export const {
  useGetModeQuery,
  useSetModeMutation,
  useClearModeMutation,
} = modeApiSlice;

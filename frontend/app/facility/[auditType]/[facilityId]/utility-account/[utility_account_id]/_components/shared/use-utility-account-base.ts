"use client";

import { canViewDocuments, type UserPermission } from "@/lib/authRoles";
import { useEffect, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useGetUtilityAccountByIdQuery } from "@/store/slices/electrical-audit/utilityApiSlice";
import { useGetFacilityByIdQuery } from "@/store/slices/facilityApiSlice";
import { useAppSelector } from "@/store/hooks";
import { facilityPath } from "@/lib/facilityRoutes";

/** Shared facility + connection fetch and redirect if URL facilityId mismatches. */
export function useUtilityAccountBase() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const facilityId = params.facilityId as string;
  const auditTypeSlug = params.auditType as string;
  const utilityAccountId = params.utility_account_id as string;
  const user = useAppSelector((state) => state.auth.user);
  const canViewDocs = canViewDocuments(
    user?.role,
    (user?.permissions as UserPermission[]) || [],
  );

  const { data: utility, isLoading: utilityAccountLoading } =
    useGetUtilityAccountByIdQuery(utilityAccountId);

  const utilityAccount = utility?.data;
  const utilityFacilityId = useMemo(() => {
    const raw = utilityAccount?.facility_id as
      | string
      | { _id?: string }
      | undefined;
    if (!raw) return "";
    if (typeof raw === "string") return raw;
    if (raw._id) return String(raw._id);
    return "";
  }, [utilityAccount?.facility_id]);
  const effectiveFacilityId = utilityFacilityId || facilityId;

  const { data: facilityById, isLoading: facilityLoading } =
    useGetFacilityByIdQuery(effectiveFacilityId, {
      skip: !effectiveFacilityId,
    });

  const facility = facilityById?.data?.facility;

  const facilityPathPrefix = useMemo(() => {
    if (!effectiveFacilityId) return "";
    if (facility?.audit_type) {
      return facilityPath(facility.audit_type, effectiveFacilityId);
    }
    return `/facility/${auditTypeSlug}/${effectiveFacilityId}`;
  }, [effectiveFacilityId, facility?.audit_type, auditTypeSlug]);

  useEffect(() => {
    if (!utilityFacilityId || !utilityAccountId) return;
    if (utilityFacilityId === facilityId) return;
    const p = new URLSearchParams(searchParams.toString());
    const query = p.toString();
    router.replace(
      `/facility/${auditTypeSlug}/${utilityFacilityId}/utility-account/${utilityAccountId}${query ? `?${query}` : ""}`,
      { scroll: false },
    );
  }, [
    utilityFacilityId,
    utilityAccountId,
    facilityId,
    auditTypeSlug,
    searchParams,
    router,
  ]);

  return {
    auditTypeSlug,
    utilityAccountId,
    effectiveFacilityId,
    facilityId,
    facilityPathPrefix,
    utilityAccountLoading,
    facilityLoading,
    facility,
    utilityAccount,
    canViewDocs,
  };
}

export type UtilityAccountBaseModel = ReturnType<typeof useUtilityAccountBase>;

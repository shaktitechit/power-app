"use client";

import { canManageResource } from "@/lib/authRoles";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CreateFacilityForm } from "@/components/facility/create-facility-form";
import { EditFacilityForm } from "@/components/facility/edit-facility-form";
import {
  Plus,
  Search,
  Building2,
  Pencil,
  Trash2,
  MapPin,
  User,
  Phone,
  Mail,
  Calendar,
  ArrowRight,
} from "lucide-react";
import {
  type Facility,
  useGetFacilitiesQuery,
  useDeleteFacilityMutation,
} from "@/store/slices/facilityApiSlice";
import { useAppSelector } from "@/store/hooks";
import { facilityPath } from "@/lib/facilityRoutes";
import { AUDIT_TYPE_OPTIONS } from "@/lib/facilityConstants";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 6;

function facilitySearchHaystack(facility: Facility): string {
  const auditor =
    facility.auditor_id &&
    typeof facility.auditor_id === "object" &&
    facility.auditor_id !== null
      ? [facility.auditor_id.name, facility.auditor_id.email].filter(Boolean)
      : [];

  const closedBy = facility.audit_closure?.closed_by
    ? typeof facility.audit_closure.closed_by === "string"
      ? [facility.audit_closure.closed_by]
      : [
          facility.audit_closure.closed_by._id,
          facility.audit_closure.closed_by.name,
          facility.audit_closure.closed_by.email,
        ].filter(Boolean)
    : [];

  const reopenedBy = facility.audit_closure?.reopened_by
    ? typeof facility.audit_closure.reopened_by === "string"
      ? [facility.audit_closure.reopened_by]
      : [
          facility.audit_closure.reopened_by._id,
          facility.audit_closure.reopened_by.name,
          facility.audit_closure.reopened_by.email,
        ].filter(Boolean)
    : [];

  const reps = (facility.client_representatives ?? []).flatMap((cr) =>
    [cr.name, cr.contact_number, cr.email].filter(Boolean),
  );

  const closureLabel = facility.audit_closure?.closed_at
    ? "closed closure"
    : "open";

  const parts = [
    facility.name,
    facility.city,
    facility.address,
    facility.client_representative,
    facility.client_contact_number,
    facility.client_email,
    facility.facility_type,
    facility.audit_type,
    facility.status,
    closureLabel,
    facility.start_date,
    facility.audit_date,
    facility.closure_date,
    facility.created_at,
    facility.updated_at,
    facility.createdAt,
    facility.updatedAt,
    facility._id,
    facility.created_by,
    ...(facility.documents?.flatMap((d) => [d.fileName, d.fileUrl]) ?? []),
    ...auditor,
    ...closedBy,
    ...reopenedBy,
    ...reps,
  ];

  return parts.filter(Boolean).join(" ").toLowerCase();
}

export default function FacilitiesPage() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAuditType, setSelectedAuditType] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(
    null,
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Facility | null>(null);

  const user = useAppSelector((state) => state.auth.user);
  const canCreateFacility = canManageResource(
    user?.role,
    user?.permissions || [],
    "facility",
    "create",
  );
  const canUpdateFacility = user?.role === "super_admin" || user?.role === "admin";
  const canDeleteFacility = user?.role === "super_admin";

  const {
    data,
    isLoading: facilitiesLoading,
    refetch: refetchFacilities,
  } = useGetFacilitiesQuery();

  const [deleteFacility, { isLoading: isDeleting }] =
    useDeleteFacilityMutation();

  const facilities = data?.data || [];

  const filteredFacilities = useMemo(() => {
    let result = facilities;

    // Search query filter
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter((facility) =>
        facilitySearchHaystack(facility).includes(q)
      );
    }

    // Audit type filter
    if (selectedAuditType !== "all") {
      result = result.filter(
        (facility) => facility.audit_type === selectedAuditType
      );
    }

    return result;
  }, [facilities, searchQuery, selectedAuditType]);

  const totalFiltered = filteredFacilities.length;
  const totalPages =
    totalFiltered === 0 ? 1 : Math.ceil(totalFiltered / PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedAuditType]);

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const paginatedFacilities = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredFacilities.slice(start, start + PAGE_SIZE);
  }, [filteredFacilities, page]);

  const handleEditFacility = (
    e: React.MouseEvent<HTMLButtonElement>,
    facility: Facility,
  ) => {
    e.stopPropagation();
    setSelectedFacilityId(facility._id);
    setEditOpen(true);
  };

  const handleDeleteFacility = (
    e: React.MouseEvent<HTMLButtonElement>,
    facility: Facility,
  ) => {
    e.stopPropagation();
    setDeleteTarget(facility);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteFacility = async () => {
    if (!deleteTarget?._id) return;
    try {
      await deleteFacility(deleteTarget._id).unwrap();
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error("Failed to delete facility:", error);
    }
  };

  const handleRowClick = (facility: Facility) => {
    router.push(facilityPath(facility.audit_type, facility._id));
  };

  const handleCreateFacility = () => {
    setIsWizardOpen(false);
    refetchFacilities();
  };

  const handleEditComplete = () => {
    setEditOpen(false);
    setSelectedFacilityId(null);
    refetchFacilities();
  };

  return (
    <DashboardLayout
      title="Facilities"
      subtitle="Manage all audited facilities"
    >
      <div className="mb-4 flex min-w-0 flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="relative min-w-0 w-full flex-1 sm:max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by name, city, type, status, contacts, audit type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-input pl-9"
          />
        </div>

        {canCreateFacility ? (
          <Button
            onClick={() => setIsWizardOpen(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Facility
          </Button>
        ) : null}
      </div>

      {/* Tabs list filter */}
      <div className="w-full overflow-x-auto pb-4">
        <Tabs defaultValue="all" value={selectedAuditType} onValueChange={setSelectedAuditType} className="w-full">
          <TabsList className="inline-flex w-max min-w-full justify-start md:min-w-0 bg-muted/50 p-1">
            <TabsTrigger value="all" className="px-4 py-2">
              All Facilities
            </TabsTrigger>
            {AUDIT_TYPE_OPTIONS.map((type) => (
              <TabsTrigger key={type} value={type} className="px-4 py-2">
                {type}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Facilities Cards/Widgets listing */}
      {facilitiesLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="flex flex-col justify-between h-[320px] overflow-hidden">
              <CardHeader className="p-5 pb-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="mt-4 flex items-start gap-2.5">
                  <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
                  <div className="space-y-2 w-full">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-5 py-4 space-y-3.5 border-y bg-muted/5">
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
              <CardFooter className="p-4 flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16 rounded" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : paginatedFacilities.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
          <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4 animate-pulse" />
          <h3 className="text-lg font-semibold text-foreground">No facilities found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            {facilities.length === 0
              ? "Get started by creating your first facility."
              : "No facilities match your search query or selected audit type."}
          </p>
          {canCreateFacility && facilities.length === 0 && (
            <Button onClick={() => setIsWizardOpen(true)} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Create Facility
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {paginatedFacilities.map((facility) => {
            const isClosed = Boolean(facility.audit_closure?.closed_at);
            return (
              <Card
                key={facility._id}
                onClick={() => handleRowClick(facility)}
                className={cn(
                  "group relative flex flex-col justify-between border-l-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-pointer overflow-hidden",
                  isClosed
                    ? "border-l-emerald-500 hover:border-l-emerald-600"
                    : facility.audit_type === "Electrical Energy Audit"
                    ? "border-l-amber-500 hover:border-l-amber-600"
                    : facility.audit_type === "Electrical Safety Audit"
                    ? "border-l-rose-500 hover:border-l-rose-600"
                    : facility.audit_type === "Thermal Audit"
                    ? "border-l-orange-500 hover:border-l-orange-600"
                    : facility.audit_type === "Lightning Arrester Audit"
                    ? "border-l-sky-500 hover:border-l-sky-600"
                    : "border-l-primary hover:border-l-primary/80"
                )}
              >
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded truncate max-w-[140px] inline-block shrink-0" title={facility.audit_type}>
                      {facility.audit_type || "No Audit Type"}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <StatusBadge status={facility.status} />
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                          isClosed
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                        }`}
                      >
                        {isClosed ? "Closed" : "Open"}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-start gap-2.5 min-w-0">
                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="truncate text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                        {facility.name}
                      </CardTitle>
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground min-w-0">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="block truncate flex-1">
                          {facility.city}
                          {facility.address ? `, ${facility.address}` : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="px-5 py-3 space-y-3 text-xs text-muted-foreground border-y border-muted/20 bg-muted/5 flex-1 min-w-0">
                  {facility.facility_type && (
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium text-foreground min-w-[75px] shrink-0">Type:</span>
                      <span className="block truncate flex-1">{facility.facility_type}</span>
                    </div>
                  )}

                  {/* Client Rep info */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 text-foreground font-medium min-w-0">
                      <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="block truncate flex-1">{facility.client_representative || "No Representative"}</span>
                    </div>
                    {(facility.client_contact_number || facility.client_email) && (
                      <div className="pl-[22px] space-y-0.5 text-[11px] min-w-0">
                        {facility.client_contact_number && (
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Phone className="h-3 w-3 text-muted-foreground/70 shrink-0" />
                            <span className="block truncate flex-1">{facility.client_contact_number}</span>
                          </div>
                        )}
                        {facility.client_email && (
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Mail className="h-3 w-3 text-muted-foreground/70 shrink-0" />
                            <span className="block truncate flex-1">{facility.client_email}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-dashed border-muted/50 text-[11px] min-w-0">
                    <div className="min-w-0">
                      <span className="block text-[10px] text-muted-foreground/70 uppercase truncate">Start Date</span>
                      <div className="flex items-center gap-1 mt-0.5 text-foreground min-w-0">
                        <Calendar className="h-3 w-3 text-muted-foreground/80 shrink-0" />
                        <span className="block truncate flex-1">{facility.start_date ? new Date(facility.start_date).toLocaleDateString() : "—"}</span>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[10px] text-muted-foreground/70 uppercase truncate">Target Closure</span>
                      <div className="flex items-center gap-1 mt-0.5 text-foreground min-w-0">
                        <Calendar className="h-3 w-3 text-muted-foreground/80 shrink-0" />
                        <span className="block truncate flex-1">{facility.closure_date ? new Date(facility.closure_date).toLocaleDateString() : "—"}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="p-4 flex items-center justify-between gap-2">
                  <div className="flex items-center text-xs font-semibold text-primary group-hover:underline">
                    <span>View Details</span>
                    <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                      disabled={!canUpdateFacility || isClosed}
                      title={
                        !canUpdateFacility
                          ? "You do not have permission to edit facilities."
                          : isClosed
                          ? "Facility audit is closed; editing is locked."
                          : "Edit Facility"
                      }
                      onClick={(e) => handleEditFacility(e, facility)}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    {canDeleteFacility ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        disabled={isDeleting}
                        title="Delete Facility"
                        onClick={(e) => handleDeleteFacility(e, facility)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    ) : null}
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      <div className="mt-6 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground sm:text-sm">
          {totalFiltered === 0 ? (
            <>
              {facilities.length === 0
                ? "No facilities yet."
                : "No facilities match your search."}
            </>
          ) : (
            <>
              Showing {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, totalFiltered)} of {totalFiltered}{" "}
              facilities
            </>
          )}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1 || facilitiesLoading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="tabular-nums text-xs text-muted-foreground sm:text-sm">
            Page {page} of {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages || facilitiesLoading || totalFiltered === 0}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      </div>

      {canCreateFacility || canUpdateFacility ? (
        <>
          {canCreateFacility ? (
            <CreateFacilityForm
              open={isWizardOpen}
              onOpenChange={setIsWizardOpen}
              onComplete={handleCreateFacility}
            />
          ) : null}
          {canUpdateFacility ? (
            <EditFacilityForm
              open={editOpen}
              onOpenChange={setEditOpen}
              onComplete={handleEditComplete}
              facilityId={selectedFacilityId}
            />
          ) : null}
        </>
      ) : null}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete facility?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete{" "}
              <strong>{deleteTarget?.name || "this facility"}</strong>. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={() => void confirmDeleteFacility()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Facility"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

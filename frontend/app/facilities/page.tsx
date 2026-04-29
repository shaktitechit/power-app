"use client";

import { canManageResource } from "@/lib/authRoles";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DataTable, Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, Search, Building2, Pencil, Trash2 } from "lucide-react";
import {
  type Facility,
  useGetFacilitiesQuery,
  useDeleteFacilityMutation,
} from "@/store/slices/facilityApiSlice";
import { useAppSelector } from "@/store/hooks";
import { facilityPath } from "@/lib/facilityRoutes";

const PAGE_SIZE = 10;

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
  const canUpdateFacility = canManageResource(
    user?.role,
    user?.permissions || [],
    "facility",
    "update",
  );
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
    const q = searchQuery.trim().toLowerCase();
    if (!q) return facilities;
    return facilities.filter((facility) =>
      facilitySearchHaystack(facility).includes(q),
    );
  }, [facilities, searchQuery]);

  const totalFiltered = filteredFacilities.length;
  const totalPages =
    totalFiltered === 0 ? 1 : Math.ceil(totalFiltered / PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

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

  const actionsColumn: Column<Facility> = {
    key: "actions",
    header: "Actions",
    render: (row: Facility) => {
      const facilityClosed = Boolean(row.audit_closure?.closed_at);
      return (
        <div
          className="flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="outline"
            size="sm"
            disabled={!canUpdateFacility || facilityClosed}
            title={
              !canUpdateFacility
                ? "You do not have permission to edit facilities."
                : facilityClosed
                ? "Facility audit is closed; editing is locked."
                : undefined
            }
            onClick={(e) => handleEditFacility(e, row)}
          >
            <Pencil className="mr-1 h-4 w-4" />
            Edit
          </Button>
          {canDeleteFacility ? (
            <Button
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              onClick={(e) => handleDeleteFacility(e, row)}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Delete
            </Button>
          ) : null}
        </div>
      );
    },
  };

  const columns: Column<Facility>[] = [
    {
      key: "name",
      header: "Facility",
      render: (row) => (
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:h-10 sm:w-10">
            <Building2 className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground sm:text-base">
              {row.name}
            </p>
            <p className="truncate text-xs text-muted-foreground sm:text-sm">
              {row.city}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "closure_status",
      header: "Closure Status",
      render: (row) => {
        const isClosed = Boolean(row.audit_closure?.closed_at);
        return (
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
              isClosed
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                : "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
            }`}
          >
            {isClosed ? "Closed" : "Open"}
          </span>
        );
      },
    },
    {
      key: "client_representative",
      header: "Client Representative",
      hideOnMobile: true,
      render: (row) => (
        <span className="text-foreground">{row.client_representative}</span>
      ),
    },
    {
      key: "facility_type",
      header: "Facility Type",
      hideOnMobile: true,
      render: (row) => (
        <span className="text-foreground">
          {row.facility_type?.trim() || "—"}
        </span>
      ),
    },
    {
      key: "audit_type",
      header: "Audit Type",
      hideOnMobile: true,
      render: (row) => (
        <span className="text-foreground text-sm leading-snug">
          {row.audit_type || "—"}
        </span>
      ),
    },
    ...(canUpdateFacility || canDeleteFacility ? [actionsColumn] : []),
  ];

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
  const FacilitiesTable = DataTable as any;

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

      <FacilitiesTable
        columns={columns}
        data={paginatedFacilities}
        loading={facilitiesLoading}
        onRowClick={(row?: Facility) => row && handleRowClick(row)}
        emptyMessage="No facilities found"
      />

      <div className="mt-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

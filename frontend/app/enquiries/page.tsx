"use client";

import { canEditEnquiry } from "@/lib/enquiryAccess";
import { EnquiryStatusPill } from "@/components/enquiry/enquiry-status-pill";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DataTable, Column } from "@/components/ui/data-table";
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
import { CreateEnquiryForm } from "@/components/enquiry/create-enquiry-form";
import { EditEnquiryForm } from "@/components/enquiry/edit-enquiry-form";
import { Plus, Search, MessageSquare, Pencil, Trash2 } from "lucide-react";
import {
  type Enquiry,
  useGetEnquiriesQuery,
  useDeleteEnquiryMutation,
} from "@/store/slices/enquiryApiSlice";
import { useAppSelector } from "@/store/hooks";
import { enquirySearchHaystack } from "@/lib/enquirySearchHaystack";

const PAGE_SIZE = 10;

const TERMINAL_ENQUIRY_STATUSES = new Set([
  "won",
  "lost",
  "dropped",
]);

export default function EnquiriesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedEnquiryId, setSelectedEnquiryId] = useState<string | null>(
    null,
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Enquiry | null>(null);

  const user = useAppSelector((state) => state.auth.user);
  const userId = user?._id?.toString();

  const canCreateEnquiry = Boolean(user);
  const canDeleteEnquiry = user?.role === "super_admin";

  const {
    data,
    isLoading: enquiriesLoading,
    refetch: refetchEnquiries,
  } = useGetEnquiriesQuery();

  const [deleteEnquiry, { isLoading: isDeleting }] =
    useDeleteEnquiryMutation();

  const enquiries = data?.data ?? [];

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return enquiries;
    return enquiries.filter((row) =>
      enquirySearchHaystack(row).includes(q),
    );
  }, [enquiries, searchQuery]);

  const totalFiltered = filtered.length;
  const totalPages =
    totalFiltered === 0 ? 1 : Math.ceil(totalFiltered / PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const handleEdit = (
    e: React.MouseEvent<HTMLButtonElement>,
    row: Enquiry,
  ) => {
    e.stopPropagation();
    setSelectedEnquiryId(row._id);
    setEditOpen(true);
  };

  const handleDelete = (
    e: React.MouseEvent<HTMLButtonElement>,
    row: Enquiry,
  ) => {
    e.stopPropagation();
    setDeleteTarget(row);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget?._id) return;
    if (deleteTarget.enquiry_status === "won") return;
    try {
      await deleteEnquiry(deleteTarget._id).unwrap();
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error("Failed to delete enquiry:", error);
    }
  };

  const actionsColumn: Column<Enquiry> = {
    key: "actions",
    header: "Actions",
    render: (row: Enquiry) => {
      const permissionEdit =
        user?.role === "super_admin" || canEditEnquiry(userId, row);
      const leadClosedOrSubmitted = TERMINAL_ENQUIRY_STATUSES.has(
        row.enquiry_status,
      );
      const editable = permissionEdit && !leadClosedOrSubmitted;
      const editDisabledReason = leadClosedOrSubmitted
        ? "Submitted or closed leads cannot be edited."
        : !permissionEdit
          ? "Only super admins or users who created / are assigned to this enquiry can edit."
          : undefined;
      const deleteBlockedSubmitted = row.enquiry_status === "won";
      const deleteDisabled =
        isDeleting ||
        deleteBlockedSubmitted;
      const deleteDisabledReason = deleteBlockedSubmitted
        ? "Submitted (won) leads cannot be deleted."
        : undefined;
      return (
        <div
          className="flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="outline"
            size="sm"
            disabled={!editable}
            title={editDisabledReason}
            onClick={(e) => handleEdit(e, row)}
          >
            <Pencil className="mr-1 h-4 w-4" />
            Edit
          </Button>
          {canDeleteEnquiry ? (
            <Button
              variant="destructive"
              size="sm"
              disabled={deleteDisabled}
              title={deleteDisabledReason}
              onClick={(e) => handleDelete(e, row)}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Delete
            </Button>
          ) : null}
        </div>
      );
    },
  };

  const columns: Column<Enquiry>[] = [
    {
      key: "name",
      header: "Enquiry",
      render: (row) => (
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:h-10 sm:w-10">
            <MessageSquare className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
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
      key: "enquiry_status",
      header: "Status",
      render: (row) => <EnquiryStatusPill status={row.enquiry_status} />,
    },
    {
      key: "assigned_to",
      header: "Assigned",
      hideOnMobile: true,
      render: (row) => {
        const a = row.assigned_to;
        if (!a) return <span className="text-muted-foreground">—</span>;
        if (typeof a === "object")
          return (
            <span className="text-foreground">{a.name ?? a.email ?? "—"}</span>
          );
        return <span className="font-mono text-xs">{String(a)}</span>;
      },
    },
    {
      key: "next_followup_date",
      header: "Next follow-up",
      hideOnMobile: true,
      render: (row) => (
        <span className="text-sm text-foreground">
          {row.next_followup_date
            ? new Date(row.next_followup_date).toLocaleDateString()
            : "—"}
        </span>
      ),
    },
    {
      key: "converted",
      header: "Facility",
      hideOnMobile: true,
      render: (row) =>
        row.is_converted_to_facility ? (
          <span className="text-emerald-700 dark:text-emerald-400">Yes</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    ...(user ? [actionsColumn] : []),
  ];

  const EnquiriesTable = DataTable as any;

  return (
    <DashboardLayout
      title="Enquiries"
      subtitle="Sales pipeline and lead tracking"
    >
      <div className="mb-4 flex min-w-0 flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="relative min-w-0 w-full flex-1 sm:max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by name, city, status, contacts, notes…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-input pl-9"
          />
        </div>

        {canCreateEnquiry ? (
          <Button
            onClick={() => setCreateOpen(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create enquiry
          </Button>
        ) : null}
      </div>

      <EnquiriesTable
        columns={columns}
        data={paginated}
        loading={enquiriesLoading}
        onRowClick={(row?: Enquiry) => row && router.push(`/enquiries/${row._id}`)}
        emptyMessage="No enquiries found"
      />

      <div className="mt-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground sm:text-sm">
          {totalFiltered === 0 ? (
            <>
              {enquiries.length === 0
                ? "No enquiries yet."
                : "No enquiries match your search."}
            </>
          ) : (
            <>
              Showing {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, totalFiltered)} of {totalFiltered}{" "}
              enquiries
            </>
          )}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1 || enquiriesLoading}
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
            disabled={
              page >= totalPages ||
              enquiriesLoading ||
              totalFiltered === 0
            }
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      </div>

      {canCreateEnquiry ? (
        <CreateEnquiryForm
          open={createOpen}
          onOpenChange={setCreateOpen}
          onComplete={() => void refetchEnquiries()}
        />
      ) : null}

      {user ? (
        <EditEnquiryForm
          open={editOpen}
          onOpenChange={setEditOpen}
          onComplete={() => {
            setSelectedEnquiryId(null);
            void refetchEnquiries();
          }}
          enquiryId={selectedEnquiryId}
        />
      ) : null}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete enquiry?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove{" "}
              <strong>{deleteTarget?.name || "this enquiry"}</strong> from active
              lists (follow-ups and quotations for this enquiry will also be
              archived). Only super admins can delete.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={
                isDeleting || deleteTarget?.enquiry_status === "won"
              }
              onClick={() => void confirmDelete()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting…" : "Delete enquiry"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

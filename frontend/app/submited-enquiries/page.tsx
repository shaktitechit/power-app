"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { EnquiryStatusPill } from "@/components/enquiry/enquiry-status-pill";
import { enquirySearchHaystack } from "@/lib/enquirySearchHaystack";
import {
  Search,
  MessageSquare,
  ArrowLeft,
  Pencil,
  Building2,
  Ban,
} from "lucide-react";
import {
  type Enquiry,
  useGetEnquiriesQuery,
  useUpdateEnquiryMutation,
} from "@/store/slices/enquiryApiSlice";
import { useAppSelector } from "@/store/hooks";
import { CreateFacilityForm } from "@/components/facility/create-facility-form";
import { EditFacilityForm } from "@/components/facility/edit-facility-form";

const PAGE_SIZE = 10;

function convertedFacilityId(e: Enquiry): string | null {
  const c = e.converted_facility_id;
  if (c == null || c === "") return null;
  if (typeof c === "object" && c !== null && "_id" in c && Boolean(c._id)) {
    return String(c._id);
  }
  return String(c);
}

function isFacilityLinked(enquiry: Enquiry): boolean {
  return convertedFacilityId(enquiry) != null;
}

export default function SubmittedEnquiriesPage() {
  const router = useRouter();
  const user = useAppSelector((s) => s.auth.user);
  const isSuperAdmin = user?.role === "super_admin";

  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const [facilitySourceEnquiry, setFacilitySourceEnquiry] =
    useState<Enquiry | null>(null);
  const [createFacilityOpen, setCreateFacilityOpen] = useState(false);
  const [editFacilityOpen, setEditFacilityOpen] = useState(false);
  const [editFacilityId, setEditFacilityId] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<Enquiry | null>(null);

  const [rejectSubmission, { isLoading: isRejecting }] =
    useUpdateEnquiryMutation();

  useEffect(() => {
    if (user != null && !isSuperAdmin) {
      router.replace("/dashboard");
    }
  }, [user, isSuperAdmin, router]);

  const {
    data,
    isLoading: enquiriesLoading,
    refetch,
  } = useGetEnquiriesQuery(
    { enquiry_status: "won" },
    { skip: !isSuperAdmin },
  );

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

  const confirmRejectSubmission = async () => {
    if (!rejectTarget?._id || rejectTarget.enquiry_status !== "won") return;
    if (isFacilityLinked(rejectTarget)) return;
    try {
      await rejectSubmission({
        id: rejectTarget._id,
        enquiry_status: "lost",
      }).unwrap();
      setRejectDialogOpen(false);
      setRejectTarget(null);
      await refetch();
    } catch (error) {
      console.error("Failed to reject submission:", error);
    }
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
      render: (row) => (
        <div className="space-y-1">
          <p className="text-sm">
            {row.is_converted_to_facility && isFacilityLinked(row) ? (
              <span className="text-emerald-700 dark:text-emerald-400">
                Linked
              </span>
            ) : (
              <span className="text-muted-foreground">Not created</span>
            )}
          </p>
          <div
            className="flex flex-wrap gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            {isFacilityLinked(row) ? (
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => {
                  setEditFacilityId(convertedFacilityId(row));
                  setEditFacilityOpen(true);
                }}
              >
                <Pencil className="mr-1 h-3.5 w-3.5" />
                Edit
              </Button>
            ) : (
              <Button
                size="sm"
                className="h-8"
                onClick={() => {
                  setFacilitySourceEnquiry(row);
                  setCreateFacilityOpen(true);
                }}
              >
                <Building2 className="mr-1 h-3.5 w-3.5" />
                Create
              </Button>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => {
        const linked = isFacilityLinked(row);
        const rejectBlocked = linked || row.enquiry_status !== "won";
        const rejectTitle = linked
          ? "Reject is not available when a facility is linked."
          : row.enquiry_status !== "won"
            ? undefined
            : "Reject — marks lost and removes from submitted list.";
        return (
          <div
            className="flex flex-wrap gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={rejectBlocked || isRejecting}
              title={rejectTitle}
              onClick={() => {
                setRejectTarget(row);
                setRejectDialogOpen(true);
              }}
            >
              <Ban className="mr-1 h-3.5 w-3.5" />
              Reject
            </Button>
          </div>
        );
      },
    },
  ];

  const SubmittedTable = DataTable as any;

  if (user === null) {
    return (
      <DashboardLayout
        title="Submitted enquiries"
        subtitle="Leads marked as won from the pipeline"
      >
        <p className="text-sm text-muted-foreground">Loading…</p>
      </DashboardLayout>
    );
  }

  if (!isSuperAdmin) {
    return (
      <DashboardLayout
        title="Submitted enquiries"
        subtitle="Leads marked as won from the pipeline"
      >
        <p className="text-sm text-muted-foreground">
          This page is restricted to super administrators.
        </p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Submitted enquiries"
      subtitle="Leads marked as won from the pipeline"
    >
      <div className="mb-4 sm:mb-6">
        <Button variant="ghost" size="sm" className="w-fit px-0" asChild>
          <Link href="/enquiries" className="inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            All enquiries
          </Link>
        </Button>
      </div>

      <div className="mb-4 flex min-w-0 flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="relative min-w-0 w-full flex-1 sm:max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search submitted enquiries…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-input pl-9"
          />
        </div>
      </div>

      <SubmittedTable
        columns={columns}
        data={paginated}
        loading={enquiriesLoading}
        onRowClick={(row?: Enquiry) => row && router.push(`/enquiries/${row._id}`)}
        emptyMessage="No submitted enquiries yet"
      />

      <div className="mt-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground sm:text-sm">
          {totalFiltered === 0 ? (
            <>
              {enquiries.length === 0
                ? "Nothing submitted yet."
                : "No results match your search."}
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

      <CreateFacilityForm
        open={createFacilityOpen}
        fromEnquiry={facilitySourceEnquiry}
        onOpenChange={(open) => {
          setCreateFacilityOpen(open);
          if (!open) setFacilitySourceEnquiry(null);
        }}
        onComplete={() => void refetch()}
      />

      <EditFacilityForm
        open={editFacilityOpen}
        onOpenChange={(open) => {
          setEditFacilityOpen(open);
          if (!open) setEditFacilityId(null);
        }}
        onComplete={() => void refetch()}
        facilityId={editFacilityId}
      />

      <AlertDialog
        open={rejectDialogOpen}
        onOpenChange={(open) => {
          setRejectDialogOpen(open);
          if (!open) setRejectTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject submission?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark{" "}
              <strong>{rejectTarget?.name ?? "this enquiry"}</strong> as{" "}
              <strong>lost</strong> and remove it from submitted enquiries.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRejecting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={
                isRejecting ||
                !rejectTarget?._id ||
                rejectTarget.enquiry_status !== "won" ||
                (rejectTarget != null && isFacilityLinked(rejectTarget))
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void confirmRejectSubmission()}
            >
              {isRejecting ? "Rejecting…" : "Reject submission"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

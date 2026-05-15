"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DataTable, Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toastHandler } from "@/lib/toast";
import { quotationStatusLabel } from "@/lib/enquiryConstants";
import {
  QuotationWorkflowDialog,
  targetStatusForStep,
  type QuotationWorkflowStep,
} from "@/components/enquiry/quotation-workflow-dialog";
import {
  type Quotation,
  useGetPendingQuotationsForApprovalQuery,
  useUpdateQuotationMutation,
} from "@/store/slices/enquiryApiSlice";
import { useAppSelector } from "@/store/hooks";
import {
  Search,
  ArrowLeft,
  MessageSquare,
  FileText,
  Check,
  X,
  Eye,
} from "lucide-react";

const PAGE_SIZE = 10;

type PendingQuotDialog =
  | { type: "view"; q: Quotation }
  | {
      type: "workflow";
      step: Extract<
        QuotationWorkflowStep,
        "approve" | "reject"
      >;
      q: Quotation;
    };

function formatShortDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

function formatInr(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function enquiryIdFromQuotation(q: Quotation): string | null {
  const e = q.enquiry_id;
  if (e == null) return null;
  if (typeof e === "object" && "_id" in e && Boolean(e._id)) {
    return String(e._id);
  }
  if (typeof e === "string" && e.trim()) return e;
  return null;
}

function enquiryLabel(q: Quotation): { name: string; city: string } {
  const e = q.enquiry_id;
  if (typeof e === "object" && e != null) {
    return {
      name: e.name?.trim() || "—",
      city: e.city?.trim() || "—",
    };
  }
  return { name: "—", city: "—" };
}

function pendingQuotationHaystack(row: Quotation): string {
  const { name, city } = enquiryLabel(row);
  const fromUser =
    typeof row.created_by === "object" &&
    row.created_by != null &&
    "name" in row.created_by
      ? `${row.created_by.name ?? ""} ${row.created_by.email ?? ""}`
      : "";
  return [row.quotation_number, row.notes, name, city, fromUser]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export default function PendingQuotationPage() {
  const router = useRouter();
  const user = useAppSelector((s) => s.auth.user);
  const isSuperAdmin = user?.role === "super_admin";

  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [qtDialog, setQtDialog] = useState<PendingQuotDialog | null>(null);

  useEffect(() => {
    if (user != null && !isSuperAdmin) {
      router.replace("/dashboard");
    }
  }, [user, isSuperAdmin, router]);

  const { data, isLoading } = useGetPendingQuotationsForApprovalQuery(
    undefined,
    { skip: !isSuperAdmin },
  );

  const [updateQuote, { isLoading: quoteBusy }] = useUpdateQuotationMutation();

  const rows = data?.data ?? [];

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => pendingQuotationHaystack(row).includes(q));
  }, [rows, searchQuery]);

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

  const confirmPendingWorkflow = useCallback(
    async (
      step: Extract<QuotationWorkflowStep, "approve" | "reject">,
      quotation: Quotation,
      remark: string,
    ) => {
      const enquiryId = enquiryIdFromQuotation(quotation);
      if (!enquiryId) return;
      const status = targetStatusForStep(step);
      if (!status) return;

      try {
        await toastHandler({
          action: () =>
            updateQuote({
              enquiryId,
              quotationId: quotation._id,
              status,
              workflow_remark: remark.trim() || undefined,
            }).unwrap(),
          loading:
            step === "approve" ? "Approving…" : "Rejecting…",
          success:
            step === "approve"
              ? "Quotation approved."
              : "Quotation rejected.",
        });
        setQtDialog(null);
      } catch {
        /* toast */
      }
    },
    [updateQuote],
  );

  const columns: Column<Quotation>[] = useMemo(
    () => [
      {
        key: "enquiry",
        header: "Enquiry",
        render: (row) => {
          const { name, city } = enquiryLabel(row);
          const eid = enquiryIdFromQuotation(row);
          return (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:h-10 sm:w-10">
                <MessageSquare className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                {eid ? (
                  <Link
                    href={`/enquiries/${eid}`}
                    className="truncate text-sm font-medium text-primary underline-offset-4 hover:underline sm:text-base"
                  >
                    {name}
                  </Link>
                ) : (
                  <p className="truncate text-sm font-medium">{name}</p>
                )}
                <p className="truncate text-xs text-muted-foreground sm:text-sm">
                  {city}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        key: "quotation_number",
        header: "Quotation #",
        render: (row) => (
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="font-mono text-sm">{row.quotation_number ?? "—"}</span>
          </div>
        ),
      },
      {
        key: "amount",
        header: "Amount",
        hideOnMobile: true,
        render: (row) => formatInr(row.amount),
      },
      {
        key: "status",
        header: "Status",
        hideOnMobile: true,
        render: (row) => (
          <span className="text-sm">{quotationStatusLabel(row.status)}</span>
        ),
      },
      {
        key: "created_by",
        header: "Sent by",
        hideOnMobile: true,
        render: (row) => {
          const c = row.created_by;
          if (typeof c === "object" && c != null)
            return (
              <span className="text-sm">
                {c.name ?? c.email ?? "—"}
              </span>
            );
          return <span className="font-mono text-xs">{String(c ?? "—")}</span>;
        },
      },
      {
        key: "updated_at",
        header: "Submitted",
        hideOnMobile: true,
        render: (row) => formatShortDate(row.updatedAt),
      },
      {
        key: "actions",
        header: "Actions",
        render: (row) => {
          const eid = enquiryIdFromQuotation(row);
          if (!eid || row.status !== "pending_approval") {
            return <span className="text-xs text-muted-foreground">—</span>;
          }
          const busy = quoteBusy;
          return (
            <div
              className="flex flex-wrap gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                disabled={busy}
                onClick={() => setQtDialog({ type: "view", q: row })}
              >
                <Eye className="mr-1 h-3.5 w-3.5" />
                View
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                disabled={busy}
                onClick={() =>
                  setQtDialog({
                    type: "workflow",
                    step: "approve",
                    q: row,
                  })
                }
              >
                <Check className="mr-1 h-3.5 w-3.5" />
                Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={busy}
                onClick={() =>
                  setQtDialog({
                    type: "workflow",
                    step: "reject",
                    q: row,
                  })
                }
              >
                <X className="mr-1 h-3.5 w-3.5" />
                Reject
              </Button>
            </div>
          );
        },
      },
    ],
    [quoteBusy],
  );

  const PendingTable = DataTable as any;

  if (user === null) {
    return (
      <DashboardLayout
        title="Pending quotations"
        subtitle="Awaiting super admin approval"
      >
        <p className="text-sm text-muted-foreground">Loading…</p>
      </DashboardLayout>
    );
  }

  if (!isSuperAdmin) {
    return (
      <DashboardLayout
        title="Pending quotations"
        subtitle="Awaiting super admin approval"
      >
        <p className="text-sm text-muted-foreground">
          This page is restricted to super administrators.
        </p>
      </DashboardLayout>
    );
  }

  const { name: dlgEnquiryName, city: dlgCity } = qtDialog?.q
    ? enquiryLabel(qtDialog.q)
    : { name: "", city: "" };

  return (
    <DashboardLayout
      title="Pending quotations"
      subtitle="Approve or reject quotations submitted for approval"
    >
      <QuotationWorkflowDialog
        open={qtDialog != null}
        onOpenChange={(open) => {
          if (!open) setQtDialog(null);
        }}
        mode={
          qtDialog?.type === "view"
            ? { type: "view" }
            : qtDialog?.type === "workflow"
              ? {
                  type: "workflow",
                  step: qtDialog.step,
                }
              : null
        }
        quotation={qtDialog?.q ?? null}
        enquiryName={dlgEnquiryName || undefined}
        enquiryCity={dlgCity || undefined}
        onWorkflowConfirm={
          qtDialog?.type === "workflow"
            ? (remark) => {
                const d = qtDialog;
                if (d?.type !== "workflow") return;
                return confirmPendingWorkflow(d.step, d.q, remark);
              }
            : undefined
        }
        isSubmitting={quoteBusy}
      />

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
            placeholder="Search by enquiry, quotation #, sender…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-input pl-9"
          />
        </div>
      </div>

      <PendingTable
        columns={columns}
        data={paginated}
        loading={isLoading}
        onRowClick={(row?: Quotation) => {
          const eid = row && enquiryIdFromQuotation(row);
          if (eid) router.push(`/enquiries/${eid}`);
        }}
        emptyMessage="No quotations pending approval"
      />

      <div className="mt-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground sm:text-sm">
          {totalFiltered === 0 ? (
            <>
              {rows.length === 0
                ? "Nothing in the approval queue."
                : "No results match your search."}
            </>
          ) : (
            <>
              Showing {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, totalFiltered)} of {totalFiltered}{" "}
              quotations
            </>
          )}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1 || isLoading}
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
              page >= totalPages || isLoading || totalFiltered === 0
            }
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

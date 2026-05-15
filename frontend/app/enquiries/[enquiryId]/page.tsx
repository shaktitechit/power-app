"use client";

import { useCallback, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable, Column } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EnquiryStatusPill } from "@/components/enquiry/enquiry-status-pill";
import { canEditEnquiry } from "@/lib/enquiryAccess";
import {
  ENQUIRY_STATUS_OPTIONS,
  FOLLOW_UP_MODE_OPTIONS,
  FOLLOW_UP_OUTCOME_OPTIONS,
  quotationStatusLabel,
} from "@/lib/enquiryConstants";
import { toastHandler } from "@/lib/toast";
import {
  type FollowUp,
  type Quotation,
  type EnquiryStatus,
  useGetEnquiryByIdQuery,
  useGetFollowUpsQuery,
  useGetQuotationsQuery,
  useCreateFollowUpMutation,
  useUpdateFollowUpMutation,
  useCreateQuotationMutation,
  useDeleteQuotationMutation,
  useUpdateQuotationMutation,
  useUpdateEnquiryMutation,
} from "@/store/slices/enquiryApiSlice";
import { useAppSelector } from "@/store/hooks";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  FileText,
  Send,
  CircleSlash,
  Pencil,
  Trash2,
  Eye,
} from "lucide-react";
import {
  QuotationWorkflowDialog,
  targetStatusForStep,
  type QuotationWorkflowStep,
} from "@/components/enquiry/quotation-workflow-dialog";

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

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

function getTodayDateInput(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const TERMINAL_ENQUIRY_STATUSES = new Set([
  "won",
  "lost",
  "dropped",
]);

const QUOTATION_TABLE_WORKFLOW_STATUSES = new Set<string>([
  "draft",
  "pending_approval",
  "approved",
  "rejected",
]);

type QuotationUiDialog =
  | { type: "view"; q: Quotation }
  | { type: "workflow"; step: QuotationWorkflowStep; q: Quotation };

function telHref(phone?: string | null) {
  if (!phone?.trim()) return null;
  const digits = phone.replace(/\D/g, "");
  return digits.length ? `tel:${digits}` : null;
}

function mailtoHref(email?: string | null) {
  const e = email?.trim();
  return e ? `mailto:${encodeURIComponent(e)}` : null;
}

/** Opens WhatsApp chat; assumes India (+91) when only 10 digits are present. */
function whatsappHref(phone?: string | null) {
  if (!phone?.trim()) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  const wa = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${wa}`;
}

/** Earliest `next_followup_date` across follow-ups for the enquiry snapshot. */
function earliestEnquiryNextFollowDate(
  rows: FollowUp[],
  mode:
    | { type: "create"; newRowNext?: string | null }
    | { type: "update"; followUpId: string; nextIso: string | null },
): string | null {
  const instants: number[] = [];
  for (const r of rows) {
    let raw: string | null | undefined = r.next_followup_date;
    if (mode.type === "update" && r._id === mode.followUpId) {
      raw = mode.nextIso !== null ? mode.nextIso : undefined;
    }
    if (raw) {
      const t = new Date(raw).getTime();
      if (!Number.isNaN(t)) instants.push(t);
    }
  }
  if (mode.type === "create" && mode.newRowNext) {
    const t = new Date(mode.newRowNext).getTime();
    if (!Number.isNaN(t)) instants.push(t);
  }
  if (instants.length === 0) return null;
  return new Date(Math.min(...instants)).toISOString();
}

export default function EnquiryDetailPage() {
  const params = useParams();
  const enquiryId = useMemo(() => {
    const raw = params?.enquiryId;
    return Array.isArray(raw) ? raw[0] : (raw as string) ?? "";
  }, [params?.enquiryId]);

  const user = useAppSelector((s) => s.auth.user);
  const userId = user?._id?.toString();

  const [fuOpen, setFuOpen] = useState(false);
  const [fuEditing, setFuEditing] = useState<FollowUp | null>(null);
  const [fuDate, setFuDate] = useState("");
  const [fuMode, setFuMode] = useState<string>("");
  const [fuRemarks, setFuRemarks] = useState("");
  const [fuOutcome, setFuOutcome] = useState<string>("");
  const [fuNext, setFuNext] = useState("");

  const [qOpen, setQOpen] = useState(false);
  const [qAmount, setQAmount] = useState("");
  const [qValidTill, setQValidTill] = useState("");
  const [qNotes, setQNotes] = useState("");
  const [qDocUrl, setQDocUrl] = useState("");
  const [qtDialog, setQtDialog] = useState<QuotationUiDialog | null>(null);
  const [closeLeadOpen, setCloseLeadOpen] = useState(false);

  const {
    data: enquiryRes,
    isLoading: enquiryLoading,
    isError: enquiryError,
    isFetching: enquiryFetching,
  } = useGetEnquiryByIdQuery(enquiryId, { skip: !enquiryId });

  const { data: fuRes, isLoading: fuLoading } = useGetFollowUpsQuery(
    enquiryId,
    { skip: !enquiryId },
  );

  const { data: qRes, isLoading: qLoading } = useGetQuotationsQuery(
    enquiryId,
    { skip: !enquiryId },
  );

  const [createFu, { isLoading: creatingFu }] = useCreateFollowUpMutation();
  const [updateFu, { isLoading: updatingFu }] = useUpdateFollowUpMutation();

  const [createQ, { isLoading: creatingQ }] = useCreateQuotationMutation();
  const [updateQuote, { isLoading: updatingQuote }] =
    useUpdateQuotationMutation();
  const [deleteQuote, { isLoading: deletingQuote }] =
    useDeleteQuotationMutation();

  const [updateEnquiry, { isLoading: updatingLeadStatus }] =
    useUpdateEnquiryMutation();

  const enquiry = enquiryRes?.data;
  const followUps = fuRes?.data ?? [];
  const quotations = qRes?.data ?? [];

  const canManage =
    user?.role === "super_admin" || (enquiry && canEditEnquiry(userId, enquiry));

  const leadIsTerminal =
    enquiry != null && TERMINAL_ENQUIRY_STATUSES.has(enquiry.enquiry_status);

  /** Follow-ups and quotations are blocked once the lead is won / lost / dropped. */
  const canActOnFollowUpsAndQuotes = canManage && !leadIsTerminal;
  const contactTel = telHref(enquiry?.client_contact_number);
  const contactMail = mailtoHref(enquiry?.client_email);
  const contactWa = whatsappHref(enquiry?.client_contact_number);

  const changePipelineStatus = async (next: EnquiryStatus) => {
    if (!enquiryId || !enquiry || next === enquiry.enquiry_status) return;
    try {
      await toastHandler({
        action: () =>
          updateEnquiry({
            id: enquiryId,
            enquiry_status: next,
          }).unwrap(),
        loading: "Updating pipeline…",
        success: "Pipeline status updated.",
      });
    } catch {
      /* toast */
    }
  };

  const submitLead = async () => {
    if (!enquiryId) return;
    try {
      await toastHandler({
        action: () =>
          updateEnquiry({
            id: enquiryId,
            enquiry_status: "won",
          }).unwrap(),
        loading: "Updating lead…",
        success: "Lead submitted — marked as won.",
      });
    } catch {
      /* toast */
    }
  };

  const closeLeadAs = async (status: "lost" | "dropped") => {
    if (!enquiryId) return;
    try {
      await toastHandler({
        action: () =>
          updateEnquiry({
            id: enquiryId,
            enquiry_status: status,
          }).unwrap(),
        loading: "Closing lead…",
        success:
          status === "lost"
            ? "Lead marked as lost."
            : "Lead closed as dropped.",
      });
      setCloseLeadOpen(false);
    } catch {
      /* toast */
    }
  };

  const openCreateFu = () => {
    setFuEditing(null);
    setFuDate(getTodayDateInput());
    setFuMode("");
    setFuRemarks("");
    setFuOutcome("");
    setFuNext("");
    setFuOpen(true);
  };

  const openEditFu = useCallback((row: FollowUp) => {
    setFuEditing(row);
    const fd = new Date(row.followup_date);
    setFuDate(
      Number.isNaN(fd.getTime())
        ? getTodayDateInput()
        : `${fd.getFullYear()}-${String(fd.getMonth() + 1).padStart(2, "0")}-${String(fd.getDate()).padStart(2, "0")}`,
    );
    setFuMode(row.mode ?? "");
    setFuRemarks(row.remarks ?? "");
    setFuOutcome(row.outcome ?? "");
    if (row.next_followup_date) {
      const nd = new Date(row.next_followup_date);
      setFuNext(
        Number.isNaN(nd.getTime())
          ? ""
          : `${nd.getFullYear()}-${String(nd.getMonth() + 1).padStart(2, "0")}-${String(nd.getDate()).padStart(2, "0")}`,
      );
    } else setFuNext("");
    setFuOpen(true);
  }, []);

  const submitFollowUp = async () => {
    if (!canActOnFollowUpsAndQuotes) return;
    if (!enquiryId || !fuDate) return;
    const followup_date = new Date(fuDate);
    if (Number.isNaN(followup_date.getTime())) return;
    const nextFollow =
      fuNext.trim() === ""
        ? undefined
        : new Date(fuNext).getTime()
          ? new Date(fuNext).toISOString()
          : undefined;

    const body = {
      followup_date: followup_date.toISOString(),
      mode: (fuMode || undefined) as FollowUp["mode"],
      remarks: fuRemarks.trim() || undefined,
      outcome: (fuOutcome || undefined) as FollowUp["outcome"],
      next_followup_date: fuEditing
        ? fuNext.trim() === ""
          ? null
          : nextFollow ?? null
        : nextFollow,
    };

    const editing = fuEditing;

    try {
      await toastHandler({
        action: async () => {
          if (editing) {
            await updateFu({
              enquiryId,
              followUpId: editing._id,
              ...body,
            }).unwrap();
            const nextIso = earliestEnquiryNextFollowDate(followUps, {
              type: "update",
              followUpId: editing._id,
              nextIso: fuNext.trim() === "" ? null : nextFollow ?? null,
            });
            await updateEnquiry({
              id: enquiryId,
              next_followup_date: nextIso,
            }).unwrap();
          } else {
            await createFu({ enquiryId, ...body }).unwrap();
            const nextIso = earliestEnquiryNextFollowDate(followUps, {
              type: "create",
              newRowNext: nextFollow ?? null,
            });
            await updateEnquiry({
              id: enquiryId,
              next_followup_date: nextIso,
            }).unwrap();
          }
        },
        loading: editing ? "Updating follow-up…" : "Creating follow-up…",
        success: editing ? "Follow-up saved." : "Follow-up added.",
      });
      setFuOpen(false);
      setFuEditing(null);
    } catch {
      /* toast */
    }
  };

  const openCreateQuote = () => {
    setQAmount("");
    setQValidTill("");
    setQNotes("");
    setQDocUrl("");
    setQOpen(true);
  };

  const submitQuote = async () => {
    if (!canActOnFollowUpsAndQuotes) return;
    if (!enquiryId) return;
    const amt = Number(qAmount);
    if (Number.isNaN(amt)) {
      return;
    }
    const payloadBase = {
      amount: amt,
      valid_till: qValidTill.trim() === "" ? null : qValidTill,
      notes: qNotes.trim() || undefined,
      document_url: qDocUrl.trim() || undefined,
    };

    try {
      await toastHandler({
        action: () =>
          createQ({ enquiryId, ...payloadBase }).unwrap(),
        loading: "Creating quotation…",
        success: "Draft quotation created.",
      });
      setQOpen(false);
    } catch {
      /* toast */
    }
  };

  const executeQuotationWorkflow = useCallback(
    async (
      step: QuotationWorkflowStep,
      quotation: Quotation,
      remark: string,
    ) => {
      if (!enquiryId) return;
      const workflow_remark = remark.trim() || undefined;

      const stepMessages: Record<
        Exclude<QuotationWorkflowStep, "delete">,
        { loading: string; success: string }
      > = {
        send_for_approval: {
          loading: "Sending for approval…",
          success: "Quotation sent for approval.",
        },
        send_to_client: {
          loading: "Sending to client…",
          success: "Quotation marked as sent to client.",
        },
        approve: {
          loading: "Approving…",
          success: "Quotation approved.",
        },
        reject: {
          loading: "Rejecting…",
          success: "Quotation rejected.",
        },
      };

      try {
        if (step === "delete") {
          if (quotation.status !== "rejected") return;
          await toastHandler({
            action: () =>
              deleteQuote({
                enquiryId,
                quotationId: quotation._id,
                workflow_remark,
              }).unwrap(),
            loading: "Deleting quotation…",
            success: "Quotation deleted.",
          });
        } else {
          const status = targetStatusForStep(step);
          if (!status) return;
          const msg = stepMessages[step];
          await toastHandler({
            action: () =>
              updateQuote({
                enquiryId,
                quotationId: quotation._id,
                status,
                workflow_remark,
              }).unwrap(),
            loading: msg.loading,
            success: msg.success,
          });
        }
        setQtDialog(null);
      } catch {
        /* toast */
      }
    },
    [enquiryId, deleteQuote, updateQuote],
  );

  const quoteBusy = updatingQuote || deletingQuote;

  const followUpColumns: Column<FollowUp>[] = useMemo(
    () => [
      {
        key: "followup_date",
        header: "When",
        render: (row) => formatShortDate(row.followup_date),
      },
      {
        key: "mode",
        header: "Mode",
        hideOnMobile: true,
        render: (row) => row.mode ?? "—",
      },
      {
        key: "outcome",
        header: "Outcome",
        hideOnMobile: true,
        render: (row) =>
          row.outcome ? row.outcome.replace(/_/g, " ") : "—",
      },
      {
        key: "remarks",
        header: "Remarks",
        render: (row) => (
          <span className="line-clamp-2 max-w-[220px] text-sm">
            {row.remarks || "—"}
          </span>
        ),
      },
      ...(canActOnFollowUpsAndQuotes
        ? [
            {
              key: "actions",
              header: "Actions",
              render: (row: FollowUp) => (
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditFu(row)}
                  >
                    <Pencil className="mr-1 h-3.5 w-3.5" />
                    Edit
                  </Button>
                </div>
              ),
            } as Column<FollowUp>,
          ]
        : []),
    ],
    [canActOnFollowUpsAndQuotes, openEditFu],
  );

  const quotationColumns: Column<Quotation>[] = useMemo(() => {
    const cols: Column<Quotation>[] = [
      {
        key: "quotation_number",
        header: "Number",
        render: (row) => row.quotation_number || "—",
      },
      {
        key: "amount",
        header: "Amount",
        render: (row) => formatInr(row.amount),
      },
      {
        key: "status",
        header: "Status",
        render: (row) => (
          <span className="text-sm">{quotationStatusLabel(row.status)}</span>
        ),
      },
      {
        key: "valid_till",
        header: "Valid till",
        hideOnMobile: true,
        render: (row) => formatShortDate(row.valid_till),
      },
    ];

    if (!canActOnFollowUpsAndQuotes) return cols;

    cols.push({
      key: "actions",
      header: "Actions",
      render: (row) => {
        const wf = QUOTATION_TABLE_WORKFLOW_STATUSES.has(row.status);

        const viewBtn = (
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            disabled={quoteBusy}
            onClick={() => setQtDialog({ type: "view", q: row })}
          >
            <Eye className="mr-1 h-3.5 w-3.5" />
            View
          </Button>
        );

        const inner =
          row.status === "draft" ? (
            <>
              {viewBtn}
              <Button
                variant="default"
                size="sm"
                className="h-8"
                disabled={quoteBusy}
                onClick={() =>
                  setQtDialog({
                    type: "workflow",
                    step: "send_for_approval",
                    q: row,
                  })
                }
              >
                <Send className="mr-1 h-3.5 w-3.5" />
                Send for approval
              </Button>
            </>
          ) : row.status === "pending_approval" ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
              {viewBtn}
              <span className="text-xs text-muted-foreground">
                Awaiting approval
                {user?.role === "super_admin" ? (
                  <>
                    <span aria-hidden> · </span>
                    <Link
                      href="/pending-quotation"
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      Review queue
                    </Link>
                  </>
                ) : null}
              </span>
            </div>
          ) : row.status === "approved" ? (
            <>
              {viewBtn}
              <Button
                variant="default"
                size="sm"
                className="h-8"
                disabled={quoteBusy}
                onClick={() =>
                  setQtDialog({
                    type: "workflow",
                    step: "send_to_client",
                    q: row,
                  })
                }
              >
                <Send className="mr-1 h-3.5 w-3.5" />
                Send to client
              </Button>
            </>
          ) : row.status === "rejected" ? (
            <>
              {viewBtn}
              <Button
                variant="destructive"
                size="sm"
                className="h-8"
                disabled={quoteBusy}
                onClick={() =>
                  setQtDialog({
                    type: "workflow",
                    step: "delete",
                    q: row,
                  })
                }
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Delete
              </Button>
            </>
          ) : null;

        return (
          <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
            {!wf ? (
              <span className="text-xs text-muted-foreground">—</span>
            ) : inner ? (
              inner
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            )}
          </div>
        );
      },
    });

    return cols;
  }, [canActOnFollowUpsAndQuotes, quoteBusy, user?.role]);

  const loadingMain =
    !enquiryId || enquiryLoading || (enquiryFetching && !enquiry);

  return (
    <DashboardLayout
      title={enquiry?.name ?? "Enquiry"}
      subtitle={enquiry ? enquiry.city : "Lead details"}
    >
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="w-fit px-0" asChild>
          <Link href="/enquiries" className="inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            All enquiries
          </Link>
        </Button>
      </div>

      {loadingMain ? (
        <p className="text-sm text-muted-foreground">Loading enquiry…</p>
      ) : enquiryError || !enquiry ? (
        <Card>
          <CardHeader>
            <CardTitle>Enquiry not found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This enquiry may have been removed or you do not have access.
            </p>
            <Button asChild variant="outline">
              <Link href="/enquiries">Back to enquiries</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-col gap-4 space-y-0">
                <div className="flex flex-row items-start justify-between gap-4">
                  <div className="min-w-0">
                    <CardTitle className="flex flex-wrap items-center gap-2 text-xl">
                      <span className="truncate">{enquiry.name}</span>
                      <EnquiryStatusPill status={enquiry.enquiry_status} />
                    </CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {enquiry.city}
                      {enquiry.address ? ` · ${enquiry.address}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                  {contactTel ? (
                    <Button variant="secondary" size="sm" asChild className="gap-1.5">
                      <a href={contactTel}>
                        <Phone className="h-4 w-4" />
                        Call
                      </a>
                    </Button>
                  ) : (
                    <Button variant="secondary" size="sm" disabled className="gap-1.5">
                      <Phone className="h-4 w-4" />
                      Call
                    </Button>
                  )}
                  {contactMail ? (
                    <Button variant="secondary" size="sm" asChild className="gap-1.5">
                      <a href={contactMail}>
                        <Mail className="h-4 w-4" />
                        Email
                      </a>
                    </Button>
                  ) : (
                    <Button variant="secondary" size="sm" disabled className="gap-1.5">
                      <Mail className="h-4 w-4" />
                      Email
                    </Button>
                  )}
                  {contactWa ? (
                    <Button variant="secondary" size="sm" asChild className="gap-1.5 text-emerald-700 dark:text-emerald-400">
                      <a
                        href={contactWa}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <WhatsAppGlyph className="h-4 w-4" />
                        WhatsApp
                      </a>
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled
                      className="gap-1.5"
                    >
                      <WhatsAppGlyph className="h-4 w-4" />
                      WhatsApp
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Client
                  </p>
                  <p className="text-sm">
                    {enquiry.client_representative || "—"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {enquiry.client_contact_number || ""}
                    {enquiry.client_contact_number && enquiry.client_email
                      ? " · "
                      : ""}
                    {enquiry.client_email || ""}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Pipeline
                  </p>
                  <p className="text-sm">
                    Source: {enquiry.source?.trim() || "—"}
                  </p>
                  <p className="text-sm">
                    Expected value:{" "}
                    {enquiry.expected_value != null
                      ? formatInr(enquiry.expected_value)
                      : "—"}
                  </p>
                  <p className="text-sm">
                    Next follow-up:{" "}
                    {enquiry.next_followup_date
                      ? formatShortDate(enquiry.next_followup_date)
                      : "—"}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Requested audits
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {(enquiry.requested_audit_types?.length ?? 0) === 0 ? (
                      <span className="text-sm text-muted-foreground">—</span>
                    ) : (
                      enquiry.requested_audit_types?.map((t) => (
                        <span
                          key={t}
                          className="inline-flex rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs"
                        >
                          {t}
                        </span>
                      ))
                    )}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Notes
                  </p>
                  <p className="whitespace-pre-wrap text-sm">
                    {enquiry.notes?.trim() || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Assigned to
                  </p>
                  <p className="text-sm">
                    {enquiry.assigned_to &&
                    typeof enquiry.assigned_to === "object"
                      ? enquiry.assigned_to.name ?? enquiry.assigned_to.email
                      : enquiry.assigned_to
                        ? String(enquiry.assigned_to)
                        : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Created by
                  </p>
                  <p className="text-sm">
                    {typeof enquiry.created_by === "object"
                      ? enquiry.created_by.name ?? enquiry.created_by.email
                      : String(enquiry.created_by)}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Facility conversion
                  </p>
                  <p className="text-sm">
                    {enquiry.is_converted_to_facility ? (
                      <>
                        <span className="text-emerald-600 dark:text-emerald-400">
                          Converted
                        </span>
                        {enquiry.converted_facility_id &&
                        typeof enquiry.converted_facility_id === "object" ? (
                          <>
                            {" "}
                            →{" "}
                            <span className="font-medium">
                              {enquiry.converted_facility_id.name}
                              {enquiry.converted_facility_id.city
                                ? ` (${enquiry.converted_facility_id.city})`
                                : ""}
                            </span>
                          </>
                        ) : enquiry.converted_facility_id ? (
                          <span className="ml-1 font-mono text-xs">
                            {String(enquiry.converted_facility_id)}
                          </span>
                        ) : null}
                      </>
                    ) : (
                      "Not converted"
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="space-y-2">
                  <Label htmlFor="pipeline-status" className="text-xs">
                    Pipeline status
                  </Label>
                  <Select
                    value={enquiry.enquiry_status}
                    onValueChange={(v) =>
                      void changePipelineStatus(v as EnquiryStatus)
                    }
                    disabled={
                      !canManage || leadIsTerminal || updatingLeadStatus
                    }
                  >
                    <SelectTrigger id="pipeline-status" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ENQUIRY_STATUS_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {leadIsTerminal ? (
                    <p className="text-xs text-muted-foreground">
                      Pipeline is fixed for submitted or closed leads.
                    </p>
                  ) : null}
                </div>

                {canManage && !leadIsTerminal ? (
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      onClick={() => void submitLead()}
                      disabled={updatingLeadStatus}
                      className="w-full gap-1.5"
                    >
                      <Send className="h-4 w-4" />
                      Submit lead
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCloseLeadOpen(true)}
                      disabled={updatingLeadStatus}
                      className="w-full gap-1.5"
                    >
                      <CircleSlash className="h-4 w-4" />
                      Close lead
                    </Button>
                  </div>
                ) : null}

                <div className="space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">Updated: </span>
                    {formatShortDate(enquiry.updated_at)}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Created: </span>
                    {formatShortDate(enquiry.created_at)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardContent className="pt-6">
              <Tabs defaultValue="followups" className="w-full">
                <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <TabsList className="grid h-auto w-full grid-cols-2 p-1 sm:h-9 sm:w-fit sm:max-w-md">
                    <TabsTrigger value="followups" className="gap-1.5 px-3 py-2 sm:py-1">
                      <MessageSquare className="h-4 w-4 shrink-0" />
                      Follow-ups
                      <span className="text-muted-foreground">({followUps.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="quotations" className="gap-1.5 px-3 py-2 sm:py-1">
                      <FileText className="h-4 w-4 shrink-0" />
                      Quotations
                      <span className="text-muted-foreground">({quotations.length})</span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="followups" className="mt-4 space-y-4">
                  {leadIsTerminal ? (
                    <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                      This lead is submitted or closed — you cannot add or change
                      follow-ups here.
                    </p>
                  ) : null}
                  {canActOnFollowUpsAndQuotes ? (
                    <div className="flex justify-end">
                      <Button size="sm" onClick={openCreateFu}>
                        <Plus className="mr-1 h-4 w-4" />
                        Add follow-up
                      </Button>
                    </div>
                  ) : null}
                  <DataTable<FollowUp>
                    columns={followUpColumns}
                    data={followUps}
                    loading={fuLoading}
                    emptyMessage="No follow-ups yet"
                  />
                </TabsContent>

                <TabsContent value="quotations" className="mt-4 space-y-4">
                  {leadIsTerminal ? (
                    <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                      This lead is submitted or closed — you cannot add or change
                      quotations here.
                    </p>
                  ) : null}
                  {canActOnFollowUpsAndQuotes ? (
                    <div className="flex justify-end">
                      <Button size="sm" onClick={openCreateQuote}>
                        <Plus className="mr-1 h-4 w-4" />
                        Add quotation
                      </Button>
                    </div>
                  ) : null}
                  <DataTable<Quotation>
                    columns={quotationColumns}
                    data={quotations}
                    loading={qLoading}
                    emptyMessage="No quotations yet"
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}

      <Dialog
        open={fuOpen}
        onOpenChange={(open) => {
          setFuOpen(open);
          if (!open) setFuEditing(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {fuEditing ? "Edit follow-up" : "New follow-up"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="fu-date">Follow-up date *</Label>
              <Input
                id="fu-date"
                type="date"
                value={fuDate}
                onChange={(e) => setFuDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Mode</Label>
              <Select value={fuMode || "__"} onValueChange={(v) => setFuMode(v === "__" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__">—</SelectItem>
                  {FOLLOW_UP_MODE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Outcome</Label>
              <Select value={fuOutcome || "__"} onValueChange={(v) => setFuOutcome(v === "__" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Outcome" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__">—</SelectItem>
                  {FOLLOW_UP_OUTCOME_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fu-next">Next follow-up</Label>
              <Input
                id="fu-next"
                type="date"
                value={fuNext}
                onChange={(e) => setFuNext(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fu-remarks">Remarks</Label>
              <Textarea
                id="fu-remarks"
                value={fuRemarks}
                onChange={(e) => setFuRemarks(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFuOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => void submitFollowUp()}
              disabled={
                !fuDate ||
                creatingFu ||
                updatingFu ||
                !canActOnFollowUpsAndQuotes
              }
            >
              {creatingFu || updatingFu ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={qOpen} onOpenChange={setQOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New quotation</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="rounded-md border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              Quotation number is generated automatically. New records are always
              saved as a <strong className="font-medium text-foreground">draft</strong>
              . Send for approval from this page; a super administrator approves or
              rejects under <strong className="font-medium text-foreground">Pending quotations</strong>
              , then you can send to the client once approved—or delete here if rejected.
            </div>
            <div className="space-y-2">
              <Label htmlFor="q-amt">Amount (INR) *</Label>
              <Input
                id="q-amt"
                type="number"
                min={0}
                step="any"
                value={qAmount}
                onChange={(e) => setQAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="q-valid">Valid till</Label>
              <Input
                id="q-valid"
                type="date"
                value={qValidTill}
                onChange={(e) => setQValidTill(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="q-doc">Document URL</Label>
              <Input
                id="q-doc"
                value={qDocUrl}
                onChange={(e) => setQDocUrl(e.target.value)}
                placeholder="https://…"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="q-notes">Notes</Label>
              <Textarea
                id="q-notes"
                value={qNotes}
                onChange={(e) => setQNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => void submitQuote()}
              disabled={
                !qAmount.trim() ||
                creatingQ ||
                !canActOnFollowUpsAndQuotes
              }
            >
              {creatingQ ? "Saving…" : "Save draft"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <QuotationWorkflowDialog
        open={qtDialog != null}
        onOpenChange={(v) => {
          if (!v) setQtDialog(null);
        }}
        mode={
          qtDialog?.type === "view"
            ? { type: "view" }
            : qtDialog?.type === "workflow"
              ? { type: "workflow", step: qtDialog.step }
              : null
        }
        quotation={qtDialog?.q ?? null}
        enquiryName={enquiry?.name}
        enquiryCity={enquiry?.city}
        sendToClientContext={
          enquiry &&
          qtDialog?.type === "workflow" &&
          qtDialog.step === "send_to_client"
            ? {
                clientRepresentative: enquiry.client_representative ?? null,
                clientEmail: enquiry.client_email ?? null,
                clientPhone: enquiry.client_contact_number ?? null,
                senderName: user?.name ?? null,
                requested_audit_types: enquiry.requested_audit_types ?? null,
              }
            : undefined
        }
        onWorkflowConfirm={
          qtDialog?.type === "workflow"
            ? (remark) => {
                const d = qtDialog;
                if (d?.type !== "workflow") return;
                return executeQuotationWorkflow(d.step, d.q, remark);
              }
            : undefined
        }
        isSubmitting={quoteBusy}
      />

      <AlertDialog open={closeLeadOpen} onOpenChange={setCloseLeadOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close this lead?</AlertDialogTitle>
            <AlertDialogDescription>
              Pick an outcome. Follow-ups and quotations stay read-only after the
              lead is closed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel disabled={updatingLeadStatus}>
              Cancel
            </AlertDialogCancel>
            <Button
              type="button"
              variant="outline"
              disabled={updatingLeadStatus}
              onClick={() => void closeLeadAs("lost")}
            >
              Mark as lost
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={updatingLeadStatus}
              onClick={() => void closeLeadAs("dropped")}
            >
              Mark as dropped
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

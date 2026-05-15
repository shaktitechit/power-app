"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  Quotation,
  QuotationStatus,
  RequestedAuditType,
} from "@/store/slices/enquiryApiSlice";
import { quotationStatusLabel } from "@/lib/enquiryConstants";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  buildClientQuotationLetterText,
  buildQuotationMailtoHref,
  quotationWhatsappHref,
} from "@/lib/quotationLetter";
import { Mail } from "lucide-react";

export type QuotationWorkflowStep =
  | "send_for_approval"
  | "send_to_client"
  | "approve"
  | "reject"
  | "delete";

export interface QuotationDialogMode {
  type: "view";
}

export interface QuotationDialogWorkflowMode {
  type: "workflow";
  step: QuotationWorkflowStep;
}

export type QuotationDialogOpenMode =
  | QuotationDialogMode
  | QuotationDialogWorkflowMode;

/** Passed when `step === "send_to_client"` for letter + outbound links. */
export interface SendToClientLetterContext {
  clientRepresentative?: string | null;
  clientEmail?: string | null;
  clientPhone?: string | null;
  senderName?: string | null;
  requested_audit_types?: readonly RequestedAuditType[] | null;
}

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

const STEP_META: Record<
  QuotationWorkflowStep,
  {
    title: string;
    description: string;
    confirmLabel: string;
    requireRemark: boolean;
    destructive: boolean;
  }
> = {
  send_for_approval: {
    title: "Send quotation for approval?",
    description:
      "This submits the quotation to the pending-approval queue for a super admin to review.",
    confirmLabel: "Send for approval",
    requireRemark: false,
    destructive: false,
  },
  send_to_client: {
    title: "Send quotation to client",
    description:
      "Review the quotation letter below, share it by email or WhatsApp, then mark the quotation as sent.",
    confirmLabel: "Mark as sent to client",
    requireRemark: false,
    destructive: false,
  },
  approve: {
    title: "Approve this quotation?",
    description:
      "The creator will be able to send it to the client after approval.",
    confirmLabel: "Approve",
    requireRemark: false,
    destructive: false,
  },
  reject: {
    title: "Reject this quotation?",
    description:
      "The quotation will be marked as rejected and can be deleted from the enquiry.",
    confirmLabel: "Reject",
    requireRemark: true,
    destructive: true,
  },
  delete: {
    title: "Delete this quotation?",
    description:
      "This quotation will be removed from the enquiry. This action uses a soft-delete on the server.",
    confirmLabel: "Delete quotation",
    requireRemark: true,
    destructive: true,
  },
};

function formatInr(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatShortDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

export function targetStatusForStep(
  step: QuotationWorkflowStep,
): QuotationStatus | undefined {
  switch (step) {
    case "send_for_approval":
      return "pending_approval";
    case "send_to_client":
      return "sent";
    case "approve":
      return "approved";
    case "reject":
      return "rejected";
    default:
      return undefined;
  }
}

/** Details shown before confirming a workflow step or from “View”. */
export function QuotationDetailsPanel({
  quotation,
  enquiryName,
  enquiryCity,
}: {
  quotation: Quotation;
  enquiryName?: string;
  enquiryCity?: string;
}) {
  const lines = Array.isArray(quotation.line_items)
    ? quotation.line_items
    : [];

  const createdLabel = useMemo(() => {
    const c = quotation.created_by;
    if (typeof c === "object" && c != null)
      return c.name ?? c.email ?? "—";
    return "—";
  }, [quotation.created_by]);

  return (
    <div className="rounded-lg border bg-muted/30 p-4 text-sm">
      <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {(enquiryName || enquiryCity) && (
          <>
            <dt className="text-muted-foreground">Enquiry</dt>
            <dd className="font-medium">
              {[enquiryName, enquiryCity].filter(Boolean).join(", ") ||
                "—"}
            </dd>
          </>
        )}
        <dt className="text-muted-foreground">Quotation number</dt>
        <dd className="font-mono font-medium">
          {quotation.quotation_number ?? "—"}
        </dd>
        <dt className="text-muted-foreground">Amount</dt>
        <dd className="font-medium">{formatInr(Number(quotation.amount))}</dd>
        <dt className="text-muted-foreground">Status</dt>
        <dd>{quotationStatusLabel(quotation.status)}</dd>
        <dt className="text-muted-foreground">Valid till</dt>
        <dd>{formatShortDate(quotation.valid_till)}</dd>
        <dt className="text-muted-foreground">Created by</dt>
        <dd>{createdLabel}</dd>
        {quotation.document_url?.trim() ? (
          <>
            <dt className="text-muted-foreground">Document</dt>
            <dd className="min-w-0 break-all">
              <a
                href={quotation.document_url.trim()}
                target="_blank"
                rel="noreferrer noopener"
                className="text-primary underline underline-offset-4 hover:underline"
              >
                Open link
              </a>
            </dd>
          </>
        ) : null}
      </dl>

      <div className="mt-4">
        <p className="mb-2 text-muted-foreground text-xs uppercase tracking-wide">
          Line items
        </p>
        {lines.length === 0 ? (
          <p className="text-muted-foreground">No line items</p>
        ) : (
          <div className="overflow-x-auto rounded-md border bg-background">
            <table className="w-full min-w-[520px] text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-2 font-medium">Audit type</th>
                  <th className="p-2 font-medium">Description</th>
                  <th className="p-2 font-medium text-right">Price</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((row, idx) => (
                  <tr key={`${idx}-${row.audit_type ?? ""}`} className="border-b">
                    <td className="p-2 align-top">{row.audit_type ?? "—"}</td>
                    <td className="max-w-[220px] p-2 align-top break-words">
                      {row.description ?? "—"}
                    </td>
                    <td className="p-2 align-top text-right font-mono whitespace-nowrap">
                      {typeof row.price === "number"
                        ? formatInr(row.price)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(quotation.notes?.trim() ?? "").length > 0 ? (
        <div className="mt-4">
          <p className="mb-1 text-muted-foreground text-xs uppercase tracking-wide">
            Notes / history
          </p>
          <pre className="max-h-[120px] overflow-auto whitespace-pre-wrap rounded-md border bg-background p-2 text-xs">
            {quotation.notes!.trim()}
          </pre>
        </div>
      ) : null}
    </div>
  );
}

export function QuotationWorkflowDialog({
  open,
  onOpenChange,
  mode,
  quotation,
  enquiryName,
  enquiryCity,
  sendToClientContext,
  onWorkflowConfirm,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: QuotationDialogOpenMode | null;
  quotation: Quotation | null;
  enquiryName?: string;
  enquiryCity?: string;
  /** Required for `send_to_client` outbound links & salutation */
  sendToClientContext?: SendToClientLetterContext | null;
  onWorkflowConfirm?: (remark: string) => void | Promise<void>;
  isSubmitting?: boolean;
}) {
  const [remark, setRemark] = useState("");

  useEffect(() => {
    if (open) setRemark("");
  }, [open, quotation?._id, mode]);

  const wf =
    mode?.type === "workflow"
      ? STEP_META[mode.step]
      : null;

  const isSendToClient =
    mode?.type === "workflow" && mode.step === "send_to_client";

  const clientLetter = useMemo(() => {
    if (!isSendToClient || quotation == null) return null;
    return buildClientQuotationLetterText({
      enquiryName: enquiryName?.trim() || "Your client",
      enquiryCity: enquiryCity ?? undefined,
      clientRepresentative:
        sendToClientContext?.clientRepresentative ?? undefined,
      quotation,
      senderName: sendToClientContext?.senderName ?? undefined,
      requested_audit_types: sendToClientContext?.requested_audit_types ?? null,
    });
  }, [
    enquiryCity,
    enquiryName,
    isSendToClient,
    quotation,
    sendToClientContext?.clientRepresentative,
    sendToClientContext?.requested_audit_types,
    sendToClientContext?.senderName,
  ]);

  const mailHref = useMemo(() => {
    if (!isSendToClient || !clientLetter) return null;
    return buildQuotationMailtoHref(
      sendToClientContext?.clientEmail,
      clientLetter.subject,
      clientLetter.bodyPlain,
    );
  }, [
    clientLetter,
    isSendToClient,
    sendToClientContext?.clientEmail,
  ]);

  const whatsappHref = useMemo(() => {
    if (!isSendToClient || !clientLetter) return null;
    return quotationWhatsappHref(
      sendToClientContext?.clientPhone,
      clientLetter.bodyPlain,
    );
  }, [
    clientLetter,
    isSendToClient,
    sendToClientContext?.clientPhone,
  ]);

  const trimmed = remark.trim();
  const remarkOk = wf ? (!wf.requireRemark || trimmed.length > 0) : true;

  const title =
    mode?.type === "view"
      ? "Quotation details"
      : wf
        ? wf.title
        : "Quotation";

  const footerSubmitting = Boolean(isSubmitting);

  const handleConfirm = async () => {
    if (!wf || !onWorkflowConfirm || !remarkOk) return;
    await onWorkflowConfirm(remark.trim());
  };

  const canShow = quotation != null && mode != null;

  return (
    <Dialog open={open && canShow} onOpenChange={onOpenChange}>
      {quotation && mode ? (
        <DialogContent className="max-h-[92vh] max-w-xl gap-0 p-0 sm:max-w-3xl">
          <DialogHeader className="sr-only">
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="border-b px-6 py-4">
            <DialogTitle className="text-xl">{title}</DialogTitle>
            {mode.type === "workflow" && wf ? (
              <DialogDescription className="mt-2 text-sm">
                {wf.description}
              </DialogDescription>
            ) : (
              <DialogDescription className="sr-only">
                Summary of the quotation record.
              </DialogDescription>
            )}
          </div>

          <ScrollArea className="max-h-[min(60vh,calc(92vh-12rem))] px-6 py-4">
            {mode.type === "workflow" &&
            wf &&
            isSendToClient &&
            clientLetter ? (
              <div className="space-y-4">
                <div className="rounded-lg border bg-card px-6 py-6 shadow-inner sm:px-8">
                  <p className="text-center text-muted-foreground text-[10px] uppercase tracking-[0.2em]">
                    Quotation letter
                  </p>
                  <div className="mt-6 space-y-4 font-serif text-sm leading-relaxed text-foreground">
                    <p className="whitespace-pre-wrap border-b pb-4 text-muted-foreground text-xs not-italic sm:text-[13px]">
                      Subject: {clientLetter.subject}
                    </p>
                    <p className="whitespace-pre-wrap">{clientLetter.bodyPlain}</p>
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-muted-foreground text-xs uppercase tracking-wide">
                    Share with client
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {mailHref ? (
                      <Button variant="outline" size="sm" className="h-9" asChild>
                        <a href={mailHref}>
                          <Mail className="mr-1.5 h-4 w-4" />
                          Email
                        </a>
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9"
                        disabled
                        title="Add a client email on the enquiry record to enable."
                      >
                        <Mail className="mr-1.5 h-4 w-4" />
                        Email (no address)
                      </Button>
                    )}
                    {whatsappHref ? (
                      <Button variant="outline" size="sm" className="h-9 text-emerald-700 dark:text-emerald-400" asChild>
                        <a
                          href={whatsappHref}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <WhatsAppGlyph className="mr-1.5 h-4 w-4" />
                          WhatsApp
                        </a>
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9"
                        disabled
                        title="Add a mobile number on the enquiry record to enable."
                      >
                        <WhatsAppGlyph className="mr-1.5 h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                        WhatsApp (no mobile)
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <QuotationDetailsPanel
                  quotation={quotation}
                  enquiryName={enquiryName}
                  enquiryCity={enquiryCity}
                />
              </>
            )}
            {mode.type === "workflow" && wf ? (
              <div className="mt-4 space-y-2">
                <Label htmlFor="qt-workflow-remark">
                  Remark
                  {wf.requireRemark ? (
                    <span className="text-destructive"> *</span>
                  ) : (
                    <span className="text-muted-foreground"> (optional)</span>
                  )}
                </Label>
                <Textarea
                  id="qt-workflow-remark"
                  placeholder={
                    wf.requireRemark
                      ? "Explain why (required)."
                      : "Add context for the audit trail (optional)."
                  }
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  rows={3}
                  disabled={footerSubmitting}
                  className="resize-none"
                />
              </div>
            ) : null}
          </ScrollArea>

          <DialogFooter className="flex-col-reverse gap-2 border-t px-6 py-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={footerSubmitting}
            >
              {mode.type === "workflow" ? "Cancel" : "Close"}
            </Button>
            {mode.type === "workflow" && wf ? (
              <Button
                type="button"
                variant={wf.destructive ? "destructive" : "default"}
                onClick={() => void handleConfirm()}
                disabled={footerSubmitting || !remarkOk || !onWorkflowConfirm}
              >
                {wf.confirmLabel}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}

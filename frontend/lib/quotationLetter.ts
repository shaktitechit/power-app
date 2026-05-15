import type {
  Quotation,
  RequestedAuditType,
} from "@/store/slices/enquiryApiSlice";

function formatInr(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDisplayDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-IN");
}

/** Plain-text body suitable for mailto / WhatsApp. */
export function buildClientQuotationLetterText(opts: {
  enquiryName: string;
  enquiryCity?: string;
  clientRepresentative?: string;
  quotation: Quotation;
  senderName?: string;
  /** Used when quotation has no line items (shows scope from the enquiry). */
  requested_audit_types?: readonly RequestedAuditType[] | null;
}): { subject: string; bodyPlain: string } {
  const q = opts.quotation;
  const ref = q.quotation_number?.trim() || "—";
  const subject = `Quotation ${ref} — ${opts.enquiryName}`;

  const rep = opts.clientRepresentative?.trim();
  const greet = rep?.length ? `Dear ${rep},` : "Dear Sir / Madam,";

  const lines = Array.isArray(q.line_items) ? q.line_items : [];
  const requestedScopes = (opts.requested_audit_types ?? []).filter(
    (t) => String(t).trim().length > 0,
  ) as RequestedAuditType[];

  const lineBlock =
    lines.length > 0
      ? lines
          .map((item, idx) => {
            const parts = [
              `${idx + 1}.`,
              item.audit_type?.trim(),
              item.description?.trim(),
            ].filter(Boolean);
            const rhs =
              typeof item.price === "number"
                ? ` — ${formatInr(item.price)}`
                : "";
            return `${parts.join(" ")}${rhs}`;
          })
          .join("\n")
      : requestedScopes.length > 0
        ? `Requested audit types:\n${requestedScopes
            .map((t, idx) => `${idx + 1}. ${String(t).trim()}`)
            .join("\n")}`
        : "— (no line items or requested audit types on record)";

  const docNote = q.document_url?.trim()
    ? `\n\nQuotation document (link):\n${q.document_url.trim()}`
    : "";

  const cityLine = opts.enquiryCity?.trim()
    ? `Location: ${opts.enquiryCity.trim()}`
    : "";

  const bodyPlain = `${greet}

Please find below our quotation for audit services pertaining to your enquiry.

Quotation reference: ${ref}
Enquiry / client: ${opts.enquiryName}
${cityLine}

Services & estimates:
${lineBlock}

Total amount: ${formatInr(Number(q.amount))}
Quotation valid until: ${formatDisplayDate(q.valid_till)}
${docNote}

Should you require any clarification, kindly reply to this message or contact us.

Kind regards,
${opts.senderName?.trim() ? opts.senderName.trim() : "[Your team name]"}`;

  return { subject, bodyPlain };
}

export function buildQuotationMailtoHref(
  clientEmail: string | undefined | null,
  subject: string,
  bodyPlain: string,
): string | null {
  const e = clientEmail?.trim();
  if (!e) return null;
  return `mailto:${e}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyPlain)}`;
}

/** AssumesIndia (+91) when only 10 digits; returns wa.me URL or null */
export function quotationWhatsappHref(
  clientPhone: string | undefined | null,
  bodyPlain: string,
): string | null {
  const phone = clientPhone?.trim();
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  const wa = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${wa}?text=${encodeURIComponent(bodyPlain)}`;
}

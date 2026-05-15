import type {
  EnquiryStatus,
  QuotationStatus,
  RequestedAuditType,
} from "@/store/slices/enquiryApiSlice";

export const ENQUIRY_STATUS_OPTIONS: { value: EnquiryStatus; label: string }[] =
  [
    { value: "new", label: "New" },
    { value: "contacted", label: "Contacted" },
    { value: "in_discussion", label: "In discussion" },
    { value: "quoted", label: "Quoted" },
    { value: "negotiation", label: "Negotiation" },
    { value: "won", label: "Won" },
    { value: "lost", label: "Lost" },
    { value: "dropped", label: "Dropped" },
  ];

export const REQUESTED_AUDIT_TYPE_OPTIONS: {
  value: RequestedAuditType;
  label: string;
}[] = [
  { value: "Electrical Energy Audit", label: "Electrical Energy Audit" },
  { value: "Electrical Safety Audit", label: "Electrical Safety Audit" },
  { value: "Thermal Audit", label: "Thermal Audit" },
  {
    value: "Lightning Arrester Audit",
    label: "Lightning Arrester Audit",
  },
];

export function enquiryStatusLabel(status: string): string {
  return (
    ENQUIRY_STATUS_OPTIONS.find((o) => o.value === status)?.label ??
    status.replace(/_/g, " ")
  );
}

export const QUOTATION_STATUS_OPTIONS: {
  value: QuotationStatus;
  label: string;
}[] = [
  { value: "draft", label: "Draft" },
  { value: "pending_approval", label: "Pending approval" },
  { value: "sent", label: "Sent to client" },
  { value: "viewed", label: "Viewed" },
  { value: "revision_requested", label: "Revision requested" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "expired", label: "Expired" },
];

export function quotationStatusLabel(status: string): string {
  return (
    QUOTATION_STATUS_OPTIONS.find((o) => o.value === status)?.label ??
    status.replace(/_/g, " ")
  );
}

export const FOLLOW_UP_MODE_OPTIONS = [
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Meeting" },
  { value: "whatsapp", label: "WhatsApp" },
] as const;

export const FOLLOW_UP_OUTCOME_OPTIONS = [
  { value: "no_response", label: "No response" },
  { value: "interested", label: "Interested" },
  { value: "not_interested", label: "Not interested" },
  { value: "callback_later", label: "Callback later" },
  { value: "meeting_scheduled", label: "Meeting scheduled" },
] as const;

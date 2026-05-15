"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAssignableUsersQuery } from "@/store/slices/userApiSlice";
import {
  useGetEnquiryByIdQuery,
  useUpdateEnquiryMutation,
  type EnquiryStatus,
  type RequestedAuditType,
} from "@/store/slices/enquiryApiSlice";
import { toastHandler } from "@/lib/toast";
import { toast } from "sonner";
import {
  ENQUIRY_STATUS_OPTIONS,
  REQUESTED_AUDIT_TYPE_OPTIONS,
} from "@/lib/enquiryConstants";

interface EditEnquiryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  enquiryId: string | null;
}

const UNASSIGNED = "__none__";

export function EditEnquiryForm({
  open,
  onOpenChange,
  onComplete,
  enquiryId,
}: EditEnquiryFormProps) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [clientRepresentative, setClientRepresentative] = useState("");
  const [clientContactNumber, setClientContactNumber] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [assignedTo, setAssignedTo] = useState<string>(UNASSIGNED);
  const [enquiryStatus, setEnquiryStatus] = useState<EnquiryStatus>("new");
  const [source, setSource] = useState("");
  const [expectedValue, setExpectedValue] = useState("");
  const [notes, setNotes] = useState("");
  const [nextFollowupDate, setNextFollowupDate] = useState("");
  const [auditTypes, setAuditTypes] = useState<Set<RequestedAuditType>>(
    new Set(),
  );
  const [isConverted, setIsConverted] = useState(false);
  const [convertedFacilityId, setConvertedFacilityId] = useState("");

  const { data: assignableRes } = useAssignableUsersQuery(undefined, {
    skip: !open,
  });
  const assignableUsers = assignableRes?.data ?? [];

  const {
    data: enquiryRes,
    isLoading: enquiryLoading,
    isFetching,
    isError,
  } = useGetEnquiryByIdQuery(enquiryId ?? "", {
    skip: !open || !enquiryId,
  });

  const [updateEnquiry, { isLoading: saving }] = useUpdateEnquiryMutation();

  const enquiry = enquiryRes?.data;

  useEffect(() => {
    if (!enquiry || !open) return;

    setName(enquiry.name ?? "");
    setCity(enquiry.city ?? "");
    setAddress(enquiry.address ?? "");
    setClientRepresentative(enquiry.client_representative ?? "");
    setClientContactNumber(enquiry.client_contact_number ?? "");
    setClientEmail(enquiry.client_email ?? "");

    const aid =
      enquiry.assigned_to &&
      typeof enquiry.assigned_to === "object" &&
      enquiry.assigned_to !== null
        ? enquiry.assigned_to._id ?? ""
        : (enquiry.assigned_to as string) ?? "";
    setAssignedTo(aid ? String(aid) : UNASSIGNED);

    setEnquiryStatus(enquiry.enquiry_status ?? "new");
    setSource(enquiry.source ?? "");
    setExpectedValue(
      enquiry.expected_value != null ? String(enquiry.expected_value) : "",
    );
    setNotes(enquiry.notes ?? "");

    const nfd = enquiry.next_followup_date;
    if (nfd) {
      const d = new Date(nfd);
      if (!Number.isNaN(d.getTime())) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        setNextFollowupDate(`${y}-${m}-${day}`);
      } else setNextFollowupDate("");
    } else setNextFollowupDate("");

    setAuditTypes(new Set(enquiry.requested_audit_types ?? []));

    setIsConverted(Boolean(enquiry.is_converted_to_facility));
    const cf =
      enquiry.converted_facility_id &&
      typeof enquiry.converted_facility_id === "object"
        ? enquiry.converted_facility_id._id
        : enquiry.converted_facility_id;
    setConvertedFacilityId(cf ? String(cf) : "");
  }, [enquiry, open]);

  const toggleAuditType = (t: RequestedAuditType) => {
    setAuditTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  };

  const submitDisabled = useMemo(() => {
    return (
      !name.trim() ||
      !city.trim() ||
      saving ||
      enquiryLoading ||
      !enquiryId ||
      !enquiry ||
      isError
    );
  }, [name, city, saving, enquiryLoading, enquiryId, enquiry, isError]);

  const handleClose = (next: boolean) => {
    if (!next) {
      /* reset handled when reopen loads enquiry */
    }
    onOpenChange(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enquiryId || submitDisabled) return;

    const evRaw =
      expectedValue.trim() === ""
        ? undefined
        : Number(expectedValue.trim());
    if (evRaw !== undefined && Number.isNaN(evRaw)) {
      toast.error("Expected value must be a valid number.");
      return;
    }

    const payload = {
      id: enquiryId,
      name: name.trim(),
      city: city.trim(),
      address: address.trim() || undefined,
      client_representative: clientRepresentative.trim() || undefined,
      client_contact_number: clientContactNumber.trim() || undefined,
      client_email: clientEmail.trim() || undefined,
      assigned_to:
        assignedTo === UNASSIGNED ? null : assignedTo || undefined,
      enquiry_status: enquiryStatus,
      source: source.trim() || undefined,
      expected_value: evRaw ?? null,
      requested_audit_types: Array.from(auditTypes),
      notes: notes.trim() || undefined,
      next_followup_date: nextFollowupDate.trim()
        ? nextFollowupDate.trim()
        : null,
      is_converted_to_facility: isConverted,
      converted_facility_id: isConverted
        ? convertedFacilityId.trim() === ""
          ? null
          : convertedFacilityId.trim()
        : null,
    };

    try {
      await toastHandler({
        action: async () => {
          await updateEnquiry(payload).unwrap();
        },
        loading: "Saving enquiry…",
        success: "Enquiry updated.",
      });
      onOpenChange(false);
      onComplete();
    } catch {
      /* toast shown */
    }
  };

  const loadingDialog = open && enquiryId && (enquiryLoading || isFetching) && !enquiry && !isError;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit enquiry</DialogTitle>
        </DialogHeader>

        {loadingDialog ? (
          <p className="text-sm text-muted-foreground">Loading enquiry…</p>
        ) : open && enquiryId && isError ? (
          <p className="text-sm text-destructive">
            Could not load this enquiry. You may not have access or it no longer
            exists.
          </p>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="eenq-name">Name / organisation *</Label>
                <Input
                  id="eenq-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eenq-city">City *</Label>
                <Input
                  id="eenq-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eenq-status">Pipeline status</Label>
                <Select
                  value={enquiryStatus}
                  onValueChange={(v) => setEnquiryStatus(v as EnquiryStatus)}
                >
                  <SelectTrigger id="eenq-status">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {ENQUIRY_STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="eenq-address">Address</Label>
              <Input
                id="eenq-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="eenq-cr">Client representative</Label>
                <Input
                  id="eenq-cr"
                  value={clientRepresentative}
                  onChange={(e) => setClientRepresentative(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eenq-phone">Contact number</Label>
                <Input
                  id="eenq-phone"
                  value={clientContactNumber}
                  onChange={(e) => setClientContactNumber(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="eenq-email">Client email</Label>
              <Input
                id="eenq-email"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Assigned to</Label>
                <Select value={assignedTo} onValueChange={setAssignedTo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                    {assignableUsers.map((u) => (
                      <SelectItem key={u._id} value={u._id}>
                        {u.name}
                        {u.email ? ` (${u.email})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="eenq-source">Source</Label>
                <Input
                  id="eenq-source"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="eenq-ev">Expected value</Label>
                <Input
                  id="eenq-ev"
                  type="number"
                  min={0}
                  step="any"
                  value={expectedValue}
                  onChange={(e) => setExpectedValue(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eenq-nfd">Next follow-up</Label>
                <Input
                  id="eenq-nfd"
                  type="date"
                  value={nextFollowupDate}
                  onChange={(e) => setNextFollowupDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Requested audit types</Label>
              <div className="flex flex-wrap gap-2">
                {REQUESTED_AUDIT_TYPE_OPTIONS.map((o) => (
                  <label
                    key={o.value}
                    className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-2 py-1.5 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={auditTypes.has(o.value)}
                      onChange={() => toggleAuditType(o.value)}
                      className="rounded border-input"
                    />
                    <span>{o.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-border p-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={isConverted}
                  onChange={(e) => setIsConverted(e.target.checked)}
                  className="rounded border-input"
                />
                Converted to facility
              </label>
              {isConverted ? (
                <div className="space-y-2">
                  <Label htmlFor="eenq-fac">Facility ID</Label>
                  <Input
                    id="eenq-fac"
                    value={convertedFacilityId}
                    onChange={(e) => setConvertedFacilityId(e.target.value)}
                    placeholder="Mongo ObjectId of facility"
                  />
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="eenq-notes">Notes</Label>
              <Textarea
                id="eenq-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitDisabled}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

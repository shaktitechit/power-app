"use client";

import { useMemo, useState } from "react";
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
import { useCreateEnquiryMutation } from "@/store/slices/enquiryApiSlice";
import { toastHandler } from "@/lib/toast";
import { toast } from "sonner";
import {
  ENQUIRY_STATUS_OPTIONS,
  REQUESTED_AUDIT_TYPE_OPTIONS,
} from "@/lib/enquiryConstants";
import type {
  EnquiryStatus,
  RequestedAuditType,
} from "@/store/slices/enquiryApiSlice";

interface CreateEnquiryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

const UNASSIGNED = "__none__";

export function CreateEnquiryForm({
  open,
  onOpenChange,
  onComplete,
}: CreateEnquiryFormProps) {
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

  const { data: assignableRes } = useAssignableUsersQuery(undefined, {
    skip: !open,
  });
  const assignableUsers = assignableRes?.data ?? [];

  const [createEnquiry, { isLoading }] = useCreateEnquiryMutation();

  const toggleAuditType = (t: RequestedAuditType) => {
    setAuditTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  };

  const reset = () => {
    setName("");
    setCity("");
    setAddress("");
    setClientRepresentative("");
    setClientContactNumber("");
    setClientEmail("");
    setAssignedTo(UNASSIGNED);
    setEnquiryStatus("new");
    setSource("");
    setExpectedValue("");
    setNotes("");
    setNextFollowupDate("");
    setAuditTypes(new Set());
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const submitDisabled = useMemo(() => {
    return !name.trim() || !city.trim() || isLoading;
  }, [name, city, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitDisabled) return;

    const evRaw =
      expectedValue.trim() === ""
        ? undefined
        : Number(expectedValue.trim());
    if (evRaw !== undefined && Number.isNaN(evRaw)) {
      toast.error("Expected value must be a valid number.");
      return;
    }

    const payload = {
      name: name.trim(),
      city: city.trim(),
      address: address.trim() || undefined,
      client_representative: clientRepresentative.trim() || undefined,
      client_contact_number: clientContactNumber.trim() || undefined,
      client_email: clientEmail.trim() || undefined,
      assigned_to:
        assignedTo === UNASSIGNED ? undefined : assignedTo || undefined,
      enquiry_status: enquiryStatus,
      source: source.trim() || undefined,
      expected_value: evRaw,
      requested_audit_types:
        auditTypes.size > 0 ? Array.from(auditTypes) : undefined,
      notes: notes.trim() || undefined,
      next_followup_date: nextFollowupDate.trim()
        ? nextFollowupDate.trim()
        : undefined,
    };

    try {
      await toastHandler({
        action: async () => {
          await createEnquiry(payload).unwrap();
        },
        loading: "Creating enquiry…",
        success: `"${payload.name}" has been added.`,
      });
      reset();
      onOpenChange(false);
      onComplete();
    } catch {
      /* toast shown */
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create enquiry</DialogTitle>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="enq-name">Name / organisation *</Label>
              <Input
                id="enq-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Client or site name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="enq-city">City *</Label>
              <Input
                id="enq-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="enq-status">Pipeline status</Label>
              <Select
                value={enquiryStatus}
                onValueChange={(v) => setEnquiryStatus(v as EnquiryStatus)}
              >
                <SelectTrigger id="enq-status">
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
            <Label htmlFor="enq-address">Address</Label>
            <Input
              id="enq-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="enq-cr">Client representative</Label>
              <Input
                id="enq-cr"
                value={clientRepresentative}
                onChange={(e) => setClientRepresentative(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="enq-phone">Contact number</Label>
              <Input
                id="enq-phone"
                value={clientContactNumber}
                onChange={(e) => setClientContactNumber(e.target.value)}
                placeholder="10-digit mobile"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="enq-email">Client email</Label>
            <Input
              id="enq-email"
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
              <Label htmlFor="enq-source">Source</Label>
              <Input
                id="enq-source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="Referral, web, etc."
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="enq-ev">Expected value</Label>
              <Input
                id="enq-ev"
                type="number"
                min={0}
                step="any"
                value={expectedValue}
                onChange={(e) => setExpectedValue(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="enq-nfd">Next follow-up</Label>
              <Input
                id="enq-nfd"
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

          <div className="space-y-2">
            <Label htmlFor="enq-notes">Notes</Label>
            <Textarea
              id="enq-notes"
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
              {isLoading ? "Saving..." : "Create enquiry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

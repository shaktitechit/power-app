"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  Check,
  FileText,
  Image as ImageIcon,
  Upload,
  X,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useAuditorsQuery } from "@/store/slices/userApiSlice";
import { useCreateFacilityMutation } from "@/store/slices/facilityApiSlice";
import { toastHandler } from "@/lib/toast";

interface CreateFacilityFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

type FacilityDocument = {
  file: File;
  preview?: string;
  fileType: "image" | "pdf";
};

type Auditor = {
  _id: string;
  name: string;
  email: string;
};

const facilityTypes = [
  "hospital",
  "hotel",
  "factory",
  "office",
  "mall",
  "other",
] as const;

const facilityStatuses = ["active", "inactive"] as const;

function AuditorMultiSelect({
  auditors,
  selectedIds,
  onChange,
  disabled = false,
}: {
  auditors: Auditor[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleAuditor = (auditorId: string) => {
    if (disabled) return;

    const exists = selectedIds.includes(auditorId);

    if (exists) {
      onChange(selectedIds.filter((id) => id !== auditorId));
    } else {
      onChange([...selectedIds, auditorId]);
    }
  };

  const selectedAuditors = auditors.filter((auditor) =>
    selectedIds.includes(auditor._id),
  );

  return (
    <div className="space-y-2">
      <Label>Assign Team</Label>

      <div className="relative" ref={containerRef}>
        <button
          type="button"
          onClick={() => !disabled && setOpen((prev) => !prev)}
          disabled={disabled}
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="truncate text-left">
            {selectedAuditors.length > 0
              ? `${selectedAuditors.length} auditor${
                  selectedAuditors.length > 1 ? "s" : ""
                } selected`
              : "Select auditors"}
          </span>
          <ChevronDown className="h-4 w-4 opacity-60" />
        </button>

        {open && !disabled && (
          <div className="absolute z-50 mt-2 max-h-72 w-full overflow-hidden rounded-md border bg-popover shadow-md">
            <div className="max-h-72 overflow-y-auto p-1">
              {auditors.length > 0 ? (
                auditors.map((auditor) => {
                  const checked = selectedIds.includes(auditor._id);

                  return (
                    <button
                      key={auditor._id}
                      type="button"
                      onClick={() => toggleAuditor(auditor._id)}
                      className="flex w-full items-start justify-between rounded-sm px-3 py-2 text-left hover:bg-accent"
                    >
                      <div className="min-w-0 pr-3">
                        <p className="truncate text-sm font-medium">
                          {auditor.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {auditor.email}
                        </p>
                      </div>

                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded border">
                        {checked && <Check className="h-3.5 w-3.5" />}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No auditors found
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedAuditors.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {selectedAuditors.map((auditor) => (
            <div
              key={auditor._id}
              className="inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-xs"
            >
              <span>{auditor.name}</span>
              <button
                type="button"
                onClick={() => toggleAuditor(auditor._id)}
                className="font-semibold text-muted-foreground hover:text-foreground"
                disabled={disabled}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CreateFacilityForm({
  open,
  onOpenChange,
  onComplete,
}: CreateFacilityFormProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { data, isLoading: auditorsLoading } = useAuditorsQuery();
  const [createFacility, { isLoading: creatingFacility }] =
    useCreateFacilityMutation();

  const auditors: Auditor[] = data?.data || [];

  const [formData, setFormData] = useState({
    name: "",
    city: "",
    address: "",
    client_representative: "",
    client_contact_number: "",
    client_email: "",
    facility_type: "other",
    status: "active",
    auditor_ids: [] as string[],
    closure_date: "",
  });

  const [documents, setDocuments] = useState<FacilityDocument[]>([]);
  const [submitError, setSubmitError] = useState("");

  const updateField = (
    field: keyof typeof formData,
    value: string | string[],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    documents.forEach((doc) => {
      if (doc.preview) URL.revokeObjectURL(doc.preview);
    });

    setFormData({
      name: "",
      city: "",
      address: "",
      client_representative: "",
      client_contact_number: "",
      client_email: "",
      facility_type: "other",
      status: "active",
      auditor_ids: [],
      closure_date: "",
    });

    setDocuments([]);
    setSubmitError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const validFiles: FacilityDocument[] = files
      .map((file) => {
        const isPdf =
          file.type === "application/pdf" ||
          file.name.toLowerCase().endsWith(".pdf");
        const isImage = file.type.startsWith("image/");

        if (!isPdf && !isImage) return null;

        return {
          file,
          fileType: isPdf ? "pdf" : "image",
          preview: isPdf ? undefined : URL.createObjectURL(file),
        };
      })
      .filter(Boolean) as FacilityDocument[];

    setDocuments((prev) => [...prev, ...validFiles]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeDocument = (index: number) => {
    setDocuments((prev) => {
      const doc = prev[index];
      if (doc?.preview) {
        URL.revokeObjectURL(doc.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const isFormValid = useMemo(() => {
    return formData.name.trim().length > 0 && formData.city.trim().length > 0;
  }, [formData.name, formData.city]);

  const handleSubmit = async () => {
    setSubmitError("");

    if (!isFormValid) {
      setSubmitError("Facility name and city are required.");
      return;
    }

    await toastHandler({
      action: () =>
        createFacility({
          name: formData.name.trim(),
          city: formData.city.trim(),
          address: formData.address.trim() || undefined,
          client_representative:
            formData.client_representative.trim() || undefined,
          client_contact_number:
            formData.client_contact_number.trim() || undefined,
          client_email: formData.client_email.trim() || undefined,
          facility_type: formData.facility_type as
            | "hospital"
            | "hotel"
            | "factory"
            | "office"
            | "mall"
            | "other",
          status: formData.status as "active" | "inactive",
          auditor_ids: formData.auditor_ids,
          closure_date: formData.closure_date || undefined,
          documents: documents.map((doc) => doc.file),
        }).unwrap(),

      loading: "Creating facility...",
      success: "Facility created successfully",
    });

    onComplete();
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) resetForm();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Create New Facility</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">
                Facility Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Enter facility name"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                disabled={creatingFacility}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">
                City <span className="text-destructive">*</span>
              </Label>
              <Input
                id="city"
                placeholder="Enter city"
                value={formData.city}
                onChange={(e) => updateField("city", e.target.value)}
                disabled={creatingFacility}
              />
            </div>

            <div className="space-y-2">
              <Label>Facility Type</Label>
              <Select
                value={formData.facility_type}
                onValueChange={(value) => updateField("facility_type", value)}
                disabled={creatingFacility}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select facility type" />
                </SelectTrigger>
                <SelectContent>
                  {facilityTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      <span className="capitalize">{type}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => updateField("status", value)}
                disabled={creatingFacility}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {facilityStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      <span className="capitalize">{status}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Planned Closure Date</Label>
              <Input
                type="date"
                value={formData.closure_date}
                onChange={(e) => updateField("closure_date", e.target.value)}
                disabled={creatingFacility}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              {auditorsLoading ? (
                <div className="text-sm text-muted-foreground">
                  Loading auditors...
                </div>
              ) : (
                <AuditorMultiSelect
                  auditors={auditors}
                  selectedIds={formData.auditor_ids}
                  onChange={(ids) => updateField("auditor_ids", ids)}
                  disabled={creatingFacility}
                />
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="Enter full address"
                value={formData.address}
                onChange={(e) => updateField("address", e.target.value)}
                disabled={creatingFacility}
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium">Client Information</h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="client_representative">
                  Client Representative
                </Label>
                <Input
                  id="client_representative"
                  placeholder="Enter representative name"
                  value={formData.client_representative}
                  onChange={(e) =>
                    updateField("client_representative", e.target.value)
                  }
                  disabled={creatingFacility}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_contact_number">Contact Number</Label>
                <Input
                  id="client_contact_number"
                  type="tel"
                  placeholder="Enter contact number"
                  value={formData.client_contact_number}
                  onChange={(e) =>
                    updateField("client_contact_number", e.target.value)
                  }
                  disabled={creatingFacility}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="client_email">Client Email</Label>
                <Input
                  id="client_email"
                  type="email"
                  placeholder="Enter email"
                  value={formData.client_email}
                  onChange={(e) => updateField("client_email", e.target.value)}
                  disabled={creatingFacility}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="documents">Documents</Label>

              <div className="rounded-xl border border-dashed p-4">
                <label
                  htmlFor="documents"
                  className="flex cursor-pointer flex-col items-center justify-center gap-2 text-center"
                >
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    Upload multiple images and PDFs
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Supported: JPG, PNG, JPEG, WEBP, PDF
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Example: Site Photos, Facility Front View, etc.
                  </span>
                </label>

                <input
                  ref={fileInputRef}
                  id="documents"
                  type="file"
                  multiple
                  accept="image/*,.pdf,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={creatingFacility}
                />
              </div>
            </div>

            {documents.length > 0 && (
              <div className="space-y-2">
                {documents.map((doc, index) => (
                  <div
                    key={`${doc.file.name}-${index}`}
                    className="flex items-center justify-between gap-3 rounded-lg border p-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {doc.fileType === "pdf" ? (
                        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {doc.file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {doc.fileType.toUpperCase()}
                        </p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDocument(index)}
                      disabled={creatingFacility}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {submitError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {submitError}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={creatingFacility}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!isFormValid || creatingFacility}
          >
            {creatingFacility ? "Creating..." : "Create Facility"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

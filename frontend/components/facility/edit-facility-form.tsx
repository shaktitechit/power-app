"use client";

import { canViewDocuments, type UserPermission } from "@/lib/authRoles";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  Check,
  FileText,
  Image as ImageIcon,
  Upload,
  X,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { useAssignableUsersQuery } from "@/store/slices/userApiSlice";
import {
  useGetFacilityByIdQuery,
  useUpdateFacilityMutation,
} from "@/store/slices/facilityApiSlice";
import { toastHandler } from "@/lib/toast";
import { useAppSelector } from "@/store/hooks";
import { AUDIT_TYPE_OPTIONS } from "@/lib/facilityConstants";

interface EditFacilityFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  facilityId: string | null;
}

type NewFacilityDocument = {
  file: File;
  preview?: string;
  fileType: "image" | "pdf";
};

type ExistingFacilityDocument = {
  _id?: string;
  fileUrl: string;
  fileType: "image" | "pdf";
  fileName?: string;
};

type AssignableUser = {
  _id: string;
  name: string;
  email: string;
  role?: string;
};

type ClientRepresentative = {
  name: string;
  contact_number: string;
  email: string;
};

const facilityStatuses = ["active", "inactive"] as const;

function TeamMemberMultiSelect({
  users,
  selectedIds,
  onChange,
  disabled = false,
}: {
  users: AssignableUser[];
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

  const toggleMember = (userId: string) => {
    if (disabled) return;

    const exists = selectedIds.includes(userId);

    if (exists) {
      onChange(selectedIds.filter((id) => id !== userId));
    } else {
      onChange([...selectedIds, userId]);
    }
  };

  const selectedUsers = users.filter((user) =>
    selectedIds.includes(user._id),
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
            {selectedUsers.length > 0
              ? `${selectedUsers.length} member${
                  selectedUsers.length > 1 ? "s" : ""
                } selected`
              : "Select team members"}
          </span>
          <ChevronDown className="h-4 w-4 opacity-60" />
        </button>

        {open && !disabled && (
          <div className="absolute z-50 mt-2 max-h-72 w-full overflow-hidden rounded-md border bg-popover shadow-md">
            <div className="max-h-72 overflow-y-auto p-1">
              {users.length > 0 ? (
                users.map((user) => {
                  const checked = selectedIds.includes(user._id);

                  return (
                    <button
                      key={user._id}
                      type="button"
                      onClick={() => toggleMember(user._id)}
                      className="flex w-full items-start justify-between rounded-sm px-3 py-2 text-left hover:bg-accent"
                    >
                      <div className="min-w-0 pr-3">
                        <p className="truncate text-sm font-medium">
                          {user.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {user.email}
                          {user.role ? ` • ${user.role.replace("_", " ")}` : ""}
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
                  No team members found
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {selectedUsers.map((user) => (
            <div
              key={user._id}
              className="inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-xs"
            >
              <span>{user.name}</span>
              <button
                type="button"
                onClick={() => toggleMember(user._id)}
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

export function EditFacilityForm({
  open,
  onOpenChange,
  onComplete,
  facilityId,
}: EditFacilityFormProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const user = useAppSelector((state) => state.auth.user);
  const canViewDocumentsFlag = canViewDocuments(
    user?.role,
    (user?.permissions as UserPermission[]) || [],
  );

  const { data: auditorsResponse, isLoading: auditorsLoading } =
    useAssignableUsersQuery();

  const {
    data: facilityResponse,
    isLoading: facilityLoading,
    isFetching: facilityFetching,
  } = useGetFacilityByIdQuery(facilityId as string, {
    skip: !facilityId || !open,
  });

  const [updateFacility, { isLoading: updatingFacility }] =
    useUpdateFacilityMutation();

  const users: AssignableUser[] = auditorsResponse?.data || [];
  const assignableUsers = users.filter(
    (user) => user.role !== "super_admin" && user.role !== "admin",
  );
  const facility = facilityResponse?.data?.facility;
  const assignedAuditors = facilityResponse?.data?.assignedAuditors || [];

  const [formData, setFormData] = useState({
    name: "",
    city: "",
    address: "",
    start_date: "",
    client_representatives: [
      { name: "", contact_number: "", email: "" },
    ] as ClientRepresentative[],
    facility_type: "",
    audit_type: AUDIT_TYPE_OPTIONS[0],
    status: "active",
    closure_date: "",
    auditor_ids: [] as string[],
  });

  const [existingDocuments, setExistingDocuments] = useState<
    ExistingFacilityDocument[]
  >([]);
  const [newDocuments, setNewDocuments] = useState<NewFacilityDocument[]>([]);
  const [removedExistingDocuments, setRemovedExistingDocuments] = useState<
    string[]
  >([]);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!facility || !open) return;

    setFormData({
      name: facility.name || "",
      city: facility.city || "",
      address: facility.address || "",
      start_date: facility.start_date
        ? new Date(facility.start_date).toISOString().split("T")[0]
        : "",
      client_representatives:
        facility.client_representatives &&
        facility.client_representatives.length > 0
          ? facility.client_representatives.map((rep: any) => ({
              name: rep?.name || "",
              contact_number: rep?.contact_number || "",
              email: rep?.email || "",
            }))
          : [
              {
                name: facility.client_representative || "",
                contact_number: facility.client_contact_number || "",
                email: facility.client_email || "",
              },
            ],
      facility_type: facility.facility_type ?? "",
      audit_type: AUDIT_TYPE_OPTIONS.some((x) => x === facility.audit_type)
        ? (facility.audit_type as (typeof AUDIT_TYPE_OPTIONS)[number])
        : AUDIT_TYPE_OPTIONS[0],
      status: facility.status || "active",
      closure_date: facility.closure_date
        ? new Date(facility.closure_date).toISOString().split("T")[0]
        : "",
      auditor_ids: assignedAuditors
        .map((auditor: any) => auditor.user_id?._id)
        .filter(Boolean),
    });

    setExistingDocuments(facility.documents || []);
    setNewDocuments([]);
    setRemovedExistingDocuments([]);
    setSubmitError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [facility, assignedAuditors, open]);

  useEffect(() => {
    return () => {
      newDocuments.forEach((doc) => {
        if (doc.preview) URL.revokeObjectURL(doc.preview);
      });
    };
  }, [newDocuments]);

  const updateField = (
    field: keyof typeof formData,
    value: string | string[],
  ) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      if (field === "status" && value === "active") {
        updated.closure_date = "";
      }

      return updated;
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const uploadedDocs: NewFacilityDocument[] = files
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
      .filter(Boolean) as NewFacilityDocument[];

    setNewDocuments((prev) => [...prev, ...uploadedDocs]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeExistingDocument = (index: number) => {
    setExistingDocuments((prev) => {
      const doc = prev[index];

      if (doc?._id) {
        setRemovedExistingDocuments((ids) => [...ids, doc._id as string]);
      }

      return prev.filter((_, i) => i !== index);
    });
  };

  const removeNewDocument = (index: number) => {
    setNewDocuments((prev) => {
      const doc = prev[index];
      if (doc?.preview) URL.revokeObjectURL(doc.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const resetLocalState = () => {
    newDocuments.forEach((doc) => {
      if (doc.preview) URL.revokeObjectURL(doc.preview);
    });

    setNewDocuments([]);
    setRemovedExistingDocuments([]);
    setSubmitError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    resetLocalState();
    onOpenChange(false);
  };

  const isFormValid = useMemo(() => {
    return formData.name.trim().length > 0 && formData.city.trim().length > 0;
  }, [formData.name, formData.city]);

  const handleSubmit = async () => {
    if (!facilityId) return;

    setSubmitError("");

    if (!isFormValid) {
      setSubmitError("Facility name and city are required.");
      return;
    }

    const sanitizedReps = formData.client_representatives
      .map((rep) => ({
        name: rep.name.trim(),
        contact_number: rep.contact_number.trim(),
        email: rep.email.trim(),
      }))
      .filter((rep) => rep.name || rep.contact_number || rep.email);
    const primaryRep = sanitizedReps[0];

    await toastHandler({
      action: () =>
        updateFacility({
          id: facilityId,
          name: formData.name.trim(),
          city: formData.city.trim(),
          address: formData.address.trim() || undefined,
          start_date: formData.start_date || undefined,
          client_representatives: sanitizedReps,
          // Backward compatible payload (existing backend consumers may still use old fields)
          client_representative: primaryRep?.name || undefined,
          client_contact_number: primaryRep?.contact_number || undefined,
          client_email: primaryRep?.email || undefined,
          facility_type: formData.facility_type.trim(),
          audit_type: formData.audit_type,
          status: formData.status as "active" | "inactive",
          closure_date:
            formData.status === "inactive"
              ? formData.closure_date || undefined
              : undefined,
          auditor_ids: formData.auditor_ids,
          documents: newDocuments.map((doc) => doc.file),
          removed_document_ids: removedExistingDocuments,
        }).unwrap(),

      loading: "Updating facility...",
      success: "Facility updated successfully",
    });

    onComplete();
    handleClose();
  };
  const isBusy = updatingFacility || facilityLoading || facilityFetching;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          handleClose();
          return;
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Edit Facility</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {facilityLoading || facilityFetching ? (
            <div className="rounded-md border px-4 py-3 text-sm text-muted-foreground">
              Loading facility data...
            </div>
          ) : null}

          {!facilityLoading && !facilityFetching && facilityId && !facility ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Facility data not found.
            </div>
          ) : null}

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
                disabled={isBusy}
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
                disabled={isBusy}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="facility_type">Facility Type</Label>
              <Input
                id="facility_type"
                placeholder="e.g. hospital, factory, data center"
                value={formData.facility_type}
                onChange={(e) => updateField("facility_type", e.target.value)}
                disabled={isBusy}
              />
            </div>

            <div className="space-y-2">
              <Label>Audit Type</Label>
              <Select
                value={formData.audit_type}
                onValueChange={(value) => updateField("audit_type", value)}
                disabled={isBusy}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select audit type" />
                </SelectTrigger>
                <SelectContent>
                  {AUDIT_TYPE_OPTIONS.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
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
                disabled={isBusy}
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
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => updateField("start_date", e.target.value)}
                disabled={isBusy}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="closure_date">Planned Closure Date</Label>
              <Input
                id="closure_date"
                type="date"
                value={formData.closure_date}
                onChange={(e) => updateField("closure_date", e.target.value)}
                disabled={isBusy}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              {auditorsLoading ? (
                <div className="text-sm text-muted-foreground">
                  Loading team members...
                </div>
              ) : (
                <TeamMemberMultiSelect
                  users={assignableUsers}
                  selectedIds={formData.auditor_ids}
                  onChange={(ids) => updateField("auditor_ids", ids)}
                  disabled={isBusy}
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
                disabled={isBusy}
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium">Client Information</h3>
            <div className="space-y-4">
              {formData.client_representatives.map((rep, index) => (
                <div
                  key={`client-rep-${index}`}
                  className="rounded-lg border border-border p-3"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-medium">
                      Representative {index + 1}
                    </p>
                    {formData.client_representatives.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            client_representatives:
                              prev.client_representatives.filter(
                                (_, i) => i !== index,
                              ),
                          }))
                        }
                        disabled={isBusy}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        placeholder="Enter representative name"
                        value={rep.name}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            client_representatives:
                              prev.client_representatives.map((r, i) =>
                                i === index ? { ...r, name: e.target.value } : r,
                              ),
                          }))
                        }
                        disabled={isBusy}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Contact Number</Label>
                      <Input
                        type="tel"
                        placeholder="Enter contact number"
                        value={rep.contact_number}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            client_representatives:
                              prev.client_representatives.map((r, i) =>
                                i === index
                                  ? { ...r, contact_number: e.target.value }
                                  : r,
                              ),
                          }))
                        }
                        disabled={isBusy}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        placeholder="Enter email"
                        value={rep.email}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            client_representatives:
                              prev.client_representatives.map((r, i) =>
                                i === index ? { ...r, email: e.target.value } : r,
                              ),
                          }))
                        }
                        disabled={isBusy}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    client_representatives: [
                      ...prev.client_representatives,
                      { name: "", contact_number: "", email: "" },
                    ],
                  }))
                }
                disabled={isBusy}
              >
                Add Client Representative
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Documents</Label>

            <div className="rounded-xl border border-dashed p-4">
              <label
                htmlFor="documents"
                className="flex cursor-pointer flex-col items-center justify-center gap-2 text-center"
              >
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">
                  Upload more images and PDFs
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
                disabled={isBusy}
              />
            </div>

            {canViewDocumentsFlag && existingDocuments.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Existing Documents</p>

                {existingDocuments.map((doc, index) => (
                  <div
                    key={`${doc.fileUrl}-${index}`}
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
                          {doc.fileName || `Document ${index + 1}`}
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
                      onClick={() => removeExistingDocument(index)}
                      disabled={isBusy}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {!canViewDocumentsFlag && (
              <p className="text-sm text-muted-foreground">
                Only super admin, admin, and manager can view uploaded documents.
              </p>
            )}

            {newDocuments.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">New Documents</p>

                {newDocuments.map((doc, index) => (
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
                      onClick={() => removeNewDocument(index)}
                      disabled={isBusy}
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
            onClick={handleClose}
            disabled={isBusy}
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isBusy || !facilityId || !isFormValid}
          >
            {updatingFacility ? "Updating..." : "Update Facility"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

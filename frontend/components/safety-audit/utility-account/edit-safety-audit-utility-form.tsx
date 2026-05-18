"use client";

import { canViewDocuments, type UserPermission } from "@/lib/authRoles";
import { useEffect, useMemo, useRef, useState } from "react";
import { toSameOriginFileManagementUrl } from "@/lib/fileManagementUrls";
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
import { FileText, Image as ImageIcon, Upload, X } from "lucide-react";
import { useUpdateUtilityAccountMutation } from "@/store/slices/electrical-audit/utilityApiSlice";
import { toastHandler } from "@/lib/toast";
import { useAppSelector } from "@/store/hooks";

interface UtilityAccountDocument {
  fileUrl?: string;
  fileName?: string;
  fileType: "image" | "pdf";
  uploadedAt?: string;
}

interface SafetyAuditUtilityAccount {
  _id: string;
  facility_id?: string;
  account_number: string;
  connection_type: "LT" | "HT";
  category?: string;
  location?: string;
  sanctioned_demand_kVA?: number;
  provider?: string;
  is_active?: boolean;
  documents?: UtilityAccountDocument[];
}

interface UploadDocumentItem {
  file: File;
  fileName: string;
  fileType: "image" | "pdf";
}

interface ExistingDocumentItem {
  fileUrl?: string;
  fileName: string;
  fileType: "image" | "pdf";
  uploadedAt?: string;
}

export interface EditSafetyAuditUtilityFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  utilityAccount: SafetyAuditUtilityAccount | null;
}

export function EditSafetyAuditUtilityForm({
  open,
  onOpenChange,
  onComplete,
  utilityAccount,
}: EditSafetyAuditUtilityFormProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const user = useAppSelector((state) => state.auth.user);
  const canViewDocumentsFlag = canViewDocuments(
    user?.role,
    (user?.permissions as UserPermission[]) || [],
  );

  const [updateUtilityAccount, { isLoading: updatingUtilityAccount }] =
    useUpdateUtilityAccountMutation();

  const [formData, setFormData] = useState({
    account_number: "",
    connection_type: "",
    category: "",
    location: "",
    sanctioned_demand_kVA: "",
    provider: "",
    is_active: true,
  });

  const [existingDocuments, setExistingDocuments] = useState<
    ExistingDocumentItem[]
  >([]);
  const [newDocuments, setNewDocuments] = useState<UploadDocumentItem[]>([]);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!utilityAccount) return;

    setFormData({
      account_number: utilityAccount.account_number || "",
      connection_type: utilityAccount.connection_type || "",
      category: utilityAccount.category || "",
      location: utilityAccount.location || "",
      sanctioned_demand_kVA:
        utilityAccount.sanctioned_demand_kVA !== undefined &&
          utilityAccount.sanctioned_demand_kVA !== null
          ? String(utilityAccount.sanctioned_demand_kVA)
          : "",
      provider: utilityAccount.provider || "",
      is_active:
        utilityAccount.is_active !== undefined
          ? utilityAccount.is_active
          : true,
    });

    setExistingDocuments(
      (utilityAccount.documents || []).map((doc, index) => ({
        fileUrl: doc.fileUrl,
        fileName: doc.fileName || `Document ${index + 1}`,
        fileType: doc.fileType,
        uploadedAt: doc.uploadedAt,
      })),
    );

    setNewDocuments([]);
    setSubmitError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [utilityAccount, open]);

  const updateField = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      account_number: "",
      connection_type: "",
      category: "",
      location: "",
      sanctioned_demand_kVA: "",
      provider: "",
      is_active: true,
    });

    setExistingDocuments([]);
    setNewDocuments([]);
    setSubmitError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    const validFiles: UploadDocumentItem[] = files
      .map((file) => {
        const isPdf =
          file.type === "application/pdf" ||
          file.name.toLowerCase().endsWith(".pdf");
        const isImage = file.type.startsWith("image/");

        if (!isPdf && !isImage) return null;

        return {
          file,
          fileName: file.name,
          fileType: isPdf ? "pdf" : "image",
        };
      })
      .filter(Boolean) as UploadDocumentItem[];

    setNewDocuments((prev) => [...prev, ...validFiles]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeExistingDocument = (index: number) => {
    setExistingDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewDocument = (index: number) => {
    setNewDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const isFormValid = useMemo(() => {
    return (
      formData.account_number.trim().length > 0 &&
      formData.connection_type.trim().length > 0
    );
  }, [formData.account_number, formData.connection_type]);

  const handleSubmit = async () => {
    setSubmitError("");

    if (!utilityAccount?._id) {
      setSubmitError("Utility account not found.");
      return;
    }

    if (!isFormValid) {
      setSubmitError("Account number and connection type are required.");
      return;
    }

    await toastHandler({
      action: () =>
        updateUtilityAccount({
          id: utilityAccount._id,
          account_number: formData.account_number.trim(),
          connection_type: formData.connection_type as "LT" | "HT",
          category: formData.category.trim() || undefined,
          location: formData.location.trim() || undefined,
          sanctioned_demand_kVA: formData.sanctioned_demand_kVA
            ? Number(formData.sanctioned_demand_kVA)
            : undefined,
          provider: formData.provider.trim() || undefined,
          is_active: formData.is_active,
          documents: newDocuments.map((doc) => doc.file),
        }).unwrap(),
      loading: "Updating utility account...",
      success: "Utility account updated successfully",
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
          <DialogTitle>Edit Utility Account (Safety Audit)</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="safety-edit-ua-account_number">
                Account Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="safety-edit-ua-account_number"
                placeholder="Enter account number"
                value={formData.account_number}
                onChange={(e) => updateField("account_number", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>
                Connection Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.connection_type}
                onValueChange={(value) => updateField("connection_type", value)}
              >
                <SelectTrigger id="safety-edit-ua-connection_type">
                  <SelectValue placeholder="Select connection type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LT">LT</SelectItem>
                  <SelectItem value="HT">HT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => updateField("category", value)}
              >
                <SelectTrigger id="safety-edit-ua-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Industrial">Industrial</SelectItem>
                  <SelectItem value="Commercial">Commercial</SelectItem>
                  <SelectItem value="Residential">Residential</SelectItem>
                  <SelectItem value="Institutional">Institutional</SelectItem>
                  <SelectItem value="Hospital">Hospital</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="safety-edit-ua-location">Location</Label>
              <Input
                id="safety-edit-ua-location"
                placeholder="Enter location"
                value={formData.location}
                onChange={(e) => updateField("location", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="safety-edit-ua-sanctioned_demand_kVA">
                Sanctioned Demand (kVA)
              </Label>
              <Input
                id="safety-edit-ua-sanctioned_demand_kVA"
                type="number"
                min="0"
                placeholder="Enter sanctioned demand"
                value={formData.sanctioned_demand_kVA}
                onChange={(e) =>
                  updateField("sanctioned_demand_kVA", e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="safety-edit-ua-provider">Provider</Label>
              <Input
                id="safety-edit-ua-provider"
                placeholder="e.g. PSPCL, DHBVN"
                value={formData.provider}
                onChange={(e) => updateField("provider", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Status</h3>
            <label className="flex items-center justify-between rounded-lg border p-3 sm:max-w-md">
              <span className="text-sm">Active</span>
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => updateField("is_active", e.target.checked)}
              />
            </label>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="safety-edit-ua-documents">Documents</Label>

              <div className="rounded-xl border border-dashed p-4">
                <label
                  htmlFor="safety-edit-ua-documents"
                  className="flex cursor-pointer flex-col items-center justify-center gap-2 text-center"
                >
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    Upload multiple images and PDFs
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Supported: JPG, PNG, WEBP, PDF
                  </span>
                </label>

                <input
                  ref={fileInputRef}
                  id="safety-edit-ua-documents"
                  type="file"
                  multiple
                  accept="image/*,.pdf,application/pdf"
                  onChange={handleFilesChange}
                  className="hidden"
                />
              </div>
            </div>

            {canViewDocumentsFlag && existingDocuments.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Existing Documents</p>

                {existingDocuments.map((doc, index) => (
                  <div
                    key={`${doc.fileName}-${index}`}
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
                          {doc.fileName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {doc.fileType.toUpperCase()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {doc.fileUrl && (
                        <a
                          href={toSameOriginFileManagementUrl(doc.fileUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-primary underline"
                        >
                          View
                        </a>
                      )}

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeExistingDocument(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
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
                    key={`${doc.fileName}-${index}`}
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
                          {doc.fileName}
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
            disabled={updatingUtilityAccount}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!isFormValid || updatingUtilityAccount}
          >
            {updatingUtilityAccount ? "Updating..." : "Update Utility Account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

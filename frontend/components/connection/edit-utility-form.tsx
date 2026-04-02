"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { useUpdateUtilityAccountMutation } from "@/store/slices/utilityApiSlice";
import { toastHandler } from "@/lib/toast";

interface UtilityAccountDocument {
  fileUrl?: string;
  fileName?: string;
  fileType: "image" | "pdf";
  uploadedAt?: string;
}

interface UtilityAccount {
  _id: string;
  facility_id?: string;
  account_number: string;
  connection_type: "LT" | "HT";
  category?: string;
  sanctioned_demand_kVA?: number;
  provider?: string;
  billing_cycle?: string;
  is_solar_connected?: boolean;
  is_dg_connected?: boolean;
  is_transformer_connected?: boolean;
  is_pump_connected?: boolean;
  is_transformer_maintained_by_facility?: boolean;
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

interface EditUtilityAccountFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  utilityAccount: UtilityAccount | null;
}

export function EditUtilityAccountForm({
  open,
  onOpenChange,
  onComplete,
  utilityAccount,
}: EditUtilityAccountFormProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [updateUtilityAccount, { isLoading: updatingUtilityAccount }] =
    useUpdateUtilityAccountMutation();

  const [formData, setFormData] = useState({
    account_number: "",
    connection_type: "",
    category: "",
    sanctioned_demand_kVA: "",
    provider: "",
    billing_cycle: "",
    is_solar_connected: false,
    is_dg_connected: false,
    is_transformer_connected: false,
    is_pump_connected: false,
    is_transformer_maintained_by_facility: false,
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
      sanctioned_demand_kVA:
        utilityAccount.sanctioned_demand_kVA !== undefined &&
        utilityAccount.sanctioned_demand_kVA !== null
          ? String(utilityAccount.sanctioned_demand_kVA)
          : "",
      provider: utilityAccount.provider || "",
      billing_cycle: utilityAccount.billing_cycle || "",
      is_solar_connected: utilityAccount.is_solar_connected || false,
      is_dg_connected: utilityAccount.is_dg_connected || false,
      is_transformer_connected:
        utilityAccount.is_transformer_connected || false,
      is_pump_connected: utilityAccount.is_pump_connected || false,
      is_transformer_maintained_by_facility:
        utilityAccount.is_transformer_maintained_by_facility || false,
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
      sanctioned_demand_kVA: "",
      provider: "",
      billing_cycle: "",
      is_solar_connected: false,
      is_dg_connected: false,
      is_transformer_connected: false,
      is_pump_connected: false,
      is_transformer_maintained_by_facility: false,
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
          sanctioned_demand_kVA: formData.sanctioned_demand_kVA
            ? Number(formData.sanctioned_demand_kVA)
            : undefined,
          provider: formData.provider.trim() || undefined,
          billing_cycle: formData.billing_cycle || undefined,
          is_solar_connected: formData.is_solar_connected,
          is_dg_connected: formData.is_dg_connected,
          is_transformer_connected: formData.is_transformer_connected,
          is_pump_connected: formData.is_pump_connected,
          is_transformer_maintained_by_facility:
            formData.is_transformer_maintained_by_facility,
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
          <DialogTitle>Edit Utility Account</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="account_number">
                Account Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="account_number"
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
                <SelectTrigger>
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
                <SelectTrigger>
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
              <Label htmlFor="sanctioned_demand_kVA">
                Sanctioned Demand (kVA)
              </Label>
              <Input
                id="sanctioned_demand_kVA"
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
              <Label htmlFor="provider">Provider</Label>
              <Input
                id="provider"
                placeholder="e.g. PSPCL, DHBVN"
                value={formData.provider}
                onChange={(e) => updateField("provider", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Billing Cycle</Label>
              <Select value={formData.billing_cycle} disabled>
                <SelectTrigger className="bg-muted cursor-not-allowed">
                  <SelectValue placeholder="Billing cycle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="bi-monthly">Bi-Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>

              <p className="text-xs text-muted-foreground">
                Billing cycle cannot be changed after creation
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium">Connected Systems</h3>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm">Solar Connected</span>
                <input
                  type="checkbox"
                  checked={formData.is_solar_connected}
                  onChange={(e) =>
                    updateField("is_solar_connected", e.target.checked)
                  }
                />
              </label>

              <label className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm">DG Connected</span>
                <input
                  type="checkbox"
                  checked={formData.is_dg_connected}
                  onChange={(e) =>
                    updateField("is_dg_connected", e.target.checked)
                  }
                />
              </label>

              <label className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm">Transformer Connected</span>
                <input
                  type="checkbox"
                  checked={formData.is_transformer_connected}
                  onChange={(e) =>
                    updateField("is_transformer_connected", e.target.checked)
                  }
                />
              </label>

              <label className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm">Pump Connected</span>
                <input
                  type="checkbox"
                  checked={formData.is_pump_connected}
                  onChange={(e) =>
                    updateField("is_pump_connected", e.target.checked)
                  }
                />
              </label>

              <label className="flex items-center justify-between rounded-lg border p-3 sm:col-span-2">
                <span className="text-sm">
                  Transformer Maintained by Facility
                </span>
                <input
                  type="checkbox"
                  checked={formData.is_transformer_maintained_by_facility}
                  onChange={(e) =>
                    updateField(
                      "is_transformer_maintained_by_facility",
                      e.target.checked,
                    )
                  }
                />
              </label>

              <label className="flex items-center justify-between rounded-lg border p-3 sm:col-span-2">
                <span className="text-sm">Active</span>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => updateField("is_active", e.target.checked)}
                />
              </label>
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
                    Supported: JPG, PNG, WEBP, PDF
                  </span>
                </label>

                <input
                  ref={fileInputRef}
                  id="documents"
                  type="file"
                  multiple
                  accept="image/*,.pdf,application/pdf"
                  onChange={handleFilesChange}
                  className="hidden"
                />
              </div>
            </div>

            {existingDocuments.length > 0 && (
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
                          href={doc.fileUrl}
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

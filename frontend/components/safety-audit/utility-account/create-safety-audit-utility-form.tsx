"use client";

/** New utility account for safety audit facilities — omits billing cycle and connected-systems flags. */

import { useMemo, useRef, useState } from "react";
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
import { useCreateUtilityAccountMutation } from "@/store/slices/electrical-audit/utilityApiSlice";
import { toastHandler } from "@/lib/toast";

export interface CreateSafetyAuditUtilityFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  facilityId: string;
}

interface UploadDocumentItem {
  file: File;
  fileName: string;
  fileType: "image" | "pdf";
}

export function CreateSafetyAuditUtilityForm({
  open,
  onOpenChange,
  onComplete,
  facilityId,
}: CreateSafetyAuditUtilityFormProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [createUtilityAccount, { isLoading: creatingUtilityAccount }] =
    useCreateUtilityAccountMutation();

  const [formData, setFormData] = useState({
    account_number: "",
    connection_type: "",
    category: "",
    location: "",
    sanctioned_demand_kVA: "",
    provider: "",
    is_active: true,
  });

  const [documents, setDocuments] = useState<UploadDocumentItem[]>([]);
  const [submitError, setSubmitError] = useState("");

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

    setDocuments([]);
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

    setDocuments((prev) => [...prev, ...validFiles]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const isFormValid = useMemo(() => {
    return (
      formData.account_number.trim().length > 0 &&
      formData.connection_type.trim().length > 0
    );
  }, [formData.account_number, formData.connection_type]);

  const handleSubmit = async () => {
    setSubmitError("");

    if (!isFormValid) {
      setSubmitError("Account number and connection type are required.");
      return;
    }

    await toastHandler({
      action: () =>
        createUtilityAccount({
          facility_id: facilityId,
          account_number: formData.account_number.trim(),
          connection_type: formData.connection_type as "LT" | "HT",
          category: formData.category.trim() || undefined,
          location: formData.location.trim() || undefined,
          sanctioned_demand_kVA: formData.sanctioned_demand_kVA
            ? Number(formData.sanctioned_demand_kVA)
            : undefined,
          provider: formData.provider.trim() || undefined,
          is_active: formData.is_active,
          documents: documents.map((doc) => doc.file),
        }).unwrap(),
      loading: "Creating utility account...",
      success: "Utility account created successfully",
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
          <DialogTitle>Add Utility Account (Safety Audit)</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="safety-ua-account_number">
                Account Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="safety-ua-account_number"
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
                <SelectTrigger id="safety-ua-connection_type">
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
                <SelectTrigger id="safety-ua-category">
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
              <Label htmlFor="safety-ua-location">Location</Label>
              <Input
                id="safety-ua-location"
                placeholder="Enter location"
                value={formData.location}
                onChange={(e) => updateField("location", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="safety-ua-sanctioned_demand_kVA">
                Sanctioned Demand (kVA)
              </Label>
              <Input
                id="safety-ua-sanctioned_demand_kVA"
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
              <Label htmlFor="safety-ua-provider">Provider</Label>
              <Input
                id="safety-ua-provider"
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
              <Label htmlFor="safety-ua-documents">Documents</Label>

              <div className="rounded-xl border border-dashed p-4">
                <label
                  htmlFor="safety-ua-documents"
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
                  id="safety-ua-documents"
                  type="file"
                  multiple
                  accept="image/*,.pdf,application/pdf"
                  onChange={handleFilesChange}
                  className="hidden"
                />
              </div>
            </div>

            {documents.length > 0 && (
              <div className="space-y-2">
                {documents.map((doc, index) => (
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
                      onClick={() => removeDocument(index)}
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
            disabled={creatingUtilityAccount}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!isFormValid || creatingUtilityAccount}
          >
            {creatingUtilityAccount ? "Creating..." : "Create Utility Account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

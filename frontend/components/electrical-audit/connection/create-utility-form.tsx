"use client";

/** New utility account for a facility; facility type and audit type live on the facility record. */

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
import {
  AUDIT_DOC_NEW_FILENAME_SPAN,
  AUDIT_DOC_ROW_ACTION_BTN,
  AUDIT_DOC_ROW_COMFORTABLE,
  AUDIT_DOC_ROW_LEFT_CLUSTER,
} from "@/components/electrical-audit/audit-document-layout";
import { cn } from "@/lib/utils";

interface AddUtilityAccountFormProps {
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

export function AddUtilityAccountForm({
  open,
  onOpenChange,
  onComplete,
  facilityId,
}: AddUtilityAccountFormProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [createUtilityAccount, { isLoading: creatingUtilityAccount }] =
    useCreateUtilityAccountMutation();

  const [formData, setFormData] = useState({
    account_number: "",
    connection_type: "",
    category: "",
    location: "",
    sanctioned_demand_value: "",
    sanctioned_demand_unit: "kVA",
    provider: "",
    billing_cycle: "",
    is_solar_connected: false,
    is_dg_connected: false,
    is_transformer_connected: false,
    is_pump_connected: false,
    is_transformer_maintained_by_facility: false,
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
      sanctioned_demand_value: "",
      sanctioned_demand_unit: "kVA",
      provider: "",
      billing_cycle: "",
      is_solar_connected: false,
      is_dg_connected: false,
      is_transformer_connected: false,
      is_pump_connected: false,
      is_transformer_maintained_by_facility: false,
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
          sanctioned_demand_value: formData.sanctioned_demand_value
            ? Number(formData.sanctioned_demand_value)
            : undefined,
          sanctioned_demand_unit: formData.sanctioned_demand_unit as "kVA" | "kW" | "BHP",
          provider: formData.provider.trim() || undefined,
          billing_cycle: formData.billing_cycle || undefined,
          is_solar_connected: formData.is_solar_connected,
          is_dg_connected: formData.is_dg_connected,
          is_transformer_connected: formData.is_transformer_connected,
          is_pump_connected: formData.is_pump_connected,
          is_transformer_maintained_by_facility:
            formData.is_transformer_maintained_by_facility,
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
          <DialogTitle>Add Utility Account</DialogTitle>
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
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="Enter location"
                value={formData.location}
                onChange={(e) => updateField("location", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sanctioned_demand_value">
                Sanctioned Demand
              </Label>
              <div className="flex gap-2">
                <Input
                  id="sanctioned_demand_value"
                  type="number"
                  min="0"
                  placeholder="Enter value"
                  value={formData.sanctioned_demand_value}
                  onChange={(e) =>
                    updateField("sanctioned_demand_value", e.target.value)
                  }
                  className="flex-1"
                />
                <Select
                  value={formData.sanctioned_demand_unit}
                  onValueChange={(value) => updateField("sanctioned_demand_unit", value)}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kVA">kVA</SelectItem>
                    <SelectItem value="kW">kW</SelectItem>
                    <SelectItem value="BHP">BHP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
              <Select
                value={formData.billing_cycle}
                onValueChange={(value) => updateField("billing_cycle", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select billing cycle" />
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

            {documents.length > 0 && (
              <div className="space-y-2">
                {documents.map((doc, index) => (
                  <div
                    key={`${doc.fileName}-${index}`}
                    className={AUDIT_DOC_ROW_COMFORTABLE}
                  >
                    <div className={AUDIT_DOC_ROW_LEFT_CLUSTER}>
                      {doc.fileType === "pdf" ? (
                        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}

                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            AUDIT_DOC_NEW_FILENAME_SPAN,
                            "font-medium text-foreground",
                          )}
                        >
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
                      className={AUDIT_DOC_ROW_ACTION_BTN}
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

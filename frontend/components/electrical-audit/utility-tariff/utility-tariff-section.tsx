"use client";

import { canViewDocuments, type UserPermission } from "@/lib/authRoles";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { toSameOriginFileManagementUrl } from "@/lib/fileManagementUrls";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Pencil,
  Save,
  X,
  Upload,
  FileText,
  ImageIcon,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import {
  UtilityTariffDocument,
  useCreateUtilityTariffMutation,
  useDeleteUtilityTariffMutation,
  useGetUtilityTariffsQuery,
  useUpdateUtilityTariffMutation,
} from "@/store/slices/electrical-audit/utilityTariffApiSlice";
import { toast } from "sonner";
import { toastHandler } from "@/lib/toast";
import { useAppSelector } from "@/store/hooks";
import {
  downloadUtilityTariffTemplate,
  parseUtilityTariffExcel,
  type TariffFormState,
} from "@/lib/electrical-audit/utility-tariff-excel";
import { UTILITY_AUDIT_STEP_IDS } from "@/lib/electrical-audit/utility-audit-steps";
import { cnHideUtilityAuditEdits } from "@/lib/electrical-audit/utility-audit-edits-visibility";
import { AuditStepSubmitBar } from "@/components/electrical-audit/utility-audit/audit-step-submit-bar";

interface UtilityTariffSectionProps {
  utilityAccountId: string;
  auditStepLocked?: boolean;
}

const editableInputClass =
  "border-input bg-background text-foreground focus:border-primary focus:ring-1 focus:ring-primary";

const autoInputClass =
  "cursor-not-allowed border border-dashed border-sky-300 bg-sky-100 text-sky-900 opacity-100 dark:border-sky-700 dark:bg-sky-950/60 dark:text-sky-100";

const getInputClass = (disabled: boolean) =>
  disabled ? autoInputClass : editableInputClass;

const emptyForm: TariffFormState = {
  effective_from: "",
  effective_to: "",
  basic_energy_charges_rs_per_unit: "",
  fixed_charges_rs_per_kW_or_per_kVA: "",
  ed_percent: "",
  octroi_rs_per_unit: "",
  surcharge_rs: "",
  cow_cess_rs: "",
  rental_rs: "",
  infracess_rs: "",
  other_charges_or_rebates_rs: "",
  any_other_rs: "",
};

function toDateInput(value?: string | null) {
  if (!value) return "";
  return new Date(value).toISOString().split("T")[0];
}

export function UtilityTariffSection({
  utilityAccountId,
  auditStepLocked = false,
}: UtilityTariffSectionProps) {
  const user = useAppSelector((state) => state.auth.user);
  const canDeleteRecords =
    user?.role === "super_admin" || user?.role === "admin";
  const canViewDocumentsFlag = canViewDocuments(
    user?.role,
    (user?.permissions as UserPermission[]) || [],
  );
  const { data, isLoading } = useGetUtilityTariffsQuery({
    utility_account_id: utilityAccountId,
  });

  const [createUtilityTariff, { isLoading: isCreating }] =
    useCreateUtilityTariffMutation();

  const [updateUtilityTariff, { isLoading: isUpdating }] =
    useUpdateUtilityTariffMutation();
  const [deleteUtilityTariff, { isLoading: isDeleting }] =
    useDeleteUtilityTariffMutation();

  const tariffs = data?.data || [];

  const latestTariff = useMemo(() => {
    if (!tariffs.length) return null;

    return [...tariffs].sort(
      (a, b) =>
        new Date(b.effective_from).getTime() -
        new Date(a.effective_from).getTime(),
    )[0];
  }, [tariffs]);

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (auditStepLocked) setIsEditing(false);
  }, [auditStepLocked]);
  const [form, setForm] = useState<TariffFormState>(emptyForm);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingDocuments, setExistingDocuments] = useState<
    UtilityTariffDocument[]
  >([]);
  const [excelImporting, setExcelImporting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (latestTariff) {
      setForm({
        effective_from: toDateInput(latestTariff.effective_from),
        effective_to: toDateInput(latestTariff.effective_to),
        basic_energy_charges_rs_per_unit:
          latestTariff.basic_energy_charges_rs_per_unit?.toString() || "",
        fixed_charges_rs_per_kW_or_per_kVA:
          latestTariff.fixed_charges_rs_per_kW_or_per_kVA?.toString() || "",
        ed_percent: latestTariff.ed_percent?.toString() || "",
        octroi_rs_per_unit: latestTariff.octroi_rs_per_unit?.toString() || "",
        surcharge_rs: latestTariff.surcharge_rs?.toString() || "",
        cow_cess_rs: latestTariff.cow_cess_rs?.toString() || "",
        rental_rs: latestTariff.rental_rs?.toString() || "",
        infracess_rs: latestTariff.infracess_rs?.toString() || "",
        other_charges_or_rebates_rs:
          latestTariff.other_charges_or_rebates_rs?.toString() || "",
        any_other_rs: latestTariff.any_other_rs?.toString() || "",
      });

      setExistingDocuments(latestTariff.documents || []);
      setSelectedFiles([]);
      setIsEditing(false);
    } else {
      setForm(emptyForm);
      setExistingDocuments([]);
      setSelectedFiles([]);
      setIsEditing(true);
    }
  }, [latestTariff]);

  const handleChange = (key: keyof TariffFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleDownloadExcelTemplate = () => {
    downloadUtilityTariffTemplate();
  };

  const handleExcelFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const name = file.name.toLowerCase();
    if (!name.endsWith(".xlsx") && !name.endsWith(".xls")) {
      toast.error("Please choose an Excel file (.xlsx or .xls).");
      return;
    }

    setExcelImporting(true);
    try {
      const parsed = await parseUtilityTariffExcel(file);
      const keys = Object.keys(parsed) as (keyof TariffFormState)[];
      if (!keys.length) {
        toast.error("No recognized fields found. Use the downloaded template.");
        return;
      }

      setForm((prev) => ({ ...prev, ...parsed }));
      setIsEditing(true);
      toast.success("Form filled from Excel.");
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error
          ? err.message
          : "Could not read that Excel file.",
      );
    } finally {
      setExcelImporting(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setSelectedFiles((prev) => [...prev, ...files]);

    // reset input so same file can be reselected if removed
    e.target.value = "";
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingDocument = (index: number) => {
    setExistingDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const resetFormFromLatest = () => {
    if (latestTariff) {
      setForm({
        effective_from: toDateInput(latestTariff.effective_from),
        effective_to: toDateInput(latestTariff.effective_to),
        basic_energy_charges_rs_per_unit:
          latestTariff.basic_energy_charges_rs_per_unit?.toString() || "",
        fixed_charges_rs_per_kW_or_per_kVA:
          latestTariff.fixed_charges_rs_per_kW_or_per_kVA?.toString() || "",
        ed_percent: latestTariff.ed_percent?.toString() || "",
        octroi_rs_per_unit: latestTariff.octroi_rs_per_unit?.toString() || "",
        surcharge_rs: latestTariff.surcharge_rs?.toString() || "",
        cow_cess_rs: latestTariff.cow_cess_rs?.toString() || "",
        rental_rs: latestTariff.rental_rs?.toString() || "",
        infracess_rs: latestTariff.infracess_rs?.toString() || "",
        other_charges_or_rebates_rs:
          latestTariff.other_charges_or_rebates_rs?.toString() || "",
        any_other_rs: latestTariff.any_other_rs?.toString() || "",
      });

      setExistingDocuments(latestTariff.documents || []);
      setSelectedFiles([]);
      setIsEditing(false);
    } else {
      setForm(emptyForm);
      setExistingDocuments([]);
      setSelectedFiles([]);
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    resetFormFromLatest();
  };

  const handleSave = async () => {
    try {
      const payload = {
        utility_account_id: utilityAccountId,
        effective_from: form.effective_from,
        effective_to: form.effective_to || null,
        basic_energy_charges_rs_per_unit:
          form.basic_energy_charges_rs_per_unit || undefined,
        fixed_charges_rs_per_kW_or_per_kVA:
          form.fixed_charges_rs_per_kW_or_per_kVA || undefined,
        ed_percent: form.ed_percent || undefined,
        octroi_rs_per_unit: form.octroi_rs_per_unit || undefined,
        surcharge_rs: form.surcharge_rs || undefined,
        cow_cess_rs: form.cow_cess_rs || undefined,
        rental_rs: form.rental_rs || undefined,
        infracess_rs: form.infracess_rs || undefined,
        other_charges_or_rebates_rs:
          form.other_charges_or_rebates_rs || undefined,
        any_other_rs: form.any_other_rs || undefined,
        documents: selectedFiles,
        existing_documents: existingDocuments,
      };

      await toastHandler({
        action: () => {
          if (latestTariff?._id) {
            return updateUtilityTariff({
              id: latestTariff._id,
              ...payload,
            }).unwrap();
          }
          return createUtilityTariff(payload).unwrap();
        },
        loading: latestTariff?._id
          ? "Updating utility tariff..."
          : "Creating utility tariff...",
        success: latestTariff?._id
          ? "Utility tariff updated successfully"
          : "Utility tariff created successfully",
      });
      setSelectedFiles([]);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save utility tariff:", error);
    }
  };

  const handleDelete = async () => {
    if (!latestTariff?._id || !canDeleteRecords) return;
    try {
      await toastHandler({
        action: () => deleteUtilityTariff(latestTariff._id as string).unwrap(),
        loading: "Deleting utility tariff...",
        success: "Utility tariff deleted successfully",
      });
    } catch (error) {
      console.error("Failed to delete utility tariff:", error);
    }
  };

  const saving = isCreating || isUpdating || isDeleting;

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground">Loading tariff...</div>
    );
  }

  return (
    <div className="relative space-y-4">
      <AuditStepSubmitBar
        utilityAccountId={utilityAccountId}
        stepId={UTILITY_AUDIT_STEP_IDS.TARIFF}
        auditStepLocked={auditStepLocked}
      />

      <div className="relative min-w-0 max-w-full">
        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <CardTitle className="min-w-0 shrink-0 text-balance">
              Utility Tariff
            </CardTitle>

            <div
              className={cnHideUtilityAuditEdits(
                auditStepLocked,
                "flex min-w-0 flex-wrap items-center justify-end gap-2",
              )}
            >
              <input
                id="tariff-excel-import"
                type="file"
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                className="hidden"
                onChange={handleExcelFileChange}
                disabled={excelImporting}
              />

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadExcelTemplate}
              >
            <Download className="mr-2 h-4 w-4" />
            Excel template
          </Button>

          <Label
            htmlFor="tariff-excel-import"
            className={`inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground ${
              excelImporting ? "pointer-events-none opacity-50" : ""
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            {excelImporting ? "Reading…" : "Import Excel"}
          </Label>

          {!isEditing ? (
            <>
              <Button onClick={() => setIsEditing(true)} size="sm">
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
              {canDeleteRecords && latestTariff?._id ? (
                <Button
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                  size="sm"
                  disabled={saving}
                >
                  Delete
                </Button>
              ) : null}
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                size="sm"
                disabled={saving}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>

              <Button onClick={handleSave} size="sm" disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save"}
              </Button>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className="min-w-0 space-y-6 overflow-x-hidden">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Effective From</Label>
            <Input
              type="date"
              value={form.effective_from}
              onChange={(e) => handleChange("effective_from", e.target.value)}
              disabled={!isEditing}
              className={getInputClass(!isEditing)}
            />
          </div>

          <div className="space-y-2">
            <Label>Effective To</Label>
            <Input
              type="date"
              value={form.effective_to}
              onChange={(e) => handleChange("effective_to", e.target.value)}
              disabled={!isEditing}
              className={getInputClass(!isEditing)}
            />
          </div>

          <div className="space-y-2">
            <Label>Basic Energy Charges (₹/unit)</Label>
            <Input
              type="number"
              value={form.basic_energy_charges_rs_per_unit}
              onChange={(e) =>
                handleChange("basic_energy_charges_rs_per_unit", e.target.value)
              }
              disabled={!isEditing}
              className={getInputClass(!isEditing)}
            />
          </div>

          <div className="space-y-2">
            <Label>Fixed Charges (₹/kW or kVA)</Label>
            <Input
              type="number"
              value={form.fixed_charges_rs_per_kW_or_per_kVA}
              onChange={(e) =>
                handleChange(
                  "fixed_charges_rs_per_kW_or_per_kVA",
                  e.target.value,
                )
              }
              disabled={!isEditing}
              className={getInputClass(!isEditing)}
            />
          </div>

          <div className="space-y-2">
            <Label>ED (%)</Label>
            <Input
              type="number"
              value={form.ed_percent}
              onChange={(e) => handleChange("ed_percent", e.target.value)}
              disabled={!isEditing}
              className={getInputClass(!isEditing)}
            />
          </div>

          <div className="space-y-2">
            <Label>Octroi (₹/unit)</Label>
            <Input
              type="number"
              value={form.octroi_rs_per_unit}
              onChange={(e) =>
                handleChange("octroi_rs_per_unit", e.target.value)
              }
              disabled={!isEditing}
              className={getInputClass(!isEditing)}
            />
          </div>

          <div className="space-y-2">
            <Label>Surcharge (₹)</Label>
            <Input
              type="number"
              value={form.surcharge_rs}
              onChange={(e) => handleChange("surcharge_rs", e.target.value)}
              disabled={!isEditing}
              className={getInputClass(!isEditing)}
            />
          </div>

          <div className="space-y-2">
            <Label>Cow Cess (₹)</Label>
            <Input
              type="number"
              value={form.cow_cess_rs}
              onChange={(e) => handleChange("cow_cess_rs", e.target.value)}
              disabled={!isEditing}
              className={getInputClass(!isEditing)}
            />
          </div>

          <div className="space-y-2">
            <Label>Rental (₹)</Label>
            <Input
              type="number"
              value={form.rental_rs}
              onChange={(e) => handleChange("rental_rs", e.target.value)}
              disabled={!isEditing}
              className={getInputClass(!isEditing)}
            />
          </div>

          <div className="space-y-2">
            <Label>Infra Cess (₹)</Label>
            <Input
              type="number"
              value={form.infracess_rs}
              onChange={(e) => handleChange("infracess_rs", e.target.value)}
              disabled={!isEditing}
              className={getInputClass(!isEditing)}
            />
          </div>

          <div className="space-y-2">
            <Label>Other Charges / Rebates (₹)</Label>
            <Input
              type="number"
              value={form.other_charges_or_rebates_rs}
              onChange={(e) =>
                handleChange("other_charges_or_rebates_rs", e.target.value)
              }
              disabled={!isEditing}
              className={getInputClass(!isEditing)}
            />
          </div>

          <div className="space-y-2">
            <Label>Any Other (₹)</Label>
            <Input
              type="number"
              value={form.any_other_rs}
              onChange={(e) => handleChange("any_other_rs", e.target.value)}
              disabled={!isEditing}
              className={getInputClass(!isEditing)}
            />
          </div>
        </div>

        <div className="min-w-0 space-y-3 overflow-hidden rounded-xl border p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h4 className="text-sm font-semibold">Documents</h4>

            {isEditing && (
              <Label
                htmlFor="tariff-documents"
                className="inline-flex w-fit shrink-0 cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
              >
                <Upload className="h-4 w-4 shrink-0" />
                Upload Documents
              </Label>
            )}
          </div>

          {isEditing && (
            <Input
              id="tariff-documents"
              type="file"
              multiple
              accept=".pdf,image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          )}

          {canViewDocumentsFlag && existingDocuments.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Existing Documents
              </p>

              <div className="grid min-w-0 gap-2">
                {existingDocuments.map((doc, index) => (
                  <div
                    key={`${doc.fileUrl}-${index}`}
                    className="flex min-w-0 flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      {doc.fileType === "image" ? (
                        <ImageIcon className="h-4 w-4 shrink-0 text-primary" />
                      ) : (
                        <FileText className="h-4 w-4 shrink-0 text-destructive" />
                      )}

                      <a
                        href={toSameOriginFileManagementUrl(doc.fileUrl)}
                        target="_blank"
                        rel="noreferrer"
                        title={doc.fileName || `Document ${index + 1}`}
                        className="block min-w-0 max-w-full text-sm text-primary underline-offset-2 hover:underline max-sm:break-words max-sm:[overflow-wrap:anywhere] sm:truncate"
                      >
                        {doc.fileName || `Document ${index + 1}`}
                      </a>
                    </div>

                    {isEditing && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full shrink-0 sm:w-auto"
                        onClick={() => removeExistingDocument(index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {!canViewDocumentsFlag && (
            <p className="text-sm text-muted-foreground">
              Only super admin, admin, and manager can view uploaded documents.
            </p>
          )}

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                New Selected Files
              </p>

              <div className="grid min-w-0 gap-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex min-w-0 flex-col gap-3 rounded-lg border border-dashed p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
                      {file.type.startsWith("image/") ? (
                        <ImageIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary sm:mt-0" />
                      ) : (
                        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-destructive sm:mt-0" />
                      )}

                      <span
                        title={file.name}
                        className="min-w-0 flex-1 break-words text-sm leading-snug text-foreground [overflow-wrap:anywhere]"
                      >
                        {file.name}
                      </span>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full shrink-0 sm:w-auto"
                      onClick={() => removeSelectedFile(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {existingDocuments.length === 0 && selectedFiles.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No documents uploaded yet.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete utility tariff record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the current utility tariff record.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  );
}

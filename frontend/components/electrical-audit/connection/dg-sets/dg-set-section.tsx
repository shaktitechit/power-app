"use client";

import { canViewDocuments, type UserPermission } from "@/lib/authRoles";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Pencil,
  Save,
  X,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import {
  useCreateDGSetMutation,
  useDeleteDGSetMutation,
  useGetDGSetsQuery,
  useUpdateDGSetMutation,
  type DGSet,
  type DGSetDocument,
} from "@/store/slices/electrical-audit/dgSetApiSlice";
import { useRouter } from "next/navigation";
import { toastHandler } from "@/lib/toast";
import { useAppSelector } from "@/store/hooks";
import { UTILITY_AUDIT_STEP_IDS } from "@/lib/electrical-audit/utility-audit-steps";
import { cnHideUtilityAuditEdits } from "@/lib/electrical-audit/utility-audit-edits-visibility";
import { AuditStepSubmitBar } from "@/components/electrical-audit/utility-audit/audit-step-submit-bar";
import {
  AUDIT_DOC_ANCHOR_ROW,
  AUDIT_DOC_LINK_PRIMARY,
  AUDIT_DOC_NEW_FILENAME_SPAN,
  AUDIT_DOC_ROW_ACTION_BTN,
  AUDIT_DOC_ROW_DENSE,
  AUDIT_DOC_ROW_LEFT_CLUSTER,
} from "@/components/electrical-audit/audit-document-layout";
import { cn } from "@/lib/utils";

interface DGSetSectionProps {
  utilityAccountId: string;
  facilityId: string;
  facilityPathPrefix: string;
  auditStepLocked?: boolean;
}

type DGSetFormState = {
  id?: string;
  localId: string;
  isNew: boolean;
  isEditing: boolean;

  dg_number: string;
  make_model: string;
  year_of_installation: string;
  rated_capacity_kVA: string;
  rated_active_power_kW: string;
  rated_voltage_V: string;
  rated_speed_RPM: string;
  fuel_type: "diesel" | "gas" | "dual";

  existingDocuments: DGSetDocument[];
  newDocuments: File[];
};

const createEmptyForm = (): DGSetFormState => ({
  localId: `new-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  isNew: true,
  isEditing: true,

  dg_number: "",
  make_model: "",
  year_of_installation: "",
  rated_capacity_kVA: "",
  rated_active_power_kW: "",
  rated_voltage_V: "",
  rated_speed_RPM: "",
  fuel_type: "diesel",

  existingDocuments: [],
  newDocuments: [],
});

function toDateInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
}

function dgSetToForm(dgSet: DGSet): DGSetFormState {
  return {
    id: dgSet._id,
    localId: dgSet._id,
    isNew: false,
    isEditing: false,

    dg_number: dgSet.dg_number || "",
    make_model: dgSet.make_model || "",
    year_of_installation: dgSet.year_of_installation?.toString() || "",
    rated_capacity_kVA: dgSet.rated_capacity_kVA?.toString() || "",
    rated_active_power_kW: dgSet.rated_active_power_kW?.toString() || "",
    rated_voltage_V: dgSet.rated_voltage_V?.toString() || "",
    rated_speed_RPM: dgSet.rated_speed_RPM?.toString() || "",
    fuel_type: dgSet.fuel_type || "diesel",

    existingDocuments: dgSet.documents || [],
    newDocuments: [],
  };
}

const toNumber = (value: string) => {
  if (!value || value.trim() === "") return undefined;
  const num = Number(value);
  return Number.isNaN(num) ? undefined : num;
};

const getErrorMessage = (error: any) => {
  if (error?.data?.message) return error.data.message;
  if (typeof error?.data === "string") return error.data;
  if (error?.error) return error.error;
  return "Failed to save DG set";
};

export function DGSetSection({
  utilityAccountId,
  facilityId,
  facilityPathPrefix,
  auditStepLocked = false,
}: DGSetSectionProps) {
  const user = useAppSelector((state) => state.auth.user);
  const canDeleteRecords =
    user?.role === "super_admin" || user?.role === "admin";
  const canViewDocumentsFlag = canViewDocuments(
    user?.role,
    (user?.permissions as UserPermission[]) || [],
  );
  const router = useRouter();
  const { data, isLoading } = useGetDGSetsQuery({
    utility_account_id: utilityAccountId,
  });

  const [createDGSet, { isLoading: isCreating }] = useCreateDGSetMutation();
  const [updateDGSet, { isLoading: isUpdating }] = useUpdateDGSetMutation();
  const [deleteDGSet, { isLoading: isDeleting }] = useDeleteDGSetMutation();

  const dgSets = useMemo(() => data?.data || [], [data]);
  const [forms, setForms] = useState<DGSetFormState[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeFormLocalId, setActiveFormLocalId] = useState<string | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<DGSetFormState | null>(null);

  useEffect(() => {
    const mapped = dgSets.map(dgSetToForm);
    setForms((prev) => {
      const unsavedForms = prev.filter((item) => item.isNew);
      return [...unsavedForms, ...mapped];
    });
  }, [dgSets]);

  const activeForm =
    forms.find((form) => form.localId === activeFormLocalId) || null;

  const updateForm = (
    localId: string,
    key: keyof DGSetFormState,
    value: string | File[],
  ) => {
    setForms((prev) =>
      prev.map((form) =>
        form.localId === localId ? { ...form, [key]: value } : form,
      ),
    );
  };

  const replaceForm = (localId: string, nextForm: DGSetFormState) => {
    setForms((prev) =>
      prev.map((form) => (form.localId === localId ? nextForm : form)),
    );
  };

  const toggleEdit = (localId: string, editing: boolean) => {
    setForms((prev) =>
      prev.map((form) =>
        form.localId === localId ? { ...form, isEditing: editing } : form,
      ),
    );
  };

  const removeForm = (localId: string) => {
    setForms((prev) => prev.filter((form) => form.localId !== localId));
  };

  const handleOpenCreate = () => {
    setErrorMessage("");
    const newForm = createEmptyForm();
    setForms((prev) => [newForm, ...prev]);
    setActiveFormLocalId(newForm.localId);
    setDialogOpen(true);
  };

  const handleOpenEdit = (localId: string) => {
    setErrorMessage("");
    toggleEdit(localId, true);
    setActiveFormLocalId(localId);
    setDialogOpen(true);
  };

  const handleCancel = (form: DGSetFormState) => {
    setErrorMessage("");

    if (form.isNew) {
      removeForm(form.localId);
      setDialogOpen(false);
      setActiveFormLocalId(null);
      return;
    }

    const original = dgSets.find((item) => item._id === form.id);
    if (!original) return;

    replaceForm(form.localId, dgSetToForm(original));
    setDialogOpen(false);
    setActiveFormLocalId(null);
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open && activeForm) {
      if (activeForm.isNew) {
        removeForm(activeForm.localId);
      } else {
        const original = dgSets.find((item) => item._id === activeForm.id);
        if (original) {
          replaceForm(activeForm.localId, dgSetToForm(original));
        }
      }
      setErrorMessage("");
      setActiveFormLocalId(null);
    }

    setDialogOpen(open);
  };

  const handleDocumentChange = (localId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;

    const selectedFiles = Array.from(files);

    setForms((prev) =>
      prev.map((form) =>
        form.localId === localId
          ? {
              ...form,
              newDocuments: [...form.newDocuments, ...selectedFiles],
            }
          : form,
      ),
    );
  };

  const removeNewDocument = (localId: string, index: number) => {
    setForms((prev) =>
      prev.map((form) =>
        form.localId === localId
          ? {
              ...form,
              newDocuments: form.newDocuments.filter((_, i) => i !== index),
            }
          : form,
      ),
    );
  };

  const handleSave = async (form: DGSetFormState) => {
    setErrorMessage("");

    if (!form.dg_number.trim()) {
      setErrorMessage("DG Number is required");
      return;
    }

    const payload: any = {
      facility_id: facilityId,
      utility_account_id: utilityAccountId,
      dg_number: form.dg_number.trim(),
      fuel_type: form.fuel_type,
    };

    if (form.make_model.trim()) payload.make_model = form.make_model.trim();

    const year_of_installation = toNumber(form.year_of_installation);
    if (year_of_installation !== undefined) {
      payload.year_of_installation = year_of_installation;
    }

    const rated_capacity_kVA = toNumber(form.rated_capacity_kVA);
    if (rated_capacity_kVA !== undefined) {
      payload.rated_capacity_kVA = rated_capacity_kVA;
    }

    const rated_active_power_kW = toNumber(form.rated_active_power_kW);
    if (rated_active_power_kW !== undefined) {
      payload.rated_active_power_kW = rated_active_power_kW;
    }

    const rated_voltage_V = toNumber(form.rated_voltage_V);
    if (rated_voltage_V !== undefined) {
      payload.rated_voltage_V = rated_voltage_V;
    }

    const rated_speed_RPM = toNumber(form.rated_speed_RPM);
    if (rated_speed_RPM !== undefined) {
      payload.rated_speed_RPM = rated_speed_RPM;
    }

    if (form.newDocuments.length > 0) {
      payload.documents = form.newDocuments;
    }

    try {
      await toastHandler({
        action: () => {
          if (form.isNew) {
            return createDGSet(payload).unwrap();
          }

          if (form.id) {
            return updateDGSet({
              id: form.id,
              ...payload,
            }).unwrap();
          }

          return Promise.reject(new Error("DG Set ID is missing."));
        },
        loading: form.isNew ? "Creating DG set..." : "Updating DG set...",
        success: form.isNew
          ? "DG set created successfully"
          : "DG set updated successfully",
      });
      setErrorMessage("");
      setDialogOpen(false);
      setActiveFormLocalId(null);
    } catch (error: any) {
      console.error("FULL ERROR:", error);
      console.error("ERROR DATA:", error?.data);
      console.error("ERROR STATUS:", error?.status);

      setErrorMessage(getErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id || !canDeleteRecords) return;
    try {
      await toastHandler({
        action: () => deleteDGSet(deleteTarget.id as string).unwrap(),
        loading: "Deleting DG set...",
        success: "DG set deleted successfully",
      });
      setDeleteTarget(null);
    } catch (error) {
      console.error("Failed to delete DG set:", error);
    }
  };

  const saving = isCreating || isUpdating || isDeleting;

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground">Loading DG sets...</div>
    );
  }

  return (
    <div className="relative space-y-4">
      <div className="relative">
        <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <h3 className="text-lg font-medium text-foreground">DG Sets</h3>
          <AuditStepSubmitBar
            variant="compact"
            utilityAccountId={utilityAccountId}
            stepId={UTILITY_AUDIT_STEP_IDS.DG}
            stepLabel="DG audit"
            auditStepLocked={auditStepLocked}
          />
        </div>

        <Button
          onClick={handleOpenCreate}
          className={cnHideUtilityAuditEdits(auditStepLocked)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create DG Set
        </Button>
      </div>

      {errorMessage ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      {dgSets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>DG Set Table</CardTitle>
          </CardHeader>

          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[1200px] text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="px-3 py-2 font-medium">DG Number</th>
                  <th className="px-3 py-2 font-medium">Make / Model</th>
                  <th className="px-3 py-2 font-medium">Year</th>
                  <th className="px-3 py-2 font-medium">Capacity (kVA)</th>
                  <th className="px-3 py-2 font-medium">Power (kW)</th>
                  <th className="px-3 py-2 font-medium">Voltage (V)</th>
                  <th className="px-3 py-2 font-medium">Speed (RPM)</th>
                  <th className="px-3 py-2 font-medium">Fuel Type</th>

                  <th className="px-3 py-2 font-medium">Documents</th>
                  <th className="px-3 py-2 font-medium">Action</th>
                </tr>
              </thead>

              <tbody>
                {forms
                  .filter((form) => !form.isNew)
                  .map((form) => (
                    <tr key={form.localId} className="border-b align-top">
                      <td className="px-3 py-2">{form.dg_number || "-"}</td>
                      <td className="px-3 py-2">{form.make_model || "-"}</td>
                      <td className="px-3 py-2">
                        {form.year_of_installation || "-"}
                      </td>
                      <td className="px-3 py-2">
                        {form.rated_capacity_kVA || "-"}
                      </td>
                      <td className="px-3 py-2">
                        {form.rated_active_power_kW || "-"}
                      </td>
                      <td className="px-3 py-2">
                        {form.rated_voltage_V || "-"}
                      </td>
                      <td className="px-3 py-2">
                        {form.rated_speed_RPM || "-"}
                      </td>
                      <td className="px-3 py-2 capitalize">
                        {form.fuel_type || "-"}
                      </td>

                      <td className="max-w-[min(280px,40vw)] px-3 py-2 align-top">
                        {form.existingDocuments.length > 0 ? (
                          <div className="flex min-w-0 flex-col gap-1">
                            {form.existingDocuments.map((doc, index) => (
                              <a
                                key={`${doc.fileUrl}-${index}`}
                                href={toSameOriginFileManagementUrl(doc.fileUrl)}
                                target="_blank"
                                rel="noreferrer"
                                title={doc.fileName || `Document ${index + 1}`}
                                className={cn(
                                  AUDIT_DOC_LINK_PRIMARY,
                                  "text-xs",
                                )}
                              >
                                {doc.fileName || `Document ${index + 1}`}
                              </a>
                            ))}
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {/* Edit Button */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEdit(form.localId)}
                            className={cnHideUtilityAuditEdits(auditStepLocked)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                          {canDeleteRecords ? (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setDeleteTarget(form)}
                              disabled={saving}
                              className={cnHideUtilityAuditEdits(auditStepLocked)}
                            >
                              Delete
                            </Button>
                          ) : null}

                          {/* Audit Button */}
                          <Button
                            size="sm"
                            disabled={!form.id}
                            className="bg-warning text-warning-foreground hover:bg-warning/90"
                            onClick={() =>
                              router.push(
                                `${facilityPathPrefix}/utility-account/${utilityAccountId}/dg-audit/${form.id}`,
                              )
                            }
                          >
                            Audit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {forms.length === 0 && (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            No DG sets found. Click{" "}
            <span className="font-medium">Create DG Set</span> to add one.
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {activeForm?.isNew ? "New DG Set" : "Edit DG Set"}
            </DialogTitle>
          </DialogHeader>

          {activeForm ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`dg_number-${activeForm.localId}`}>
                  DG Number *
                </Label>
                <Input
                  id={`dg_number-${activeForm.localId}`}
                  value={activeForm.dg_number}
                  onChange={(e) =>
                    updateForm(activeForm.localId, "dg_number", e.target.value)
                  }
                  placeholder="Enter DG number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`make_model-${activeForm.localId}`}>
                  Make / Model
                </Label>
                <Input
                  id={`make_model-${activeForm.localId}`}
                  value={activeForm.make_model}
                  onChange={(e) =>
                    updateForm(activeForm.localId, "make_model", e.target.value)
                  }
                  placeholder="Enter make or model"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`year_of_installation-${activeForm.localId}`}>
                  Year of Installation
                </Label>
                <Input
                  id={`year_of_installation-${activeForm.localId}`}
                  type="number"
                  value={activeForm.year_of_installation}
                  onChange={(e) =>
                    updateForm(
                      activeForm.localId,
                      "year_of_installation",
                      e.target.value,
                    )
                  }
                  placeholder="e.g. 2022"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`rated_capacity_kVA-${activeForm.localId}`}>
                  Rated Capacity (kVA)
                </Label>
                <Input
                  id={`rated_capacity_kVA-${activeForm.localId}`}
                  type="number"
                  value={activeForm.rated_capacity_kVA}
                  onChange={(e) =>
                    updateForm(
                      activeForm.localId,
                      "rated_capacity_kVA",
                      e.target.value,
                    )
                  }
                  placeholder="Enter capacity"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`rated_active_power_kW-${activeForm.localId}`}>
                  Rated Active Power (kW)
                </Label>
                <Input
                  id={`rated_active_power_kW-${activeForm.localId}`}
                  type="number"
                  value={activeForm.rated_active_power_kW}
                  onChange={(e) =>
                    updateForm(
                      activeForm.localId,
                      "rated_active_power_kW",
                      e.target.value,
                    )
                  }
                  placeholder="Enter active power"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`rated_voltage_V-${activeForm.localId}`}>
                  Rated Voltage (V)
                </Label>
                <Input
                  id={`rated_voltage_V-${activeForm.localId}`}
                  type="number"
                  value={activeForm.rated_voltage_V}
                  onChange={(e) =>
                    updateForm(
                      activeForm.localId,
                      "rated_voltage_V",
                      e.target.value,
                    )
                  }
                  placeholder="Enter voltage"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`rated_speed_RPM-${activeForm.localId}`}>
                  Rated Speed (RPM)
                </Label>
                <Input
                  id={`rated_speed_RPM-${activeForm.localId}`}
                  type="number"
                  value={activeForm.rated_speed_RPM}
                  onChange={(e) =>
                    updateForm(
                      activeForm.localId,
                      "rated_speed_RPM",
                      e.target.value,
                    )
                  }
                  placeholder="Enter speed"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`fuel_type-${activeForm.localId}`}>
                  Fuel Type
                </Label>
                <select
                  id={`fuel_type-${activeForm.localId}`}
                  value={activeForm.fuel_type}
                  onChange={(e) =>
                    updateForm(
                      activeForm.localId,
                      "fuel_type",
                      e.target.value as "diesel" | "gas" | "dual",
                    )
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="diesel">Diesel</option>
                  <option value="gas">Gas</option>
                  <option value="dual">Dual</option>
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor={`documents-${activeForm.localId}`}>
                  Upload Documents
                </Label>
                <Input
                  id={`documents-${activeForm.localId}`}
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    handleDocumentChange(activeForm.localId, e.target.files);
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Supported: images and PDF files
                </p>
              </div>

              {canViewDocumentsFlag && activeForm.existingDocuments.length > 0 && (
                <div className="space-y-2 md:col-span-2">
                  <Label>Existing Documents</Label>
                  <div className="grid gap-2">
                    {activeForm.existingDocuments.map((doc, index) => (
                      <a
                        key={`${doc.fileUrl}-${index}`}
                        href={toSameOriginFileManagementUrl(doc.fileUrl)}
                        target="_blank"
                        rel="noreferrer"
                        title={doc.fileName || `Document ${index + 1}`}
                        className={AUDIT_DOC_ANCHOR_ROW}
                      >
                        {doc.fileType === "pdf" ? (
                          <FileText className="h-4 w-4 shrink-0" />
                        ) : (
                          <ImageIcon className="h-4 w-4 shrink-0" />
                        )}
                        <span
                          className={cn(
                            AUDIT_DOC_NEW_FILENAME_SPAN,
                            "text-primary",
                          )}
                        >
                          {doc.fileName || `Document ${index + 1}`}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {!canViewDocumentsFlag && (
                <p className="text-sm text-muted-foreground md:col-span-2">
                  Only super admin, admin, and manager can view uploaded documents.
                </p>
              )}

              {activeForm.newDocuments.length > 0 && (
                <div className="space-y-2 md:col-span-2">
                  <Label>New Documents</Label>
                  <div className="grid gap-2">
                    {activeForm.newDocuments.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className={AUDIT_DOC_ROW_DENSE}
                      >
                        <div className={AUDIT_DOC_ROW_LEFT_CLUSTER}>
                          <span
                            title={file.name}
                            className={AUDIT_DOC_NEW_FILENAME_SPAN}
                          >
                            {file.name}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className={AUDIT_DOC_ROW_ACTION_BTN}
                          onClick={() =>
                            removeNewDocument(activeForm.localId, index)
                          }
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 md:col-span-2">
                <Button
                  variant="outline"
                  onClick={() => handleCancel(activeForm)}
                  disabled={saving}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>

                <Button
                  onClick={() => handleSave(activeForm)}
                  disabled={saving}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete DG set?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <strong>{deleteTarget?.dg_number || "this DG set"}</strong> and
              related audit data. This action cannot be undone.
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
    </div>
  );
}

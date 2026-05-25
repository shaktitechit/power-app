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
import { useRouter } from "next/navigation";
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
  useCreateSolarPlantMutation,
  useDeleteSolarPlantMutation,
  useGetSolarPlantsQuery,
  useUpdateSolarPlantMutation,
  type SolarPlant,
  type SolarPlantDocument,
} from "@/store/slices/electrical-audit/solarPlantApiSlice";
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

interface SolarPlantSectionProps {
  utilityAccountId: string;
  facilityId: string;
  /** e.g. `/facility/electrical-energy-audit/{facilityId}` */
  facilityPathPrefix: string;
  auditStepLocked?: boolean;
}

type SolarPlantFormState = {
  id?: string;
  localId: string;
  isNew: boolean;
  isEditing: boolean;

  plant_name: string;
  rating_kWp: string;
  panel_rating_watt: string;
  no_of_panels: string;
  inverter_make: string;
  inverter_rating_kW: string;

  existingDocuments: SolarPlantDocument[];
  newDocuments: File[];
};

const createEmptyForm = (): SolarPlantFormState => ({
  localId: `new-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  isNew: true,
  isEditing: true,

  plant_name: "",
  rating_kWp: "",
  panel_rating_watt: "",
  no_of_panels: "",
  inverter_make: "",
  inverter_rating_kW: "",

  existingDocuments: [],
  newDocuments: [],
});

function toDateInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
}

function plantToForm(plant: SolarPlant): SolarPlantFormState {
  return {
    id: plant._id,
    localId: plant._id,
    isNew: false,
    isEditing: false,

    plant_name: plant.plant_name || "",
    rating_kWp: plant.rating_kWp?.toString() || "",
    panel_rating_watt: plant.panel_rating_watt?.toString() || "",
    no_of_panels: plant.no_of_panels?.toString() || "",
    inverter_make: plant.inverter_make || "",
    inverter_rating_kW: plant.inverter_rating_kW?.toString() || "",

    existingDocuments: plant.documents || [],
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
  return "Failed to save solar plant";
};

export function SolarPlantSection({
  utilityAccountId,
  facilityId,
  facilityPathPrefix,
  auditStepLocked = false,
}: SolarPlantSectionProps) {
  const user = useAppSelector((state) => state.auth.user);
  const canDeleteRecords =
    user?.role === "super_admin" || user?.role === "admin";
  const canViewDocumentsFlag = canViewDocuments(
    user?.role,
    (user?.permissions as UserPermission[]) || [],
  );
  const router = useRouter();
  const { data, isLoading } = useGetSolarPlantsQuery({
    utility_account_id: utilityAccountId,
  });

  const [createSolarPlant, { isLoading: isCreating }] =
    useCreateSolarPlantMutation();

  const [updateSolarPlant, { isLoading: isUpdating }] =
    useUpdateSolarPlantMutation();
  const [deleteSolarPlant, { isLoading: isDeleting }] =
    useDeleteSolarPlantMutation();

  const solarPlants = useMemo(() => data?.data || [], [data]);
  const [forms, setForms] = useState<SolarPlantFormState[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeFormLocalId, setActiveFormLocalId] = useState<string | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<SolarPlantFormState | null>(
    null,
  );

  useEffect(() => {
    const mapped = solarPlants.map(plantToForm);
    setForms((prev) => {
      const unsavedForms = prev.filter((item) => item.isNew);
      return [...unsavedForms, ...mapped];
    });
  }, [solarPlants]);

  const activeForm =
    forms.find((form) => form.localId === activeFormLocalId) || null;

  const updateForm = (
    localId: string,
    key: keyof SolarPlantFormState,
    value: string | File[],
  ) => {
    setForms((prev) =>
      prev.map((form) =>
        form.localId === localId ? { ...form, [key]: value } : form,
      ),
    );
  };

  const replaceForm = (localId: string, nextForm: SolarPlantFormState) => {
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

  const handleCancel = (form: SolarPlantFormState) => {
    setErrorMessage("");

    if (form.isNew) {
      removeForm(form.localId);
      setDialogOpen(false);
      setActiveFormLocalId(null);
      return;
    }

    const original = solarPlants.find((item) => item._id === form.id);
    if (!original) return;

    replaceForm(form.localId, plantToForm(original));
    setDialogOpen(false);
    setActiveFormLocalId(null);
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open && activeForm) {
      if (activeForm.isNew) {
        removeForm(activeForm.localId);
      } else {
        const original = solarPlants.find((item) => item._id === activeForm.id);
        if (original) {
          replaceForm(activeForm.localId, plantToForm(original));
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

  const handleSave = async (form: SolarPlantFormState) => {
    setErrorMessage("");

    const payload: any = {
      facility_id: facilityId,
      utility_account_id: utilityAccountId,
    };

    if (form.plant_name.trim()) payload.plant_name = form.plant_name.trim();

    const rating_kWp = toNumber(form.rating_kWp);
    if (rating_kWp !== undefined) payload.rating_kWp = rating_kWp;

    const panel_rating_watt = toNumber(form.panel_rating_watt);
    if (panel_rating_watt !== undefined) {
      payload.panel_rating_watt = panel_rating_watt;
    }

    const no_of_panels = toNumber(form.no_of_panels);
    if (no_of_panels !== undefined) payload.no_of_panels = no_of_panels;

    if (form.inverter_make.trim()) {
      payload.inverter_make = form.inverter_make.trim();
    }

    const inverter_rating_kW = toNumber(form.inverter_rating_kW);
    if (inverter_rating_kW !== undefined) {
      payload.inverter_rating_kW = inverter_rating_kW;
    }

    if (form.newDocuments.length > 0) {
      payload.documents = form.newDocuments;
    }

    try {
      await toastHandler({
        action: () => {
          if (form.isNew) {
            return createSolarPlant(payload).unwrap();
          }

          if (form.id) {
            return updateSolarPlant({
              id: form.id,
              ...payload,
            }).unwrap();
          }

          return Promise.reject(new Error("Solar plant ID is missing."));
        },
        loading: form.isNew
          ? "Creating solar plant..."
          : "Updating solar plant...",
        success: form.isNew
          ? "Solar plant created successfully"
          : "Solar plant updated successfully",
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
        action: () => deleteSolarPlant(deleteTarget.id as string).unwrap(),
        loading: "Deleting solar plant...",
        success: "Solar plant deleted successfully",
      });
      setDeleteTarget(null);
    } catch (error) {
      console.error("Failed to delete solar plant:", error);
    }
  };

  const saving = isCreating || isUpdating || isDeleting;

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground">
        Loading solar plants...
      </div>
    );
  }

  return (
    <div className="relative space-y-4">
      <div className="relative">
        <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <h3 className="text-lg font-medium text-foreground">Solar Plants</h3>
          <AuditStepSubmitBar
            variant="compact"
            utilityAccountId={utilityAccountId}
            stepId={UTILITY_AUDIT_STEP_IDS.SOLAR}
            stepLabel="Solar audit"
            auditStepLocked={auditStepLocked}
          />
        </div>

        <Button
          onClick={handleOpenCreate}
          className={cnHideUtilityAuditEdits(auditStepLocked)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Solar Plant
        </Button>
      </div>

      {errorMessage ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      {solarPlants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Solar Plant Table</CardTitle>
          </CardHeader>

          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="px-3 py-2 font-medium">Plant Name</th>
                  <th className="px-3 py-2 font-medium">Rating (kWp)</th>
                  <th className="px-3 py-2 font-medium">Panel Watt</th>
                  <th className="px-3 py-2 font-medium">No. of Panels</th>
                  <th className="px-3 py-2 font-medium">Inverter Make</th>
                  <th className="px-3 py-2 font-medium">Inverter Rating</th>
                  <th className="px-3 py-2 font-medium">Documents</th>
                  <th className="px-3 py-2 font-medium">Action</th>
                </tr>
              </thead>

              <tbody>
                {forms
                  .filter((form) => !form.isNew)
                  .map((form) => (
                    <tr key={form.localId} className="border-b align-top">
                      <td className="px-3 py-2">{form.plant_name || "-"}</td>
                      <td className="px-3 py-2">{form.rating_kWp || "-"}</td>
                      <td className="px-3 py-2">
                        {form.panel_rating_watt || "-"}
                      </td>
                      <td className="px-3 py-2">{form.no_of_panels || "-"}</td>
                      <td className="px-3 py-2">{form.inverter_make || "-"}</td>
                      <td className="px-3 py-2">
                        {form.inverter_rating_kW || "-"}
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
                                `${facilityPathPrefix}/utility-account/${utilityAccountId}/solar-audit/${form.id}`,
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
            No solar plants found. Click{" "}
            <span className="font-medium">Create Solar Plant</span> to add one.
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {activeForm?.isNew ? "New Solar Plant" : "Edit Solar Plant"}
            </DialogTitle>
          </DialogHeader>

          {activeForm ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`plant_name-${activeForm.localId}`}>
                  Plant Name
                </Label>
                <Input
                  id={`plant_name-${activeForm.localId}`}
                  value={activeForm.plant_name}
                  onChange={(e) =>
                    updateForm(activeForm.localId, "plant_name", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`rating_kWp-${activeForm.localId}`}>
                  Rating (kWp)
                </Label>
                <Input
                  id={`rating_kWp-${activeForm.localId}`}
                  type="number"
                  value={activeForm.rating_kWp}
                  onChange={(e) =>
                    updateForm(activeForm.localId, "rating_kWp", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`panel_rating_watt-${activeForm.localId}`}>
                  Panel Rating (Watt)
                </Label>
                <Input
                  id={`panel_rating_watt-${activeForm.localId}`}
                  type="number"
                  value={activeForm.panel_rating_watt}
                  onChange={(e) =>
                    updateForm(
                      activeForm.localId,
                      "panel_rating_watt",
                      e.target.value,
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`no_of_panels-${activeForm.localId}`}>
                  No. of Panels
                </Label>
                <Input
                  id={`no_of_panels-${activeForm.localId}`}
                  type="number"
                  value={activeForm.no_of_panels}
                  onChange={(e) =>
                    updateForm(
                      activeForm.localId,
                      "no_of_panels",
                      e.target.value,
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`inverter_make-${activeForm.localId}`}>
                  Inverter Make
                </Label>
                <Input
                  id={`inverter_make-${activeForm.localId}`}
                  value={activeForm.inverter_make}
                  onChange={(e) =>
                    updateForm(
                      activeForm.localId,
                      "inverter_make",
                      e.target.value,
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`inverter_rating_kW-${activeForm.localId}`}>
                  Inverter Rating (kW)
                </Label>
                <Input
                  id={`inverter_rating_kW-${activeForm.localId}`}
                  type="number"
                  value={activeForm.inverter_rating_kW}
                  onChange={(e) =>
                    updateForm(
                      activeForm.localId,
                      "inverter_rating_kW",
                      e.target.value,
                    )
                  }
                />
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
            <AlertDialogTitle>Delete solar plant?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <strong>{deleteTarget?.plant_name || "this solar plant"}</strong> and
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

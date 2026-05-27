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
  Trash2,
  ArrowRight,
  Droplet,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetPumpAuditRecordsQuery } from "@/store/slices/electrical-audit/pumpAuditRecordApiSlice";
import {
  useCreatePumpMutation,
  useDeletePumpMutation,
  useGetPumpsQuery,
  useUpdatePumpMutation,
  type Pump,
  type PumpDocument,
} from "@/store/slices/electrical-audit/pumpApiSlice";
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

interface PumpSectionProps {
  utilityAccountId: string;
  facilityId: string;
  facilityPathPrefix: string;
  auditStepLocked?: boolean;
}

type PumpFormState = {
  id?: string;
  localId: string;
  isNew: boolean;
  isEditing: boolean;

  pump_tag_number: string;
  make_model: string;
  rated_power_kW_or_HP: string;
  rated_flow_m3_per_hr: string;
  rated_head_m: string;
  rated_speed_RPM: string;
  number_of_stages: string;
  year_of_installation: string;

  existingDocuments: PumpDocument[];
  newDocuments: File[];
};

const createEmptyForm = (): PumpFormState => ({
  localId: `new-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  isNew: true,
  isEditing: true,

  pump_tag_number: "",
  make_model: "",
  rated_power_kW_or_HP: "",
  rated_flow_m3_per_hr: "",
  rated_head_m: "",
  rated_speed_RPM: "",
  number_of_stages: "",
  year_of_installation: "",

  existingDocuments: [],
  newDocuments: [],
});

function toDateInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
}

function pumpToForm(pump: Pump): PumpFormState {
  return {
    id: pump._id,
    localId: pump._id,
    isNew: false,
    isEditing: false,

    pump_tag_number: pump.pump_tag_number || "",
    make_model: pump.make_model || "",
    rated_power_kW_or_HP: pump.rated_power_kW_or_HP?.toString() || "",
    rated_flow_m3_per_hr: pump.rated_flow_m3_per_hr?.toString() || "",
    rated_head_m: pump.rated_head_m?.toString() || "",
    rated_speed_RPM: pump.rated_speed_RPM?.toString() || "",
    number_of_stages: pump.number_of_stages?.toString() || "",
    year_of_installation: pump.year_of_installation?.toString() || "",

    existingDocuments: pump.documents || [],
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
  return "Failed to save pump";
};

export function PumpSection({
  utilityAccountId,
  facilityId,
  facilityPathPrefix,
  auditStepLocked = false,
}: PumpSectionProps) {
  const user = useAppSelector((state) => state.auth.user);
  const canDeleteRecords =
    user?.role === "super_admin" || user?.role === "admin";
  const canViewDocumentsFlag = canViewDocuments(
    user?.role,
    (user?.permissions as UserPermission[]) || [],
  );
  const router = useRouter();
  const { data, isLoading } = useGetPumpsQuery({
    utility_account_id: utilityAccountId,
  });
  const { data: auditData, isLoading: isAuditLoading } = useGetPumpAuditRecordsQuery({
    utility_account_id: utilityAccountId,
  });

  const [createPump, { isLoading: isCreating }] = useCreatePumpMutation();
  const [updatePump, { isLoading: isUpdating }] = useUpdatePumpMutation();
  const [deletePump, { isLoading: isDeleting }] = useDeletePumpMutation();

  const pumps = useMemo(() => data?.data || [], [data]);
  const pumpAuditRecords = useMemo(() => auditData?.data || [], [auditData]);
  const isLoadingAll = isLoading || isAuditLoading;
  const [forms, setForms] = useState<PumpFormState[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeFormLocalId, setActiveFormLocalId] = useState<string | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<PumpFormState | null>(null);

  useEffect(() => {
    const mapped = pumps.map(pumpToForm);
    setForms((prev) => {
      const unsavedForms = prev.filter((item) => item.isNew);
      return [...unsavedForms, ...mapped];
    });
  }, [pumps]);

  const activeForm =
    forms.find((form) => form.localId === activeFormLocalId) || null;

  const updateForm = (
    localId: string,
    key: keyof PumpFormState,
    value: string | File[],
  ) => {
    setForms((prev) =>
      prev.map((form) =>
        form.localId === localId ? { ...form, [key]: value } : form,
      ),
    );
  };

  const replaceForm = (localId: string, nextForm: PumpFormState) => {
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

  const handleCancel = (form: PumpFormState) => {
    setErrorMessage("");

    if (form.isNew) {
      removeForm(form.localId);
      setDialogOpen(false);
      setActiveFormLocalId(null);
      return;
    }

    const original = pumps.find((item) => item._id === form.id);
    if (!original) return;

    replaceForm(form.localId, pumpToForm(original));
    setDialogOpen(false);
    setActiveFormLocalId(null);
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open && activeForm) {
      if (activeForm.isNew) {
        removeForm(activeForm.localId);
      } else {
        const original = pumps.find((item) => item._id === activeForm.id);
        if (original) {
          replaceForm(activeForm.localId, pumpToForm(original));
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

  const handleSave = async (form: PumpFormState) => {
    setErrorMessage("");

    if (!form.pump_tag_number.trim()) {
      setErrorMessage("Pump Tag Number is required");
      return;
    }

    const payload: any = {
      facility_id: facilityId,
      utility_account_id: utilityAccountId,
      pump_tag_number: form.pump_tag_number.trim(),
    };

    if (form.make_model.trim()) {
      payload.make_model = form.make_model.trim();
    }

    const rated_power_kW_or_HP = toNumber(form.rated_power_kW_or_HP);
    if (rated_power_kW_or_HP !== undefined) {
      payload.rated_power_kW_or_HP = rated_power_kW_or_HP;
    }

    const rated_flow_m3_per_hr = toNumber(form.rated_flow_m3_per_hr);
    if (rated_flow_m3_per_hr !== undefined) {
      payload.rated_flow_m3_per_hr = rated_flow_m3_per_hr;
    }

    const rated_head_m = toNumber(form.rated_head_m);
    if (rated_head_m !== undefined) {
      payload.rated_head_m = rated_head_m;
    }

    const rated_speed_RPM = toNumber(form.rated_speed_RPM);
    if (rated_speed_RPM !== undefined) {
      payload.rated_speed_RPM = rated_speed_RPM;
    }

    const number_of_stages = toNumber(form.number_of_stages);
    if (number_of_stages !== undefined) {
      payload.number_of_stages = number_of_stages;
    }

    const year_of_installation = toNumber(form.year_of_installation);
    if (year_of_installation !== undefined) {
      payload.year_of_installation = year_of_installation;
    }

    if (form.newDocuments.length > 0) {
      payload.documents = form.newDocuments;
    }

    try {
      await toastHandler({
        action: () => {
          if (form.isNew) {
            return createPump(payload).unwrap();
          }

          if (form.id) {
            return updatePump({
              id: form.id,
              ...payload,
            }).unwrap();
          }

          return Promise.reject(new Error("Pump ID is missing."));
        },
        loading: form.isNew ? "Creating pump..." : "Updating pump...",
        success: form.isNew
          ? "Pump created successfully"
          : "Pump updated successfully",
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
        action: () => deletePump(deleteTarget.id as string).unwrap(),
        loading: "Deleting pump...",
        success: "Pump deleted successfully",
      });
      setDeleteTarget(null);
    } catch (error) {
      console.error("Failed to delete pump:", error);
    }
  };

  const saving = isCreating || isUpdating || isDeleting;

  if (isLoadingAll) {
    return (
      <div className="space-y-3 animate-pulse">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="w-full p-4 border border-border bg-card rounded-xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 w-full max-w-md">
                <Skeleton className="h-10 w-10 rounded-lg shrink-0 bg-muted" />
                <div className="space-y-2 w-full">
                  <Skeleton className="h-4 w-1/3 bg-muted" />
                  <Skeleton className="h-3.5 w-1/2 bg-muted" />
                </div>
              </div>
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <Skeleton className="h-8 w-24 bg-muted" />
                <Skeleton className="h-8 w-24 bg-muted" />
                <Skeleton className="h-8 w-16 bg-muted" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  const activeForms = forms.filter((form) => !form.isNew);

  return (
    <div className="relative space-y-4">
      <div className="relative">
        <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <h3 className="text-lg font-medium text-foreground">Pumps</h3>
          <AuditStepSubmitBar
            variant="compact"
            utilityAccountId={utilityAccountId}
            stepId={UTILITY_AUDIT_STEP_IDS.PUMP}
            stepLabel="Pump audit"
            auditStepLocked={auditStepLocked}
          />
        </div>

        <Button
          onClick={handleOpenCreate}
          className={cnHideUtilityAuditEdits(auditStepLocked)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Pump
        </Button>
      </div>

      {errorMessage ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      {activeForms.length > 0 && (
        <div className="space-y-3">
          {activeForms.map((form) => {
            const isAudited = pumpAuditRecords.some((rec) => {
              const pumpId =
                typeof rec.pump_id === "object" && rec.pump_id
                  ? (rec.pump_id as any)._id
                  : rec.pump_id;
              return pumpId === form.id;
            });
            return (
              <Card
                key={form.localId}
                className={cn(
                  "group w-full p-4 border border-border bg-card rounded-xl hover:shadow-md transition-all duration-200 border-l-4 cursor-pointer",
                  isAudited
                    ? "border-l-emerald-500 hover:border-l-emerald-600"
                    : "border-l-amber-500 hover:border-l-amber-600"
                )}
                onClick={() => {
                  if (form.id) {
                    router.push(
                      `${facilityPathPrefix}/utility-account/${utilityAccountId}/pump-audit/${form.id}`
                    );
                  }
                }}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between min-w-0">
                  
                  {/* Left section: Icon + Tag + power + make/model */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Droplet className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground truncate max-w-[200px]" title={form.pump_tag_number}>
                          {form.pump_tag_number || "-"}
                        </span>
                        {form.rated_power_kW_or_HP && (
                          <span className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-foreground">
                            {form.rated_power_kW_or_HP} kW/HP
                          </span>
                        )}
                        {form.make_model && (
                          <span className="rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] text-muted-foreground truncate block max-w-[120px]" title={form.make_model}>
                            {form.make_model}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Middle section: Tech Specs */}
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 lg:justify-center text-xs text-muted-foreground min-w-0 flex-1 col-span-2">
                    {form.rated_flow_m3_per_hr && (
                      <div className="min-w-[100px]">
                        <span className="block text-[10px] text-muted-foreground/75 uppercase">Rated Flow</span>
                        <span className="font-medium text-foreground text-sm">{form.rated_flow_m3_per_hr} m³/hr</span>
                      </div>
                    )}
                    {form.rated_head_m && (
                      <div className="min-w-[100px]">
                        <span className="block text-[10px] text-muted-foreground/75 uppercase">Rated Head</span>
                        <span className="font-medium text-foreground text-sm">{form.rated_head_m} m</span>
                      </div>
                    )}
                    {form.rated_speed_RPM && (
                      <div className="min-w-[100px]">
                        <span className="block text-[10px] text-muted-foreground/75 uppercase">Rated Speed</span>
                        <span className="font-medium text-foreground text-sm">{form.rated_speed_RPM} RPM</span>
                      </div>
                    )}
                    {(form.number_of_stages || form.year_of_installation) && (
                      <div className="min-w-[100px]">
                        <span className="block text-[10px] text-muted-foreground/75 uppercase">Stages / Year</span>
                        <span className="font-medium text-foreground text-sm">
                          {form.number_of_stages ? `${form.number_of_stages} stages` : "—"} / {form.year_of_installation ? form.year_of_installation : "—"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right section: Status & Actions */}
                  <div className="flex flex-wrap lg:flex-nowrap items-center gap-4 lg:gap-6 shrink-0 justify-between lg:justify-end w-full lg:w-auto pt-3 lg:pt-0 border-t lg:border-t-0 border-muted/20">
                    
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          isAudited
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                        }`}
                      >
                        {isAudited ? "Completed" : "Pending"}
                      </span>

                      <div className="flex items-center gap-2">
                        {/* Edit Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(form.localId);
                          }}
                          className={cnHideUtilityAuditEdits(auditStepLocked, "h-8 px-2")}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        
                        {/* Delete Button */}
                        {canDeleteRecords && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(form);
                            }}
                            disabled={saving}
                            className={cnHideUtilityAuditEdits(auditStepLocked, "h-8 px-2")}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}

                        {/* Audit Button */}
                        <Button
                          size="sm"
                          disabled={!form.id}
                          className="bg-warning text-warning-foreground hover:bg-warning/90 h-8 px-3 font-medium flex items-center gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (form.id) {
                              router.push(
                                `${facilityPathPrefix}/utility-account/${utilityAccountId}/pump-audit/${form.id}`
                              );
                            }
                          }}
                        >
                          <span>Audit</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                  </div>

                </div>
              </Card>
            );
          })}
        </div>
      )}

      {activeForms.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No pumps found. Click{" "}
            <span className="font-medium text-foreground">Create Pump</span> to add one.
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>
              {activeForm?.isNew ? "New Pump" : "Edit Pump"}
            </DialogTitle>
          </DialogHeader>

          {activeForm ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`pump_tag_number-${activeForm.localId}`}>
                  Pump Tag Number *
                </Label>
                <Input
                  id={`pump_tag_number-${activeForm.localId}`}
                  value={activeForm.pump_tag_number}
                  onChange={(e) =>
                    updateForm(
                      activeForm.localId,
                      "pump_tag_number",
                      e.target.value,
                    )
                  }
                  placeholder="Enter pump tag number"
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
                  placeholder="Enter make/model"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`rated_power_kW_or_HP-${activeForm.localId}`}>
                  Rated Power (kW / HP)
                </Label>
                <Input
                  id={`rated_power_kW_or_HP-${activeForm.localId}`}
                  type="number"
                  value={activeForm.rated_power_kW_or_HP}
                  onChange={(e) =>
                    updateForm(
                      activeForm.localId,
                      "rated_power_kW_or_HP",
                      e.target.value,
                    )
                  }
                  placeholder="Enter rated power"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`rated_flow_m3_per_hr-${activeForm.localId}`}>
                  Rated Flow (m³/hr)
                </Label>
                <Input
                  id={`rated_flow_m3_per_hr-${activeForm.localId}`}
                  type="number"
                  value={activeForm.rated_flow_m3_per_hr}
                  onChange={(e) =>
                    updateForm(
                      activeForm.localId,
                      "rated_flow_m3_per_hr",
                      e.target.value,
                    )
                  }
                  placeholder="Enter rated flow"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`rated_head_m-${activeForm.localId}`}>
                  Rated Head (m)
                </Label>
                <Input
                  id={`rated_head_m-${activeForm.localId}`}
                  type="number"
                  value={activeForm.rated_head_m}
                  onChange={(e) =>
                    updateForm(
                      activeForm.localId,
                      "rated_head_m",
                      e.target.value,
                    )
                  }
                  placeholder="Enter rated head"
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
                  placeholder="Enter rated speed"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`number_of_stages-${activeForm.localId}`}>
                  Number of Stages
                </Label>
                <Input
                  id={`number_of_stages-${activeForm.localId}`}
                  type="number"
                  value={activeForm.number_of_stages}
                  onChange={(e) =>
                    updateForm(
                      activeForm.localId,
                      "number_of_stages",
                      e.target.value,
                    )
                  }
                  placeholder="Enter number of stages"
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
                  placeholder="Enter installation year"
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
                  onChange={(e) =>
                    handleDocumentChange(activeForm.localId, e.target.files)
                  }
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
            <AlertDialogTitle>Delete pump?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <strong>{deleteTarget?.pump_tag_number || "this pump"}</strong> and
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

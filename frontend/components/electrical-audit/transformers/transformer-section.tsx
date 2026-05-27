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
  Cpu,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetTransformerAuditRecordsQuery } from "@/store/slices/electrical-audit/transformerAuditRecordApiSlice";
import {
  useCreateTransformerMutation,
  useDeleteTransformerMutation,
  useGetTransformersQuery,
  useUpdateTransformerMutation,
  type Transformer,
  type TransformerDocument,
} from "@/store/slices/electrical-audit/transformerApiSlice";
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

interface TransformerSectionProps {
  utilityAccountId: string;
  facilityId: string;
  facilityPathPrefix: string;
  auditStepLocked?: boolean;
}

type CoolingType = "ONAN" | "ONAF" | "OFWF" | "ODAF" | "dry";

type TransformerFormState = {
  id?: string;
  localId: string;
  isNew: boolean;
  isEditing: boolean;

  transformer_tag: string;
  rated_capacity_kVA: string;
  type_of_cooling: CoolingType;
  rated_HV_kV: string;
  rated_LV_V: string;
  rated_HV_current_A: string;
  rated_LV_current_A: string;
  no_load_loss_kW: string;
  full_load_loss_kW: string;
  nameplate_efficiency_percent: string;

  existingDocuments: TransformerDocument[];
  newDocuments: File[];
};

const createEmptyForm = (): TransformerFormState => ({
  localId: `new-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  isNew: true,
  isEditing: true,

  transformer_tag: "",
  rated_capacity_kVA: "",
  type_of_cooling: "ONAN",
  rated_HV_kV: "",
  rated_LV_V: "",
  rated_HV_current_A: "",
  rated_LV_current_A: "",
  no_load_loss_kW: "",
  full_load_loss_kW: "",
  nameplate_efficiency_percent: "",

  existingDocuments: [],
  newDocuments: [],
});

function toDateInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
}

function transformerToForm(transformer: Transformer): TransformerFormState {
  return {
    id: transformer._id,
    localId: transformer._id,
    isNew: false,
    isEditing: false,

    transformer_tag: transformer.transformer_tag || "",
    rated_capacity_kVA: transformer.rated_capacity_kVA?.toString() || "",
    type_of_cooling: transformer.type_of_cooling || "ONAN",
    rated_HV_kV: transformer.rated_HV_kV?.toString() || "",
    rated_LV_V: transformer.rated_LV_V?.toString() || "",
    rated_HV_current_A: transformer.rated_HV_current_A?.toString() || "",
    rated_LV_current_A: transformer.rated_LV_current_A?.toString() || "",
    no_load_loss_kW: transformer.no_load_loss_kW?.toString() || "",
    full_load_loss_kW: transformer.full_load_loss_kW?.toString() || "",
    nameplate_efficiency_percent:
      transformer.nameplate_efficiency_percent?.toString() || "",

    existingDocuments: transformer.documents || [],
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
  return "Failed to save transformer";
};

export function TransformerSection({
  utilityAccountId,
  facilityId,
  facilityPathPrefix,
  auditStepLocked = false,
}: TransformerSectionProps) {
  const user = useAppSelector((state) => state.auth.user);
  const canDeleteRecords =
    user?.role === "super_admin" || user?.role === "admin";
  const canViewDocumentsFlag = canViewDocuments(
    user?.role,
    (user?.permissions as UserPermission[]) || [],
  );
  const router = useRouter();
  const { data, isLoading } = useGetTransformersQuery({
    utility_account_id: utilityAccountId,
  });
  const { data: auditData, isLoading: isAuditLoading } = useGetTransformerAuditRecordsQuery({
    utility_account_id: utilityAccountId,
  });

  const [createTransformer, { isLoading: isCreating }] =
    useCreateTransformerMutation();
  const [updateTransformer, { isLoading: isUpdating }] =
    useUpdateTransformerMutation();
  const [deleteTransformer, { isLoading: isDeleting }] =
    useDeleteTransformerMutation();

  const transformers = useMemo(() => data?.data || [], [data]);
  const transformerAuditRecords = useMemo(() => auditData?.data || [], [auditData]);
  const isLoadingAll = isLoading || isAuditLoading;
  const [forms, setForms] = useState<TransformerFormState[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeFormLocalId, setActiveFormLocalId] = useState<string | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] =
    useState<TransformerFormState | null>(null);

  useEffect(() => {
    const mapped = transformers.map(transformerToForm);
    setForms((prev) => {
      const unsavedForms = prev.filter((item) => item.isNew);
      return [...unsavedForms, ...mapped];
    });
  }, [transformers]);

  const activeForm =
    forms.find((form) => form.localId === activeFormLocalId) || null;

  const updateForm = (
    localId: string,
    key: keyof TransformerFormState,
    value: string | File[],
  ) => {
    setForms((prev) =>
      prev.map((form) =>
        form.localId === localId ? { ...form, [key]: value } : form,
      ),
    );
  };

  const replaceForm = (localId: string, nextForm: TransformerFormState) => {
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

  const handleCancel = (form: TransformerFormState) => {
    setErrorMessage("");

    if (form.isNew) {
      removeForm(form.localId);
      setDialogOpen(false);
      setActiveFormLocalId(null);
      return;
    }

    const original = transformers.find((item) => item._id === form.id);
    if (!original) return;

    replaceForm(form.localId, transformerToForm(original));
    setDialogOpen(false);
    setActiveFormLocalId(null);
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open && activeForm) {
      if (activeForm.isNew) {
        removeForm(activeForm.localId);
      } else {
        const original = transformers.find(
          (item) => item._id === activeForm.id,
        );
        if (original) {
          replaceForm(activeForm.localId, transformerToForm(original));
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

  const handleSave = async (form: TransformerFormState) => {
    setErrorMessage("");

    if (!form.transformer_tag.trim()) {
      setErrorMessage("Transformer Tag is required");
      return;
    }

    const payload: any = {
      facility_id: facilityId,
      utility_account_id: utilityAccountId,
      transformer_tag: form.transformer_tag.trim(),
      type_of_cooling: form.type_of_cooling,
    };

    const rated_capacity_kVA = toNumber(form.rated_capacity_kVA);
    if (rated_capacity_kVA !== undefined) {
      payload.rated_capacity_kVA = rated_capacity_kVA;
    }

    const rated_HV_kV = toNumber(form.rated_HV_kV);
    if (rated_HV_kV !== undefined) {
      payload.rated_HV_kV = rated_HV_kV;
    }

    const rated_LV_V = toNumber(form.rated_LV_V);
    if (rated_LV_V !== undefined) {
      payload.rated_LV_V = rated_LV_V;
    }

    const rated_HV_current_A = toNumber(form.rated_HV_current_A);
    if (rated_HV_current_A !== undefined) {
      payload.rated_HV_current_A = rated_HV_current_A;
    }

    const rated_LV_current_A = toNumber(form.rated_LV_current_A);
    if (rated_LV_current_A !== undefined) {
      payload.rated_LV_current_A = rated_LV_current_A;
    }

    const no_load_loss_kW = toNumber(form.no_load_loss_kW);
    if (no_load_loss_kW !== undefined) {
      payload.no_load_loss_kW = no_load_loss_kW;
    }

    const full_load_loss_kW = toNumber(form.full_load_loss_kW);
    if (full_load_loss_kW !== undefined) {
      payload.full_load_loss_kW = full_load_loss_kW;
    }

    const nameplate_efficiency_percent = toNumber(
      form.nameplate_efficiency_percent,
    );
    if (nameplate_efficiency_percent !== undefined) {
      payload.nameplate_efficiency_percent = nameplate_efficiency_percent;
    }

    if (form.newDocuments.length > 0) {
      payload.documents = form.newDocuments;
    }

    try {
      await toastHandler({
        action: () => {
          if (form.isNew) {
            return createTransformer(payload).unwrap();
          }

          if (form.id) {
            return updateTransformer({
              id: form.id,
              ...payload,
            }).unwrap();
          }

          return Promise.reject(new Error("Transformer ID is missing."));
        },
        loading: form.isNew
          ? "Creating transformer..."
          : "Updating transformer...",
        success: form.isNew
          ? "Transformer created successfully"
          : "Transformer updated successfully",
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
        action: () => deleteTransformer(deleteTarget.id as string).unwrap(),
        loading: "Deleting transformer...",
        success: "Transformer deleted successfully",
      });
      setDeleteTarget(null);
    } catch (error) {
      console.error("Failed to delete transformer:", error);
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
          <h3 className="text-lg font-medium text-foreground">Transformers</h3>
          <AuditStepSubmitBar
            variant="compact"
            utilityAccountId={utilityAccountId}
            stepId={UTILITY_AUDIT_STEP_IDS.TRANSFORMER}
            stepLabel="Transformer audit"
            auditStepLocked={auditStepLocked}
          />
        </div>

        <Button
          onClick={handleOpenCreate}
          className={cnHideUtilityAuditEdits(auditStepLocked)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Transformer
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
            const isAudited = transformerAuditRecords.some((rec) => {
              const transId =
                typeof rec.transformer_id === "object" && rec.transformer_id
                  ? (rec.transformer_id as any)._id
                  : rec.transformer_id;
              return transId === form.id;
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
                      `${facilityPathPrefix}/utility-account/${utilityAccountId}/transformer-audit/${form.id}`
                    );
                  }
                }}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between min-w-0">
                  
                  {/* Left section: Icon + Tag + capacity + cooling type */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Cpu className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground truncate max-w-[200px]" title={form.transformer_tag}>
                          {form.transformer_tag || "-"}
                        </span>
                        {form.rated_capacity_kVA && (
                          <span className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-foreground">
                            {form.rated_capacity_kVA} kVA
                          </span>
                        )}
                        {form.type_of_cooling && (
                          <span className="rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] text-muted-foreground uppercase">
                            {form.type_of_cooling}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Middle section: Tech Specs */}
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 lg:justify-center text-xs text-muted-foreground min-w-0 flex-1 col-span-2">
                    {(form.rated_HV_kV || form.rated_LV_V) && (
                      <div className="min-w-[100px]">
                        <span className="block text-[10px] text-muted-foreground/75 uppercase">HV / LV Rating</span>
                        <span className="font-medium text-foreground text-sm">
                          {form.rated_HV_kV ? `${form.rated_HV_kV} kV` : "—"} / {form.rated_LV_V ? `${form.rated_LV_V} V` : "—"}
                        </span>
                      </div>
                    )}
                    {(form.rated_HV_current_A || form.rated_LV_current_A) && (
                      <div className="min-w-[100px]">
                        <span className="block text-[10px] text-muted-foreground/75 uppercase">HV / LV Current</span>
                        <span className="font-medium text-foreground text-sm">
                          {form.rated_HV_current_A ? `${form.rated_HV_current_A} A` : "—"} / {form.rated_LV_current_A ? `${form.rated_LV_current_A} A` : "—"}
                        </span>
                      </div>
                    )}
                    {(form.no_load_loss_kW || form.full_load_loss_kW) && (
                      <div className="min-w-[100px]">
                        <span className="block text-[10px] text-muted-foreground/75 uppercase">Losses (NL / FL)</span>
                        <span className="font-medium text-foreground text-sm">
                          {form.no_load_loss_kW ? `${form.no_load_loss_kW} kW` : "—"} / {form.full_load_loss_kW ? `${form.full_load_loss_kW} kW` : "—"}
                        </span>
                      </div>
                    )}
                    {form.nameplate_efficiency_percent && (
                      <div className="min-w-[100px]">
                        <span className="block text-[10px] text-muted-foreground/75 uppercase">Efficiency</span>
                        <span className="font-medium text-foreground text-sm">{form.nameplate_efficiency_percent}%</span>
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
                                `${facilityPathPrefix}/utility-account/${utilityAccountId}/transformer-audit/${form.id}`
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
            No transformers found. Click{" "}
            <span className="font-medium text-foreground">Create Transformer</span> to add one.
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>
              {activeForm?.isNew ? "New Transformer" : "Edit Transformer"}
            </DialogTitle>
          </DialogHeader>

          {activeForm ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`transformer_tag-${activeForm.localId}`}>
                  Transformer Tag *
                </Label>
                <Input
                  id={`transformer_tag-${activeForm.localId}`}
                  value={activeForm.transformer_tag}
                  onChange={(e) =>
                    updateForm(
                      activeForm.localId,
                      "transformer_tag",
                      e.target.value,
                    )
                  }
                  placeholder="Enter transformer tag"
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
                  placeholder="Enter rated capacity"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`type_of_cooling-${activeForm.localId}`}>
                  Type of Cooling
                </Label>
                <select
                  id={`type_of_cooling-${activeForm.localId}`}
                  value={activeForm.type_of_cooling}
                  onChange={(e) =>
                    updateForm(
                      activeForm.localId,
                      "type_of_cooling",
                      e.target.value as CoolingType,
                    )
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="ONAN">ONAN</option>
                  <option value="ONAF">ONAF</option>
                  <option value="OFWF">OFWF</option>
                  <option value="ODAF">ODAF</option>
                  <option value="dry">Dry</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`rated_HV_kV-${activeForm.localId}`}>
                  Rated HV (kV)
                </Label>
                <Input
                  id={`rated_HV_kV-${activeForm.localId}`}
                  type="number"
                  value={activeForm.rated_HV_kV}
                  onChange={(e) =>
                    updateForm(
                      activeForm.localId,
                      "rated_HV_kV",
                      e.target.value,
                    )
                  }
                  placeholder="Enter HV kV"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`rated_LV_V-${activeForm.localId}`}>
                  Rated LV (V)
                </Label>
                <Input
                  id={`rated_LV_V-${activeForm.localId}`}
                  type="number"
                  value={activeForm.rated_LV_V}
                  onChange={(e) =>
                    updateForm(activeForm.localId, "rated_LV_V", e.target.value)
                  }
                  placeholder="Enter LV V"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`rated_HV_current_A-${activeForm.localId}`}>
                  Rated HV Current (A)
                </Label>
                <Input
                  id={`rated_HV_current_A-${activeForm.localId}`}
                  type="number"
                  value={activeForm.rated_HV_current_A}
                  onChange={(e) =>
                    updateForm(
                      activeForm.localId,
                      "rated_HV_current_A",
                      e.target.value,
                    )
                  }
                  placeholder="Enter HV current"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`rated_LV_current_A-${activeForm.localId}`}>
                  Rated LV Current (A)
                </Label>
                <Input
                  id={`rated_LV_current_A-${activeForm.localId}`}
                  type="number"
                  value={activeForm.rated_LV_current_A}
                  onChange={(e) =>
                    updateForm(
                      activeForm.localId,
                      "rated_LV_current_A",
                      e.target.value,
                    )
                  }
                  placeholder="Enter LV current"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`no_load_loss_kW-${activeForm.localId}`}>
                  No Load Loss (kW)
                </Label>
                <Input
                  id={`no_load_loss_kW-${activeForm.localId}`}
                  type="number"
                  value={activeForm.no_load_loss_kW}
                  onChange={(e) =>
                    updateForm(
                      activeForm.localId,
                      "no_load_loss_kW",
                      e.target.value,
                    )
                  }
                  placeholder="Enter no load loss"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`full_load_loss_kW-${activeForm.localId}`}>
                  Full Load Loss (kW)
                </Label>
                <Input
                  id={`full_load_loss_kW-${activeForm.localId}`}
                  type="number"
                  value={activeForm.full_load_loss_kW}
                  onChange={(e) =>
                    updateForm(
                      activeForm.localId,
                      "full_load_loss_kW",
                      e.target.value,
                    )
                  }
                  placeholder="Enter full load loss"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={`nameplate_efficiency_percent-${activeForm.localId}`}
                >
                  Nameplate Efficiency (%)
                </Label>
                <Input
                  id={`nameplate_efficiency_percent-${activeForm.localId}`}
                  type="number"
                  value={activeForm.nameplate_efficiency_percent}
                  onChange={(e) =>
                    updateForm(
                      activeForm.localId,
                      "nameplate_efficiency_percent",
                      e.target.value,
                    )
                  }
                  placeholder="Enter efficiency percentage"
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
            <AlertDialogTitle>Delete transformer?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <strong>{deleteTarget?.transformer_tag || "this transformer"}</strong>
              {" "}and related audit data. This action cannot be undone.
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

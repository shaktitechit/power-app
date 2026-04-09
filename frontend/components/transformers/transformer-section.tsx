"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  useCreateTransformerMutation,
  useGetTransformersQuery,
  useUpdateTransformerMutation,
  type Transformer,
  type TransformerDocument,
} from "@/store/slices/transformerApiSlice";
import { useRouter } from "next/navigation";
import { toastHandler } from "@/lib/toast";
import { useAppSelector } from "@/store/hooks";

interface TransformerSectionProps {
  utilityAccountId: string;
  facilityId: string;
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
}: TransformerSectionProps) {
  const user = useAppSelector((state) => state.auth.user);
  const canViewDocuments = user?.role === "admin";
  const router = useRouter();
  const { data, isLoading, refetch } = useGetTransformersQuery({
    utility_account_id: utilityAccountId,
  });

  const [createTransformer, { isLoading: isCreating }] =
    useCreateTransformerMutation();
  const [updateTransformer, { isLoading: isUpdating }] =
    useUpdateTransformerMutation();

  const transformers = useMemo(() => data?.data || [], [data]);
  const [forms, setForms] = useState<TransformerFormState[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeFormLocalId, setActiveFormLocalId] = useState<string | null>(
    null,
  );

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

      await refetch();
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

  const saving = isCreating || isUpdating;

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground">
        Loading transformers...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-medium text-foreground">Transformers</h3>

        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Transformer
        </Button>
      </div>

      {errorMessage ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      {transformers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Transformer Table</CardTitle>
          </CardHeader>

          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[1600px] text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="px-3 py-2 font-medium">Transformer Tag</th>
                  <th className="px-3 py-2 font-medium">Capacity (kVA)</th>
                  <th className="px-3 py-2 font-medium">Cooling Type</th>
                  <th className="px-3 py-2 font-medium">HV (kV)</th>
                  <th className="px-3 py-2 font-medium">LV (V)</th>
                  <th className="px-3 py-2 font-medium">HV Current (A)</th>
                  <th className="px-3 py-2 font-medium">LV Current (A)</th>
                  <th className="px-3 py-2 font-medium">No Load Loss (kW)</th>
                  <th className="px-3 py-2 font-medium">Full Load Loss (kW)</th>
                  <th className="px-3 py-2 font-medium">Efficiency (%)</th>

                  <th className="px-3 py-2 font-medium">Documents</th>
                  <th className="px-3 py-2 font-medium">Action</th>
                </tr>
              </thead>

              <tbody>
                {forms
                  .filter((form) => !form.isNew)
                  .map((form) => (
                    <tr key={form.localId} className="border-b align-top">
                      <td className="px-3 py-2">
                        {form.transformer_tag || "-"}
                      </td>
                      <td className="px-3 py-2">
                        {form.rated_capacity_kVA || "-"}
                      </td>
                      <td className="px-3 py-2">
                        {form.type_of_cooling || "-"}
                      </td>
                      <td className="px-3 py-2">{form.rated_HV_kV || "-"}</td>
                      <td className="px-3 py-2">{form.rated_LV_V || "-"}</td>
                      <td className="px-3 py-2">
                        {form.rated_HV_current_A || "-"}
                      </td>
                      <td className="px-3 py-2">
                        {form.rated_LV_current_A || "-"}
                      </td>
                      <td className="px-3 py-2">
                        {form.no_load_loss_kW || "-"}
                      </td>
                      <td className="px-3 py-2">
                        {form.full_load_loss_kW || "-"}
                      </td>
                      <td className="px-3 py-2">
                        {form.nameplate_efficiency_percent || "-"}
                      </td>

                      <td className="px-3 py-2">
                        {form.existingDocuments.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {form.existingDocuments.map((doc, index) => (
                              <a
                                key={`${doc.fileUrl}-${index}`}
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary underline"
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
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Button>

                          {/* Audit Button */}
                          <Button
                            size="sm"
                            disabled={!form.id}
                            className="bg-warning text-warning-foreground hover:bg-warning/90"
                            onClick={() =>
                              router.push(
                                `/facility/${facilityId}/utility-account/${utilityAccountId}/transformer-audit/${form.id}`,
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
            No transformers found. Click{" "}
            <span className="font-medium">Create Transformer</span> to add one.
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

              {canViewDocuments && activeForm.existingDocuments.length > 0 && (
                <div className="space-y-2 md:col-span-2">
                  <Label>Existing Documents</Label>
                  <div className="grid gap-2">
                    {activeForm.existingDocuments.map((doc, index) => (
                      <a
                        key={`${doc.fileUrl}-${index}`}
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted/50"
                      >
                        {doc.fileType === "pdf" ? (
                          <FileText className="h-4 w-4" />
                        ) : (
                          <ImageIcon className="h-4 w-4" />
                        )}
                        <span>{doc.fileName || `Document ${index + 1}`}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {!canViewDocuments && (
                <p className="text-sm text-muted-foreground md:col-span-2">
                  Existing documents are visible to admin users only.
                </p>
              )}

              {activeForm.newDocuments.length > 0 && (
                <div className="space-y-2 md:col-span-2">
                  <Label>New Documents</Label>
                  <div className="grid gap-2">
                    {activeForm.newDocuments.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                      >
                        <span className="truncate">{file.name}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
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
    </div>
  );
}

"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Download,
  FileSpreadsheet,
  Pencil,
  Save,
  X,
  Upload,
  FileText,
  ImageIcon,
} from "lucide-react";
import {
  useCreateSolarGenerationRecordMutation,
  useGetSolarGenerationRecordsQuery,
  useUpdateSolarGenerationRecordMutation,
} from "@/store/slices/solarGenerationRecordApiSlice";
import { useGetUtilityBillingRecordsQuery } from "@/store/slices/utilityBillingRecordApiSlice";
import { toast } from "sonner";
import { toastHandler } from "@/lib/toast";
import {
  downloadSolarGenerationBulkTemplate,
  parseSolarGenerationExcelBulk,
  type SolarGenerationExcelEditablePayload,
} from "@/lib/solar-generation-record-excel";

interface SolarGenerationRecordSectionProps {
  facilityId: string;
  utilityAccountId: string;
  solarPlantId: string;
}

type ExistingDocument = {
  fileUrl: string;
  fileType: "image" | "pdf";
  fileName?: string;
  uploadedAt?: string;
};

type SolarGenerationFormState = {
  id?: string;
  localId: string;
  isNew: boolean;
  isEditing: boolean;

  billing_period_start: string;
  billing_period_end: string;
  billing_days: string;
  bill_no: string;

  import_kWh: string;
  import_kVAh: string;
  import_kVA: string;

  export_kWh: string;
  export_kVAh: string;
  export_kVA: string;

  net_kWh: string;
  net_kVAh: string;
  net_kVA: string;

  solar_generation_kWh: string;
  solar_generation_kVAh: string;
  solar_generation_kVA: string;

  documents: File[];
  existingDocuments: ExistingDocument[];
};

function toDateInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
}

const editableInputClass =
  "bg-white border border-gray-300 text-black focus:border-primary focus:ring-1 focus:ring-primary";

const autoInputClass =
  "bg-white border border-dashed border-gray-400 text-black cursor-not-allowed opacity-90";

const getInputClass = (disabled: boolean) =>
  disabled ? autoInputClass : editableInputClass;

const toNumber = (value: string) => {
  if (!value || value.trim() === "") return undefined;
  const num = Number(value);
  return Number.isNaN(num) ? undefined : num;
};

const calculateBillingDays = (start: string, end: string) => {
  if (!start || !end) return "";

  const startDate = new Date(start);
  const endDate = new Date(end);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return "";
  }

  const diffMs = endDate.getTime() - startDate.getTime();
  if (diffMs < 0) return "";

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  return String(diffDays);
};

const calculateNetValue = (importValue: string, exportValue: string) => {
  const importNum = toNumber(importValue);
  const exportNum = toNumber(exportValue);

  if (importNum === undefined && exportNum === undefined) return "";
  return String((importNum || 0) - (exportNum || 0));
};

const recalculateSolarForm = (
  form: SolarGenerationFormState,
): SolarGenerationFormState => {
  const updated = { ...form };
  updated.billing_days = calculateBillingDays(
    updated.billing_period_start,
    updated.billing_period_end,
  );
  updated.net_kWh = calculateNetValue(updated.import_kWh, updated.export_kWh);
  updated.net_kVAh = calculateNetValue(
    updated.import_kVAh,
    updated.export_kVAh,
  );
  updated.net_kVA = calculateNetValue(updated.import_kVA, updated.export_kVA);
  return updated;
};

function mergeBulkSolarImport(
  prev: SolarGenerationFormState[],
  rowPayloads: (Partial<SolarGenerationExcelEditablePayload> | null)[],
): { next: SolarGenerationFormState[]; updatedCount: number } {
  let updatedCount = 0;
  const next = prev.map((form, index) => {
    if (index >= rowPayloads.length) return form;
    const partial = rowPayloads[index];
    if (partial === null || Object.keys(partial).length === 0) return form;
    updatedCount += 1;
    return recalculateSolarForm({
      ...form,
      ...partial,
      isEditing: true,
    });
  });
  return { next, updatedCount };
}

function buildMatchKey(data: {
  billing_period_start?: string;
  billing_period_end?: string;
  bill_no?: string;
}) {
  return [
    toDateInput(data.billing_period_start),
    toDateInput(data.billing_period_end),
    (data.bill_no || "").trim().toLowerCase(),
  ].join("__");
}

/** When billing/solar refetches, keep in-progress edits on other cards. */
function mergeServerFormsWithLocalEdits(
  prev: SolarGenerationFormState[],
  mappedForms: SolarGenerationFormState[],
): SolarGenerationFormState[] {
  if (prev.length === 0) return mappedForms;

  const prevByKey = new Map(
    prev.map((f) => [buildMatchKey(f), f] as const),
  );

  return mappedForms.map((serverForm) => {
    const key = buildMatchKey(serverForm);
    const local = prevByKey.get(key);
    if (local?.isEditing) {
      return {
        ...local,
        billing_period_start: serverForm.billing_period_start,
        billing_period_end: serverForm.billing_period_end,
        billing_days: serverForm.billing_days,
        bill_no: serverForm.bill_no,
      };
    }
    return serverForm;
  });
}

function billingRecordToForm(
  billingRecord: any,
  existingSolarRecord?: any,
): SolarGenerationFormState {
  const billingStart = toDateInput(billingRecord.billing_period_start);
  const billingEnd = toDateInput(billingRecord.billing_period_end);
  const billingDays =
    billingRecord.billing_days?.toString() ||
    calculateBillingDays(billingStart, billingEnd);
  const billNo = billingRecord.bill_no || "";

  return {
    id: existingSolarRecord?._id,
    localId: existingSolarRecord?._id || `bill-${billingRecord._id}`,
    isNew: !existingSolarRecord,
    isEditing: !existingSolarRecord,

    billing_period_start: billingStart,
    billing_period_end: billingEnd,
    billing_days: billingDays,
    bill_no: billNo,

    import_kWh: existingSolarRecord?.import_kWh?.toString() || "",
    import_kVAh: existingSolarRecord?.import_kVAh?.toString() || "",
    import_kVA: existingSolarRecord?.import_kVA?.toString() || "",

    export_kWh: existingSolarRecord?.export_kWh?.toString() || "",
    export_kVAh: existingSolarRecord?.export_kVAh?.toString() || "",
    export_kVA: existingSolarRecord?.export_kVA?.toString() || "",

    net_kWh:
      existingSolarRecord?.net_kWh?.toString() ||
      calculateNetValue(
        existingSolarRecord?.import_kWh?.toString() || "",
        existingSolarRecord?.export_kWh?.toString() || "",
      ),
    net_kVAh:
      existingSolarRecord?.net_kVAh?.toString() ||
      calculateNetValue(
        existingSolarRecord?.import_kVAh?.toString() || "",
        existingSolarRecord?.export_kVAh?.toString() || "",
      ),
    net_kVA:
      existingSolarRecord?.net_kVA?.toString() ||
      calculateNetValue(
        existingSolarRecord?.import_kVA?.toString() || "",
        existingSolarRecord?.export_kVA?.toString() || "",
      ),

    solar_generation_kWh:
      existingSolarRecord?.solar_generation_kWh?.toString() || "",
    solar_generation_kVAh:
      existingSolarRecord?.solar_generation_kVAh?.toString() || "",
    solar_generation_kVA:
      existingSolarRecord?.solar_generation_kVA?.toString() || "",

    documents: [],
    existingDocuments: existingSolarRecord?.documents || [],
  };
}

export function SolarGenerationRecordSection({
  facilityId,
  utilityAccountId,
  solarPlantId,
}: SolarGenerationRecordSectionProps) {
  const {
    data: billingData,
    isLoading: isBillingLoading,
    refetch: refetchBillingRecords,
  } = useGetUtilityBillingRecordsQuery({
    facility_id: facilityId,
    utility_account_id: utilityAccountId,
  });

  const {
    data: solarData,
    isLoading: isSolarLoading,
    refetch: refetchSolarGenerationRecords,
  } = useGetSolarGenerationRecordsQuery({
    facility_id: facilityId,
    utility_account_id: utilityAccountId,
    solar_plant_id: solarPlantId,
  });

  const [createSolarGenerationRecord, { isLoading: isCreating }] =
    useCreateSolarGenerationRecordMutation();

  const [updateSolarGenerationRecord, { isLoading: isUpdating }] =
    useUpdateSolarGenerationRecordMutation();

  const utilityBillingRecords = useMemo(
    () => billingData?.data || [],
    [billingData],
  );

  const solarGenerationRecords = useMemo(
    () => solarData?.data || [],
    [solarData],
  );

  const [forms, setForms] = useState<SolarGenerationFormState[]>([]);
  const [excelImporting, setExcelImporting] = useState(false);
  const formsRef = useRef(forms);
  useEffect(() => {
    formsRef.current = forms;
  }, [forms]);

  useEffect(() => {
    const solarMap = new Map<string, any>();

    for (const solarRecord of solarGenerationRecords) {
      const key = buildMatchKey({
        billing_period_start: solarRecord.billing_period_start,
        billing_period_end: solarRecord.billing_period_end,
        bill_no: solarRecord.bill_no,
      });
      solarMap.set(key, solarRecord);
    }

    const mappedForms = [...utilityBillingRecords]
      .sort(
        (a, b) =>
          new Date(b.billing_period_start).getTime() -
          new Date(a.billing_period_start).getTime(),
      )
      .map((billingRecord) => {
        const key = buildMatchKey({
          billing_period_start: billingRecord.billing_period_start,
          billing_period_end: billingRecord.billing_period_end,
          bill_no: billingRecord.bill_no,
        });

        const matchedSolarRecord = solarMap.get(key);
        return billingRecordToForm(billingRecord, matchedSolarRecord);
      });

    setForms((prev) => mergeServerFormsWithLocalEdits(prev, mappedForms));
  }, [utilityBillingRecords, solarGenerationRecords]);

  const handleDownloadSolarTemplate = () => {
    downloadSolarGenerationBulkTemplate({
      recordCount: forms.length,
      billingRows: forms.map((f) => ({
        billing_period_start: f.billing_period_start,
        billing_period_end: f.billing_period_end,
        bill_no: f.bill_no,
      })),
    });
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
      const rowPayloads = await parseSolarGenerationExcelBulk(file);
      if (!rowPayloads.length) {
        toast.error(
          "No data rows found under the header. Fill the template and try again.",
          { id: "solar-generation-bulk-import" },
        );
        return;
      }

      const prev = formsRef.current;
      const { next, updatedCount } = mergeBulkSolarImport(prev, rowPayloads);

      if (updatedCount === 0) {
        toast.error(
          "No values found in Import / Export / Solar columns. Enter data and try again.",
          { id: "solar-generation-bulk-import" },
        );
        return;
      }

      setForms(next);

      if (rowPayloads.length > prev.length) {
        toast.success(
          `Imported ${updatedCount} row(s). Rows after record ${prev.length} were ignored.`,
          { id: "solar-generation-bulk-import" },
        );
      } else {
        toast.success(
          `Imported ${updatedCount} solar generation row(s). Review and save each card.`,
          { id: "solar-generation-bulk-import" },
        );
      }
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

  const updateForm = (
    localId: string,
    key: keyof SolarGenerationFormState,
    value: string,
  ) => {
    setForms((prev) =>
      prev.map((form) => {
        if (form.localId !== localId) return form;

        return recalculateSolarForm({ ...form, [key]: value });
      }),
    );
  };

  const replaceForm = (localId: string, nextForm: SolarGenerationFormState) => {
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

  const handleCancel = (form: SolarGenerationFormState) => {
    const matchedBillingRecord = utilityBillingRecords.find(
      (item: any) =>
        buildMatchKey({
          billing_period_start: item.billing_period_start,
          billing_period_end: item.billing_period_end,
          bill_no: item.bill_no,
        }) ===
        buildMatchKey({
          billing_period_start: form.billing_period_start,
          billing_period_end: form.billing_period_end,
          bill_no: form.bill_no,
        }),
    );

    const matchedSolarRecord = solarGenerationRecords.find(
      (item: any) =>
        buildMatchKey({
          billing_period_start: item.billing_period_start,
          billing_period_end: item.billing_period_end,
          bill_no: item.bill_no,
        }) ===
        buildMatchKey({
          billing_period_start: form.billing_period_start,
          billing_period_end: form.billing_period_end,
          bill_no: form.bill_no,
        }),
    );

    if (!matchedBillingRecord) return;

    replaceForm(
      form.localId,
      billingRecordToForm(matchedBillingRecord, matchedSolarRecord),
    );
  };

  const handleDocumentsChange = (localId: string, files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files);

    setForms((prev) =>
      prev.map((form) =>
        form.localId === localId
          ? {
              ...form,
              documents: [...form.documents, ...newFiles],
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
              documents: form.documents.filter((_, i) => i !== index),
            }
          : form,
      ),
    );
  };

  const handleSave = async (form: SolarGenerationFormState) => {
    const payload = {
      facility_id: facilityId,
      utility_account_id: utilityAccountId,
      solar_plant_id: solarPlantId,

      billing_period_start: form.billing_period_start,
      billing_period_end: form.billing_period_end,
      billing_days: form.billing_days || undefined,
      bill_no: form.bill_no || undefined,

      import_kWh: form.import_kWh || undefined,
      import_kVAh: form.import_kVAh || undefined,
      import_kVA: form.import_kVA || undefined,

      export_kWh: form.export_kWh || undefined,
      export_kVAh: form.export_kVAh || undefined,
      export_kVA: form.export_kVA || undefined,

      net_kWh: form.net_kWh || undefined,
      net_kVAh: form.net_kVAh || undefined,
      net_kVA: form.net_kVA || undefined,

      solar_generation_kWh: form.solar_generation_kWh || undefined,
      solar_generation_kVAh: form.solar_generation_kVAh || undefined,
      solar_generation_kVA: form.solar_generation_kVA || undefined,

      documents: form.documents.length ? form.documents : undefined,
    };

    try {
      await toastHandler({
        action: () => {
          if (form.isNew) {
            return createSolarGenerationRecord(payload).unwrap();
          }

          if (form.id) {
            return updateSolarGenerationRecord({
              id: form.id,
              ...payload,
            }).unwrap();
          }

          return Promise.reject(
            new Error("Solar generation record ID is missing."),
          );
        },
        loading: form.isNew
          ? "Creating solar generation record..."
          : "Updating solar generation record...",
        success: form.isNew
          ? "Solar generation record created successfully"
          : "Solar generation record updated successfully",
      });

      setForms((prev) =>
        prev.map((f) =>
          f.localId === form.localId ? { ...f, isEditing: false } : f,
        ),
      );

      await Promise.all([
        refetchSolarGenerationRecords(),
        refetchBillingRecords(),
      ]);
    } catch (error: any) {
      console.error("Failed to save solar generation record:", error);
    }
  };

  const saving = isCreating || isUpdating;
  const isLoading = isBillingLoading || isSolarLoading;

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground">
        Loading solar generation records...
      </div>
    );
  }

  if (forms.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Solar Generation Records</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-sm text-muted-foreground">
          No utility billing records found for this utility account. Solar
          generation forms will open automatically based on utility billing
          records.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-medium text-foreground">
            Solar Generation Records
          </h3>
          <p className="text-sm text-muted-foreground">
            {forms.length} billing record{forms.length > 1 ? "s" : ""} found ·
            Bulk Excel matches one row per card (same order as below, newest
            period first).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            id="solar-generation-excel-import"
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
            onClick={handleDownloadSolarTemplate}
          >
            <Download className="mr-2 h-4 w-4" />
            Excel template ({forms.length} rows)
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={excelImporting}
            onClick={() =>
              document.getElementById("solar-generation-excel-import")?.click()
            }
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            {excelImporting ? "Reading…" : "Bulk import"}
          </Button>
        </div>
      </div>

      {forms.map((form, index) => (
        <Card key={form.localId}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              Solar Generation Record {forms.length - index}
              {form.isNew ? " (New)" : ""}
            </CardTitle>

            <div className="flex items-center gap-2">
              {!form.isEditing ? (
                <Button
                  onClick={() => toggleEdit(form.localId, true)}
                  size="sm"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleCancel(form)}
                    size="sm"
                    disabled={saving}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleSave(form)}
                    size="sm"
                    disabled={saving}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? "Saving..." : "Save"}
                  </Button>
                </>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="rounded-xl border bg-muted/20 p-4">
              <h4 className="mb-4 text-base font-semibold text-foreground">
                Billing Information
              </h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Billing Period Start</Label>
                  <Input
                    type="date"
                    value={form.billing_period_start}
                    disabled
                    className={getInputClass(!form.isEditing)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Billing Period End</Label>
                  <Input
                    type="date"
                    value={form.billing_period_end}
                    disabled
                    className={getInputClass(!form.isEditing)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Billing Days</Label>
                  <Input
                    type="number"
                    value={form.billing_days}
                    disabled
                    className={getInputClass(!form.isEditing)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Bill No</Label>
                  <Input
                    value={form.bill_no}
                    disabled
                    className={getInputClass(!form.isEditing)}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border p-4">
              <h4 className="mb-4 text-base font-semibold text-foreground">
                Import (Grid Consumption)
              </h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Import kWh</Label>
                  <Input
                    type="number"
                    value={form.import_kWh}
                    onChange={(e) =>
                      updateForm(form.localId, "import_kWh", e.target.value)
                    }
                    disabled={!form.isEditing}
                    className={getInputClass(!form.isEditing)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Import kVAh</Label>
                  <Input
                    type="number"
                    value={form.import_kVAh}
                    onChange={(e) =>
                      updateForm(form.localId, "import_kVAh", e.target.value)
                    }
                    disabled={!form.isEditing}
                    className={getInputClass(!form.isEditing)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Import kVA</Label>
                  <Input
                    type="number"
                    value={form.import_kVA}
                    onChange={(e) =>
                      updateForm(form.localId, "import_kVA", e.target.value)
                    }
                    disabled={!form.isEditing}
                    className={getInputClass(!form.isEditing)}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border p-4">
              <h4 className="mb-4 text-base font-semibold text-foreground">
                Export (Solar Sent to Grid)
              </h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Export kWh</Label>
                  <Input
                    type="number"
                    value={form.export_kWh}
                    onChange={(e) =>
                      updateForm(form.localId, "export_kWh", e.target.value)
                    }
                    disabled={!form.isEditing}
                    className={getInputClass(!form.isEditing)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Export kVAh</Label>
                  <Input
                    type="number"
                    value={form.export_kVAh}
                    onChange={(e) =>
                      updateForm(form.localId, "export_kVAh", e.target.value)
                    }
                    disabled={!form.isEditing}
                    className={getInputClass(!form.isEditing)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Export kVA</Label>
                  <Input
                    type="number"
                    value={form.export_kVA}
                    onChange={(e) =>
                      updateForm(form.localId, "export_kVA", e.target.value)
                    }
                    disabled={!form.isEditing}
                    className={getInputClass(!form.isEditing)}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-muted/20 p-4">
              <h4 className="mb-4 text-base font-semibold text-foreground">
                Net Values
              </h4>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Net kWh</Label>
                  <Input
                    type="number"
                    value={form.net_kWh}
                    disabled
                    className={getInputClass(!form.isEditing)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Net kVAh</Label>
                  <Input
                    type="number"
                    value={form.net_kVAh}
                    disabled
                    className={getInputClass(!form.isEditing)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Net kVA</Label>
                  <Input
                    type="number"
                    value={form.net_kVA}
                    disabled
                    className={getInputClass(!form.isEditing)}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border p-4">
              <h4 className="mb-4 text-base font-semibold text-foreground">
                Solar Generation
              </h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Solar Generation kWh</Label>
                  <Input
                    type="number"
                    value={form.solar_generation_kWh}
                    onChange={(e) =>
                      updateForm(
                        form.localId,
                        "solar_generation_kWh",
                        e.target.value,
                      )
                    }
                    disabled={!form.isEditing}
                    className={getInputClass(!form.isEditing)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Solar Generation kVAh</Label>
                  <Input
                    type="number"
                    value={form.solar_generation_kVAh}
                    onChange={(e) =>
                      updateForm(
                        form.localId,
                        "solar_generation_kVAh",
                        e.target.value,
                      )
                    }
                    disabled={!form.isEditing}
                    className={getInputClass(!form.isEditing)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Solar Generation kVA</Label>
                  <Input
                    type="number"
                    value={form.solar_generation_kVA}
                    onChange={(e) =>
                      updateForm(
                        form.localId,
                        "solar_generation_kVA",
                        e.target.value,
                      )
                    }
                    disabled={!form.isEditing}
                    className={getInputClass(!form.isEditing)}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border p-4">
              <h4 className="mb-4 text-base font-semibold text-foreground">
                Documents
              </h4>

              <div className="space-y-2">
                <Label>Upload Documents</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="file"
                    multiple
                    accept=".pdf,image/*"
                    onChange={(e) =>
                      handleDocumentsChange(form.localId, e.target.files)
                    }
                    disabled={!form.isEditing}
                  />
                  <Upload className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              {form.existingDocuments.length > 0 && (
                <div className="mt-4 space-y-2">
                  <Label>Existing Documents</Label>
                  <div className="space-y-2">
                    {form.existingDocuments.map((doc, docIndex) => (
                      <div
                        key={`${doc.fileUrl}-${docIndex}`}
                        className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          {doc.fileType === "pdf" ? (
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          )}
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline"
                          >
                            {doc.fileName || `Document ${docIndex + 1}`}
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {form.documents.length > 0 && (
                <div className="mt-4 space-y-2">
                  <Label>New Selected Documents</Label>
                  <div className="space-y-2">
                    {form.documents.map((file, fileIndex) => (
                      <div
                        key={`${file.name}-${fileIndex}`}
                        className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          {file.type === "application/pdf" ? (
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span>{file.name}</span>
                        </div>

                        {form.isEditing && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              removeNewDocument(form.localId, fileIndex)
                            }
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

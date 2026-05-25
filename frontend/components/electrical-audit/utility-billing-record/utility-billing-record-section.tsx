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
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useCreateUtilityBillingRecordMutation,
  useDeleteUtilityBillingRecordMutation,
  useGetUtilityBillingRecordsQuery,
  useUpdateUtilityBillingRecordMutation,
  type UtilityBillingRecord,
} from "@/store/slices/electrical-audit/utilityBillingRecordApiSlice";
import { toast } from "sonner";
import { toastHandler } from "@/lib/toast";
import { AuditSectionSkeleton } from "@/components/electrical-audit/utility-audit/audit-skeleton";
import {
  downloadUtilityBillingRecordTemplate,
  getBulkRecordCountForBillingCycle,
  parseUtilityBillingRecordExcelBulk,
  type UtilityBillingRecordExcelPayload,
} from "@/lib/electrical-audit/utility-billing-record-excel";
import { UTILITY_AUDIT_STEP_IDS } from "@/lib/electrical-audit/utility-audit-steps";
import { cnHideUtilityAuditEdits } from "@/lib/electrical-audit/utility-audit-edits-visibility";
import { AuditStepSubmitBar } from "@/components/electrical-audit/utility-audit/audit-step-submit-bar";
import { useAppSelector } from "@/store/hooks";
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

interface UtilityBillingRecordSectionProps {
  utilityAccountId: string;
  billingCycle?: "monthly" | "bi-monthly" | "quarterly";
  auditStepLocked?: boolean;
}

type BillingFormState = {
  id?: string;
  localId: string;
  isNew: boolean;
  isEditing: boolean;

  billing_period_start: string;
  billing_period_end: string;
  billing_days: string;
  bill_no: string;
  mdi_kVA: string;
  units_kWh: string;
  units_kVAh: string;
  pf: string;
  fixed_charges_rs: string;
  demand_charges_rs: string;
  energy_charges_rs: string;
  taxes_and_rent_rs: string;
  other_charges_rs: string;
  penalty_rs: string;
  other_charges_remark: string;
  rebate_subsidy_rs: string;
  monthly_electricity_bill_rs: string;
  unit_consumption_per_day_kVAh: string;
  average_per_unit_cost_rs: string;
};

/** One client-generated id per draft row; never recomputed on refetch (merge keeps prior state by draft-order match). */
function newDraftLocalId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function createEmptyDraftSlot(): BillingFormState {
  return {
    localId: newDraftLocalId(),
    isNew: true,
    isEditing: true,

    billing_period_start: "",
    billing_period_end: "",
    billing_days: "",
    bill_no: "",
    mdi_kVA: "",
    units_kWh: "",
    units_kVAh: "",
    pf: "",
    fixed_charges_rs: "",
    demand_charges_rs: "",
    energy_charges_rs: "",
    taxes_and_rent_rs: "",
    other_charges_rs: "",
    penalty_rs: "",
    other_charges_remark: "",
    rebate_subsidy_rs: "",
    monthly_electricity_bill_rs: "",
    unit_consumption_per_day_kVAh: "",
    average_per_unit_cost_rs: "",
  };
}

/** Reset a new row on cancel while keeping the same slot identity. */
function emptyDraftPreservingLocalId(localId: string): BillingFormState {
  return {
    localId,
    isNew: true,
    isEditing: true,

    billing_period_start: "",
    billing_period_end: "",
    billing_days: "",
    bill_no: "",
    mdi_kVA: "",
    units_kWh: "",
    units_kVAh: "",
    pf: "",
    fixed_charges_rs: "",
    demand_charges_rs: "",
    energy_charges_rs: "",
    taxes_and_rent_rs: "",
    other_charges_rs: "",
    penalty_rs: "",
    other_charges_remark: "",
    rebate_subsidy_rs: "",
    monthly_electricity_bill_rs: "",
    unit_consumption_per_day_kVAh: "",
    average_per_unit_cost_rs: "",
  };
}

function toDateInput(value?: string | null) {
  if (!value) return "";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  } catch {
    return "";
  }
}

/**
 * Stable list order: creation time (then `_id`). Avoids sorting by billing period,
 * which reordered cards after each save when periods or API normalization changed.
 */
function sortBillingRecordsStable(
  records: UtilityBillingRecord[],
): UtilityBillingRecord[] {
  return [...records].sort((a, b) => {
    const ta = Date.parse(a.created_at ?? a.createdAt ?? "");
    const tb = Date.parse(b.created_at ?? b.createdAt ?? "");
    if (!Number.isNaN(ta) && !Number.isNaN(tb) && ta !== tb) {
      return ta - tb;
    }
    return String(a._id).localeCompare(String(b._id));
  });
}

function recordToForm(record: any): BillingFormState {
  return {
    id: record._id,
    localId: record._id,
    isNew: false,
    isEditing: false,

    billing_period_start: toDateInput(record.billing_period_start),
    billing_period_end: toDateInput(record.billing_period_end),
    billing_days: record.billing_days?.toString() || "",
    bill_no: record.bill_no || "",
    mdi_kVA: record.mdi_kVA?.toString() || "",
    units_kWh: record.units_kWh?.toString() || "",
    units_kVAh: record.units_kVAh?.toString() || "",
    pf: record.pf?.toString() || "",
    fixed_charges_rs: record.fixed_charges_rs?.toString() || "",
    demand_charges_rs: record.demand_charges_rs?.toString() || "",
    energy_charges_rs: record.energy_charges_rs?.toString() || "",
    taxes_and_rent_rs: record.taxes_and_rent_rs?.toString() || "",
    other_charges_rs: record.other_charges_rs?.toString() || "",
    penalty_rs: record.penalty_rs?.toString() || "",
    other_charges_remark: record.other_charges_remark || "",
    rebate_subsidy_rs: record.rebate_subsidy_rs?.toString() || "",
    monthly_electricity_bill_rs:
      record.monthly_electricity_bill_rs?.toString() || "",
    unit_consumption_per_day_kVAh:
      record.unit_consumption_per_day_kVAh?.toString() || "",
    average_per_unit_cost_rs: record.average_per_unit_cost_rs?.toString() || "",
  };
}

const toNumber = (value: string) => {
  if (!value || value.trim() === "") return undefined;
  const num = Number(value);
  return Number.isNaN(num) ? undefined : num;
};

const roundTo = (value: number, decimals = 2) => {
  return Number(value.toFixed(decimals));
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

const calculatePF = (units_kWh: string, units_kVAh: string) => {
  const kwh = toNumber(units_kWh);
  const kvah = toNumber(units_kVAh);

  if (kwh === undefined || kvah === undefined || kvah <= 0) return "";
  return String(roundTo(kwh / kvah, 3));
};

const calculateMonthlyElectricityBill = (
  fixed: string,
  demand: string,
  energy: string,
  taxes: string,
  other: string,
  penalty: string,
  rebateSubsidy: string,
) => {
  const fixedCharges = toNumber(fixed) ?? 0;
  const demandCharges = toNumber(demand) ?? 0;
  const energyCharges = toNumber(energy) ?? 0;
  const taxesCharges = toNumber(taxes) ?? 0;
  const otherCharges = toNumber(other) ?? 0;
  const penaltyCharges = toNumber(penalty) ?? 0;
  const rebate = toNumber(rebateSubsidy) ?? 0;

  return String(
    roundTo(
      fixedCharges +
        demandCharges +
        energyCharges +
        taxesCharges +
        otherCharges +
        penaltyCharges -
        rebate,
      2,
    ),
  );
};

const calculateUnitConsumptionPerDay = (
  units_kVAh: string,
  billing_days: string,
) => {
  const units = toNumber(units_kVAh);
  const days = toNumber(billing_days);

  if (units === undefined || days === undefined || days <= 0) return "";
  return String(roundTo(units / days, 2));
};

const calculateAveragePerUnitCost = (
  monthlyBill: string,
  units_kVAh: string,
) => {
  const bill = toNumber(monthlyBill);
  const units = toNumber(units_kVAh);

  if (bill === undefined || units === undefined || units <= 0) return "";
  return String(roundTo(bill / units, 2));
};

const recalculateBillingForm = (form: BillingFormState): BillingFormState => {
  const updatedForm = { ...form };
  updatedForm.billing_days = calculateBillingDays(
    updatedForm.billing_period_start,
    updatedForm.billing_period_end,
  );
  updatedForm.pf = calculatePF(updatedForm.units_kWh, updatedForm.units_kVAh);
  updatedForm.monthly_electricity_bill_rs = calculateMonthlyElectricityBill(
    updatedForm.fixed_charges_rs,
    updatedForm.demand_charges_rs,
    updatedForm.energy_charges_rs,
    updatedForm.taxes_and_rent_rs,
    updatedForm.other_charges_rs,
    updatedForm.penalty_rs,
    updatedForm.rebate_subsidy_rs,
  );
  updatedForm.unit_consumption_per_day_kVAh = calculateUnitConsumptionPerDay(
    updatedForm.units_kVAh,
    updatedForm.billing_days,
  );
  updatedForm.average_per_unit_cost_rs = calculateAveragePerUnitCost(
    updatedForm.monthly_electricity_bill_rs,
    updatedForm.units_kVAh,
  );
  return updatedForm;
};

function mergeBulkImportIntoForms(
  prev: BillingFormState[],
  rowPayloads: (Partial<UtilityBillingRecordExcelPayload> | null)[],
): { next: BillingFormState[]; updatedCount: number; skippedCount: number } {
  let updatedCount = 0;
  let skippedCount = 0;
  const finalForms: BillingFormState[] = [];
  let cumulativeDays = 0;

  const maxPayloadLength = Math.max(prev.length, rowPayloads.length);

  for (let i = 0; i < maxPayloadLength; i += 1) {
    const hasExcelRow = i < rowPayloads.length;
    const partial = hasExcelRow ? rowPayloads[i] : null;

    if (hasExcelRow && partial !== null && Object.keys(partial).length > 0) {
      const normalizedPartial = { ...partial };
      if (partial.billing_period_start) {
        normalizedPartial.billing_period_start = toDateInput(
          partial.billing_period_start,
        );
      }
      if (partial.billing_period_end) {
        normalizedPartial.billing_period_end = toDateInput(
          partial.billing_period_end,
        );
      }

      const baseForm = i < prev.length ? prev[i] : createEmptyDraftSlot();
      const tempForm = recalculateBillingForm({
        ...baseForm,
        ...normalizedPartial,
        isEditing: true,
      });

      const rowDays = toNumber(tempForm.billing_days) || 0;
      if (cumulativeDays + rowDays <= 365) {
        finalForms.push(tempForm);
        cumulativeDays += rowDays;
        updatedCount += 1;
      } else {
        skippedCount += 1;
        if (i < prev.length && prev[i].id) {
          finalForms.push(prev[i]);
          cumulativeDays += toNumber(prev[i].billing_days) || 0;
        }
      }
    } else {
      if (i < prev.length) {
        const rowDays = toNumber(prev[i].billing_days) || 0;
        if (prev[i].id) {
          finalForms.push(prev[i]);
          cumulativeDays += rowDays;
        } else if (cumulativeDays + rowDays <= 365) {
          finalForms.push(prev[i]);
          cumulativeDays += rowDays;
        }
      }
    }
  }

  return { next: finalForms, updatedCount, skippedCount };
}

function buildBillingMatchKey(form: BillingFormState): string {
  return [
    toDateInput(form.billing_period_start),
    toDateInput(form.billing_period_end),
    (form.bill_no || "").trim().toLowerCase(),
  ].join("__");
}

/** Both rows have full period + bill identity and match (used when a draft becomes saved after refetch). */
function periodsMatchForPromotion(
  a: BillingFormState,
  b: BillingFormState,
): boolean {
  const sa = a.billing_period_start?.trim();
  const ea = a.billing_period_end?.trim();
  const sb = b.billing_period_start?.trim();
  const eb = b.billing_period_end?.trim();
  if (!sa || !ea || !sb || !eb) return false;
  return buildBillingMatchKey(a) === buildBillingMatchKey(b);
}

function formStableKey(f: BillingFormState): string {
  const s = f.billing_period_start?.trim();
  const e = f.billing_period_end?.trim();
  if (s && e) return buildBillingMatchKey(f);
  return `local:${f.localId}`;
}

/**
 * After refetch, merge server list with prior UI state.
 * - Saved rows: match by id / period / localId; if not editing, use server snapshot.
 * - Unsaved drafts: never replace with a freshly built empty row; keep prior `localId` (UUID).
 * - Draft → saved: when server has the same billing period + bill as the draft, adopt the saved row.
 * - Draft match fallback + append unmatched drafts so refetch cannot drop in-progress rows.
 */
function mergeBillingServerWithLocalEdits(
  prev: BillingFormState[],
  finalForms: BillingFormState[],
): BillingFormState[] {
  if (prev.length === 0) return finalForms;

  const usedPrev = new Set<number>();

  const serverDraftIndices = finalForms
    .map((f, i) => (!f.id ? i : -1))
    .filter((i): i is number => i >= 0);

  const findMatchingPrevIndex = (
    serverForm: BillingFormState,
    serverIdx: number,
  ): number => {
    if (serverForm.id) {
      const byId = prev.findIndex(
        (p, i) => !usedPrev.has(i) && p.id === serverForm.id,
      );
      if (byId >= 0) return byId;
    }

    const sKey = formStableKey(serverForm);
    if (!sKey.startsWith("local:")) {
      const byPeriod = prev.findIndex(
        (p, i) => !usedPrev.has(i) && formStableKey(p) === sKey,
      );
      if (byPeriod >= 0) return byPeriod;
    }

    const byLocal = prev.findIndex(
      (p, i) => !usedPrev.has(i) && p.localId === serverForm.localId,
    );
    if (byLocal >= 0) return byLocal;

    // Unsaved draft rows (no id): 1st server draft ↔ 1st unused prev draft, etc.
    if (!serverForm.id) {
      const draftOrder = serverDraftIndices.indexOf(serverIdx);
      if (draftOrder >= 0) {
        let seen = 0;
        for (let i = 0; i < prev.length; i += 1) {
          if (usedPrev.has(i)) continue;
          if (!prev[i].id) {
            if (seen === draftOrder) return i;
            seen += 1;
          }
        }
      }
    }

    return -1;
  };

  const merged = finalForms.map((serverForm, serverIdx) => {
    let pi = findMatchingPrevIndex(serverForm, serverIdx);
    // If strict draft-order matching failed, bind any leftover padded draft (avoids empty slot wiping data).
    if (pi < 0 && !serverForm.id) {
      pi = prev.findIndex((p, i) => !usedPrev.has(i) && !p.id);
    }
    if (pi < 0) return serverForm;

    usedPrev.add(pi);
    const local = prev[pi];

    // Draft just persisted: server has id and same billing identity — adopt server snapshot + id as localId.
    if (
      !local.id &&
      serverForm.id &&
      periodsMatchForPromotion(local, serverForm)
    ) {
      return recalculateBillingForm({
        ...serverForm,
        localId: serverForm.id,
        isNew: false,
      });
    }

    // Unsaved draft: never replace with a freshly built empty padded row (new UUID / empty fields).
    if (!local.id && !serverForm.id) {
      return recalculateBillingForm({
        ...local,
        isNew: serverForm.isNew,
      });
    }

    // Merge paired a draft with a different saved row at this index — keep in-progress draft.
    if (
      !local.id &&
      serverForm.id &&
      !periodsMatchForPromotion(local, serverForm)
    ) {
      return recalculateBillingForm({
        ...local,
        isNew: serverForm.isNew,
      });
    }

    // Saved row only (all drafts handled above): prefer server unless user is editing.
    if (local.isEditing) {
      return recalculateBillingForm({
        ...local,
        id: serverForm.id ?? local.id,
        isNew: serverForm.isNew,
        localId: serverForm.id ? serverForm.id : local.localId,
      });
    }

    return serverForm;
  });

  // Prev rows that never matched a server slot (often draft-order drift after several saves).
  const orphanDrafts: BillingFormState[] = [];
  for (let i = 0; i < prev.length; i += 1) {
    if (usedPrev.has(i)) continue;
    if (!prev[i].id) {
      const isEmpty =
        !prev[i].billing_period_start &&
        !prev[i].billing_period_end &&
        !prev[i].bill_no &&
        !prev[i].mdi_kVA &&
        !prev[i].units_kWh &&
        !prev[i].units_kVAh &&
        !prev[i].fixed_charges_rs &&
        !prev[i].demand_charges_rs &&
        !prev[i].energy_charges_rs &&
        !prev[i].taxes_and_rent_rs &&
        !prev[i].other_charges_rs &&
        !prev[i].penalty_rs &&
        !prev[i].rebate_subsidy_rs;

      if (!isEmpty) {
        orphanDrafts.push(recalculateBillingForm(prev[i]));
      }
    }
  }

  const combined =
    orphanDrafts.length > 0 ? [...merged, ...orphanDrafts] : merged;

  // Guard: merge should be 1:1, but duplicate draft localIds break React keys and updates.
  const seenDraft = new Set<string>();
  return combined.map((f) => {
    if (f.id) return f;
    let lid = f.localId;
    if (seenDraft.has(lid)) {
      let n = 1;
      do {
        lid = `${f.localId}__${n}`;
        n += 1;
      } while (seenDraft.has(lid));
    }
    seenDraft.add(lid);
    return lid === f.localId ? f : { ...f, localId: lid };
  });
}

const editableInputClass = "bg-background border-border";
const autoInputClass =
  "cursor-not-allowed border border-dashed border-sky-300 bg-sky-100 text-sky-900 opacity-100 dark:border-sky-700 dark:bg-sky-950/60 dark:text-sky-100";

export function UtilityBillingRecordSection({
  utilityAccountId,
  billingCycle = "monthly",
  auditStepLocked = false,
}: UtilityBillingRecordSectionProps) {
  const user = useAppSelector((state) => state.auth.user);
  const canDeleteRecords =
    user?.role === "super_admin" || user?.role === "admin";
  const [page, setPage] = useState(1);

  const { data, isLoading } = useGetUtilityBillingRecordsQuery({
    utility_account_id: utilityAccountId,
    page,
    limit: 24,
  });

  const [createUtilityBillingRecord, { isLoading: isCreating }] =
    useCreateUtilityBillingRecordMutation();

  const [updateUtilityBillingRecord, { isLoading: isUpdating }] =
    useUpdateUtilityBillingRecordMutation();
  const [deleteUtilityBillingRecord, { isLoading: isDeleting }] =
    useDeleteUtilityBillingRecordMutation();

  const billingRecords = useMemo(() => data?.data || [], [data]);

  const [forms, setForms] = useState<BillingFormState[]>([]);
  const [excelImporting, setExcelImporting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BillingFormState | null>(
    null,
  );

  const totalBillingDays = useMemo(() => {
    return forms.reduce((sum, f) => sum + (toNumber(f.billing_days) || 0), 0);
  }, [forms]);

  useEffect(() => {
    setPage(1);
  }, [utilityAccountId]);

  useEffect(() => {
    if (!auditStepLocked) return;
    setForms((prev) => prev.map((f) => ({ ...f, isEditing: false })));
  }, [auditStepLocked]);

  const formsRef = useRef(forms);
  const lastMergedAccountIdRef = useRef<string | null>(null);
  useEffect(() => {
    formsRef.current = forms;
  }, [forms]);

  useEffect(() => {
    const mapped = sortBillingRecordsStable(billingRecords).map(recordToForm);
    const finalForms = [...mapped];

    // Avoid merging local state from a previous utility account into this list.
    if (lastMergedAccountIdRef.current !== utilityAccountId) {
      lastMergedAccountIdRef.current = utilityAccountId;
      setForms(finalForms);
      return;
    }

    setForms((prev) => mergeBillingServerWithLocalEdits(prev, finalForms));
  }, [billingRecords, utilityAccountId]);

  const handleAddRecord = () => {
    if (totalBillingDays >= 365) {
      toast.error(
        `Cannot add more billing records. The total sum of billing days has reached ${totalBillingDays} / 365 days.`,
      );
      return;
    }
    setForms((prev) => [...prev, createEmptyDraftSlot()]);
  };

  const handleDownloadBillingExcelTemplate = async () => {
    const recordCount = forms.length || 12;
    await downloadUtilityBillingRecordTemplate({
      billingCycle,
      utilityAccountId,
      recordCount,
      rowPrefills: forms.map((f) => ({
        billing_period_start: f.billing_period_start,
        billing_period_end: f.billing_period_end,
        bill_no: f.bill_no,
        slotKey: f.localId,
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
      const rowPayloads = await parseUtilityBillingRecordExcelBulk(file);
      if (!rowPayloads.length) {
        toast.error(
          "No data rows found under the header. Fill the template and try again.",
          { id: "utility-billing-bulk-import" },
        );
        return;
      }

      const prev = formsRef.current;
      const { next, updatedCount, skippedCount } = mergeBulkImportIntoForms(
        prev,
        rowPayloads,
      );

      if (updatedCount === 0) {
        toast.error(
          skippedCount > 0
            ? "No rows imported because they all exceed the 365-day cumulative limit."
            : "No values found in data rows. Enter data in the template and try again.",
          { id: "utility-billing-bulk-import" },
        );
        return;
      }

      setForms(next);

      if (skippedCount > 0) {
        toast.warning(
          `Imported ${updatedCount} row(s). ${skippedCount} row(s) were ignored because they would exceed the 365-day limit.`,
          { id: "utility-billing-bulk-import", duration: 8000 },
        );
      } else {
        toast.success(
          `Imported ${updatedCount} billing record row(s). Review and save each card.`,
          { id: "utility-billing-bulk-import" },
        );
      }
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Could not read that Excel file.",
      );
    } finally {
      setExcelImporting(false);
    }
  };

  const updateForm = (
    localId: string,
    key: keyof BillingFormState,
    value: string,
  ) => {
    setForms((prev) =>
      prev.map((form) => {
        if (form.localId !== localId) return form;

        const updatedForm = { ...form, [key]: value };

        updatedForm.billing_days = calculateBillingDays(
          updatedForm.billing_period_start,
          updatedForm.billing_period_end,
        );

        updatedForm.pf = calculatePF(
          updatedForm.units_kWh,
          updatedForm.units_kVAh,
        );

        updatedForm.monthly_electricity_bill_rs =
          calculateMonthlyElectricityBill(
            updatedForm.fixed_charges_rs,
            updatedForm.demand_charges_rs,
            updatedForm.energy_charges_rs,
            updatedForm.taxes_and_rent_rs,
            updatedForm.other_charges_rs,
            updatedForm.penalty_rs,
            updatedForm.rebate_subsidy_rs,
          );

        updatedForm.unit_consumption_per_day_kVAh =
          calculateUnitConsumptionPerDay(
            updatedForm.units_kVAh,
            updatedForm.billing_days,
          );

        updatedForm.average_per_unit_cost_rs = calculateAveragePerUnitCost(
          updatedForm.monthly_electricity_bill_rs,
          updatedForm.units_kVAh,
        );

        return updatedForm;
      }),
    );
  };

  const replaceForm = (localId: string, nextForm: BillingFormState) => {
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

  const handleCancel = (form: BillingFormState) => {
    if (form.isNew) {
      setForms((prev) => prev.filter((f) => f.localId !== form.localId));
      return;
    }

    const original = billingRecords.find((item: any) => item._id === form.id);
    if (!original) return;

    replaceForm(form.localId, recordToForm(original));
  };

  const handleSave = async (form: BillingFormState) => {
    if (!form.billing_period_start.trim() || !form.billing_period_end.trim()) {
      toast.error("Billing period start and end dates are required.");
      return;
    }

    const currentDays = toNumber(form.billing_days) || 0;
    const savedRecordsDays = forms
      .filter((f) => f.id && f.id !== form.id)
      .reduce((sum, f) => sum + (toNumber(f.billing_days) || 0), 0);
    const totalDays = savedRecordsDays + currentDays;

    if (totalDays > 365) {
      toast.error(
        `The sum of billing days across records (${totalDays} days) cannot exceed 365 days. ` +
          `(Previous saved records: ${savedRecordsDays} days, current record: ${currentDays} days)`,
      );
      return;
    }

    const payload = {
      utility_account_id: utilityAccountId,
      billing_period_start: form.billing_period_start.trim(),
      billing_period_end: form.billing_period_end.trim(),

      billing_days: toNumber(form.billing_days),
      bill_no: form.bill_no || undefined,

      mdi_kVA: toNumber(form.mdi_kVA),
      units_kWh: toNumber(form.units_kWh),
      units_kVAh: toNumber(form.units_kVAh),
      pf: toNumber(form.pf),

      fixed_charges_rs: toNumber(form.fixed_charges_rs),
      demand_charges_rs: toNumber(form.demand_charges_rs),
      energy_charges_rs: toNumber(form.energy_charges_rs),
      taxes_and_rent_rs: toNumber(form.taxes_and_rent_rs),
      other_charges_rs: toNumber(form.other_charges_rs),
      penalty_rs: toNumber(form.penalty_rs),
      other_charges_remark: form.other_charges_remark || undefined,
      rebate_subsidy_rs: toNumber(form.rebate_subsidy_rs),

      monthly_electricity_bill_rs: toNumber(form.monthly_electricity_bill_rs),
      unit_consumption_per_day_kVAh: toNumber(
        form.unit_consumption_per_day_kVAh,
      ),
      average_per_unit_cost_rs: toNumber(form.average_per_unit_cost_rs),
    };

    try {
      await toastHandler({
        action: () => {
          if (form.isNew) {
            return createUtilityBillingRecord(payload).unwrap();
          }

          if (form.id) {
            return updateUtilityBillingRecord({
              id: form.id,
              ...payload,
            }).unwrap();
          }

          return Promise.reject(
            new Error("Utility billing record ID is missing."),
          );
        },
        loading: form.isNew
          ? "Creating billing record..."
          : "Updating billing record...",
        success: form.isNew
          ? "Billing record created successfully"
          : "Billing record updated successfully",
      });

      setForms((prev) =>
        prev.map((f) =>
          f.localId === form.localId ? { ...f, isEditing: false } : f,
        ),
      );
    } catch (error: any) {
      console.error("Failed to save utility billing record:", error);
    }
  };

  const handleDelete = (form: BillingFormState) => {
    if (!form.id || !canDeleteRecords) return;
    setDeleteTarget(form);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget?.id || !canDeleteRecords) return;
    try {
      await toastHandler({
        action: () =>
          deleteUtilityBillingRecord(deleteTarget.id as string).unwrap(),
        loading: "Deleting billing record...",
        success: "Billing record deleted successfully",
      });
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error("Failed to delete utility billing record:", error);
    }
  };

  const saving = isCreating || isUpdating || isDeleting;

  if (isLoading) {
    return <AuditSectionSkeleton />;
  }

  return (
    <div className="relative space-y-4">
      <AuditStepSubmitBar
        utilityAccountId={utilityAccountId}
        stepId={UTILITY_AUDIT_STEP_IDS.BILLING}
        auditStepLocked={auditStepLocked}
      />

      <div className="relative">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-3">
                <h3
                  id="utility-billing-records-heading"
                  className="text-lg font-medium text-foreground"
                >
                  Utility Billing Records
                </h3>
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-full px-2.5 py-0.5 text-xs font-semibold border transition shadow-sm",
                    totalBillingDays > 365
                      ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/60"
                      : totalBillingDays === 365
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60"
                        : "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900/60",
                  )}
                >
                  Total Days: {totalBillingDays} / 365
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Add your billing records dynamically. The sum of all record
                billing days must not exceed 365 days.
              </p>
            </div>

            <div
              className={cnHideUtilityAuditEdits(
                auditStepLocked,
                "flex flex-wrap items-center gap-2",
              )}
            >
              <input
                id="utility-billing-excel-import"
                type="file"
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                className="hidden"
                onChange={handleExcelFileChange}
                disabled={excelImporting}
              />
              {!auditStepLocked && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddRecord}
                  disabled={totalBillingDays >= 365}
                  className="bg-primary/5 text-primary hover:bg-primary/10 border-primary/20"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Billing Record
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadBillingExcelTemplate}
              >
                <Download className="mr-2 h-4 w-4" />
                Excel template ({forms.length || 12} rows)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={excelImporting}
                onClick={() =>
                  document
                    .getElementById("utility-billing-excel-import")
                    ?.click()
                }
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                {excelImporting ? "Reading…" : "Bulk import"}
              </Button>
            </div>
          </div>

          {forms.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  No billing records available.
                </p>
                {!auditStepLocked && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddRecord}
                    disabled={totalBillingDays >= 365}
                    className="bg-primary/5 text-primary hover:bg-primary/10 border-primary/20 mx-auto"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Billing Record
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            forms.map((form, index) => (
              <Card key={form.id ?? form.localId}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>
                    Billing Record {index + 1} of {forms.length}
                    {form.isNew ? " (New)" : ""}
                  </CardTitle>

                  <div
                    className={cnHideUtilityAuditEdits(
                      auditStepLocked,
                      "flex flex-wrap items-center gap-2",
                    )}
                  >
                    {!form.isEditing ? (
                      <>
                        <Button
                          onClick={() => toggleEdit(form.localId, true)}
                          size="sm"
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        {canDeleteRecords && form.id ? (
                          <Button
                            variant="destructive"
                            onClick={() => handleDelete(form)}
                            size="sm"
                            disabled={saving}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        ) : null}
                      </>
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

                <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Billing Period Start</Label>
                    <Input
                      type="date"
                      value={form.billing_period_start}
                      onChange={(e) =>
                        updateForm(
                          form.localId,
                          "billing_period_start",
                          e.target.value,
                        )
                      }
                      disabled={!form.isEditing}
                      className={editableInputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Billing Period End</Label>
                    <Input
                      type="date"
                      value={form.billing_period_end}
                      onChange={(e) =>
                        updateForm(
                          form.localId,
                          "billing_period_end",
                          e.target.value,
                        )
                      }
                      disabled={!form.isEditing}
                      className={editableInputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Billing Days (Auto)</Label>
                    <Input
                      type="number"
                      value={form.billing_days}
                      disabled
                      className={autoInputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Bill No</Label>
                    <Input
                      value={form.bill_no}
                      onChange={(e) =>
                        updateForm(form.localId, "bill_no", e.target.value)
                      }
                      disabled={!form.isEditing}
                      className={editableInputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>MDI (kVA)</Label>
                    <Input
                      type="number"
                      value={form.mdi_kVA}
                      onChange={(e) =>
                        updateForm(form.localId, "mdi_kVA", e.target.value)
                      }
                      disabled={!form.isEditing}
                      className={editableInputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Units (kWh)</Label>
                    <Input
                      type="number"
                      value={form.units_kWh}
                      onChange={(e) =>
                        updateForm(form.localId, "units_kWh", e.target.value)
                      }
                      disabled={!form.isEditing}
                      className={editableInputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Units (kVAh)</Label>
                    <Input
                      type="number"
                      value={form.units_kVAh}
                      onChange={(e) =>
                        updateForm(form.localId, "units_kVAh", e.target.value)
                      }
                      disabled={!form.isEditing}
                      className={editableInputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>PF (Auto = kWh / kVAh)</Label>
                    <Input
                      type="number"
                      step="0.001"
                      value={form.pf}
                      disabled
                      className={autoInputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Fixed Charges(Min. Charges) (₹)</Label>
                    <Input
                      type="number"
                      value={form.fixed_charges_rs}
                      onChange={(e) =>
                        updateForm(
                          form.localId,
                          "fixed_charges_rs",
                          e.target.value,
                        )
                      }
                      disabled={!form.isEditing}
                      className={editableInputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Demand Charges (₹)</Label>
                    <Input
                      type="number"
                      value={form.demand_charges_rs}
                      onChange={(e) =>
                        updateForm(
                          form.localId,
                          "demand_charges_rs",
                          e.target.value,
                        )
                      }
                      disabled={!form.isEditing}
                      className={editableInputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Energy Charges (₹)</Label>
                    <Input
                      type="number"
                      value={form.energy_charges_rs}
                      onChange={(e) =>
                        updateForm(
                          form.localId,
                          "energy_charges_rs",
                          e.target.value,
                        )
                      }
                      disabled={!form.isEditing}
                      className={editableInputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Taxes and Rent (Duty) (₹)</Label>
                    <Input
                      type="number"
                      value={form.taxes_and_rent_rs}
                      onChange={(e) =>
                        updateForm(
                          form.localId,
                          "taxes_and_rent_rs",
                          e.target.value,
                        )
                      }
                      disabled={!form.isEditing}
                      className={editableInputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Other Charges (₹)</Label>
                    <Input
                      type="number"
                      value={form.other_charges_rs}
                      onChange={(e) =>
                        updateForm(
                          form.localId,
                          "other_charges_rs",
                          e.target.value,
                        )
                      }
                      disabled={!form.isEditing}
                      className={editableInputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Other Charges Remark</Label>
                    <Input
                      value={form.other_charges_remark}
                      onChange={(e) =>
                        updateForm(
                          form.localId,
                          "other_charges_remark",
                          e.target.value,
                        )
                      }
                      disabled={!form.isEditing}
                      className={editableInputClass}
                      placeholder="Enter other charges remark"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Penalty (₹)</Label>
                    <Input
                      type="number"
                      value={form.penalty_rs}
                      onChange={(e) =>
                        updateForm(form.localId, "penalty_rs", e.target.value)
                      }
                      disabled={!form.isEditing}
                      className={editableInputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Rebate / Subsidy (₹)</Label>
                    <Input
                      type="number"
                      value={form.rebate_subsidy_rs}
                      onChange={(e) =>
                        updateForm(
                          form.localId,
                          "rebate_subsidy_rs",
                          e.target.value,
                        )
                      }
                      disabled={!form.isEditing}
                      className={editableInputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Monthly Electricity Bill (Auto = Fixed + Demand + Energy +
                      Taxes + Other + Penalty - Rebate / Subsidy)
                    </Label>
                    <Input
                      type="number"
                      value={form.monthly_electricity_bill_rs}
                      disabled
                      className={autoInputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Unit Consumption / Day (Auto)</Label>
                    <Input
                      type="number"
                      value={form.unit_consumption_per_day_kVAh}
                      disabled
                      className={autoInputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Average Per Unit Cost (Auto)</Label>
                    <Input
                      type="number"
                      value={form.average_per_unit_cost_rs}
                      disabled
                      className={autoInputClass}
                    />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
          {!auditStepLocked && forms.length > 0 && (
            <div className="flex justify-center pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddRecord}
                disabled={totalBillingDays >= 365}
                className="bg-primary/5 text-primary hover:bg-primary/10 border-primary/20 w-full sm:w-auto"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Billing Record
              </Button>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {data && data.pages !== undefined && data.pages > 1 && (
          <div className="flex flex-col items-center justify-between gap-4 border-t border-border pt-4 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              Showing page{" "}
              <span className="font-medium text-foreground">{page}</span> of{" "}
              <span className="font-medium text-foreground">{data.pages}</span>{" "}
              (Total {data.total ?? 0} records)
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPage((p) => Math.max(1, p - 1));
                  document
                    .getElementById("utility-billing-records-heading")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPage((p) => Math.min(data.pages || 1, p + 1));
                  document
                    .getElementById("utility-billing-records-heading")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                disabled={page === data.pages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete billing record?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. It will permanently delete this
              utility billing record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleConfirmDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

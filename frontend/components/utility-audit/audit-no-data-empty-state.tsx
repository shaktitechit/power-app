"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  useClearAuditStepNoDataMutation,
  useDeclareAuditStepNoDataMutation,
} from "@/store/slices/utilityApiSlice";
import { toastHandler } from "@/lib/toast";
import { UTILITY_AUDIT_STEP_LABELS } from "@/lib/utility-audit-steps";

type AuditNoDataEmptyStateProps = {
  utilityAccountId: string;
  stepId: string;
  /** Shown in dialogs (falls back to UTILITY_AUDIT_STEP_LABELS) */
  sectionLabel?: string;
  auditStepLocked: boolean;
  isAdmin: boolean;
  noDataDeclared: boolean;
};

export function AuditNoDataEmptyState({
  utilityAccountId,
  stepId,
  sectionLabel,
  auditStepLocked,
  isAdmin,
  noDataDeclared,
}: AuditNoDataEmptyStateProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);

  const [declareNoData, { isLoading: declaring }] =
    useDeclareAuditStepNoDataMutation();
  const [clearNoData, { isLoading: clearing }] =
    useClearAuditStepNoDataMutation();

  const label =
    sectionLabel ?? UTILITY_AUDIT_STEP_LABELS[stepId] ?? "This audit";

  const handleDeclare = async () => {
    try {
      await toastHandler({
        action: () =>
          declareNoData({ utilityAccountId, step: stepId }).unwrap(),
        loading: "Saving…",
        success: "Marked as no data for this audit step",
      });
      setConfirmOpen(false);
    } catch {
      /* surfaced */
    }
  };

  const handleClear = async () => {
    try {
      await toastHandler({
        action: () =>
          clearNoData({ utilityAccountId, step: stepId }).unwrap(),
        loading: "Updating…",
        success: "You can add records again",
      });
      setClearOpen(false);
    } catch {
      /* surfaced */
    }
  };

  if (noDataDeclared) {
    return (
      <>
        <Card className="border-border">
          <CardContent className="space-y-4 px-4 py-8 sm:px-6">
            <p className="text-center text-sm text-muted-foreground sm:text-base">
              No data available for this audit.
            </p>
            {isAdmin ? (
              <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:justify-center">
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full sm:w-auto"
                  disabled={auditStepLocked || clearing}
                  onClick={() => setClearOpen(true)}
                >
                  {clearing ? "Applying…" : "Allow adding records"}
                </Button>
              </div>
            ) : (
              <p className="text-center text-xs text-muted-foreground">
                Only an administrator can allow adding records again.
              </p>
            )}
          </CardContent>
        </Card>

        <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
          <AlertDialogContent className="max-w-[calc(100%-1.5rem)]">
            <AlertDialogHeader>
              <AlertDialogTitle>Allow adding records?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes the &quot;no data&quot; state for{" "}
                <strong>{label}</strong> so auditors can add entries again.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
              <AlertDialogCancel disabled={clearing} className="w-full sm:w-auto">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className="w-full sm:w-auto"
                disabled={clearing}
                onClick={(e) => {
                  e.preventDefault();
                  void handleClear();
                }}
              >
                {clearing ? "Applying…" : "Yes, allow adding"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return (
    <>
      <Card className="border-border">
        <CardContent className="space-y-4 px-4 py-8 sm:px-6">
          <p className="text-center text-sm text-muted-foreground sm:text-base">
            No records yet. If this audit truly has no data, confirm below.
          </p>
          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:justify-center">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              disabled={auditStepLocked || declaring}
              onClick={() => setConfirmOpen(true)}
            >
              No data for this audit
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="max-w-[calc(100%-1.5rem)]">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure there is no data?</AlertDialogTitle>
            <AlertDialogDescription>
              This marks <strong>{label}</strong> as having no data. You will
              not be able to add records until an administrator allows it
              again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <AlertDialogCancel disabled={declaring} className="w-full sm:w-auto">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="w-full sm:w-auto"
              disabled={declaring}
              onClick={(e) => {
                e.preventDefault();
                void handleDeclare();
              }}
            >
              {declaring ? "Saving…" : "Yes, no data"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

"use client";

import { useState } from "react";
import { AlertTriangle, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  useAllowUtilityAuditStepMutation,
  useSubmitUtilityAuditStepMutation,
} from "@/store/slices/utilityApiSlice";
import {
  UTILITY_AUDIT_STEP_IDS,
  UTILITY_AUDIT_STEP_LABELS,
} from "@/lib/utility-audit-steps";
import { toastHandler } from "@/lib/toast";
import { useAppSelector } from "@/store/hooks";

type AuditStepSubmitBarProps = {
  utilityAccountId: string;
  stepId: string;
  /** Overrides default label from UTILITY_AUDIT_STEP_LABELS */
  stepLabel?: string;
  /** When true, this audit step is already submitted (locked). Non-admins see nothing; admins see Allow editing. */
  auditStepLocked?: boolean;
  disabled?: boolean;
  className?: string;
  /** Inline button + dialog only (for tab strips); full alert when default */
  variant?: "default" | "compact";
};

export function AuditStepSubmitBar({
  utilityAccountId,
  stepId,
  stepLabel,
  auditStepLocked = false,
  disabled = false,
  className,
  variant = "default",
}: AuditStepSubmitBarProps) {
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === "admin";

  const [submitOpen, setSubmitOpen] = useState(false);
  const [allowOpen, setAllowOpen] = useState(false);
  const [submitAuditStep, { isLoading: isSubmitting }] =
    useSubmitUtilityAuditStepMutation();
  const [allowAuditStep, { isLoading: isAllowing }] =
    useAllowUtilityAuditStepMutation();

  const label =
    stepLabel ?? UTILITY_AUDIT_STEP_LABELS[stepId] ?? "This audit step";

  // Final submit is now centralized on Preview and Submit tab only.
  if (stepId !== UTILITY_AUDIT_STEP_IDS.PREVIEW_SUBMIT) {
    return null;
  }

  const lockedForNonAdminBanner = (
    <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-950 dark:border-blue-500/30 dark:bg-blue-950/40 dark:text-blue-100">
      This audit step has been submitted and is locked for editing.
    </div>
  );

  if (auditStepLocked && !isAdmin) {
    if (variant === "compact") {
      return null;
    }
    return <div className={className}>{lockedForNonAdminBanner}</div>;
  }

  const handleConfirmSubmit = async () => {
    try {
      await toastHandler({
        action: () =>
          submitAuditStep({ utilityAccountId, step: stepId }).unwrap(),
        loading: "Submitting final audit…",
        success:
          "Final audit submitted. This utility account is now locked for editing.",
      });
      setSubmitOpen(false);
    } catch {
      /* toastHandler surfaced the error */
    }
  };

  const handleConfirmAllow = async () => {
    try {
      await toastHandler({
        action: () =>
          allowAuditStep({ utilityAccountId, step: stepId }).unwrap(),
        loading: "Allowing editing…",
        success: "Editing is allowed again for this audit step.",
      });
      setAllowOpen(false);
    } catch {
      /* toastHandler surfaced the error */
    }
  };

  const submitDialog = (
    <AlertDialog open={submitOpen} onOpenChange={setSubmitOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Submit final audit?</AlertDialogTitle>
          <AlertDialogDescription>
            Submitting locks <strong>{label}</strong> for editing. This cannot
            be undone from this screen. Confirm only when your audit data is
            complete.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isSubmitting}
            onClick={(e) => {
              e.preventDefault();
              void handleConfirmSubmit();
            }}
          >
            {isSubmitting ? "Submitting…" : "Final submit"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  const allowDialog = (
    <AlertDialog open={allowOpen} onOpenChange={setAllowOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Allow editing for this audit step?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the lock on <strong>{label}</strong> so data can be
            edited again. Use this when corrections are required after submit.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isAllowing}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isAllowing}
            onClick={(e) => {
              e.preventDefault();
              void handleConfirmAllow();
            }}
          >
            {isAllowing ? "Applying…" : "Allow editing"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  if (auditStepLocked && isAdmin) {
    const allowButton = (
      <Button
        type="button"
        variant={variant === "compact" ? "outline" : "secondary"}
        size={variant === "compact" ? "sm" : "default"}
        className={
          variant === "compact" ? "whitespace-nowrap text-xs sm:text-sm" : undefined
        }
        disabled={disabled || isAllowing}
        onClick={() => setAllowOpen(true)}
      >
        {isAllowing ? "Applying…" : "Allow editing"}
      </Button>
    );

    if (variant === "compact") {
      return (
        <div className={className}>
          {allowButton}
          {allowDialog}
        </div>
      );
    }

    return (
      <div className={className}>
        <Alert className="border-blue-500/40 bg-blue-500/10 text-blue-950 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100">
          <Unlock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle>Admin</AlertTitle>
          <AlertDescription className="mt-1 text-blue-900/90 dark:text-blue-100/90">
            Remove the lock on <span className="font-medium">{label}</span> if
            corrections are needed after submit.
          </AlertDescription>
        </Alert>

        <div className="mt-3 flex flex-wrap items-center gap-2">{allowButton}</div>

        {allowDialog}
      </div>
    );
  }

  const submitButton = (
    <Button
      type="button"
      variant={variant === "compact" ? "outline" : "default"}
      size={variant === "compact" ? "sm" : "default"}
      className={
        variant === "compact" ? "whitespace-nowrap text-xs sm:text-sm" : undefined
      }
      disabled={disabled || isSubmitting}
      onClick={() => setSubmitOpen(true)}
    >
      {isSubmitting ? "Submitting…" : "Final submit"}
    </Button>
  );

  if (variant === "compact") {
    return (
      <div className={className}>
        {submitButton}
        {submitDialog}
      </div>
    );
  }

  return (
    <div className={className}>
      <Alert className="border-amber-500/40 bg-amber-500/10 text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertTitle>Before final submit</AlertTitle>
        <AlertDescription className="mt-1 text-amber-900/90 dark:text-amber-100/90">
          Submitting locks <span className="font-medium">{label}</span> for
          editing. Confirm in the dialog when you are ready.
        </AlertDescription>
      </Alert>

      <div className="mt-3 flex flex-wrap items-center gap-2">{submitButton}</div>

      {submitDialog}
    </div>
  );
}

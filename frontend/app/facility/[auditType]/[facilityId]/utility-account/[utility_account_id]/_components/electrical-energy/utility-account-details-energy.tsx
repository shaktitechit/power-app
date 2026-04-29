"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, ClipboardList, FileText, ImageIcon, Plug, Zap } from "lucide-react";
import type { UtilityAccount } from "@/store/slices/electrical-audit/utilityApiSlice";
import {
  type UtilityDocument,
  formatUtilityAuditSubmittedBy,
} from "../shared/utility-account-workspace-types";

type Props = {
  utilityAccount: UtilityAccount;
  canViewDocs: boolean;
  finalAuditLocked: boolean;
  finalAuditSubmission:
    | {
        submitted_at?: string;
        submitted_by?: string | { _id?: string; name?: string; email?: string };
      }
    | undefined;
  auditStatusLabel: string;
};

export function UtilityAccountDetailsEnergy({
  utilityAccount,
  canViewDocs,
  finalAuditLocked,
  finalAuditSubmission,
  auditStatusLabel,
}: Props) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <Plug className="h-5 w-5 text-primary" />
              Utility Account Information
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="flex items-start gap-3">
              <Zap className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {utilityAccount.account_number || "-"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {utilityAccount.connection_type || "-"}
                </p>
              </div>
            </div>

            <div className="grid gap-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Category</span>
                <span className="text-right text-foreground">
                  {utilityAccount.category || "-"}
                </span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Location</span>
                <span className="text-right text-foreground">
                  {utilityAccount.location || "-"}
                </span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Sanctioned Demand</span>
                <span className="text-right text-foreground">
                  {utilityAccount.sanctioned_demand_kVA != null
                    ? `${utilityAccount.sanctioned_demand_kVA} kVA`
                    : "-"}
                </span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Provider</span>
                <span className="text-right text-foreground">
                  {utilityAccount.provider || "-"}
                </span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Billing Cycle</span>
                <span className="text-right text-foreground">
                  {utilityAccount.billing_cycle || "-"}
                </span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Status</span>
                <span
                  className={`text-right font-medium ${
                    utilityAccount.is_active
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-destructive"
                  }`}
                >
                  {utilityAccount.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Audit Status</span>
                <span
                  className={`text-right font-medium ${
                    finalAuditLocked
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-amber-700 dark:text-amber-400"
                  }`}
                >
                  {auditStatusLabel}
                </span>
              </div>

              {finalAuditLocked ? (
                <>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Audit completed at</span>
                    <span className="text-right text-foreground">
                      {finalAuditSubmission?.submitted_at
                        ? new Date(
                            finalAuditSubmission.submitted_at,
                          ).toLocaleString()
                        : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Completed by</span>
                    <span className="text-right text-foreground">
                      {formatUtilityAuditSubmittedBy(
                        finalAuditSubmission?.submitted_by,
                      )}
                    </span>
                  </div>
                </>
              ) : null}

              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Audit Date</span>
                <span className="text-right text-foreground">
                  {utilityAccount.audit_date
                    ? new Date(utilityAccount.audit_date).toLocaleDateString()
                    : "-"}
                </span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">
                  Transformer Maintained by Facility
                </span>
                <span className="text-right text-foreground">
                  {utilityAccount.is_transformer_maintained_by_facility
                    ? "Yes"
                    : "No"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <Activity className="h-5 w-5 text-primary" />
              Connection Summary
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="flex flex-wrap gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  utilityAccount.is_solar_connected
                    ? "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                Solar{" "}
                {utilityAccount.is_solar_connected ? "Connected" : "Not Connected"}
              </span>

              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  utilityAccount.is_dg_connected
                    ? "bg-blue-100 text-blue-900 dark:bg-blue-500/20 dark:text-blue-200"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                DG{" "}
                {utilityAccount.is_dg_connected ? "Connected" : "Not Connected"}
              </span>

              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  utilityAccount.is_transformer_connected
                    ? "bg-purple-100 text-purple-900 dark:bg-purple-500/20 dark:text-purple-200"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                Transformer{" "}
                {utilityAccount.is_transformer_connected
                  ? "Connected"
                  : "Not Connected"}
              </span>

              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  utilityAccount.is_pump_connected
                    ? "bg-cyan-100 text-cyan-900 dark:bg-cyan-500/20 dark:text-cyan-200"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                Pump{" "}
                {utilityAccount.is_pump_connected ? "Connected" : "Not Connected"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">Connection Type</p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {utilityAccount.connection_type || "-"}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">Provider</p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {utilityAccount.provider || "-"}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">Billing Cycle</p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {utilityAccount.billing_cycle || "-"}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {utilityAccount.is_active ? "Active" : "Inactive"}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">Audit Status</p>
                <p
                  className={`mt-1 text-lg font-semibold ${
                    finalAuditLocked
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-amber-700 dark:text-amber-400"
                  }`}
                >
                  {auditStatusLabel}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <ClipboardList className="h-5 w-5 text-primary" />
            Audit & Record Details
          </CardTitle>
        </CardHeader>

        <CardContent className="grid gap-4 p-4 pt-0 sm:grid-cols-2 sm:p-6 sm:pt-0 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground">Audit Date</p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {utilityAccount.audit_date
                ? new Date(utilityAccount.audit_date).toLocaleDateString()
                : "-"}
            </p>
          </div>

          {finalAuditLocked ? (
            <>
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">Audit completed at</p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {finalAuditSubmission?.submitted_at
                    ? new Date(
                        finalAuditSubmission.submitted_at,
                      ).toLocaleString()
                    : "-"}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">Completed by</p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {formatUtilityAuditSubmittedBy(
                    finalAuditSubmission?.submitted_by,
                  )}
                </p>
              </div>
            </>
          ) : null}

          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground">Created At</p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {utilityAccount.created_at
                ? new Date(utilityAccount.created_at).toLocaleDateString()
                : "-"}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground">Updated At</p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {utilityAccount.updated_at
                ? new Date(utilityAccount.updated_at).toLocaleDateString()
                : "-"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <ImageIcon className="h-5 w-5 text-primary" />
            Images & Documents
          </CardTitle>
        </CardHeader>

        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          {!canViewDocs ? (
            <p className="text-sm text-muted-foreground">
              Only super admin, admin, and manager can view uploaded documents.
            </p>
          ) : utilityAccount.documents?.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {utilityAccount.documents.map(
                (doc: UtilityDocument, index: number) => (
                  <div
                    key={index}
                    className="group overflow-hidden rounded-xl border border-border bg-muted/20"
                  >
                    {doc.fileType === "image" ? (
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <img
                          src={doc.fileUrl}
                          alt={doc.fileName || `Image ${index + 1}`}
                          className="h-32 w-full object-cover transition duration-200 group-hover:scale-105"
                        />
                      </a>
                    ) : (
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex h-32 flex-col items-center justify-center gap-2"
                      >
                        <FileText className="h-8 w-8 text-destructive" />
                        <p className="text-xs text-muted-foreground">PDF</p>
                      </a>
                    )}

                    <div className="space-y-1 p-2">
                      <p className="truncate text-xs font-medium text-foreground">
                        {doc.fileName || `File ${index + 1}`}
                      </p>

                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] text-muted-foreground">
                          {doc.uploadedAt
                            ? new Date(doc.uploadedAt).toLocaleDateString()
                            : "-"}
                        </p>

                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          download={doc.fileType === "pdf"}
                          className="text-xs text-primary hover:underline"
                        >
                          Open
                        </a>
                      </div>
                    </div>
                  </div>
                ),
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No documents uploaded.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

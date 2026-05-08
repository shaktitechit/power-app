"use client";

import { Fragment } from "react";

import { cn } from "@/lib/utils";
import { humanizeNestedKey } from "../audit-snapshot-utility-sidebar";
import {
  formatAuditSnapshotCellPreview,
  inferAuditSnapshotTabularColumns,
  nestedRecordsJsonPreview,
} from "../audit-snapshot-nested-records-table";

const MAX_FIELD_DEPTH = 8;

/** Same omissions as tabular audit tables — hide noisy id/meta fields in the document box. */
const SAFETY_BOX_OMIT_KEYS = new Set<string>([
  "documents",
  "created_at",
  "updated_at",
  "createdAt",
  "updatedAt",
]);

export function isAuditSnapshotPlainObject(
  v: unknown,
): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

function isIdLikeFieldKey(key: string): boolean {
  if (key.startsWith("__")) return true;
  if (key === "_id" || key === "id") return true;
  if (/_id$/i.test(key)) return true;
  return false;
}

function sortedDocumentKeys(obj: Record<string, unknown>): string[] {
  return Object.keys(obj)
    .filter((k) => !isIdLikeFieldKey(k) && !SAFETY_BOX_OMIT_KEYS.has(k))
    .sort((a, b) => a.localeCompare(b));
}

function isTabularObjectArray(value: unknown[]): boolean {
  if (value.length === 0) return false;
  return value.every((v) => v === null || isAuditSnapshotPlainObject(v));
}

function SafetyNestedObjectTable({
  rows,
}: {
  rows: Record<string, unknown>[];
}) {
  const cleanRows = rows.filter(isAuditSnapshotPlainObject);
  const cols = inferAuditSnapshotTabularColumns(cleanRows);

  if (!cols.length) {
    return (
      <pre className="max-h-[min(24vh,12rem)] overflow-auto whitespace-pre-wrap break-words rounded-lg border border-amber-500/20 bg-muted/15 p-2 font-mono text-[10px] leading-relaxed dark:border-amber-500/30">
        {nestedRecordsJsonPreview(cleanRows as unknown[])}
      </pre>
    );
  }

  return (
    <div className="max-h-[min(50vh,22rem)] overflow-auto rounded-lg border border-amber-500/30 bg-background/60 shadow-sm dark:border-amber-500/35">
      <table className="w-full min-w-[18rem] border-collapse text-xs">
        <thead className="sticky top-0 z-[1] bg-amber-100/95 shadow-sm dark:bg-amber-950/55">
          <tr className="border-b border-amber-500/30">
            {cols.map((c) => (
              <th
                key={c}
                className="whitespace-nowrap px-2 py-2 text-left font-semibold text-amber-950 dark:text-amber-50"
              >
                {humanizeNestedKey(c)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cleanRows.map((row, ri) => (
            <tr
              key={ri}
              className={cn(
                "border-b border-amber-500/10 transition-colors hover:bg-amber-500/[0.06] dark:border-amber-800/40 dark:hover:bg-amber-950/25",
                ri % 2 === 0 ? "bg-background/40" : "bg-amber-500/[0.02] dark:bg-amber-950/15",
              )}
            >
              {cols.map((c) => (
                <td
                  key={c}
                  className="max-w-[min(100vw,14rem)] px-2 py-1.5 align-top break-words text-foreground/95"
                >
                  <SafetyFieldValue value={row[c]} depth={1} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SafetyNestedDefinitionList({
  obj,
  depth,
}: {
  obj: Record<string, unknown>;
  depth: number;
}) {
  const keys = sortedDocumentKeys(obj);
  if (!keys.length) {
    return (
      <p className="text-xs italic text-muted-foreground">
        No display fields (identifiers omitted).
      </p>
    );
  }

  return (
    <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-[minmax(8rem,22%)_1fr]">
      {keys.map((k) => (
        <Fragment key={k}>
          <dt className="text-[11px] font-medium leading-snug text-amber-950/90 dark:text-amber-100/90">
            {humanizeNestedKey(k)}
          </dt>
          <dd className="min-w-0 text-xs leading-relaxed text-foreground">
            <SafetyFieldValue value={obj[k]} depth={depth} />
          </dd>
        </Fragment>
      ))}
    </dl>
  );
}

function SafetyFieldValue({
  value,
  depth,
}: {
  value: unknown;
  depth: number;
}) {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">—</span>;
  }

  if (depth >= MAX_FIELD_DEPTH) {
    return (
      <span className="break-all font-mono text-[10px] text-muted-foreground">
        {formatAuditSnapshotCellPreview(value)}
      </span>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-muted-foreground">—</span>;
    }
    if (isTabularObjectArray(value)) {
      const objs = value.filter(isAuditSnapshotPlainObject);
      return (
        <div className="space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {objs.length} row{objs.length === 1 ? "" : "s"}
          </p>
          <SafetyNestedObjectTable rows={objs} />
        </div>
      );
    }
    return (
      <ul className="list-inside list-disc space-y-0.5 text-[11px]">
        {value.map((item, i) => (
          <li key={i} className="break-words">
            {isAuditSnapshotPlainObject(item) ? (
              <SafetyNestedDefinitionList obj={item} depth={depth + 1} />
            ) : (
              formatAuditSnapshotCellPreview(item)
            )}
          </li>
        ))}
      </ul>
    );
  }

  if (isAuditSnapshotPlainObject(value)) {
    return (
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.03] p-3 dark:border-amber-500/25 dark:bg-amber-950/20">
        <SafetyNestedDefinitionList obj={value} depth={depth + 1} />
      </div>
    );
  }

  if (typeof value === "boolean") {
    return <span>{value ? "Yes" : "No"}</span>;
  }

  return (
    <span className="break-words">{formatAuditSnapshotCellPreview(value)}</span>
  );
}

type SafetyAuditSectionRecordsViewProps = {
  /** Sidebar / section label */
  sectionTitle: string;
  records: unknown[];
};

/**
 * Safety audits: one card per document with field list; nested object arrays render as tables.
 */
export function SafetyAuditSectionRecordsView({
  sectionTitle,
  records,
}: SafetyAuditSectionRecordsViewProps) {
  return (
    <div className="space-y-4" aria-label={humanizeNestedKey(sectionTitle)}>
      {records.map((rec, idx) => (
        <section
          key={idx}
          className={cn(
            "rounded-xl border border-amber-500/35 bg-gradient-to-b from-amber-500/[0.07] via-background to-background p-4 shadow-md shadow-amber-900/5 ring-1 ring-amber-500/15 dark:border-amber-500/28 dark:from-amber-950/35 dark:shadow-black/20 dark:ring-amber-400/10",
          )}
        >
          {records.length > 1 ? (
            <h3 className="mb-3 border-b border-amber-500/15 pb-2 text-xs font-semibold tracking-wide text-amber-950 dark:text-amber-100">
              Record {idx + 1} of {records.length}
            </h3>
          ) : (
            <h3 className="sr-only">{humanizeNestedKey(sectionTitle)}</h3>
          )}
          {isAuditSnapshotPlainObject(rec) ? (
            <SafetyNestedDefinitionList obj={rec} depth={0} />
          ) : (
            <pre className="max-h-[min(40vh,16rem)] overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-muted/20 p-3 font-mono text-[11px]">
              {formatAuditSnapshotCellPreview(rec)}
            </pre>
          )}
        </section>
      ))}
    </div>
  );
}

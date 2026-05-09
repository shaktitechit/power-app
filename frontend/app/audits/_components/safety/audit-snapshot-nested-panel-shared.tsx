"use client";

import {
  humanizeNestedKey,
  nestedRecordsJsonPreview,
} from "../shared/audit-snapshot-table-utils";

export function NestedDatasetExpectedArrayMessage({ title }: { title: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/30 px-3 py-8 text-center text-sm text-muted-foreground sm:px-4">
      Expected an array for <strong>{humanizeNestedKey(title)}</strong>.
    </div>
  );
}

export function NestedDatasetEmptyMessage({ title }: { title: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 px-3 py-10 text-center text-sm text-muted-foreground sm:px-4">
      No records for <strong>{humanizeNestedKey(title)}</strong>.
    </div>
  );
}

export function NestedDatasetRawJsonPanel({ data }: { data: unknown[] }) {
  return (
    <div className="max-h-[min(65vh,32rem)] min-h-0 min-w-0 overflow-auto rounded-lg border border-border [-webkit-overflow-scrolling:touch]">
      <pre className="min-w-0 whitespace-pre-wrap break-words p-3 font-mono text-xs leading-relaxed sm:p-4">
        {nestedRecordsJsonPreview(data)}
      </pre>
    </div>
  );
}


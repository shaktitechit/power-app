"use client";

import { humanizeNestedKey } from "./audit-snapshot-utility-sidebar";
import { nestedRecordsJsonPreview } from "./audit-snapshot-nested-records-table";

export function NestedDatasetExpectedArrayMessage({ title }: { title: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
      Expected an array for <strong>{humanizeNestedKey(title)}</strong>.
    </div>
  );
}

export function NestedDatasetEmptyMessage({ title }: { title: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
      No records for <strong>{humanizeNestedKey(title)}</strong>.
    </div>
  );
}

export function NestedDatasetRawJsonPanel({ data }: { data: unknown[] }) {
  return (
    <div className="max-h-[min(65vh,32rem)] min-h-0 min-w-0 overflow-auto rounded-lg border border-border">
      <pre className="min-w-0 whitespace-pre-wrap break-words p-4 font-mono text-xs leading-relaxed">
        {nestedRecordsJsonPreview(data)}
      </pre>
    </div>
  );
}


"use client";

import { cn } from "@/lib/utils";
import { humanizeNestedKey } from "./audit-snapshot-utility-sidebar";

export type NestedDatasetSpec = { key: string; label?: string; data: unknown };

/** Drop sidebar entries with no rows (arrays only). */
export function filterNestedDatasetsWithData(
  items: NestedDatasetSpec[],
): NestedDatasetSpec[] {
  return items.filter(
    (item) => Array.isArray(item.data) && item.data.length > 0,
  );
}

type AuditSnapshotNestedDataSidebarProps = {
  items: NestedDatasetSpec[];
  selectedKey: string;
  onSelectKey: (key: string) => void;
};

/** Vertical navigation for nested snapshot collections (replaces horizontal tabs). */
export function AuditSnapshotNestedDataSidebar({
  items,
  selectedKey,
  onSelectKey,
}: AuditSnapshotNestedDataSidebarProps) {
  if (!items.length) {
    return (
      <aside className="flex w-full max-h-[min(36vh,16rem)] shrink-0 flex-col border-border bg-muted/20 lg:max-h-none lg:h-full lg:w-52 lg:border-r">
        <div className="p-3 text-sm text-muted-foreground">
          No nested sections in this snapshot.
        </div>
      </aside>
    );
  }

  const resolvedKey =
    selectedKey && items.some((t) => t.key === selectedKey)
      ? selectedKey
      : items[0].key;

  return (
    <aside
      className={cn(
        "flex w-full max-h-[min(36vh,16rem)] shrink-0 flex-col border-border bg-muted/20 lg:h-full lg:max-h-none lg:w-56 lg:min-h-0 lg:border-r",
      )}
    >
      <div className="shrink-0 border-b border-border px-3 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Data sets
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {items.length} section{items.length === 1 ? "" : "s"}
        </p>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        {items.map((tab) => {
          const count = Array.isArray(tab.data) ? tab.data.length : 0;
          const active = tab.key === resolvedKey;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onSelectKey(tab.key)}
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground hover:bg-muted",
              )}
            >
              <span className="min-w-0 truncate font-medium">
                {tab.label ?? humanizeNestedKey(tab.key)}
              </span>
              <span
                className={cn(
                  "shrink-0 rounded-full px-1.5 py-px text-[10px] font-medium tabular-nums",
                  active
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted-foreground/15 text-muted-foreground",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

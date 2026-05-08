"use client";

import { cn } from "@/lib/utils";

export function getUtilityAccountId(utilityAccount: unknown): string {
  if (
    utilityAccount &&
    typeof utilityAccount === "object" &&
    "_id" in utilityAccount
  ) {
    return String((utilityAccount as { _id: unknown })._id);
  }
  return "";
}

export function getUtilityAccountNumber(utilityAccount: unknown): string {
  if (
    utilityAccount &&
    typeof utilityAccount === "object" &&
    "account_number" in utilityAccount &&
    typeof (utilityAccount as { account_number?: string }).account_number ===
      "string"
  ) {
    const n = (utilityAccount as { account_number: string }).account_number.trim();
    if (n) return n;
  }
  const id = getUtilityAccountId(utilityAccount);
  return id ? `ID · ${id.slice(-8)}` : "Account";
}

export function humanizeNestedKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

type AuditSnapshotUtilitySidebarProps = {
  items: Array<{ utility_account: unknown }>;
  selectedUtilityAccountId: string;
  onSelect: (utilityAccountId: string) => void;
  /** Total nested records per account (for subtitle badge). */
  recordTotals?: Record<string, number>;
};

export function AuditSnapshotUtilitySidebar({
  items,
  selectedUtilityAccountId,
  onSelect,
  recordTotals,
}: AuditSnapshotUtilitySidebarProps) {
  return (
    <aside
      className={cn(
        "flex w-full shrink-0 flex-col border-border bg-muted/20 lg:w-56 lg:border-r",
      )}
    >
      <div className="border-b border-border px-3 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Utility accounts
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {items.length} account{items.length === 1 ? "" : "s"}
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        {items.map((row) => {
          const id = getUtilityAccountId(row.utility_account);
          const label = getUtilityAccountNumber(row.utility_account);
          const total = id && recordTotals ? recordTotals[id] : undefined;
          const active = id === selectedUtilityAccountId;

          return (
            <button
              key={id || label}
              type="button"
              onClick={() => id && onSelect(id)}
              disabled={!id}
              className={cn(
                "flex w-full flex-col items-start gap-0.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground hover:bg-muted",
              )}
            >
              <span className="w-full truncate font-medium">{label}</span>
              {typeof total === "number" ? (
                <span
                  className={cn(
                    "text-xs tabular-nums",
                    active
                      ? "text-primary-foreground/90"
                      : "text-muted-foreground",
                  )}
                >
                  {total} record{total === 1 ? "" : "s"}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

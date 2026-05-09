"use client";

import { useMemo } from "react";
import { Columns3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useAuditExplorerExpanded } from "../audit-snapshot-explorer-layout-context";
import { humanizeNestedKey } from "./audit-snapshot-table-utils";

export type ColumnPickerToolbarProps = {
  allColumns: string[];
  visibleKeys: Set<string>;
  onToggleColumn: (col: string, checked: boolean) => void;
  onSelectAll: () => void;
  onDeselectAllButOne: () => void;
  /** Short suffix for nested datasets, e.g. " · Dg Audit Records". */
  variantLabel?: string;
  toolbarClassName?: string;
};

export function ColumnPickerToolbar({
  allColumns,
  visibleKeys,
  onToggleColumn,
  onSelectAll,
  onDeselectAllButOne,
  variantLabel,
  toolbarClassName,
}: ColumnPickerToolbarProps) {
  const auditExplorerExpanded = useAuditExplorerExpanded();
  const visibleCount = useMemo(() => {
    return allColumns.filter((c) => visibleKeys.has(c)).length;
  }, [allColumns, visibleKeys]);

  const allColumnsSelected =
    allColumns.length > 1 &&
    visibleCount === allColumns.length &&
    allColumns.every((c) => visibleKeys.has(c));

  return (
    <div
      className={cn(
        "flex shrink-0 flex-wrap items-center justify-end gap-2 px-2 py-1.5",
        toolbarClassName,
      )}
    >
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
          >
            <Columns3 className="size-3.5 shrink-0 opacity-70" />
            Columns
            {variantLabel ? (
              <span className="max-w-[10rem] truncate font-normal text-muted-foreground">
                {variantLabel}
              </span>
            ) : null}
            <span className="tabular-nums text-muted-foreground">
              ({visibleCount}/{allColumns.length})
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={cn(
            "flex w-[min(calc(100vw-1rem),20rem)] max-h-[min(70vh,22rem)] flex-col overflow-hidden p-0",
            auditExplorerExpanded && "z-[110]",
          )}
          align="end"
        >
          <div className="shrink-0 border-b border-border px-3 py-2">
            <p className="text-xs font-medium text-foreground">Visible columns</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              At least one column must stay selected. Deselect all collapses to
              the first column only.
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
            <div className="flex flex-col gap-0.5 p-2">
              {allColumns.map((col) => {
                const checked = visibleKeys.has(col);
                const onlyOne = checked && visibleCount <= 1;

                return (
                  <label
                    key={col}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/80",
                      onlyOne && "opacity-90",
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      disabled={onlyOne}
                      onCheckedChange={(v) => onToggleColumn(col, v === true)}
                      aria-label={humanizeNestedKey(col)}
                    />
                    <span className="min-w-0 flex-1 text-sm leading-snug">
                      {humanizeNestedKey(col)}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border p-2">
            {allColumnsSelected ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mr-auto h-8 text-xs"
                onClick={onDeselectAllButOne}
                aria-label="Deselect all columns except the first"
              >
                Deselect all
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={onSelectAll}
            >
              Select all
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

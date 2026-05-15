"use client";

import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface Column<T> {
  key?: string;
  header?: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  columns?: Column<T>[];
  data?: T[];
  onRowClick?: (row?: T) => void;
  emptyMessage?: string;
  className?: string;
  /** When true, shows a loading row instead of data (avoids layout shift on narrow screens). */
  loading?: boolean;
}

export function DataTable<T extends object>({
  columns = [],
  data = [],
  onRowClick,
  emptyMessage = "No data available",
  className,
  loading = false,
}: DataTableProps<T>) {
  return (
    <div
      className={cn(
        "w-full min-w-0 overflow-hidden rounded-lg border border-border bg-card",
        className,
      )}
    >
      <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    "whitespace-nowrap text-muted-foreground",
                    column.className,
                    column.hideOnMobile && "hidden sm:table-cell",
                  )}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={Math.max(columns.length, 1)}
                  className="h-24 text-center text-muted-foreground"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={Math.max(columns.length, 1)}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => (
                <TableRow
                  key={index}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "border-border",
                    onRowClick && "cursor-pointer hover:bg-muted/50",
                  )}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      className={cn(
                        column.className,
                        column.hideOnMobile && "hidden sm:table-cell",
                      )}
                    >
                      {column.render
                        ? column.render(row)
                        : (row[column.key as keyof T] as React.ReactNode)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
      </Table>
    </div>
  );
}

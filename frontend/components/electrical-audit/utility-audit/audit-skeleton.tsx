"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface AuditSectionSkeletonProps {
  /** Number of skeleton record cards to show. Defaults to 3. */
  rows?: number;
  /** Whether to show a header skeleton above the cards. Defaults to true. */
  showHeader?: boolean;
}

/**
 * Reusable skeleton loader for electrical-audit section components.
 *
 * Replaces the text-only "Loading xxx records..." pattern that previously
 * showed a blank screen with no visual feedback about the expected layout.
 *
 * Usage:
 *   if (isLoading) return <AuditSectionSkeleton rows={4} />;
 */
export function AuditSectionSkeleton({
  rows = 3,
  showHeader = true,
}: AuditSectionSkeletonProps) {
  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      )}

      {Array.from({ length: rows }).map((_, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <Card key={i} className="animate-pulse">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <Skeleton className="h-5 w-40" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20 rounded-md" />
              <Skeleton className="h-8 w-16 rounded-md" />
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((__, j) => (
                // eslint-disable-next-line react/no-array-index-key
                <div key={j} className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

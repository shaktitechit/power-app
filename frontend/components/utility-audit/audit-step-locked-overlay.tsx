"use client";

import { cn } from "@/lib/utils";

export function AuditStepLockedOverlay({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-10 cursor-not-allowed rounded-lg bg-background/55 backdrop-blur-[1px]",
        className,
      )}
      aria-hidden
    />
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { useFontScale } from "@/components/font-scale-provider";

export function FontSizeControl() {
  const { scale, increase, decrease, reset, canIncrease, canDecrease } = useFontScale();

  return (
    <div className="flex items-center gap-1 rounded-md border border-border bg-background/70 px-1 py-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={decrease}
        disabled={!canDecrease}
        aria-label="Decrease font size"
      >
        A-
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="h-7 px-2 text-xs"
        onClick={reset}
        aria-label="Reset font size"
      >
        {Math.round(scale * 100)}%
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={increase}
        disabled={!canIncrease}
        aria-label="Increase font size"
      >
        A+
      </Button>
    </div>
  );
}

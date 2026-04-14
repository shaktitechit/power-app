"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  count?: number;
  /** When true, shows a blue tick before the label (audit step submitted) */
  completed?: boolean;
  /** Rendered after the tab label (e.g. audit submit); not part of the tab click target */
  trailingAction?: ReactNode;
}

interface CustomTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
  /** Grid columns for the tab strip (default suits many tabs on utility account page) */
  tabGridClassName?: string;
}

export function CustomTabs({
  tabs,
  activeTab,
  onTabChange,
  className,
  tabGridClassName = "grid-cols-3 sm:grid-cols-4 lg:grid-cols-6",
}: CustomTabsProps) {
  return (
    <div className={cn("border-b border-border", className)}>
      <nav
        aria-label="Tabs"
        className={cn("grid gap-x-0", tabGridClassName)}
      >
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={cn(
              "flex min-w-0 items-stretch justify-center gap-0.5 border-b-2 sm:gap-1",
              activeTab === tab.id
                ? "border-primary"
                : "border-transparent",
            )}
          >
            <button
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "relative min-w-0 flex-1 px-1 py-2.5 text-center text-xs font-medium transition-colors sm:px-2 sm:py-3 sm:text-sm",
                activeTab === tab.id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="flex items-center justify-center gap-1.5 truncate sm:gap-2">
                {tab.completed ? (
                  <Check
                    className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400"
                    aria-hidden
                  />
                ) : null}
                <span className="truncate">{tab.label}</span>

                {tab.count !== undefined && (
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-1.5 py-0.5 text-xs sm:px-2",
                      activeTab === tab.id
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </span>
            </button>
            {tab.trailingAction ? (
              <div
                className="flex shrink-0 items-center pr-0.5 sm:pr-1"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                {tab.trailingAction}
              </div>
            ) : null}
          </div>
        ))}
      </nav>
    </div>
  );
}

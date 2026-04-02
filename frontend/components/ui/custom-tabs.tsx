"use client";

import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface CustomTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function CustomTabs({
  tabs,
  activeTab,
  onTabChange,
  className,
}: CustomTabsProps) {
  return (
    <div className={cn("border-b border-border", className)}>
      <nav
        aria-label="Tabs"
        className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "relative min-w-0 border-b-2 border-transparent px-2 py-2.5 text-center text-xs font-medium transition-colors sm:px-3 sm:py-3 sm:text-sm",
              activeTab === tab.id
                ? "border-primary text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="flex items-center justify-center gap-1.5 truncate sm:gap-2">
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
        ))}
      </nav>
    </div>
  );
}

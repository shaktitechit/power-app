import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  className,
}: StatsCardProps) {
  return (
    <Card className={cn("border-border bg-card", className)}>
      <CardContent className="p-3 sm:p-4 lg:p-6 flex items-center justify-center">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:h-10 sm:w-10 lg:h-12 lg:w-12">
          <Icon className="h-4 w-4 text-primary sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
        </div>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-1 sm:space-y-2">
            <p className="truncate text-xs font-medium text-muted-foreground sm:text-sm">
              {title}
            </p>
            <p className="text-xl font-bold text-card-foreground sm:text-2xl lg:text-3xl">
              {value}
            </p>
            {description && (
              <p className="truncate text-xs text-muted-foreground sm:text-sm">
                {description}
              </p>
            )}
            {trend && (
              <div className="flex flex-wrap items-center gap-1">
                <span
                  className={cn(
                    "text-xs font-medium sm:text-sm",
                    trend.isPositive ? "text-primary" : "text-destructive",
                  )}
                >
                  {trend.isPositive ? "+" : "-"}
                  {Math.abs(trend.value)}%
                </span>
                <span className="hidden text-xs text-muted-foreground sm:inline sm:text-sm">
                  vs last month
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

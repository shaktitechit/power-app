import { cn } from "@/lib/utils";

type StatusType =
  | "pending"
  | "in-progress"
  | "completed"
  | "approved"
  | "operational"
  | "maintenance"
  | "non-operational"
  | "active"
  | "inactive"
  | "standby"
  | "normal"
  | "warning"
  | "critical"
  | "running"
  | "idle"
  | "fault";

interface StatusBadgeProps {
  status?: StatusType;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className:
      "border-amber-500/40 bg-amber-500/15 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-200",
  },
  "in-progress": {
    label: "In Progress",
    className:
      "border-blue-500/40 bg-blue-500/15 text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/20 dark:text-blue-200",
  },
  completed: {
    label: "Completed",
    className: "bg-primary/20 text-primary border-primary/30",
  },
  approved: {
    label: "Approved",
    className: "bg-primary/20 text-primary border-primary/30",
  },
  operational: {
    label: "Operational",
    className: "bg-primary/20 text-primary border-primary/30",
  },
  maintenance: {
    label: "Maintenance",
    className:
      "border-amber-500/40 bg-amber-500/15 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-200",
  },
  "non-operational": {
    label: "Non-Operational",
    className: "bg-destructive/20 text-destructive border-destructive/30",
  },
  active: {
    label: "Active",
    className:
      "border-amber-500/40 bg-amber-500/15 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-200",
  },
  standby: {
    label: "StandBy",
    className: "bg-destructive/20 text-destructive border-destructive/30",
  },
  normal: {
    label: "Normal",
    className: "bg-primary/20 text-primary border-primary/30",
  },
  warning: {
    label: "Warning",
    className:
      "border-amber-500/40 bg-amber-500/15 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-200",
  },
  inactive: {
    label: "Inactive",
    className:
      "border-amber-500/40 bg-amber-500/15 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-200",
  },
  critical: {
    label: "Critical",
    className: "bg-destructive/20 text-destructive border-destructive/30",
  },
  running: {
    label: "Running",
    className: "bg-primary/20 text-primary border-primary/30",
  },
  idle: {
    label: "Idle",
    className:
      "border-amber-500/40 bg-amber-500/15 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-200",
  },
  fault: {
    label: "Fault",
    className: "bg-destructive/20 text-destructive border-destructive/30",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.className,
        className,
      )}
    >
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
      {config.label}
    </span>
  );
}

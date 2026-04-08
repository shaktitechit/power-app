"use client";

type PresenceStatus = "online" | "away" | "offline";

export function PresenceStatusCell({
  status = "offline",
}: {
  status?: PresenceStatus;
}) {
  const styles = {
    online: {
      dot: "bg-emerald-500",
      text: "text-emerald-700 dark:text-emerald-400",
      label: "Online",
    },
    away: {
      dot: "bg-amber-500",
      text: "text-amber-800 dark:text-amber-300",
      label: "Away",
    },
    offline: {
      dot: "bg-muted-foreground",
      text: "text-muted-foreground",
      label: "Offline",
    },
  };

  const current = styles[status];

  return (
    <div className="flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${current.dot}`} />
      <span className={`text-sm font-medium ${current.text}`}>
        {current.label}
      </span>
    </div>
  );
}

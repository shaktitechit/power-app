"use client";

type PresenceStatus = "online" | "away" | "offline";

export function PresenceStatusCell({
  status = "offline",
}: {
  status?: PresenceStatus;
}) {
  const styles = {
    online: {
      dot: "bg-green-500",
      text: "text-green-600",
      label: "Online",
    },
    away: {
      dot: "bg-yellow-500",
      text: "text-yellow-600",
      label: "Away",
    },
    offline: {
      dot: "bg-gray-400",
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

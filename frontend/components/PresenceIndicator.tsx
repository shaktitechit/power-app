"use client";

import React from "react";

type PresenceStatus = "online" | "away" | "offline";

interface PresenceIndicatorProps {
  status: PresenceStatus;
}

export default function PresenceIndicator({ status }: PresenceIndicatorProps) {
  const colors: Record<PresenceStatus, string> = {
    online: "bg-green-500",
    away: "bg-yellow-500",
    offline: "bg-muted-foreground",
  };

  const labels: Record<PresenceStatus, string> = {
    online: "Online",
    away: "Away",
    offline: "Offline",
  };

  return <div className={`h-3 w-3 rounded-full ${colors[status]}`} />;
}

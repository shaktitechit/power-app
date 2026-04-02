"use client";

import { useEffect, useState } from "react";
import { socket } from "@/lib/socket";

type PresenceStatus = "online" | "away" | "offline";
type PresenceMap = Record<string, PresenceStatus>;

export function usePresenceMap() {
  const [presenceMap, setPresenceMap] = useState<PresenceMap>({});

  useEffect(() => {
    const handleSnapshot = (data: PresenceMap) => {
      setPresenceMap(data || {});
    };

    const handleOnline = ({ userId }: { userId: string }) => {
      setPresenceMap((prev) => ({
        ...prev,
        [userId]: "online",
      }));
    };

    const handleAway = ({ userId }: { userId: string }) => {
      setPresenceMap((prev) => ({
        ...prev,
        [userId]: "away",
      }));
    };

    const handleOffline = ({ userId }: { userId: string }) => {
      setPresenceMap((prev) => ({
        ...prev,
        [userId]: "offline",
      }));
    };

    socket.on("presence-snapshot", handleSnapshot);
    socket.on("user-online", handleOnline);
    socket.on("user-away", handleAway);
    socket.on("user-offline", handleOffline);

    return () => {
      socket.off("presence-snapshot", handleSnapshot);
      socket.off("user-online", handleOnline);
      socket.off("user-away", handleAway);
      socket.off("user-offline", handleOffline);
    };
  }, []);

  return presenceMap;
}
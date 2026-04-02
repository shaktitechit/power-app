"use client";

import { useEffect } from "react";
import { socket } from "@/lib/socket";

export function useMyPresence(userId?: string) {
  useEffect(() => {
    if (!userId) return;

    socket.auth = { userId };

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("user-online");

    const heartbeat = setInterval(() => {
      socket.emit("heartbeat");
    }, 20000);

    const visibilityHandler = () => {
      if (document.hidden) {
        socket.emit("user-away");
      } else {
        socket.emit("user-online");
      }
    };

    const handleBeforeUnload = () => {
      socket.emit("user-offline");
    };

    document.addEventListener("visibilitychange", visibilityHandler);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", visibilityHandler);
      window.removeEventListener("beforeunload", handleBeforeUnload);

      // ❌ do not do this on route change
      // socket.emit("user-offline");
      // socket.disconnect();
    };
  }, [userId]);
}
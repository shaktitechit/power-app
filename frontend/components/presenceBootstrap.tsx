"use client";

import { useAppSelector } from "@/store/hooks";
import { useMyPresence } from "@/hooks/useMyPresence";

export default function PresenceBootstrap() {
  const user = useAppSelector((state) => state.auth.user);

  useMyPresence(user?._id);

  return null;
}

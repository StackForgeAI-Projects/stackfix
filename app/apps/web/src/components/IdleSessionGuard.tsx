"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "./AuthProvider";
import { toast } from "@/lib/toast";

const IDLE_MS = Number(process.env.NEXT_PUBLIC_IDLE_TIMEOUT_MS ?? 8 * 60 * 1000);

const ACTIVITY_EVENTS = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"] as const;

export function IdleSessionGuard() {
  const { user, logout } = useAuth();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user) return;

    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        toast.info("common.idleLogout");
        void logout();
      }, IDLE_MS);
    };

    resetTimer();

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, resetTimer, { passive: true });
    }

    const onVisibility = () => {
      if (document.visibilityState === "visible") resetTimer();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, resetTimer);
      }
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [user, logout]);

  return null;
}

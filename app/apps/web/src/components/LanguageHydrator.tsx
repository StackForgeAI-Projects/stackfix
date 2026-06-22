"use client";

import { useEffect } from "react";
import type { AppLanguage } from "@stackfix/utils";
import { setAppLanguage } from "@/lib/i18n";
import { useAuth } from "./AuthProvider";
import { api } from "@/lib/api";

export function LanguageHydrator() {
  const { user, loading } = useAuth();

  useEffect(() => {
    const stored = localStorage.getItem("stackfix_lang") as AppLanguage | null;
    if (stored) setAppLanguage(stored);
  }, []);

  useEffect(() => {
    if (loading || !user) return;
    if (localStorage.getItem("stackfix_lang")) return;

    let cancelled = false;
    void (async () => {
      try {
        const res = await api.org();
        const orgLang = (res.data as { language?: AppLanguage })?.language;
        if (!cancelled && orgLang) setAppLanguage(orgLang);
      } catch {
        // keep default English
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  return null;
}

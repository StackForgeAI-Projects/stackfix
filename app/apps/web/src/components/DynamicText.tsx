"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { AppLanguage } from "@stackfix/utils";
import { translateDynamic } from "@/lib/translate-client";

type DynamicTextProps = {
  text: string;
  className?: string;
  as?: "span" | "p";
};

/** Translates user/API text at display time. Do not use for chat message bodies. */
export function DynamicText({ text, className, as: Tag = "span" }: DynamicTextProps) {
  const { i18n } = useTranslation();
  const lang = i18n.language as AppLanguage;
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    if (lang === "en" || !text.trim()) {
      setDisplay(text);
      return;
    }
    let cancelled = false;
    void translateDynamic(text, lang).then((value) => {
      if (!cancelled) setDisplay(value);
    });
    return () => {
      cancelled = true;
    };
  }, [text, lang]);

  return <Tag className={className}>{display}</Tag>;
}

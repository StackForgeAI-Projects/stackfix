import { toast as sonner } from "sonner";
import type { AppLanguage } from "@stackfix/utils";
import i18n from "./i18n";
import { translateDynamic } from "./translate-client";

function resolveKey(message: string): string | null {
  if (!i18n.exists(message)) return null;
  return String(i18n.t(message));
}

function show(type: "success" | "error" | "info", message: string) {
  const keyed = resolveKey(message);
  if (keyed) {
    sonner[type](keyed);
    return;
  }
  const lang = i18n.language as AppLanguage;
  if (lang === "en") {
    sonner[type](message);
    return;
  }
  void translateDynamic(message, lang).then((translated) => sonner[type](translated));
}

export const toast = {
  success: (message: string) => show("success", message),
  error: (message: string) => show("error", message),
  info: (message: string) => show("info", message),
};

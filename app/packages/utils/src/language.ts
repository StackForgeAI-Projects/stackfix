export type AppLanguage = "en" | "rw" | "fr";

export const APP_LANGUAGES: Array<{ code: AppLanguage; labelKey: string }> = [
  { code: "en", labelKey: "settings.english" },
  { code: "rw", labelKey: "settings.kinyarwanda" },
  { code: "fr", labelKey: "settings.french" },
];

export function googleTranslateTarget(lang: AppLanguage): string | null {
  if (lang === "en") return null;
  return lang === "rw" ? "rw" : "fr";
}

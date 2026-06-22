import type { AppLanguage } from "@stackfix/utils";
import { apiFetch } from "./api";

const cache = new Map<string, string>();

/** Runtime translation for dynamic content (fault descriptions, API text). Chat bodies excluded at call sites. */
export async function translateDynamic(text: string, lang: AppLanguage): Promise<string> {
  if (lang === "en" || !text.trim()) return text;
  const key = `${lang}:${text}`;
  const hit = cache.get(key);
  if (hit) return hit;

  try {
    const res = await apiFetch<{ success: true; data: string[] }>("/api/v1/translate/batch", {
      method: "POST",
      body: JSON.stringify({ texts: [text], target: lang }),
    });
    const translated = res.data[0]?.trim();
    const result = translated && translated !== text ? translated : text;
    cache.set(key, result);
    return result;
  } catch {
    return text;
  }
}

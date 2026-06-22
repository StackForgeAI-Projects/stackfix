import type { AppLanguage } from "@stackfix/utils";
import { googleTranslateTarget } from "@stackfix/utils";

const cache = new Map<string, string>();
const TRANSLATE_URL = process.env.TRANSLATE_SERVICE_URL ?? "http://localhost:5001";

function cacheKey(text: string, target: string) {
  return `${target}:${text}`;
}

export async function translateTexts(texts: string[], target: AppLanguage): Promise<string[]> {
  const googleTarget = googleTranslateTarget(target);
  if (!googleTarget || texts.length === 0) return texts;

  const results: string[] = new Array(texts.length);
  const pending: { index: number; text: string }[] = [];

  texts.forEach((text, index) => {
    if (!text.trim()) {
      results[index] = text;
      return;
    }
    const cached = cache.get(cacheKey(text, googleTarget));
    if (cached) results[index] = cached;
    else pending.push({ index, text });
  });

  if (pending.length === 0) return results;

  const batchSize = 50;
  for (let i = 0; i < pending.length; i += batchSize) {
    const chunk = pending.slice(i, i + batchSize);
    try {
      const res = await fetch(`${TRANSLATE_URL}/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          texts: chunk.map((c) => c.text),
          target: googleTarget,
          source: "en",
        }),
      });

      if (!res.ok) {
        for (const { index, text } of chunk) results[index] = text;
        continue;
      }

      const body = (await res.json()) as { data?: string[] };
      const translations = body.data ?? [];
      chunk.forEach(({ index, text }, j) => {
        const translated = translations[j] ?? text;
        cache.set(cacheKey(text, googleTarget), translated);
        results[index] = translated;
      });
    } catch {
      for (const { index, text } of chunk) results[index] = text;
    }
  }

  return results;
}

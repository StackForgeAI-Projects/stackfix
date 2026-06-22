#!/usr/bin/env node
/**
 * Regenerate fr.json and rw.json from en.json (dev-only, run once when en.json changes).
 * Usage: node scripts/i18n-sync.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const LOCALES = path.join(ROOT, "apps/web/src/locales");
const TRANSLATE_URL = process.env.TRANSLATE_SERVICE_URL ?? "http://localhost:5001";
const CONCURRENCY = 3;
const TIMEOUT_MS = 30_000;

function flatten(obj, prefix = "") {
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    const pathKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") out[pathKey] = value;
    else if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(out, flatten(value, pathKey));
    }
  }
  return out;
}

function unflatten(flat) {
  const root = {};
  for (const [pathKey, value] of Object.entries(flat)) {
    const parts = pathKey.split(".");
    let node = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!node[part] || typeof node[part] !== "object") node[part] = {};
      node = node[part];
    }
    node[parts[parts.length - 1]] = value;
  }
  return root;
}

async function translateOne(text, target) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${TRANSLATE_URL}/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts: [text], target, source: "en" }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) throw new Error(String(res.status));
      const body = await res.json();
      return body.data?.[0]?.trim() || text;
    } catch {
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  return text;
}

async function poolTranslate(entries, target, onProgress) {
  const out = {};
  let done = 0;
  const queue = [...entries];

  async function worker() {
    while (queue.length) {
      const [key, text] = queue.shift();
      out[key] = await translateOne(text, target);
      done++;
      onProgress(done, entries.length);
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  return out;
}

async function buildLocale(target) {
  const en = JSON.parse(fs.readFileSync(path.join(LOCALES, "en.json"), "utf8"));
  const flat = flatten(en);
  const entries = Object.entries(flat);
  const out = await poolTranslate(entries, target, (done, total) => {
    process.stdout.write(`  ${target}: ${done}/${total}\r`);
  });
  const file = path.join(LOCALES, `${target}.json`);
  fs.writeFileSync(file, `${JSON.stringify(unflatten(out), null, 2)}\n`);
  console.log(`\nWrote ${target}.json (${entries.length} strings)`);
}

const health = await fetch(`${TRANSLATE_URL}/health`, { signal: AbortSignal.timeout(5000) }).catch(() => null);
if (!health?.ok) {
  console.error(`Translate service not reachable at ${TRANSLATE_URL}`);
  process.exit(1);
}

await buildLocale("fr");
await buildLocale("rw");

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Conditionally join Tailwind class names, deduplicating conflicting utilities.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Safe absolute URL resolver. Uses NEXT_PUBLIC_SITE_URL or falls back to a sensible default.
 */
export function absoluteUrl(path = "/"): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://stackfix.app";
  return new URL(path, base).toString();
}

/**
 * Lightweight runtime guard — true on client.
 */
export const isBrowser = typeof window !== "undefined";

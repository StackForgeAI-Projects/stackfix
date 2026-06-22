/**
 * MTN MoMo USSD code generation — SOP v1.0 §5.4 / §8.5
 * Format: *182*8*1*{AMOUNT}*{REFERENCE}#
 */
export function generateUssdCode(amountRwf: number, reference: string): string {
  const amount = Math.round(amountRwf);
  const ref = reference.replace(/[^0-9A-Za-z]/g, "").slice(0, 20);
  return `*182*8*1*${amount}*${ref}#`;
}

/** Rwanda phone validation — accepts +250, 250, or 07xxxxxxxx */
export function isValidRwandaPhone(phone: string): boolean {
  const normalized = phone.replace(/\s/g, "");
  return /^(\+250|250|0)?7[2389]\d{7}$/.test(normalized);
}

export function normalizeRwandaPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("250")) return digits;
  if (digits.startsWith("7") && digits.length === 9) return `250${digits}`;
  if (digits.startsWith("0") && digits.length === 10) return `250${digits.slice(1)}`;
  return digits;
}

export function formatRWF(amount: number): string {
  return new Intl.NumberFormat("en-RW", {
    style: "currency",
    currency: "RWF",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatRWFPlain(amount: number): string {
  return new Intl.NumberFormat("en-RW").format(amount);
}

/** Relative time label for activity feeds and notifications */
export function formatRelativeTime(date: Date | string): string {
  const then = new Date(date).getTime();
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000));

  if (diffSec < 60) return "Just now";

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;

  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** Chat bubble timestamp — date + time, modern compact label */
export function formatMessageTimestamp(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const time = d.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true });
  const day = new Date(now);
  day.setDate(day.getDate() - 1);

  if (d.toDateString() === now.toDateString()) return `Today at ${time}`;
  if (d.toDateString() === day.toDateString()) return `Yesterday at ${time}`;

  const datePart = d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(d.getFullYear() !== now.getFullYear() ? { year: "numeric" as const } : {}),
  });
  return `${datePart} · ${time}`;
}

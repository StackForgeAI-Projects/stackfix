import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

export function useRelativeTime(date: Date | string): string {
  const { t } = useTranslation();
  return relativeTimeLabel(t, date);
}

export function relativeTimeLabel(t: TFunction, date: Date | string): string {
  const then = new Date(date).getTime();
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000));

  if (diffSec < 60) return t("time.justNow");

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return t("time.minutesAgo", { count: diffMin });

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return t("time.hoursAgo", { count: diffHr });

  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return t("time.yesterday");
  if (diffDay < 7) return t("time.daysAgo", { count: diffDay });

  return new Date(date).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const REASON_KEYS: Record<string, string> = {
  "Mark as Under Repair first": "status.reason.underRepairFirst",
  "Mark as Completed first": "status.reason.completedFirst",
  "Follow the repair workflow step by step": "status.reason.followWorkflow",
  "Not available from current status": "status.reason.notAvailable",
  "Invoice must be paid first (Pay Before Service)": "status.reason.invoicePaidFirst",
  "Raise and collect payment first": "status.reason.raisePaymentFirst",
  "Payment required before pickup (Pay on Pickup)": "status.reason.pickupPaymentRequired",
  "Raise invoice and collect payment first": "status.reason.raiseInvoiceFirst",
};

export function translateStatusReason(t: TFunction, englishReason: string | null): string | null {
  if (!englishReason) return null;
  const key = REASON_KEYS[englishReason];
  return key ? t(key) : englishReason;
}

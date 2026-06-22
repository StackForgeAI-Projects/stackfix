"use client";

import { useRelativeTime } from "@/lib/format-i18n";

export function RelativeTime({ date }: { date: Date | string }) {
  return <>{useRelativeTime(date)}</>;
}

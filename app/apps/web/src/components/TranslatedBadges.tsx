"use client";

import { StatusBadge, PaymentStatusBadge } from "@stackfix/ui";
import type { TicketStatus } from "@stackfix/types";
import type { ComponentProps } from "react";
import { usePaymentStatusLabel, useTicketStatusLabel } from "@/lib/i18n-labels";

export function TranslatedStatusBadge({
  status,
  ...props
}: { status: TicketStatus } & Omit<ComponentProps<typeof StatusBadge>, "status" | "label">) {
  const label = useTicketStatusLabel(status);
  return <StatusBadge status={status} label={label} {...props} />;
}

export function TranslatedPaymentStatusBadge({
  status,
  ...props
}: { status: string } & Omit<ComponentProps<typeof PaymentStatusBadge>, "status" | "label">) {
  const label = usePaymentStatusLabel(status);
  return <PaymentStatusBadge status={status} label={label} {...props} />;
}

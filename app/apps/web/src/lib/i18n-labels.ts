import { useTranslation } from "react-i18next";
import type { TicketStatus } from "@stackfix/types";

export function useTimeGreeting(): string {
  const { t } = useTranslation();
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return t("dashboard.greetingMorning");
  if (hour >= 12 && hour < 17) return t("dashboard.greetingAfternoon");
  if (hour >= 17 && hour < 22) return t("dashboard.greetingEvening");
  return t("dashboard.greetingNight");
}

export function useTicketStatusLabel(status: TicketStatus): string {
  const { t } = useTranslation();
  return t(`status.ticket.${status}`);
}

export function usePaymentStatusLabel(status: string): string {
  const { t } = useTranslation();
  const key = `status.payment.${status}`;
  return t(key, { defaultValue: t("status.payment.unpaid") });
}

export function useRoleLabel(role?: string): string {
  const { t } = useTranslation();
  if (!role) return "";
  return t(`roles.${role}`, { defaultValue: role });
}

import type { UserNotificationType } from "@stackfix/types";

export type NotificationCategory = "all" | "messages" | "tickets" | "invoices" | "team" | "system";

export const NOTIFICATION_CATEGORIES: Array<{ id: NotificationCategory; label: string }> = [
  { id: "all", label: "All" },
  { id: "messages", label: "Messages" },
  { id: "tickets", label: "Tickets" },
  { id: "invoices", label: "Invoices" },
  { id: "team", label: "Team" },
  { id: "system", label: "System" },
];

const CATEGORY_TYPES: Record<Exclude<NotificationCategory, "all">, UserNotificationType[]> = {
  messages: ["message_new", "message_reply", "message_resolved"],
  tickets: ["ticket_status", "ticket_created"],
  invoices: ["invoice_created", "invoice_paid"],
  team: ["team_member"],
  system: ["system"],
};

export function notificationTypesForCategory(
  category: NotificationCategory,
): UserNotificationType[] | undefined {
  if (category === "all") return undefined;
  return CATEGORY_TYPES[category];
}

export function notificationCategoryLabel(category: NotificationCategory): string {
  return NOTIFICATION_CATEGORIES.find((c) => c.id === category)?.label ?? "All";
}

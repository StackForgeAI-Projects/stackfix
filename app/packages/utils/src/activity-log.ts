import type { ActivityAction } from "@stackfix/types";

export type ActivityCategory = "all" | "tickets" | "invoices" | "team" | "settings" | "messages" | "auth";

export const ACTIVITY_CATEGORIES: Array<{ id: ActivityCategory }> = [
  { id: "all" },
  { id: "tickets" },
  { id: "invoices" },
  { id: "team" },
  { id: "settings" },
  { id: "messages" },
  { id: "auth" },
];

const CATEGORY_ACTIONS: Record<Exclude<ActivityCategory, "all">, ActivityAction[]> = {
  tickets: [
    "ticket_created",
    "ticket_updated",
    "ticket_status_changed",
    "ticket_deleted",
    "ticket_note_added",
  ],
  invoices: [
    "invoice_created",
    "invoice_sent",
    "invoice_paid",
    "invoice_updated",
    "invoice_deleted",
  ],
  team: ["user_created", "user_updated", "user_deleted", "user_access_changed"],
  settings: ["org_updated"],
  messages: ["message_sent", "message_replied", "message_resolved"],
  auth: ["login"],
};

export function actionsForCategory(category: ActivityCategory): ActivityAction[] | null {
  if (category === "all") return null;
  return CATEGORY_ACTIONS[category];
}

import type { StaffMessageRequestType } from "@stackfix/types";

export function staffMessageRequestLabel(type: StaffMessageRequestType): string {
  const labels: Record<StaffMessageRequestType, string> = {
    general: "General",
    edit_ticket: "Edit ticket",
    delete_ticket: "Delete ticket",
  };
  return labels[type];
}

export function staffMessageStatusBadgeClass(status: "open" | "resolved"): string {
  return status === "open" ? "message-badge-open" : "message-badge-resolved";
}

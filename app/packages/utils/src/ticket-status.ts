import type { TicketStatus, UserRole } from "@stackfix/types";
import { isManager } from "./permissions";

/** Valid status transitions — SOP v1.0 §5.4 */
const TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  pending: ["under_repair", "cancelled"],
  under_repair: ["completed", "pending", "cancelled"],
  completed: ["picked_up", "cancelled"],
  picked_up: [],
  cancelled: [],
};

export function canTransitionTicketStatus(
  from: TicketStatus,
  to: TicketStatus,
  role: UserRole,
): boolean {
  if (from === to) return true;
  if (to === "cancelled") return isManager(role);
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTicketStatusTransition(
  from: TicketStatus,
  to: TicketStatus,
  role: UserRole,
): void {
  if (!canTransitionTicketStatus(from, to, role)) {
    throw new Error(`Invalid status transition: ${from} → ${to}`);
  }
}

/** Human-readable hint for why a status is unavailable in the dropdown. */
export function ticketStatusUnavailableReason(
  current: TicketStatus,
  target: TicketStatus,
  opts?: { paymentModel?: "pay_before" | "pay_on_pickup"; invoicePaid?: boolean; hasInvoice?: boolean },
): string | null {
  if (current === target) return null;
  if (!TRANSITIONS[current]?.includes(target) && target !== "cancelled") {
    if (current === "pending" && (target === "completed" || target === "picked_up")) {
      return "Mark as Under Repair first";
    }
    if (current === "under_repair" && target === "picked_up") {
      return "Mark as Completed first";
    }
    if (current === "pending" && target === "picked_up") {
      return "Follow the repair workflow step by step";
    }
    return "Not available from current status";
  }
  if (
    opts?.paymentModel === "pay_before" &&
    current === "pending" &&
    target === "under_repair" &&
    !opts.invoicePaid
  ) {
    return opts.hasInvoice ? "Invoice must be paid first (Pay Before Service)" : "Raise and collect payment first";
  }
  if (
    opts?.paymentModel === "pay_on_pickup" &&
    current === "completed" &&
    target === "picked_up" &&
    !opts.invoicePaid
  ) {
    return opts.hasInvoice ? "Payment required before pickup (Pay on Pickup)" : "Raise invoice and collect payment first";
  }
  return null;
}

/** All statuses shown in the ticket detail dropdown (backend validates transitions). */
export const TICKET_STATUS_OPTIONS: TicketStatus[] = [
  "pending",
  "under_repair",
  "completed",
  "picked_up",
];

export function getAllowedNextStatuses(
  current: TicketStatus,
  role: UserRole,
): TicketStatus[] {
  return TICKET_STATUS_OPTIONS.filter((s) => canTransitionTicketStatus(current, s, role));
}

/** Display label for UI */
export function ticketStatusLabel(status: TicketStatus): string {
  const labels: Record<TicketStatus, string> = {
    pending: "Pending",
    under_repair: "Under Repair",
    completed: "Completed",
    picked_up: "Picked Up",
    cancelled: "Cancelled",
  };
  return labels[status];
}

/** Pill badge classes — matches StackFix design system */
export function ticketStatusBadgeClass(status: TicketStatus): string {
  switch (status) {
    case "pending":
      return "status-badge-pending";
    case "under_repair":
      return "status-badge-under-repair";
    case "completed":
      return "status-badge-completed";
    case "picked_up":
      return "status-badge-picked-up";
    case "cancelled":
      return "status-badge-cancelled";
  }
}

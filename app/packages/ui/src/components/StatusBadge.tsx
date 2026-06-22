import type { TicketStatus } from "@stackfix/types";
import { ticketStatusBadgeClass, ticketStatusLabel } from "@stackfix/utils";
import { cn } from "../lib/utils";

export function StatusBadge({
  status,
  label,
  className,
  size = "sm",
}: {
  status: TicketStatus;
  label?: string;
  className?: string;
  size?: "sm" | "lg";
}) {
  return (
    <span
      className={cn(
        "font-bold uppercase tracking-wider shrink-0",
        size === "lg"
          ? "text-[11px] px-4 py-2 rounded-full tracking-[0.06em]"
          : "text-[10px] px-3 py-1.5 rounded-full tracking-[0.08em]",
        ticketStatusBadgeClass(status),
        className,
      )}
    >
      {label ?? ticketStatusLabel(status)}
    </span>
  );
}

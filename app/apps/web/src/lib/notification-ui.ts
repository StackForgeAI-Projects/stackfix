"use client";

import type { UserNotificationType } from "@stackfix/types";
import {
  Bell,
  CheckCircle2,
  FileText,
  MessageSquare,
  UserCog,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const notificationMeta: Record<
  UserNotificationType,
  { icon: LucideIcon; tint: string }
> = {
  message_new: { icon: MessageSquare, tint: "text-blue-700 bg-blue-100" },
  message_reply: { icon: MessageSquare, tint: "text-blue-700 bg-blue-100" },
  message_resolved: { icon: CheckCircle2, tint: "text-emerald-700 bg-emerald-100" },
  ticket_status: { icon: Wrench, tint: "text-amber-800 bg-amber-100" },
  ticket_created: { icon: Wrench, tint: "text-amber-800 bg-amber-100" },
  invoice_created: { icon: FileText, tint: "text-violet-700 bg-violet-100" },
  invoice_paid: { icon: CheckCircle2, tint: "text-emerald-700 bg-emerald-100" },
  team_member: { icon: UserCog, tint: "text-slate-700 bg-slate-100" },
  system: { icon: Bell, tint: "text-slate-700 bg-slate-100" },
};

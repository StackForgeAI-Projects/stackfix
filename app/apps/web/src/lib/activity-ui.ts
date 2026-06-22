import type { ActivityAction } from "@stackfix/types";
import {
  CheckCircle2,
  FileText,
  LogIn,
  MessageSquare,
  Settings,
  UserCog,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const activityMeta: Record<ActivityAction, { icon: LucideIcon; tint: string }> = {
  login: { icon: LogIn, tint: "text-slate-700 bg-slate-100" },
  ticket_created: { icon: Wrench, tint: "text-amber-800 bg-amber-100" },
  ticket_updated: { icon: Wrench, tint: "text-amber-800 bg-amber-100" },
  ticket_status_changed: { icon: Wrench, tint: "text-amber-800 bg-amber-100" },
  ticket_deleted: { icon: Wrench, tint: "text-red-700 bg-red-100" },
  ticket_note_added: { icon: Wrench, tint: "text-amber-800 bg-amber-100" },
  invoice_created: { icon: FileText, tint: "text-violet-700 bg-violet-100" },
  invoice_sent: { icon: FileText, tint: "text-violet-700 bg-violet-100" },
  invoice_paid: { icon: CheckCircle2, tint: "text-emerald-700 bg-emerald-100" },
  invoice_updated: { icon: FileText, tint: "text-violet-700 bg-violet-100" },
  invoice_deleted: { icon: FileText, tint: "text-red-700 bg-red-100" },
  user_created: { icon: UserCog, tint: "text-blue-700 bg-blue-100" },
  user_updated: { icon: UserCog, tint: "text-blue-700 bg-blue-100" },
  user_deleted: { icon: UserCog, tint: "text-red-700 bg-red-100" },
  user_access_changed: { icon: UserCog, tint: "text-blue-700 bg-blue-100" },
  org_updated: { icon: Settings, tint: "text-slate-700 bg-slate-100" },
  message_sent: { icon: MessageSquare, tint: "text-blue-700 bg-blue-100" },
  message_replied: { icon: MessageSquare, tint: "text-blue-700 bg-blue-100" },
  message_resolved: { icon: CheckCircle2, tint: "text-emerald-700 bg-emerald-100" },
};

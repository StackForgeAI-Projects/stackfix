"use client";

import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/components/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useTimeGreeting } from "@/lib/i18n-labels";
import { TranslatedStatusBadge } from "@/components/TranslatedBadges";
import { DynamicText } from "@/components/DynamicText";
import { formatRWFPlain, isManager } from "@stackfix/utils";
import Link from "next/link";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ChevronRight,
  Sparkles,
  Zap,
  Wallet,
  Smartphone,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TicketStatus } from "@stackfix/types";

export default function DashboardPage() {
  const { t } = useTranslation();
  const greeting = useTimeGreeting();
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.dashboard(),
    enabled: !!user && isManager(user.role),
  });

  const { data: ticketsRes } = useQuery({
    queryKey: ["tickets", "recent"],
    queryFn: () => api.tickets({ limit: "5" }),
  });

  const tickets = (ticketsRes?.data ?? []) as Array<{
    id: string;
    ticketNumber: string;
    status: TicketStatus;
    deviceType: string;
    deviceModel?: string;
    faultDescription: string;
    customer: { fullName: string };
    invoice?: { totalAmount: number; status: string };
  }>;

  const s = stats?.data;

  return (
    <AppShell>
      <div className="p-8 max-w-[1400px] mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight mb-1" suppressHydrationWarning>
            {greeting}, {user?.fullName?.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground">{t("dashboard.subtitle")}</p>
        </div>

        {user && isManager(user.role) && s && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: t("dashboard.totalRepairs"), value: String(s.totalTickets), icon: Clock },
              { label: t("dashboard.pending"), value: String(s.pending), icon: AlertCircle },
              { label: t("dashboard.underRepair"), value: String(s.underRepair), icon: WrenchIcon },
              { label: t("dashboard.completedToday"), value: String(s.completedToday), icon: CheckCircle2 },
            ].map((k) => {
              const Icon = k.icon;
              return (
                <div key={k.label} className="bg-card p-5 rounded-2xl border border-border shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-sm font-medium text-muted-foreground">{k.label}</p>
                    <div className="size-8 rounded-lg bg-muted grid place-items-center">
                      <Icon className="size-4 text-muted-foreground" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold tracking-tight">{k.value}</h3>
                </div>
              );
            })}

            <div className="bg-ink p-5 rounded-2xl shadow-sm relative overflow-hidden md:col-span-2 lg:col-span-1">
              <div className="absolute -top-12 -right-12 size-32 bg-brand/20 blur-3xl" />
              <div className="relative">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-sm font-medium text-white/60">{t("dashboard.totalRevenue")}</p>
                  <TrendingUp className="size-4 text-brand" />
                </div>
                <h3 className="text-3xl font-bold text-white tracking-tight">
                  RWF {formatRWFPlain(s.totalRevenue)}
                </h3>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold">{t("dashboard.recentTickets")}</h2>
              <Link href="/tickets" className="text-xs font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                {t("dashboard.viewAll")} <ChevronRight className="size-3" />
              </Link>
            </div>

            {tickets.length === 0 && (
              <div className="bg-card p-8 rounded-2xl border border-border text-center text-muted-foreground">
                {t("dashboard.emptyTickets")}
              </div>
            )}

            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/tickets/${ticket.id}`}
                className="group bg-card p-5 rounded-2xl border border-border shadow-sm hover:border-brand/40 hover:shadow-md transition-all flex items-center gap-5"
              >
                <div className="size-12 rounded-xl bg-muted grid place-items-center shrink-0">
                  <Smartphone className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <h4 className="font-bold truncate">{ticket.customer.fullName}</h4>
                    <TranslatedStatusBadge status={ticket.status} />
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    <span className="font-mono text-xs">{ticket.ticketNumber}</span> · {ticket.deviceModel ?? ticket.deviceType} · <DynamicText text={ticket.faultDescription} />
                  </p>
                </div>
                {ticket.invoice && (
                  <div className="text-right shrink-0 hidden sm:block">
                    <p className="font-bold">RWF {formatRWFPlain(Number(ticket.invoice.totalAmount))}</p>
                  </div>
                )}
              </Link>
            ))}
          </div>

          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-ink rounded-3xl p-6 text-white relative overflow-hidden">
              <div className="absolute -bottom-10 -right-10 size-40 bg-brand/15 blur-3xl" />
              <div className="relative">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="size-8 bg-brand rounded-full grid place-items-center">
                    <Sparkles className="size-4 text-ink" />
                  </div>
                  <h3 className="font-semibold">{t("dashboard.stackfixAi")}</h3>
                  <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-brand">{t("dashboard.soon")}</span>
                </div>
                <p className="text-sm text-white/70 leading-relaxed mb-4">{t("dashboard.aiHint")}</p>
              </div>
            </div>

            {user && isManager(user.role) && (
            <div className="bg-card rounded-3xl p-6 border border-border shadow-sm">
              <h3 className="font-bold mb-4">{t("dashboard.quickActions")}</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { labelKey: "nav.newTicket", icon: Zap, href: "/tickets/new" },
                  { labelKey: "nav.invoices", icon: Wallet, href: "/invoices" },
                  { labelKey: "nav.tickets", icon: Smartphone, href: "/tickets" },
                  { labelKey: "nav.payments", icon: TrendingUp, href: "/payments" },
                ].map((a) => {
                  const Icon = a.icon;
                  return (
                    <Link key={a.labelKey} href={a.href} className="p-3 rounded-xl bg-muted/50 hover:bg-brand/10 hover:text-brand border border-border transition-all flex flex-col gap-1.5">
                      <Icon className="size-4" />
                      <span className="text-xs font-semibold">{t(a.labelKey)}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function WrenchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

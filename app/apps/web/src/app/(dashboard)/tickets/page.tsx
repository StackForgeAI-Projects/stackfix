"use client";

import { AppShell } from "@/components/AppShell";
import { Pager } from "@/components/Pager";
import { useAuth } from "@/components/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { deviceDisplayName, deviceIconForType } from "@/lib/ticket-ui";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus, Search, SlidersHorizontal } from "lucide-react";
import { TranslatedStatusBadge, TranslatedPaymentStatusBadge } from "@/components/TranslatedBadges";
import type { TicketStatus } from "@stackfix/types";
import { useEffect, useMemo, useState, Suspense } from "react";
import { DynamicText } from "@/components/DynamicText";
import { RelativeTime } from "@/components/RelativeTime";
import {
  canFilterTicketsByUser,
  formatRWFPlain,
} from "@stackfix/utils";
import { useTranslation } from "react-i18next";

type TicketRow = {
  id: string;
  ticketNumber: string;
  status: TicketStatus;
  deviceType: string;
  deviceBrand?: string | null;
  deviceModel?: string | null;
  faultDescription: string;
  createdAt: string;
  customer: { fullName: string; phone: string };
  technician?: { fullName: string } | null;
  createdBy?: { id: string; fullName: string } | null;
  invoice?: { id: string; status: string; totalAmount: number } | null;
};

const FILTER_OPTIONS = ["all", "pending", "under_repair", "completed", "picked_up"] as const;

function TicketsPageContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [statusFilter, setStatusFilter] = useState<(typeof FILTER_OPTIONS)[number]>("all");
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [createdByFilter, setCreatedByFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setQuery(q);
  }, [searchParams]);

  const canFilterUsers = user ? canFilterTicketsByUser(user.role) : false;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["tickets", "all", createdByFilter, query],
    queryFn: () =>
      api.tickets({
        limit: "100",
        ...(createdByFilter !== "all" ? { createdBy: createdByFilter } : {}),
        ...(query.trim() ? { q: query.trim() } : {}),
      }),
    enabled: !authLoading && !!user,
  });

  const { data: usersData } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.users(),
    enabled: canFilterUsers && !authLoading && !!user,
  });

  const tickets = (data?.data ?? []) as TicketRow[];
  const teamUsers = (usersData?.data ?? []) as Array<{ id: string; fullName: string }>;

  const filtered = useMemo(() => {
    return tickets.filter((t) => statusFilter === "all" || t.status === statusFilter);
  }, [tickets, statusFilter]);

  const start = (page - 1) * pageSize;
  const visible = filtered.slice(start, start + pageSize);

  const statusCounts = useMemo(() => {
    const counts: Partial<Record<TicketStatus, number>> = {};
    for (const t of tickets) {
      counts[t.status] = (counts[t.status] ?? 0) + 1;
    }
    return counts;
  }, [tickets]);

  return (
    <AppShell>
      <div className="p-4 sm:p-8 max-w-[1400px] mx-auto">
        <div className="flex items-end justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-1">{t("tickets.title")}</h1>
            <p className="text-muted-foreground">{t("tickets.subtitle")}</p>
          </div>
          <Link
            href="/tickets/new"
            className="px-4 py-2.5 bg-brand text-ink rounded-xl font-bold text-sm flex items-center gap-1.5 hover:brightness-95 transition-all shrink-0"
          >
            <Plus className="size-4" /> {t("nav.newTicket")}
          </Link>
        </div>

        <div className="bg-card p-2 rounded-2xl border border-border flex items-center gap-2 mb-4">
          <div className="flex items-center gap-2 px-3 flex-1 min-w-0">
            <Search className="size-4 text-muted-foreground shrink-0" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder={t("tickets.searchPlaceholder")}
              className="bg-transparent outline-none text-sm flex-1 py-2 min-w-0 placeholder:text-muted-foreground"
            />
          </div>
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="px-3 py-2 rounded-xl bg-muted text-sm font-semibold shrink-0"
            >
              {t("tickets.clear")}
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1 flex-1 min-w-0">
            {FILTER_OPTIONS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => {
                  setStatusFilter(f);
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === f
                    ? "bg-ink text-white"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {f === "all" ? t("status.filterAll") : t(`status.ticket.${f}`)}
                {f !== "all" && (
                  <span className="ml-2 text-[10px] opacity-60">{statusCounts[f as TicketStatus] ?? 0}</span>
                )}
              </button>
            ))}
          </div>

          {canFilterUsers && (
            <div className="flex items-center gap-2 shrink-0">
              <SlidersHorizontal className="size-4 text-muted-foreground" aria-hidden />
              <select
                value={createdByFilter}
                onChange={(e) => {
                  setCreatedByFilter(e.target.value);
                  setPage(1);
                }}
                aria-label={t("tickets.filterByUser")}
                className="stackfix-form-input py-2 pl-3 pr-8 text-sm font-semibold min-w-[10.5rem] max-w-[14rem]"
              >
                <option value="all">{t("tickets.allUsers")}</option>
                {teamUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {isLoading && <p className="text-muted-foreground">{t("tickets.loading")}</p>}
        {isError && (
          <p className="text-red-600 text-sm">{t("tickets.loadError")}</p>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <div className="bg-card rounded-2xl border border-border p-12 text-center">
            <p className="text-muted-foreground mb-4">{t("tickets.empty")}</p>
            <Link href="/tickets/new" className="inline-flex px-4 py-2.5 bg-brand text-ink rounded-xl font-bold text-sm">
              {t("tickets.createFirst")}
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visible.map((ticket) => {
            const Icon = deviceIconForType(ticket.deviceType);
            return (
              <Link
                key={ticket.id}
                href={`/tickets/${ticket.id}`}
                className="bg-card p-5 rounded-2xl border border-border shadow-sm hover:border-brand/50 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-4 gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground font-mono">{t("tickets.ticketLabel")} {ticket.ticketNumber}</p>
                    <h4 className="font-bold text-lg mt-0.5 truncate">{ticket.customer.fullName}</h4>
                  </div>
                  <TranslatedStatusBadge status={ticket.status} />
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl mb-3">
                  <div className="size-10 rounded-lg bg-card grid place-items-center border border-border shrink-0">
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{deviceDisplayName(ticket)}</p>
                    <p className="text-xs text-muted-foreground truncate"><DynamicText text={ticket.faultDescription} /></p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs gap-2">
                  <span className="text-muted-foreground truncate">
                    <RelativeTime date={ticket.createdAt} />
                    {ticket.createdBy?.fullName
                      ? ` · ${t("tickets.createdBy")} ${ticket.createdBy.fullName.split(" ")[0]}`
                      : ""}
                  </span>
                  <div className="text-right shrink-0">
                    {ticket.invoice ? (
                      <>
                        <p className="font-bold text-sm text-foreground">
                          RWF {formatRWFPlain(Number(ticket.invoice.totalAmount))}
                        </p>
                        <TranslatedPaymentStatusBadge status={ticket.invoice.status} />
                      </>
                    ) : (
                      <p className="font-semibold text-muted-foreground">{t("tickets.noInvoice")}</p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {filtered.length > 0 && (
          <Pager
            page={page}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        )}
      </div>
    </AppShell>
  );
}

import i18n from "@/lib/i18n";

export default function TicketsPage() {
  return (
    <Suspense fallback={
      <AppShell>
        <div className="p-8">{i18n.t("common.loading")}</div>
      </AppShell>
    }>
      <TicketsPageContent />
    </Suspense>
  );
}

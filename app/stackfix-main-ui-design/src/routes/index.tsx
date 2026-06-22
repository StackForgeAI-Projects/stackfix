import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { tickets, statusColor, paymentColor, formatRWF } from "@/lib/mock";
import {
  Smartphone, Laptop, Tablet, Gamepad2, ArrowUpRight, TrendingUp,
  Clock, CheckCircle2, Wallet, AlertCircle, Sparkles, ChevronRight, Zap,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — StackFix" },
      { name: "description", content: "Daily operations overview for your repair workshop." },
    ],
  }),
  component: Dashboard,
});

const deviceIcon = {
  phone: Smartphone, laptop: Laptop, tablet: Tablet, console: Gamepad2,
} as const;

const kpis = [
  { label: "Total Repairs", value: "1,284", delta: "↑ 12% from last month", deltaColor: "text-brand", icon: Clock },
  { label: "Awaiting Payment", value: "RWF 84k", delta: "4 pending USSD prompts", deltaColor: "text-amber-600", icon: AlertCircle },
  { label: "Completed Today", value: "12", delta: "Avg turnaround 4.2h", deltaColor: "text-brand", icon: CheckCircle2 },
];

function Dashboard() {
  return (
    <AppShell>
      <div className="p-8 max-w-[1400px] mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight mb-1">Good morning, Kevin</h1>
          <p className="text-muted-foreground">Here's what's happening at your Kigali workshop today.</p>
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {kpis.map((k) => {
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
                <p className={`mt-3 text-xs font-medium ${k.deltaColor}`}>{k.delta}</p>
              </div>
            );
          })}

          {/* Brand revenue card */}
          <div className="bg-ink p-5 rounded-2xl shadow-sm relative overflow-hidden">
            <div className="absolute -top-12 -right-12 size-32 bg-brand/20 blur-3xl" />
            <div className="relative">
              <div className="flex items-start justify-between mb-3">
                <p className="text-sm font-medium text-white/60">Total Revenue</p>
                <div className="size-8 rounded-lg bg-brand/20 grid place-items-center">
                  <TrendingUp className="size-4 text-brand" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-white tracking-tight">
                RWF 1.2M
              </h3>
              <p className="mt-3 text-xs font-medium text-brand">Settled to MoMo · *182#</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Recent tickets */}
          <div className="col-span-12 lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold">Recent Tickets</h2>
              <Link to="/tickets" className="text-xs font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                View all <ChevronRight className="size-3" />
              </Link>
            </div>

            {tickets.slice(0, 5).map((t) => {
              const Icon = deviceIcon[t.deviceKind];
              return (
                <Link
                  key={t.id}
                  to="/tickets/$id" params={{ id: t.id }}
                  className="group bg-card p-5 rounded-2xl border border-border shadow-sm hover:border-brand/40 hover:shadow-md transition-all flex items-center gap-5"
                >
                  <div className="size-12 rounded-xl bg-muted grid place-items-center shrink-0">
                    <Icon className="size-5 text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <h4 className="font-bold truncate">{t.customer}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${statusColor(t.status)}`}>
                        {t.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      <span className="font-mono text-xs">{t.id}</span> · {t.device} · {t.fault}
                    </p>
                  </div>
                  <div className="text-right shrink-0 hidden sm:block">
                    <p className="font-bold">RWF {formatRWF(t.amount)}</p>
                    <p className={`text-xs font-semibold ${paymentColor(t.payment)}`}>{t.payment}</p>
                  </div>
                  <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-brand transition-colors hidden md:block" />
                </Link>
              );
            })}
          </div>

          {/* Right rail */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            {/* AI assistant */}
            <div className="bg-ink rounded-3xl p-6 text-white relative overflow-hidden">
              <div className="absolute -bottom-10 -right-10 size-40 bg-brand/15 blur-3xl" />
              <div className="relative">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="size-8 bg-brand rounded-full grid place-items-center">
                    <Sparkles className="size-4 text-ink" />
                  </div>
                  <h3 className="font-semibold">StackFix AI</h3>
                  <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-brand">Live</span>
                </div>
                <p className="text-sm text-white/70 leading-relaxed mb-4">
                  For SF-2904 (iPhone 13 Pro screen), I suggest checking the IC controller before bonding. Similar units in the last 30 days had a 22% IC failure rate.
                </p>
                <div className="flex gap-2">
                  <button className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold transition-all">
                    Apply Suggestion
                  </button>
                  <button className="px-3 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-semibold transition-all">
                    Ask AI
                  </button>
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="bg-card rounded-3xl p-6 border border-border shadow-sm">
              <h3 className="font-bold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "New Ticket", icon: Zap, to: "/tickets/new" },
                  { label: "Send Invoice", icon: Wallet, to: "/invoices" },
                  { label: "View Tickets", icon: Smartphone, to: "/tickets" },
                  { label: "Payments", icon: TrendingUp, to: "/payments" },
                ].map((a) => {
                  const Icon = a.icon;
                  return (
                    <Link key={a.label} to={a.to} className="p-3 rounded-xl bg-muted/50 hover:bg-brand/10 hover:text-brand border border-border transition-all flex flex-col gap-1.5">
                      <Icon className="size-4" />
                      <span className="text-xs font-semibold">{a.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

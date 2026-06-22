import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { tickets, statusColor, paymentColor, formatRWF, type TicketStatus } from "@/lib/mock";
import { Smartphone, Laptop, Tablet, Gamepad2, Search, Filter, Plus } from "lucide-react";
import { useState } from "react";
import { Pager } from "@/components/Pagination";

export const Route = createFileRoute("/tickets/")({
  head: () => ({ meta: [{ title: "Repair Tickets — StackFix" }] }),
  component: TicketsList,
});

const deviceIcon = { phone: Smartphone, laptop: Laptop, tablet: Tablet, console: Gamepad2 } as const;
const filters: ("All" | TicketStatus)[] = ["All", "Pending", "Under Repair", "Completed", "Picked Up"];

function TicketsList() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const filtered = tickets.filter(t =>
    (filter === "All" || t.status === filter) &&
    (q === "" ||
      t.customer.toLowerCase().includes(q.toLowerCase()) ||
      t.id.toLowerCase().includes(q.toLowerCase()) ||
      t.device.toLowerCase().includes(q.toLowerCase()) ||
      t.fault.toLowerCase().includes(q.toLowerCase()))
  );
  const start = (page - 1) * pageSize;
  const visible = filtered.slice(start, start + pageSize);

  return (
    <AppShell>
      <div className="p-8 max-w-[1400px] mx-auto">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-1">Repair Tickets</h1>
            <p className="text-muted-foreground">Manage and track all repair orders.</p>
          </div>
          <Link to="/tickets/new" className="px-4 py-2.5 bg-brand text-ink rounded-xl font-bold text-sm flex items-center gap-1.5 hover:brightness-95 transition-all">
            <Plus className="size-4" /> New Ticket
          </Link>
        </div>

        {/* Search */}
        <div className="bg-card p-2 rounded-2xl border border-border flex items-center gap-2 mb-4">
          <div className="flex items-center gap-2 px-3 flex-1">
            <Search className="size-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by Ticket ID, customer name, or device…"
              className="bg-transparent outline-none text-sm flex-1 py-2 placeholder:text-muted-foreground"
            />
          </div>
          {q && (
            <button onClick={() => setQ("")} className="px-3 py-2 rounded-xl bg-muted text-sm font-semibold flex items-center gap-1.5">
              <Filter className="size-3.5" /> Clear
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-thin">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
                filter === f ? "bg-ink text-white" : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
              {f !== "All" && (
                <span className="ml-2 text-[10px] opacity-60">
                  {tickets.filter((t) => t.status === f).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tickets grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visible.map((t) => {
            const Icon = deviceIcon[t.deviceKind];
            return (
              <Link
                key={t.id}
                to="/tickets/$id" params={{ id: t.id }}
                className="bg-card p-5 rounded-2xl border border-border shadow-sm hover:border-brand/50 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground font-mono">Ticket {t.id}</p>
                    <h4 className="font-bold text-lg mt-0.5">{t.customer}</h4>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${statusColor(t.status)}`}>
                    {t.status}
                  </span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl mb-3">
                  <div className="size-10 rounded-lg bg-card grid place-items-center border border-border">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{t.device}</p>
                    <p className="text-xs text-muted-foreground">{t.fault}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {t.createdAt} · {t.technician}
                  </span>
                  <div className="text-right">
                    <p className="font-bold text-sm text-foreground">RWF {formatRWF(t.amount)}</p>
                    <p className={`font-semibold ${paymentColor(t.payment)}`}>{t.payment}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <Pager
          page={page}
          pageSize={pageSize}
          total={filtered.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          options={[6, 12, 24, 48]}
        />
      </div>
    </AppShell>
  );
}

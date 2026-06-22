import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { tickets, formatRWF, paymentBadge } from "@/lib/mock";
import { Download, Calendar, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { Pager } from "@/components/Pagination";

export const Route = createFileRoute("/payments")({
  head: () => ({ meta: [{ title: "Payments — StackFix" }] }),
  component: Payments,
});

function Payments() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const start = (page - 1) * pageSize;
  const visible = tickets.slice(start, start + pageSize);

  return (
    <AppShell>
      <div className="p-8 max-w-[1400px] mx-auto">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Payments & Revenue</h1>
            <p className="text-muted-foreground">Track every transaction across MoMo, Airtel & cash.</p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2.5 bg-card border border-border rounded-xl font-semibold text-sm flex items-center gap-1.5 hover:bg-muted">
              <Calendar className="size-4" /> Last 14 days
            </button>
            <button className="px-4 py-2.5 bg-ink text-white rounded-xl font-semibold text-sm flex items-center gap-1.5">
              <Download className="size-4" /> Export
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {[
            { label: "Total Inflow", v: "RWF 4.8M", d: "+18%" },
            { label: "Pending USSD", v: "RWF 320k", d: "9 prompts" },
          ].map((k) => (
            <div key={k.label} className="bg-card p-5 rounded-2xl border border-border shadow-sm">
              <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">{k.label}</p>
              <p className="text-2xl font-bold mt-1">{k.v}</p>
              <p className="text-xs font-semibold mt-2 flex items-center gap-1 text-brand">
                <ArrowUpRight className="size-3" />
                {k.d}
              </p>
            </div>
          ))}
        </div>

        {/* Tx table */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="font-bold">Transaction Timeline</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-3 font-semibold">Customer</th>
                  <th className="px-6 py-3 font-semibold">Method</th>
                  <th className="px-6 py-3 font-semibold">Reference</th>
                  <th className="px-6 py-3 font-semibold">Date</th>
                  <th className="px-6 py-3 font-semibold text-right">Amount</th>
                  <th className="px-6 py-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visible.map((t, i) => (
                  <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-semibold">{t.customer}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase bg-muted">
                        {(start + i) % 2 === 0 ? "MTN MoMo" : "Airtel Money"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">TXN-{t.id.slice(-4)}A2{start + i}</td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">{t.createdAt}</td>
                    <td className="px-6 py-4 text-right font-bold">RWF {formatRWF(t.amount)}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${paymentBadge(t.payment)}`}>
                        {t.payment}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Pager
          page={page}
          pageSize={pageSize}
          total={tickets.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>
    </AppShell>
  );
}

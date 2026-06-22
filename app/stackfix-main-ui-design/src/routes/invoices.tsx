import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { tickets, formatRWF, paymentColor } from "@/lib/mock";
import { Download, Send, Printer, ChevronLeft } from "lucide-react";
import { useState } from "react";
import { Pager } from "@/components/Pagination";

export const Route = createFileRoute("/invoices")({
  head: () => ({ meta: [{ title: "Invoices — StackFix" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    ticket: typeof search.ticket === "string" ? search.ticket : undefined,
  }),
  component: Invoices,
});

function Invoices() {
  const { ticket: ticketId } = Route.useSearch();
  const navigate = useNavigate();
  const t = tickets.find((tk) => tk.id === ticketId) ?? tickets[0];
  const focused = Boolean(ticketId);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const start = (page - 1) * pageSize;
  const visible = tickets.slice(start, start + pageSize);

  const subtotal = t.amount;
  const vat = Math.round(subtotal * 0.18);
  const total = subtotal + vat;

  const select = (id: string | undefined) =>
    navigate({ to: "/invoices", search: id ? { ticket: id } : {} });

  return (
    <AppShell>
      <div className="p-4 sm:p-8 max-w-[1400px] mx-auto">
        <div className="flex items-end justify-between mb-6 gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
            <p className="text-muted-foreground">Generate, send, and track customer invoices.</p>
          </div>
          <div className="flex gap-2">
            <button className="px-3 sm:px-4 py-2.5 bg-card border border-border rounded-xl font-semibold text-sm flex items-center gap-1.5 hover:bg-muted">
              <Printer className="size-4" /> <span className="hidden sm:inline">Print</span>
            </button>
            <button className="px-3 sm:px-4 py-2.5 bg-card border border-border rounded-xl font-semibold text-sm flex items-center gap-1.5 hover:bg-muted">
              <Download className="size-4" /> PDF
            </button>
            <button className="px-3 sm:px-4 py-2.5 bg-brand text-ink rounded-xl font-bold text-sm flex items-center gap-1.5 hover:brightness-95">
              <Send className="size-4" /> <span className="hidden sm:inline">Send via SMS</span>
            </button>
          </div>
        </div>

        {focused && (
          <button
            onClick={() => select(undefined)}
            className="lg:hidden inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ChevronLeft className="size-4" /> All invoices
          </button>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Invoice list — hidden on mobile when focused */}
          <div className={`${focused ? "hidden lg:block" : ""}`}>
            <div className="space-y-2">
              {visible.map((tk) => {
                const active = tk.id === t.id;
                return (
                  <button
                    key={tk.id}
                    onClick={() => select(tk.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all ${
                      active ? "bg-card border-brand shadow-sm" : "bg-card/50 border-border hover:border-brand/30"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-mono text-xs text-muted-foreground">INV-{tk.id.replace("SF-", "")}</p>
                      <p className={`text-xs font-bold ${paymentColor(tk.payment)}`}>{tk.payment}</p>
                    </div>
                    <p className="font-semibold text-sm">{tk.customer}</p>
                    <p className="text-xs text-muted-foreground">RWF {formatRWF(tk.amount)} · {tk.createdAt}</p>
                  </button>
                );
              })}
            </div>
            <Pager
              page={page}
              pageSize={pageSize}
              total={tickets.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>

          {/* Invoice preview */}
          <div className={`bg-card rounded-3xl border border-border shadow-sm p-6 sm:p-8 lg:p-10 ${focused ? "lg:col-span-2" : "lg:col-span-2"}`}>
            <div className="flex items-start justify-between mb-8 pb-8 border-b border-border gap-4 flex-wrap">
              <div>
                <p className="text-xs font-mono text-muted-foreground mb-1">INVOICE</p>
                <h2 className="text-2xl font-bold tracking-tight">INV-{t.id.replace("SF-", "")}</h2>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">StackFix Workshop</p>
                <p className="text-sm font-semibold">KG 11 Ave, Kigali</p>
                <p className="text-xs text-muted-foreground">+250 788 000 000</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 mb-8">
              <div>
                <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2">Bill to</p>
                <p className="font-bold">{t.customer}</p>
                <p className="text-sm text-muted-foreground">{t.phone}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2">Device</p>
                <p className="font-bold">{t.device}</p>
                <p className="text-sm text-muted-foreground">{t.fault}</p>
              </div>
            </div>

            <table className="w-full mb-8">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                  <th className="py-2 font-semibold">Item</th>
                  <th className="py-2 font-semibold text-center">Qty</th>
                  <th className="py-2 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                <tr><td className="py-3">{t.fault}</td><td className="text-center">1</td><td className="text-right font-semibold">RWF {formatRWF(Math.round(subtotal * 0.8))}</td></tr>
                <tr><td className="py-3">Labor & diagnostics</td><td className="text-center">1</td><td className="text-right font-semibold">RWF {formatRWF(Math.round(subtotal * 0.2))}</td></tr>
              </tbody>
            </table>

            <div className="flex justify-end">
              <div className="w-full sm:w-72 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-semibold">RWF {formatRWF(subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">VAT (18%)</span><span className="font-semibold">RWF {formatRWF(vat)}</span></div>
                <div className="flex justify-between pt-3 border-t border-border text-lg font-bold"><span>Total</span><span>RWF {formatRWF(total)}</span></div>
              </div>
            </div>

            {/* USSD pay panel */}
            <div className="mt-8 p-6 bg-ink rounded-2xl text-white relative overflow-hidden">
              <div className="absolute -top-10 -right-10 size-40 bg-brand/15 blur-3xl" />
              <div className="relative">
                <p className="text-xs font-bold uppercase tracking-widest text-brand mb-2">Pay with Mobile Money</p>
                <p className="text-sm text-white/70 mb-4">Dial the USSD code below on the registered MoMo number to complete payment instantly.</p>
                <div className="bg-white/10 rounded-xl p-4 font-mono text-xl sm:text-2xl font-bold text-center break-all">
                  *182*8*1*{total}#
                </div>
                <button className="mt-6 w-full py-3 bg-brand text-ink font-bold rounded-xl hover:brightness-95">
                  Pay Now
                </button>
              </div>
            </div>

            <Link
              to="/tickets/$id"
              params={{ id: t.id }}
              className="mt-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="size-4" /> Back to ticket {t.id}
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

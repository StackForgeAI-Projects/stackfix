import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { tickets, statusColor, paymentColor, formatRWF } from "@/lib/mock";
import { ChevronLeft, Phone, Mail, Calendar, CheckCircle2, MessageSquare, Sparkles } from "lucide-react";

export const Route = createFileRoute("/tickets/$id")({
  head: ({ params }) => ({ meta: [{ title: `Ticket ${params.id} — StackFix` }] }),
  loader: ({ params }) => {
    const ticket = tickets.find((t) => t.id === params.id);
    if (!ticket) throw notFound();
    return { ticket };
  },
  component: TicketDetail,
  notFoundComponent: () => (
    <AppShell>
      <div className="p-12 text-center">
        <p className="text-muted-foreground">Ticket not found.</p>
      </div>
    </AppShell>
  ),
  errorComponent: ({ error }) => (
    <AppShell>
      <div className="p-12 text-center text-muted-foreground">{error.message}</div>
    </AppShell>
  ),
});

function TicketDetail() {
  const { ticket } = Route.useLoaderData();

  return (
    <AppShell>
      <div className="p-8 max-w-5xl mx-auto">
        <Link to="/tickets" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ChevronLeft className="size-4" /> Back
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-mono text-muted-foreground">TICKET ID</p>
            <h1 className="text-2xl font-bold tracking-tight">#{ticket.id}</h1>
          </div>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider ${statusColor(ticket.status)}`}>
            {ticket.status}
          </span>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Customer */}
            <section className="bg-card rounded-2xl p-6 border border-border shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Customer Information</h3>
              <h4 className="text-lg font-bold mb-3">{ticket.customer}</h4>
              <div className="space-y-1.5 text-sm">
                <p className="flex items-center gap-2"><Phone className="size-4 text-brand" /> {ticket.phone}</p>
                <p className="flex items-center gap-2"><Mail className="size-4 text-brand" /> customer@example.com</p>
              </div>
            </section>

            {/* Device */}
            <section className="bg-card rounded-2xl p-6 border border-border shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Device Information</h3>
              <p className="text-sm font-semibold">{ticket.device}</p>
              <p className="text-sm text-muted-foreground mb-4">{ticket.fault}</p>
              <div className="bg-muted/50 rounded-xl p-3 text-sm border border-border">
                Diagnostic notes from technician will appear here. Replace digitizer + IC controller check.
              </div>
              <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                <p className="flex items-center gap-2"><Calendar className="size-3.5" /> Received: {ticket.createdAt}</p>
                {ticket.status === "Completed" && (
                  <p className="flex items-center gap-2 text-brand"><CheckCircle2 className="size-3.5" /> Completed today · 14:22</p>
                )}
              </div>
            </section>

            {/* Status update */}
            <section className="bg-card rounded-2xl p-6 border border-border shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Update Repair Status</h3>
              <select defaultValue={ticket.status} className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm font-semibold mb-3 outline-none focus:border-brand">
                <option>Pending</option>
                <option>Under Repair</option>
                <option>Completed</option>
                <option>Picked Up</option>
              </select>
              <textarea rows={3} placeholder="Add internal notes (optional)" className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm outline-none focus:border-brand mb-3" />
              <button className="w-full py-3 bg-brand text-ink font-bold rounded-xl hover:brightness-95 transition-all">
                Update Status & Notify Customer
              </button>
            </section>
          </div>

          {/* Right rail */}
          <div className="space-y-6">
            <section className="bg-card rounded-2xl p-6 border border-border shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Payment</h3>
              <p className="text-3xl font-bold tracking-tight">RWF {formatRWF(ticket.amount)}</p>
              <p className={`text-sm font-semibold mt-1 ${paymentColor(ticket.payment)}`}>
                {ticket.payment}
              </p>
              <Link
                to="/invoices"
                search={{ ticket: ticket.id }}
                className="mt-4 block text-center w-full py-2.5 bg-ink text-white rounded-xl font-semibold text-sm hover:bg-ink/90"
              >
                View Invoice
              </Link>
            </section>

            <section className="bg-ink text-white rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute -bottom-10 -right-10 size-32 bg-brand/15 blur-3xl" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="size-4 text-brand" />
                  <h3 className="font-semibold text-sm">AI Summary</h3>
                </div>
                <p className="text-xs text-white/70 leading-relaxed">
                  Likely a 45-min repair. Required parts in stock. 92% of similar repairs were paid via MoMo on pickup.
                </p>
              </div>
            </section>

            <section className="bg-card rounded-2xl p-6 border border-border shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="size-4 text-brand" />
                <h3 className="font-semibold text-sm">Notifications sent</h3>
              </div>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li>SMS: Ticket created · {ticket.createdAt}</li>
                <li>WhatsApp: Status updated</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

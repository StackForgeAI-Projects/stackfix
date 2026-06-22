import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ChevronLeft, Sparkles, Upload, Phone } from "lucide-react";

export const Route = createFileRoute("/tickets/new")({
  head: () => ({ meta: [{ title: "New Repair — StackFix" }] }),
  component: NewTicket,
});

function NewTicket() {
  return (
    <AppShell>
      <div className="p-8 max-w-3xl mx-auto">
        <Link to="/tickets" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ChevronLeft className="size-4" /> Back to tickets
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">New Repair Ticket</h1>
          <p className="text-muted-foreground">Customer will receive an SMS notification when status changes.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <form className="lg:col-span-2 space-y-5 bg-card p-6 rounded-2xl border border-border shadow-sm" onSubmit={(e) => e.preventDefault()}>
            <Field label="Customer Name" required>
              <input className="form-input" placeholder="Full name" />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Phone Number" required hint="MTN MoMo or Airtel — used for SMS & USSD push.">
                <div className="relative">
                  <Phone className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input className="form-input pl-9" placeholder="+250 788 000 000" />
                </div>
              </Field>
              <Field label="Email">
                <input type="email" className="form-input" placeholder="optional" />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Device Type" required>
                <select className="form-input">
                  <option>Smartphone</option>
                  <option>Laptop</option>
                  <option>Tablet</option>
                  <option>Console</option>
                </select>
              </Field>
              <Field label="Device Model" required>
                <input className="form-input" placeholder="e.g. iPhone 13 Pro" />
              </Field>
            </div>

            <Field label="Fault Description">
              <textarea rows={3} className="form-input" placeholder="What's wrong with the device?" />
              <button type="button" className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline">
                <Sparkles className="size-3" /> Auto-suggest with AI
              </button>
            </Field>

            <Field label="Device Photo">
              <button type="button" className="w-full p-6 border-2 border-dashed border-border rounded-xl hover:border-brand/50 transition-colors flex flex-col items-center gap-2 text-muted-foreground">
                <Upload className="size-5" />
                <span className="text-sm font-semibold">Upload or drag image</span>
                <span className="text-xs">PNG, JPG up to 10MB</span>
              </button>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Estimated Cost (RWF)" required>
                <input type="number" className="form-input" placeholder="120,000" />
              </Field>
              <Field label="Payment Model" required>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border-2 border-brand bg-brand/5 text-sm font-semibold cursor-pointer">
                    <input type="radio" name="pay" defaultChecked className="sr-only" />
                    Pay on Pickup
                  </label>
                  <label className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-border text-sm font-semibold cursor-pointer hover:border-brand/40">
                    <input type="radio" name="pay" className="sr-only" />
                    Pay Before
                  </label>
                </div>
              </Field>
            </div>

            <button type="submit" className="w-full py-3.5 bg-brand text-ink font-bold rounded-xl hover:brightness-95 transition-all">
              Create Repair Ticket
            </button>
          </form>

          {/* AI side panel */}
          <div className="space-y-4">
            <div className="bg-ink text-white rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute -bottom-10 -right-10 size-32 bg-brand/15 blur-3xl" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="size-4 text-brand" />
                  <h3 className="font-semibold text-sm">AI Assist</h3>
                </div>
                <p className="text-xs text-white/70 mb-4 leading-relaxed">
                  As you fill the form, StackFix AI suggests fault descriptions, repair notes, and invoice line items based on the device type.
                </p>
                <div className="space-y-2">
                  {["Cracked screen — LCD intact", "Battery health below 80%", "Speaker grill replacement"].map((s) => (
                    <button key={s} className="w-full text-left text-xs px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Notifications</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-brand" /> SMS via MTN/Airtel</li>
                <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-brand" /> WhatsApp updates</li>
                <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-muted-foreground/40" /> Email (optional)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <style>{`.form-input { width: 100%; padding: 0.75rem 1rem; background: oklch(0.96 0.005 240 / 0.5); border: 1px solid var(--border); border-radius: 0.75rem; font-size: 0.875rem; outline: none; transition: all 0.15s; } .form-input:focus { border-color: var(--brand); box-shadow: 0 0 0 3px color-mix(in oklab, var(--brand) 20%, transparent); }`}</style>
    </AppShell>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-semibold mb-1.5 block">
        {label} {required && <span className="text-brand">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground mt-1.5">{hint}</p>}
    </div>
  );
}

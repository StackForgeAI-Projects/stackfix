import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useState, type ReactNode } from "react";
import { ChevronDown, Building2, Wallet, MessageSquare, Languages, Sparkles, Receipt, User } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — StackFix" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    open: typeof s.open === "string" ? s.open : undefined,
  }),
  component: Settings,
});

type Section = {
  id: string;
  icon: typeof Building2;
  title: string;
  desc: string;
  body: (close: () => void) => ReactNode;
};

const Field = ({ label, ...rest }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <label className="block">
    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
    <input
      {...rest}
      className="mt-1.5 w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm outline-none focus:border-brand"
    />
  </label>
);

const Toggle = ({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) => {
  const [on, setOn] = useState(defaultChecked ?? false);
  return (
    <button
      type="button"
      onClick={() => setOn(!on)}
      className="flex items-center justify-between w-full py-2"
    >
      <span className="text-sm">{label}</span>
      <span className={`relative w-10 h-6 rounded-full transition-colors ${on ? "bg-brand" : "bg-muted"}`}>
        <span className={`absolute top-0.5 left-0.5 size-5 bg-white rounded-full shadow transition-transform ${on ? "translate-x-4" : ""}`} />
      </span>
    </button>
  );
};

const Actions = ({ close }: { close: () => void }) => (
  <div className="flex gap-2 pt-4 mt-4 border-t border-border">
    <button onClick={close} className="flex-1 py-2.5 bg-muted rounded-xl text-sm font-semibold hover:bg-muted/80">
      Close
    </button>
    <button onClick={close} className="flex-1 py-2.5 bg-brand text-ink rounded-xl text-sm font-bold hover:brightness-95">
      Save changes
    </button>
  </div>
);

const sections: Section[] = [
  {
    id: "profile",
    icon: User,
    title: "Profile",
    desc: "Your account name, contact, and avatar",
    body: (close) => (
      <div className="space-y-3">
        <Field label="Full name" defaultValue="Kevin Eric" />
        <Field label="Email" type="email" defaultValue="kevin@stackfix.app" />
        <Field label="Phone" defaultValue="+250 788 000 000" />
        <Actions close={close} />
      </div>
    ),
  },
  {
    id: "workshop",
    icon: Building2,
    title: "Workshop Profile",
    desc: "Name, logo, address, contact info",
    body: (close) => (
      <div className="space-y-3">
        <Field label="Workshop name" defaultValue="StackFix Kigali" />
        <Field label="Address" defaultValue="KG 11 Ave, Kigali" />
        <Field label="Public phone" defaultValue="+250 788 000 000" />
        <Actions close={close} />
      </div>
    ),
  },
  {
    id: "momo",
    icon: Wallet,
    title: "Mobile Money",
    desc: "MTN MoMo and Airtel Money credentials",
    body: (close) => (
      <div className="space-y-3">
        <Field label="MTN MoMo merchant code" defaultValue="*182*8*1*MERCHANT#" />
        <Field label="Airtel Money till" defaultValue="500-RW-22918" />
        <Toggle label="Auto-reconcile MoMo callbacks" defaultChecked />
        <Actions close={close} />
      </div>
    ),
  },
  {
    id: "sms",
    icon: MessageSquare,
    title: "SMS & WhatsApp",
    desc: "Notification templates and triggers",
    body: (close) => (
      <div className="space-y-3">
        <Toggle label="Notify on ticket created" defaultChecked />
        <Toggle label="Notify on status change" defaultChecked />
        <Toggle label="Notify on payment received" defaultChecked />
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Default template</span>
          <textarea
            rows={3}
            defaultValue="Hello {customer}, your {device} repair is now {status}. — StackFix"
            className="mt-1.5 w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm outline-none focus:border-brand"
          />
        </label>
        <Actions close={close} />
      </div>
    ),
  },
  {
    id: "language",
    icon: Languages,
    title: "Language",
    desc: "English (Kinyarwanda toggle available)",
    body: (close) => (
      <div className="space-y-2">
        {["English", "Kinyarwanda", "Français"].map((lang, i) => (
          <label key={lang} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border hover:bg-muted/40 cursor-pointer">
            <input type="radio" name="lang" defaultChecked={i === 0} className="accent-brand" />
            <span className="text-sm font-medium">{lang}</span>
          </label>
        ))}
        <Actions close={close} />
      </div>
    ),
  },
  {
    id: "ai",
    icon: Sparkles,
    title: "AI Assistant",
    desc: "Suggestion preferences and history scope",
    body: (close) => (
      <div className="space-y-3">
        <Toggle label="Suggest fixes on new tickets" defaultChecked />
        <Toggle label="Auto-generate invoice line items" defaultChecked />
        <Toggle label="Use last 90 days of repair history" defaultChecked />
        <Actions close={close} />
      </div>
    ),
  },
  {
    id: "tax",
    icon: Receipt,
    title: "Tax & Invoicing",
    desc: "VAT rate, invoice number format",
    body: (close) => (
      <div className="space-y-3">
        <Field label="VAT rate (%)" type="number" defaultValue="18" />
        <Field label="Invoice prefix" defaultValue="INV-" />
        <Field label="Next invoice number" type="number" defaultValue="2910" />
        <Actions close={close} />
      </div>
    ),
  },
];

function Settings() {
  const search = Route.useSearch();
  const [openId, setOpenId] = useState<string | null>(search.open ?? null);

  return (
    <AppShell>
      <div className="p-4 sm:p-8 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Settings</h1>
        <p className="text-muted-foreground mb-8">Workspace preferences and integrations.</p>

        <div className="space-y-3">
          {sections.map((s) => {
            const Icon = s.icon;
            const isOpen = openId === s.id;
            return (
              <div
                key={s.id}
                className={`bg-card rounded-2xl border shadow-sm overflow-hidden transition-all ${
                  isOpen ? "border-brand/40" : "border-border"
                }`}
              >
                <button
                  onClick={() => setOpenId(isOpen ? null : s.id)}
                  className="w-full p-5 flex items-center justify-between gap-3 text-left hover:bg-muted/30 transition-colors"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`size-10 rounded-xl grid place-items-center shrink-0 ${isOpen ? "bg-brand text-ink" : "bg-muted text-muted-foreground"}`}>
                      <Icon className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold truncate">{s.title}</h3>
                      <p className="text-sm text-muted-foreground truncate">{s.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`hidden sm:inline text-sm font-semibold ${isOpen ? "text-brand" : "text-muted-foreground"}`}>
                      {isOpen ? "Close" : "Manage"}
                    </span>
                    <ChevronDown className={`size-4 transition-transform ${isOpen ? "rotate-180 text-brand" : "text-muted-foreground"}`} />
                  </div>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 border-t border-border bg-muted/20">
                    <div className="pt-4">{s.body(() => setOpenId(null))}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

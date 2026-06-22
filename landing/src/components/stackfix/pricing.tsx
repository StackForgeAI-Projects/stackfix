"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { TrialModal } from "./trial-modal";

type Cycle = "monthly" | "biannual" | "annual";

function fmtUsd(n: number) {
  return `$${n.toLocaleString("en-US")}`;
}

export function Pricing() {
  const [cycle, setCycle] = useState<Cycle>("biannual");
  const [trialOpen, setTrialOpen] = useState(false);

  const plans = [
    {
      key: "starter",
      name: "Starter",
      pitch: "For solo technicians and new workshops opening their first counter.",
      prices: { monthly: 12, biannual: 10, annual: 9 },
      features: [
        "Up to 30 tickets / month",
        "1 technician seat",
        "MoMo USSD payments (*182#)",
        "Customer SMS notifications",
        "Email & WhatsApp support",
      ],
      cta: "Start Free Trial",
      featured: false,
      trial: true,
    },
    {
      key: "growth",
      name: "Growth",
      pitch: "For established repair shops scaling their team across Kigali.",
      prices: { monthly: 32, biannual: 28, annual: 25 },
      features: [
        "Unlimited tickets",
        "Up to 10 technician seats",
        "StackFix AI diagnostics",
        "Advanced analytics & RRA-ready exports",
        "Priority WhatsApp support",
        "Custom shop branding",
      ],
      cta: "Start Free Trial",
      featured: true,
      trial: true,
    },
    {
      key: "enterprise",
      name: "Enterprise",
      pitch: "For multi-location service centers and authorised resellers.",
      prices: { monthly: 0, biannual: 0, annual: 0 },
      features: [
        "Multi-location workshops",
        "SSO & role-based access",
        "Dedicated success manager",
        "On-site staff training",
        "Custom integrations & API",
        "99.9% uptime SLA",
      ],
      cta: "Talk to sales",
      featured: false,
      trial: false,
    },
  ];

  const cycleMeta: Record<Cycle, { label: string; suffix: string; save?: string }> = {
    monthly: { label: "Monthly", suffix: "/ month" },
    biannual: { label: "6 months", suffix: "/ month", save: "10%" },
    annual: { label: "Yearly", suffix: "/ month", save: "20%" },
  };

  const billingNote: Record<Cycle, (p: number) => string> = {
    monthly: (p) => `Billed ${fmtUsd(p)} every month`,
    biannual: (p) => `Billed ${fmtUsd(p * 6)} every 6 Months`,
    annual: (p) => `Billed ${fmtUsd(p * 12)} Yearly`,
  };

  return (
    <section id="pricing" className="bg-surface/40 border-border/60 border-y py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="text-brand mb-3 text-xs tracking-[0.2em] uppercase">{`// pricing`}</p>
          <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
            Honest pricing. <span className="text-muted-foreground">No surprises.</span>
          </h2>
          <p className="text-muted-foreground mt-5">
            Start free for 1 Month. Cancel anytime. All plans include hosting, backups, updates and
            security. Commit longer and save more.
          </p>
        </div>

        <div className="mb-12 flex justify-center">
          <div className="glass grid w-full max-w-md grid-cols-3 rounded-full p-1 text-xs sm:max-w-lg sm:text-sm">
            {(["monthly", "biannual", "annual"] as Cycle[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCycle(c)}
                className={cn(
                  "inline-flex items-center justify-center gap-1 rounded-full px-2 py-2 whitespace-nowrap transition-colors sm:px-4",
                  cycle === c
                    ? "bg-brand text-brand-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {cycleMeta[c].label}
                {cycleMeta[c].save && cycle !== c && (
                  <span className="text-brand text-[10px] font-semibold">{cycleMeta[c].save}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => {
            const isEnterprise = plan.key === "enterprise";
            const price = plan.prices[cycle];
            const popular = plan.featured && cycle === "biannual";

            return (
              <div
                key={plan.key}
                className={`bg-background relative flex flex-col rounded-2xl border p-7 ${
                  plan.featured ? "border-brand/60 ring-brand" : "border-border"
                }`}
              >
                {plan.featured && (
                  <div className="bg-brand text-brand-foreground absolute -top-3 left-1/2 max-w-[calc(100%-1.5rem)] -translate-x-1/2 rounded-full px-4 py-1 text-[10px] font-bold tracking-wider whitespace-nowrap uppercase sm:text-xs">
                    {popular ? "Most popular · Best value" : "Most popular"}
                  </div>
                )}
                <h3 className="text-xl font-semibold">{plan.name}</h3>
                <p className="text-muted-foreground mt-2 min-h-[2.5rem] text-sm">{plan.pitch}</p>

                <div className="mt-6 flex items-baseline gap-2">
                  {isEnterprise ? (
                    <span className="text-4xl font-bold tracking-tight">Custom</span>
                  ) : (
                    <>
                      <span className="text-4xl font-bold tracking-tight">{fmtUsd(price)}</span>
                      <span className="text-muted-foreground text-sm">
                        {cycleMeta[cycle].suffix}
                      </span>
                    </>
                  )}
                </div>
                <p className="text-muted-foreground mt-1 min-h-[1rem] text-xs">
                  {isEnterprise ? "Tailored to your operation" : billingNote[cycle](price)}
                </p>

                <ul className="mt-6 flex-1 space-y-3 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check className="text-brand mt-0.5 h-4 w-4 shrink-0" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>

                {plan.trial ? (
                  <button
                    type="button"
                    onClick={() => setTrialOpen(true)}
                    className={`mt-7 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold ${
                      plan.featured ? "btn-brand" : "btn-ghost"
                    }`}
                  >
                    {plan.cta} <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <a
                    href="#contact"
                    className={`mt-7 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold ${
                      plan.featured ? "btn-brand" : "btn-ghost"
                    }`}
                  >
                    {plan.cta} <ArrowRight className="h-4 w-4" />
                  </a>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-muted-foreground mt-8 text-center text-xs">
          Prices in dollars. VAT exclusive. Mobile Money & bank transfer accepted.
        </p>
      </div>
      <TrialModal open={trialOpen} onOpenChange={setTrialOpen} />
    </section>
  );
}

"use client";

import { BarChart3, Bell, Sparkles, Users, Wallet, Wrench, type LucideIcon } from "lucide-react";
import { useStackfixLang } from "@/lib/stackfix-i18n";

export function Features() {
  const { t } = useStackfixLang();
  const icons: LucideIcon[] = [Wrench, Wallet, Users, Sparkles, BarChart3, Bell];

  return (
    <section id="features" className="py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-brand mb-3 text-xs tracking-[0.2em] uppercase">
              {`// ${t.features.tag.toLowerCase()}`}
            </p>
            <h2 className="text-4xl font-bold tracking-tight md:text-5xl">{t.features.title}</h2>
          </div>
          <p className="text-muted-foreground max-w-md">{t.features.sub}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {t.features.items.map((f, i) => {
            const Icon = icons[i] ?? Wrench;
            return (
              <div
                key={f.title}
                className="group bg-surface border-border hover:border-brand/40 rounded-2xl border p-7 transition-colors"
              >
                <div className="bg-brand/10 text-brand group-hover:bg-brand/20 mb-5 grid h-11 w-11 place-items-center rounded-xl transition-colors">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

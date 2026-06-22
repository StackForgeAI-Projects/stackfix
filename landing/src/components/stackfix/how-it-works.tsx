"use client";

import { useStackfixLang } from "@/lib/stackfix-i18n";

export function HowItWorks() {
  const { t } = useStackfixLang();

  return (
    <section id="how" className="bg-surface/40 border-border/60 border-y py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-14 max-w-2xl">
          <p className="text-brand mb-3 text-xs tracking-[0.2em] uppercase">{`// ${t.how.tag.toLowerCase()}`}</p>
          <h2 className="text-4xl font-bold tracking-tight md:text-5xl">{t.how.title}</h2>
          <p className="text-muted-foreground mt-5">{t.how.sub}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {t.how.steps.map((s) => (
            <div key={s.n} className="bg-background border-border rounded-2xl border p-6">
              <div className="text-brand mb-8 font-mono text-sm">
                {s.n} · {s.name}
              </div>
              <h3 className="mb-2 text-lg font-semibold">{s.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import { useStackfixLang } from "@/lib/stackfix-i18n";

export function Marquee() {
  const { t } = useStackfixLang();
  const row = [...t.marquee.items, ...t.marquee.items, ...t.marquee.items];

  return (
    <section className="bg-surface/40 border-border/60 border-y py-14">
      <p className="text-muted-foreground mb-6 text-center text-xs tracking-[0.2em] uppercase">
        {t.marquee.prefix}
      </p>
      <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
        <div className="marquee flex w-max gap-12 whitespace-nowrap">
          {row.map((item, i) => (
            <span
              key={i}
              className="text-muted-foreground inline-flex items-center gap-3 text-xl font-medium md:text-2xl"
            >
              {item}
              <span className="bg-brand/60 h-1.5 w-1.5 rounded-full" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

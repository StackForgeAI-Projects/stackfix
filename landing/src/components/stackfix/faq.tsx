"use client";

import { ChevronDown } from "lucide-react";
import { useStackfixLang } from "@/lib/stackfix-i18n";
import { cn } from "@/lib/utils";

export function Faq() {
  const { t } = useStackfixLang();

  return (
    <section id="faq" className="bg-surface/40 border-border/60 border-y py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center md:mb-14">
          <p className="text-brand mb-3 text-xs tracking-[0.2em] uppercase">{`// ${t.faq.tag.toLowerCase()}`}</p>
          <h2 className="text-4xl font-bold tracking-tight md:text-5xl">{t.faq.title}</h2>
          <p className="text-muted-foreground mt-5 text-base leading-relaxed">{t.faq.description}</p>
        </div>

        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
          {t.faq.items.map((item) => (
            <details
              key={item.question}
              name="stackfix-faq"
              className="group bg-background border-border open:border-brand/40 rounded-2xl border px-5 py-1 transition-colors sm:px-6"
            >
              <summary
                className={cn(
                  "flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left text-sm font-semibold sm:text-base",
                  "[&::-webkit-details-marker]:hidden",
                )}
              >
                <span>{item.question}</span>
                <ChevronDown
                  className="text-brand h-4 w-4 shrink-0 transition-transform duration-200 group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <p className="text-muted-foreground pb-5 text-sm leading-relaxed">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import Image from "next/image";
import { Smartphone } from "lucide-react";
import { useStackfixLang } from "@/lib/stackfix-i18n";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border bg-background/40 rounded-xl border px-4 py-3">
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}

export function ProductShowcase() {
  const { t } = useStackfixLang();

  return (
    <section id="product" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <p className="text-brand mb-3 text-xs tracking-[0.2em] uppercase">
            {`// ${t.product.tag.toLowerCase()}`}
          </p>
          <h2 className="text-4xl font-bold tracking-tight md:text-5xl">{t.product.title}</h2>
          <p className="text-muted-foreground mt-5">{t.product.sub}</p>
        </div>

        <div className="grid items-stretch gap-6 lg:grid-cols-5">
          <div className="bg-surface border-border relative overflow-hidden rounded-2xl border p-6 md:p-8 lg:col-span-3">
            <div className="text-muted-foreground mb-4 flex items-center gap-2 text-xs">
              <span className="bg-brand h-2 w-2 rounded-full" />
              {t.product.dashLabel}
            </div>
            <div className="ring-brand border-border overflow-hidden rounded-2xl border">
              <Image
                src="/stackfix/stackfix-dashboard.png"
                alt="StackFix dashboard showing repair tickets, revenue in RWF and workshop overview"
                width={1024}
                height={586}
                className="block h-auto w-full rounded-2xl"
              />
            </div>
            <div className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
              {t.product.stats.map((s) => (
                <Stat key={s.label} label={s.label} value={s.value} />
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-surface border-border flex h-full flex-col justify-between overflow-hidden rounded-2xl border p-6">
              <div>
                <div className="text-brand inline-flex items-center gap-2 text-xs font-semibold">
                  <Smartphone className="h-3.5 w-3.5" /> {t.product.mobileTag}
                </div>
                <h3 className="mt-3 text-xl font-semibold">{t.product.mobileTitle}</h3>
                <p className="text-muted-foreground mt-2 text-sm">{t.product.mobileDesc}</p>
              </div>
              <div
                className="ring-brand border-border relative mt-6 aspect-[516/512] w-full overflow-hidden rounded-2xl border"
                aria-label="StackFix mobile app preview"
              >
                <Image
                  src="/stackfix/stackfix-mobile.png"
                  alt="StackFix mobile repair tickets app for workshops in Rwanda"
                  fill
                  sizes="(max-width: 1024px) 100vw, 384px"
                  className="object-cover object-top"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

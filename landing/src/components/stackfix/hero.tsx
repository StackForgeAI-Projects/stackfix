"use client";

import Image from "next/image";
import { ArrowRight, Clock, ShieldCheck, Sparkles, Wallet, type LucideIcon } from "lucide-react";
import { useStackfixLang } from "@/lib/stackfix-i18n";

export function Hero() {
  const { t } = useStackfixLang();
  const trustIcons: LucideIcon[] = [ShieldCheck, Clock, Sparkles, Wallet];

  return (
    <section id="top" className="relative overflow-x-clip pt-36 pb-20 md:pt-44 md:pb-28">
      <div className="grid-bg pointer-events-none absolute inset-0" />
      <div className="relative mx-auto max-w-6xl px-6 text-center">
        <div className="glass text-muted-foreground fade-up inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs">
          <span className="bg-brand h-1.5 w-1.5 animate-pulse rounded-full" />
          {t.hero.tag}
        </div>
        <h1 className="fade-up mt-6 text-5xl leading-[1.02] font-bold tracking-tight md:text-7xl">
          {t.hero.headlineLine1}
          <br />
          <span className="text-brand-glow">{t.hero.headlineLine2}</span>
        </h1>
        <p className="fade-up text-muted-foreground mx-auto mt-6 max-w-2xl text-base md:text-lg">
          {t.hero.sub}
        </p>
        <div className="fade-up mt-9 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#contact"
            className="btn-brand inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold"
          >
            {t.hero.ctaPrimary} <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="#product"
            className="btn-ghost inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold"
          >
            {t.hero.ctaSecondary}
          </a>
        </div>
        <ul className="fade-up text-muted-foreground mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm">
          {t.hero.trust.map((label, i) => {
            const Icon = trustIcons[i] ?? ShieldCheck;
            return (
              <li key={label} className="inline-flex items-center gap-2">
                <Icon className="text-brand h-4 w-4" /> {label}
              </li>
            );
          })}
        </ul>

        <div className="fade-up relative mt-14 md:mt-20">
          <div className="pointer-events-none absolute -inset-x-10 -inset-y-10 bg-[radial-gradient(ellipse_at_center,color-mix(in_oklab,var(--brand)_28%,transparent),transparent_70%)] blur-2xl" />
          <div className="ring-brand bg-surface border-border relative overflow-hidden rounded-2xl border">
            <Image
              src="/stackfix/stackfix-dashboard.png"
              alt="StackFix dashboard showing repair tickets, Mobile Money revenue and AI suggestions"
              width={1024}
              height={586}
              className="block h-auto w-full rounded-2xl"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}

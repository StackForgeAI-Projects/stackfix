"use client";

import Image from "next/image";
import { Heart, Lock, ShieldCheck, Zap, type LucideIcon } from "lucide-react";
import { useStackfixLang } from "@/lib/stackfix-i18n";

export function Promises() {
  const { t } = useStackfixLang();
  const icons: LucideIcon[] = [Lock, Heart, Zap, ShieldCheck];

  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2">
        <div>
          <p className="text-brand mb-3 text-xs tracking-[0.2em] uppercase">{`// ${t.why.tag.toLowerCase()}`}</p>
          <h2 className="text-4xl font-bold tracking-tight md:text-5xl">{t.why.title}</h2>
          <p className="text-muted-foreground mt-5 max-w-md">{t.why.sub}</p>
          <div className="ring-brand border-border mt-8 overflow-hidden rounded-2xl border">
            <Image
              src="/stackfix/technician.jpg"
              alt="A Rwandan technician using StackFix at a Kigali workshop"
              width={1280}
              height={960}
              className="h-auto w-full"
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {t.why.items.map((item, idx) => {
            const Icon = icons[idx] ?? Lock;
            return (
              <div key={item.tag} className="bg-surface border-border rounded-2xl border p-6">
                <div className="text-brand flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
                  <Icon className="h-3.5 w-3.5" /> {item.tag}
                </div>
                <h3 className="mt-3 text-lg font-semibold">{item.title}</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

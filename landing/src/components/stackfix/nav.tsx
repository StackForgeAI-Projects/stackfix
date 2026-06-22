"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Globe, Menu } from "lucide-react";
import { useStackfixLang, type StackfixLang } from "@/lib/stackfix-i18n";
import { siteConfig } from "@/lib/site";
import {
  siteNavHeaderClass,
  siteNavLogoLinkClass,
  siteNavRowClass,
  siteNavScrolledBarClass,
  siteNavScrolledBarStyle,
} from "@/lib/site-nav-styles";
import { cn } from "@/lib/utils";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { BrandMark } from "./brand-mark";

const langs: { code: StackfixLang; label: string; full: string }[] = [
  { code: "en", label: "EN", full: "English" },
  { code: "fr", label: "FR", full: "Français" },
  { code: "rw", label: "RW", full: "Kinyarwanda" },
];

export function Nav() {
  const { lang, setLang, t } = useStackfixLang();
  const [scrolled, setScrolled] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const current = langs.find((l) => l.code === lang)!;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!langMenuRef.current?.contains(e.target as Node)) setLangOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <header className={siteNavHeaderClass}>
      <div
        className={cn(
          "transition-[padding] duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] motion-reduce:transition-none",
          scrolled ? "pt-0" : "px-4 pt-5 sm:px-6",
        )}
      >
        <div className={cn(!scrolled && "mx-auto max-w-7xl")}>
          <div
            className={cn(
              "transition-[margin,border-radius,box-shadow,padding] duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] motion-reduce:transition-none",
              scrolled ? siteNavScrolledBarClass : "glass rounded-full py-2 pr-2 pl-4 shadow-none sm:pl-5",
            )}
            style={scrolled ? siteNavScrolledBarStyle : undefined}
          >
            <div
              className={cn(siteNavRowClass, scrolled && "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8")}
            >
              <a
                href={siteConfig.links.stackforge}
                className={siteNavLogoLinkClass}
                aria-label={`${siteConfig.name} home`}
              >
                <BrandMark className="transition-transform duration-300 select-none group-hover:scale-[1.04]" />
              </a>

              <nav
                className={cn(
                  "hidden items-center gap-7 text-sm transition-colors md:flex",
                  scrolled ? "text-white/85" : "text-muted-foreground",
                )}
                aria-label="Primary"
              >
                {t.nav.links.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    className={cn(
                      "transition-colors",
                      scrolled ? "hover:text-white" : "hover:text-foreground",
                    )}
                  >
                    {l.label}
                  </a>
                ))}
              </nav>

              <div className="flex shrink-0 items-center gap-2">
                <div ref={langMenuRef} className="notranslate relative" translate="no" lang="en">
                  <button
                    type="button"
                    onClick={() => setLangOpen((o) => !o)}
                    aria-label="Change language"
                    aria-haspopup="menu"
                    aria-expanded={langOpen}
                    className={cn(
                      "focus-visible:ring-brand/60 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-2 text-xs font-medium transition focus:outline-none focus-visible:ring-2 sm:px-3",
                      scrolled
                        ? "border-white/30 text-white hover:bg-white/10"
                        : "border-border text-foreground hover:bg-surface/60",
                    )}
                  >
                    <Globe className="h-4 w-4" aria-hidden />
                    <span className="font-mono tracking-wider">{current.label}</span>
                  </button>
                  {langOpen && (
                    <div
                      role="menu"
                      aria-label="Language"
                      className="border-border bg-surface/95 absolute top-full right-0 z-[60] mt-2 w-44 rounded-2xl border p-1.5 shadow-xl backdrop-blur-md"
                    >
                      {langs.map((l) => (
                        <button
                          key={l.code}
                          type="button"
                          role="menuitemradio"
                          aria-checked={lang === l.code}
                          onClick={() => {
                            setLang(l.code);
                            setLangOpen(false);
                          }}
                          className="text-foreground hover:bg-brand/15 focus-visible:bg-brand/15 flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm transition focus:outline-none"
                        >
                          <span className="flex items-center gap-2">
                            <span className="text-brand font-mono text-xs">{l.label}</span>
                            <span lang="en">{l.full}</span>
                          </span>
                          {lang === l.code && <Check className="text-brand h-4 w-4" aria-hidden />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <a
                  href="#contact"
                  className={cn(
                    "btn-brand focus-visible:ring-brand/60 hidden items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold focus:outline-none focus-visible:ring-2 sm:inline-flex",
                    scrolled &&
                      "bg-background text-foreground hover:bg-brand hover:text-brand-foreground shadow-[0_0_30px_-6px_oklch(0_0_0/0.5)]",
                  )}
                >
                  {t.nav.cta} <ArrowRight className="h-4 w-4" />
                </a>

                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                  <SheetTrigger asChild>
                    <button
                      type="button"
                      aria-label={t.nav.menuOpen}
                      className={cn(
                        "focus-visible:ring-brand/60 inline-flex items-center justify-center rounded-full border p-2 transition focus:outline-none focus-visible:ring-2 md:hidden",
                        scrolled
                          ? "border-white/30 text-white hover:bg-white/10"
                          : "border-border text-foreground hover:bg-surface/60",
                      )}
                    >
                      <Menu className="h-5 w-5" />
                    </button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetTitle>{siteConfig.name}</SheetTitle>
                    <nav className="mt-10 flex flex-col gap-1" aria-label="Mobile primary">
                      {t.nav.links.map((l) => (
                        <SheetClose asChild key={l.href}>
                          <a
                            href={l.href}
                            className="text-foreground hover:bg-brand/10 hover:text-brand block rounded-xl px-4 py-3 text-base transition"
                          >
                            {l.label}
                          </a>
                        </SheetClose>
                      ))}
                    </nav>
                    <SheetClose asChild>
                      <a
                        href="#contact"
                        className="btn-brand mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold"
                      >
                        {t.nav.cta} <ArrowRight className="h-4 w-4" />
                      </a>
                    </SheetClose>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { useStackfixLang } from "@/lib/stackfix-i18n";
import { siteConfig } from "@/lib/site";
import { BrandMark } from "./brand-mark";

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: readonly { href: string; label: string; internal?: boolean }[];
}) {
  return (
    <div>
      <h4 className="mb-4 text-sm font-semibold">{title}</h4>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            {l.internal ? (
              <Link
                href={l.href}
                className="text-muted-foreground hover:text-brand text-sm transition-colors"
              >
                {l.label}
              </Link>
            ) : (
              <a
                href={l.href}
                className="text-muted-foreground hover:text-brand text-sm transition-colors"
              >
                {l.label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  const { t } = useStackfixLang();
  const product = t.nav.links.slice(0, 4);
  const company = [
    { href: siteConfig.links.stackforge, label: "StackForgeAI" },
    { href: `${siteConfig.links.stackforge}/#about`, label: "About" },
    { href: `${siteConfig.links.stackforge}/#products`, label: "Other products" },
    { href: `${siteConfig.links.stackforge}/#impact`, label: "Community impact" },
  ];
  const reach = [
    { href: `mailto:${t.contact.email}`, label: t.contact.email },
    { href: "tel:+250799486531", label: t.contact.phone },
    { href: "https://wa.me/250799486531", label: "WhatsApp" },
    { href: "#contact", label: t.nav.cta },
  ];

  return (
    <footer className="bg-background border-border/60 border-t">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <BrandMark />
            <p className="text-muted-foreground mt-4 max-w-xs text-sm">
              {t.footer.tagline}{" "}
              <Link href={siteConfig.links.stackforge} className="text-brand hover:underline">
                StackForgeAI
              </Link>
              .
            </p>
          </div>
          <FooterCol title={t.footer.product} links={product} />
          <FooterCol title={t.footer.company} links={company} />
          <FooterCol title={t.footer.reach} links={reach} />
        </div>
        <div className="border-border/60 text-muted-foreground mt-14 flex flex-wrap items-center justify-between gap-4 border-t pt-8 text-xs">
          <p>
            © {new Date().getFullYear()} StackFix · A StackForgeAI product. {t.footer.rights}
          </p>
          <p>
            {t.footer.madeWith} <span className="text-brand">♥</span> {t.footer.inKigali} 🇷🇼
          </p>
        </div>
      </div>
    </footer>
  );
}

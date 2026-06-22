import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";
import { stackfixSeoKeywords } from "@/lib/seo-keywords";
import { absoluteUrl } from "@/lib/utils";

export const GOOGLE_SITE_VERIFICATION =
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? "Y815Z5t3SCHw_ZCVKKcvYlhZiTrd9UPrEQFzw90RD04";

interface SeoOptions {
  absoluteTitle?: boolean;
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
}

export function buildMetadata(opts: SeoOptions = {}): Metadata {
  const title =
    opts.absoluteTitle && opts.title
      ? opts.title
      : opts.title
        ? `${opts.title} · ${siteConfig.name}`
        : siteConfig.fullName;
  const description = opts.description ?? siteConfig.description;
  const url = absoluteUrl(opts.path ?? "/");
  const ogImage = opts.image ?? siteConfig.ogImage;

  return {
    metadataBase: new URL(siteConfig.url),
    title,
    description,
    keywords: [...siteConfig.keywords],
    authors: [{ name: siteConfig.author.name, url: siteConfig.author.url }],
    creator: siteConfig.author.name,
    publisher: siteConfig.author.name,
    applicationName: siteConfig.name,
    referrer: "origin-when-cross-origin",
    robots: opts.noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
    verification: {
      google: GOOGLE_SITE_VERIFICATION,
    },
    alternates: {
      canonical: url,
      languages: {
        en: url,
        "en-GB": url,
        "en-US": url,
        "rw-RW": url,
        "fr-FR": url,
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: siteConfig.fullName,
        },
      ],
      locale: "en_GB",
      alternateLocale: ["en_US", "rw_RW", "fr_FR"],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    icons: {
      icon: [{ url: "/favicon.ico" }],
      apple: [{ url: "/favicon.ico" }],
    },
    category: "technology",
  };
}

export function buildStackfixMetadata(): Metadata {
  const meta = buildMetadata({
    absoluteTitle: true,
    title: siteConfig.seo.stackfix.title,
    description: siteConfig.seo.stackfix.description,
    path: "/",
    image: "/stackfix/stackfix-dashboard.png",
  });

  return {
    ...meta,
    keywords: [...stackfixSeoKeywords],
    openGraph: {
      ...meta.openGraph,
      title: siteConfig.seo.stackfix.title,
      description: siteConfig.seo.stackfix.description,
      images: [
        {
          url: absoluteUrl("/stackfix/stackfix-dashboard.png"),
          width: 1024,
          height: 586,
          alt: "StackFix repair management dashboard for workshops in Rwanda and Africa",
        },
      ],
    },
    twitter: {
      ...meta.twitter,
      title: siteConfig.seo.stackfix.title,
      description: siteConfig.seo.stackfix.description,
      images: [absoluteUrl("/stackfix/stackfix-dashboard.png")],
    },
  };
}

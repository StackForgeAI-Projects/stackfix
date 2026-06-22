import { stackfixSeoKeywords } from "@/lib/seo-keywords";

export const siteConfig = {
  name: "StackForgeAI",
  fullName: "StackFix | Repair App in Rwanda & Africa | Workshop & Ticket Management",
  domain: "stackfix.app",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://stackfix.app",
  description:
    "StackFix is the repair app built for Rwanda and Africa. Manage repair tickets, technicians, invoices and Mobile Money payments from one platform, for electronics shops, service centers and workshops in Kigali and across the continent.",
  keywords: stackfixSeoKeywords,
  seo: {
    stackfix: {
      title: "StackFix | Repair App in Rwanda & Africa | Workshop & Ticket Management",
      description:
        "StackFix is the repair app built for Rwanda and Africa. Manage repair tickets, technicians, invoices and Mobile Money payments from one platform, for electronics shops, service centers and workshops in Kigali and across the continent.",
    },
  },
  author: {
    name: "StackForgeAI",
    email: "hello@stackforgeai.africa",
    url: "https://stackforgeai.africa",
  },
  contact: {
    email: "hello@stackforgeai.africa",
    phone: process.env.NEXT_PUBLIC_PHONE_NUMBER ?? "+250799486531",
    phoneDisplay: process.env.NEXT_PUBLIC_PHONE_DISPLAY ?? "+250 799 486 531",
    whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "+250799486531",
    whatsappDisplay: process.env.NEXT_PUBLIC_WHATSAPP_DISPLAY ?? "+250 799 486 531",
    location: "Kigali, Rwanda",
  },
  links: {
    stackforge: "https://stackforgeai.africa",
    stackfix: "/",
    stackfixApp: "https://app.stackfix.app",
  },
  ogImage: "/stackfix/stackfix-dashboard.png",
} as const;

export type SiteConfig = typeof siteConfig;

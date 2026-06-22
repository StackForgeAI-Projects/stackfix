import { siteConfig } from "@/lib/site";
import {
  schemaAreaServedCountries,
  stackfixSchemaKnowsAbout,
  stackfixSeoKeywords,
} from "@/lib/seo-keywords";
import { stackfixFaqEntries } from "@/lib/stackfix-faq";
import { absoluteUrl } from "@/lib/utils";

function baseUrl(): string {
  return siteConfig.url.replace(/\/$/, "");
}

/** StackFix landing page WebPage + SoftwareApplication + FAQ + Breadcrumb JSON-LD. */
export function stackfixStructuredDataGraph(): Record<string, unknown> {
  const root = baseUrl();
  const orgId = `${root}/#organization`;
  const webId = `${root}/#website`;
  const pageId = `${root}/#webpage`;
  const productId = `${root}/#software`;
  const faqId = `${root}/#faq`;
  const breadcrumbId = `${root}/#breadcrumb`;
  const pageUrl = absoluteUrl("/");
  const dashboardImage = absoluteUrl("/stackfix/stackfix-dashboard.png");
  const mobileImage = absoluteUrl("/stackfix/stackfix-mobile.png");
  const stackforgeRoot = siteConfig.links.stackforge.replace(/\/$/, "");

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": orgId,
        name: siteConfig.author.name,
        url: stackforgeRoot,
        logo: absoluteUrl("/logo.png"),
        email: siteConfig.contact.email,
        telephone: siteConfig.contact.phone,
        address: {
          "@type": "PostalAddress",
          addressLocality: "Kigali",
          addressCountry: "RW",
        },
        sameAs: [stackforgeRoot],
      },
      {
        "@type": "WebSite",
        "@id": webId,
        name: siteConfig.name,
        url: pageUrl,
        publisher: { "@id": orgId },
        inLanguage: ["en", "rw", "fr"],
      },
      {
        "@type": "BreadcrumbList",
        "@id": breadcrumbId,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "StackForgeAI",
            item: stackforgeRoot,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "StackFix",
            item: pageUrl,
          },
        ],
      },
      {
        "@type": "WebPage",
        "@id": pageId,
        url: pageUrl,
        name: siteConfig.seo.stackfix.title,
        description: siteConfig.seo.stackfix.description,
        isPartOf: { "@id": webId },
        about: { "@id": productId },
        publisher: { "@id": orgId },
        breadcrumb: { "@id": breadcrumbId },
        inLanguage: ["en", "rw", "fr"],
        keywords: stackfixSeoKeywords.join(", "),
        primaryImageOfPage: {
          "@type": "ImageObject",
          url: dashboardImage,
          width: 1024,
          height: 586,
        },
      },
      {
        "@type": "SoftwareApplication",
        "@id": productId,
        name: "StackFix",
        alternateName: ["StackFix repair app", "StackFix Rwanda", "StackFix Africa"],
        description: siteConfig.seo.stackfix.description,
        applicationCategory: "BusinessApplication",
        applicationSubCategory: "Repair management software",
        operatingSystem: "Web, iOS, Android",
        url: pageUrl,
        downloadUrl: siteConfig.links.stackfixApp,
        provider: { "@id": orgId },
        featureList: [
          "Repair ticket management",
          "Technician assignment and tracking",
          "Mobile Money and MoMo USSD payments",
          "Customer SMS and WhatsApp notifications",
          "Invoicing and RRA-ready exports",
          "AI-assisted device diagnostics",
          "Multi-location workshop support",
        ],
        screenshot: [
          { "@type": "ImageObject", url: dashboardImage, caption: "StackFix dashboard" },
          { "@type": "ImageObject", url: mobileImage, caption: "StackFix mobile repair tickets" },
        ],
        keywords: stackfixSeoKeywords.join(", "),
        knowsAbout: stackfixSchemaKnowsAbout,
        audience: {
          "@type": "Audience",
          audienceType:
            "Repair shops, electronics service centers, phone repair businesses, workshops in Rwanda and Africa",
        },
        areaServed: [
          { "@type": "Place", name: "Africa" },
          { "@type": "Country", name: "Rwanda", identifier: "RW" },
          { "@type": "City", name: "Kigali" },
          ...schemaAreaServedCountries.slice(0, 12).map((code) => ({
            "@type": "Country",
            identifier: code,
          })),
        ],
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: "USD",
          lowPrice: "9",
          highPrice: "32",
          offerCount: 3,
          availability: "https://schema.org/InStock",
          url: `${pageUrl}#pricing`,
        },
      },
      {
        "@type": "FAQPage",
        "@id": faqId,
        isPartOf: { "@id": pageId },
        mainEntity: stackfixFaqEntries.map((entry) => ({
          "@type": "Question",
          name: entry.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: entry.answer,
          },
        })),
      },
    ],
  };
}

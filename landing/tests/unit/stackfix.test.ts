import { describe, expect, it } from "vitest";
import { stackfixDict } from "@/lib/stackfix-i18n";
import { siteConfig } from "@/lib/site";
import { buildStackfixMetadata } from "@/lib/seo";
import { stackfixFaqEntries } from "@/lib/stackfix-faq";
import { stackfixStructuredDataGraph } from "@/lib/schema";

describe("stackfix landing config", () => {
  it("exposes all three languages in the dictionary", () => {
    expect(Object.keys(stackfixDict).sort()).toEqual(["en", "fr", "rw"]);
  });

  it("has complete nav links for English", () => {
    expect(stackfixDict.en.nav.links).toHaveLength(6);
    expect(stackfixDict.en.nav.links.map((l) => l.href)).toEqual([
      "#features",
      "#product",
      "#how",
      "#pricing",
      "#faq",
      "#contact",
    ]);
  });

  it("uses the target hero headline copy", () => {
    expect(stackfixDict.en.hero.headlineLine1).toBe("Run your repair shop");
    expect(stackfixDict.en.hero.headlineLine2).toBe("like a tech company.");
    expect(stackfixDict.en.hero.ctaSecondary).toBe("See the product");
  });

  it("points site stackfix link to the landing page route", () => {
    expect(siteConfig.links.stackfix).toBe("/");
    expect(siteConfig.links.stackfixApp).toBe("https://app.stackfix.app");
  });

  it("builds stackfix metadata with Rwanda and Africa repair keywords", () => {
    const meta = buildStackfixMetadata();
    expect(meta.title).toBe(siteConfig.seo.stackfix.title);
    expect(meta.description).toBe(siteConfig.seo.stackfix.description);
    expect(meta.alternates?.canonical).toMatch(/\/$/);
    expect(meta.keywords).toContain("repair app in Rwanda");
    expect(meta.keywords).toContain("repair app in Africa");
  });

  it("emits expanded structured data for the stackfix page", () => {
    const graph = stackfixStructuredDataGraph();
    expect(graph["@context"]).toBe("https://schema.org");
    const nodes = graph["@graph"] as Record<string, unknown>[];
    expect(nodes.some((n) => n["@type"] === "WebPage")).toBe(true);
    expect(nodes.some((n) => n["@type"] === "SoftwareApplication")).toBe(true);
    expect(nodes.some((n) => n["@type"] === "FAQPage")).toBe(true);
    expect(nodes.some((n) => n["@type"] === "BreadcrumbList")).toBe(true);
    expect(nodes.some((n) => n["@type"] === "Organization")).toBe(true);
    expect(nodes.some((n) => n["@type"] === "WebSite")).toBe(true);
    const app = nodes.find((n) => n["@type"] === "SoftwareApplication") as Record<string, unknown>;
    expect(String(app.keywords)).toContain("repair app in Rwanda");
    const faq = nodes.find((n) => n["@type"] === "FAQPage") as {
      mainEntity: Array<{ name: string }>;
    };
    expect(faq.mainEntity).toHaveLength(stackfixFaqEntries.length);
    expect(faq.mainEntity[0]?.name).toBe(stackfixFaqEntries[0].question);
  });

  it("includes contact form feedback strings in every locale", () => {
    for (const lang of Object.keys(stackfixDict) as Array<keyof typeof stackfixDict>) {
      const contact = stackfixDict[lang].contact;
      expect(contact.formSent).toBeTruthy();
      expect(contact.formSending).toBeTruthy();
      expect(contact.formError).toBeTruthy();
      expect(contact.formNetworkError).toBeTruthy();
    }
  });

  it("includes mobile menu labels in every locale", () => {
    for (const lang of Object.keys(stackfixDict) as Array<keyof typeof stackfixDict>) {
      expect(stackfixDict[lang].nav.menuOpen).toBeTruthy();
      expect(stackfixDict[lang].nav.menuClose).toBeTruthy();
    }
  });

  it("uses no em dash in user-facing stackfix copy", () => {
    for (const lang of Object.values(stackfixDict)) {
      expect(JSON.stringify(lang)).not.toContain("—");
    }
  });
});

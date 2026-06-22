import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("StackFix landing page", () => {
  test("serves the landing page at the root route", async ({ page }) => {
    const response = await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Run your repair shop");
  });

  test("renders all major sections", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("#features")).toBeVisible();
    await expect(page.locator("#product")).toBeVisible();
    await expect(page.locator("#how")).toBeVisible();
    await expect(page.locator("#pricing")).toBeVisible();
    await expect(page.locator("#faq")).toBeVisible();
    await expect(page.locator("#contact")).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeVisible();
  });

  test("uses StackForgeAI logo linking to the company site", async ({ page }) => {
    await page.goto("/");
    const logoLink = page.locator("header").getByRole("link", { name: /StackForgeAI home/i });
    await expect(logoLink).toHaveAttribute("href", "https://stackforgeai.africa");
    const logo = logoLink.getByRole("img", { name: "StackForgeAI" });
    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute("src", /logo\.png/);
    await expect(page.locator("header")).not.toContainText("StackFix");
  });

  test("renders hero headline from translations", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Run your repair shop");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("like a tech company.");
  });

  test("crops mobile product preview to top half", async ({ page }) => {
    await page.goto("/#product");
    const preview = page.locator("#product").getByLabel("StackFix mobile app preview");
    await expect(preview).toBeVisible();
    await expect(preview).toHaveCSS("overflow", "hidden");
    const box = await preview.boundingBox();
    expect(box?.height).toBeGreaterThan(0);
    if (box) {
      expect(box.height / box.width).toBeLessThan(1.1);
    }
  });

  test("keeps pricing badge on one line", async ({ page }) => {
    await page.goto("/#pricing");
    const badge = page.getByText("Most popular · Best value");
    await expect(badge).toBeVisible();
    await expect(badge).toHaveCSS("white-space", "nowrap");
  });

  test("keeps billing cycle tabs on one line", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/#pricing");
    const yearlyTab = page.getByRole("button", { name: /Yearly/i });
    await expect(yearlyTab).toBeVisible();
    await expect(yearlyTab).toHaveCSS("white-space", "nowrap");
    const box = await yearlyTab.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.height).toBeLessThan(48);
    }
  });

  test("anchor nav scrolls to pricing", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Pricing" }).first().click();
    await expect(page).toHaveURL(/#pricing$/);
  });

  test("anchor nav scrolls to faq", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "FAQ" }).first().click();
    await expect(page).toHaveURL(/#faq$/);
    await expect(page.locator("#faq")).toBeInViewport();
  });

  test("language switcher changes locale label", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Change language" }).click();
    await page.getByRole("menuitemradio", { name: /Kinyarwanda/i }).click();
    await expect(page.getByRole("button", { name: "Change language" })).toContainText("RW");
  });

  test("mobile menu exposes navigation links", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
    await expect(
      page.locator("header").getByRole("link", { name: "Book a Free Demo" }),
    ).toBeHidden();
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(page.getByRole("navigation", { name: "Mobile primary" })).toBeVisible();
    await page
      .getByRole("navigation", { name: "Mobile primary" })
      .getByRole("link", { name: "Pricing" })
      .click();
    await expect(page).toHaveURL(/#pricing$/);
  });

  test("does not scroll horizontally on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const overflows = await page.evaluate(() => {
      const root = document.documentElement;
      return root.scrollWidth > root.clientWidth + 1;
    });
    expect(overflows).toBe(false);
  });

  test("trial modal opens from starter and growth plans", async ({ page }) => {
    await page.goto("/#pricing");
    const trialButtons = page.getByRole("button", { name: /Start Free Trial/i });
    await expect(trialButtons).toHaveCount(2);

    await trialButtons.first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Start your free trial/i })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();

    await trialButtons.last().click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("contact form submits to API and shows success alert", async ({ page }) => {
    await page.route("**/api/contact", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, id: "test-id" }),
      });
    });

    await page.goto("/#contact");
    await page
      .getByLabel("StackFix demo request form")
      .getByPlaceholder("Kevin Ganza")
      .fill("Kevin Ganza");
    await page.getByPlaceholder("FixHub Nyarugenge").fill("FixHub Nyarugenge");
    await page.getByPlaceholder("you@shop.rw").fill("demo@shop.rw");
    await page.getByRole("button", { name: /Send message/i }).click();

    await expect(
      page.getByText(/Message sent ✓ We'll get back to you within 48 hours\./),
    ).toBeVisible();
  });

  test("no critical accessibility violations on stackfix", async ({ page }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const critical = results.violations.filter((v) => v.impact === "critical");
    expect(critical).toEqual([]);
  });
});

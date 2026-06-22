import { describe, expect, it } from "vitest";
import {
  buildContactPlainText,
  contactFromToMisconfigured,
  formatContactReplyTo,
  mapContactSendError,
  resolveContactFromEmail,
  sanitizeDisplayName,
} from "@/lib/contact-email-content";
import { buildStackfixContactMessage } from "@/lib/submit-contact-form";

describe("contact email content", () => {
  it("sanitizes display names for headers", () => {
    expect(sanitizeDisplayName("Jane\r\nO'Neill")).toBe("JaneO'Neill");
    expect(sanitizeDisplayName("   ")).toBe("Website visitor");
  });

  it("formats Reply-To with display name", () => {
    expect(formatContactReplyTo("Jane Doe", "jane@example.com")).toBe(
      "Jane Doe <jane@example.com>",
    );
  });

  it("builds a plain-text body with message and reply hint", () => {
    const text = buildContactPlainText({
      name: "Jane",
      email: "jane@example.com",
      company: "Acme",
      message: "Hello there",
      ip: "1.2.3.4",
    });
    expect(text).toContain("StackForgeAI · New website enquiry");
    expect(text).toContain("Jane <jane@example.com>");
    expect(text).toContain("Company: Acme");
    expect(text).toContain("Hello there");
    expect(text).toContain("Reply to this email");
    expect(text).toContain("IP: 1.2.3.4");
  });

  it("builds StackFix demo plain-text heading", () => {
    const text = buildContactPlainText({
      name: "Kevin",
      email: "you@shop.rw",
      company: "FixHub",
      phone: "+250 788 000 000",
      message: "StackFix demo request.",
      source: "stackfix",
    });
    expect(text).toContain("StackForgeAI · New StackFix demo request");
    expect(text).toContain("Phone/WhatsApp: +250 788 000 000");
  });

  it("detects misconfigured From/To on the same mailbox", () => {
    expect(
      contactFromToMisconfigured(
        "StackForgeAI <hello@stackforgeai.africa>",
        "hello@stackforgeai.africa",
      ),
    ).toBe(true);
    expect(
      contactFromToMisconfigured(
        "StackForgeAI Contact Form <contact@stackforgeai.africa>",
        "hello@stackforgeai.africa",
      ),
    ).toBe(false);
  });

  it("resolves verified sender when configured From matches To or uses send subdomain", () => {
    const verified = "StackForgeAI Contact Form <contact@stackforgeai.africa>";
    expect(resolveContactFromEmail("hello@stackforgeai.africa", "hello@stackforgeai.africa")).toBe(
      verified,
    );
    expect(
      resolveContactFromEmail(
        "StackForgeAI <send.stackforgeai.africa>",
        "hello@stackforgeai.africa",
      ),
    ).toBe(verified);
    expect(
      resolveContactFromEmail(
        "StackForgeAI Contact Form <contact@stackforgeai.africa>",
        "hello@stackforgeai.africa",
      ),
    ).toBe("StackForgeAI Contact Form <contact@stackforgeai.africa>");
  });

  it("maps Resend sender errors to a user-safe 503 message", () => {
    const mapped = mapContactSendError(new Error("Domain not verified for sender"));
    expect(mapped.status).toBe(503);
    expect(mapped.message).toContain("hello@stackforgeai.africa");
  });

  it("maps unknown errors to a generic 500 message", () => {
    const mapped = mapContactSendError(new Error("Unexpected failure"));
    expect(mapped.status).toBe(500);
    expect(mapped.message).toBe("Failed to send message. Please try again.");
  });
});

describe("buildStackfixContactMessage", () => {
  it("includes phone and workshop details when provided", () => {
    const message = buildStackfixContactMessage({
      phone: "+250 799 486 531",
      message: "Three techs in Nyamirambo.",
    });
    expect(message).toContain("StackFix demo request.");
    expect(message).toContain("Phone/WhatsApp: +250 799 486 531");
    expect(message).toContain("Three techs in Nyamirambo.");
  });

  it("omits empty optional fields", () => {
    expect(buildStackfixContactMessage({})).toBe("StackFix demo request.");
  });
});

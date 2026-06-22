import { describe, expect, it } from "vitest";
import {
  buildPasswordResetEmailHtml,
  buildPasswordResetEmailText,
} from "./lib/email-templates.js";

describe("password reset email templates", () => {
  const params = {
    resetUrl: "http://localhost:3000/reset-password?token=abc",
    userName: "Kevin",
    logoUrl: "http://localhost:3000/brand/stackfix-icon.png",
  };

  it("includes StackFix branding, address, and disclaimer in HTML", () => {
    const html = buildPasswordResetEmailHtml(params);
    expect(html).toContain("StackFix");
    expect(html).toContain("1 KN 78 St, Kigali, Rwanda");
    expect(html).toContain("Reset your password");
    expect(html).toContain(params.resetUrl);
    expect(html).toContain(params.logoUrl);
    expect(html).toContain("never ask for your password");
  });

  it("includes address and disclaimer in plain text", () => {
    const text = buildPasswordResetEmailText(params);
    expect(text).toContain("1 KN 78 St, Kigali, Rwanda");
    expect(text).toContain(params.resetUrl);
    expect(text).toContain("never ask for your password");
  });
});

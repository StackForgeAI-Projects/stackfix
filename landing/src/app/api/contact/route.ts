import { NextResponse } from "next/server";
import { contactSchema } from "@/lib/contact-schema";
import { checkContactRateLimit, getClientIp } from "@/lib/rate-limit";
import { mapContactSendError } from "@/lib/contact-email-content";
import { sendContactEmail } from "@/lib/email";
import { serverEnv } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_ORIGINS = new Set(
  [
    process.env.NEXT_PUBLIC_SITE_URL,
    "https://stackfix.app",
    "https://www.stackfix.app",
    "https://stackforgeai.africa",
    "https://www.stackforgeai.africa",
    process.env.NODE_ENV !== "production" ? "http://localhost:3001" : null,
  ].filter(Boolean) as string[],
);

function jsonError(status: number, error: string, headers: Record<string, string> = {}) {
  return NextResponse.json({ ok: false, error }, { status, headers });
}

export async function POST(request: Request) {
  // CSRF: verify Origin / Referer is one we own.
  const origin = request.headers.get("origin") ?? request.headers.get("referer") ?? "";
  if (origin) {
    try {
      const originHost = new URL(origin).origin;
      if (!ALLOWED_ORIGINS.has(originHost)) {
        return jsonError(403, "Forbidden origin");
      }
    } catch {
      return jsonError(400, "Bad origin header");
    }
  }

  const env = serverEnv();
  if (env.NODE_ENV === "production" && !env.RESEND_API_KEY) {
    console.error("[/api/contact] RESEND_API_KEY missing in production");
    return jsonError(
      503,
      "Contact form is temporarily unavailable. Please email hello@stackforgeai.africa directly.",
    );
  }

  const ip = getClientIp(request);
  let rate: Awaited<ReturnType<typeof checkContactRateLimit>>;
  try {
    rate = await checkContactRateLimit(ip);
  } catch (err) {
    console.error("[/api/contact] rate limit check failed", err);
    rate = { success: true, limit: 5, remaining: 5, reset: Date.now() + 3_600_000 };
  }
  if (!rate.success) {
    return jsonError(429, "Too many requests. Please try again later.", {
      "Retry-After": Math.ceil((rate.reset - Date.now()) / 1000).toString(),
      "X-RateLimit-Limit": rate.limit.toString(),
      "X-RateLimit-Remaining": rate.remaining.toString(),
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "Invalid JSON payload");
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(422, parsed.error.errors[0]?.message ?? "Validation failed");
  }

  // Honeypot triggered — silently accept (bot won't notice) but do nothing.
  if (parsed.data.website && parsed.data.website.length > 0) {
    return NextResponse.json({ ok: true, id: "honeypot" });
  }

  try {
    const result = await sendContactEmail({
      name: parsed.data.name,
      email: parsed.data.email,
      company: parsed.data.company,
      message: parsed.data.message,
      phone: parsed.data.phone || undefined,
      source: parsed.data.source,
      ip,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
    return NextResponse.json({ ok: true, id: result.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/contact] send failed", {
      err: message,
      env: serverEnv().NODE_ENV,
    });
    const mapped = mapContactSendError(err);
    return jsonError(mapped.status, mapped.message);
  }
}

export function GET() {
  return jsonError(405, "Method not allowed");
}

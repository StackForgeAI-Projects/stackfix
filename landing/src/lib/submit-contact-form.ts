import type { ContactInput } from "@/lib/contact-schema";

export type SubmitContactResult = { ok: true } | { ok: false; message: string };

/** POST JSON to `/api/contact` — shared by homepage and StackFix forms. */
export async function submitContactForm(
  data: ContactInput,
  fallbackError: string,
  fallbackNetworkError: string,
): Promise<SubmitContactResult> {
  try {
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string };

    if (res.status === 429) {
      return {
        ok: false,
        message: body.error ?? "Too many requests. Please try again in an hour.",
      };
    }

    if (!res.ok) {
      return { ok: false, message: body.error ?? fallbackError };
    }

    return { ok: true };
  } catch {
    return { ok: false, message: fallbackNetworkError };
  }
}

/** Build a valid message body for the StackFix demo form. */
export function buildStackfixContactMessage(fields: {
  phone?: string | null;
  message?: string | null;
}): string {
  const lines = ["StackFix demo request."];

  if (fields.phone?.trim()) {
    lines.push(`Phone/WhatsApp: ${fields.phone.trim()}`);
  }

  const detail = fields.message?.trim();
  if (detail) {
    lines.push("", detail);
  }

  return lines.join("\n");
}

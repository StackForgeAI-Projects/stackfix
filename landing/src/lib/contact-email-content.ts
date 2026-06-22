export interface SendContactArgs {
  name: string;
  email: string;
  company?: string;
  message: string;
  phone?: string;
  source?: "website" | "stackfix";
  ip?: string;
  userAgent?: string;
}

const VERIFIED_FROM = "StackForgeAI Contact Form <contact@stackforgeai.africa>";

function extractEmailAddress(value: string): string {
  const match = value.match(/<([^>]+)>/);
  return (match?.[1] ?? value).trim().toLowerCase();
}

/** Use the verified apex-domain sender when production env still points at an old subdomain. */
export function resolveContactFromEmail(configured: string, toEmail: string): string {
  const from = extractEmailAddress(configured);
  const to = extractEmailAddress(toEmail);

  if (
    from === to ||
    !from.endsWith("@stackforgeai.africa") ||
    from.startsWith("send.") ||
    from.startsWith("mail.")
  ) {
    return VERIFIED_FROM;
  }

  return configured;
}

/** Map Resend / config failures to user-safe API errors. */
export function mapContactSendError(err: unknown): { status: number; message: string } {
  const message = err instanceof Error ? err.message : String(err);

  if (/not configured|RESEND_API_KEY|Email transport not configured/i.test(message)) {
    return {
      status: 503,
      message:
        "Contact form is temporarily unavailable. Please email hello@stackforgeai.africa directly.",
    };
  }

  if (/domain|verify|not authorized|403|invalid.*from|sender/i.test(message)) {
    return {
      status: 503,
      message:
        "Contact form is temporarily unavailable. Please email hello@stackforgeai.africa directly.",
    };
  }

  return { status: 500, message: "Failed to send message. Please try again." };
}

/** Strip header-injection characters from display names. */
export function sanitizeDisplayName(name: string): string {
  return name.replace(/[\r\n<>]/g, "").trim() || "Website visitor";
}

/** RFC 5322 Reply-To with a safe display name so inbox clients thread correctly. */
export function formatContactReplyTo(name: string, email: string): string {
  return `${sanitizeDisplayName(name)} <${email}>`;
}

/** Plain-text body — multipart/alternative improves spam scoring vs HTML-only. */
export function buildContactPlainText(args: SendContactArgs): string {
  const heading =
    args.source === "stackfix"
      ? "StackForgeAI · New StackFix demo request"
      : "StackForgeAI · New website enquiry";

  const lines = [heading, "", `From: ${sanitizeDisplayName(args.name)} <${args.email}>`];

  if (args.company) {
    lines.push(`Company: ${args.company}`);
  }

  if (args.phone?.trim()) {
    lines.push(`Phone/WhatsApp: ${args.phone.trim()}`);
  }

  lines.push("", "Message:", args.message, "", "---", `Submitted: ${new Date().toUTCString()}`);

  if (args.ip) lines.push(`IP: ${args.ip}`);
  if (args.userAgent) lines.push(`User-Agent: ${args.userAgent}`);

  lines.push(
    "",
    "Reply to this email to respond directly to the sender.",
    "https://stackforgeai.africa",
  );

  return lines.join("\n");
}

/** Warn when From/To share the same mailbox — common cause of junk on self-hosted inboxes. */
export function contactFromToMisconfigured(from: string, to: string): boolean {
  const extract = (value: string) => {
    const match = value.match(/<([^>]+)>/);
    return (match?.[1] ?? value).trim().toLowerCase();
  };
  return extract(from) === extract(to);
}

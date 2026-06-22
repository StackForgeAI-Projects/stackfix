import "server-only";
import { Resend } from "resend";
import { serverEnv } from "@/lib/env";
import { ContactNotificationEmail } from "@/emails/contact-notification";
import {
  buildContactPlainText,
  contactFromToMisconfigured,
  formatContactReplyTo,
  resolveContactFromEmail,
  type SendContactArgs,
} from "@/lib/contact-email-content";

let cached: Resend | undefined;

export function getResend(): Resend | null {
  const env = serverEnv();
  if (!env.RESEND_API_KEY) return null;
  if (!cached) cached = new Resend(env.RESEND_API_KEY);
  return cached;
}

export type { SendContactArgs };

/** Returns a human-readable misconfiguration reason, or null when ready to send. */
export function getContactEmailConfigError(): string | null {
  const env = serverEnv();
  if (!env.RESEND_API_KEY) {
    return env.NODE_ENV === "production" ? "RESEND_API_KEY is not configured on the server" : null;
  }
  if (!env.CONTACT_FROM_EMAIL.includes("@")) {
    return "CONTACT_FROM_EMAIL is invalid";
  }
  if (!env.CONTACT_TO_EMAIL.includes("@")) {
    return "CONTACT_TO_EMAIL is invalid";
  }
  return null;
}

export async function sendContactEmail(args: SendContactArgs): Promise<{ id?: string }> {
  const env = serverEnv();
  const configError = getContactEmailConfigError();

  if (configError) {
    if (env.NODE_ENV !== "production") {
      console.warn("[email] RESEND_API_KEY missing — skipping send in non-production.", {
        name: args.name,
        email: args.email,
      });
      return { id: "dev-noop" };
    }
    throw new Error(configError);
  }

  const resend = getResend();
  if (!resend) {
    throw new Error("Email transport not configured");
  }

  if (contactFromToMisconfigured(env.CONTACT_FROM_EMAIL, env.CONTACT_TO_EMAIL)) {
    console.warn(
      "[email] CONTACT_FROM_EMAIL and CONTACT_TO_EMAIL are the same address. " +
        "Inbound mail often lands in junk when a mailbox receives mail that appears to be from itself via Resend. " +
        "Use a dedicated sender such as contact@stackforgeai.africa (must differ from To) — see docs/EMAIL_DELIVERABILITY.md.",
    );
  }

  const safeName = args.name.trim() || "Website visitor";
  const subject =
    args.source === "stackfix"
      ? `[StackFix Demo] Enquiry from ${safeName}`
      : `[Website Contact] Enquiry from ${safeName}`;

  const from = resolveContactFromEmail(env.CONTACT_FROM_EMAIL, env.CONTACT_TO_EMAIL);
  if (from !== env.CONTACT_FROM_EMAIL) {
    console.warn("[email] Using verified sender override", {
      configured: env.CONTACT_FROM_EMAIL,
      resolved: from,
    });
  }

  const payload = {
    from,
    to: env.CONTACT_TO_EMAIL,
    replyTo: formatContactReplyTo(args.name, args.email),
    subject,
    text: buildContactPlainText(args),
    tags: [
      {
        name: "category",
        value: args.source === "stackfix" ? "stackfix-demo" : "contact-form",
      },
    ],
    headers: {
      "X-Entity-Ref-ID": `contact-${Date.now()}`,
      "Auto-Submitted": "auto-generated",
    },
  };

  const withReact = await resend.emails.send({
    ...payload,
    react: ContactNotificationEmail({
      name: args.name,
      email: args.email,
      company: args.company,
      message: args.message,
      ip: args.ip,
      userAgent: args.userAgent,
    }),
  });

  if (withReact.error) {
    console.error("[email] HTML send failed, retrying text-only", withReact.error.message);
    const textOnly = await resend.emails.send(payload);
    if (textOnly.error) {
      throw new Error(`Resend send failed: ${textOnly.error.message}`);
    }
    return { id: textOnly.data?.id };
  }

  return { id: withReact.data?.id };
}

import { z } from "zod";

/**
 * Server-side environment schema. Validated at runtime via `serverEnv` getter.
 * Never import this file from a "use client" module — the secrets must stay on the server.
 */
const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  RESEND_API_KEY: z.string().min(1).optional(),
  CONTACT_FROM_EMAIL: z
    .string()
    .min(1)
    .default("StackForgeAI Contact Form <contact@stackforgeai.africa>"),
  CONTACT_TO_EMAIL: z.string().email().default("hello@stackforgeai.africa"),
  BREVO_API_KEY: z.string().min(1).optional(),
  BREVO_LIST_ID: z.coerce.number().int().positive().default(1),
  BREVO_DOUBLE_OPT_IN_TEMPLATE_ID: z.coerce.number().int().positive().default(1),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  SENTRY_AUTH_TOKEN: z.string().min(1).optional(),
  SENTRY_ORG: z.string().min(1).optional(),
  SENTRY_PROJECT: z.string().min(1).optional(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default("https://stackforgeai.africa"),
  NEXT_PUBLIC_SITE_NAME: z.string().default("StackForgeAI"),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional().or(z.literal("")),
  NEXT_PUBLIC_CALENDLY_URL: z.string().url().default("https://calendly.com/stackforgeai/demo"),
  NEXT_PUBLIC_WHATSAPP_NUMBER: z.string().default("+250000000000"),
  NEXT_PUBLIC_WHATSAPP_DISPLAY: z.string().default("+250 XXX XXX XXX"),
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN: z.string().optional(),
});

type ServerEnv = z.infer<typeof serverSchema>;
type ClientEnv = z.infer<typeof clientSchema>;

let cachedServerEnv: ServerEnv | undefined;

/**
 * Lazily parses and caches server env. Throws helpful errors when required vars are missing.
 */
export function serverEnv(): ServerEnv {
  if (cachedServerEnv) return cachedServerEnv;
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("❌ Invalid server environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables");
  }
  cachedServerEnv = parsed.data;
  return cachedServerEnv;
}

export const clientEnv: ClientEnv = clientSchema.parse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  NEXT_PUBLIC_CALENDLY_URL: process.env.NEXT_PUBLIC_CALENDLY_URL,
  NEXT_PUBLIC_WHATSAPP_NUMBER: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
  NEXT_PUBLIC_WHATSAPP_DISPLAY: process.env.NEXT_PUBLIC_WHATSAPP_DISPLAY,
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN,
});

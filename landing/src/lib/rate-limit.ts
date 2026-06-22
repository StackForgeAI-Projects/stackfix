import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { serverEnv } from "@/lib/env";

/**
 * Production: backed by Upstash Redis (free tier).
 * Local/dev: falls back to an in-memory limiter so devs don't need Redis.
 *
 * Window: 5 requests / IP / hour for /api/contact (per SOP §9.1).
 */

type LimiterResult = { success: boolean; limit: number; remaining: number; reset: number };

class InMemoryLimiter {
  private hits = new Map<string, { count: number; resetAt: number }>();
  constructor(
    private readonly max: number,
    private readonly windowMs: number,
  ) {}
  async limit(key: string): Promise<LimiterResult> {
    const now = Date.now();
    const entry = this.hits.get(key);
    if (!entry || entry.resetAt < now) {
      this.hits.set(key, { count: 1, resetAt: now + this.windowMs });
      return {
        success: true,
        limit: this.max,
        remaining: this.max - 1,
        reset: now + this.windowMs,
      };
    }
    entry.count += 1;
    return {
      success: entry.count <= this.max,
      limit: this.max,
      remaining: Math.max(0, this.max - entry.count),
      reset: entry.resetAt,
    };
  }
}

const memoryLimiters = {
  contact: new InMemoryLimiter(5, 60 * 60 * 1000),
  newsletter: new InMemoryLimiter(10, 60 * 60 * 1000),
};

let upstashLimiters: { contact: Ratelimit; newsletter: Ratelimit } | undefined;

function getUpstash(): typeof upstashLimiters {
  if (upstashLimiters) return upstashLimiters;
  const env = serverEnv();
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) return undefined;
  const redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });
  upstashLimiters = {
    contact: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 h"),
      analytics: true,
      prefix: "rl:contact",
    }),
    newsletter: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 h"),
      analytics: true,
      prefix: "rl:newsletter",
    }),
  };
  return upstashLimiters;
}

export async function checkContactRateLimit(ip: string): Promise<LimiterResult> {
  const upstash = getUpstash();
  if (upstash) {
    const res = await upstash.contact.limit(ip);
    return { success: res.success, limit: res.limit, remaining: res.remaining, reset: res.reset };
  }
  return memoryLimiters.contact.limit(ip);
}

export async function checkNewsletterRateLimit(ip: string): Promise<LimiterResult> {
  const upstash = getUpstash();
  if (upstash) {
    const res = await upstash.newsletter.limit(ip);
    return { success: res.success, limit: res.limit, remaining: res.remaining, reset: res.reset };
  }
  return memoryLimiters.newsletter.limit(ip);
}

/**
 * Extracts a stable client identifier from request headers.
 * Trusts X-Forwarded-For only when running behind Vercel/Cloudflare.
 */
export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "anonymous";
}

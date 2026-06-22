import type { NextConfig } from "next";

const SELF = "'self'";
const isDev = process.env.NODE_ENV === "development";

const cspDirectives: Record<string, string[]> = {
  "default-src": [SELF],
  "script-src": [
    SELF,
    "'unsafe-inline'",
    isDev ? "'unsafe-eval'" : "",
    "https://va.vercel-scripts.com",
    "https://vitals.vercel-insights.com",
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com",
  ].filter(Boolean),
  "style-src": [SELF, "'unsafe-inline'", "https://fonts.googleapis.com"],
  "img-src": [SELF, "data:", "blob:", "https:"],
  "font-src": [SELF, "data:", "https://fonts.gstatic.com"],
  "connect-src": [
    SELF,
    "https://vitals.vercel-insights.com",
    "https://api.resend.com",
    "https://*.upstash.io",
    "https://www.google-analytics.com",
    "https://analytics.google.com",
    "https://*.analytics.google.com",
    "https://www.googletagmanager.com",
    "https://*.googletagmanager.com",
  ],
  "frame-ancestors": ["'none'"],
  "form-action": [SELF],
  "base-uri": [SELF],
  "object-src": ["'none'"],
  "upgrade-insecure-requests": [],
};

const csp = Object.entries(cspDirectives)
  .map(([key, value]) => (value.length ? `${key} ${value.join(" ")}` : key))
  .join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=(), browsing-topics=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "stackforgeai.africa" },
      { protocol: "https", hostname: "www.stackforgeai.africa" },
      { protocol: "https", hostname: "stackfix.app" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }, ...securityHeaders],
      },
    ];
  },
};

export default nextConfig;

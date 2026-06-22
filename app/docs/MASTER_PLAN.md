# StackFix — Master Development Plan

> **Version:** 1.0 · **SOP Reference:** StackFix Full Product Development Lifecycle SOP v1.0  
> **Status:** Phases 1–6 in progress · Phases 7–14 planned

---

## Phase Tracker

| Phase | Name | Status | Notes |
|-------|------|--------|-------|
| 0 | Planning & Decisions | ✅ Complete | Next.js 14 + Turborepo + Express + Supabase/PostgreSQL |
| 1 | Design System & Brand | ✅ Complete | `packages/tokens`, `packages/ui`, invoice HTML template |
| 2 | UI/UX Design & Prototyping | ✅ Migrated | Screens from `stackfix-main-ui-design` → `apps/web` |
| 3 | Dev Infrastructure & Tooling | ✅ Complete | Turborepo, pnpm, Docker Compose, GitHub Actions CI |
| 4 | Database Architecture | ✅ Complete | Prisma schema, migrations, seed data |
| 5 | Backend Development | ✅ Complete | Express API, JWT auth, all core route groups |
| 6 | Frontend Development | ✅ Complete | Next.js 14 App Router, TanStack Query, role-based UI |
| 7 | API Design & Mobile Endpoints | 🔜 Planned | OpenAPI spec, Swagger UI |
| 8 | MTN Mobile Money Integration | 🔜 Planned | MoMo Collections API, webhooks |
| 9 | WhatsApp & SMS Notifications | 🔜 Planned | Meta WABA, Africa's Talking |
| 10 | Mobile App Development | 🔜 Planned | React Native + Expo |
| 11 | Testing & QA | 🔜 Planned | Playwright E2E, load tests |
| 12 | Hosting, DevOps & Infrastructure | 🔜 Planned | Vercel, Railway, Supabase Pro |
| 13 | Launch Strategy | 🔜 Planned | Beta → public launch |
| 14 | Post-Launch Operations | 🔜 Ongoing | Monitoring, roadmap |

---

## Monorepo Structure

```
stackfix-app/
├── apps/
│   ├── web/          # Next.js 14 — app.stackfix.app
│   └── api/          # Express REST API — api.stackfix.app
├── packages/
│   ├── tokens/       # Design tokens (SOP §1.3)
│   ├── ui/           # shadcn/ui + StackFix components
│   ├── types/        # Shared TypeScript types
│   ├── utils/        # Business logic utilities
│   └── config/       # Shared ESLint + TS configs
├── docs/
│   ├── MASTER_PLAN.md
│   └── DEVELOPER_GUIDE.md
├── docker-compose.yml
└── .github/workflows/ci.yml
```

---

## Technology Stack (SOP §3.2)

| Layer | Technology |
|-------|-----------|
| Web | Next.js 14, TypeScript, Tailwind CSS v4, shadcn/ui |
| State | TanStack Query (server), Zustand (client — Phase 6+) |
| API | Node.js 20, Express, Prisma, Zod |
| Database | PostgreSQL 15 (Supabase in production) |
| Cache/Queues | Redis (Upstash) — Phase 8+ |
| Mobile | React Native + Expo — Phase 10 |
| CI/CD | GitHub Actions, Turborepo |
| Payments | MTN MoMo Collections — Phase 8 |
| Notifications | WhatsApp + SMS — Phase 9 |

---

## User Flow (Repair Lifecycle)

1. Customer arrives → Technician creates ticket (Pending)
2. Technician raises invoice with USSD code
3. Invoice sent to customer (WhatsApp/SMS — Phase 9)
4. **Pay Before:** MoMo payment → Under Repair automatically
5. **Pay on Pickup:** Technician starts → Under Repair manually
6. Technician completes repair → Completed
7. Customer collects → Picked Up → Invoice Paid

---

## Status System (SOP §1.4)

| Status | Colour | Hex |
|--------|--------|-----|
| Pending | Amber | `#F59E0B` |
| Under Repair | Blue | `#3B82F6` |
| Completed | Green | `#10B981` |
| Picked Up | Purple | `#8B5CF6` |
| Paid | Brand Green | `#00B341` |
| Cancelled | Red | `#EF4444` |

---

## API Route Groups (Phase 5 — Implemented)

| Group | Base Path | Status |
|-------|-----------|--------|
| Auth | `/api/v1/auth` | ✅ |
| Organisation | `/api/v1/org` | ✅ |
| Users/Team | `/api/v1/users` | ✅ |
| Customers | `/api/v1/customers` | ✅ |
| Tickets | `/api/v1/tickets` | ✅ |
| Invoices | `/api/v1/invoices` | ✅ |
| Payments | `/api/v1/payments` | ✅ |
| Analytics | `/api/v1/analytics` | ✅ |
| AI | `/api/v1/ai` | Phase 5+ |
| Webhooks | `/api/v1/webhooks` | Phase 8 |
| Export | `/api/v1/export` | Phase 5+ |

---

## External Registrations (Start Early)

| Service | Purpose | Lead Time |
|---------|---------|-----------|
| MTN MoMo Developer Portal | Payments | 2–6 weeks |
| Meta WhatsApp Business API | Notifications | 1–2 weeks |
| Africa's Talking SMS | SMS fallback | 1–2 weeks |
| Domain stackfix.app (RICTA) | Production URLs | Days |

---

## Asset Locations

| Asset | Path |
|-------|------|
| Logo | `packages/ui/src/assets/logo.png` |
| Favicon | `apps/web/public/favicon.png` |
| App icon | `apps/web/public/brand/stackfix-icon.png` |
| Login hero | `apps/web/public/brand/login-hero.jpg` |
| Brand background logo | `packages/ui/src/assets/logo-bg.png` |

---

## `stackfix-main-ui-design` — Safe to Delete?

**Not yet.** Keep until you verify the new app matches all screens. Once confirmed, delete the folder — all needed components and assets have been migrated to `packages/ui` and `apps/web`.

---

*StackForgeAI · StackFix · Kigali, Rwanda · 2026*

# StackFix — Developer & Testing Guide

> Your central guide for running, testing, and verifying StackFix during development.  
> Official product documentation will be extracted from this document over time.

---

## Quick Start

### Prerequisites

- Node.js 20 LTS
- pnpm 9+
- **PostgreSQL 15** (required for Phases 1–6) — via Docker **or** Homebrew
- **Redis 7** (optional until Phase 8+) — via Docker only for now

### 1. Start infrastructure

**Option A — Docker (SOP recommended, full stack)**

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running:

```bash
docker compose up -d
```

This starts:
- **PostgreSQL** on `localhost:5432` (user: `stackfix`, password: `stackfix_dev`, db: `stackfix`)
- **Redis** on `localhost:6379` (needed from Phase 8 for MoMo queues, notifications)
- **Translate** on `localhost:5001` (Python/googletrans — **required for Kinyarwanda & French UI**)

```bash
docker compose up -d translate   # if you only need translation without full stack
```

For **production**, see [PRODUCTION.md](./PRODUCTION.md) — the translate service must be deployed and `TRANSLATE_SERVICE_URL` must be set on the API.

**Option B — Homebrew PostgreSQL (works without Docker)**

If Docker is not installed, use Homebrew for PostgreSQL only:

```bash
brew install postgresql@15
brew services start postgresql@15
export PATH="/usr/local/opt/postgresql@15/bin:$PATH"

# One-time: create role + database matching apps/api/.env
psql postgres -c "CREATE ROLE stackfix WITH LOGIN PASSWORD 'stackfix_dev' CREATEDB;" 2>/dev/null || true
createdb -O stackfix stackfix 2>/dev/null || true
```

Redis is **not required** until Phase 8 (payment webhooks, background jobs). The app runs fully without it today.

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

### 4. Run database migrations & seed

```bash
pnpm db:generate
pnpm --filter @stackfix/api exec prisma migrate dev --name init
pnpm db:seed
```

### 5. Start development servers

```bash
pnpm dev
```

| Service | URL |
|---------|-----|
| Web app | http://localhost:3000 |
| API | http://localhost:4000 |
| API health | http://localhost:4000/health |

---

## Demo Credentials (after seed)

Run `pnpm db:seed` to create or refresh all three role-based test accounts:

| Role | Email | Password | Access level |
|------|-------|----------|--------------|
| **Super Admin** | `kevin@stackfix.app` | `StackFix2026!` | Full CRUD — tickets, invoices, team, settings |
| **Admin** | `admin@stackfix.app` | `Admin2026!` | Create + read — no status edits or deletes |
| **Technician** | `eric@stackfix.app` | `Tech2026!` | Own tickets only — no invoices/payments |

### Three-role test checklist

1. **Super Admin** — login as Kevin → Team → Add Member works; ticket delete visible; mark invoice paid works
2. **Admin** — login as `admin@stackfix.app` → sees Invoices; **cannot** update ticket status or mark paid; filter-by-user works
3. **Technician** — login as Eric → simplified nav; only own tickets; can update status on assigned tickets

> Re-login after seed if JWT still shows an old role.

---

## Phase 1 — Design System & Brand ✅

### What was built

- `packages/tokens` — colours, typography, spacing, shadows, breakpoints (SOP §1.1–1.3)
- `packages/ui` — shadcn/ui components, `StatusBadge`, `StackFixLogo`, invoice HTML template
- Brand assets moved to `packages/ui/src/assets/` and `apps/web/public/brand/`

### What to verify

1. Open http://localhost:3000/login
2. Confirm StackFix logo appears in sidebar and login page
3. Confirm brand green (`#00B341`) on primary buttons and active nav items
4. Confirm dark ink sidebar (`#0D1F12`)

![Login screen — look for green CTA button and hero image on desktop](public/brand/login-hero.jpg)

**Look for:**
- Logo renders correctly (not broken image)
- Inter font loaded (clean, modern typography)
- Favicon in browser tab (`/favicon.png`)

---

## Phase 2 — UI/UX Screens ✅

### Screens implemented

| Screen | Route | Role |
|--------|-------|------|
| Login | `/login` | All |
| Forgot password | `/forgot-password` | All |
| Reset password | `/reset-password?token=…` | All (from email link) |
| Dashboard | `/` | Admin + Technician |
| Tickets list | `/tickets` | All |
| New ticket | `/tickets/new` | All |
| Ticket detail | `/tickets/[id]` | All |
| Invoices | `/invoices` | All |
| Payments | `/payments` | All |
| Team | `/team` | Admin only |
| Settings | `/settings` | Admin (full), Technician (profile) |

### What to verify

- [ ] Login redirects to dashboard on success
- [ ] Technician (`eric@stackfix.app`) sees simplified nav (no Team)
- [ ] Admin sees full nav including Team
- [ ] Mobile: hamburger menu opens sidebar drawer
- [ ] All pages load without console errors

---

## Phase 3 — Infrastructure ✅

### What was built

- Turborepo monorepo with pnpm workspaces
- Docker Compose (PostgreSQL 15 + Redis 7)
- GitHub Actions CI (`.github/workflows/ci.yml`)
- Shared ESLint + TypeScript configs in `packages/config`

### What to verify

```bash
pnpm typecheck   # All packages pass
pnpm test        # Unit + API tests pass
pnpm build       # Web + API build successfully
```

---

## Phase 4 — Database ✅

### Schema tables

`organisations`, `users`, `customers`, `tickets`, `invoices`, `invoice_line_items`, `payments`, `ticket_status_history`, `ticket_notes`, `notifications`, `refresh_tokens`

### What to verify

```bash
pnpm db:studio   # Opens Prisma Studio — inspect seeded org + users
```

**Look for:**
- Organisation: "Ace Repairs Kigali"
- Admin user: kevin@stackfix.app
- Ticket counters initialized at 0

---

## Phase 5 — Backend API ✅

### Test the API manually

**Health check:**
```bash
curl http://localhost:4000/health
# Expected: {"status":"ok","version":"0.1.0"}
```

**Login:**
```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"kevin@stackfix.app","password":"StackFix2026!"}' \
  -c cookies.txt
# Expected: {"success":true,"data":{"accessToken":"...","user":{...}}}
```

**Create ticket (replace TOKEN):**
```bash
curl -X POST http://localhost:4000/api/v1/tickets \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Jean-Paul Mugisha",
    "customerPhone": "0788123456",
    "deviceType": "Phone",
    "deviceBrand": "Samsung",
    "deviceModel": "Galaxy A54",
    "faultDescription": "Screen crack"
  }'
```

**Status transition rules to test:**
- `pending` → `under_repair` ✅
- `pending` → `completed` ❌ (should return 422)
- `under_repair` → `completed` ✅
- `completed` → `picked_up` ✅
- Any → `cancelled` (admin only) ✅

---

## Phase 6 — Frontend ✅

### End-to-end test flow

1. **Login** as admin at http://localhost:3000/login
2. **Dashboard** — KPI cards should show zeros initially (no tickets yet)
3. **New Ticket** — Click "New Repair" → fill form → submit
   - Use phone: `0788123456`
   - Should redirect to ticket detail page
4. **Ticket detail** — Click "Mark as under repair"
   - Status badge should change to blue "Under Repair"
5. **Tickets list** — Filter by status tabs
6. **Settings** — Change payment model to "Pay Before Service" → Save
7. **Team** — Add a new technician account
8. **Logout** — Session cleared, redirected to login

### Technician flow test

1. Login as `eric@stackfix.app` / `Tech2026!`
2. Verify simplified navigation (no Team, no Payments for admin-only features)
3. Create a ticket — should auto-assign to technician

### What to look for (common issues)

| Issue | Likely cause |
|-------|-------------|
| "Network error" on login | API not running — start with `pnpm dev` |
| 401 on all pages | Token expired — logout and login again |
| Empty dashboard | No tickets created yet — create one via New Ticket |
| CORS error | Check `CORS_ORIGIN=http://localhost:3000` in `apps/api/.env` |
| **Unstyled page / layout broken (500/404 on `layout.css`, `webpack.js`)** | Stale `.next` cache — usually after `pnpm build` while `pnpm dev` is still running. Run `pnpm dev:clean` or `pnpm clean:cache && pnpm dev`. **Prevention:** `predev` / `prebuild` hooks auto-clear cache on every dev start and build. |
| **Logout modal shifts layout** | Radix scroll-lock adds body padding — fixed via `ScrollLockShiftFix` in Dialog + `scrollbar-gutter: stable` on `html` |

---

## Phase 6.1 — Auth, Security & Ticket Form Fixes ✅

Fixes from login/logout and new-ticket testing before Phase 7.

### What was built

| Area | Implementation |
|------|----------------|
| **Customer data bug** | Existing customers matched by phone are **updated** with the name (and optional email) from the form — no more stale generic names |
| **Forgot password** | Email-based reset: `POST /api/v1/auth/forgot-password`, `POST /api/v1/auth/reset-password` |
| **Reset email** | Branded HTML + plain text (`apps/api/src/lib/email-templates.ts`) — StackFix logo, address **1 KN 78 St, Kigali, Rwanda**, disclaimer footer |
| **Idle auto-logout** | `IdleSessionGuard` — default **8 min** idle (`NEXT_PUBLIC_IDLE_TIMEOUT_MS` in `apps/web/.env.local`) |
| **New ticket form** | Searchable dropdowns for device type, brand, model (`SearchableSelect` + `device-catalog.ts`); SMS/WhatsApp primary, email optional |
| **Repair statuses** | Ticket detail dropdown shows **Pending, Under Repair, Completed, Picked Up**; invalid transitions marked "(unavailable)" |

### Environment variables (new)

**API** (`apps/api/.env`):

```bash
WEB_URL="http://localhost:3000"          # Reset links in emails
SMTP_HOST=""                             # Leave empty in dev (logs to API console)
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="StackFix <noreply@stackfix.app>"
```

**Web** (`apps/web/.env.local`):

```bash
NEXT_PUBLIC_IDLE_TIMEOUT_MS=480000       # 8 minutes (use 300000–600000 for 5–10 min)
```

### Database migration

```bash
pnpm db:generate
pnpm --filter @stackfix/api exec prisma migrate deploy
```

Adds `password_reset_tokens` table for secure one-time reset links (SHA-256 hashed, 1-hour expiry).

### Manual test checklist

#### 1. Customer name on ticket create (critical bug)

1. Login as admin → **New Repair**
2. Enter a **new customer name** and phone `0788123456` (may already exist from seed/other tests)
3. Submit → ticket detail must show **exactly** the name you typed
4. Create another ticket with the **same phone** but a **different name**
5. Confirm the second ticket shows the **updated** name (not an old/generic name)

**API shortcut:**

```bash
TOKEN=$(curl -s -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"kevin@stackfix.app","password":"StackFix2026!"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")

curl -X POST http://localhost:4000/api/v1/tickets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"customerName":"Jean-Paul Mugisha","customerPhone":"0788999888","deviceType":"Refrigerator","faultDescription":"Not cooling"}'
```

#### 2. Forgot / reset password

1. Go to http://localhost:3000/forgot-password
2. Enter `notreal@test.com` → toast/error: **Email does not exist**
3. Enter `kevin@stackfix.app` → success screen; check **API terminal** for reset URL (when SMTP is not configured)
4. Open the reset URL → set new password → redirected to login
5. Login with the new password works; old password fails

**Security notes:**

- Reset tokens are stored hashed; used tokens and refresh sessions are invalidated on reset
- Forgot-password and login routes are rate-limited (20 req / 15 min per IP)
- Invalid email returns explicit **404 — Email does not exist** (per product spec)

#### 3. Idle auto-logout

1. Login → leave the tab idle (no mouse/keyboard/scroll) for 8+ minutes
2. Toast: "You were signed out due to inactivity" → redirected to login
3. For faster local testing, set `NEXT_PUBLIC_IDLE_TIMEOUT_MS=60000` (1 min) and restart `pnpm dev`

#### 4. New ticket form — searchable fields

- [ ] **Device or Electronic Type** — search "Fridge", select **Other** → custom text field appears
- [ ] **Brand** / **Device Model** — searchable + Other
- [ ] **Fault description** — suggestion chips appear based on device type
- [ ] **Device photo** — labeled **(optional)**
- [ ] Email field labeled optional; phone is required (SMS/WhatsApp primary channel)

#### 5. All repair statuses visible

1. Open any ticket → **Update Repair Status** dropdown lists all four statuses
2. From **Pending**, only **Pending** and **Under Repair** are selectable; **Completed** / **Picked Up** show "(unavailable)"
3. Mark **Under Repair** → save → **Completed** becomes selectable
4. Mark **Completed** → **Picked Up** becomes selectable

### Automated tests (new)

```bash
pnpm --filter @stackfix/api test    # auth-flow + email template tests
pnpm --filter @stackfix/utils test # TICKET_STATUS_OPTIONS coverage
```

### Dashboard time-of-day greeting

The dashboard heading uses `getTimeOfDayGreeting()` from `@stackfix/utils` (local time):

| Hours | Greeting |
|-------|----------|
| 05:00 – 11:59 | Good morning |
| 12:00 – 16:59 | Good afternoon |
| 17:00 – 20:59 | Good evening |
| 21:00 – 04:59 | Good night |

---

## Automated Tests

```bash
# All packages
pnpm test

# Utils only (status transitions, USSD, VAT)
pnpm --filter @stackfix/utils test

# API only (health, auth guards)
pnpm --filter @stackfix/api test
```

---

## Project Commands Reference

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start web + API in dev mode |
| `pnpm clean:cache` | Clear Next.js + API build caches (`.next`, `dist`) |
| `pnpm dev` | Start dev (auto-clears web cache via `predev` hook) |
| `pnpm dev:clean` | Force clear cache then start dev |
| `pnpm build` | Production build all apps |
| `pnpm test` | Run all tests |
| `pnpm typecheck` | TypeScript check all packages |
| `pnpm db:migrate` | Run Prisma migrations |
| `pnpm db:seed` | Seed demo data |
| `pnpm docs:user-flow` | Regenerate `docs/StackFix_USER_FLOW.docx` with diagram images |
| `pnpm db:studio` | Open Prisma Studio |

---

## Phase 6.2 — Roles, Permissions & Team UI ✅

### Three user roles

| Role | Who | Permissions |
|------|-----|-------------|
| **Super Admin** | Business owner (`kevin@stackfix.app`) | Full CRUD — tickets, invoices, team, settings |
| **Admin** | Manager | Create + read tickets/invoices; **no** status edits, deletes, or mark-paid |
| **Technician** | Repair staff | Create tickets; update status on **own** tickets only; no financial pages |

### Repair status badges

Pill-shaped badges matching design: Pending (orange), Under Repair (blue), Completed (green), Picked Up (slate).

### When Completed / Picked Up unlock

Sequential workflow — **not** available from Pending directly:

1. **Pending → Under Repair** (first step)
2. **Under Repair → Completed**
3. **Completed → Picked Up**

Payment gates (Settings → Payment model):

- **Pay Before Service:** invoice must be **paid** before Pending → Under Repair
- **Pay on Pickup:** invoice must be **paid** before Completed → Picked Up

See [USER_FLOW.md](./USER_FLOW.md) for diagrams.

### New features

- **Created by** on ticket cards (auto-set from logged-in user)
- **Filter by user** on tickets page (Admin + Super Admin) — **SlidersHorizontal** icon on the right of the status tabs row (All / Pending / …)
- **Login demo panel** — all three seeded accounts with roles; click a row to fill email/password; **show/hide password** toggle on login
- **Sidebar user card** — logged-in name, email, and role above Log out
- **Logout modal** — no background layout shift (`scrollbar-gutter: stable` + scroll-lock padding fix on Dialog)
- **Status badge colors** — explicit CSS classes (`.status-badge-*`) so Tailwind scan issues cannot strip colors
- **Global search** in header (`⌘K` → searches tickets via API)
- **Team page** modal UI (matches design prototype) with auto-generated passwords
- **Language** switch (English / Kinyarwanda) via i18next locale files
- Super Admin **delete ticket/invoice** on ticket detail — **`ConfirmActionDialog`** (fade-only, no zoom pop); API errors show **toast**, not Next.js runtime overlay
- **Ticket delete** cascades unpaid invoice + notifications; blocked when invoice is **paid**
- **Invoice delete** removes draft/sent/unpaid invoices; list cache updates without full page reload
- **In-app messaging** (`/messages`) — technicians request edit/delete; admins reply and resolve (`POST/GET /api/v1/messages`)
- **Payment status badges** — pill colors on invoices (Paid green, Unpaid orange, etc.) via `PaymentStatusBadge`
- **Technician dashboard** — Quick Actions hidden (no Invoices/Payments shortcuts)
- **ConfirmActionDialog** — standard modal template for all destructive confirmations (logout, delete, remove member); catches failed API calls so the modal stays open and Sonner shows the error

### Messaging API

| Method | Path | Who |
|--------|------|-----|
| GET | `/api/v1/messages` | All — technicians see own threads; admins see all |
| POST | `/api/v1/messages` | All — create thread |
| POST | `/api/v1/messages/:id/replies` | Thread participant or admin |
| PATCH | `/api/v1/messages/:id/resolve` | Admin / Super Admin |

After pulling: run `pnpm db:generate && pnpm --filter @stackfix/api exec prisma migrate deploy` for `staff_messages` table.

### After pulling this update

```bash
pnpm db:generate
pnpm --filter @stackfix/api exec prisma migrate deploy
pnpm dev:clean   # if layout breaks after build
```

Re-login so JWT reflects `super_admin` role for Kevin.

---

| Phase | What you'll test |
|-------|-----------------|
| 7 | Swagger UI at `/api/docs`, Postman collection |
| 8 | MTN MoMo sandbox payment → auto ticket status update |
| 9 | WhatsApp message received on ticket creation |
| 10 | Mobile app on Android/iOS device |
| 11 | Playwright E2E suite green on staging |
| 12 | Production deploy at app.stackfix.app |
| 13 | Beta shop onboarding (< 10 min to first ticket) |

---

## Deleting `stackfix-main-ui-design`

**When safe to delete:** After you confirm all screens in `apps/web` match or exceed the Lovable prototype.

**What was migrated:**
- shadcn/ui components → `packages/ui/src/components/ui/`
- AppShell pattern → `apps/web/src/components/AppShell.tsx` (adapted for Next.js)
- Styles → `packages/ui/src/styles/globals.css`
- Assets → `packages/ui/src/assets/` + `apps/web/public/brand/`

**What was NOT migrated (intentionally):**
- TanStack Start router (replaced by Next.js App Router)
- Mock data (`mock.ts`) — replaced by real API
- Cloudflare wrangler config — replaced by Vercel (Phase 12)

---

*Last updated: Phase 6.2 (roles, permissions, team UI, status badges) · StackForgeAI · hello@stackforgeai.africa*

See also: [USER_FLOW.md](./USER_FLOW.md) (markdown source) · **[StackFix_USER_FLOW.docx](./StackFix_USER_FLOW.docx)** (illustrated Word diagrams)

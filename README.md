# StackFix

Repair management SaaS for Rwanda and Africa — marketing site + product app in one monorepo.

## Repository layout

| Path | Purpose | Production URL |
|------|---------|------------------|
| [`landing/`](./landing/) | Next.js marketing site (homepage, pricing, FAQ, contact) | **https://stackfix.app** |
| [`app/`](./app/) | Turbo monorepo — Next.js web app, Node API, translate service | **https://app.stackfix.app** (web) · **https://api.stackfix.app** (API) |

### Recommended domain map

```
stackfix.app          → landing (marketing, free-trial signup, SEO)
app.stackfix.app      → authenticated SaaS dashboard (post trial setup)
api.stackfix.app      → REST API
```

After a user starts a free trial on the landing page, StackForgeAI provisions their workspace and sends login details. Users then sign in at **app.stackfix.app**.

## Quick start — landing

```bash
cd landing
pnpm install
pnpm dev          # http://localhost:3001
```

## Quick start — app

```bash
cd app
docker compose up -d
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
pnpm db:generate
pnpm --filter @stackfix/api exec prisma migrate dev --name init
pnpm db:seed
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:4000

**Demo login:** `kevin@stackfix.app` / `StackFix2026!`

See [`app/docs/PRODUCTION.md`](./app/docs/PRODUCTION.md) for deployment.

## Tests

```bash
cd landing && pnpm typecheck && pnpm test
cd app && pnpm typecheck && pnpm test
```

Built by [StackForgeAI](https://stackforgeai.africa) · Kigali, Rwanda

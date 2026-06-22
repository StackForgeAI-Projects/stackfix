# StackFix

Repair management SaaS for Rwanda — tickets, invoices, MTN MoMo USSD payments, WhatsApp/SMS notifications.

## Quick start

```bash
docker compose up -d          # postgres, redis, translate
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
- Translate: http://localhost:5001 (required for Kinyarwanda/French)

**Demo login:** `kevin@stackfix.app` / `StackFix2026!`

See [docs/PRODUCTION.md](./docs/PRODUCTION.md) for **production deployment** (including the translate service).
See [docs/DEVELOPER_GUIDE.md](./docs/DEVELOPER_GUIDE.md) for full testing instructions and [docs/MASTER_PLAN.md](./docs/MASTER_PLAN.md) for the complete product roadmap.

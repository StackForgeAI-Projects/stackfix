# StackFix — Production Deployment

> **Required reading before go-live.** This documents services that must run in production — including the translation stack.

---

## Architecture overview

```
Browser (Next.js)
    ↓
API (Node/Express)  —  TRANSLATE_SERVICE_URL
    ↓
Translate service (Python / googletrans)  —  port 5001
```

| Language | Behaviour |
|----------|-----------|
| **English** | No translate service needed (source language). |
| **Kinyarwanda / French** | API calls the Python translate service. If it is down, UI **falls back to English** silently. |

There is **no Google Cloud API key** and **no Google branding** in the app. Translation uses the free `googletrans` library inside our own microservice.

---

## Translate service (mandatory for rw/fr in prod)

### What to deploy

Build and run the container from `services/translate/`:

```bash
docker compose up -d translate
```

Or deploy the same image to your host (Railway, Fly.io, ECS, etc.).

| Item | Value |
|------|-------|
| **Image context** | `./services/translate` |
| **Port** | `5001` |
| **Health check** | `GET /health` → `{"status":"ok"}` |
| **Translate endpoint** | `POST /batch` `{ "texts": ["..."], "target": "rw"|"fr", "source": "en" }` |

### API environment (production)

Set on the **Node API** (`apps/api`):

```env
TRANSLATE_SERVICE_URL="http://stackfix-translate:5001"
```

Use the **internal hostname** of your translate container/service in prod (not `localhost`).

Examples:

| Platform | Example URL |
|----------|-------------|
| Docker Compose (same network) | `http://stackfix-translate:5001` |
| Kubernetes | `http://translate.default.svc.cluster.local:5001` |
| Single VPS (same host) | `http://127.0.0.1:5001` |

### Verify after deploy

```bash
curl https://your-api-host/health

# Direct translate service (internal or via tunnel)
curl http://translate-host:5001/health
curl -X POST http://translate-host:5001/batch \
  -H "Content-Type: application/json" \
  -d '{"texts":["Settings","Team"],"target":"fr","source":"en"}'
# Expected: {"data":["Paramètres","Équipe"]} (or similar)
```

Then in the app: **Settings → Language → French or Kinyarwanda** and confirm labels change.

### Prod checklist

- [ ] `translate` service deployed and healthy (`/health`)
- [ ] `TRANSLATE_SERVICE_URL` set on API with reachable internal URL
- [ ] API can reach translate service (same Docker network / VPC / security group)
- [ ] Translate service has outbound internet (googletrans calls Google Translate web endpoint)
- [ ] No `GOOGLE_TRANSLATE_API_KEY` required — do not add one

### Failure behaviour

If the translate service is unreachable:

- App **does not crash**
- Kinyarwanda/French users see **English** until the service is restored
- Cached bundles in browser `localStorage` (`stackfix_i18n_*`) may still show old translations until cleared

---

## Full production stack (minimum)

| Service | Required | Notes |
|---------|----------|-------|
| PostgreSQL | Yes | Primary database |
| Node API | Yes | `apps/api` — run `pnpm db:migrate:deploy` (includes `prisma generate`) after deploy |
| Next.js web | Yes | `apps/web` |
| **Translate (Python)** | **Yes for rw/fr** | `services/translate` |
| Redis | Phase 8+ | MoMo queues, background jobs |

After any migration that changes enums (e.g. adding `fr` to `Language`), **must** run `pnpm db:generate` or restart API so Prisma client matches the database.

---

## Dev vs prod

| | Dev | Prod |
|---|-----|------|
| Start translate | `docker compose up -d translate` | Deploy `services/translate` container |
| API env | `TRANSLATE_SERVICE_URL=http://localhost:5001` | Internal service URL (see above) |
| English only | Works without translate | Works without translate |
| rw / fr | Requires translate running | **Requires translate running** |

---

## Related files

- `services/translate/` — Python FastAPI + googletrans
- `docker-compose.yml` — `translate` service definition
- `apps/api/src/services/translate.service.ts` — API client (calls `TRANSLATE_SERVICE_URL`)
- `apps/api/.env.example` — env template

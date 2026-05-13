# 🚀 X Platform Deploy Kılavuzu

> Hedef: X Platform → `https://x.deploi.net` (web) + `https://api.x.deploi.net` (api)

## Önkoşullar

- Cloudflare DNS yönetiminde `deploi.net` ✓
- Hetzner CX22 + Coolify ✓ (https://coolify.deploi.net)
- GitHub repo `klchappy/x-platform` (oluşturulacak)
- Supabase projesi (opsiyonel — auth için)

## ⚠ Önemli Notlar

- **x-api Network Aliases**: Coolify x-api Configuration → Network'te `Network Aliases` alanına `x-api` yazılmalı. Bu olmadan x-web nginx'i `x-api:4250` DNS'ini çözemez ve `/v1/*` proxy çalışmaz.
- **Force Deploy**: Network Aliases değişikliğinden sonra "Restart" değil **"Force deploy (without cache)"** veya **Redeploy** ile container yeniden yaratılmalı. Restart sadece mevcut konteyneri yeniden başlatır.
- **Programatik deploy**: Coolify API token + deploy webhook:
  ```bash
  curl -X GET "https://coolify.deploi.net/api/v1/deploy?uuid=<APP_UUID>&force=true" \
    -H "Authorization: Bearer <ROOT_TOKEN>"
  ```

## Coolify'da iki resource

Damga örneğindeki gibi iki ayrı uygulama:

### 1. `x-api`

| Alan | Değer |
|------|-------|
| Type | Dockerfile |
| Repo | `klchappy/x-platform` |
| Branch | `main` |
| Base directory | `/` |
| Dockerfile path | `apps/api/Dockerfile` |
| Build context | `/` |
| Port | `4250` |
| Domain | `api.x.deploi.net` |
| Healthcheck path | `/health` |

**Ortam değişkenleri** (`.env.example`'a bakın):
- `NODE_ENV=production`
- `PORT=4250`
- `APP_URL=https://x.deploi.net`
- `PUBLIC_BASE_URL=https://x.deploi.net`
- `CORS_ORIGINS=https://x.deploi.net`
- `DATABASE_URL=postgres://...` (Supabase)
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `SESSION_SECRET` (≥32 char rastgele)
- `INTEGRATION_ENCRYPTION_KEY` (≥32 char)
- `ALLOW_DEMO_AUTH=1` (Supabase yapılandırılana kadar açık tut)
- `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` (opsiyonel)

### 2. `x-web`

| Alan | Değer |
|------|-------|
| Type | Dockerfile |
| Repo | `klchappy/x-platform` |
| Branch | `main` |
| Dockerfile path | `apps/web/Dockerfile` |
| Build context | `/` |
| Port | `80` |
| Domain | `x.deploi.net` |
| Healthcheck path | `/healthz` |
| Build arg | `VITE_API_URL=https://api.x.deploi.net` |

## Cloudflare DNS

```
x.deploi.net      A → <hetzner-ip>     (proxied: ON)
api.x.deploi.net  A → <hetzner-ip>     (proxied: ON)
```

(Damga için yapılmış olan kayıtlara bak — aynı IP'yi kullan.)

## İlk migrasyon — ARTIK OTOMATİK

Dockerfile CMD'si her start'ta `tsx packages/db/src/migrate.ts && tsx packages/db/src/seed.ts && tsx apps/api/src/index.ts` çalıştırır. Migration + idempotent seed (varsa skip) + API başlatma tek atomic adım. Yeni tablolara ihtiyaç varsa:

```bash
pnpm db:generate     # yeni migrations/*.sql üretir
git push             # Coolify webhook redeploy → otomatik migrate + seed
```

DATABASE_URL: Coolify Postgres internal hostname (UUID:5432) — SSL kapalı (heuristic: dotted hostname'ler için SSL aç).

## Mimari özet

- `apps/api` → Express (port 4250), `/v1/auth /v1/me /v1/orgs /v1/modules/<id>/*`
- `apps/web` → Vite SPA, nginx ile servisler
- `modules/{damga,lokma,santral,ticaret}` → her biri kendi router'ını mount eder
- `packages/{shared,db,ai,verification,module-api}` → ortak altyapı

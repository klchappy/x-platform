# X — Birleşik İşletme Platformu

Çoklu sektör desteği ile tek bir SaaS shell'i altında 4 modülü birleştiren multi-tenant platform:

| Modül | Sektör | Kaynak |
|------|--------|--------|
| **damga** | Personel takip, vardiya, NFC/QR yoklama, izin, bordro | [damga](https://github.com/) |
| **lokma** | Restoran/mutfak, reçete, stok, tedarikçi, AI öneri | [lokma](https://github.com/) |
| **santral** | Sekreterlik, çağrı, randevu, sesli asistan, CRM | [santral](https://github.com/) |
| **ticaret** | Tekstil/ihracat ERP, satış, sevk, e-Fatura, KEP | [etiksistem-v2](https://github.com/) |

## Mimari

**Modül-shell**: Tek shell (auth, tenant, billing, dashboard) + her modül kendi DB schema'sı + kendi API route grubu + kendi web sayfa grubu olarak iç içe yaşar. Tenant sektörüne göre modüller açılır/kapanır.

```
x-platform/
├── apps/
│   ├── api/                  # Shell API (Express + Drizzle)
│   └── web/                  # Shell Web (React 18 + Vite)
├── packages/
│   ├── db/                   # Shell schema: orgs, users, modules, audit
│   ├── shared/               # Zod, types
│   ├── ui/                   # Radix + Tailwind design system
│   ├── auth/                 # Supabase wrapper
│   ├── module-api/           # Module contract
│   ├── ai/                   # AI multi-provider client
│   ├── messaging/            # KEP/email/SMS/WhatsApp
│   ├── labels/               # Barcode/QR/ZPL
│   └── verification/         # HMAC, API key
└── modules/
    ├── damga/                # Personel
    ├── lokma/                # Mutfak
    ├── santral/              # Asistan
    └── ticaret/              # ERP
```

## Geliştirme

```bash
pnpm install
cp .env.example .env  # ortam değişkenlerini doldur
pnpm db:generate && pnpm db:migrate
pnpm dev               # api + web paralel
```

- **API**: http://localhost:4200
- **Web**: http://localhost:5200

## Canlı

- Web: https://x.deploi.net
- API: https://api.x.deploi.net (veya /api proxy)

## Stack

React 18 + Vite + TypeScript + Express + Drizzle + PostgreSQL + Supabase Auth + Upstash Redis + (opsiyonel BullMQ).

# X-Platform — Modül Statüleri

> Son güncelleme: 2026-05-14

X-Platform başlangıçta Damga + Lokma + Sayman + Santral + Ticaret'i tek bir modüler suite olarak çalıştırma denemesiydi. Bu yön **rafa kaldırıldı** — her ürün bağımsız SaaS olarak yoluna devam ediyor.

## Modül durumu

| Modül | Statü | Canonical kaynak |
|---|---|---|
| **lokma** | 🚫 DEPRECATED | `C:/Users/kaank/lokma/` (bağımsız repo) |
| **damga** | 🚫 DEPRECATED | `C:/Users/kaank/damga/` (bağımsız repo) |
| **sayman** | 🚫 DEPRECATED | `C:/Users/kaank/sayman/` (bağımsız repo) |
| **santral** | 🚫 DEPRECATED | `C:/Users/kaank/santral/` (varsa bağımsız repo) veya yeniden başlatılacak |
| **ticaret** | 🚫 DEPRECATED | (canonical kaynak henüz yok) |

## Karar (2026-05-14)

Aşağıdaki dosyalar X-Platform'da var ama **deprecated**:
- `packages/db/src/schema/modules-damga.ts`
- `packages/db/src/schema/modules-lokma.ts`
- `packages/db/src/schema/modules-sayman.ts`
- `packages/db/src/schema/modules-santral.ts`
- `packages/db/src/schema/modules-ticaret.ts`
- `packages/db/migrations/0002_brainy_proudstar.sql` ve sonrası
- `apps/api/src/modules-loader.ts` (tüm `ENABLED_MODULES` mantığı)
- `apps/web/src/App.tsx` içindeki modül route'ları

Şimdi **silmiyoruz** — git history'de kalsın, ileride pivot edilirse referans olur.

## Bu repo şu an ne için?

- **Aktif kullanım**: Yok (Coolify'da `x-api` + `x-web` aplikasyonları deploy'lu durabilir, ama production trafiği almıyor)
- **Olası gelecek**:
  - Tek-müşteri showcase / sandbox
  - "Damga + Sayman + Lokma'yı entegre eden dashboard" gibi başka bir konsept
  - Tamamen arşivlenebilir

## Yeniden aktive edilirse

Modüler suite kararı tekrar gözden geçirilirse:
1. Canonical repo'larla diff al — hangisi daha güncel?
2. Sırayla tek tek modülü "live" et (önce damga, sonra sayman, ...)
3. Auth/billing katmanını ortak Supabase'e taşı
4. Tekrar production'a al

Şimdilik bu yön açık değil. Solo dev kapasitesi multiple bağımsız SaaS'ı tercih ediyor.

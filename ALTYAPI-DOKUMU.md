# 🌐 Altyapı Dökümü — Tüm Sunucular, Hizmetler, IP'ler

> 2026-05-15 itibarıyla aktif kullanılan tüm sunucular ve dış hizmet sağlayıcılarının okunaklı listesi.

---

## 🖥 1. Sunucu (Tek VPS)

| | |
|---|---|
| **Sağlayıcı** | **Hetzner Cloud** |
| **Tip** | CX22 (2 vCPU, 4 GB RAM, 40 GB SSD) |
| **Public IP** | **46.225.25.177** |
| **Aylık ücret** | ~€4 (~₺175) |
| **İşletim sistemi** | Linux (Coolify host) |
| **SSH user** | root · port 22 |
| **Üzerinde çalışan** | Coolify v4.0.0 + Traefik + tüm uygulama container'ları + PostgreSQL + Redis |

> Bu **tek** sunucu üzerinde **bütün projelerin** hem web hem API hem DB'leri çalışıyor. Coolify Traefik proxy ile subdomain-tabanlı route ediyor.

---

## ☁ 2. DNS & CDN — Cloudflare (Free Plan)

| | |
|---|---|
| **Sağlayıcı** | **Cloudflare** |
| **Plan** | Free (₺0/ay) |
| **Domain** | deploi.net |
| **SSL/TLS** | Edge cert otomatik (Let's Encrypt) |
| **Wildcard** | `*.deploi.net` Cloudflare anycast üzerinden çözülür |

### DNS Kayıtları (hepsi 46.225.25.177'ye yönlü)

| Subdomain | Hedef | Proxied |
|-----------|-------|---------|
| `deploi.net` | 46.225.25.177 | ✓ |
| `www.deploi.net` | Cloudflare anycast | ✓ |
| `coolify.deploi.net` | 46.225.25.177 | ✓ |
| `damga.deploi.net` | 46.225.25.177 | ✓ |
| `api.damga.deploi.net` | 46.225.25.177 | ✓ |
| `lokma.deploi.net` | Cloudflare anycast | ✓ |
| `api-lokma.deploi.net` | Cloudflare anycast | ✓ |
| `x.deploi.net` | Cloudflare anycast | ✓ |
| `api.x.deploi.net` | Cloudflare anycast | ✓ |
| `sayman.deploi.net` | 46.225.25.177 | ✓ |
| `api.sayman.deploi.net` | 46.225.25.177 | ✓ |
| `portfolio.deploi.net` | Cloudflare anycast | ✓ |
| `api.deploi.net` (TahminIO API) | 46.225.25.177 | ✓ |

> "Cloudflare anycast" = 2606:4700:3034/3035 IPv6 — gerçek origin yine 46.225.25.177.

---

## 🎛 3. Coolify Paneli

| | |
|---|---|
| **URL** | https://coolify.deploi.net |
| **Sürüm** | v4.0.0 |
| **Üzerinde çalıştığı** | aynı Hetzner VPS (46.225.25.177) |
| **API token (root)** | `4|iGjKOR0X...` (x-platform-root, 30 gün) — `HIZMET-RAPORU.md`'de ek detay |

### Coolify üzerindeki **7 proje**

| Proje | Aktif uygulama sayısı | Açıklama |
|-------|------------------------|----------|
| **damga** | api + web | Personel takip platformu — Production canlı |
| **lokma** | api + web | Mutfak işletim sistemi |
| **santral** | (sadece kod, deploy yok) | Sekreterlik / asistan |
| **sayman** | api + web | Muhasebe operasyon platformu |
| **TahminIO** | api + web | Eski platform (deploi.net root + api.deploi.net) |
| **x-platform** | api + web + Postgres | **Birleşik platform** (damga + lokma + santral + ticaret + sayman modülleri) |
| **My first project** | — | Boş, kullanılmıyor |

### Coolify Applications (11 adet)

| Uygulama | URL | UUID |
|----------|-----|------|
| damga-api | https://api.damga.deploi.net | `qfcqxok65qmmt4xk7uaiha48` |
| damga-web | https://damga.deploi.net | `zdt34m7uqct0pdn10uc7mrft` |
| lokma-api | https://api-lokma.deploi.net | `ndxdwjoifn2rxhy5ca7r6h8z` |
| lokma-web | https://lokma.deploi.net | `o21s3qj7nryu2v2h8qzm8y18` |
| sayman-api | https://api.sayman.deploi.net | `xdy5msb04a8pq8iyz21n0lnf` |
| sayman-web | https://sayman.deploi.net | `h13pbw7v6ffepm2ak0y2msmp` |
| x-api | https://api.x.deploi.net | `pckpih154jq0mlzp0idk2byw` |
| x-web | https://x.deploi.net | `s9kt9ku3til1zixfziku9j40` |
| tahminio-api | https://api.deploi.net | `xdux52nbbdoq7rdgr35ie1pa` |
| tahminio-web | https://deploi.net, https://www.deploi.net | `kpvxtxdmi18h9cpch0dfadci` |
| portfolio-io | https://portfolio.deploi.net | `c22lvs8djanhv0b6r38nzlau` |

### Coolify Databases

| Veritabanı | Tip | UUID | Kullanan |
|------------|-----|------|----------|
| `redis-database-m10qa...` | Redis | `m10qa3m0hn705p4r7bu6sqo6` | (paylaşılan, Coolify cache veya app'ler) |
| `postgresql-database-ppdz...` | PostgreSQL 16 | `ppdzgcamjsbmhfhpawf4rx6x` | **x-platform** (tek tenant DB, 19 tablo) |

> Diğer projeler (damga, lokma, sayman) **Supabase'in kendi Postgres'ini** kullanır, Coolify'da DB değil.

---

## 🔐 4. Supabase

| | |
|---|---|
| **Organizasyon** | tahminio |
| **Plan** | Free (₺0/ay) |
| **Hesap** | kaanklc498@gmail.com |
| **Region** | AWS eu-central-1 (Frankfurt) |
| **Limit** | Free planda max 2 active proje + paused olanlar |

### Projeler (3 adet)

| Proje | Durum | Ne için kullanılıyor |
|-------|-------|----------------------|
| **damga** | 🟢 Active | Damga auth + DB |
| **lokma** | 🟢 Active | Lokma auth (DB 2026-05-11'de silinmişti, kod duruyor) |
| **tahminio** | ⏸ Paused | Eski platform |

> **x-platform Supabase kullanmıyor** — kendi self-hosted JWT + bcrypt + Coolify Postgres ile çalışıyor.

---

## 📦 5. GitHub

| | |
|---|---|
| **Kullanıcı** | klchappy |
| **Plan** | Free |
| **Token yetkileri** | gist, read:org, repo |

### Repo'lar (Coolify'a bağlı olanlar)

| Repo | Görünürlük | Coolify uygulaması |
|------|------------|---------------------|
| `klchappy/x-platform` | 🌍 **Public** | x-api + x-web |
| `klchappy/damga` (muhtemelen) | ? | damga-api + damga-web |
| `klchappy/lokma` (muhtemelen) | ? | lokma-api + lokma-web |
| `klchappy/sayman` (muhtemelen) | ? | sayman-api + sayman-web |
| `klchappy/tahminio` (muhtemelen) | ? | tahminio-api + tahminio-web |

---

## 🤖 6. AI Sağlayıcısı

| | |
|---|---|
| **Sağlayıcı** | **Anthropic** (Claude) |
| **Plan** | ❓ Henüz key yapılandırılmadı — env'de `ANTHROPIC_API_KEY` yok |
| **Ne için** | x-platform `/v1/ai/chat` modül endpoint'i + AiChat UI |

> x-platform'da `/v1/ai/chat` çağrıldığında **`ai_no_key`** dönüyor. Anthropic anahtarı eklenince Pro/Enterprise planın "AI: X token/ay" özelliği aktif olur.

---

## 💸 7. Ödeme / Mail / SMS — HENÜZ YAPILANDIRILMADI

| Hizmet | Sağlayıcı | Durum | Sonuç |
|--------|-----------|-------|-------|
| Ödeme | Iyzico | ❌ Anahtarsız | `/v1/iyzico/status` → `configured: false`. Plan switch trial veriyor, otomatik tahsilat yok. |
| Mail | Resend | ❌ Anahtarsız | Davet linki manuel paylaşılıyor, otomatik mail gönderilmiyor. |
| SMS / WhatsApp | Twilio | ❌ Yok | Santral modülünün çağrı hatırlatması metin atamıyor. |
| KEP | PTT veya Hitit | ❌ Yok | Ticaret modülünün e-Fatura/KEP gönderimi devre dışı. |
| Object storage | Cloudflare R2 / B2 | ❌ Yok | Dosya yüklemeler şu an VPS diskine düşer (yedek riski). |

> Detaylı maliyet ve aciliyet sırası: **`HIZMET-RAPORU.md`**

---

## 🔑 8. Token & Erişim Özetleri (gizli, paylaşma)

| Token / Key | Yer |
|-------------|-----|
| Coolify API token (root) | `HIZMET-RAPORU.md` → "Programatik deploy" bölümü |
| Coolify Postgres password (x-platform-db) | Coolify panel → x-platform-db → General → Password |
| GitHub PAT | `gh auth status` |
| Supabase keys (her proje) | Supabase dashboard → Project → Settings → API |
| x-platform `SESSION_SECRET` | Coolify x-api env → `SESSION_SECRET` |
| x-platform `INTEGRATION_ENCRYPTION_KEY` | Coolify x-api env → `INTEGRATION_ENCRYPTION_KEY` |

---

## 📊 9. Aylık maliyet özeti (mevcut hâliyle)

| Kalem | Aylık | Not |
|-------|-------|-----|
| Hetzner CX22 | ~₺175 | Sabit |
| Cloudflare | ₺0 | Free |
| Supabase | ₺0 | Free (limit 2 active proje) |
| GitHub | ₺0 | Free |
| Anthropic | ₺0 | (Henüz aktif değil) |
| **Şu anki toplam** | **~₺175/ay** | |
| Ekleyeceklerle (AI + Iyzico + Resend) | ~₺200-700/ay | İlk müşterilerden sonra |

---

## 🚨 Anında dikkat çekenler

1. **Tek VPS — Tek IP — Tek nokta arıza**: 46.225.25.177 düşerse **tüm projeler** (damga production + x-platform + lokma + sayman + portfolio + TahminIO) aynı anda offline olur. Hetzner snapshot al + ileride ikinci sunucu ile load balancing düşün.

2. **Coolify Postgres backup yok**: x-platform-db (gerçek tenant data buraya yazılıyor) henüz Coolify backup ayarlı değil. Coolify panel → x-platform-db → Backups → S3 destination kur.

3. **Supabase Free limiti dolu**: 2 active proje + 1 paused → yeni proje açamazsın. tahminio paused'i silersen 3'üncü slot açılır. Veya Pro upgrade ($25/ay) sınırı kaldırır.

4. **GitHub repos public/private kontrolü**: x-platform public (içeride secret yok, OK). Diğerlerinin durumunu kontrol et — damga production kod açıkta olmamalı.

5. **API token rotation**: `4|iGjKOR0X...` root yetkili 30 günlük token. Sonraki ay yenile veya `claude-code` adındaki kalıcı token'ı kullan (kalıcı, asla expire olmuyor — daha riskli).

# 💰 Hizmet & Ödeme Raporu — X Platform için

> 2026-05-14 itibarıyla mevcut altyapı + büyürken sırayla almanız önerilen hizmetler.

## ✅ Şu an kullanılan (zaten ödüyorsun)

| Hizmet | Plan | Aylık ücret (yaklaşık) | Ne için |
|--------|------|--------------------------|---------|
| **Hetzner Cloud (CX22)** | 2 vCPU / 4 GB RAM / 40 GB SSD | ~€4 (~₺175) | Tek VPS — Coolify, x-web, x-api, x-platform-db, damga, lokma, tahminio hepsi burada |
| **Cloudflare** | Free plan | ₺0 | DNS + CDN + SSL edge + DDoS koruması |
| **GitHub** | Free (klchappy) | ₺0 | Repo + private repo + Actions (kullanılmıyor) |
| **Anthropic API** | Pay-as-you-go | tüketime göre | Claude Opus/Sonnet/Haiku — kullanım kadar |
| **Supabase** | Free plan (3 proje: damga, lokma, tahminio paused) | ₺0 | damga için auth + DB (lokma DB silindi, x-platform Supabase kullanmıyor — kendi PostgreSQL'imiz var) |

**Tahmini şu anki aylık toplam**: **~₺175** (Hetzner) + AI tüketimi.

---

## ⚠ KRİTİK — Üyeliği/anahtarı hemen almalısın (ödeme yapacaksan satışa hazır olur)

### 1. **Anthropic API key** — 🔴 ZORUNLU eğer AI özelliği satıyorsan
- **Neden**: `/v1/ai/chat` endpoint'i ve `AiChat` UI'ı şu an `ANTHROPIC_API_KEY` env yokken **503** dönüyor. Müşteri AI'sız bir SaaS'a aylık ₺499-4999 ödemez.
- **Maliyet**: Pay-as-you-go, ön ödeme yok. Demo seviyesinde ayda ~$10-50, ciddi kullanım için $200+.
- **Nereden**: https://console.anthropic.com → API Keys → Create
- **Nereye**: Coolify x-api env → `ANTHROPIC_API_KEY=sk-ant-...` → Redeploy
- **Pricing referansı** (1M token başına):
  - Claude Opus 4.7: $15 input / $75 output
  - Claude Sonnet 4.6: $3 / $15  ← önerilen default
  - Claude Haiku 4.5: $0.80 / $4
- **Bizim plan kotalarımız** zaten bu fiyatlara göre kâr marjıyla ayarlandı:
  - Pro plan (₺1.499/ay): 5M token/ay → maliyet ~$22 → kâr ~%170

### 2. **Iyzico Merchant hesabı** — 🔴 ZORUNLU eğer ücretli abonelik satıyorsan
- **Neden**: Şu an `/v1/billing/switch` plan kaydı oluşturuyor ama **ödeme almıyor**. Müşteri "Pro Plana Geç" tıklayınca trial veriyoruz, fakat 30 gün sonra otomatik tahsilat yok.
- **Maliyet**: 
  - **Açılış**: ₺0
  - **Komisyon**: TR kartlar için %2.89 + ₺0.25/işlem, taksitli %3+
  - **Aylık sabit**: ₺0 (çoğu plan)
- **Nereden**: https://merchant.iyzipay.com → Başvur (vergi numarası + IBAN + KEP gerekli)
- **Nereye**: Coolify x-api env → `IYZICO_API_KEY=...`, `IYZICO_SECRET_KEY=...`, `IYZICO_BASE_URL=https://api.iyzipay.com` (sandbox: `https://sandbox-api.iyzipay.com`)
- **Mevcut iskelet**: `/v1/iyzico/checkout/init`, `/webhook`, `/status` — anahtarlar gelince TODO'lar gerçek API'ye bağlanır.
- **Alternatifler**: Paddle (global, %5+₺0.50, KDV+VAT halleder), Stripe (TR'de doğrudan yok), PayTR (Iyzico'ya benzer, %2.49+₺0.30).

### 3. **Resend (veya SMTP)** — 🟡 ÖNEMLİ eğer davet/şifre sıfırlama maili göndermek istiyorsan
- **Neden**: Davet sistemi şu an sadece link üretiyor, kullanıcı manuel link kopyalamak zorunda. Magic-link-style sign-in yapamıyoruz.
- **Maliyet**: Resend free → 3.000 mail/ay; Pro → $20/ay 50K mail
- **Nereden**: https://resend.com → API Keys
- **Nereye**: x-api env → `RESEND_API_KEY=re_...`, `EMAIL_FROM=no-reply@deploi.net`
- **Alternatif**: Hetzner kendi SMTP (ücretsiz, ama deliverability düşük), Brevo (eski Sendinblue, free 300/gün), Postmark ($10/ay).

---

## 🟢 Şu an gerek YOK ama büyürken sıraya alacaksın

### 4. **Supabase Pro** — sonraki adım eğer self-hosted Postgres'ten Supabase'e geçmek istersen
- **Neden gerek olabilir**: Supabase Auth (OAuth provider'lar, MFA, magic link), Realtime, Edge Functions, Storage. Şu an kendi auth + Coolify Postgres ile çalışıyoruz — bu yeterli ama Supabase ek özellikleri hızlandırır.
- **Maliyet**: $25/ay (8GB DB + 100GB transfer + auth + storage 100GB)
- **Şu an gerekmez çünkü**: 1 VPS'te 1 PostgreSQL + 1 backup yeterli (5-10 müşteriye kadar). 50+ müşteri olunca DB'yi ayrı sunucuya almak istersen Supabase mantıklı.
- **Mevcut Free plan limit**: 2 active proje. Damga + Lokma dolu, tahminio paused. x-platform için 4. proje ekleyemiyorsun — Pro'ya geçince sınır kalkar.

### 5. **Sentry (veya Better Stack Logs)** — 🟡 hatayı erken görmek için
- **Neden**: Şu an üretim hataları sadece Coolify log'larında. Müşteri bir hata yaşar, biz fark etmeyiz. Sentry frontend + backend tüm exception'ları, slow query'leri toplar.
- **Maliyet**: Sentry Free → 5K event/ay; Team $26/ay 50K event.
- **Alternatif**: Better Stack Logs ($24/ay), Coolify built-in logs (zaten var, alarmsız).

### 6. **Coolify VPS upgrade (Hetzner CX32 veya CX42)** — 10+ müşteride
- **Neden**: Şu anki CX22 (4GB RAM) damga + lokma + x-platform-db + x-api + x-web + Coolify + Traefik hep beraber çalışıyor. AI yoğun kullanımda swap'lar.
- **Maliyet**:
  - CX32 (4vCPU, 8GB, 80GB): €8/ay (~₺350)
  - CX42 (8vCPU, 16GB, 160GB): €17/ay (~₺750)
- **Şu an gerekmez**: 5 demo müşteri için CX22 yeter.

### 7. **Hetzner Storage Box veya Backblaze B2** — backup'lar için
- **Neden**: Coolify built-in Postgres backup oluşturur ama VPS bozulursa kaybolur. Off-site backup şart.
- **Maliyet**:
  - Hetzner Storage Box BX11 (1TB): €4/ay
  - Backblaze B2 ($6/TB pay-as-you-go)
- **Setup**: Coolify Backups → S3 destination = B2 bucket.

### 8. **Cloudflare R2 (S3 alternatifi)** — dosya yükleme özelliği eklenince
- **Neden**: Selfie upload (damga), reçete fotoğrafı (lokma), ürün resmi (ticaret), e-fatura PDF (ticaret). VPS diskinde tutarsan büyür + yedek almak zor.
- **Maliyet**: R2 → İlk 10GB ücretsiz, sonrası $0.015/GB/ay, **egress (download) ücretsiz** (S3'ten çok daha ucuz).
- **Nereden**: Cloudflare dashboard → R2 → Create Bucket.

### 9. **KEP (Kayıtlı Elektronik Posta)** — Ticaret modülü tam çalışınca
- **Neden**: Etiksistem'den port ettiğimiz Ticaret modülü e-Fatura ve resmi yazışmalar için KEP zorunlu (Türk hukuku). Müşteri Ticaret modülüne ödüyorsa KEP olmadan eksik kalır.
- **Maliyet**: PTT KEP yıllık ~₺500-1500 (kullanım hacmine göre).
- **Alternatif provider'lar**: Hitit Kep, e-Güven Kep, Türkkep.
- **Çoğunlukla**: Her şirket kendi KEP'ini almalı — sen sadece entegrasyonu sağlarsın (API key'i x-api integration_connections'a yazarsın).

### 10. **e-Fatura entegratörü** — Ticaret modülü için
- **Neden**: e-Fatura GIB üzerinden gönderilir ama doğrudan değil — bir entegratör aracılığıyla (DigitalPlanet, Logo, Nexum, Foriba). 
- **Maliyet**: Aylık ~₺200-800 + fatura başına ₺0.50-2 (paket bazlı).
- **Alternatif**: GİB ücretsiz portal (manuel, otomasyon yok) — sadece çok düşük hacim için.

### 11. **Twilio (SMS / WhatsApp Business)** — santral modülü için
- **Neden**: Santral'in çağrı hatırlatma + sesli asistan akışları SMS/WhatsApp ile çalışırsa daha güçlü.
- **Maliyet**: 
  - SMS Turkey: $0.027/SMS (~₺1.10)
  - WhatsApp Business: $0.005-0.08/conversation
- **Alternatif**: NetGSM (TR yerel, daha ucuz), Vonage.

### 12. **Domain extra** — sub-tenant her müşteriye ayrı subdomain istersen
- **Neden**: Şu an tüm tenant'lar `x.deploi.net` altında. Müşteri kendi markasıyla istiyorsa `acme.x.deploi.net` veya kendi `acme.com.tr` cname'i.
- **Maliyet**: Cloudflare wildcard SSL → free. Custom domain için sadece müşterinin domain'i.

---

## 📊 Aşamalı yatırım planı

### Aşama 1: İlk 1-5 müşteri — **₺175/ay + AI tüketimi (~₺200-500/ay)**
- ✅ Hetzner CX22 (mevcut)
- ✅ Cloudflare Free (mevcut)
- 🔴 **Anthropic API key** — kritik
- 🔴 **Iyzico merchant hesabı** — ücretli plan satacaksan
- 🟡 **Resend** (free tier yeter)
- **Toplam: ~₺175-700/ay**

### Aşama 2: 5-30 müşteri — **~₺2.500/ay**
- Yukarıdakiler +
- Hetzner CX32 upgrade (₺350/ay)
- Sentry Team ($26 = ~₺1.100/ay)
- Storage Box backup (€4 = ~₺175/ay)
- Resend Pro ($20 = ~₺850/ay)

### Aşama 3: 30-100+ müşteri — **~₺6-10K/ay**
- Yukarıdakiler +
- Hetzner CX42 (₺750/ay)
- Supabase Pro veya kendi managed Postgres ($25-100/ay)
- KEP + e-Fatura entegratör (₺500-2000/ay)
- Twilio AI çağrılar için ($100-500/ay)
- Eğer trafik artarsa Cloudflare Pro ($20/ay) — WAF + analytics

---

## 🚨 Hemen şu hafta yap

1. **Anthropic API key** çek → Coolify x-api env'ye `ANTHROPIC_API_KEY` ekle → AI chat çalışsın.
2. **Iyzico'ya kayıt başvur** (3-7 gün onay). Aktifleşince x-api env'ye anahtarları gir.
3. **Resend'a kayıt** → `RESEND_API_KEY` env'e gir (gerçek davet mailleri için).
4. **Hetzner snapshot al** (haftalık ₺~5) — disaster recovery için.

## Senin için riskler (ödeme yapmazsan)

| Risk | Etki |
|------|------|
| Anthropic key yok | AI özellikleri 503 döner → "Pro" planın değeri %50 düşer |
| Iyzico yok | Müşteri "Pro plan" tıklayınca trial başlar ama 30 gün sonra ödeme alınmaz, mantığı bozulur |
| Resend yok | Davet linki manuel paylaşılır → ekip kurma UX'i kötü |
| Backup yok | VPS bozulursa tüm tenant verisi kaybolur → KVKK/sorumluluk riski |
| Sentry yok | Müşteri hataları bizim göremediğimiz hatalar yüzünden churn eder |

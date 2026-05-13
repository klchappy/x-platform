# X Platform Ücretlendirme & Müşteri Kullanım Rehberi

> 2026-05-13 itibarıyla canlı: https://x.deploi.net

## Müşteriye Sunum Modeli

X Platform, **modül-shell SaaS** modelinde sunulur. Her müşteri (tenant) kendi `org` kaydını alır, içine 4 modülden istediğini açar/kapatır. Veri tamamen tenant'a izole.

### 4 Plan

| Plan | Aylık | Kullanıcı | AI Token/Ay | Modüller | Hedef Müşteri |
|------|-------|-----------|-------------|----------|---------------|
| **Ücretsiz** | 0 ₺ | 3 | 50K | 1 (seçer) | Deneme, küçük ekipler |
| **Başlangıç** | 499 ₺ | 15 | 500K | 2 | Tek lokasyonlu işletmeler |
| **Pro** ⭐ | 1.499 ₺ | 50 | 5M | 4 | Çoklu sektör, AI yoğun |
| **Kurumsal** | 4.999 ₺ | Sınırsız | 50M | 4 + özelleştirme | Holding, multi-org |

Pro plan "En çok tercih edilen" rozetli olarak vurgulandı.

### Sektör Paketleri (Önerilen Modül Kombinasyonu)

- **Restoran/Catering**: lokma + damga + santral
- **Tekstil/Üretim**: ticaret + damga + santral
- **Ofis/Hizmet**: santral + damga
- **Tam Paket**: 4 modül (holding)

## Veri İzolasyonu (Multi-tenant)

Her tablo `org_id` foreign key ile `orgs` tablosuna bağlı, CASCADE delete.

```sql
-- Örnek query (her endpoint'te ZORUNLU)
SELECT * FROM tablo WHERE org_id = $authOrgId;
```

`packages/module-api`'deki `withTenant()` helper modüllerin bunu unutmasını engeller:
```ts
router.post('/recipe', withTenant(async (req, res, _, t) => {
  // t.orgId garanti — başka tenant'ın verisi görünmez
}));
```

## AI Kotası Akışı

1. Frontend `/v1/ai/chat` çağırır (Bearer token + body: `{provider, messages, moduleId?}`).
2. API `getActivePlan(orgId)` → planın `aiTokensPerMonth` kotasını okur.
3. Mevcut ay kullanımı `usage_counters` tablosundan okur.
4. Kalan > 0 ise provider'a (Anthropic/OpenAI/Google) proxy.
5. Yanıt sonrası `ai_usage` tablosuna log + `usage_counters` artırılır.
6. Kota dolarsa **HTTP 429 `ai_quota_exceeded`** — UI "Planı yükselt" CTA gösterir.

## Yeni Müşteri Onboarding

1. Müşteri `https://x.deploi.net/sign-in` üzerinden email gönderir → Supabase magic link.
2. Kabul ettiğinde otomatik **trial org** açılır (14 gün, Pro özelliklerine erişim).
3. `/app/billing` üzerinden plan seçer (Iyzico ile aylık otomatik tahsilat — kurulum yapıldığında).
4. `/app/team` üzerinden personelini davet eder (7 gün geçerli token).
5. `/app/modules` üzerinden modülleri açar/kapatır.

## Ne Hazır, Ne Geliyor

### ✅ Şu an canlı
- Landing + pricing + 4 modül stub'ı
- API: auth, me, orgs, modules, billing (plan switch), invitations, ai gateway
- Tenant izolasyon iskeleti (withTenant helper, ZORUNLU)
- Plan/subscription/usage tracking şeması
- Coolify deploy + GitHub auto-redeploy

### ⏳ Sonraki adımlar (sıralı önem)
1. **Supabase prod projesi** + DATABASE_URL'i Coolify env'ye gir + migration çalıştır → gerçek tenant kaydı çalışır.
2. **Iyzico subscription** integration — şu an `/v1/billing/switch` plan kaydı oluşturuyor ama ödeme almıyor; CheckoutForm bağlanacak.
3. **Modül full port**: damga (attendance/shifts/leaves), lokma (recipes/stock), santral (calls/CRM), ticaret (sales/KEP/eFatura).
4. **AI provider key per-org**: `integration_connections` tablosunda her tenant kendi key'ini saklayabilir (şu an env'den ortak key okur).
5. **PostgreSQL RLS policies** — schema'lar hazır, policy'leri ekleyince DB seviyesinde de izolasyon zorlanır.

## Faturalandırma Sırasında Dikkat

- **KDV**: Listelenen fiyatlar KDV hariç. Iyzico checkout'ta otomatik eklenecek.
- **Yıllık ödeme**: %15-20 indirim ile yıllık sunulabilir (UI'a eklendiğinde plan tablosunda toggle).
- **Token over-usage**: Şu an 429 dönüyor — overflow rate (örn. ₺0.05/1K token) ile esnek satış da mümkün.
- **Trial otomatik düşüş**: trial_ends_at geçince Free'ye düşürme cron'u kurulmalı (lokma'daki `period-end-downgrade.service` pattern'i).

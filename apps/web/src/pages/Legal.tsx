import * as React from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';

type LegalDoc = 'kvkk' | 'terms' | 'privacy' | 'cookies';

const DOC_INFO: Record<LegalDoc, { title: string; subtitle: string }> = {
  kvkk: { title: 'KVKK Aydınlatma Metni', subtitle: '6698 Sayılı Kişisel Verilerin Korunması Kanunu' },
  terms: { title: 'Kullanım Şartları', subtitle: 'X Platform kullanım koşulları' },
  privacy: { title: 'Gizlilik Politikası', subtitle: 'Verilerinizi nasıl koruduğumuz' },
  cookies: { title: 'Çerez Politikası', subtitle: 'Hangi çerezleri kullandığımız' },
};

const NAV: LegalDoc[] = ['kvkk', 'terms', 'privacy', 'cookies'];

export function LegalPage(): React.ReactElement {
  const { doc } = useParams<{ doc: string }>();
  if (!doc || !(doc in DOC_INFO)) return <Navigate to="/legal/kvkk" replace />;
  const d = doc as LegalDoc;
  const info = DOC_INFO[d];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40 }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontWeight: 800 }}>
          <div className="x-side__brand-mark" style={{ width: 28, height: 28, fontSize: 12 }}>X</div>
          X Platform
        </Link>
        <Link to="/" className="x-btn x-btn--ghost" style={{ fontSize: 13 }}>← Anasayfa</Link>
      </nav>

      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 6 }}>{info.title}</h1>
        <p style={{ color: 'var(--x-muted)', fontSize: 14 }}>{info.subtitle}</p>
        <p style={{ color: 'var(--x-muted)', fontSize: 12, marginTop: 4 }}>
          Son güncelleme: 2026-05-15 · Yürürlük: 2026-05-15
        </p>
      </header>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32, paddingBottom: 16, borderBottom: '1px solid var(--x-line)' }}>
        {NAV.map((id) => (
          <Link
            key={id}
            to={`/legal/${id}`}
            className={id === d ? 'x-btn' : 'x-btn x-btn--ghost'}
            style={{ fontSize: 12, padding: '6px 12px' }}
          >
            {DOC_INFO[id].title}
          </Link>
        ))}
      </div>

      <article style={{ lineHeight: 1.7, color: '#cbd5e1', fontSize: 15 }}>
        {d === 'kvkk' && <KvkkContent />}
        {d === 'terms' && <TermsContent />}
        {d === 'privacy' && <PrivacyContent />}
        {d === 'cookies' && <CookiesContent />}
      </article>

      <footer style={{ marginTop: 60, paddingTop: 24, borderTop: '1px solid var(--x-line)', color: 'var(--x-muted)', fontSize: 13, textAlign: 'center' }}>
        Sorularınız için: <a href="mailto:kvkk@deploi.net" style={{ color: 'var(--x-fg)' }}>kvkk@deploi.net</a>
      </footer>
    </div>
  );
}

function H2({ children }: { children: React.ReactNode }): React.ReactElement {
  return <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 24, marginBottom: 12, color: 'var(--x-fg)' }}>{children}</h2>;
}
function P({ children }: { children: React.ReactNode }): React.ReactElement {
  return <p style={{ marginBottom: 12 }}>{children}</p>;
}
function UL({ children }: { children: React.ReactNode }): React.ReactElement {
  return <ul style={{ paddingLeft: 22, marginBottom: 12 }}>{children}</ul>;
}

function KvkkContent(): React.ReactElement {
  return (
    <>
      <H2>1. Veri Sorumlusu</H2>
      <P>
        X Platform, bir SaaS hizmeti olarak müşteri kuruluşların (tenant) verilerini işler. Müşteri kuruluş = veri sorumlusu;
        X Platform = veri işleyen. Her tenant kendi org_id ile izole edilir.
      </P>

      <H2>2. İşlenen Veri Kategorileri</H2>
      <UL>
        <li><strong>Kimlik:</strong> ad-soyad, e-posta, kullanıcı adı.</li>
        <li><strong>İletişim:</strong> telefon, iş yeri adresi.</li>
        <li><strong>İşlem:</strong> giriş/çıkış kayıtları, oluşturulan kayıtlar (modül bazlı).</li>
        <li><strong>Lokasyon (Damga modülü):</strong> GPS/IP — sadece kullanıcının açık rızası ile.</li>
        <li><strong>Anonim bildirimler (Etik modülü):</strong> KVKK kapsamı dışında, kimlik kaydı tutulmaz.</li>
      </UL>

      <H2>3. İşleme Amaçları</H2>
      <UL>
        <li>Hizmet sunumu, kullanıcı kimlik doğrulama.</li>
        <li>İş süreçlerinin yürütülmesi (personel takibi, muhasebe, vb.).</li>
        <li>Yasal yükümlülüklerin yerine getirilmesi (İş Kanunu, KVKK).</li>
      </UL>

      <H2>4. Saklama Süresi</H2>
      <P>
        İşlem kayıtları yasal asgari süreye uygun saklanır (İş Kanunu m.75: 5 yıl). Hesap kapanışından
        sonra 90 gün içinde anonimleştirilir veya silinir.
      </P>

      <H2>5. Haklarınız</H2>
      <P>
        KVKK m.11 kapsamında: bilgi talep etme, düzeltme, silme, işleme itiraz, otomatik karara itiraz,
        zararın giderilmesi. Başvurularınız için: <a href="mailto:kvkk@deploi.net" style={{ color: 'var(--x-fg)' }}>kvkk@deploi.net</a>
        — 30 gün içinde yanıtlanır.
      </P>

      <H2>6. Veri Aktarımı</H2>
      <UL>
        <li>Hetzner Cloud (Almanya, GDPR uyumlu) — barındırma.</li>
        <li>Anthropic (ABD) — AI özellikleri kullanılırsa; iletilen veri model eğitiminde kullanılmaz (Anthropic API politikası).</li>
        <li>Yurtdışı aktarım: KVKK m.9 kapsamında, açık rıza veya yeterli korumalı ülkeye aktarım.</li>
      </UL>
    </>
  );
}

function TermsContent(): React.ReactElement {
  return (
    <>
      <H2>1. Hizmet Tanımı</H2>
      <P>
        X Platform; etik bildirim, personel takibi, envanter, muhasebe ve santral modüllerini sunan bir SaaS
        platformudur. Kullanıcı = kayıtlı müşteri kuruluşun bir personeli.
      </P>

      <H2>2. Hesap & Sorumluluk</H2>
      <UL>
        <li>Şifrenizin gizliliği size aittir. Paylaşılan oturumlardan doğan zararlardan sorumlu değiliz.</li>
        <li>Hesabın bağlı olduğu kuruluş (org) tüm verilerin sahibidir; tek tek personel değil.</li>
        <li>Yasa dışı kullanım, başka kullanıcılara saldırı, sistem manipülasyonu kesinlikle yasaktır.</li>
      </UL>

      <H2>3. Abonelik & Ödeme</H2>
      <UL>
        <li>14 gün ücretsiz deneme. Trial sonunda otomatik tahsilat <em>henüz</em> aktif değil (Iyzico entegrasyonu pending).</li>
        <li>İptal: dilediğin zaman, dönem sonuna kadar hizmet açık.</li>
        <li>İade: KDV dahil ödenen tutar, kullanılmayan ay sayısına orantılı.</li>
      </UL>

      <H2>4. Hizmet Seviyesi</H2>
      <P>
        Hedef: %99.5 uptime. SLA garantisi sadece Kurumsal plan'da. Bakım pencereleri 24 saat önce bildirilir.
      </P>

      <H2>5. Fesih</H2>
      <P>
        Yasa dışı kullanım, ödeme gecikmesi veya kötüye kullanım durumunda hesap askıya alınabilir. Veri export
        hakkı her zaman vardır (org owner üzerinden).
      </P>

      <H2>6. Sorumluluk Sınırı</H2>
      <P>
        Dolaylı zararlar (kâr kaybı, iş kesintisi) için sorumluluk sınırlıdır. Doğrudan zararlar için son
        12 aylık ödemenin 1 katı ile sınırlıdır.
      </P>

      <H2>7. Uygulanacak Hukuk</H2>
      <P>
        Türkiye Cumhuriyeti hukuku. İstanbul mahkemeleri yetkilidir.
      </P>
    </>
  );
}

function PrivacyContent(): React.ReactElement {
  return (
    <>
      <H2>Verilerinizi nasıl koruyoruz</H2>
      <UL>
        <li><strong>Multi-tenant izolasyon:</strong> Her sorgu org_id ile filtrelenir. Başka tenant'ın verisi görünmez.</li>
        <li><strong>Şifreleme:</strong> Tüm istekler TLS 1.3 (Cloudflare edge). Şifre bcrypt (12 round).</li>
        <li><strong>JWT:</strong> 30 günlük süreyle, HMAC-SHA256 imzalı, sunucu side secret ile.</li>
        <li><strong>Audit log:</strong> Kritik aksiyonlar (silme, plan değişikliği, davet) loglanır.</li>
        <li><strong>Hash-chain (Damga modülü):</strong> Yoklama kayıtları değiştirilemez, kriptografik zincir doğrulanabilir.</li>
        <li><strong>Anonim raporlar (Etik):</strong> Reporter kimliği DB'de tutulmaz, sadece tek seferlik takip token.</li>
      </UL>

      <H2>Kim erişebilir</H2>
      <UL>
        <li>Sadece sizin kuruluşunuzun yetkili kullanıcıları (rol bazlı).</li>
        <li>Platform admin (X Platform ekibi) sadece destek için, müşteri onayı ile.</li>
        <li>Üçüncü taraf: yok. Veri satılmaz, kiralanmaz, reklam için kullanılmaz.</li>
      </UL>

      <H2>Veri ihlali</H2>
      <P>
        Bir güvenlik ihlali tespit edilirse 72 saat içinde KVKK Kurumu'na ve etkilenen tenant'lara bildirilir.
      </P>
    </>
  );
}

function CookiesContent(): React.ReactElement {
  return (
    <>
      <H2>Kullandığımız çerezler</H2>
      <UL>
        <li><strong>x-cookie-consent</strong> (localStorage, 1 yıl): bu banner'a verdiğin yanıt.</li>
        <li><strong>x_token</strong> (localStorage, 30 gün): JWT oturum token'ın. Çıkış yapınca silinir.</li>
        <li><strong>x_demo_user</strong> (localStorage, oturum): demo modunda kullanılan e-posta.</li>
      </UL>

      <H2>Üçüncü taraf çerez yok</H2>
      <P>
        Google Analytics, Facebook Pixel veya reklam takip çerezi kullanmıyoruz. Cloudflare CDN bağlantınızı
        kötü trafik için analiz eder ama kullanıcı bazında çerez yerleştirmez.
      </P>

      <H2>Kontrol</H2>
      <P>
        Tarayıcı ayarlarından her zaman localStorage'ı temizleyebilirsiniz; bu sizi otomatik olarak logout eder.
      </P>
    </>
  );
}

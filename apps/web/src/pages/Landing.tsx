import * as React from 'react';
import { Link } from 'react-router-dom';
import { MODULES, MODULE_IDS, SECTOR_BUNDLES, PLANS, formatTry } from '@x/shared';

export function LandingPage(): React.ReactElement {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 24px' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 80 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800, fontSize: 20 }}>
          <div className="x-side__brand-mark" style={{ width: 32, height: 32, fontSize: 14 }}>X</div>
          X Platform
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/sign-in" className="x-btn x-btn--ghost">Giriş</Link>
          <Link to="/app/dashboard" className="x-btn">Demo'yu Aç</Link>
        </div>
      </nav>

      <section style={{ textAlign: 'center', marginBottom: 80 }}>
        <div style={{ fontSize: 13, color: 'var(--x-muted)', marginBottom: 12, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          Çoklu Sektör · Tek Çatı
        </div>
        <h1 style={{ fontSize: 48, fontWeight: 900, lineHeight: 1.1, marginBottom: 20 }}>
          Şirketinin <span style={{ background: 'linear-gradient(135deg,#f97316,#7c3aed)', WebkitBackgroundClip: 'text', color: 'transparent' }}>operasyon işletim sistemi</span>
        </h1>
        <p style={{ fontSize: 18, color: 'var(--x-muted)', maxWidth: 720, margin: '0 auto 32px', lineHeight: 1.6 }}>
          Personel takibinden mutfak operasyonuna, ofis sekretaryasından üretim/ihracat ERP'sine kadar 4 modül tek panelde. Modüllerini sektörüne göre aç-kapa, ortak müşteri/personel/audit altyapısıyla yönet.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link to="/app/dashboard" className="x-btn">Demo Tenant'ı Gör</Link>
          <a href="#modules" className="x-btn x-btn--ghost">Modüller</a>
        </div>
      </section>

      <section id="modules" style={{ marginBottom: 80 }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 24, textAlign: 'center' }}>4 Modül</h2>
        <div className="x-cards">
          {MODULE_IDS.map((id) => {
            const m = MODULES[id];
            return (
              <div key={id} className="x-card">
                <div style={{ fontSize: 32, marginBottom: 8 }}>{m.icon}</div>
                <h3>{m.name}</h3>
                <p>{m.description}</p>
                <span className="x-badge">{m.sector}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section style={{ marginBottom: 80 }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>Hazır Sektör Paketleri</h2>
        <p style={{ color: 'var(--x-muted)', textAlign: 'center', marginBottom: 24 }}>İşine uygun modülleri tek tıkla aktive et.</p>
        <div className="x-cards">
          {SECTOR_BUNDLES.map((b) => (
            <div key={b.id} className="x-card">
              <h3>{b.name}</h3>
              <p>{b.description}</p>
              <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {b.recommendedModules.map((mid) => (
                  <span key={mid} className="x-badge">{MODULES[mid].icon} {MODULES[mid].name}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" style={{ marginBottom: 80 }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>Planlar & Fiyatlar</h2>
        <p style={{ color: 'var(--x-muted)', textAlign: 'center', marginBottom: 24 }}>
          14 gün ücretsiz deneme · İstediğin zaman iptal · Aylık abonelik
        </p>
        <div className="x-cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', alignItems: 'stretch' }}>
          {PLANS.map((p) => (
            <div
              key={p.id}
              className="x-card"
              style={{
                cursor: 'default',
                borderColor: p.highlight ? '#f97316' : undefined,
                borderWidth: p.highlight ? 2 : 1,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {p.highlight && (
                <span
                  className="x-badge"
                  style={{
                    position: 'absolute',
                    top: -10,
                    right: 12,
                    background: '#f97316',
                    color: '#fff',
                    fontWeight: 700,
                  }}
                >
                  En çok tercih edilen
                </span>
              )}
              <h3 style={{ marginBottom: 4 }}>{p.name}</h3>
              <p style={{ fontSize: 12, color: 'var(--x-muted)', margin: 0, marginBottom: 16 }}>{p.tagline}</p>
              <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 4 }}>
                {p.priceMonthlyTry === 0 ? 'Ücretsiz' : formatTry(p.priceMonthlyTry)}
              </div>
              {p.priceMonthlyTry > 0 && (
                <div style={{ fontSize: 12, color: 'var(--x-muted)', marginBottom: 16 }}>aylık · KDV hariç</div>
              )}
              <ul style={{ fontSize: 13, color: '#cbd5e1', listStyle: 'none', padding: 0, margin: '12px 0', lineHeight: 1.7, flex: 1 }}>
                {p.features.map((f, i) => (
                  <li key={i}>✓ {f}</li>
                ))}
              </ul>
              <Link
                to={`/sign-in?plan=${p.id}`}
                className={p.highlight ? 'x-btn' : 'x-btn x-btn--ghost'}
                style={{ width: '100%', textAlign: 'center', marginTop: 'auto' }}
              >
                {p.priceMonthlyTry === 0 ? 'Hemen Başla' : `${p.trialDays} Gün Ücretsiz Dene`}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <footer style={{ textAlign: 'center', color: 'var(--x-muted)', fontSize: 13, paddingTop: 40, borderTop: '1px solid var(--x-line)' }}>
        X Platform · deploi.net altyapısı · Hetzner + Coolify + Cloudflare
      </footer>
    </div>
  );
}

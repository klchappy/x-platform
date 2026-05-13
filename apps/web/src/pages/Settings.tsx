import * as React from 'react';
import { Link } from 'react-router-dom';

export function SettingsPage(): React.ReactElement {
  return (
    <div>
      <div className="x-topbar">
        <div>
          <div className="x-topbar__title">Ayarlar</div>
          <div className="x-topbar__sub">Tenant, kullanıcılar, entegrasyonlar, faturalama</div>
        </div>
      </div>
      <div className="x-cards">
        <Link to="/app/billing" className="x-card">
          <h3>💳 Plan & Faturalama</h3>
          <p>Plan, AI token kotası, abonelik durumu, Iyzico</p>
        </Link>
        <Link to="/app/team" className="x-card">
          <h3>👥 Ekip & Davetler</h3>
          <p>Kullanıcı davet et, rol ata, modül erişimi</p>
        </Link>
        <div className="x-card" style={{ opacity: 0.6, cursor: 'default' }}>
          <h3>🏢 Tenant</h3>
          <p>Şirket adı, slug, sektör paketi, KVKK metni</p>
          <span className="x-badge">Yakında</span>
        </div>
        <div className="x-card" style={{ opacity: 0.6, cursor: 'default' }}>
          <h3>🔌 Entegrasyonlar</h3>
          <p>AI (Claude/GPT/Gemini), Resend, Twilio, KEP, Iyzico</p>
          <span className="x-badge">Yakında</span>
        </div>
        <div className="x-card" style={{ opacity: 0.6, cursor: 'default' }}>
          <h3>🔑 API Anahtarları</h3>
          <p>x_live_* (org admin) ve x_svc_* (servis) anahtarları</p>
          <span className="x-badge">Yakında</span>
        </div>
        <div className="x-card" style={{ opacity: 0.6, cursor: 'default' }}>
          <h3>📋 Denetim Logu</h3>
          <p>Modül-bazlı audit kayıtları, KVKK export</p>
          <span className="x-badge">Yakında</span>
        </div>
      </div>
    </div>
  );
}

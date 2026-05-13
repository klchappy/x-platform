import * as React from 'react';

export function SettingsPage(): React.ReactElement {
  return (
    <div>
      <div className="x-topbar">
        <div>
          <div className="x-topbar__title">Ayarlar</div>
          <div className="x-topbar__sub">Tenant, kullanıcılar, entegrasyonlar, billing</div>
        </div>
      </div>
      <div className="x-cards">
        <div className="x-card">
          <h3>🏢 Tenant</h3>
          <p>Şirket adı, slug, sektör paketi, KVKK metni</p>
        </div>
        <div className="x-card">
          <h3>👥 Kullanıcılar & Rol</h3>
          <p>owner / admin / manager / employee · davetler</p>
        </div>
        <div className="x-card">
          <h3>🔌 Entegrasyonlar</h3>
          <p>AI (Claude/GPT/Gemini), Resend, Twilio, KEP, Iyzico</p>
        </div>
        <div className="x-card">
          <h3>💳 Billing</h3>
          <p>Plan, modül bazlı kullanım, Iyzico abonelik</p>
        </div>
        <div className="x-card">
          <h3>🔑 API Anahtarları</h3>
          <p>x_live_* (org admin) ve x_svc_* (servis) anahtarları</p>
        </div>
        <div className="x-card">
          <h3>📋 Denetim Logu</h3>
          <p>Modül-bazlı audit kayıtları, KVKK export</p>
        </div>
      </div>
    </div>
  );
}

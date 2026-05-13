import * as React from 'react';

export function SantralModulePage(): React.ReactElement {
  return (
    <div className="x-mod x-mod-santral">
      <header className="x-mod__head">
        <span className="x-mod__icon">☎️</span>
        <div>
          <h1>Santral</h1>
          <p>Sesli asistan, çağrı kaydı, randevu yönetimi ve CRM tek panelde.</p>
        </div>
      </header>
      <section className="x-mod__grid">
        <div className="x-card">
          <h3>📞 Çağrı Kaydı</h3>
          <p>Gelen / giden / cevapsız, hatırlatma, kişi bağlama.</p>
        </div>
        <div className="x-card">
          <h3>🎙 Sesli Sekreter</h3>
          <p>Ses → niyet sınıflandırma → görev/randevu/not otomatik oluşturma.</p>
        </div>
        <div className="x-card">
          <h3>📝 Toplantı</h3>
          <p>Ses kaydı, transkript, AI özet, aksiyon maddeleri.</p>
        </div>
        <div className="x-card">
          <h3>📇 Rehber & CRM</h3>
          <p>İç rehber, dış kişiler, pipeline, fırsat takibi.</p>
        </div>
        <div className="x-card">
          <h3>📅 Takvim</h3>
          <p>Google Calendar çift yönlü sync, tekrarlayan görevler.</p>
        </div>
      </section>
      <footer className="x-mod__foot">
        <p>Kabuk entegrasyonu aktif. Tam port (contacts, calls, meetings) sonraki sürümde.</p>
      </footer>
    </div>
  );
}

export default SantralModulePage;

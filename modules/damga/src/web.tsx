import * as React from 'react';

export function DamgaModulePage(): React.ReactElement {
  return (
    <div className="x-mod x-mod-damga">
      <header className="x-mod__head">
        <span className="x-mod__icon">🪪</span>
        <div>
          <h1>Damga</h1>
          <p>Şeffaf personel takibi — NFC, QR, GPS doğrulamalı, hash-chain güvenceli.</p>
        </div>
      </header>
      <section className="x-mod__grid">
        <div className="x-card">
          <h3>📍 Yoklama</h3>
          <p>Çalışan check-in / check-out + multi-verification trust skoru.</p>
        </div>
        <div className="x-card">
          <h3>🗓 Vardiya</h3>
          <p>Vardiya planı, takas, fazla mesai otomatik hesaplama.</p>
        </div>
        <div className="x-card">
          <h3>🏖 İzin</h3>
          <p>Yıllık/hastalık/ücretsiz izin talep ve onay akışı.</p>
        </div>
        <div className="x-card">
          <h3>🏆 Oyunlaştırma</h3>
          <p>XP, seri, haftalık/aylık liderlik tablosu, ödül marketi.</p>
        </div>
        <div className="x-card">
          <h3>🔐 Denetim</h3>
          <p>Hash-chain ile değiştirilemez kayıt, KVKK uyumlu rapor.</p>
        </div>
      </section>
      <footer className="x-mod__foot">
        <p>Şu an kabuk entegrasyonu aktif. Tam port (attendance_events, shifts, leaves) sonraki sürümde.</p>
      </footer>
    </div>
  );
}

export default DamgaModulePage;

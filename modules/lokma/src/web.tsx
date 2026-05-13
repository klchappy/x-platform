import * as React from 'react';

export function LokmaModulePage(): React.ReactElement {
  return (
    <div className="x-mod x-mod-lokma">
      <header className="x-mod__head">
        <span className="x-mod__icon">🍳</span>
        <div>
          <h1>Lokma</h1>
          <p>Mutfak işletim sistemi — reçete, stok, tedarikçi, AI ile sahadan operasyon.</p>
        </div>
      </header>
      <section className="x-mod__grid">
        <div className="x-card">
          <h3>📘 Reçete</h3>
          <p>Hiyerarşik bileşen ağacı, base yield ölçekleme, allerjen takibi.</p>
        </div>
        <div className="x-card">
          <h3>📦 Stok (FEFO)</h3>
          <p>Parti bazlı takip, son kullanma uyarısı, fire/atık nedenleri.</p>
        </div>
        <div className="x-card">
          <h3>🚚 Tedarik</h3>
          <p>Tedarikçi yönetimi, satın alma siparişi, dönüşüm faktörleri.</p>
        </div>
        <div className="x-card">
          <h3>📅 Menü Planı</h3>
          <p>Haftalık menü, alışveriş listesi, eksik bileşen tespiti.</p>
        </div>
        <div className="x-card">
          <h3>🤖 AI Öneri</h3>
          <p>Claude/GPT/Gemini ile eldeki stoktan yemek önerileri.</p>
        </div>
      </section>
      <footer className="x-mod__foot">
        <p>Kabuk entegrasyonu aktif. Tam port (recipes, stock_lots, purchase_orders) sonraki sürümde.</p>
      </footer>
    </div>
  );
}

export default LokmaModulePage;

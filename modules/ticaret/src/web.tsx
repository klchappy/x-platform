import * as React from 'react';

export function TicaretModulePage(): React.ReactElement {
  return (
    <div className="x-mod x-mod-ticaret">
      <header className="x-mod__head">
        <span className="x-mod__icon">📦</span>
        <div>
          <h1>Ticaret</h1>
          <p>Üretim & ihracat ERP — satış, sevk, e-Fatura, KEP, kasa, risk ve onay akışları.</p>
        </div>
      </header>
      <section className="x-mod__grid">
        <div className="x-card">
          <h3>🧾 Satış & Teklif</h3>
          <p>Teklif → sipariş → sevk → fatura, dinamik fiyatlandırma.</p>
        </div>
        <div className="x-card">
          <h3>🏷 Etiket & Barkod</h3>
          <p>EAN-13, QR, ZPL (Zebra) termal yazıcı; mal/parti takibi.</p>
        </div>
        <div className="x-card">
          <h3>📨 e-Fatura & KEP</h3>
          <p>UBL XML e-Fatura, Kayıtlı Elektronik Posta entegrasyonu.</p>
        </div>
        <div className="x-card">
          <h3>💰 Kasa</h3>
          <p>Tahsilat, gün sonu Z raporu, komisyon hesabı.</p>
        </div>
        <div className="x-card">
          <h3>⚖️ Onay & Risk</h3>
          <p>İndirim onay akışı, müşteri risk skoru, kredi limiti.</p>
        </div>
      </section>
      <footer className="x-mod__foot">
        <p>Kabuk entegrasyonu aktif. Tam port (sales, shipments, e-Fatura, KEP) sonraki sürümde.</p>
      </footer>
    </div>
  );
}

export default TicaretModulePage;

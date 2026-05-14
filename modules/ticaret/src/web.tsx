import * as React from 'react';
import { formatTry } from '@x/shared';

interface Product {
  id: string;
  sku?: string;
  name: string;
  category?: string;
  unit: string;
  priceCentsTry: number;
  stockOnHand: number;
}

const headers = () => {
  const t = localStorage.getItem('x_token');
  const d = localStorage.getItem('x_demo_user');
  const h: Record<string, string> = { 'content-type': 'application/json' };
  if (t) h.authorization = `Bearer ${t}`;
  else if (d) h['x-demo-user'] = d;
  return h;
};

export function TicaretModulePage(): React.ReactElement {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [sku, setSku] = React.useState('');
  const [name, setName] = React.useState('');
  const [priceTry, setPriceTry] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      const r = await fetch('/v1/modules/ticaret/products', { headers: headers() });
      if (r.ok) setProducts(await r.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown');
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function add() {
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch('/v1/modules/ticaret/products', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          sku: sku || undefined,
          name,
          priceCentsTry: Math.round(Number(priceTry || '0') * 100),
        }),
      });
      if (!r.ok) throw new Error(await r.text());
      setSku('');
      setName('');
      setPriceTry('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="x-mod x-mod-ticaret">
      <header className="x-mod__head">
        <span className="x-mod__icon">📦</span>
        <div>
          <h1>Ticaret · ERP</h1>
          <p>Ürün, müşteri, sevk, fatura, kasa.</p>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: 'var(--x-muted)' }}>ÜRÜN SAYISI</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{products.length}</div>
        </div>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="x-card" style={{ cursor: 'default' }}>
          <h3>➕ Yeni Ürün</h3>
          <div className="x-stack">
            <input className="x-input" placeholder="SKU" value={sku} onChange={(e) => setSku(e.target.value)} />
            <input className="x-input" placeholder="Ürün adı" value={name} onChange={(e) => setName(e.target.value)} />
            <input
              className="x-input"
              type="number"
              step="0.01"
              placeholder="Fiyat (TL)"
              value={priceTry}
              onChange={(e) => setPriceTry(e.target.value)}
            />
            <button className="x-btn" onClick={add} disabled={busy || !name.trim()}>
              {busy ? 'Ekleniyor…' : 'Ekle'}
            </button>
            {error && <div style={{ fontSize: 12, color: '#fca5a5' }}>{error}</div>}
          </div>
        </div>

        <div className="x-card" style={{ cursor: 'default' }}>
          <h3>📦 Ürünler</h3>
          {products.length === 0 ? (
            <p style={{ color: 'var(--x-muted)', fontSize: 13 }}>Henüz ürün yok.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 240, overflowY: 'auto' }}>
              {products.map((p) => (
                <li
                  key={p.id}
                  style={{
                    padding: '8px 0',
                    borderBottom: '1px solid var(--x-line)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--x-muted)' }}>{p.sku ?? '—'}</div>
                  </div>
                  <div style={{ fontWeight: 700 }}>{formatTry(p.priceCentsTry)}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

export default TicaretModulePage;

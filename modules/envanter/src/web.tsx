import * as React from 'react';
import { formatTry } from '@x/shared';

interface Product {
  id: string;
  sku?: string;
  barcode?: string;
  name: string;
  unit: string;
  minStock: number;
  currentStock: number;
  costCentsTry: number;
  priceCentsTry: number;
}

interface Stats {
  totalProducts: number;
  totalStockValueCentsTry: number;
  lowStockCount: number;
}

const headers = () => {
  const t = localStorage.getItem('x_token');
  const d = localStorage.getItem('x_demo_user');
  const h: Record<string, string> = { 'content-type': 'application/json' };
  if (t) h.authorization = `Bearer ${t}`;
  else if (d) h['x-demo-user'] = d;
  return h;
};

export function EnvanterModulePage(): React.ReactElement {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [sku, setSku] = React.useState('');
  const [name, setName] = React.useState('');
  const [stockStr, setStockStr] = React.useState('');
  const [costStr, setCostStr] = React.useState('');
  const [minStr, setMinStr] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      const [list, s] = await Promise.all([
        fetch('/v1/modules/envanter/products', { headers: headers() }).then((r) => r.json()),
        fetch('/v1/modules/envanter/stats', { headers: headers() }).then((r) => r.json()),
      ]);
      setProducts(Array.isArray(list) ? list : []);
      setStats(
        s && typeof s.totalProducts === 'number'
          ? s
          : { totalProducts: 0, totalStockValueCentsTry: 0, lowStockCount: 0 },
      );
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
      const r = await fetch('/v1/modules/envanter/products', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          sku: sku || undefined,
          name,
          currentStock: Number(stockStr || '0'),
          minStock: Number(minStr || '0'),
          costCentsTry: Math.round(Number(costStr || '0') * 100),
        }),
      });
      if (!r.ok) throw new Error(await r.text());
      setSku('');
      setName('');
      setStockStr('');
      setCostStr('');
      setMinStr('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown');
    } finally {
      setBusy(false);
    }
  }

  async function move(p: Product, type: 'in' | 'out', delta: number) {
    try {
      const r = await fetch('/v1/modules/envanter/movements', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ productId: p.id, type, quantity: delta }),
      });
      if (!r.ok) throw new Error(await r.text());
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown');
    }
  }

  return (
    <div className="x-mod" style={{ borderColor: 'rgba(124,58,237,0.3)' }}>
      <header className="x-mod__head">
        <span className="x-mod__icon">📦</span>
        <div>
          <h1>Envanter · Stok</h1>
          <p>Ürün kataloğu, stok hareketleri (giriş/çıkış/sayım), düşük stok uyarısı.</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 16 }}>
          <Stat label="Ürün" value={stats?.totalProducts ?? '…'} />
          <Stat
            label="Stok Değeri"
            value={stats ? formatTry(stats.totalStockValueCentsTry) : '…'}
            accent="#7c3aed"
          />
          <Stat label="Düşük Stok" value={stats?.lowStockCount ?? '…'} accent="#fca5a5" />
        </div>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 20 }}>
        <div className="x-card" style={{ cursor: 'default' }}>
          <h3>➕ Yeni Ürün</h3>
          <div className="x-stack">
            <input className="x-input" placeholder="SKU (opsiyonel)" value={sku} onChange={(e) => setSku(e.target.value)} />
            <input className="x-input" placeholder="Ürün adı" value={name} onChange={(e) => setName(e.target.value)} />
            <input
              className="x-input"
              type="number"
              step="0.01"
              placeholder="Başlangıç stok"
              value={stockStr}
              onChange={(e) => setStockStr(e.target.value)}
            />
            <input
              className="x-input"
              type="number"
              step="0.01"
              placeholder="Min stok (alarm eşiği)"
              value={minStr}
              onChange={(e) => setMinStr(e.target.value)}
            />
            <input
              className="x-input"
              type="number"
              step="0.01"
              placeholder="Birim maliyet (TL)"
              value={costStr}
              onChange={(e) => setCostStr(e.target.value)}
            />
            <button className="x-btn" onClick={add} disabled={busy || !name.trim()}>
              {busy ? 'Ekleniyor…' : 'Ekle'}
            </button>
            {error && <div style={{ fontSize: 12, color: '#fca5a5' }}>{error}</div>}
          </div>
        </div>

        <div className="x-card" style={{ cursor: 'default' }}>
          <h3>📦 Ürünler & Hızlı Hareket</h3>
          {products.length === 0 ? (
            <p style={{ color: 'var(--x-muted)', fontSize: 13 }}>Henüz ürün yok.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 360, overflowY: 'auto' }}>
              {products.map((p) => {
                const low = p.currentStock <= p.minStock;
                return (
                  <li key={p.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--x-line)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--x-muted)' }}>
                          {p.sku ?? '—'} · maliyet: {formatTry(p.costCentsTry)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', minWidth: 90 }}>
                        <div style={{ fontWeight: 700, color: low ? '#fca5a5' : undefined }}>
                          {p.currentStock} {p.unit}
                        </div>
                        {low && <span className="x-badge" style={{ fontSize: 10, color: '#fca5a5' }}>düşük</span>}
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          className="x-btn x-btn--ghost"
                          style={{ padding: '6px 10px', fontSize: 12 }}
                          onClick={() => move(p, 'in', 1)}
                        >
                          +1
                        </button>
                        <button
                          className="x-btn x-btn--ghost"
                          style={{ padding: '6px 10px', fontSize: 12 }}
                          onClick={() => move(p, 'out', 1)}
                        >
                          −1
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number | string; accent?: string }): React.ReactElement {
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: 11, color: 'var(--x-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color: accent }}>{value}</div>
    </div>
  );
}

export default EnvanterModulePage;

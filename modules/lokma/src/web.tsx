import * as React from 'react';

interface Recipe {
  id: string;
  name: string;
  category?: string;
  baseYield: number;
  yieldUnit: string;
  ingredients?: Array<{ name: string; qty: number; unit: string }>;
  createdAt: string;
}

const headers = () => {
  const t = localStorage.getItem('x_token');
  const d = localStorage.getItem('x_demo_user');
  const h: Record<string, string> = { 'content-type': 'application/json' };
  if (t) h.authorization = `Bearer ${t}`;
  else if (d) h['x-demo-user'] = d;
  return h;
};

export function LokmaModulePage(): React.ReactElement {
  const [recipes, setRecipes] = React.useState<Recipe[]>([]);
  const [name, setName] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      const r = await fetch('/v1/modules/lokma/recipes', { headers: headers() });
      if (r.ok) setRecipes(await r.json());
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
      const r = await fetch('/v1/modules/lokma/recipes', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ name, category, baseYield: 1, yieldUnit: 'porsiyon' }),
      });
      if (!r.ok) throw new Error(await r.text());
      setName('');
      setCategory('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="x-mod x-mod-lokma">
      <header className="x-mod__head">
        <span className="x-mod__icon">🍳</span>
        <div>
          <h1>Lokma · Mutfak OS</h1>
          <p>Reçete, stok, tedarikçi, AI öneri — gerçek DB.</p>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: 'var(--x-muted)' }}>REÇETE SAYISI</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{recipes.length}</div>
        </div>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="x-card" style={{ cursor: 'default' }}>
          <h3>➕ Yeni Reçete</h3>
          <div className="x-stack">
            <input className="x-input" placeholder="Reçete adı" value={name} onChange={(e) => setName(e.target.value)} />
            <input
              className="x-input"
              placeholder="Kategori (örn: çorba, ana yemek)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            <button className="x-btn" onClick={add} disabled={busy || !name.trim()}>
              {busy ? 'Ekleniyor…' : 'Ekle'}
            </button>
            {error && <div style={{ fontSize: 12, color: '#fca5a5' }}>{error}</div>}
          </div>
        </div>

        <div className="x-card" style={{ cursor: 'default' }}>
          <h3>📘 Reçeteler</h3>
          {recipes.length === 0 ? (
            <p style={{ color: 'var(--x-muted)', fontSize: 13 }}>Henüz reçete yok.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 240, overflowY: 'auto' }}>
              {recipes.map((r) => (
                <li key={r.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--x-line)' }}>
                  <div style={{ fontWeight: 600 }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--x-muted)' }}>
                    {r.category ?? '—'} · {r.baseYield} {r.yieldUnit}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

export default LokmaModulePage;

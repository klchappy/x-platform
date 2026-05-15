import * as React from 'react';

interface Ingredient {
  id: string;
  name: string;
  category?: string;
  default_unit: string;
  default_waste_pct: number;
  last_unit_price: number;
  is_active: boolean;
}

interface Recipe {
  id: string;
  name: string;
  category?: string;
  base_yield: number;
  yield_unit: string;
  prep_minutes?: number;
  cook_minutes?: number;
  ingredients?: Array<{ name: string; qty: number; unit: string }>;
  tags?: string[];
  is_active: boolean;
  created_at: string;
}

interface StockLot {
  id: string;
  ingredient_id: string;
  lot_code?: string;
  qty_received: number;
  qty_remaining: number;
  unit: string;
  unit_price: number;
  expiry_date?: string;
  supplier_name?: string;
}

interface MenuPlan {
  id: string;
  plan_date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  expected_servings: number;
  notes?: string;
}

const headers = () => {
  const t = localStorage.getItem('x_token');
  const d = localStorage.getItem('x_demo_user');
  const h: Record<string, string> = { 'content-type': 'application/json' };
  if (t) h.authorization = `Bearer ${t}`;
  else if (d) h['x-demo-user'] = d;
  return h;
};

const MEAL_LABEL: Record<MenuPlan['meal_type'], string> = {
  breakfast: '🍳 Kahvaltı',
  lunch: '🍽 Öğle',
  dinner: '🌙 Akşam',
  snack: '🍪 Ara',
};

type View = 'ingredients' | 'recipes' | 'stock' | 'menu';

export function LokmaModulePage(): React.ReactElement {
  const [view, setView] = React.useState<View>('ingredients');
  return (
    <div className="x-mod" style={{ borderColor: 'rgba(251,191,36,0.3)' }}>
      <header className="x-mod__head">
        <span className="x-mod__icon">🍲</span>
        <div style={{ flex: 1 }}>
          <h1>Lokma · Mutfak</h1>
          <p>Malzeme · Tarif · Stok takibi · Menü planlama.</p>
        </div>
      </header>

      <nav style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid var(--x-line)', paddingBottom: 12 }}>
        <Tab active={view === 'ingredients'} onClick={() => setView('ingredients')} icon="🥕" label="Malzemeler" />
        <Tab active={view === 'recipes'} onClick={() => setView('recipes')} icon="📖" label="Tarifler" />
        <Tab active={view === 'stock'} onClick={() => setView('stock')} icon="📦" label="Stok" />
        <Tab active={view === 'menu'} onClick={() => setView('menu')} icon="📅" label="Menü" />
      </nav>

      {view === 'ingredients' && <IngredientsPanel />}
      {view === 'recipes' && <RecipesPanel />}
      {view === 'stock' && <StockPanel />}
      {view === 'menu' && <MenuPanel />}
    </div>
  );
}

function Tab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: string; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? 'rgba(251,191,36,0.18)' : 'transparent',
        border: active ? '1px solid rgba(251,191,36,0.4)' : '1px solid transparent',
        color: 'var(--x-fg)',
        padding: '8px 14px',
        borderRadius: 10,
        fontSize: 13,
        cursor: 'pointer',
        fontWeight: active ? 700 : 500,
      }}
    >
      {icon} {label}
    </button>
  );
}

function IngredientsPanel(): React.ReactElement {
  const [rows, setRows] = React.useState<Ingredient[]>([]);
  const [name, setName] = React.useState('');
  const [unit, setUnit] = React.useState('kg');
  const [price, setPrice] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    const data = await fetch('/v1/modules/lokma/ingredients', { headers: headers() }).then((r) => r.json());
    setRows(Array.isArray(data) ? data : []);
  }, []);
  React.useEffect(() => { load(); }, [load]);

  async function add() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await fetch('/v1/modules/lokma/ingredients', {
        method: 'POST', headers: headers(),
        body: JSON.stringify({ name, default_unit: unit, last_unit_price: price ? Number(price) : 0 }),
      });
      setName(''); setUnit('kg'); setPrice('');
      await load();
    } finally { setBusy(false); }
  }

  return (
    <section style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 20 }}>
      <div className="x-card" style={{ cursor: 'default' }}>
        <h3>➕ Yeni Malzeme</h3>
        <div className="x-stack">
          <input className="x-input" placeholder="Malzeme adı" value={name} onChange={(e) => setName(e.target.value)} />
          <select className="x-input" value={unit} onChange={(e) => setUnit(e.target.value)}>
            <option value="kg">kg</option>
            <option value="g">g</option>
            <option value="l">l</option>
            <option value="ml">ml</option>
            <option value="adet">adet</option>
            <option value="paket">paket</option>
          </select>
          <input className="x-input" type="number" step="0.01" placeholder="Birim fiyat (TL)" value={price} onChange={(e) => setPrice(e.target.value)} />
          <button className="x-btn" disabled={busy || !name.trim()} onClick={add}>{busy ? 'Ekleniyor…' : 'Ekle'}</button>
        </div>
      </div>

      <div className="x-card" style={{ cursor: 'default' }}>
        <h3>🥕 Malzemeler ({rows.length})</h3>
        {rows.length === 0 ? (
          <p style={{ color: 'var(--x-muted)', fontSize: 13 }}>Henüz malzeme yok.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 420, overflowY: 'auto' }}>
            {rows.map((i) => (
              <li key={i.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--x-line)', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{i.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--x-muted)' }}>{i.category ?? '—'} · {i.default_unit}</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: 12 }}>
                  <div style={{ fontWeight: 700 }}>{`₺${Number(i.last_unit_price).toLocaleString('tr-TR')}`}</div>
                  <div style={{ color: 'var(--x-muted)' }}>/ {i.default_unit}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function RecipesPanel(): React.ReactElement {
  const [rows, setRows] = React.useState<Recipe[]>([]);
  const [name, setName] = React.useState('');
  const [yield_, setYield] = React.useState('4');
  const [prep, setPrep] = React.useState('');
  const [cook, setCook] = React.useState('');
  const [ingredients, setIngredients] = React.useState('');
  const [instructions, setInstructions] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    const data = await fetch('/v1/modules/lokma/recipes', { headers: headers() }).then((r) => r.json());
    setRows(Array.isArray(data) ? data : []);
  }, []);
  React.useEffect(() => { load(); }, [load]);

  async function add() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      // Basit parse: "domates 200 g, soğan 1 adet" formatı
      const parsed = ingredients
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((line) => {
          const m = line.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*(\w+)$/);
          if (!m) return null;
          return { name: m[1].trim(), qty: Number(m[2]), unit: m[3] };
        })
        .filter((x): x is { name: string; qty: number; unit: string } => x !== null);
      await fetch('/v1/modules/lokma/recipes', {
        method: 'POST', headers: headers(),
        body: JSON.stringify({
          name,
          base_yield: Number(yield_),
          prep_minutes: prep ? Number(prep) : undefined,
          cook_minutes: cook ? Number(cook) : undefined,
          ingredients: parsed,
          instructions: instructions || undefined,
        }),
      });
      setName(''); setYield('4'); setPrep(''); setCook(''); setIngredients(''); setInstructions('');
      await load();
    } finally { setBusy(false); }
  }

  return (
    <section style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 20 }}>
      <div className="x-card" style={{ cursor: 'default' }}>
        <h3>➕ Yeni Tarif</h3>
        <div className="x-stack">
          <input className="x-input" placeholder="Tarif adı (örn: Mercimek çorbası)" value={name} onChange={(e) => setName(e.target.value)} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <input className="x-input" type="number" placeholder="Porsiyon" value={yield_} onChange={(e) => setYield(e.target.value)} />
            <input className="x-input" type="number" placeholder="Hazırlık dk" value={prep} onChange={(e) => setPrep(e.target.value)} />
            <input className="x-input" type="number" placeholder="Pişirme dk" value={cook} onChange={(e) => setCook(e.target.value)} />
          </div>
          <textarea
            className="x-input" rows={3}
            placeholder="Malzemeler (virgülle: domates 200 g, soğan 1 adet)"
            value={ingredients} onChange={(e) => setIngredients(e.target.value)}
          />
          <textarea className="x-input" rows={3} placeholder="Hazırlanışı" value={instructions} onChange={(e) => setInstructions(e.target.value)} />
          <button className="x-btn" disabled={busy || !name.trim()} onClick={add}>{busy ? 'Ekleniyor…' : 'Ekle'}</button>
        </div>
      </div>

      <div className="x-card" style={{ cursor: 'default' }}>
        <h3>📖 Tarifler ({rows.length})</h3>
        {rows.length === 0 ? (
          <p style={{ color: 'var(--x-muted)', fontSize: 13 }}>Tarif yok.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 420, overflowY: 'auto' }}>
            {rows.map((r) => (
              <li key={r.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--x-line)' }}>
                <div style={{ fontWeight: 600 }}>{r.name}</div>
                <div style={{ fontSize: 12, color: 'var(--x-muted)', marginTop: 2 }}>
                  {r.base_yield} {r.yield_unit}
                  {r.prep_minutes ? ` · ⏱ ${r.prep_minutes}dk` : ''}
                  {r.cook_minutes ? ` · 🔥 ${r.cook_minutes}dk` : ''}
                  {r.ingredients && r.ingredients.length > 0 ? ` · ${r.ingredients.length} malzeme` : ''}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function StockPanel(): React.ReactElement {
  const [lots, setLots] = React.useState<StockLot[]>([]);
  const [ingredients, setIngredients] = React.useState<Ingredient[]>([]);
  const [expiring, setExpiring] = React.useState<StockLot[]>([]);
  const [ingredientId, setIngredientId] = React.useState('');
  const [qty, setQty] = React.useState('');
  const [unit, setUnit] = React.useState('kg');
  const [unitPrice, setUnitPrice] = React.useState('');
  const [expiry, setExpiry] = React.useState('');
  const [supplier, setSupplier] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    const [l, i, e] = await Promise.all([
      fetch('/v1/modules/lokma/stock/lots', { headers: headers() }).then((r) => r.json()),
      fetch('/v1/modules/lokma/ingredients', { headers: headers() }).then((r) => r.json()),
      fetch('/v1/modules/lokma/stock/expiring?days=7', { headers: headers() }).then((r) => r.json()),
    ]);
    setLots(Array.isArray(l) ? l : []);
    setIngredients(Array.isArray(i) ? i : []);
    setExpiring(Array.isArray(e) ? e : []);
  }, []);
  React.useEffect(() => { load(); }, [load]);

  async function add() {
    if (!ingredientId || !qty || !unit) return;
    setBusy(true);
    try {
      await fetch('/v1/modules/lokma/stock/lots', {
        method: 'POST', headers: headers(),
        body: JSON.stringify({
          ingredient_id: ingredientId,
          qty_received: Number(qty),
          unit,
          unit_price: unitPrice ? Number(unitPrice) : 0,
          expiry_date: expiry || undefined,
          supplier_name: supplier || undefined,
        }),
      });
      setQty(''); setUnitPrice(''); setExpiry(''); setSupplier('');
      await load();
    } finally { setBusy(false); }
  }

  const ingredientMap = React.useMemo(() => {
    const m = new Map<string, string>();
    ingredients.forEach((i) => m.set(i.id, i.name));
    return m;
  }, [ingredients]);

  return (
    <section style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 20 }}>
      <div className="x-card" style={{ cursor: 'default' }}>
        <h3>📥 Stok Girişi</h3>
        <div className="x-stack">
          <select className="x-input" value={ingredientId} onChange={(e) => setIngredientId(e.target.value)}>
            <option value="">— Malzeme seç —</option>
            {ingredients.map((i) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8 }}>
            <input className="x-input" type="number" step="0.01" placeholder="Miktar" value={qty} onChange={(e) => setQty(e.target.value)} />
            <input className="x-input" placeholder="Birim" value={unit} onChange={(e) => setUnit(e.target.value)} />
          </div>
          <input className="x-input" type="number" step="0.01" placeholder="Birim fiyat (TL)" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
          <input className="x-input" type="date" placeholder="SKT" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
          <input className="x-input" placeholder="Tedarikçi" value={supplier} onChange={(e) => setSupplier(e.target.value)} />
          <button className="x-btn" disabled={busy || !ingredientId || !qty} onClick={add}>{busy ? 'Ekleniyor…' : 'Stok Gir'}</button>
        </div>

        {expiring.length > 0 && (
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--x-line)' }}>
            <h4 style={{ margin: '0 0 8px', color: '#fb923c', fontSize: 13 }}>⚠ Yakın SKT ({expiring.length})</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 12 }}>
              {expiring.slice(0, 5).map((l) => (
                <li key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span>{ingredientMap.get(l.ingredient_id) ?? '?'}</span>
                  <span style={{ color: '#fca5a5' }}>{l.expiry_date}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="x-card" style={{ cursor: 'default' }}>
        <h3>📦 Stok Lotları ({lots.length})</h3>
        {lots.length === 0 ? (
          <p style={{ color: 'var(--x-muted)', fontSize: 13 }}>Stok yok.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 420, overflowY: 'auto' }}>
            {lots.map((l) => (
              <li key={l.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--x-line)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{ingredientMap.get(l.ingredient_id) ?? l.ingredient_id}</div>
                    <div style={{ fontSize: 12, color: 'var(--x-muted)' }}>
                      {l.supplier_name ?? '—'}
                      {l.expiry_date ? ` · SKT: ${l.expiry_date}` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700 }}>{Number(l.qty_remaining).toFixed(2)} / {Number(l.qty_received).toFixed(2)} {l.unit}</div>
                    <div style={{ fontSize: 12, color: 'var(--x-muted)' }}>{`₺${Number(l.unit_price).toFixed(2)} /${l.unit}`}</div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function MenuPanel(): React.ReactElement {
  const [plans, setPlans] = React.useState<MenuPlan[]>([]);
  const [date, setDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [mealType, setMealType] = React.useState<MenuPlan['meal_type']>('lunch');
  const [servings, setServings] = React.useState('0');
  const [notes, setNotes] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    const data = await fetch('/v1/modules/lokma/menu/plans', { headers: headers() }).then((r) => r.json());
    setPlans(Array.isArray(data) ? data : []);
  }, []);
  React.useEffect(() => { load(); }, [load]);

  async function add() {
    setBusy(true);
    try {
      await fetch('/v1/modules/lokma/menu/plans', {
        method: 'POST', headers: headers(),
        body: JSON.stringify({
          plan_date: date,
          meal_type: mealType,
          expected_servings: Number(servings),
          notes: notes || undefined,
        }),
      });
      setServings('0'); setNotes('');
      await load();
    } finally { setBusy(false); }
  }

  return (
    <section style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 20 }}>
      <div className="x-card" style={{ cursor: 'default' }}>
        <h3>➕ Menü Planı</h3>
        <div className="x-stack">
          <input className="x-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <select className="x-input" value={mealType} onChange={(e) => setMealType(e.target.value as MenuPlan['meal_type'])}>
            <option value="breakfast">🍳 Kahvaltı</option>
            <option value="lunch">🍽 Öğle</option>
            <option value="dinner">🌙 Akşam</option>
            <option value="snack">🍪 Ara</option>
          </select>
          <input className="x-input" type="number" placeholder="Beklenen porsiyon" value={servings} onChange={(e) => setServings(e.target.value)} />
          <textarea className="x-input" rows={2} placeholder="Notlar" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <button className="x-btn" disabled={busy} onClick={add}>{busy ? 'Ekleniyor…' : 'Plan Oluştur'}</button>
        </div>
      </div>

      <div className="x-card" style={{ cursor: 'default' }}>
        <h3>📅 Menü Planları ({plans.length})</h3>
        {plans.length === 0 ? (
          <p style={{ color: 'var(--x-muted)', fontSize: 13 }}>Plan yok.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 420, overflowY: 'auto' }}>
            {plans.map((p) => (
              <li key={p.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--x-line)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{p.plan_date} · {MEAL_LABEL[p.meal_type]}</div>
                    {p.notes && <div style={{ fontSize: 12, color: 'var(--x-muted)' }}>{p.notes}</div>}
                  </div>
                  <div style={{ fontWeight: 700 }}>{p.expected_servings} porsiyon</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default LokmaModulePage;

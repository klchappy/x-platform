import * as React from 'react';
import { formatTry } from '@x/shared';

interface Payable {
  id: string;
  title: string;
  category?: string;
  supplier_name?: string;
  due_date?: string;
  amount: string;
  paid_amount: string;
  currency: string;
  status: string;
  created_at: string;
}

interface Payment {
  id: string;
  payable_id: string;
  paid_at: string;
  amount: string;
  method: string;
  reference_no?: string;
}

interface Company {
  id: string;
  name: string;
  tax_number?: string;
  phone?: string;
  email?: string;
}

interface Stats {
  total_count: number;
  total_amount: number;
  paid_amount: number;
  open_amount: number;
  overdue_count: number;
}

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  pending: { label: 'Bekliyor', color: '#cbd5e1' },
  approaching: { label: 'Yaklaşıyor', color: '#fb923c' },
  overdue: { label: 'Gecikti', color: '#fca5a5' },
  partial_paid: { label: 'Kısmi', color: '#fbbf24' },
  paid: { label: 'Ödendi', color: '#86efac' },
  cancelled: { label: 'İptal', color: '#94a3b8' },
};

const headers = () => {
  const t = localStorage.getItem('x_token');
  const d = localStorage.getItem('x_demo_user');
  const h: Record<string, string> = { 'content-type': 'application/json' };
  if (t) h.authorization = `Bearer ${t}`;
  else if (d) h['x-demo-user'] = d;
  return h;
};

const tryToCents = (n: number) => Math.round(n * 100);
const centsToTry = (s: string) => Number(s) * 100;

type View = 'payables' | 'payments' | 'companies' | 'persons';

export function SaymanModulePage(): React.ReactElement {
  const [view, setView] = React.useState<View>('payables');
  return (
    <div className="x-mod" style={{ borderColor: 'rgba(14,165,233,0.3)' }}>
      <header className="x-mod__head">
        <span className="x-mod__icon">🧮</span>
        <div style={{ flex: 1 }}>
          <h1>Sayman · Muhasebe</h1>
          <p>Borç/alacak takibi · Kısmi ödemeler · Tedarikçi/müşteri firmalar · Nakit akışı.</p>
        </div>
      </header>

      <nav style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid var(--x-line)', paddingBottom: 12 }}>
        <Tab active={view === 'payables'} onClick={() => setView('payables')} icon="📑" label="Borçlar" />
        <Tab active={view === 'payments'} onClick={() => setView('payments')} icon="💸" label="Ödemeler" />
        <Tab active={view === 'companies'} onClick={() => setView('companies')} icon="🏢" label="Firmalar" />
        <Tab active={view === 'persons'} onClick={() => setView('persons')} icon="👤" label="Kişiler" />
      </nav>

      {view === 'payables' && <PayablesPanel />}
      {view === 'payments' && <PaymentsPanel />}
      {view === 'companies' && <CompaniesPanel />}
      {view === 'persons' && <PersonsPanel />}
    </div>
  );
}

function Tab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: string; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? 'rgba(14,165,233,0.18)' : 'transparent',
        border: active ? '1px solid rgba(14,165,233,0.4)' : '1px solid transparent',
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

function PayablesPanel(): React.ReactElement {
  const [rows, setRows] = React.useState<Payable[]>([]);
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [title, setTitle] = React.useState('');
  const [supplier, setSupplier] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [dueDate, setDueDate] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    const [list, s] = await Promise.all([
      fetch('/v1/modules/sayman/payables', { headers: headers() }).then((r) => r.json()),
      fetch('/v1/modules/sayman/payables/stats/summary', { headers: headers() }).then((r) => r.json()),
    ]);
    setRows(Array.isArray(list) ? list : []);
    setStats(s && typeof s.total_count === 'number' ? s : null);
  }, []);
  React.useEffect(() => { load(); }, [load]);

  async function add() {
    if (!title.trim() || !amount) return;
    setBusy(true); setError(null);
    try {
      const r = await fetch('/v1/modules/sayman/payables', {
        method: 'POST', headers: headers(),
        body: JSON.stringify({ title, supplier_name: supplier || undefined, amount: Number(amount), due_date: dueDate || undefined }),
      });
      if (!r.ok) throw new Error(((await r.json()).error?.message) ?? 'Hata');
      setTitle(''); setSupplier(''); setAmount(''); setDueDate('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown');
    } finally { setBusy(false); }
  }

  async function payInFull(p: Payable) {
    const remaining = Number(p.amount) - Number(p.paid_amount);
    if (remaining <= 0) return;
    try {
      const r = await fetch('/v1/modules/sayman/payments', {
        method: 'POST', headers: headers(),
        body: JSON.stringify({ payable_id: p.id, paid_at: new Date().toISOString().slice(0, 10), amount: remaining, method: 'havale' }),
      });
      if (!r.ok) throw new Error('Ödeme kaydedilemedi');
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'unknown'); }
  }

  return (
    <section style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 20 }}>
      <div className="x-card" style={{ cursor: 'default' }}>
        <h3>➕ Yeni Borç / Fatura</h3>
        <div className="x-stack">
          <input className="x-input" placeholder="Başlık (örn: TT internet)" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input className="x-input" placeholder="Tedarikçi" value={supplier} onChange={(e) => setSupplier(e.target.value)} />
          <input type="number" step="0.01" className="x-input" placeholder="Tutar (TL)" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <input type="date" className="x-input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <button className="x-btn" onClick={add} disabled={busy || !title.trim() || !amount}>
            {busy ? 'Ekleniyor…' : 'Ekle'}
          </button>
          {error && <div style={{ fontSize: 12, color: '#fca5a5' }}>{error}</div>}
        </div>
        {stats && (
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--x-line)', fontSize: 12 }}>
            <Row k="Toplam Borç" v={`₺${Number(stats.total_amount).toLocaleString('tr-TR')}`} />
            <Row k="Ödendi" v={<span style={{ color: '#86efac' }}>{`₺${Number(stats.paid_amount).toLocaleString('tr-TR')}`}</span>} />
            <Row k="Açık" v={<span style={{ color: '#0ea5e9', fontWeight: 700 }}>{`₺${Number(stats.open_amount).toLocaleString('tr-TR')}`}</span>} />
            <Row k="Gecikti" v={<span style={{ color: '#fca5a5' }}>{stats.overdue_count}</span>} />
          </div>
        )}
      </div>

      <div className="x-card" style={{ cursor: 'default' }}>
        <h3>📑 Borçlar ({rows.length})</h3>
        {rows.length === 0 ? (
          <p style={{ color: 'var(--x-muted)', fontSize: 13 }}>Henüz borç yok.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 360, overflowY: 'auto' }}>
            {rows.map((p) => {
              const b = STATUS_BADGE[p.status] ?? { label: p.status, color: '#94a3b8' };
              const total = Number(p.amount), paid = Number(p.paid_amount);
              const pct = total > 0 ? (paid / total) * 100 : 0;
              return (
                <li key={p.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--x-line)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{p.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--x-muted)' }}>
                        {p.supplier_name ?? '—'}{p.due_date ? ` · Vade: ${p.due_date}` : ''}
                      </div>
                      {pct > 0 && pct < 100 && (
                        <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 4, marginTop: 6 }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: '#fbbf24', borderRadius: 4 }} />
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', minWidth: 110 }}>
                      <div style={{ fontWeight: 700 }}>{`₺${total.toLocaleString('tr-TR')}`}</div>
                      <span className="x-badge" style={{ color: b.color }}>{b.label}</span>
                    </div>
                    {p.status !== 'paid' && (
                      <button className="x-btn x-btn--ghost" style={{ fontSize: 11, padding: '6px 10px' }} onClick={() => payInFull(p)}>
                        Ödendi
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
      <span style={{ color: 'var(--x-muted)' }}>{k}</span>
      <span style={{ fontWeight: 600 }}>{v}</span>
    </div>
  );
}

function PaymentsPanel(): React.ReactElement {
  const [rows, setRows] = React.useState<Payment[]>([]);
  React.useEffect(() => {
    fetch('/v1/modules/sayman/payments', { headers: headers() })
      .then((r) => r.json())
      .then((d) => setRows(Array.isArray(d) ? d : []));
  }, []);
  return (
    <div className="x-card" style={{ cursor: 'default' }}>
      <h3>💸 Ödeme Hareketleri ({rows.length})</h3>
      {rows.length === 0 ? (
        <p style={{ color: 'var(--x-muted)', fontSize: 13 }}>Henüz ödeme kaydı yok.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 420, overflowY: 'auto' }}>
          {rows.map((p) => (
            <li key={p.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--x-line)', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{p.paid_at}</div>
                <div style={{ fontSize: 12, color: 'var(--x-muted)' }}>{p.method}{p.reference_no ? ` · ${p.reference_no}` : ''}</div>
              </div>
              <div style={{ fontWeight: 700, color: '#86efac' }}>{`₺${Number(p.amount).toLocaleString('tr-TR')}`}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CompaniesPanel(): React.ReactElement {
  const [rows, setRows] = React.useState<Company[]>([]);
  const [name, setName] = React.useState('');
  const [taxNo, setTaxNo] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(() => {
    fetch('/v1/modules/sayman/parties/companies', { headers: headers() })
      .then((r) => r.json())
      .then((d) => setRows(Array.isArray(d) ? d : []));
  }, []);
  React.useEffect(() => { load(); }, [load]);

  async function add() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await fetch('/v1/modules/sayman/parties/companies', {
        method: 'POST', headers: headers(),
        body: JSON.stringify({ name, tax_number: taxNo || undefined, phone: phone || undefined }),
      });
      setName(''); setTaxNo(''); setPhone(''); load();
    } finally { setBusy(false); }
  }

  return (
    <section style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 20 }}>
      <div className="x-card" style={{ cursor: 'default' }}>
        <h3>➕ Yeni Firma</h3>
        <div className="x-stack">
          <input className="x-input" placeholder="Şirket adı" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="x-input" placeholder="Vergi no" value={taxNo} onChange={(e) => setTaxNo(e.target.value)} />
          <input className="x-input" placeholder="Telefon" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <button className="x-btn" disabled={busy || !name.trim()} onClick={add}>{busy ? 'Ekleniyor…' : 'Ekle'}</button>
        </div>
      </div>
      <div className="x-card" style={{ cursor: 'default' }}>
        <h3>🏢 Firmalar ({rows.length})</h3>
        {rows.length === 0 ? (
          <p style={{ color: 'var(--x-muted)', fontSize: 13 }}>Henüz firma yok.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 360, overflowY: 'auto' }}>
            {rows.map((c) => (
              <li key={c.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--x-line)' }}>
                <div style={{ fontWeight: 600 }}>{c.name}</div>
                <div style={{ fontSize: 12, color: 'var(--x-muted)' }}>{c.tax_number ?? '—'} · {c.phone ?? '—'}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function PersonsPanel(): React.ReactElement {
  const [rows, setRows] = React.useState<Array<{ id: string; full_name: string; phone?: string; national_id?: string }>>([]);
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(() => {
    fetch('/v1/modules/sayman/parties/persons', { headers: headers() })
      .then((r) => r.json())
      .then((d) => setRows(Array.isArray(d) ? d : []));
  }, []);
  React.useEffect(() => { load(); }, [load]);

  async function add() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await fetch('/v1/modules/sayman/parties/persons', {
        method: 'POST', headers: headers(),
        body: JSON.stringify({ full_name: name, phone: phone || undefined }),
      });
      setName(''); setPhone(''); load();
    } finally { setBusy(false); }
  }

  return (
    <section style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 20 }}>
      <div className="x-card" style={{ cursor: 'default' }}>
        <h3>➕ Yeni Kişi</h3>
        <div className="x-stack">
          <input className="x-input" placeholder="Ad Soyad" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="x-input" placeholder="Telefon" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <button className="x-btn" disabled={busy || !name.trim()} onClick={add}>{busy ? 'Ekleniyor…' : 'Ekle'}</button>
        </div>
      </div>
      <div className="x-card" style={{ cursor: 'default' }}>
        <h3>👤 Kişiler ({rows.length})</h3>
        {rows.length === 0 ? (
          <p style={{ color: 'var(--x-muted)', fontSize: 13 }}>Henüz kişi yok.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 360, overflowY: 'auto' }}>
            {rows.map((p) => (
              <li key={p.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--x-line)' }}>
                <div style={{ fontWeight: 600 }}>{p.full_name}</div>
                <div style={{ fontSize: 12, color: 'var(--x-muted)' }}>{p.phone ?? '—'}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default SaymanModulePage;

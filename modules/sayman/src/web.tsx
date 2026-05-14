import * as React from 'react';
import { formatTry } from '@x/shared';

interface Payable {
  id: string;
  title: string;
  counterparty?: string;
  category?: string;
  invoiceNo?: string;
  amountCentsTry: number;
  paidCentsTry: number;
  dueDate?: string;
  status: string;
  createdAt: string;
}

interface Stats {
  totalPayablesCount: number;
  totalAmountCentsTry: number;
  paidCentsTry: number;
  openCentsTry: number;
  overdueCount: number;
  pendingCount: number;
}

const headers = () => {
  const t = localStorage.getItem('x_token');
  const d = localStorage.getItem('x_demo_user');
  const h: Record<string, string> = { 'content-type': 'application/json' };
  if (t) h.authorization = `Bearer ${t}`;
  else if (d) h['x-demo-user'] = d;
  return h;
};

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  paid: { label: 'Ödendi', color: '#86efac' },
  partial_paid: { label: 'Kısmi', color: '#fbbf24' },
  pending: { label: 'Bekliyor', color: '#cbd5e1' },
  approaching: { label: 'Yaklaşıyor', color: '#fb923c' },
  overdue: { label: 'Gecikti', color: '#fca5a5' },
};

export function SaymanModulePage(): React.ReactElement {
  const [payables, setPayables] = React.useState<Payable[]>([]);
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [title, setTitle] = React.useState('');
  const [counterparty, setCounterparty] = React.useState('');
  const [amountTry, setAmountTry] = React.useState('');
  const [dueDate, setDueDate] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      const [pList, sObj] = await Promise.all([
        fetch('/v1/modules/sayman/payables', { headers: headers() }).then((r) => r.json()),
        fetch('/v1/modules/sayman/stats', { headers: headers() }).then((r) => r.json()),
      ]);
      setPayables(Array.isArray(pList) ? pList : []);
      setStats(sObj && typeof sObj === 'object' ? sObj : null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown');
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function add() {
    if (!title.trim() || !amountTry) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch('/v1/modules/sayman/payables', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          title,
          counterparty: counterparty || undefined,
          amountCentsTry: Math.round(Number(amountTry) * 100),
          dueDate: dueDate || undefined,
        }),
      });
      if (!r.ok) throw new Error(await r.text());
      setTitle('');
      setCounterparty('');
      setAmountTry('');
      setDueDate('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown');
    } finally {
      setBusy(false);
    }
  }

  async function markPaid(p: Payable) {
    const remaining = p.amountCentsTry - p.paidCentsTry;
    if (remaining <= 0) return;
    try {
      const r = await fetch('/v1/modules/sayman/payments', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          payableId: p.id,
          paidAt: new Date().toISOString().slice(0, 10),
          amountCentsTry: remaining,
          method: 'havale',
        }),
      });
      if (!r.ok) throw new Error(await r.text());
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown');
    }
  }

  return (
    <div className="x-mod" style={{ borderColor: 'rgba(14,165,233,0.3)' }}>
      <header className="x-mod__head">
        <span className="x-mod__icon">🧮</span>
        <div>
          <h1>Sayman · Muhasebe</h1>
          <p>Borç/alacak takibi, ödeme tahsilatı, nakit akışı.</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 16 }}>
          <Stat label="Toplam Borç" value={stats ? formatTry(stats.totalAmountCentsTry) : '…'} />
          <Stat label="Kalan" value={stats ? formatTry(stats.openCentsTry) : '…'} accent />
          <Stat label="Gecikti" value={stats?.overdueCount ?? '…'} />
        </div>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 20 }}>
        <div className="x-card" style={{ cursor: 'default' }}>
          <h3>➕ Yeni Borç / Fatura</h3>
          <div className="x-stack">
            <input
              className="x-input"
              placeholder="Başlık (örn: TT internet, Kira)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              className="x-input"
              placeholder="Karşı taraf (firma/kişi)"
              value={counterparty}
              onChange={(e) => setCounterparty(e.target.value)}
            />
            <input
              type="number"
              step="0.01"
              className="x-input"
              placeholder="Tutar (TL)"
              value={amountTry}
              onChange={(e) => setAmountTry(e.target.value)}
            />
            <input
              type="date"
              className="x-input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            <button
              className="x-btn"
              onClick={add}
              disabled={busy || !title.trim() || !amountTry}
            >
              {busy ? 'Ekleniyor…' : 'Ekle'}
            </button>
            {error && (
              <div style={{ fontSize: 12, color: '#fca5a5' }}>{error}</div>
            )}
          </div>
        </div>

        <div className="x-card" style={{ cursor: 'default' }}>
          <h3>📑 Borçlar</h3>
          {payables.length === 0 ? (
            <p style={{ color: 'var(--x-muted)', fontSize: 13 }}>Henüz borç/fatura yok.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 320, overflowY: 'auto' }}>
              {payables.map((p) => {
                const badge = STATUS_BADGES[p.status] ?? { label: p.status, color: '#94a3b8' };
                const paidPct = p.amountCentsTry > 0 ? (p.paidCentsTry / p.amountCentsTry) * 100 : 0;
                return (
                  <li
                    key={p.id}
                    style={{ padding: '12px 0', borderBottom: '1px solid var(--x-line)' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{p.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--x-muted)' }}>
                          {p.counterparty ?? '—'}
                          {p.dueDate ? ` · Vade: ${p.dueDate}` : ''}
                        </div>
                        {paidPct > 0 && paidPct < 100 && (
                          <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 4, marginTop: 6 }}>
                            <div style={{ width: `${paidPct}%`, height: '100%', background: '#fbbf24', borderRadius: 4 }} />
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', minWidth: 140 }}>
                        <div style={{ fontWeight: 700 }}>{formatTry(p.amountCentsTry)}</div>
                        <span className="x-badge" style={{ color: badge.color }}>
                          {badge.label}
                        </span>
                      </div>
                      {p.status !== 'paid' && (
                        <button
                          className="x-btn x-btn--ghost"
                          style={{ fontSize: 12, padding: '6px 10px' }}
                          onClick={() => markPaid(p)}
                        >
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
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number | string; accent?: boolean }): React.ReactElement {
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: 11, color: 'var(--x-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color: accent ? '#0ea5e9' : undefined }}>
        {value}
      </div>
    </div>
  );
}

export default SaymanModulePage;

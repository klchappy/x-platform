import * as React from 'react';

interface AttendanceRow {
  id: string;
  type: string;
  method?: string;
  serverTime: string;
  notes?: string;
}

interface ModuleApi {
  list(): Promise<AttendanceRow[]>;
  stamp(type: 'check_in' | 'check_out', notes?: string): Promise<AttendanceRow>;
  stats(): Promise<{ totalAttendance: number; pendingLeaves: number }>;
}

function buildApi(): ModuleApi {
  const headers = (): Record<string, string> => {
    const t = localStorage.getItem('x_token');
    const d = localStorage.getItem('x_demo_user');
    const h: Record<string, string> = { 'content-type': 'application/json' };
    if (t) h.authorization = `Bearer ${t}`;
    else if (d) h['x-demo-user'] = d;
    return h;
  };
  return {
    async list() {
      const r = await fetch('/v1/modules/damga/attendance', { headers: headers() });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    async stamp(type, notes) {
      const r = await fetch('/v1/modules/damga/attendance', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ type, method: 'manual', notes }),
      });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    async stats() {
      const r = await fetch('/v1/modules/damga/stats', { headers: headers() });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
  };
}

export function DamgaModulePage(): React.ReactElement {
  const api = React.useMemo(buildApi, []);
  const [rows, setRows] = React.useState<AttendanceRow[]>([]);
  const [stats, setStats] = React.useState<{ totalAttendance: number; pendingLeaves: number } | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [notes, setNotes] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const reload = React.useCallback(async () => {
    try {
      const [list, st] = await Promise.all([api.list(), api.stats()]);
      setRows(list);
      setStats(st);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown');
    }
  }, [api]);

  React.useEffect(() => {
    reload();
  }, [reload]);

  async function stamp(type: 'check_in' | 'check_out') {
    setBusy(true);
    setError(null);
    try {
      await api.stamp(type, notes || undefined);
      setNotes('');
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="x-mod x-mod-damga">
      <header className="x-mod__head">
        <span className="x-mod__icon">🪪</span>
        <div>
          <h1>Damga · Personel Takibi</h1>
          <p>Yoklama, vardiya, izin — gerçek DB üzerinde, tenant'ına izole.</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
          <Stat label="Toplam Yoklama" value={stats?.totalAttendance ?? '…'} />
          <Stat label="Bekleyen İzin" value={stats?.pendingLeaves ?? '…'} />
        </div>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="x-card" style={{ cursor: 'default' }}>
          <h3>📍 Yoklama Bas</h3>
          <p style={{ fontSize: 13, color: 'var(--x-muted)', marginBottom: 12 }}>
            Manuel check-in/out. NFC/QR/GPS doğrulaması ileride aktif olur.
          </p>
          <input
            className="x-input"
            placeholder="Not (opsiyonel)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ marginBottom: 10 }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="x-btn" disabled={busy} onClick={() => stamp('check_in')}>
              ▶ Giriş
            </button>
            <button className="x-btn x-btn--ghost" disabled={busy} onClick={() => stamp('check_out')}>
              ◀ Çıkış
            </button>
          </div>
          {error && (
            <div style={{ marginTop: 12, fontSize: 12, color: '#fca5a5' }}>{error}</div>
          )}
        </div>

        <div className="x-card" style={{ cursor: 'default' }}>
          <h3>📜 Son Hareketler</h3>
          {rows.length === 0 ? (
            <p style={{ color: 'var(--x-muted)', fontSize: 13 }}>Henüz yoklama yok.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 240, overflowY: 'auto' }}>
              {rows.slice(0, 8).map((r) => (
                <li
                  key={r.id}
                  style={{
                    padding: '8px 0',
                    borderBottom: '1px solid var(--x-line)',
                    fontSize: 13,
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <span style={{ fontWeight: 600 }}>
                    {r.type === 'check_in' ? '▶ Giriş' : '◀ Çıkış'}
                  </span>
                  <span style={{ color: 'var(--x-muted)', fontSize: 12 }}>
                    {new Date(r.serverTime).toLocaleString('tr-TR')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }): React.ReactElement {
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: 11, color: 'var(--x-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 800 }}>{value}</div>
    </div>
  );
}

export default DamgaModulePage;

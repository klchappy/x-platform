import * as React from 'react';

interface AttendanceEvent {
  id: string;
  type: 'check_in' | 'check_out' | 'edit_request' | 'manual_entry' | 'admin_correction' | 'dispute';
  server_time: string;
  effective_time: string;
  verification_score: number;
  verification_methods: string[];
  review_status: 'approved' | 'pending_review' | 'rejected';
  review_reasons?: string[];
  this_event_hash: string;
}

interface LeaveRequest {
  id: string;
  type: string;
  start_date: string;
  end_date: string;
  business_days: number;
  status: string;
  reason?: string;
  created_at: string;
}

interface GamificationSummary {
  totalXp: number;
  level: number;
  recent: Array<{ id: string; amount: number; source: string; description?: string; created_at: string }>;
}

const headers = () => {
  const t = localStorage.getItem('x_token');
  const d = localStorage.getItem('x_demo_user');
  const h: Record<string, string> = { 'content-type': 'application/json' };
  if (t) h.authorization = `Bearer ${t}`;
  else if (d) h['x-demo-user'] = d;
  return h;
};

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  approved: { label: 'Onaylı', color: '#86efac' },
  pending_review: { label: 'İnceleniyor', color: '#fbbf24' },
  rejected: { label: 'Reddedildi', color: '#fca5a5' },
};

const LEAVE_BADGE: Record<string, { label: string; color: string }> = {
  pending: { label: 'Bekliyor', color: '#fbbf24' },
  approved: { label: 'Onaylandı', color: '#86efac' },
  rejected: { label: 'Reddedildi', color: '#fca5a5' },
  cancelled: { label: 'İptal', color: '#94a3b8' },
};

type View = 'home' | 'history' | 'leaves' | 'gamification';

export function DamgaModulePage(): React.ReactElement {
  const [view, setView] = React.useState<View>('home');

  return (
    <div className="x-mod x-mod-damga">
      <header className="x-mod__head">
        <span className="x-mod__icon">🪪</span>
        <div style={{ flex: 1 }}>
          <h1>Damga · Personel Takibi</h1>
          <p>Hash-chain destekli yoklama · NFC/QR/GPS doğrulama · İzin & vardiya · Gamification.</p>
        </div>
      </header>

      <nav style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid var(--x-line)', paddingBottom: 12 }}>
        <Tab active={view === 'home'} onClick={() => setView('home')} icon="🏠" label="Yoklama" />
        <Tab active={view === 'history'} onClick={() => setView('history')} icon="📜" label="Geçmişim" />
        <Tab active={view === 'leaves'} onClick={() => setView('leaves')} icon="🏖" label="İzinler" />
        <Tab active={view === 'gamification'} onClick={() => setView('gamification')} icon="🏆" label="XP" />
      </nav>

      {view === 'home' && <CheckInPanel />}
      {view === 'history' && <HistoryPanel />}
      {view === 'leaves' && <LeavesPanel />}
      {view === 'gamification' && <GamificationPanel />}
    </div>
  );
}

function Tab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}): React.ReactElement {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? 'rgba(249,115,22,0.18)' : 'transparent',
        border: active ? '1px solid rgba(249,115,22,0.4)' : '1px solid transparent',
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

function CheckInPanel(): React.ReactElement {
  const [busy, setBusy] = React.useState(false);
  const [lastEvent, setLastEvent] = React.useState<AttendanceEvent | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [gpsAllowed, setGpsAllowed] = React.useState<boolean | null>(null);
  const [coords, setCoords] = React.useState<{ lat: number; lon: number; accuracy: number } | null>(null);

  React.useEffect(() => {
    if (!navigator.geolocation) {
      setGpsAllowed(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setGpsAllowed(true);
        setCoords({ lat: p.coords.latitude, lon: p.coords.longitude, accuracy: Math.round(p.coords.accuracy) });
      },
      () => setGpsAllowed(false),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }, []);

  async function stamp(type: 'check_in' | 'check_out') {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch('/v1/modules/damga/attendance', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          type,
          client_time: new Date().toISOString(),
          latitude: coords?.lat,
          longitude: coords?.lon,
          gps_accuracy_m: coords?.accuracy,
          device_id: navigator.userAgent.slice(0, 50),
        }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? 'Yoklama gönderilemedi');
      }
      setLastEvent(await r.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      <div className="x-card" style={{ cursor: 'default', minHeight: 260 }}>
        <h3>📍 Yoklama Bas</h3>
        <p style={{ fontSize: 13, color: 'var(--x-muted)', marginBottom: 12 }}>
          {gpsAllowed === null && 'Konum alınıyor…'}
          {gpsAllowed === false && '⚠ GPS izni yok — trust skoru düşük olacak.'}
          {gpsAllowed === true && coords && (
            <span>
              📡 GPS: {coords.lat.toFixed(5)}, {coords.lon.toFixed(5)} · {coords.accuracy}m doğruluk
            </span>
          )}
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button className="x-btn" disabled={busy} onClick={() => stamp('check_in')} style={{ flex: 1, padding: '14px' }}>
            ▶ Giriş
          </button>
          <button className="x-btn x-btn--ghost" disabled={busy} onClick={() => stamp('check_out')} style={{ flex: 1, padding: '14px' }}>
            ◀ Çıkış
          </button>
        </div>
        {error && (
          <div style={{ fontSize: 12, color: '#fca5a5', padding: 8, background: 'rgba(239,68,68,0.1)', borderRadius: 8 }}>
            {error}
          </div>
        )}
      </div>

      <div className="x-card" style={{ cursor: 'default', minHeight: 260 }}>
        <h3>✅ Son Yoklama</h3>
        {lastEvent ? (
          <div style={{ fontSize: 13 }}>
            <Row k="Tip" v={lastEvent.type === 'check_in' ? '▶ Giriş' : '◀ Çıkış'} />
            <Row k="Zaman" v={new Date(lastEvent.server_time).toLocaleString('tr-TR')} />
            <Row
              k="Trust skoru"
              v={
                <span style={{ color: lastEvent.verification_score >= 80 ? '#86efac' : '#fbbf24' }}>
                  {lastEvent.verification_score}/100
                </span>
              }
            />
            <Row k="Doğrulama" v={lastEvent.verification_methods.join(', ') || '—'} />
            <Row
              k="Durum"
              v={
                <span style={{ color: STATUS_BADGE[lastEvent.review_status]?.color }}>
                  {STATUS_BADGE[lastEvent.review_status]?.label}
                </span>
              }
            />
            {lastEvent.review_reasons && lastEvent.review_reasons.length > 0 && (
              <Row k="Sebepler" v={<span style={{ fontSize: 11 }}>{lastEvent.review_reasons.join(', ')}</span>} />
            )}
            <Row
              k="Hash"
              v={
                <code style={{ fontSize: 10, color: 'var(--x-muted)' }}>
                  {lastEvent.this_event_hash.slice(0, 12)}…
                </code>
              }
            />
          </div>
        ) : (
          <p style={{ color: 'var(--x-muted)', fontSize: 13 }}>Henüz yoklama yok.</p>
        )}
      </div>
    </section>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }): React.ReactElement {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--x-line)' }}>
      <span style={{ color: 'var(--x-muted)' }}>{k}</span>
      <span style={{ fontWeight: 600 }}>{v}</span>
    </div>
  );
}

function HistoryPanel(): React.ReactElement {
  const [rows, setRows] = React.useState<AttendanceEvent[]>([]);
  React.useEffect(() => {
    fetch('/v1/modules/damga/attendance?limit=50', { headers: headers() })
      .then((r) => r.json())
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch(() => undefined);
  }, []);
  return (
    <div className="x-card" style={{ cursor: 'default' }}>
      <h3>📜 Yoklama Geçmişim ({rows.length})</h3>
      {rows.length === 0 ? (
        <p style={{ color: 'var(--x-muted)', fontSize: 13 }}>Kayıt yok.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 420, overflowY: 'auto' }}>
          {rows.map((r) => (
            <li
              key={r.id}
              style={{
                padding: '10px 0',
                borderBottom: '1px solid var(--x-line)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{r.type === 'check_in' ? '▶ Giriş' : '◀ Çıkış'}</div>
                <div style={{ fontSize: 11, color: 'var(--x-muted)' }}>
                  {new Date(r.server_time).toLocaleString('tr-TR')}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="x-badge" style={{ color: STATUS_BADGE[r.review_status]?.color }}>
                  {STATUS_BADGE[r.review_status]?.label}
                </span>
                <div style={{ fontSize: 11, color: 'var(--x-muted)', marginTop: 2 }}>
                  trust: {r.verification_score}/100
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function LeavesPanel(): React.ReactElement {
  const [rows, setRows] = React.useState<LeaveRequest[]>([]);
  const [type, setType] = React.useState<'annual' | 'sick' | 'unpaid'>('annual');
  const [start, setStart] = React.useState('');
  const [end, setEnd] = React.useState('');
  const [reason, setReason] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    const r = await fetch('/v1/modules/damga/leaves', { headers: headers() }).then((x) => x.json());
    setRows(Array.isArray(r) ? r : []);
  }, []);
  React.useEffect(() => { load(); }, [load]);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch('/v1/modules/damga/leaves', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ type, start_date: start, end_date: end, reason: reason || undefined }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? 'Talep gönderilemedi');
      }
      setStart(''); setEnd(''); setReason('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 20 }}>
      <div className="x-card" style={{ cursor: 'default' }}>
        <h3>📝 Yeni İzin Talebi</h3>
        <div className="x-stack">
          <select className="x-input" value={type} onChange={(e) => setType(e.target.value as 'annual' | 'sick' | 'unpaid')}>
            <option value="annual">Yıllık izin</option>
            <option value="sick">Hastalık izni</option>
            <option value="unpaid">Ücretsiz izin</option>
          </select>
          <input type="date" className="x-input" value={start} onChange={(e) => setStart(e.target.value)} />
          <input type="date" className="x-input" value={end} onChange={(e) => setEnd(e.target.value)} />
          <textarea
            className="x-input"
            placeholder="Açıklama (opsiyonel)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            style={{ resize: 'vertical', fontFamily: 'inherit' }}
          />
          <button className="x-btn" disabled={busy || !start || !end} onClick={submit}>
            {busy ? 'Gönderiliyor…' : 'Talep Gönder'}
          </button>
          {error && <div style={{ fontSize: 12, color: '#fca5a5' }}>{error}</div>}
        </div>
      </div>

      <div className="x-card" style={{ cursor: 'default' }}>
        <h3>📋 İzinlerim ({rows.length})</h3>
        {rows.length === 0 ? (
          <p style={{ color: 'var(--x-muted)', fontSize: 13 }}>Henüz izin talebi yok.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 360, overflowY: 'auto' }}>
            {rows.map((r) => {
              const b = LEAVE_BADGE[r.status] ?? { label: r.status, color: '#94a3b8' };
              return (
                <li
                  key={r.id}
                  style={{ padding: '10px 0', borderBottom: '1px solid var(--x-line)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        {r.type === 'annual' ? '🏖' : r.type === 'sick' ? '🤒' : '⏸'} {r.start_date} → {r.end_date}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--x-muted)' }}>
                        {r.business_days} iş günü {r.reason ? `· ${r.reason}` : ''}
                      </div>
                    </div>
                    <span className="x-badge" style={{ color: b.color }}>{b.label}</span>
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

function GamificationPanel(): React.ReactElement {
  const [data, setData] = React.useState<GamificationSummary | null>(null);
  React.useEffect(() => {
    fetch('/v1/modules/damga/gamification/me', { headers: headers() })
      .then((r) => r.json())
      .then((d) => setData(d && typeof d.totalXp === 'number' ? d : { totalXp: 0, level: 1, recent: [] }))
      .catch(() => setData({ totalXp: 0, level: 1, recent: [] }));
  }, []);
  if (!data) return <p style={{ color: 'var(--x-muted)' }}>Yükleniyor…</p>;
  return (
    <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      <div className="x-card" style={{ cursor: 'default' }}>
        <h3>🏆 XP & Seviye</h3>
        <div style={{ textAlign: 'center', padding: 24 }}>
          <div style={{ fontSize: 56, fontWeight: 900, color: '#f97316' }}>{data.totalXp}</div>
          <div style={{ fontSize: 14, color: 'var(--x-muted)' }}>toplam XP</div>
          <div style={{ marginTop: 12, fontSize: 22, fontWeight: 700 }}>Seviye {data.level}</div>
        </div>
      </div>
      <div className="x-card" style={{ cursor: 'default' }}>
        <h3>📊 Son XP Hareketleri</h3>
        {data.recent.length === 0 ? (
          <p style={{ color: 'var(--x-muted)', fontSize: 13 }}>Henüz XP yok. Yoklama bas, XP kazan.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 280, overflowY: 'auto' }}>
            {data.recent.map((x) => (
              <li
                key={x.id}
                style={{
                  padding: '6px 0',
                  borderBottom: '1px solid var(--x-line)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 13,
                }}
              >
                <span>{x.description ?? x.source}</span>
                <span style={{ color: x.amount > 0 ? '#86efac' : '#fca5a5', fontWeight: 700 }}>
                  {x.amount > 0 ? '+' : ''}{x.amount}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default DamgaModulePage;

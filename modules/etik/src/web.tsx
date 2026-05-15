import * as React from 'react';

interface Report {
  id: string;
  publicId: string;
  title: string;
  category: string;
  severity: string;
  status: string;
  isAnonymous: boolean;
  createdAt: string;
}

interface Stats {
  totalReports: number;
  openCount: number;
  underReviewCount: number;
  closedCount: number;
}

const CATEGORY_LABEL: Record<string, string> = {
  mobbing: 'Mobbing',
  taciz: 'Taciz',
  ayrimcilik: 'Ayrımcılık',
  yolsuzluk: 'Yolsuzluk',
  cikar_catismasi: 'Çıkar Çatışması',
  guvenlik: 'Güvenlik',
  cevre: 'Çevre',
  veri_kvkk: 'Veri/KVKK',
  diger: 'Diğer',
};

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  open: { label: 'Açık', color: '#fca5a5' },
  under_review: { label: 'İnceleniyor', color: '#fbbf24' },
  closed: { label: 'Kapandı', color: '#86efac' },
};

const SEVERITY_COLOR: Record<string, string> = {
  low: '#cbd5e1',
  medium: '#fbbf24',
  high: '#fb923c',
  critical: '#fca5a5',
};

const headers = () => {
  const t = localStorage.getItem('x_token');
  const d = localStorage.getItem('x_demo_user');
  const h: Record<string, string> = { 'content-type': 'application/json' };
  if (t) h.authorization = `Bearer ${t}`;
  else if (d) h['x-demo-user'] = d;
  return h;
};

export function EtikModulePage(): React.ReactElement {
  const [reports, setReports] = React.useState<Report[]>([]);
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [category, setCategory] = React.useState('diger');
  const [severity, setSeverity] = React.useState('medium');
  const [isAnonymous, setIsAnonymous] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [submitted, setSubmitted] = React.useState<{ publicId: string; token?: string } | null>(null);

  const load = React.useCallback(async () => {
    try {
      const [list, s] = await Promise.all([
        fetch('/v1/modules/etik/reports', { headers: headers() }).then((r) => r.json()),
        fetch('/v1/modules/etik/stats', { headers: headers() }).then((r) => r.json()),
      ]);
      setReports(Array.isArray(list) ? list : []);
      setStats(
        s && typeof s.totalReports === 'number'
          ? s
          : { totalReports: 0, openCount: 0, underReviewCount: 0, closedCount: 0 },
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown');
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function submit() {
    if (!title.trim() || description.length < 20) {
      setError('Açıklama en az 20 karakter olmalı');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const r = await fetch('/v1/modules/etik/reports', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ title, description, category, severity, isAnonymous }),
      });
      if (!r.ok) throw new Error(await r.text());
      const created = (await r.json()) as Report & { reporterToken?: string };
      setSubmitted({ publicId: created.publicId, token: created.reporterToken });
      setTitle('');
      setDescription('');
      setCategory('diger');
      setSeverity('medium');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="x-mod" style={{ borderColor: 'rgba(220,38,38,0.3)' }}>
      <header className="x-mod__head">
        <span className="x-mod__icon">⚖️</span>
        <div>
          <h1>Etik · Bildirim & Soruşturma</h1>
          <p>Anonim/açık şikayet, etik kurul soruşturmaları, vaka takibi.</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 16 }}>
          <Stat label="Toplam" value={stats?.totalReports ?? '…'} />
          <Stat label="Açık" value={stats?.openCount ?? '…'} accent="#fca5a5" />
          <Stat label="İnceleniyor" value={stats?.underReviewCount ?? '…'} accent="#fbbf24" />
          <Stat label="Kapandı" value={stats?.closedCount ?? '…'} accent="#86efac" />
        </div>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 20 }}>
        <div className="x-card" style={{ cursor: 'default' }}>
          <h3>📨 Yeni Bildirim</h3>
          <p style={{ fontSize: 12, color: 'var(--x-muted)', marginBottom: 12 }}>
            Anonim bildirimlerde kimliğiniz saklanmaz — sadece takip token'ı verilir.
          </p>
          {submitted ? (
            <div
              style={{
                padding: 14,
                background: 'rgba(34,197,94,0.1)',
                borderRadius: 10,
                border: '1px solid rgba(34,197,94,0.3)',
              }}
            >
              <div style={{ fontWeight: 700, color: '#86efac' }}>✓ Bildirim kaydedildi</div>
              <div style={{ marginTop: 8, fontSize: 13 }}>
                Takip kodu:{' '}
                <code style={{ fontWeight: 700 }}>{submitted.publicId}</code>
              </div>
              {submitted.token && (
                <div style={{ marginTop: 6, fontSize: 12, color: 'var(--x-muted)', wordBreak: 'break-all' }}>
                  Anonim token: <code>{submitted.token}</code>
                  <br />
                  Bu tokenı saklayın, başvurunuzun durumunu sorgulamak için kullanılır.
                </div>
              )}
              <button
                className="x-btn x-btn--ghost"
                style={{ marginTop: 12, width: '100%' }}
                onClick={() => setSubmitted(null)}
              >
                Yeni Bildirim
              </button>
            </div>
          ) : (
            <div className="x-stack">
              <input className="x-input" placeholder="Başlık" value={title} onChange={(e) => setTitle(e.target.value)} />
              <textarea
                className="x-input"
                placeholder="Olay açıklaması (en az 20 karakter)"
                rows={5}
                style={{ resize: 'vertical', fontFamily: 'inherit' }}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <select className="x-input" value={category} onChange={(e) => setCategory(e.target.value)}>
                {Object.entries(CATEGORY_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
              <select className="x-input" value={severity} onChange={(e) => setSeverity(e.target.value)}>
                <option value="low">Düşük öncelik</option>
                <option value="medium">Orta öncelik</option>
                <option value="high">Yüksek öncelik</option>
                <option value="critical">Kritik</option>
              </select>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                />
                Anonim olarak gönder (kimliğim saklanmasın)
              </label>
              <button className="x-btn" onClick={submit} disabled={busy || !title.trim() || description.length < 20}>
                {busy ? 'Gönderiliyor…' : 'Bildirimi Gönder'}
              </button>
              {error && (
                <div style={{ fontSize: 12, color: '#fca5a5' }}>{error}</div>
              )}
            </div>
          )}
        </div>

        <div className="x-card" style={{ cursor: 'default' }}>
          <h3>📋 Bildirimler (Kurul Görünümü)</h3>
          {reports.length === 0 ? (
            <p style={{ color: 'var(--x-muted)', fontSize: 13 }}>Henüz bildirim yok.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 360, overflowY: 'auto' }}>
              {reports.map((r) => {
                const badge = STATUS_BADGE[r.status] ?? { label: r.status, color: '#94a3b8' };
                return (
                  <li
                    key={r.id}
                    style={{
                      padding: '12px 0',
                      borderBottom: '1px solid var(--x-line)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600 }}>{r.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--x-muted)', marginTop: 2 }}>
                          <code style={{ color: '#94a3b8' }}>{r.publicId}</code> ·{' '}
                          {CATEGORY_LABEL[r.category] ?? r.category} · {r.isAnonymous ? 'Anonim' : 'Açık'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className="x-badge" style={{ color: badge.color }}>
                          {badge.label}
                        </span>
                        <div style={{ marginTop: 4 }}>
                          <span
                            className="x-badge"
                            style={{ fontSize: 10, color: SEVERITY_COLOR[r.severity] ?? '#94a3b8' }}
                          >
                            {r.severity}
                          </span>
                        </div>
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
      <div style={{ fontSize: 20, fontWeight: 800, color: accent }}>{value}</div>
    </div>
  );
}

export default EtikModulePage;

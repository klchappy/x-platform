import * as React from 'react';

interface Contact {
  id: string;
  fullName: string;
  company?: string;
  email?: string;
  phone?: string;
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

export function SantralModulePage(): React.ReactElement {
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [company, setCompany] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      const r = await fetch('/v1/modules/santral/contacts', { headers: headers() });
      if (r.ok) setContacts(await r.json());
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
      const r = await fetch('/v1/modules/santral/contacts', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ fullName: name, phone, company }),
      });
      if (!r.ok) throw new Error(await r.text());
      setName('');
      setPhone('');
      setCompany('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="x-mod x-mod-santral">
      <header className="x-mod__head">
        <span className="x-mod__icon">☎️</span>
        <div>
          <h1>Santral · CRM</h1>
          <p>Kişi rehberi, çağrı kaydı, sesli asistan.</p>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: 'var(--x-muted)' }}>KAYITLI KİŞİ</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{contacts.length}</div>
        </div>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="x-card" style={{ cursor: 'default' }}>
          <h3>➕ Yeni Kişi</h3>
          <div className="x-stack">
            <input className="x-input" placeholder="Ad Soyad" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="x-input" placeholder="Şirket" value={company} onChange={(e) => setCompany(e.target.value)} />
            <input className="x-input" placeholder="Telefon" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <button className="x-btn" onClick={add} disabled={busy || !name.trim()}>
              {busy ? 'Ekleniyor…' : 'Ekle'}
            </button>
            {error && <div style={{ fontSize: 12, color: '#fca5a5' }}>{error}</div>}
          </div>
        </div>

        <div className="x-card" style={{ cursor: 'default' }}>
          <h3>📇 Rehber</h3>
          {contacts.length === 0 ? (
            <p style={{ color: 'var(--x-muted)', fontSize: 13 }}>Henüz kişi yok.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 240, overflowY: 'auto' }}>
              {contacts.map((c) => (
                <li key={c.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--x-line)' }}>
                  <div style={{ fontWeight: 600 }}>{c.fullName}</div>
                  <div style={{ fontSize: 12, color: 'var(--x-muted)' }}>
                    {c.company ?? '—'} · {c.phone ?? '—'}
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

export default SantralModulePage;

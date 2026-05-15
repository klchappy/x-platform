import * as React from 'react';

interface Contact {
  id: string;
  full_name: string;
  company?: string;
  title?: string;
  email?: string;
  phone?: string;
  phone_alt?: string;
  tags?: string[];
  notes?: string;
  is_active: boolean;
  created_at: string;
}

interface CallRow {
  id: string;
  direction: 'inbound' | 'outbound' | 'missed';
  contact_id?: string;
  contact_name?: string;
  external_number?: string;
  duration_sec?: number;
  notes?: string;
  occurred_at: string;
}

interface TaskRow {
  id: string;
  title: string;
  description?: string;
  assignee_id?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'blocked' | 'done' | 'cancelled';
  due_at?: string;
  created_at: string;
}

interface EventRow {
  id: string;
  title: string;
  description?: string;
  location?: string;
  start_at: string;
  end_at: string;
  is_all_day: boolean;
}

const headers = () => {
  const t = localStorage.getItem('x_token');
  const d = localStorage.getItem('x_demo_user');
  const h: Record<string, string> = { 'content-type': 'application/json' };
  if (t) h.authorization = `Bearer ${t}`;
  else if (d) h['x-demo-user'] = d;
  return h;
};

type View = 'contacts' | 'calls' | 'tasks' | 'calendar';

const DIRECTION_META: Record<CallRow['direction'], { icon: string; color: string; label: string }> = {
  inbound: { icon: '⬇️', color: '#86efac', label: 'Gelen' },
  outbound: { icon: '⬆️', color: '#7dd3fc', label: 'Giden' },
  missed: { icon: '✖️', color: '#fca5a5', label: 'Cevapsız' },
};

const PRIORITY_META: Record<TaskRow['priority'], { color: string; label: string }> = {
  low: { color: '#94a3b8', label: 'Düşük' },
  normal: { color: '#cbd5e1', label: 'Normal' },
  high: { color: '#fb923c', label: 'Yüksek' },
  urgent: { color: '#fca5a5', label: 'Acil' },
};

const STATUS_META: Record<TaskRow['status'], { color: string; label: string }> = {
  open: { color: '#94a3b8', label: 'Açık' },
  in_progress: { color: '#7dd3fc', label: 'Sürüyor' },
  blocked: { color: '#fb923c', label: 'Engelli' },
  done: { color: '#86efac', label: 'Tamam' },
  cancelled: { color: '#64748b', label: 'İptal' },
};

export function SantralModulePage(): React.ReactElement {
  const [view, setView] = React.useState<View>('contacts');
  return (
    <div className="x-mod" style={{ borderColor: 'rgba(168,85,247,0.3)' }}>
      <header className="x-mod__head">
        <span className="x-mod__icon">☎️</span>
        <div style={{ flex: 1 }}>
          <h1>Santral · Sekreterlik</h1>
          <p>Fihrist · Çağrı kayıtları · Görev takibi · Takvim & etkinlikler.</p>
        </div>
      </header>

      <nav style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid var(--x-line)', paddingBottom: 12 }}>
        <Tab active={view === 'contacts'} onClick={() => setView('contacts')} icon="👥" label="Rehber" />
        <Tab active={view === 'calls'} onClick={() => setView('calls')} icon="📞" label="Çağrılar" />
        <Tab active={view === 'tasks'} onClick={() => setView('tasks')} icon="✅" label="Görevler" />
        <Tab active={view === 'calendar'} onClick={() => setView('calendar')} icon="📅" label="Takvim" />
      </nav>

      {view === 'contacts' && <ContactsPanel />}
      {view === 'calls' && <CallsPanel />}
      {view === 'tasks' && <TasksPanel />}
      {view === 'calendar' && <CalendarPanel />}
    </div>
  );
}

function Tab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: string; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? 'rgba(168,85,247,0.18)' : 'transparent',
        border: active ? '1px solid rgba(168,85,247,0.4)' : '1px solid transparent',
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

function ContactsPanel(): React.ReactElement {
  const [rows, setRows] = React.useState<Contact[]>([]);
  const [q, setQ] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [company, setCompany] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async (query?: string) => {
    const url = query ? `/v1/modules/santral/contacts?q=${encodeURIComponent(query)}` : '/v1/modules/santral/contacts';
    const data = await fetch(url, { headers: headers() }).then((r) => r.json());
    setRows(Array.isArray(data) ? data : []);
  }, []);
  React.useEffect(() => { load(); }, [load]);

  async function add() {
    if (!fullName.trim()) return;
    setBusy(true); setError(null);
    try {
      const r = await fetch('/v1/modules/santral/contacts', {
        method: 'POST', headers: headers(),
        body: JSON.stringify({
          full_name: fullName,
          company: company || undefined,
          phone: phone || undefined,
          email: email || undefined,
          notes: notes || undefined,
        }),
      });
      if (!r.ok) throw new Error(((await r.json()).error?.message) ?? 'Hata');
      setFullName(''); setCompany(''); setPhone(''); setEmail(''); setNotes('');
      await load(q || undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown');
    } finally { setBusy(false); }
  }

  async function remove(id: string) {
    if (!confirm('Kişiyi pasifleştir?')) return;
    await fetch(`/v1/modules/santral/contacts/${id}`, { method: 'DELETE', headers: headers() });
    await load(q || undefined);
  }

  return (
    <section style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 20 }}>
      <div className="x-card" style={{ cursor: 'default' }}>
        <h3>➕ Yeni Kişi</h3>
        <div className="x-stack">
          <input className="x-input" placeholder="Ad Soyad" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <input className="x-input" placeholder="Şirket" value={company} onChange={(e) => setCompany(e.target.value)} />
          <input className="x-input" placeholder="Telefon" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <input className="x-input" placeholder="E-posta" value={email} onChange={(e) => setEmail(e.target.value)} />
          <textarea className="x-input" placeholder="Notlar" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          <button className="x-btn" disabled={busy || !fullName.trim()} onClick={add}>
            {busy ? 'Ekleniyor…' : 'Ekle'}
          </button>
          {error && <div style={{ fontSize: 12, color: '#fca5a5' }}>{error}</div>}
        </div>
      </div>

      <div className="x-card" style={{ cursor: 'default' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0, flex: 1 }}>👥 Rehber ({rows.length})</h3>
          <input
            className="x-input"
            style={{ maxWidth: 200 }}
            placeholder="Ara: ad / şirket / telefon"
            value={q}
            onChange={(e) => { setQ(e.target.value); load(e.target.value || undefined); }}
          />
        </div>
        {rows.length === 0 ? (
          <p style={{ color: 'var(--x-muted)', fontSize: 13 }}>Kayıt yok.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 420, overflowY: 'auto' }}>
            {rows.map((c) => (
              <li key={c.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--x-line)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{c.full_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--x-muted)' }}>
                      {c.company ?? '—'}{c.title ? ` · ${c.title}` : ''}
                    </div>
                    <div style={{ fontSize: 12, marginTop: 2 }}>
                      {c.phone && <a href={`tel:${c.phone}`} style={{ color: '#7dd3fc', marginRight: 8 }}>📞 {c.phone}</a>}
                      {c.email && <span style={{ color: 'var(--x-muted)' }}>✉ {c.email}</span>}
                    </div>
                  </div>
                  <button className="x-btn x-btn--ghost" style={{ fontSize: 11, padding: '4px 8px', alignSelf: 'flex-start' }} onClick={() => remove(c.id)}>
                    Sil
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function CallsPanel(): React.ReactElement {
  const [rows, setRows] = React.useState<CallRow[]>([]);
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [direction, setDirection] = React.useState<CallRow['direction']>('outbound');
  const [contactId, setContactId] = React.useState('');
  const [externalNumber, setExternalNumber] = React.useState('');
  const [duration, setDuration] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    const [list, c] = await Promise.all([
      fetch('/v1/modules/santral/calls', { headers: headers() }).then((r) => r.json()),
      fetch('/v1/modules/santral/contacts', { headers: headers() }).then((r) => r.json()),
    ]);
    setRows(Array.isArray(list) ? list : []);
    setContacts(Array.isArray(c) ? c : []);
  }, []);
  React.useEffect(() => { load(); }, [load]);

  async function add() {
    setBusy(true);
    try {
      await fetch('/v1/modules/santral/calls', {
        method: 'POST', headers: headers(),
        body: JSON.stringify({
          direction,
          contact_id: contactId || undefined,
          external_number: externalNumber || undefined,
          duration_sec: duration ? Number(duration) : undefined,
          notes: notes || undefined,
        }),
      });
      setContactId(''); setExternalNumber(''); setDuration(''); setNotes('');
      await load();
    } finally { setBusy(false); }
  }

  return (
    <section style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 20 }}>
      <div className="x-card" style={{ cursor: 'default' }}>
        <h3>📞 Çağrı Kaydet</h3>
        <div className="x-stack">
          <select className="x-input" value={direction} onChange={(e) => setDirection(e.target.value as CallRow['direction'])}>
            <option value="inbound">⬇️ Gelen</option>
            <option value="outbound">⬆️ Giden</option>
            <option value="missed">✖️ Cevapsız</option>
          </select>
          <select className="x-input" value={contactId} onChange={(e) => setContactId(e.target.value)}>
            <option value="">— Rehberden seç —</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>{c.full_name}{c.company ? ` (${c.company})` : ''}</option>
            ))}
          </select>
          <input className="x-input" placeholder="Harici numara (opsiyonel)" value={externalNumber} onChange={(e) => setExternalNumber(e.target.value)} />
          <input className="x-input" type="number" placeholder="Süre (saniye)" value={duration} onChange={(e) => setDuration(e.target.value)} />
          <textarea className="x-input" placeholder="Notlar" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          <button className="x-btn" disabled={busy} onClick={add}>{busy ? 'Kaydediliyor…' : 'Kaydet'}</button>
        </div>
      </div>

      <div className="x-card" style={{ cursor: 'default' }}>
        <h3>📋 Son Çağrılar ({rows.length})</h3>
        {rows.length === 0 ? (
          <p style={{ color: 'var(--x-muted)', fontSize: 13 }}>Çağrı kaydı yok.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 420, overflowY: 'auto' }}>
            {rows.map((c) => {
              const m = DIRECTION_META[c.direction];
              return (
                <li key={c.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--x-line)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        <span style={{ color: m.color, marginRight: 6 }}>{m.icon} {m.label}</span>
                        {c.contact_name ?? c.external_number ?? 'Bilinmeyen'}
                      </div>
                      {c.notes && <div style={{ fontSize: 12, color: 'var(--x-muted)', marginTop: 2 }}>{c.notes}</div>}
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--x-muted)' }}>
                      {new Date(c.occurred_at).toLocaleString('tr-TR')}
                      {c.duration_sec ? <div>{formatDur(c.duration_sec)}</div> : null}
                    </div>
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

function formatDur(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function TasksPanel(): React.ReactElement {
  const [rows, setRows] = React.useState<TaskRow[]>([]);
  const [filter, setFilter] = React.useState<TaskRow['status'] | 'all'>('all');
  const [title, setTitle] = React.useState('');
  const [priority, setPriority] = React.useState<TaskRow['priority']>('normal');
  const [dueAt, setDueAt] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    const url = filter === 'all' ? '/v1/modules/santral/tasks' : `/v1/modules/santral/tasks?status=${filter}`;
    const data = await fetch(url, { headers: headers() }).then((r) => r.json());
    setRows(Array.isArray(data) ? data : []);
  }, [filter]);
  React.useEffect(() => { load(); }, [load]);

  async function add() {
    if (!title.trim()) return;
    setBusy(true);
    try {
      await fetch('/v1/modules/santral/tasks', {
        method: 'POST', headers: headers(),
        body: JSON.stringify({
          title,
          description: description || undefined,
          priority,
          due_at: dueAt ? new Date(dueAt).toISOString() : undefined,
        }),
      });
      setTitle(''); setDescription(''); setDueAt(''); setPriority('normal');
      await load();
    } finally { setBusy(false); }
  }

  async function setStatus(id: string, status: TaskRow['status']) {
    await fetch(`/v1/modules/santral/tasks/${id}`, {
      method: 'PATCH', headers: headers(),
      body: JSON.stringify({ status }),
    });
    await load();
  }

  return (
    <section style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 20 }}>
      <div className="x-card" style={{ cursor: 'default' }}>
        <h3>➕ Yeni Görev</h3>
        <div className="x-stack">
          <input className="x-input" placeholder="Başlık" value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea className="x-input" placeholder="Açıklama" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          <select className="x-input" value={priority} onChange={(e) => setPriority(e.target.value as TaskRow['priority'])}>
            <option value="low">Düşük</option>
            <option value="normal">Normal</option>
            <option value="high">Yüksek</option>
            <option value="urgent">Acil</option>
          </select>
          <input className="x-input" type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
          <button className="x-btn" disabled={busy || !title.trim()} onClick={add}>{busy ? 'Ekleniyor…' : 'Ekle'}</button>
        </div>
      </div>

      <div className="x-card" style={{ cursor: 'default' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0, flex: 1 }}>✅ Görevler ({rows.length})</h3>
          <select className="x-input" style={{ maxWidth: 160 }} value={filter} onChange={(e) => setFilter(e.target.value as TaskRow['status'] | 'all')}>
            <option value="all">Hepsi</option>
            <option value="open">Açık</option>
            <option value="in_progress">Sürüyor</option>
            <option value="blocked">Engelli</option>
            <option value="done">Tamam</option>
          </select>
        </div>
        {rows.length === 0 ? (
          <p style={{ color: 'var(--x-muted)', fontSize: 13 }}>Görev yok.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 420, overflowY: 'auto' }}>
            {rows.map((t) => {
              const sm = STATUS_META[t.status];
              const pm = PRIORITY_META[t.priority];
              return (
                <li key={t.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--x-line)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{t.title}</div>
                      {t.description && <div style={{ fontSize: 12, color: 'var(--x-muted)', marginTop: 2 }}>{t.description}</div>}
                      <div style={{ fontSize: 11, marginTop: 4, display: 'flex', gap: 6 }}>
                        <span className="x-badge" style={{ color: sm.color }}>{sm.label}</span>
                        <span className="x-badge" style={{ color: pm.color }}>{pm.label}</span>
                        {t.due_at && <span style={{ color: 'var(--x-muted)' }}>⏰ {new Date(t.due_at).toLocaleString('tr-TR')}</span>}
                      </div>
                    </div>
                    {t.status !== 'done' && (
                      <button className="x-btn x-btn--ghost" style={{ fontSize: 11, padding: '4px 8px', alignSelf: 'flex-start' }} onClick={() => setStatus(t.id, 'done')}>
                        Tamamla
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

function CalendarPanel(): React.ReactElement {
  const [rows, setRows] = React.useState<EventRow[]>([]);
  const [title, setTitle] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [startAt, setStartAt] = React.useState('');
  const [endAt, setEndAt] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    const data = await fetch('/v1/modules/santral/tasks/events', { headers: headers() }).then((r) => r.json());
    setRows(Array.isArray(data) ? data : []);
  }, []);
  React.useEffect(() => { load(); }, [load]);

  async function add() {
    if (!title.trim() || !startAt || !endAt) return;
    setBusy(true);
    try {
      await fetch('/v1/modules/santral/tasks/events', {
        method: 'POST', headers: headers(),
        body: JSON.stringify({
          title,
          location: location || undefined,
          start_at: new Date(startAt).toISOString(),
          end_at: new Date(endAt).toISOString(),
        }),
      });
      setTitle(''); setLocation(''); setStartAt(''); setEndAt('');
      await load();
    } finally { setBusy(false); }
  }

  return (
    <section style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 20 }}>
      <div className="x-card" style={{ cursor: 'default' }}>
        <h3>➕ Yeni Etkinlik</h3>
        <div className="x-stack">
          <input className="x-input" placeholder="Başlık" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input className="x-input" placeholder="Konum (opsiyonel)" value={location} onChange={(e) => setLocation(e.target.value)} />
          <label style={{ fontSize: 12, color: 'var(--x-muted)' }}>Başlangıç</label>
          <input className="x-input" type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
          <label style={{ fontSize: 12, color: 'var(--x-muted)' }}>Bitiş</label>
          <input className="x-input" type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
          <button className="x-btn" disabled={busy || !title.trim() || !startAt || !endAt} onClick={add}>
            {busy ? 'Ekleniyor…' : 'Ekle'}
          </button>
        </div>
      </div>

      <div className="x-card" style={{ cursor: 'default' }}>
        <h3>📅 Yaklaşan Etkinlikler ({rows.length})</h3>
        {rows.length === 0 ? (
          <p style={{ color: 'var(--x-muted)', fontSize: 13 }}>Etkinlik yok.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 420, overflowY: 'auto' }}>
            {rows.map((e) => (
              <li key={e.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--x-line)' }}>
                <div style={{ fontWeight: 600 }}>{e.title}</div>
                <div style={{ fontSize: 12, color: 'var(--x-muted)' }}>
                  {new Date(e.start_at).toLocaleString('tr-TR')} → {new Date(e.end_at).toLocaleString('tr-TR')}
                </div>
                {e.location && <div style={{ fontSize: 12, color: '#7dd3fc' }}>📍 {e.location}</div>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default SantralModulePage;

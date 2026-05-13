import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ORG_ROLES } from '@x/shared';
import { api } from '../lib/api.js';

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  token: string;
  expiresAt: string;
  createdAt: string;
  acceptUrl?: string;
}

export function TeamPage(): React.ReactElement {
  const qc = useQueryClient();
  const [email, setEmail] = React.useState('');
  const [role, setRole] = React.useState<string>('employee');
  const [lastInvite, setLastInvite] = React.useState<Invitation | null>(null);

  const invitesQ = useQuery<Invitation[]>({
    queryKey: ['invites'],
    queryFn: () => api<Invitation[]>('/v1/invitations'),
    retry: false,
  });

  const create = useMutation({
    mutationFn: (input: { email: string; role: string }) =>
      api<Invitation>('/v1/invitations', { method: 'POST', body: input }),
    onSuccess: (inv) => {
      setLastInvite(inv);
      setEmail('');
      qc.invalidateQueries({ queryKey: ['invites'] });
    },
  });

  const revoke = useMutation({
    mutationFn: (id: string) => api(`/v1/invitations/${id}/revoke`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invites'] }),
  });

  return (
    <div>
      <div className="x-topbar">
        <div>
          <div className="x-topbar__title">Ekip & Davetler</div>
          <div className="x-topbar__sub">Kullanıcı davet et, rolleri ve modül erişimini yönet</div>
        </div>
      </div>

      <div className="x-card" style={{ cursor: 'default', marginBottom: 24 }}>
        <h3>Yeni kullanıcı davet et</h3>
        <p style={{ fontSize: 13, color: 'var(--x-muted)', marginBottom: 16 }}>
          Davet linki 7 gün geçerli. Kullanıcı e-postasıyla giriş yapıp davet linkini açtığında otomatik
          organizasyonuna eklenir.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px auto', gap: 12 }}>
          <input
            type="email"
            className="x-input"
            placeholder="ornek@sirket.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <select className="x-input" value={role} onChange={(e) => setRole(e.target.value)}>
            {ORG_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button
            className="x-btn"
            disabled={!email || create.isPending}
            onClick={() => create.mutate({ email, role })}
          >
            {create.isPending ? 'Gönderiliyor…' : 'Davet Et'}
          </button>
        </div>
        {lastInvite?.acceptUrl && (
          <div style={{ marginTop: 16, padding: 12, background: 'rgba(34,197,94,0.1)', borderRadius: 8, fontSize: 13 }}>
            <div style={{ marginBottom: 6, color: '#86efac' }}>✓ Davet oluşturuldu</div>
            <div style={{ wordBreak: 'break-all', fontFamily: 'monospace' }}>{lastInvite.acceptUrl}</div>
          </div>
        )}
      </div>

      <h3 style={{ marginBottom: 16, fontSize: 18, fontWeight: 700 }}>
        Davetler {invitesQ.data && `(${invitesQ.data.length})`}
      </h3>
      <div className="x-cards" style={{ gridTemplateColumns: '1fr' }}>
        {invitesQ.data?.map((inv) => (
          <div key={inv.id} className="x-card" style={{ cursor: 'default' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{inv.email}</div>
                <div style={{ fontSize: 12, color: 'var(--x-muted)', marginTop: 2 }}>
                  Rol: {inv.role} · Durum: {inv.status} · Son geçerlilik: {new Date(inv.expiresAt).toLocaleDateString('tr-TR')}
                </div>
              </div>
              {inv.status === 'pending' && (
                <button
                  className="x-btn x-btn--ghost"
                  onClick={() => revoke.mutate(inv.id)}
                  disabled={revoke.isPending}
                >
                  İptal
                </button>
              )}
            </div>
          </div>
        ))}
        {invitesQ.data?.length === 0 && (
          <div style={{ color: 'var(--x-muted)', textAlign: 'center', padding: 40 }}>
            Henüz davet yok. Yukarıdan ilk davetini gönder.
          </div>
        )}
      </div>
    </div>
  );
}

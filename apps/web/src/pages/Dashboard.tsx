import * as React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MODULES, MODULE_IDS } from '@x/shared';
import { api } from '../lib/api.js';

interface MeResponse {
  user: { id: string; email: string; fullName?: string; role: string; orgId?: string | null };
  org?: { id: string; name: string; slug: string; sectorBundle?: string; plan?: string } | null;
  modules: { id: string; enabled: boolean }[];
}

export function DashboardPage(): React.ReactElement {
  const me = useQuery<MeResponse>({
    queryKey: ['me'],
    queryFn: () => api<MeResponse>('/v1/me'),
    retry: false,
  });

  const enabled = new Set(me.data?.modules?.filter((m) => m.enabled).map((m) => m.id) ?? MODULE_IDS);

  return (
    <div>
      <div className="x-topbar">
        <div>
          <div className="x-topbar__title">
            Hoş geldin{me.data?.user?.fullName ? `, ${me.data.user.fullName}` : ''} 👋
          </div>
          <div className="x-topbar__sub">
            {me.data?.org ? (
              <>{me.data.org.name} · {me.data.org.plan ?? 'trial'} · {me.data.org.sectorBundle ?? 'çoklu sektör'}</>
            ) : (
              <>Demo modu — sağ üstten gerçek tenant'a geçebilirsin</>
            )}
          </div>
        </div>
        <Link to="/app/modules" className="x-btn">Modülleri Yönet</Link>
      </div>

      <div className="x-hero">
        <h2>X Platform aktif</h2>
        <p>
          Tüm modüller shell altında çalışıyor. Soldaki menüden istediğin modüle geç. Her modül kendi domain'inde
          (yoklama, mutfak, asistan, ticaret) bağımsız çalışır; ortak auth, tenant, audit ve AI altyapısını paylaşır.
        </p>
      </div>

      <h3 style={{ marginBottom: 16, fontSize: 18, fontWeight: 700 }}>Senin Modüllerin</h3>
      <div className="x-cards">
        {MODULE_IDS.map((id) => {
          const m = MODULES[id];
          const active = enabled.has(id);
          return (
            <Link key={id} to={`/app/m/${id}`} className="x-card" style={{ opacity: active ? 1 : 0.4 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{m.icon}</div>
              <h3>{m.name}</h3>
              <p>{m.tagline}</p>
              <span className="x-badge">{active ? '✓ Aktif' : 'Pasif'}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

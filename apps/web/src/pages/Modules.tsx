import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { MODULES, MODULE_IDS } from '@x/shared';
import { api } from '../lib/api.js';

interface OverviewResponse {
  name: string;
  tagline: string;
  capabilities: string[];
  roadmap: string[];
}

export function ModulesPage(): React.ReactElement {
  return (
    <div>
      <div className="x-topbar">
        <div>
          <div className="x-topbar__title">Modüller</div>
          <div className="x-topbar__sub">Her modülün yetenekleri, yol haritası ve sağlık durumu</div>
        </div>
      </div>
      <div className="x-cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
        {MODULE_IDS.map((id) => (
          <ModuleCard key={id} id={id} />
        ))}
      </div>
    </div>
  );
}

function ModuleCard({ id }: { id: keyof typeof MODULES }): React.ReactElement {
  const meta = MODULES[id];
  const overview = useQuery<OverviewResponse>({
    queryKey: ['overview', id],
    queryFn: () => api<OverviewResponse>(`/v1/modules/${id}/overview`),
    retry: false,
  });
  const health = useQuery<{ ok: boolean }>({
    queryKey: ['health', id],
    queryFn: () => api(`/v1/modules/${id}/health`),
    retry: false,
    refetchInterval: 60_000,
  });
  return (
    <div className="x-card" style={{ cursor: 'default' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <div style={{ fontSize: 28 }}>{meta.icon}</div>
        <div>
          <h3 style={{ marginBottom: 2 }}>{meta.name}</h3>
          <p style={{ fontSize: 12, margin: 0 }}>{meta.tagline}</p>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <span className="x-badge" style={{ color: health.data?.ok ? '#86efac' : '#fca5a5' }}>
            {health.isLoading ? '…' : health.data?.ok ? 'sağlıklı' : 'erişilemiyor'}
          </span>
        </div>
      </div>
      {overview.data && (
        <>
          <div style={{ marginTop: 10 }}>
            <div className="x-side__label" style={{ padding: 0 }}>Yetenekler</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
              {overview.data.capabilities.slice(0, 6).map((c) => (
                <span key={c} className="x-badge" style={{ fontSize: 10 }}>
                  {c}
                </span>
              ))}
              {overview.data.capabilities.length > 6 && (
                <span className="x-badge" style={{ fontSize: 10 }}>
                  +{overview.data.capabilities.length - 6}
                </span>
              )}
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <div className="x-side__label" style={{ padding: 0 }}>Yol Haritası</div>
            <ul style={{ fontSize: 12, color: 'var(--x-muted)', paddingLeft: 16, marginTop: 6 }}>
              {overview.data.roadmap.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PLANS, formatTry, type PlanDef } from '@x/shared';
import { api } from '../lib/api.js';

interface CurrentBilling {
  plan: PlanDef;
  subscription: {
    id: string;
    planId: string;
    status: string;
    periodStart: string;
    periodEnd: string;
  } | null;
  usage: {
    period: string;
    ai_tokens: { used: number; limit: number; remaining: number };
  };
}

export function BillingPage(): React.ReactElement {
  const qc = useQueryClient();
  const current = useQuery<CurrentBilling>({
    queryKey: ['billing', 'current'],
    queryFn: () => api<CurrentBilling>('/v1/billing/current'),
    retry: false,
  });

  const switchMutation = useMutation({
    mutationFn: (planId: string) => api('/v1/billing/switch', { method: 'POST', body: { planId } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['billing'] }),
  });

  const cur = current.data;
  const tokensPct = cur ? (cur.usage.ai_tokens.used / Math.max(1, cur.usage.ai_tokens.limit)) * 100 : 0;

  return (
    <div>
      <div className="x-topbar">
        <div>
          <div className="x-topbar__title">Plan & Faturalama</div>
          <div className="x-topbar__sub">Aylık abonelik, AI kullanım kotası, fatura</div>
        </div>
      </div>

      {cur && (
        <div className="x-hero" style={{ marginBottom: 24 }}>
          <h2>
            Şu anki plan: <span style={{ color: '#f97316' }}>{cur.plan.name}</span>
          </h2>
          <p>
            {cur.plan.tagline} ·{' '}
            {cur.plan.priceMonthlyTry === 0 ? 'Ücretsiz' : `${formatTry(cur.plan.priceMonthlyTry)}/ay`}
          </p>
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
              <span>AI token kullanımı (bu ay)</span>
              <span>
                {cur.usage.ai_tokens.used.toLocaleString('tr-TR')} /{' '}
                {cur.usage.ai_tokens.limit.toLocaleString('tr-TR')}
              </span>
            </div>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.min(100, tokensPct)}%`,
                  height: '100%',
                  background: tokensPct > 90 ? '#ef4444' : tokensPct > 70 ? '#f97316' : '#22c55e',
                  transition: 'width 0.3s',
                }}
              />
            </div>
          </div>
        </div>
      )}

      <h3 style={{ marginBottom: 16, fontSize: 18, fontWeight: 700 }}>Tüm Planlar</h3>
      <div className="x-cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', alignItems: 'stretch' }}>
        {PLANS.map((p) => {
          const isCurrent = cur?.plan.id === p.id;
          return (
            <div
              key={p.id}
              className="x-card"
              style={{
                cursor: 'default',
                borderColor: isCurrent ? '#22c55e' : p.highlight ? '#f97316' : undefined,
                borderWidth: isCurrent || p.highlight ? 2 : 1,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <h3 style={{ marginBottom: 4 }}>{p.name}</h3>
              <p style={{ fontSize: 12, color: 'var(--x-muted)', margin: 0, marginBottom: 16 }}>{p.tagline}</p>
              <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 16 }}>
                {p.priceMonthlyTry === 0 ? 'Ücretsiz' : formatTry(p.priceMonthlyTry)}
                {p.priceMonthlyTry > 0 && <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--x-muted)' }}>/ay</span>}
              </div>
              <ul style={{ fontSize: 12, color: '#cbd5e1', listStyle: 'none', padding: 0, margin: '0 0 16px', lineHeight: 1.7, flex: 1 }}>
                {p.features.map((f, i) => (
                  <li key={i}>✓ {f}</li>
                ))}
              </ul>
              {isCurrent ? (
                <span className="x-badge" style={{ width: '100%', textAlign: 'center', padding: '8px 12px', color: '#86efac' }}>
                  ✓ Aktif Plan
                </span>
              ) : (
                <button
                  className={p.highlight ? 'x-btn' : 'x-btn x-btn--ghost'}
                  onClick={() => switchMutation.mutate(p.id)}
                  disabled={switchMutation.isPending}
                  style={{ width: '100%' }}
                >
                  {switchMutation.isPending ? 'Geçiliyor…' : 'Bu Plana Geç'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

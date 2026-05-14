import * as React from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PLANS, PLAN_BY_ID, formatTry } from '@x/shared';
import { api } from '../lib/api.js';

interface SignUpResponse {
  token: string;
  user: { id: string; email: string; fullName: string; role: string };
  org: { id: string; name: string; slug: string; plan: string };
}

export function SignUpPage(): React.ReactElement {
  const [params] = useSearchParams();
  const [planId, setPlanId] = React.useState(params.get('plan') ?? 'starter');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [orgName, setOrgName] = React.useState('');
  const [status, setStatus] = React.useState<'idle' | 'creating' | 'error'>('idle');
  const [error, setError] = React.useState('');
  const navigate = useNavigate();

  const plan = PLAN_BY_ID[planId] ?? PLANS[1];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('creating');
    setError('');
    try {
      const resp = await api<SignUpResponse>('/v1/auth/sign-up', {
        method: 'POST',
        body: { email, password, fullName, orgName, planId },
      });
      localStorage.setItem('x_token', resp.token);
      localStorage.removeItem('x_demo_user');
      navigate('/app/dashboard');
    } catch (err) {
      setStatus('error');
      const msg = err instanceof Error ? err.message : 'Bilinmeyen hata';
      try {
        const parsed = JSON.parse(msg.replace(/^API \d+: /, ''));
        setError(parsed?.error?.message ?? msg);
      } catch {
        setError(msg);
      }
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 460 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontWeight: 800, fontSize: 20 }}>
            <div className="x-side__brand-mark" style={{ width: 32, height: 32, fontSize: 14 }}>X</div>
            X Platform
          </Link>
        </div>

        <div className="x-card" style={{ cursor: 'default' }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Yeni hesap aç</h2>
          <p style={{ fontSize: 13, color: 'var(--x-muted)', marginBottom: 20 }}>
            {plan.priceMonthlyTry === 0
              ? 'Ücretsiz plan ile hemen başla.'
              : `${plan.trialDays} gün ücretsiz deneme — kart bilgisi istemiyoruz.`}
          </p>

          <div style={{ marginBottom: 16, padding: 12, background: 'rgba(249,115,22,0.08)', borderRadius: 10, border: '1px solid rgba(249,115,22,0.3)' }}>
            <div style={{ fontSize: 12, color: 'var(--x-muted)', marginBottom: 4 }}>SEÇİLİ PLAN</div>
            <div style={{ fontWeight: 700 }}>
              {plan.name} ·{' '}
              {plan.priceMonthlyTry === 0 ? 'Ücretsiz' : `${formatTry(plan.priceMonthlyTry)}/ay`}
            </div>
            <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {PLANS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlanId(p.id)}
                  className="x-badge"
                  style={{
                    cursor: 'pointer',
                    background: p.id === planId ? '#f97316' : undefined,
                    color: p.id === planId ? '#fff' : undefined,
                    fontWeight: p.id === planId ? 700 : 500,
                  }}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={submit} className="x-stack">
            <input
              className="x-input"
              placeholder="Şirket adı"
              required
              minLength={2}
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
            />
            <input
              className="x-input"
              placeholder="Adın ve soyadın"
              required
              minLength={2}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <input
              type="email"
              className="x-input"
              placeholder="E-posta"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              className="x-input"
              placeholder="Şifre (en az 8 karakter)"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" className="x-btn" disabled={status === 'creating'}>
              {status === 'creating' ? 'Hesap açılıyor…' : 'Hesabı Oluştur'}
            </button>
            {status === 'error' && (
              <div style={{ fontSize: 13, color: '#fca5a5', padding: 10, background: 'rgba(239,68,68,0.1)', borderRadius: 8 }}>
                {error}
              </div>
            )}
          </form>

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--x-line)', textAlign: 'center', fontSize: 13, color: 'var(--x-muted)' }}>
            Zaten hesabın var mı? <Link to="/sign-in" style={{ color: 'var(--x-fg)', fontWeight: 600 }}>Giriş yap</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

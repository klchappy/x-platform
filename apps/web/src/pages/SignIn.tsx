import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';

interface SignInResponse {
  token: string;
  user: { id: string; email: string; fullName?: string; role: string; orgId?: string };
}

export function SignInPage(): React.ReactElement {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [status, setStatus] = React.useState<'idle' | 'signing' | 'error'>('idle');
  const [error, setError] = React.useState('');
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('signing');
    setError('');
    try {
      const resp = await api<SignInResponse>('/v1/auth/sign-in', {
        method: 'POST',
        body: { email, password },
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

  function continueAsDemo() {
    localStorage.setItem('x_demo_user', 'owner@demo.local');
    localStorage.removeItem('x_token');
    navigate('/app/dashboard');
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontWeight: 800, fontSize: 20 }}>
            <div className="x-side__brand-mark" style={{ width: 32, height: 32, fontSize: 14 }}>X</div>
            X Platform
          </Link>
        </div>
        <div className="x-card" style={{ cursor: 'default' }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Giriş yap</h2>
          <p style={{ color: 'var(--x-muted)', fontSize: 13, marginBottom: 20 }}>
            E-posta ve şifren ile giriş yap.
          </p>
          <form onSubmit={submit} className="x-stack">
            <input
              type="email"
              required
              className="x-input"
              placeholder="ornek@sirket.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              required
              className="x-input"
              placeholder="Şifre"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" className="x-btn" disabled={status === 'signing'}>
              {status === 'signing' ? 'Giriliyor…' : 'Giriş Yap'}
            </button>
            {status === 'error' && (
              <div style={{ fontSize: 13, color: '#fca5a5', padding: 10, background: 'rgba(239,68,68,0.1)', borderRadius: 8 }}>
                {error}
              </div>
            )}
          </form>
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--x-line)', textAlign: 'center', fontSize: 13, color: 'var(--x-muted)' }}>
            Hesabın yok mu? <Link to="/sign-up" style={{ color: 'var(--x-fg)', fontWeight: 600 }}>Yeni hesap aç</Link>
          </div>
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--x-line)', textAlign: 'center' }}>
            <button onClick={continueAsDemo} className="x-btn x-btn--ghost" style={{ width: '100%' }}>
              Demo Olarak Devam Et
            </button>
            <p style={{ fontSize: 11, color: 'var(--x-muted)', marginTop: 8 }}>
              Demo tenant: Demo Holding · owner@demo.local
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

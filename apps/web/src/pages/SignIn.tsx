import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';

export function SignInPage(): React.ReactElement {
  const [email, setEmail] = React.useState('owner@demo.local');
  const [status, setStatus] = React.useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = React.useState('');
  const navigate = useNavigate();

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');
    try {
      await api('/v1/auth/magic-link', { method: 'POST', body: { email } });
      setStatus('sent');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Bilinmeyen hata');
    }
  }

  function continueAsDemo() {
    localStorage.setItem('x_demo_user', email);
    navigate('/app/dashboard');
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontWeight: 800, fontSize: 20 }}>
            <div className="x-side__brand-mark" style={{ width: 32, height: 32, fontSize: 14 }}>X</div>
            X Platform
          </Link>
        </div>
        <div className="x-card" style={{ cursor: 'default' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Giriş yap</h2>
          <p style={{ color: 'var(--x-muted)', fontSize: 13, marginBottom: 20 }}>
            E-posta adresine bir sihirli link göndereceğiz.
          </p>
          <form onSubmit={sendMagicLink} className="x-stack">
            <input
              type="email"
              required
              className="x-input"
              placeholder="ornek@sirket.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit" className="x-btn" disabled={status === 'sending'}>
              {status === 'sending' ? 'Gönderiliyor…' : 'Sihirli Link Gönder'}
            </button>
          </form>
          {status === 'sent' && (
            <div className="x-badge" style={{ marginTop: 16, color: '#86efac' }}>
              ✓ E-posta gönderildi
            </div>
          )}
          {status === 'error' && (
            <div className="x-badge" style={{ marginTop: 16, color: '#fca5a5' }}>
              Hata: {errorMsg}
            </div>
          )}
          <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--x-line)', textAlign: 'center' }}>
            <button onClick={continueAsDemo} className="x-btn x-btn--ghost" style={{ width: '100%' }}>
              Demo Olarak Devam Et
            </button>
            <p style={{ fontSize: 11, color: 'var(--x-muted)', marginTop: 8 }}>
              Demo: Supabase yapılandırılmadan platformu gezebilirsin.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

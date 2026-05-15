import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';

interface ResolveResponse {
  exists: boolean;
  hasPassword: boolean;
  isPending: boolean;
}

interface AuthResponse {
  token: string;
  user: { id: string; email: string; fullName?: string; role: string; orgId?: string };
}

interface MagicLinkResponse {
  ok: boolean;
  sent: boolean;
  message?: string;
  devLink?: string;
  expiresAt?: string;
}

type Step = 'email' | 'password' | 'magic' | 'sent' | 'unknown';

export function SignInPage(): React.ReactElement {
  const [step, setStep] = React.useState<Step>('email');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [, setResolved] = React.useState<ResolveResponse | null>(null);
  const [magicLink, setMagicLink] = React.useState<MagicLinkResponse | null>(null);
  const navigate = useNavigate();

  function showError(err: unknown) {
    const msg = err instanceof Error ? err.message : 'Bilinmeyen hata';
    try {
      const parsed = JSON.parse(msg.replace(/^API \d+: /, ''));
      setError(parsed?.error?.message ?? msg);
    } catch {
      setError(msg);
    }
  }

  async function sendMagicLink() {
    setBusy(true);
    setError('');
    try {
      const r = await api<MagicLinkResponse>('/v1/auth/magic-link', {
        method: 'POST',
        body: { email },
      });
      setMagicLink(r);
      setStep('sent');
    } catch (err) {
      showError(err);
    } finally {
      setBusy(false);
    }
  }

  async function resolveAndAdvance(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const r = await api<ResolveResponse>('/v1/auth/resolve-identifier', {
        method: 'POST',
        body: { identifier: email },
      });
      setResolved(r);
      if (!r.exists) {
        setStep('unknown');
      } else if (r.hasPassword) {
        setStep('password');
      } else {
        setStep('magic');
        await sendMagicLink();
      }
    } catch (err) {
      showError(err);
    } finally {
      setBusy(false);
    }
  }

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const resp = await api<AuthResponse>('/v1/auth/sign-in', {
        method: 'POST',
        body: { email, password },
      });
      localStorage.setItem('x_token', resp.token);
      localStorage.removeItem('x_demo_user');
      navigate('/app/dashboard');
    } catch (err) {
      showError(err);
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setStep('email');
    setEmail('');
    setPassword('');
    setResolved(null);
    setMagicLink(null);
    setError('');
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
          {step === 'email' && (
            <>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Giriş yap</h2>
              <p style={{ color: 'var(--x-muted)', fontSize: 13, marginBottom: 20 }}>
                E-postanı gir, hesap durumuna göre devam edelim.
              </p>
              <form onSubmit={resolveAndAdvance} className="x-stack">
                <input
                  type="email"
                  required
                  autoFocus
                  className="x-input"
                  placeholder="ornek@sirket.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button type="submit" className="x-btn" disabled={busy || !email.includes('@')}>
                  {busy ? 'Kontrol ediliyor…' : 'Devam'}
                </button>
                {error && <ErrorBox text={error} />}
              </form>
            </>
          )}

          {step === 'password' && (
            <>
              <Header email={email} onChange={reset} />
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Şifre</h2>
              <p style={{ color: 'var(--x-muted)', fontSize: 13, marginBottom: 16 }}>
                Hesabın şifre korumalı. Şifreni gir veya alttan sihirli link iste.
              </p>
              <form onSubmit={submitPassword} className="x-stack">
                <input
                  type="password"
                  required
                  autoFocus
                  className="x-input"
                  placeholder="Şifre"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="submit" className="x-btn" disabled={busy || !password}>
                  {busy ? 'Giriliyor…' : 'Giriş Yap'}
                </button>
                {error && <ErrorBox text={error} />}
              </form>
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--x-line)' }}>
                <button
                  type="button"
                  className="x-btn x-btn--ghost"
                  style={{ width: '100%', fontSize: 13 }}
                  onClick={sendMagicLink}
                  disabled={busy}
                >
                  ✉️ Sihirli link gönder (şifresiz)
                </button>
              </div>
            </>
          )}

          {step === 'magic' && (
            <>
              <Header email={email} onChange={reset} />
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Sihirli Link</h2>
              <p style={{ color: 'var(--x-muted)', fontSize: 13, marginBottom: 16 }}>
                Bu hesap şifresiz. {email}'e bir giriş linki gönderiyoruz.
              </p>
              <button className="x-btn" onClick={sendMagicLink} disabled={busy} style={{ width: '100%' }}>
                {busy ? 'Gönderiliyor…' : 'Sihirli Link Gönder'}
              </button>
              {error && <ErrorBox text={error} />}
            </>
          )}

          {step === 'sent' && magicLink && (
            <>
              <Header email={email} onChange={reset} />
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>📬 Link gönderildi</h2>
              <p style={{ color: 'var(--x-muted)', fontSize: 13, marginBottom: 16 }}>
                {magicLink.message}
              </p>
              {magicLink.devLink && (
                <div
                  style={{
                    padding: 12,
                    background: 'rgba(251,191,36,0.08)',
                    border: '1px solid rgba(251,191,36,0.3)',
                    borderRadius: 8,
                    fontSize: 12,
                    marginBottom: 12,
                  }}
                >
                  <div style={{ marginBottom: 8, color: '#fbbf24', fontWeight: 700 }}>
                    ⚠ Geliştirici modu — mail sağlayıcısı yapılandırılmamış
                  </div>
                  <a
                    href={magicLink.devLink}
                    style={{ color: 'var(--x-fg)', textDecoration: 'underline', wordBreak: 'break-all' }}
                  >
                    {magicLink.devLink}
                  </a>
                </div>
              )}
              {magicLink.expiresAt && (
                <p style={{ fontSize: 11, color: 'var(--x-muted)' }}>
                  Son kullanma: {new Date(magicLink.expiresAt).toLocaleString('tr-TR')}
                </p>
              )}
              <button className="x-btn x-btn--ghost" onClick={reset} style={{ width: '100%', marginTop: 12 }}>
                ← Başka e-posta ile dene
              </button>
            </>
          )}

          {step === 'unknown' && (
            <>
              <Header email={email} onChange={reset} />
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Hesabın yok</h2>
              <p style={{ color: 'var(--x-muted)', fontSize: 13, marginBottom: 16 }}>
                Bu e-posta ile kayıtlı bir hesap bulamadık. Hemen ücretsiz aç:
              </p>
              <Link
                to={`/sign-up?email=${encodeURIComponent(email)}`}
                className="x-btn"
                style={{ display: 'block', textAlign: 'center', width: '100%' }}
              >
                Yeni Hesap Aç →
              </Link>
              <button className="x-btn x-btn--ghost" onClick={reset} style={{ width: '100%', marginTop: 8 }}>
                ← Başka e-posta dene
              </button>
            </>
          )}

          {/* Footer (every step) */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--x-line)', textAlign: 'center', fontSize: 13, color: 'var(--x-muted)' }}>
            Hesabın yok mu?{' '}
            <Link to="/sign-up" style={{ color: 'var(--x-fg)', fontWeight: 600 }}>
              Yeni hesap aç
            </Link>
          </div>
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--x-line)', textAlign: 'center' }}>
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

function Header({ email, onChange }: { email: string; onChange: () => void }): React.ReactElement {
  return (
    <div
      style={{
        marginBottom: 14,
        padding: 10,
        background: 'rgba(255,255,255,0.04)',
        borderRadius: 8,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <span style={{ fontSize: 13 }}>{email}</span>
      <button
        type="button"
        onClick={onChange}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--x-muted)',
          cursor: 'pointer',
          fontSize: 12,
          textDecoration: 'underline',
        }}
      >
        değiştir
      </button>
    </div>
  );
}

function ErrorBox({ text }: { text: string }): React.ReactElement {
  return (
    <div
      style={{
        fontSize: 13,
        color: '#fca5a5',
        padding: 10,
        background: 'rgba(239,68,68,0.1)',
        borderRadius: 8,
      }}
    >
      {text}
    </div>
  );
}

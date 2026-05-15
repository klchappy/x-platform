import * as React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';

interface CallbackResponse {
  token: string;
  user: { id: string; email: string; fullName?: string; role: string; orgId?: string };
}

export function AuthCallbackPage(): React.ReactElement {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setError('Bağlantıda token bulunamadı.');
      return;
    }
    (async () => {
      try {
        const resp = await api<CallbackResponse>(`/v1/auth/callback?token=${encodeURIComponent(token)}`);
        localStorage.setItem('x_token', resp.token);
        localStorage.removeItem('x_demo_user');
        navigate('/app/dashboard', { replace: true });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Bilinmeyen hata';
        try {
          const parsed = JSON.parse(msg.replace(/^API \d+: /, ''));
          setError(parsed?.error?.message ?? msg);
        } catch {
          setError(msg);
        }
      }
    })();
  }, [params, navigate]);

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div className="x-card" style={{ maxWidth: 400, width: '100%', textAlign: 'center', cursor: 'default' }}>
        {error ? (
          <>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Bağlantı doğrulanamadı</h2>
            <p style={{ color: 'var(--x-muted)', fontSize: 13, marginBottom: 16 }}>{error}</p>
            <a href="/sign-in" className="x-btn" style={{ display: 'inline-block' }}>
              Tekrar giriş yap
            </a>
          </>
        ) : (
          <>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔓</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Giriş yapılıyor…</h2>
            <p style={{ color: 'var(--x-muted)', fontSize: 13 }}>Sihirli link doğrulanıyor, lütfen bekle.</p>
          </>
        )}
      </div>
    </div>
  );
}

import * as React from 'react';
import { Link } from 'react-router-dom';

const STORAGE_KEY = 'x-cookie-consent';
const TTL_DAYS = 365;

interface ConsentRecord {
  accepted: boolean;
  at: string;
}

function readConsent(): ConsentRecord | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentRecord;
    const age = (Date.now() - new Date(parsed.at).getTime()) / (24 * 60 * 60 * 1000);
    if (age > TTL_DAYS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeConsent(accepted: boolean): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ accepted, at: new Date().toISOString() }));
}

export function CookieBanner(): React.ReactElement | null {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const c = readConsent();
    if (!c) {
      const t = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(t);
    }
    return undefined;
  }, []);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Çerez bildirimi"
      style={{
        position: 'fixed',
        bottom: 20,
        left: 20,
        right: 20,
        maxWidth: 540,
        margin: '0 auto',
        background: 'rgba(15,23,42,0.96)',
        border: '1px solid var(--x-line)',
        borderRadius: 14,
        padding: 16,
        zIndex: 1000,
        boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
        animation: 'fadeIn 0.3s ease-out',
      }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ fontSize: 22 }}>🍪</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Çerez Bildirimi</div>
          <p style={{ fontSize: 12, color: 'var(--x-muted)', lineHeight: 1.5, margin: 0 }}>
            X Platform yalnızca oturum yönetimi için gerekli çerezleri kullanır. Detay için{' '}
            <Link to="/legal/cookies" style={{ color: 'var(--x-fg)', textDecoration: 'underline' }}>
              Çerez Politikası
            </Link>
            'na bakabilirsin. KVKK kapsamındaki haklarınız için{' '}
            <Link to="/legal/kvkk" style={{ color: 'var(--x-fg)', textDecoration: 'underline' }}>
              KVKK Aydınlatma Metni
            </Link>
            .
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
        <button
          className="x-btn x-btn--ghost"
          style={{ fontSize: 12, padding: '8px 14px' }}
          onClick={() => {
            writeConsent(false);
            setVisible(false);
          }}
        >
          Reddet
        </button>
        <button
          className="x-btn"
          style={{ fontSize: 12, padding: '8px 14px' }}
          onClick={() => {
            writeConsent(true);
            setVisible(false);
          }}
        >
          Kabul Et
        </button>
      </div>
    </div>
  );
}

import * as React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { MODULES, MODULE_IDS } from '@x/shared';

export function Shell(): React.ReactElement {
  const navigate = useNavigate();
  function logout() {
    localStorage.removeItem('x_token');
    localStorage.removeItem('x_demo_user');
    navigate('/sign-in');
  }
  return (
    <div className="x-shell">
      <aside className="x-side">
        <div className="x-side__brand">
          <div className="x-side__brand-mark">X</div>
          <div>
            <div>X Platform</div>
            <div style={{ fontSize: 11, color: 'var(--x-muted)', fontWeight: 500 }}>
              Birleşik İşletme OS
            </div>
          </div>
        </div>

        <div className="x-side__section">
          <div className="x-side__label">Genel</div>
          <NavItem to="/app/dashboard" icon="🏠">Anasayfa</NavItem>
          <NavItem to="/app/modules" icon="🧩">Modüller</NavItem>
        </div>

        <div className="x-side__section">
          <div className="x-side__label">Modüller</div>
          {MODULE_IDS.map((id) => {
            const m = MODULES[id];
            return (
              <NavItem key={id} to={`/app/m/${id}`} icon={m.icon}>
                {m.name}
              </NavItem>
            );
          })}
        </div>

        <div className="x-side__section">
          <div className="x-side__label">Yönetim</div>
          <NavItem to="/app/team" icon="👥">Ekip</NavItem>
          <NavItem to="/app/billing" icon="💳">Plan & Fatura</NavItem>
          <NavItem to="/app/settings" icon="⚙️">Ayarlar</NavItem>
          <button
            type="button"
            className="x-nav__item"
            onClick={logout}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', font: 'inherit' }}
          >
            <span className="x-nav__icon">🚪</span>
            <span>Çıkış</span>
          </button>
        </div>
      </aside>
      <main className="x-main">
        <Outlet />
      </main>
    </div>
  );
}

function NavItem({ to, icon, children }: { to: string; icon: string; children: React.ReactNode }): React.ReactElement {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `x-nav__item ${isActive ? 'is-active' : ''}`}
    >
      <span className="x-nav__icon">{icon}</span>
      <span>{children}</span>
    </NavLink>
  );
}

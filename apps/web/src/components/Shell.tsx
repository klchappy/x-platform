import * as React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { MODULES, MODULE_IDS } from '@x/shared';

export function Shell(): React.ReactElement {
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
          <div className="x-side__label">Sistem</div>
          <NavItem to="/app/settings" icon="⚙️">Ayarlar</NavItem>
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

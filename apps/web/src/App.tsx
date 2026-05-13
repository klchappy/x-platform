import * as React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Shell } from './components/Shell.js';
import { LandingPage } from './pages/Landing.js';
import { DashboardPage } from './pages/Dashboard.js';
import { ModulesPage } from './pages/Modules.js';
import { SettingsPage } from './pages/Settings.js';
import { SignInPage } from './pages/SignIn.js';
import DamgaModulePage from '@x/mod-damga/web';
import LokmaModulePage from '@x/mod-lokma/web';
import SantralModulePage from '@x/mod-santral/web';
import TicaretModulePage from '@x/mod-ticaret/web';

export function App(): React.ReactElement {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/app" element={<Shell />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="modules" element={<ModulesPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="m/damga" element={<DamgaModulePage />} />
        <Route path="m/lokma" element={<LokmaModulePage />} />
        <Route path="m/santral" element={<SantralModulePage />} />
        <Route path="m/ticaret" element={<TicaretModulePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

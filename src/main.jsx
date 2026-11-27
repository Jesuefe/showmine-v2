import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { installFeel } from './utils/feel';
import { Capacitor } from '@capacitor/core';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import './index.css';
import App from './App';

installFeel();
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Tell the live-update plugin this bundle started fine. If a downloaded
// update never reaches this line, the app rolls back to the last good bundle.
if (Capacitor.isNativePlatform()) {
  CapacitorUpdater.notifyAppReady().catch(() => {});
}

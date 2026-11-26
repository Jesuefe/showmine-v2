import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { downloadsSupported, renewLicences } from '../utils/downloads';

export function useOnline() {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return online;
}

// Pages that work without internet
const OFFLINE_OK = ['/downloads', '/settings', '/login'];

/**
 * In the app with no internet, go straight to My Downloads instead of
 * showing broken pages. When the connection comes back, renew licences.
 */
export default function OfflineGate() {
  const online = useOnline();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!downloadsSupported()) return;
    if (!online && !OFFLINE_OK.some(p => location.pathname.startsWith(p))) {
      navigate('/downloads', { replace: true });
    }
  }, [online, location.pathname, navigate]);

  useEffect(() => {
    if (online && downloadsSupported()) renewLicences();
  }, [online]);

  return null;
}

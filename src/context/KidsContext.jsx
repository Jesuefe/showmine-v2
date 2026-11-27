import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from './AuthContext';

// Kids Mode state shared by the whole app.
// The flag is mirrored in localStorage so the lock survives restarts and works offline;
// the server (kids.php?action=status) stays the source of truth whenever it is reachable.
const KEY = 'sm_kids_mode';
const KidsContext = createContext(null);

function readLocal() {
  try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
}

export function KidsProvider({ children }) {
  const { user } = useAuth();
  const [active, setActive] = useState(readLocal);
  const [hasPin, setHasPin] = useState(false);
  const [hasPassword, setHasPassword] = useState(true);
  const [planOk, setPlanOk] = useState(null); // null = unknown yet

  const apply = useCallback((on) => {
    setActive(on);
    try { on ? localStorage.setItem(KEY, '1') : localStorage.removeItem(KEY); } catch { /* ignore */ }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const r = await client.get('/kids.php?action=status');
      if (r.data.ok) {
        apply(!!r.data.is_kids_mode);
        setHasPin(!!r.data.has_pin);
        setHasPassword(r.data.has_password !== false);
        setPlanOk(r.data.plan_ok !== false);
      }
      return r.data;
    } catch {
      return null;
    }
  }, [apply]);

  useEffect(() => { if (user?.id) refresh(); }, [user?.id, refresh]);

  // Set (optional) new PIN, then switch Kids Mode on.
  const enable = async (pin) => {
    if (pin) {
      const s = await client.post('/kids.php?action=set_pin', { pin });
      if (!s.data.ok) return s.data;
      setHasPin(true);
    }
    const r = await client.post('/kids.php?action=enable', {});
    if (r.data.ok) apply(true);
    return r.data;
  };

  const exit = async (pin) => {
    const r = await client.post('/kids.php?action=disable', { pin });
    if (r.data.ok) apply(false);
    return r.data;
  };

  const requestResetCode = async () => (await client.post('/kids.php?action=reset_request', {})).data;

  const resetPin = async ({ password, code }) => {
    const r = await client.post('/kids.php?action=reset_pin', { password, code });
    if (r.data.ok) { apply(false); setHasPin(false); }
    return r.data;
  };

  return (
    <KidsContext.Provider value={{ active, hasPin, hasPassword, planOk, refresh, enable, exit, requestResetCode, resetPin }}>
      {children}
    </KidsContext.Provider>
  );
}

export const useKids = () => useContext(KidsContext) || { active: false };

// Keeps a child inside Kids Mode: every route outside /kids, /kids/* and /watch/* bounces back,
// and the Android back button can't leave the Kids area or close the app.
export function KidsGuard() {
  const { active } = useKids();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!active || !user) return;
    const p = location.pathname;
    if (p === '/kids' || p.startsWith('/kids/') || p.startsWith('/watch/')) return;
    navigate('/kids', { replace: true });
  }, [active, user, location.pathname, navigate]);

  useEffect(() => {
    if (!active || !window.Capacitor?.isNativePlatform?.()) return;
    let handle;
    import('@capacitor/app').then(({ App }) => {
      handle = App.addListener('backButton', () => {
        const path = window.location.pathname;
        if (path.startsWith('/watch/') || path.startsWith('/kids/')) navigate('/kids', { replace: true });
        // On /kids itself: swallow the press so the app doesn't close.
      });
    }).catch(() => {});
    return () => { Promise.resolve(handle).then(h => h?.remove?.()).catch(() => {}); };
  }, [active, navigate]);

  return null;
}

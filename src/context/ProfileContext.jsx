import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from './AuthContext';
import { useKids } from './KidsContext';

// Viewer profiles on one account ("Who's watching?").
// The chosen profile id is kept in localStorage and sent on every API call by api/client.js.
const KEY = 'showmine_profile';
const PICKED = 'showmine_profile_picked'; // per app session
const ProfileContext = createContext(null);

const readId = () => { try { return parseInt(localStorage.getItem(KEY) || '0', 10) || 0; } catch { return 0; } };

export function ProfileProvider({ children }) {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState(null);
  const [max, setMax] = useState(5);
  const [currentId, setCurrentId] = useState(readId);

  const apply = (list) => {
    setProfiles(list);
    // Profile removed elsewhere → fall back to the main profile.
    if (!list.some(p => p.id === readId())) { try { localStorage.setItem(KEY, '0'); } catch { /* ignore */ } setCurrentId(0); }
  };

  const refresh = useCallback(async () => {
    try {
      const r = await client.get('/profiles.php?action=list');
      if (r.data.ok) { apply(r.data.profiles); setMax(r.data.max || 5); return r.data.profiles; }
    } catch { /* offline */ }
    return null;
  }, []);

  useEffect(() => { if (user?.id) refresh(); else setProfiles(null); }, [user?.id, refresh]);

  const select = (id) => {
    try { localStorage.setItem(KEY, String(id)); sessionStorage.setItem(PICKED, '1'); } catch { /* ignore */ }
    setCurrentId(id);
  };

  const save = async (p) => {
    const r = await client.post('/profiles.php?action=save', p);
    if (r.data.ok) apply(r.data.profiles);
    return r.data;
  };
  const remove = async (id) => {
    const r = await client.post('/profiles.php?action=delete', { id });
    if (r.data.ok) apply(r.data.profiles);
    return r.data;
  };

  const current = profiles?.find(p => p.id === currentId) || profiles?.[0] || null;
  return (
    <ProfileContext.Provider value={{ profiles, current, currentId, max, refresh, select, save, remove }}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfiles = () => useContext(ProfileContext) || { profiles: null, current: null, currentId: 0 };

// After sign-in / app start: if the account has more than one profile, ask who's watching once per session.
export function ProfileGate() {
  const { profiles } = useProfiles();
  const { active: kids } = useKids();
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (!profiles || profiles.length < 2 || kids) return;
    let picked = false;
    try { picked = sessionStorage.getItem(PICKED) === '1'; } catch { /* ignore */ }
    const p = location.pathname;
    const skip = /^\/(profiles|login|register|onboarding|forgot-password|subscribe\/verify|tv-login|scan-login|continue|terms|privacy|watch\/)/.test(p);
    if (!picked && !skip) navigate('/profiles', { replace: true, state: { next: p + location.search } });
  }, [profiles, kids, location.pathname, location.search, navigate]);
  return null;
}

export function profileAvatarUser(p, user) {
  // Main profile shows the account picture; others use their chosen avatar style.
  if (!p) return user;
  if (p.main) return user;
  return { id: `p${p.id}`, full_name: p.name, avatar: `sm:${p.avatar}` };
}

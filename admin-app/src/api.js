const isNative = !!window.Capacitor?.isNativePlatform?.();
const BASE = isNative || !location.hostname.includes('localhost')
  ? 'https://v2.showmine.ng/api/v2/admin.php'
  : '/api/v2/admin.php';

const TOKEN_KEY = 'sm_admin_token';
export const getToken = () => { try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; } };
export const setToken = (t) => { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } };

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

async function call(action, { params = {}, body } = {}) {
  const qs = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null)) });
  const res = await fetch(`${BASE}?${qs}`, {
    method: body ? 'POST' : 'GET',
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(getToken() ? { 'X-Auth-Token': getToken() } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) { setToken(''); onUnauthorized(); throw new Error('Session expired. Please sign in again.'); }
  const data = await res.json().catch(() => ({ ok: false, error: 'Bad response from server' }));
  if (!data.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  get: (action, params) => call(action, { params }),
  post: (action, body, params) => call(action, { body: body || {}, params }),
};

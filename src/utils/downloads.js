// Offline downloads (Android app). Files are encrypted on the phone by the
// native SecureDownloads plugin; this module talks to it and to the licence API.
import { registerPlugin, Capacitor } from '@capacitor/core';
import client from '../api/client';
import { isNativeApp } from './platform';

const Native = registerPlugin('SecureDownloads');

export const downloadsSupported = () => isNativeApp() && Capacitor.getPlatform() === 'android';

const keyOf = (type, id) => `${type}-${id}`;

export async function listDownloads() {
  if (!downloadsSupported()) return { items: [], freeBytes: 0 };
  try {
    const r = await Native.list();
    const items = (r.items || []).map(d => ({
      ...d,
      poster: d.posterPath ? Capacitor.convertFileSrc(d.posterPath) : '',
    }));
    return { items, freeBytes: r.freeBytes || 0 };
  } catch {
    return { items: [], freeBytes: 0 };
  }
}

export async function getDownload(type, id) {
  const { items } = await listDownloads();
  return items.find(d => d.key === keyOf(type, id)) || null;
}

/** Ask the server for a licence, then hand the job to the phone. Returns {ok, error, code}. */
export async function startDownload({ type, id, quality }) {
  if (!downloadsSupported()) return { ok: false, error: 'Downloads work in the Showmine Android app.' };
  try {
    const r = await client.post('/downloads.php?action=authorize', { type, id, quality });
    const d = r.data || {};
    if (!d.ok) return { ok: false, error: d.error || 'Couldn’t start the download', code: d.code };
    await Native.start({
      type, id, quality: d.quality, url: d.url, title: d.title,
      poster: d.banner || d.poster || '', durationMins: d.duration_mins || 0,
      expires: d.expires, serverTime: d.server_time,
    });
    return { ok: true };
  } catch {
    return { ok: false, error: 'No internet connection. Connect and try again.' };
  }
}

export async function removeDownload(d) {
  await Native.remove({ key: d.key });
  client.post('/downloads.php?action=release', { type: d.type, id: d.id }).catch(() => {});
}

export const retryDownload = (d) => Native.retry({ key: d.key });

export async function playDownload(d) {
  try { await Native.play({ key: d.key }); return { ok: true }; }
  catch (e) { return { ok: false, error: e?.message || 'Can’t play this download' }; }
}

/** Refresh every licence while online (run at app start and when the connection returns). */
let renewing = null;
export function renewLicences() {
  if (!downloadsSupported() || !navigator.onLine) return Promise.resolve();
  if (renewing) return renewing;
  renewing = (async () => {
    try {
      const { items } = await listDownloads();
      if (!items.length) return;
      const r = await client.post('/downloads.php?action=renew', { items: items.map(d => ({ type: d.type, id: d.id })) });
      if (r.data?.ok) await Native.renew({ licences: r.data.licences || {}, serverTime: r.data.server_time });
    } catch { /* offline or signed out: keep current licences */ }
    finally { setTimeout(() => { renewing = null; }, 0); }
  })();
  return renewing;
}

export function onDownloadChange(cb) {
  if (!downloadsSupported()) return () => {};
  let handle;
  Native.addListener('change', (d) => cb({ ...d, poster: d.posterPath ? Capacitor.convertFileSrc(d.posterPath) : '' }))
    .then(h => { handle = h; });
  return () => { handle?.remove(); };
}

export function fmtBytes(n) {
  if (!n) return '0 MB';
  if (n >= 1e9) return (n / 1e9).toFixed(1) + ' GB';
  return Math.max(1, Math.round(n / 1e6)) + ' MB';
}

export function fmtExpiry(ms) {
  const left = ms - Date.now();
  if (left <= 0) return 'Expired · connect to renew';
  const days = Math.floor(left / 86400000);
  if (days >= 1) return `Expires in ${days} day${days > 1 ? 's' : ''}`;
  const hrs = Math.max(1, Math.floor(left / 3600000));
  return `Expires in ${hrs} hour${hrs > 1 ? 's' : ''}`;
}

/** Rough size: 480p ≈ 1.0 Mbit/s, 720p ≈ 2.1 Mbit/s including audio. */
export function estimateSize(mins, quality) {
  if (!mins) return '';
  const mbps = quality === '720p' ? 2.1 : 1.0;
  return '≈ ' + fmtBytes(mins * 60 * mbps * 125000);
}

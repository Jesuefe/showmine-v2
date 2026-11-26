import { devices } from '../api/extras';

// Collects real device details (Capacitor Device + App plugins) and registers
// them against the current login, so "Active devices" shows the actual phone.
let cached = null;

export async function getDeviceInfo() {
  if (cached) return cached;
  const info = { platform: 'web' };
  try {
    if (window.Capacitor?.isNativePlatform?.()) {
      const [{ Device }, { App }] = await Promise.all([import('@capacitor/device'), import('@capacitor/app')]);
      const [d, id, app] = await Promise.all([Device.getInfo(), Device.getId(), App.getInfo().catch(() => null)]);
      Object.assign(info, {
        device_uuid: id?.identifier,
        name: d.name,
        manufacturer: d.manufacturer,
        model: d.model,
        platform: d.platform,
        os_version: d.osVersion,
        app_version: app ? `${app.version} (${app.build})` : undefined,
      });
    } else {
      const ua = navigator.userAgent;
      info.model = /Windows/.test(ua) ? 'Windows PC' : /Macintosh/.test(ua) ? 'Mac' : /Android/.test(ua) ? 'Android browser' : /iPhone|iPad/.test(ua) ? 'iPhone browser' : 'Web browser';
      info.manufacturer = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : '';
    }
  } catch { /* keep partial info */ }
  cached = info;
  return info;
}

export async function registerDevice() {
  if (!localStorage.getItem('showmine_token')) return;
  try { await devices.register(await getDeviceInfo()); } catch { /* best effort */ }
}

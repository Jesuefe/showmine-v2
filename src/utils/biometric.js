// Fingerprint / face / device-passcode sign-in for the native app.
//
// When turned on, the app asks the server for a separate long-lived device
// key just for quick sign-in and keeps it in the phone's secure storage
// (Android Keystore / iOS Keychain). Signing in later needs a fingerprint,
// face or the phone's PIN, then that key is swapped for a fresh session.
// Signing out ends the session but keeps the quick sign-in key; turning the
// feature off deletes it from the phone.
import { NativeBiometric, BiometryType } from '@capgo/capacitor-native-biometric';
import client from '../api/client';
import { isNativeApp } from './platform';

const SERVER = 'v2.showmine.ng.quick-signin';
const FLAG = 'sm_bio_enabled';
const ASKED = 'sm_bio_asked';
const NAME = 'sm_bio_name';

const ALLOWED = [
  BiometryType.FINGERPRINT,
  BiometryType.FACE_AUTHENTICATION,
  BiometryType.FACE_ID,
  BiometryType.TOUCH_ID,
  BiometryType.IRIS_AUTHENTICATION,
  BiometryType.DEVICE_CREDENTIAL,
].filter(v => v !== undefined);

const ls = {
  get: k => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
  del: k => { try { localStorage.removeItem(k); } catch { /* ignore */ } },
};

export async function biometricInfo() {
  if (!isNativeApp()) return { available: false };
  try {
    const r = await NativeBiometric.isAvailable({ useFallback: true });
    const t = r.biometryType;
    let label = 'fingerprint or passcode';
    if (t === BiometryType.FACE_ID) label = 'Face ID';
    else if (t === BiometryType.TOUCH_ID) label = 'Touch ID';
    else if (t === BiometryType.FACE_AUTHENTICATION) label = 'face or passcode';
    else if (t === BiometryType.MULTIPLE) label = 'fingerprint, face or passcode';
    else if (t === BiometryType.DEVICE_CREDENTIAL || t === BiometryType.NONE) label = 'phone passcode';
    return { available: !!r.isAvailable, label };
  } catch {
    return { available: false };
  }
}

export const biometricEnabled = () => ls.get(FLAG) === '1';
export const biometricName = () => ls.get(NAME) || '';
export const biometricAsked = () => ls.get(ASKED) === '1';
export const markBiometricAsked = () => ls.set(ASKED, '1');

async function verify(title) {
  await NativeBiometric.verifyIdentity({
    title,
    subtitle: 'Showmine TV',
    reason: title,
    useFallback: true,
    maxAttempts: 5,
    allowedBiometryTypes: ALLOWED,
  });
}

// Fresh device key for the signed-in account, via the one-time code endpoint.
async function newDeviceKey(authToken) {
  const headers = authToken ? { 'X-Auth-Token': authToken } : undefined;
  const c = await client.post('/web_handoff.php?action=create', { next: '/' }, { headers });
  if (!c.data?.ok || !c.data.code) throw new Error(c.data?.error || 'Could not prepare sign-in');
  const r = await client.post('/web_handoff.php?action=redeem', { code: c.data.code }, { headers: { 'X-Auth-Token': '' } });
  if (!r.data?.ok || !r.data.token) throw new Error(r.data?.error || 'Could not prepare sign-in');
  return r.data;
}

// Turn on for the account that is signed in right now.
export async function enableBiometric(user) {
  await verify('Confirm it’s you');
  const { token } = await newDeviceKey();
  await NativeBiometric.setCredentials({ server: SERVER, username: String(user?.id || 'user'), password: token });
  ls.set(FLAG, '1');
  ls.set(ASKED, '1');
  ls.set(NAME, user?.full_name || user?.username || '');
}

export async function disableBiometric() {
  try {
    const cred = await NativeBiometric.getCredentials({ server: SERVER });
    if (cred?.password) await client.post('/auth.php?action=logout', {}, { headers: { 'X-Auth-Token': cred.password } }).catch(() => {});
  } catch { /* nothing stored */ }
  try { await NativeBiometric.deleteCredentials({ server: SERVER }); } catch { /* ignore */ }
  ls.del(FLAG); ls.del(NAME);
}

// Returns { token, user } for a new session, or throws.
export async function signInWithBiometric() {
  await verify('Sign in to Showmine');
  let cred;
  try { cred = await NativeBiometric.getCredentials({ server: SERVER }); } catch { cred = null; }
  if (!cred?.password) { await disableBiometric(); throw new Error('Quick sign-in was reset. Please sign in with your password.'); }
  try {
    return await newDeviceKey(cred.password);
  } catch (e) {
    if (/unauthor/i.test(e.message || '')) {
      await disableBiometric();
      throw new Error('Quick sign-in was turned off for this phone. Please sign in with your password.');
    }
    throw e;
  }
}

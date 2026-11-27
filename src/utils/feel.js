// "Feel" layer: haptic taps on the phone + press animations everywhere.
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

const native = () => Capacitor.isNativePlatform();
let last = 0;

export function tapHaptic(style = 'light') {
  if (!native()) return;
  const now = Date.now();
  if (now - last < 50) return;
  last = now;
  const s = style === 'heavy' ? ImpactStyle.Heavy : style === 'medium' ? ImpactStyle.Medium : ImpactStyle.Light;
  Haptics.impact({ style: s }).catch(() => {});
}

export function successHaptic() {
  if (native()) Haptics.notification({ type: NotificationType.Success }).catch(() => {});
}

export function selectHaptic() {
  if (!native()) return;
  Haptics.selectionStart().then(() => Haptics.selectionChanged()).then(() => Haptics.selectionEnd()).catch(() => {});
}

const TAPPABLE = 'button, a[href], [role="button"], [data-press], [style*="cursor: pointer"]';

// Installed once at startup. A light tick on every tap of something tappable,
// and pressed-state support for touch (Android/iOS need a touch listener for :active).
export function installFeel() {
  if (window.__smFeel) return;
  window.__smFeel = true;
  document.addEventListener('touchstart', () => {}, { passive: true });
  document.addEventListener('click', (e) => {
    const el = e.target.closest?.(TAPPABLE);
    if (!el || el.disabled || el.closest('[data-nohaptic]')) return;
    tapHaptic('light');
  }, true);
}

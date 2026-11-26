export const isNativeApp = () => !!(typeof window !== 'undefined' && (window.Capacitor?.isNativePlatform?.() || window.Android));
export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.showminetventertainment.showminetv';

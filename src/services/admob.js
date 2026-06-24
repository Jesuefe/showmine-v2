import { AdMob, InterstitialAdPluginEvents } from '@capacitor-community/admob';

const INTERSTITIAL_ID = 'ca-app-pub-1838174422371783/5805348252'; // Production ID

let initialized = false;
let interstitialReady = false;
let retryCount = 0;
const MAX_RETRIES = 3;

export async function initAdMob() {
  try {
    await AdMob.initialize({
      requestTrackingAuthorization: true,
    });
    initialized = true;
    await prepareInterstitial();
  } catch (e) {
    // Not available in browser — silently skip
  }
}

export async function prepareInterstitial() {
  if (!initialized) return;
  try {
    await AdMob.prepareInterstitial({ adId: INTERSTITIAL_ID });
    interstitialReady = true;
    retryCount = 0;
  } catch (e) {
    interstitialReady = false;
    // Retry with backoff
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      setTimeout(() => prepareInterstitial(), retryCount * 3000);
    }
  }
}

export async function showInterstitial(callback) {
  if (!initialized || !interstitialReady) {
    // Try to prepare and wait briefly
    await prepareInterstitial();
    await new Promise(r => setTimeout(r, 2000));
    if (!interstitialReady) {
      if (callback) callback();
      return;
    }
  }
  try {
    const dismissListener = await AdMob.addListener(InterstitialAdPluginEvents.Dismissed, async () => {
      dismissListener.remove();
      interstitialReady = false;
      if (callback) callback();
      await prepareInterstitial();
    });
    const failListener = await AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, async () => {
      failListener.remove();
      interstitialReady = false;
      if (callback) callback();
    });
    await AdMob.showInterstitial();
  } catch (e) {
    if (callback) callback();
  }
}

export function isAdMobAvailable() {
  return initialized;
}
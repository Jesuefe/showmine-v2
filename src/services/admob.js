import { AdMob, InterstitialAdPluginEvents } from '@capacitor-community/admob';

const INTERSTITIAL_ID = 'ca-app-pub-3940256099942544/1033173712'; // Test ID

let initialized = false;
let interstitialReady = false;
let retryCount = 0;
const MAX_RETRIES = 3;

export async function initAdMob() {
  try {
    await AdMob.initialize({
      requestTrackingAuthorization: true,
      initializeForTesting: true,
      testingDevices: ['F2C4507185425DC82A34BF9D8A03E961'],
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
    await AdMob.prepareInterstitial({ adId: INTERSTITIAL_ID, isTesting: true });
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
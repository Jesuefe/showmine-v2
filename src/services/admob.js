import { AdMob, InterstitialAdPluginEvents } from '@capacitor-community/admob';

const INTERSTITIAL_ID = 'ca-app-pub-1838174422371783/5805348252';

let initialized = false;
let interstitialReady = false;

export async function initAdMob() {
  try {
    await AdMob.initialize({
      requestTrackingAuthorization: true,
      initializeForTesting: false,
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
    await AdMob.prepareInterstitial({ adId: INTERSTITIAL_ID, isTesting: false });
    interstitialReady = true;
  } catch (e) {
    interstitialReady = false;
  }
}

export async function showInterstitial(callback) {
  if (!initialized || !interstitialReady) {
    if (callback) callback();
    return;
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

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.showminetventertainment.showminetv',
  appName: 'Showmine TV',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#000000',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_INSIDE',
      showSpinner: false,
    },
    // Live updates from our own VPS (no Capgo cloud). Web-only changes ship
    // without a Play upload; native changes still need a new AAB.
    CapacitorUpdater: {
      autoUpdate: true,
      updateUrl: 'https://v2.showmine.ng/ota/check.php',
      statsUrl: '',
      channelUrl: '',
      appReadyTimeout: 15000,
      resetWhenUpdate: true,
    },
    AdMob: {
      androidAppId: 'ca-app-pub-1838174422371783~5904552034',
    },
  },
  backgroundColor: '#000000',
  android: {
    backgroundColor: '#000000',
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;


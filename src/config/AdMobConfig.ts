/**
 * Google AdMob Configuration & Ethical Frequency Caps
 * Uses Official Google Test IDs during VS Code / Branch development.
 * Banner Position is strictly set to TOP_CENTER to protect bottom merge controls.
 */

export const AdMobConfig = {
  isTestMode: true,
  bannerPosition: 'TOP_CENTER' as const, // Updated per user request: Top Banner Ad
  interstitialCooldownSeconds: 180,      // Max 1 interstitial every 3 minutes

  // Google Official Free Test Ad Unit IDs (Safe for development & branch testing)
  testIds: {
    appId: 'ca-app-pub-3940256099942544~3347511713',
    bannerTop: 'ca-app-pub-3940256099942544/6300978111',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    rewarded: 'ca-app-pub-3940256099942544/5224354917'
  },

  // Replace with your live Play Store AdMob IDs before final production release
  productionIds: {
    appId: 'ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY',
    bannerTop: 'ca-app-pub-XXXXXXXXXXXXXXXX/BBBBBBBBBB',
    interstitial: 'ca-app-pub-XXXXXXXXXXXXXXXX/IIIIIIIIII',
    rewarded: 'ca-app-pub-XXXXXXXXXXXXXXXX/RRRRRRRRRR'
  }
};

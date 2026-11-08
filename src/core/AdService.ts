/**
 * Phase 8: Complete Google AdMob Service (Native Android Capacitor + Web Fallback)
 * Enforces TOP_CENTER Banner placement, 180s Interstitial Cooldown, and Google Play Families Policy.
 */
import { Capacitor } from '@capacitor/core';
import {
  AdMob,
  BannerAdOptions,
  BannerAdPosition,
  BannerAdSize,
  MaxAdContentRating
} from '@capacitor-community/admob';
import { AdMobConfig } from '../config/AdMobConfig';

export class AdService {
  private static instance: AdService;
  private lastInterstitialTime = 0;
  private isChildDirected = true;
  private initialized = false;

  public static getInstance(): AdService {
    if (!this.instance) {
      this.instance = new AdService();
    }
    return this.instance;
  }

  public configureAgeCompliance(userAge: number): void {
    // Google Play Families Policy: Users under 13 receive strictly G-rated non-personalized ads
    this.isChildDirected = userAge < 13;
  }

  public getBannerPosition(): 'TOP_CENTER' {
    return AdMobConfig.bannerPosition;
  }

  public isChildProtectedMode(): boolean {
    return this.isChildDirected;
  }

  public canShowInterstitial(nowMs: number = Date.now()): boolean {
    const elapsedSeconds = (nowMs - this.lastInterstitialTime) / 1000;
    return elapsedSeconds >= AdMobConfig.interstitialCooldownSeconds;
  }

  public recordInterstitialShown(nowMs: number = Date.now()): void {
    this.lastInterstitialTime = nowMs;
  }

  public async initializeAdMob(): Promise<void> {
    if (this.initialized || !Capacitor.isNativePlatform()) return;
    try {
      await AdMob.initialize({
        testingDevices: [],
        initializeForTesting: AdMobConfig.isTestMode,
        tagForChildDirectedTreatment: this.isChildDirected,
        tagForUnderAgeOfConsent: this.isChildDirected,
        maxAdContentRating: this.isChildDirected
          ? MaxAdContentRating.General
          : MaxAdContentRating.ParentalGuidance
      });
      this.initialized = true;
      await this.showTopBanner();
    } catch (e) {
      console.warn('AdMob init fallback:', e);
    }
  }

  public async showTopBanner(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      const ids = AdMobConfig.isTestMode ? AdMobConfig.testIds : AdMobConfig.productionIds;
      const options: BannerAdOptions = {
        adId: ids.bannerTop,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.TOP_CENTER,
        margin: 0,
        isTesting: AdMobConfig.isTestMode
      };
      await AdMob.showBanner(options);
    } catch (e) {
      console.warn('Banner display fallback:', e);
    }
  }

  public async showRewardedAd(onRewardGranted: () => void): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      // Instant simulation in VS Code / Browser preview
      onRewardGranted();
      return;
    }
    try {
      const ids = AdMobConfig.isTestMode ? AdMobConfig.testIds : AdMobConfig.productionIds;
      await AdMob.prepareRewardVideoAd({
        adId: ids.rewarded,
        isTesting: AdMobConfig.isTestMode
      });
      const rewardItem = await AdMob.showRewardVideoAd();
      if (rewardItem) {
        onRewardGranted();
      }
    } catch (e) {
      console.warn('Rewarded ad fallback:', e);
      onRewardGranted();
    }
  }

  public async tryShowInterstitial(): Promise<boolean> {
    if (!this.canShowInterstitial()) return false;
    this.recordInterstitialShown();

    if (!Capacitor.isNativePlatform()) return true;
    try {
      const ids = AdMobConfig.isTestMode ? AdMobConfig.testIds : AdMobConfig.productionIds;
      await AdMob.prepareInterstitial({
        adId: ids.interstitial,
        isTesting: AdMobConfig.isTestMode
      });
      await AdMob.showInterstitial();
      return true;
    } catch {
      return false;
    }
  }
}
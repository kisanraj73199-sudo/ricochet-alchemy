/**
 * AdMob Service with Top-Banner Placement & Families Policy Age Compliance
 */
import { AdMobConfig } from '../config/AdMobConfig';

export class AdService {
  private lastInterstitialTime = 0;
  private isChildDirected = true;

  public configureAgeCompliance(userAge: number): void {
    // Google Play Families Policy: Users under 13 receive strictly G-rated non-personalized ads
    this.isChildDirected = userAge < 13;
  }

  public getBannerPosition(): 'TOP_CENTER' {
    return AdMobConfig.bannerPosition;
  }

  public canShowInterstitial(nowMs: number = Date.now()): boolean {
    const elapsedSeconds = (nowMs - this.lastInterstitialTime) / 1000;
    return elapsedSeconds >= AdMobConfig.interstitialCooldownSeconds;
  }

  public recordInterstitialShown(nowMs: number = Date.now()): void {
    this.lastInterstitialTime = nowMs;
  }

  public isChildProtectedMode(): boolean {
    return this.isChildDirected;
  }
}

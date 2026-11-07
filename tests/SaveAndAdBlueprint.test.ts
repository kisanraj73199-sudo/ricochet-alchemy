import { describe, it, expect } from 'vitest';
import { SaveSystem, CURRENT_SCHEMA_VERSION } from '../src/core/SaveSystem';
import { AdService } from '../src/core/AdService';
import { ElementalCombos } from '../src/gameplay/ElementalCombos';

describe('Blueprint Core Architecture Verification', () => {
  it('places the Banner Ad at TOP_CENTER to keep bottom merge controls safe', () => {
    const adService = new AdService();
    expect(adService.getBannerPosition()).toBe('TOP_CENTER');
  });

  it('enforces 180-second interstitial cooldown and child-directed safety under age 13', () => {
    const adService = new AdService();
    adService.configureAgeCompliance(11);
    expect(adService.isChildProtectedMode()).toBe(true);

    adService.recordInterstitialShown(1000);
    expect(adService.canShowInterstitial(60_000)).toBe(false);
    expect(adService.canShowInterstitial(182_000)).toBe(true);
  });

  it('migrates older save schemas without losing player coins or waves', () => {
    const oldSave = { schemaVersion: 1, coins: 950, highestWave: 18 };
    const migrated = SaveSystem.migrateSaveData(oldSave);
    expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(migrated.coins).toBe(950);
    expect(migrated.highestWave).toBe(18);
    expect(migrated.grimoireLevels.volatileMix).toBe(1);
  });

  it('triggers Magma Ignition combo when Nature (Oil) is followed by Fire', () => {
    const combo = ElementalCombos.getComboMultiplier('NATURE', 'FIRE');
    expect(combo.multiplier).toBeGreaterThan(2.0);
  });
});

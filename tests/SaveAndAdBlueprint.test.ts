import { describe, it, expect } from 'vitest';
import { SaveSystem, CURRENT_SCHEMA_VERSION } from '../src/core/SaveSystem';
import { AdService } from '../src/core/AdService';
import { ElementalCombos } from '../src/gameplay/ElementalCombos';
import { ForgeGrid } from '../src/gameplay/ForgeGrid';
import { ArenaPhysics } from '../src/gameplay/ArenaPhysics';

describe('Complete Game & AdMob Architecture Verification (Phases 1-8)', () => {
  it('places the Banner Ad at TOP_CENTER to keep bottom merge controls safe', () => {
    const adService = new AdService();
    expect(adService.getBannerPosition()).toBe('TOP_CENTER');
  });

  it('enforces 180-second interstitial cooldown and child-directed safety under age 13', () => {
    const adService = new AdService();
    adService.configureAgeCompliance(11);
    expect(adService.isChildProtectedMode()).toBe(true);

    adService.configureAgeCompliance(16);
    expect(adService.isChildProtectedMode()).toBe(false);

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
    expect(combo.multiplier).toBe(2.5);
  });

  it('merges two identical Tier-1 runes into a Tier-2 rune on the 4x3 grid', () => {
    const grid: (string | null)[] = ['FIRE_1', 'FIRE_1', null, null, null, null, null, null, null, null, null, null];
    const res = ForgeGrid.moveOrMergeSlot(grid, 0, 1);
    expect(res.action).toBe('MERGED');
    expect(res.upgradedOrbId).toBe('FIRE_2');
    expect(grid[1]).toBe('FIRE_2');
    expect(grid[0]).toBeNull();
  });

  it('bounces active orbs cleanly off left and right arena walls', () => {
    const bounds = { left: 10, right: 380, top: 100, bottom: 500 };
    const orb = { x: 12, y: 200, vx: -300, vy: -200, radius: 8, damage: 14, color: 0xff0000, active: true };
    const step = ArenaPhysics.stepOrb(orb, 0.016, bounds, []);
    expect(step.hitWall).toBe(true);
    expect(orb.vx).toBeGreaterThan(0);
  });
});
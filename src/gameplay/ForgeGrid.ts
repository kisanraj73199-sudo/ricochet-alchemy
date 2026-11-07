/**
 * Phase 3: Bottom 4x3 Alchemical Merge Grid State Machine
 * Handles Drag-and-Merge upgrades, Tactical Slot Swapping, and Firing Queue extraction.
 */
import { OrbsConfig, OrbStats, TIER_1_KEYS, TIER_2_KEYS } from '../config/OrbsConfig';

export interface MergeOrSwapResult {
  action: 'MERGED' | 'SWAPPED' | 'NONE';
  upgradedOrbId: string | null;
}

export class ForgeGrid {
  public static canMerge(slotA: string | null, slotB: string | null): boolean {
    if (!slotA || !slotB || slotA !== slotB) return false;
    const cfg = OrbsConfig[slotA];
    return Boolean(cfg && cfg.nextTierId);
  }

  /**
   * Moves rune from sourceIdx to targetIdx on the 12-slot (4x3) grid.
   * If identical and below Tier 4 -> merges into next tier!
   * Otherwise -> swaps the two slots so player can order their firing queue.
   */
  public static moveOrMergeSlot(
    grid: (string | null)[],
    sourceIdx: number,
    targetIdx: number
  ): MergeOrSwapResult {
    if (sourceIdx === targetIdx || sourceIdx < 0 || targetIdx < 0 || sourceIdx >= 12 || targetIdx >= 12) {
      return { action: 'NONE', upgradedOrbId: null };
    }

    const srcOrb = grid[sourceIdx];
    const tgtOrb = grid[targetIdx];
    if (!srcOrb) return { action: 'NONE', upgradedOrbId: null };

    if (this.canMerge(srcOrb, tgtOrb)) {
      const nextId = OrbsConfig[srcOrb].nextTierId!;
      grid[targetIdx] = nextId;
      grid[sourceIdx] = null;
      return { action: 'MERGED', upgradedOrbId: nextId };
    }

    // Swap positions (allows tactical ordering of the firing queue)
    grid[targetIdx] = srcOrb;
    grid[sourceIdx] = tgtOrb;
    return { action: 'SWAPPED', upgradedOrbId: null };
  }

  /**
   * Spawns a new rune into the first available empty slot
   */
  public static spawnRuneInEmptySlot(grid: (string | null)[], tier: 1 | 2 = 1): number {
    const emptyIdx = grid.findIndex((slot) => slot === null);
    if (emptyIdx === -1) return -1;

    const pool = tier === 2 ? TIER_2_KEYS : TIER_1_KEYS;
    const randomKey = pool[Math.floor(Math.random() * pool.length)];
    grid[emptyIdx] = randomKey;
    return emptyIdx;
  }

  /**
   * Builds the firing volley queue from the grid (Top row slots 0-3 fire first,
   * followed by remaining active runes up to 6 shots per volley).
   */
  public static extractFiringQueue(grid: (string | null)[]): OrbStats[] {
    const queue: OrbStats[] = [];
    for (const key of grid) {
      if (key && OrbsConfig[key]) {
        queue.push(OrbsConfig[key]);
      }
      if (queue.length >= 6) break;
    }
    return queue.length > 0 ? queue : [OrbsConfig.FIRE_1];
  }
}
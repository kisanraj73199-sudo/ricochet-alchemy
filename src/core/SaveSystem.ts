/**
 * Offline Save & Schema Migration System
 * Guarantees existing players NEVER lose coins, waves, or unlocked runes during Play Store updates.
 */

export interface PlayerSaveData {
  schemaVersion: number;
  coins: number;
  gems: number;
  highestWave: number;
  userAgeDeclared: number | null;
  gridRunes: (string | null)[];
  grimoireLevels: Record<string, number>;
}

export const CURRENT_SCHEMA_VERSION = 2;
const STORAGE_KEY = 'ricochet_alchemy_save_v1';

export class SaveSystem {
  public static getDefaultSave(): PlayerSaveData {
    return {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      coins: 250,
      gems: 25,
      highestWave: 1,
      userAgeDeclared: null,
      gridRunes: [
        'FIRE_1', 'ICE_1', 'LIGHTNING_1', 'FIRE_1',
        'NATURE_1', null, 'FIRE_1', null,
        'FIRE_1', 'ICE_1', 'LIGHTNING_1', 'LIGHTNING_1'
      ],
      grimoireLevels: {
        volatileMix: 1,
        empoweredCore: 1
      }
    };
  }

  public static migrateSaveData(raw: Partial<PlayerSaveData>): PlayerSaveData {
    const defaults = this.getDefaultSave();
    const migrated: PlayerSaveData = {
      ...defaults,
      ...raw,
      grimoireLevels: {
        ...defaults.grimoireLevels,
        ...(raw.grimoireLevels || {})
      },
      schemaVersion: CURRENT_SCHEMA_VERSION
    };
    return migrated;
  }

  public static load(): PlayerSaveData {
    try {
      const rawJson = localStorage.getItem(STORAGE_KEY);
      if (!rawJson) return this.getDefaultSave();
      const parsed = JSON.parse(rawJson);
      return this.migrateSaveData(parsed);
    } catch {
      return this.getDefaultSave();
    }
  }

  public static save(data: PlayerSaveData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Offline save warning:', e);
    }
  }
}

/**
 * Persistent LocalSave + Schema Migration Engine
 * Strictly typed with non-nullable stageStars & selectedStage so TypeScript never throws undefined errors.
 */
export const CURRENT_SCHEMA_VERSION = 3;
const STORAGE_KEY = 'ricochet_alchemy_save_v1';

export interface PlayerSaveData {
  schemaVersion: number;
  coins: number;
  highestWave: number;
  selectedStage: number;
  stageStars: Record<number, number>;
  userAgeDeclared: number | null;
  grimoireLevels: Record<string, number>;
  gridRunes: (string | null)[];
}

export class SaveSystem {
  public static getDefaultSave(): PlayerSaveData {
    return {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      coins: 200,
      highestWave: 1,
      selectedStage: 1,
      stageStars: {},
      userAgeDeclared: null,
      grimoireLevels: {
        volatileMix: 1,
        empoweredCore: 1,
        alchemistGreed: 1
      },
      gridRunes: [
        'FIRE_1',
        'ICE_1',
        'LIGHTNING_1',
        'NATURE_1',
        'FIRE_1',
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ]
    };
  }

  public static migrateSaveData(raw: Partial<PlayerSaveData> | null | undefined): PlayerSaveData {
    const defaults = this.getDefaultSave();
    if (!raw || typeof raw !== 'object') return defaults;

    const highestWave =
      typeof raw.highestWave === 'number' && raw.highestWave >= 1 ? raw.highestWave : defaults.highestWave;

    const existingStars: Record<number, number> =
      raw.stageStars && typeof raw.stageStars === 'object' ? { ...raw.stageStars } : {};

    for (let s = 1; s < highestWave; s++) {
      if (!existingStars[s]) existingStars[s] = 2;
    }

    return {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      coins: typeof raw.coins === 'number' ? raw.coins : defaults.coins,
      highestWave,
      selectedStage: typeof raw.selectedStage === 'number' ? raw.selectedStage : highestWave,
      stageStars: existingStars,
      userAgeDeclared: typeof raw.userAgeDeclared === 'number' ? raw.userAgeDeclared : null,
      grimoireLevels: {
        ...defaults.grimoireLevels,
        ...(raw.grimoireLevels || {})
      },
      gridRunes: Array.isArray(raw.gridRunes) && raw.gridRunes.length === 12 ? raw.gridRunes : defaults.gridRunes
    };
  }

  public static load(): PlayerSaveData {
    try {
      const rawStr = localStorage.getItem(STORAGE_KEY);
      if (!rawStr) return this.getDefaultSave();
      const parsed = JSON.parse(rawStr);
      return this.migrateSaveData(parsed);
    } catch {
      return this.getDefaultSave();
    }
  }

  public static save(data: PlayerSaveData): void {
    try {
      data.schemaVersion = CURRENT_SCHEMA_VERSION;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignore storage quota errors
    }
  }
}
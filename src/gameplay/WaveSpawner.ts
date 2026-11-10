/**
 * Fast-Paced Explosive Wave Spawner
 * Includes Ricochet Bumper WALL Obstacles, Chain-Reaction BOMBS, SHIELDED Guards, and Bosses!
 */
import { MonstersConfig, MonsterArchetype } from '../config/MonstersConfig';
import { BlockRect } from './ArenaPhysics';

export type MonsterTrait = 'NORMAL' | 'SHIELDED' | 'HEALER' | 'BOMB' | 'BOSS' | 'WALL';

export interface SpawnedBlockInfo {
  data: BlockRect;
  archetype: MonsterArchetype;
  texKey: string;
  trait: MonsterTrait;
  shieldHp: number;
}

export interface WaveMetadata {
  waveNumber: number;
  biomeName: string;
  formationName: string;
  difficultyLabel: string;
  descentSpeed: number;
  nextBossWave: number;
  stageProgressRatio: number;
}

export class WaveSpawner {
  private static readonly BIOMES = [
    'NEON CRYSTAL SANCTUM',
    'SOLAR MAGMA CORE',
    'CYBER-VOID NEXUS',
    'ASTRAL PLASMA RIFT',
    'OMEGA OBLIVION'
  ];

  public static isBossWave(waveNumber: number): boolean {
    return waveNumber > 0 && waveNumber % 10 === 0;
  }

  public static getWaveMetadata(waveNumber: number): WaveMetadata {
    const biomeIdx = Math.floor((waveNumber - 1) / 5) % this.BIOMES.length;
    const tierMult = (1 + (waveNumber - 1) * 0.25).toFixed(1);
    const nextBossWave = Math.ceil(waveNumber / 10) * 10;
    const stepInCycle = ((waveNumber - 1) % 10) + 1;

    const formations = ['BUMPER PINBALL', 'BOMB CLUSTER', 'LASER LABYRINTH', 'DETONATION BUNKER'];
    const formationName = this.isBossWave(waveNumber)
      ? 'TITAN GOLEM OVERLORD'
      : formations[(waveNumber - 1) % formations.length];

    return {
      waveNumber,
      biomeName: this.BIOMES[biomeIdx],
      formationName,
      difficultyLabel: `HAZARD x${tierMult}`,
      descentSpeed: Math.min(1.4 + waveNumber * 0.16, 4.6),
      nextBossWave,
      stageProgressRatio: stepInCycle / 10
    };
  }

  public static spawnWaveBlocks(
    waveNumber: number,
    arenaTop: number,
    arenaWidth: number
  ): SpawnedBlockInfo[] {
    const results: SpawnedBlockInfo[] = [];
    // Balanced HP curve so blocks shatter quickly and satisfyingly!
    const scaleFactor = 0.72 + (waveNumber - 1) * 0.22 + Math.pow(waveNumber, 1.1) * 0.05;

    // 1. BOSS WAVE (Every 10th Stage)
    if (this.isBossWave(waveNumber)) {
      const bossArch = MonstersConfig.BOSS_CRYSTAL_GOLEM;
      const bossHp = Math.round(bossArch.baseHp * 0.75 * scaleFactor);
      results.push({
        data: {
          id: `boss_${waveNumber}_${Date.now()}`,
          x: arenaWidth / 2,
          y: arenaTop + 86,
          width: 170,
          height: 68,
          hp: bossHp,
          maxHp: bossHp,
          color: 0xd500f9
        },
        archetype: bossArch,
        texKey: 'monster_BOSS',
        trait: 'BOSS',
        shieldHp: Math.round(bossHp * 0.2)
      });

      // 2 Explosive Bombs + 2 Ricochet Bumper Walls around Boss!
      const bossExtras = [
        { x: 76, y: arenaTop + 158, trait: 'BOMB' as MonsterTrait, tex: 'monster_BOMB', w: 54, h: 36 },
        { x: arenaWidth - 76, y: arenaTop + 158, trait: 'BOMB' as MonsterTrait, tex: 'monster_BOMB', w: 54, h: 36 },
        { x: arenaWidth / 2, y: arenaTop + 210, trait: 'WALL' as MonsterTrait, tex: 'monster_ICE', w: 86, h: 18 }
      ];

      bossExtras.forEach((ext, idx) => {
        const hp = ext.trait === 'WALL' ? 999999 : Math.round(55 * scaleFactor);
        results.push({
          data: {
            id: `bossextra_${waveNumber}_${idx}_${Date.now()}`,
            x: ext.x,
            y: ext.y,
            width: ext.w,
            height: ext.h,
            hp,
            maxHp: hp,
            color: ext.trait === 'BOMB' ? 0xff3d00 : 0x00f5ff
          },
          archetype: MonstersConfig.CRYSTAL_GUARD,
          texKey: ext.tex,
          trait: ext.trait,
          shieldHp: 0
        });
      });

      return results;
    }

    // 2. STANDARD FAST-PACED WAVES WITH BOMBS & BUMPER WALL OBSTACLES
    const cols = 5;
    const blockW = 54;
    const blockH = 36;
    const startX = 59;
    const gapX = 68;
    const gapY = 58;
    const rows = Math.min(3 + Math.floor(waveNumber / 4), 4);
    const patternType = (waveNumber - 1) % 4;
    const baseTexPool = ['monster_ICE', 'monster_VOID', 'monster_MAGMA'];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Leave tactical channels so orbs can sneak behind the frontline and pinball-bounce!
        if (patternType === 0 && r === 0 && (c === 1 || c === 3)) continue;
        if (patternType === 1 && r === rows - 1 && (c === 0 || c === 4)) continue;
        if (patternType === 2 && r === 1 && (c === 0 || c === 4)) continue;

        const bx = startX + c * gapX;
        const by = arenaTop + 48 + r * gapY;

        let trait: MonsterTrait = 'NORMAL';
        let texKey = baseTexPool[(r + c + waveNumber) % baseTexPool.length];
        let hpMult = 0.85;

        // Place multiple Volatile Bombs (Low HP so 1-2 hits trigger huge explosions!)
        const isBombSpot =
          (r === 1 && (c === 1 || c === 3)) ||
          (r === 0 && c === 2) ||
          (rows >= 4 && r === 2 && c === 2);

        if (isBombSpot) {
          trait = 'BOMB';
          texKey = 'monster_BOMB';
          hpMult = 0.45; // Explodes fast!
        } else if (waveNumber >= 2 && r === rows - 1 && c === 2) {
          trait = 'SHIELDED';
          texKey = 'monster_ICE';
          hpMult = 1.05;
        } else if (waveNumber >= 3 && r === 0 && (c === 0 || c === 4)) {
          trait = 'HEALER';
          texKey = 'monster_HEALER';
          hpMult = 0.9;
        }

        const arch = MonstersConfig.CRYSTAL_GUARD;
        const hp = Math.max(12, Math.round(arch.baseHp * scaleFactor * hpMult));

        results.push({
          data: {
            id: `block_${waveNumber}_${r}_${c}_${Date.now()}`,
            x: bx,
            y: by,
            width: blockW,
            height: blockH,
            hp,
            maxHp: hp,
            color: trait === 'BOMB' ? 0xff3d00 : arch.color
          },
          archetype: arch,
          texKey,
          trait,
          shieldHp: trait === 'SHIELDED' ? Math.round(hp * 0.4) : 0
        });
      }
    }

    // 3. SPAWN CYBER BUMPER WALL OBSTACLES (Create chaotic pinball ricochets!)
    const wallY = arenaTop + 48 + rows * gapY + 12;
    const wallConfigs =
      waveNumber % 2 === 1
        ? [
          { x: 92, y: wallY, w: 68, h: 16 },
          { x: arenaWidth - 92, y: wallY, w: 68, h: 16 }
        ]
        : [{ x: arenaWidth / 2, y: wallY, w: 92, h: 16 }];

    wallConfigs.forEach((wc, idx) => {
      results.push({
        data: {
          id: `wall_${waveNumber}_${idx}_${Date.now()}`,
          x: wc.x,
          y: wc.y,
          width: wc.w,
          height: wc.h,
          hp: 999999,
          maxHp: 999999,
          color: 0x00f5ff
        },
        archetype: MonstersConfig.CRYSTAL_GUARD,
        texKey: 'monster_ICE',
        trait: 'WALL',
        shieldHp: 0
      });
    });

    return results;
  }
}
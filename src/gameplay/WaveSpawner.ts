/**
 * Infinite Level Progression, Biome Themes, Difficulty Scaling & Tactical Formations
 */
import { MonstersConfig, MonsterArchetype } from '../config/MonstersConfig';
import { BlockRect } from './ArenaPhysics';

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
    'CRYSTAL CAVERN',
    'MAGMA CRUCIBLE',
    'CYBER-VOID SANCTUM',
    'ASTRAL NEXUS',
    'QUANTUM ABYSS'
  ];

  public static isBossWave(waveNumber: number): boolean {
    return waveNumber > 0 && waveNumber % 10 === 0;
  }

  public static getWaveMetadata(waveNumber: number): WaveMetadata {
    const biomeIdx = Math.floor((waveNumber - 1) / 5) % this.BIOMES.length;
    const tierMult = (1 + (waveNumber - 1) * 0.28).toFixed(1);
    const nextBossWave = Math.ceil(waveNumber / 10) * 10;
    const stepInCycle = ((waveNumber - 1) % 10) + 1;

    const formations = ['PHALANX GRID', 'V-SPEAR ASSAULT', 'FORTRESS WALL', 'DIAMOND MATRIX'];
    const formationName = this.isBossWave(waveNumber)
      ? 'TITAN GOLEM RAID'
      : formations[(waveNumber - 1) % formations.length];

    return {
      waveNumber,
      biomeName: this.BIOMES[biomeIdx],
      formationName,
      difficultyLabel: `THREAT x${tierMult}`,
      descentSpeed: Math.min(1.15 + waveNumber * 0.14, 4.2),
      nextBossWave,
      stageProgressRatio: stepInCycle / 10
    };
  }

  public static spawnWaveBlocks(
    waveNumber: number,
    arenaTop: number,
    arenaWidth: number
  ): { data: BlockRect; archetype: MonsterArchetype; texKey: string }[] {
    const results: { data: BlockRect; archetype: MonsterArchetype; texKey: string }[] = [];
    const scaleFactor = 1 + (waveNumber - 1) * 0.28 + Math.pow(waveNumber, 1.15) * 0.08;

    // Every 10th Wave: Giant Boss + 2 Armored Escorts
    if (this.isBossWave(waveNumber)) {
      const bossArch = MonstersConfig.BOSS_CRYSTAL_GOLEM;
      const bossHp = Math.round(bossArch.baseHp * scaleFactor);
      results.push({
        data: {
          id: `boss_${waveNumber}_${Date.now()}`,
          x: arenaWidth / 2,
          y: arenaTop + 82,
          width: 170,
          height: 68,
          hp: bossHp,
          maxHp: bossHp,
          color: bossArch.color
        },
        archetype: bossArch,
        texKey: 'monster_BOSS'
      });

      // Two Armored Crystal Guards below Boss
      [82, arenaWidth - 82].forEach((gx, idx) => {
        const guardHp = Math.round(140 * scaleFactor);
        results.push({
          data: {
            id: `escort_${waveNumber}_${idx}_${Date.now()}`,
            x: gx,
            y: arenaTop + 154,
            width: 56,
            height: 36,
            hp: guardHp,
            maxHp: guardHp,
            color: 0xffd54f
          },
          archetype: MonstersConfig.OBSIDIAN_BRUTE,
          texKey: 'monster_ARMOR'
        });
      });

      return results;
    }

    // Well-spaced non-overlapping formations (60px vertical spacing so HP bars NEVER overlap!)
    const cols = 5;
    const blockW = 56;
    const blockH = 36;
    const startX = 59;
    const gapX = 68;
    const gapY = 58;
    const rows = Math.min(2 + Math.floor(waveNumber / 3), 4);
    const patternType = (waveNumber - 1) % 4;
    const texPool = ['monster_ICE', 'monster_VOID', 'monster_MAGMA', 'monster_ARMOR'];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Tactical Formation Holes so every wave feels fresh
        if (patternType === 1 && r === rows - 1 && (c === 0 || c === 4)) continue; // V-Spear
        if (patternType === 3 && (r + c) % 2 === 1 && r > 0) continue; // Diamond Matrix

        const bx = startX + c * gapX;
        const by = arenaTop + 48 + r * gapY;

        const isElite = (waveNumber >= 2 && r === 0 && (c === 1 || c === 3)) || (waveNumber >= 5 && r === 1 && c === 2);
        const arch = isElite ? MonstersConfig.OBSIDIAN_BRUTE : MonstersConfig.CRYSTAL_GUARD;
        const hp = Math.round(arch.baseHp * scaleFactor * (isElite ? 1.35 : 1.0));
        const texKey = isElite ? 'monster_ARMOR' : texPool[(r + c + waveNumber) % 3];

        results.push({
          data: {
            id: `block_${waveNumber}_${r}_${c}_${Date.now()}`,
            x: bx,
            y: by,
            width: blockW,
            height: blockH,
            hp,
            maxHp: hp,
            color: arch.color
          },
          archetype: arch,
          texKey
        });
      }
    }

    return results;
  }
}
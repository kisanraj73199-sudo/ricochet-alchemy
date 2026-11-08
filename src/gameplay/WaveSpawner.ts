/**
 * Phase 4 & 5: Procedural Crystal Wave & Giant Boss Spawner Logic
 */
import { MonstersConfig, MonsterArchetype } from '../config/MonstersConfig';
import { BlockRect } from './ArenaPhysics';

export class WaveSpawner {
  public static isBossWave(waveNumber: number): boolean {
    return waveNumber > 0 && waveNumber % 10 === 0;
  }

  public static spawnWaveBlocks(
    waveNumber: number,
    arenaTop: number,
    arenaWidth: number
  ): { data: BlockRect; archetype: MonsterArchetype }[] {
    const results: { data: BlockRect; archetype: MonsterArchetype }[] = [];
    const isBoss = this.isBossWave(waveNumber);

    if (isBoss) {
      const bossArch = MonstersConfig.BOSS_CRYSTAL_GOLEM;
      const data: BlockRect = {
        id: `boss_golem_${waveNumber}_${Date.now()}`,
        x: arenaWidth / 2,
        y: arenaTop + 90,
        width: 180,
        height: 70,
        hp: bossArch.baseHp + waveNumber * 50,
        maxHp: bossArch.baseHp + waveNumber * 50,
        color: bossArch.color
      };
      return [{ data, archetype: bossArch }];
    }

    // Standard Crystal Grid Rows
    const cols = 5;
    const blockW = 56;
    const blockH = 40;
    const startX = 58;
    const gapX = 68;
    const rows = Math.min(2 + Math.floor(waveNumber / 3), 4);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const bx = startX + c * gapX;
        const by = arenaTop + 45 + r * 48;
        const isBrute = waveNumber >= 3 && r === 0 && c % 2 === 0;
        const arch = isBrute ? MonstersConfig.OBSIDIAN_BRUTE : MonstersConfig.CRYSTAL_GUARD;
        const hp = arch.baseHp + waveNumber * 10;

        const data: BlockRect = {
          id: `block_${waveNumber}_${r}_${c}_${Date.now()}`,
          x: bx,
          y: by,
          width: blockW,
          height: blockH,
          hp,
          maxHp: hp,
          color: arch.color
        };

        results.push({ data, archetype: arch });
      }
    }

    return results;
  }
}
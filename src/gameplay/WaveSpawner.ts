/**
 * Dynamic 10-Stage World Theme, Multi-Tunnel Wormhole & 2X/3X Prism Frenzy Spawner
 */
import { MonstersConfig, MonsterArchetype } from '../config/MonstersConfig';
import { BlockRect } from './ArenaPhysics';

export type MonsterTrait =
  | 'NORMAL'
  | 'SHIELDED'
  | 'HEALER'
  | 'BOMB'
  | 'PRISM'
  | 'PRISM_3X'
  | 'BOSS'
  | 'WALL';

export interface BiomePalette {
  chapterIndex: number;
  topBg: number;
  bottomBg: number;
  nebulaGlow: number;
  railColor: number;
  gridColor: number;
  particleTint: number;
  patternStyle: 'HEX' | 'MAGMA' | 'BIORING' | 'CYBER' | 'SOLAR' | 'FROST';
}

export interface PortalCoord {
  x: number;
  y: number;
}

export interface SpawnedBlockInfo {
  data: BlockRect;
  archetype: MonsterArchetype;
  texKey: string;
  trait: MonsterTrait;
  shieldHp: number;
}

export interface WaveMetadata {
  waveNumber: number;
  biomeIndex: number;
  biomeName: string;
  formationName: string;
  difficultyLabel: string;
  descentSpeed: number;
  nextBossWave: number;
  stageProgressRatio: number;
  missionTargetHits: number;
  palette: BiomePalette;
  entryPortals: PortalCoord[];
  exitPortals: PortalCoord[];
}

export class WaveSpawner {
  private static readonly BIOME_NAMES = [
    'CRYSTAL STARLIGHT CAVERN', // Stages 1 - 10
    'SOLAR MAGMA CRUCIBLE',     // Stages 11 - 20
    'EMERALD BIO-SANCTUM',      // Stages 21 - 30
    'ASTRAL CYBER-RIFT',        // Stages 31 - 40
    'IMPERIAL GOLDEN CITADEL',  // Stages 41 - 50
    'QUANTUM FROST ABYSS'       // Stages 51 - 60 (Cycles infinitely with procedural tint shifts!)
  ];

  private static readonly BIOME_PALETTES: BiomePalette[] = [
    // Chapter 0 (Stages 1-10): Deep Starlight Indigo & Electric Cyan
    {
      chapterIndex: 0,
      topBg: 0x040214,
      bottomBg: 0x160a3a,
      nebulaGlow: 0x00f5ff,
      railColor: 0x00f5ff,
      gridColor: 0x00e5ff,
      particleTint: 0x80d8ff,
      patternStyle: 'HEX'
    },
    // Chapter 1 (Stages 11-20): Volcanic Magma Crimson & Molten Gold
    {
      chapterIndex: 1,
      topBg: 0x1a0300,
      bottomBg: 0x420d02,
      nebulaGlow: 0xff3d00,
      railColor: 0xffab00,
      gridColor: 0xff6d00,
      particleTint: 0xffea00,
      patternStyle: 'MAGMA'
    },
    // Chapter 2 (Stages 21-30): Emerald Bio-Sanctum & Neon Venom Green
    {
      chapterIndex: 2,
      topBg: 0x01140a,
      bottomBg: 0x063b21,
      nebulaGlow: 0x00f5a0,
      railColor: 0x00e676,
      gridColor: 0x69f0ae,
      particleTint: 0xb9f6ca,
      patternStyle: 'BIORING'
    },
    // Chapter 3 (Stages 31-40): Astral Cyber-Rift Violet & Hyper Magenta
    {
      chapterIndex: 3,
      topBg: 0x120124,
      bottomBg: 0x3b0659,
      nebulaGlow: 0xff007f,
      railColor: 0xe040fb,
      gridColor: 0xff4081,
      particleTint: 0xff80ab,
      patternStyle: 'CYBER'
    },
    // Chapter 4 (Stages 41-50): Imperial Golden Citadel & Solar Amber
    {
      chapterIndex: 4,
      topBg: 0x140d00,
      bottomBg: 0x3d2704,
      nebulaGlow: 0xffca28,
      railColor: 0xffea00,
      gridColor: 0xffd54f,
      particleTint: 0xfff59d,
      patternStyle: 'SOLAR'
    },
    // Chapter 5 (Stages 51-60): Quantum Frost Abyss & Glacier Diamond Blue
    {
      chapterIndex: 5,
      topBg: 0x010e1c,
      bottomBg: 0x062f52,
      nebulaGlow: 0x18ffff,
      railColor: 0x00b0ff,
      gridColor: 0x40c4ff,
      particleTint: 0xe0f7fa,
      patternStyle: 'FROST'
    }
  ];

  public static isBossWave(waveNumber: number): boolean {
    return waveNumber > 0 && waveNumber % 10 === 0;
  }

  /**
   * Generates Dynamic Multi-Tunnel Wormhole Configurations as stages progress!
   * Sometimes more IN tunnels, sometimes more OUT tunnels, sometimes both!
   */
  public static generateStageTunnels(waveNumber: number, width: number = 390): {
    entryPortals: PortalCoord[];
    exitPortals: PortalCoord[];
  } {
    if (waveNumber <= 2) {
      // Stages 1-2: 1 Entry Tunnel -> 1 Exit Tunnel
      const flip = waveNumber % 2 === 0;
      return {
        entryPortals: [{ x: flip ? width - 36 : 36, y: 475 }],
        exitPortals: [{ x: flip ? 46 : width - 46, y: 152 }]
      };
    }

    const mode = waveNumber % 4;
    if (mode === 1) {
      // Mode A: 2 Entry Tunnels (Left & Right) -> 1 Center-Top Exit Tunnel!
      return {
        entryPortals: [
          { x: 36, y: 475 },
          { x: width - 36, y: 475 }
        ],
        exitPortals: [{ x: width / 2, y: 146 }]
      };
    } else if (mode === 2) {
      // Mode B: 1 Entry Tunnel -> 2 Upper Exit Tunnels (Left & Right Ambush!)
      const leftIn = waveNumber % 8 === 2;
      return {
        entryPortals: [{ x: leftIn ? 36 : width - 36, y: 468 }],
        exitPortals: [
          { x: 46, y: 152 },
          { x: width - 46, y: 152 }
        ]
      };
    } else if (mode === 3) {
      // Mode C: Dual-Twin Tunnel Network (2 Entry Tunnels + 2 Exit Tunnels!)
      return {
        entryPortals: [
          { x: 34, y: 485 },
          { x: width - 34, y: 430 }
        ],
        exitPortals: [
          { x: 48, y: 150 },
          { x: width - 48, y: 150 }
        ]
      };
    } else {
      // Mode D (Every 4th Stage / High Stage): Triple-Tunnel Matrix (2 IN + 3 OUT or 3 IN + 2 OUT!)
      const extraIn = waveNumber >= 12;
      return {
        entryPortals: extraIn
          ? [
            { x: 34, y: 485 },
            { x: width - 34, y: 485 },
            { x: 34, y: 375 }
          ]
          : [
            { x: 34, y: 480 },
            { x: width - 34, y: 480 }
          ],
        exitPortals: [
          { x: 44, y: 150 },
          { x: width / 2, y: 142 },
          { x: width - 44, y: 150 }
        ]
      };
    }
  }

  public static getWaveMetadata(waveNumber: number): WaveMetadata {
    // Strictly switches world theme every 10 stages (Stages 1-10 = Biome 0, 11-20 = Biome 1, etc.)
    const tenStageChapter = Math.floor((waveNumber - 1) / 10);
    const biomeIndex = tenStageChapter % this.BIOME_NAMES.length;
    const basePalette = this.BIOME_PALETTES[biomeIndex];

    const palette: BiomePalette = this.isBossWave(waveNumber)
      ? {
        ...basePalette,
        topBg: 0x1c0008,
        bottomBg: 0x480016,
        nebulaGlow: 0xff0055,
        railColor: 0xff1744
      }
      : basePalette;

    const tierMult = (1 + (waveNumber - 1) * 0.28 + tenStageChapter * 0.5).toFixed(1);
    const nextBossWave = Math.ceil(waveNumber / 10) * 10;
    const stepInCycle = ((waveNumber - 1) % 10) + 1;

    const formations = [
      'HONEYCOMB PRISM',
      'DIAMOND CONSTELLATION',
      'CHEVRON V-WING',
      'TWIN SPIRAL CLUSTER'
    ];
    const formationName = this.isBossWave(waveNumber)
      ? '⚠️ TITAN SOVEREIGN RAID ⚠️'
      : formations[(waveNumber - 1) % formations.length];

    const descentSpeed = Math.min(1.25 + waveNumber * 0.16 + tenStageChapter * 0.25, 4.8);
    const tunnels = this.generateStageTunnels(waveNumber);

    return {
      waveNumber,
      biomeIndex,
      biomeName: this.BIOME_NAMES[biomeIndex],
      formationName,
      difficultyLabel: `HAZARD x${tierMult}`,
      descentSpeed,
      nextBossWave,
      stageProgressRatio: stepInCycle / 10,
      missionTargetHits: 14 + Math.min(waveNumber, 16),
      palette,
      entryPortals: tunnels.entryPortals,
      exitPortals: tunnels.exitPortals
    };
  }

  public static spawnWaveBlocks(
    waveNumber: number,
    arenaTop: number,
    arenaWidth: number
  ): SpawnedBlockInfo[] {
    const results: SpawnedBlockInfo[] = [];
    const bossTierBonus = Math.pow(Math.floor(waveNumber / 10), 1.4) * 0.9;
    const scaleFactor = 0.78 + (waveNumber - 1) * 0.26 + Math.pow(waveNumber, 1.15) * 0.06 + bossTierBonus;
    const cx = arenaWidth / 2;

    // 1. BOSS WAVE (Every 10th Stage)
    if (this.isBossWave(waveNumber)) {
      const bossArch = MonstersConfig.BOSS_CRYSTAL_GOLEM;
      const bossHp = Math.round(bossArch.baseHp * 0.85 * scaleFactor);
      results.push({
        data: {
          id: `boss_${waveNumber}_${Date.now()}`,
          x: cx,
          y: arenaTop + 92,
          width: 164,
          height: 68,
          hp: bossHp,
          maxHp: bossHp,
          color: 0xd500f9
        },
        archetype: bossArch,
        texKey: 'monster_BOSS',
        trait: 'BOSS',
        shieldHp: Math.round(bossHp * 0.25)
      });

      const bossNodes = [
        { x: cx - 115, y: arenaTop + 172, w: 18, h: 78, trait: 'WALL' as MonsterTrait, tex: 'monster_ICE' },
        { x: cx + 115, y: arenaTop + 172, w: 18, h: 78, trait: 'WALL' as MonsterTrait, tex: 'monster_ICE' },
        { x: cx - 64, y: arenaTop + 175, w: 46, h: 46, trait: 'PRISM' as MonsterTrait, tex: 'monster_PRISM' },
        { x: cx, y: arenaTop + 182, w: 46, h: 46, trait: 'PRISM_3X' as MonsterTrait, tex: 'monster_PRISM_3X' },
        { x: cx + 64, y: arenaTop + 175, w: 46, h: 46, trait: 'BOMB' as MonsterTrait, tex: 'monster_BOMB' }
      ];

      bossNodes.forEach((n, idx) => {
        const isOneHit = n.trait === 'WALL' || n.trait === 'BOMB' || n.trait === 'PRISM' || n.trait === 'PRISM_3X';
        const hp = isOneHit ? 1 : Math.round(55 * scaleFactor);
        results.push({
          data: {
            id: `boss_node_${waveNumber}_${idx}_${Date.now()}`,
            x: n.x,
            y: n.y,
            width: n.w,
            height: n.h,
            hp,
            maxHp: hp,
            color: n.trait === 'BOMB' ? 0xff1744 : 0x00f5ff
          },
          archetype: MonstersConfig.CRYSTAL_GUARD,
          texKey: n.tex,
          trait: n.trait,
          shieldHp: 0
        });
      });

      return results;
    }

    // 2. NON-LINEAR BUBBLE FORMATIONS + RANDOMIZED 2X / 3X MULTIBALL PRISM FRENZY!
    const layoutType = (waveNumber - 1) % 4;
    const coords: { x: number; y: number; forceTrait?: MonsterTrait }[] = [];

    if (layoutType === 0) {
      const rowCounts = waveNumber >= 6 ? [4, 5, 4, 4] : [4, 5, 4, 3];
      rowCounts.forEach((count, r) => {
        const span = (count - 1) * 66;
        const startX = cx - span / 2;
        for (let c = 0; c < count; c++) {
          let forceTrait: MonsterTrait | undefined;
          if (r === 1 && c === 2) forceTrait = 'PRISM_3X';
          else if (r === 1 && (c === 1 || c === 3)) forceTrait = 'BOMB';
          else if (waveNumber >= 4 && r === 2 && (c === 0 || c === count - 1)) forceTrait = 'SHIELDED';

          coords.push({
            x: startX + c * 66,
            y: arenaTop + 54 + r * 54,
            forceTrait
          });
        }
      });
    } else if (layoutType === 1) {
      coords.push(
        { x: cx, y: arenaTop + 46, forceTrait: 'HEALER' },
        { x: cx - 64, y: arenaTop + 88 },
        { x: cx + 64, y: arenaTop + 88 },
        { x: cx - 124, y: arenaTop + 136, forceTrait: 'PRISM' },
        { x: cx, y: arenaTop + 136, forceTrait: 'PRISM_3X' },
        { x: cx + 124, y: arenaTop + 136, forceTrait: 'PRISM' },
        { x: cx - 64, y: arenaTop + 184, forceTrait: 'BOMB' },
        { x: cx + 64, y: arenaTop + 184, forceTrait: 'BOMB' },
        { x: cx - 115, y: arenaTop + 230, forceTrait: 'SHIELDED' },
        { x: cx, y: arenaTop + 230, forceTrait: 'SHIELDED' },
        { x: cx + 115, y: arenaTop + 230, forceTrait: 'SHIELDED' }
      );
    } else if (layoutType === 2) {
      coords.push(
        { x: cx - 128, y: arenaTop + 52 },
        { x: cx + 128, y: arenaTop + 52 },
        { x: cx - 64, y: arenaTop + 58, forceTrait: 'HEALER' },
        { x: cx + 64, y: arenaTop + 58, forceTrait: 'HEALER' },
        { x: cx - 96, y: arenaTop + 112, forceTrait: 'PRISM' },
        { x: cx, y: arenaTop + 98, forceTrait: 'PRISM_3X' },
        { x: cx + 96, y: arenaTop + 112, forceTrait: 'PRISM' },
        { x: cx - 58, y: arenaTop + 168, forceTrait: 'SHIELDED' },
        { x: cx + 58, y: arenaTop + 168, forceTrait: 'SHIELDED' },
        { x: cx, y: arenaTop + 218, forceTrait: 'BOMB' },
        { x: cx - 122, y: arenaTop + 190, forceTrait: 'BOMB' },
        { x: cx + 122, y: arenaTop + 190, forceTrait: 'BOMB' }
      );
    } else {
      coords.push(
        { x: cx - 95, y: arenaTop + 54 },
        { x: cx - 35, y: arenaTop + 68, forceTrait: 'HEALER' },
        { x: cx + 35, y: arenaTop + 68, forceTrait: 'HEALER' },
        { x: cx + 95, y: arenaTop + 54 },
        { x: cx - 125, y: arenaTop + 118, forceTrait: 'BOMB' },
        { x: cx - 55, y: arenaTop + 132, forceTrait: 'PRISM' },
        { x: cx + 55, y: arenaTop + 132, forceTrait: 'PRISM_3X' },
        { x: cx + 125, y: arenaTop + 118, forceTrait: 'BOMB' },
        { x: cx - 88, y: arenaTop + 192 },
        { x: cx, y: arenaTop + 182, forceTrait: 'PRISM' },
        { x: cx + 88, y: arenaTop + 192 },
        { x: cx - 44, y: arenaTop + 240, forceTrait: 'SHIELDED' },
        { x: cx + 44, y: arenaTop + 240, forceTrait: 'SHIELDED' }
      );
    }

    const baseTexPool = ['monster_ICE', 'monster_VOID', 'monster_MAGMA'];
    const shieldChance = Math.min(0.15 + waveNumber * 0.03, 0.55);
    // Randomly boost 2X / 3X Prism Bubble spawns on certain stages!
    const isPrismFrenzyWave = waveNumber % 3 === 0 || Math.random() < 0.35;

    coords.forEach((pt, idx) => {
      let trait: MonsterTrait = pt.forceTrait || 'NORMAL';

      if (!pt.forceTrait) {
        if (isPrismFrenzyWave && (idx === 2 || idx === 6) && Math.random() < 0.65) {
          trait = Math.random() < 0.45 ? 'PRISM_3X' : 'PRISM';
        } else if (waveNumber >= 3 && ((idx + waveNumber) % 5 === 0 || Math.random() < shieldChance * 0.4)) {
          trait = 'SHIELDED';
        }
      }

      let texKey = baseTexPool[(idx + waveNumber) % baseTexPool.length];
      if (trait === 'BOMB') texKey = 'monster_BOMB';
      else if (trait === 'HEALER') texKey = 'monster_HEALER';
      else if (trait === 'PRISM') texKey = 'monster_PRISM';
      else if (trait === 'PRISM_3X') texKey = 'monster_PRISM_3X';

      const hpMult = trait === 'SHIELDED' ? 1.2 : trait === 'HEALER' ? 1.1 : 0.9;
      const arch = MonstersConfig.CRYSTAL_GUARD;
      const isOneHit = trait === 'BOMB' || trait === 'PRISM' || trait === 'PRISM_3X';
      const hp = isOneHit ? 1 : Math.max(16, Math.round(arch.baseHp * scaleFactor * hpMult));

      results.push({
        data: {
          id: `bubble_${waveNumber}_${idx}_${Date.now()}`,
          x: pt.x,
          y: pt.y,
          width: 46,
          height: 46,
          hp,
          maxHp: hp,
          color:
            trait === 'BOMB'
              ? 0xff1744
              : trait === 'PRISM_3X'
                ? 0xff007f
                : trait === 'PRISM'
                  ? 0xffea00
                  : arch.color
        },
        archetype: arch,
        texKey,
        trait,
        shieldHp: trait === 'SHIELDED' ? Math.round(hp * (0.4 + Math.min(waveNumber * 0.02, 0.3))) : 0
      });
    });

    // 3. DYNAMIC MULTI-POSITION OBSTACLE WALLS
    const wallLayout = waveNumber % 4;
    let wallDefs: { x: number; y: number; w: number; h: number }[] = [];

    if (wallLayout === 1) {
      wallDefs = [
        { x: cx - 92, y: arenaTop + 150, w: 16, h: 78 },
        { x: cx + 92, y: arenaTop + 150, w: 16, h: 78 }
      ];
    } else if (wallLayout === 2) {
      wallDefs = [
        { x: cx, y: arenaTop + 115, w: 84, h: 16 },
        { x: 62, y: arenaTop + 260, w: 64, h: 16 },
        { x: arenaWidth - 62, y: arenaTop + 260, w: 64, h: 16 }
      ];
    } else if (wallLayout === 3) {
      wallDefs = [
        { x: cx, y: arenaTop + 162, w: 16, h: 82 },
        { x: cx - 105, y: arenaTop + 245, w: 62, h: 16 },
        { x: cx + 105, y: arenaTop + 95, w: 62, h: 16 }
      ];
    } else {
      wallDefs = [
        { x: cx - 78, y: arenaTop + 125, w: 68, h: 16 },
        { x: cx + 78, y: arenaTop + 225, w: 68, h: 16 }
      ];
    }

    wallDefs.forEach((wd, idx) => {
      results.push({
        data: {
          id: `wall_${waveNumber}_${idx}_${Date.now()}`,
          x: wd.x,
          y: wd.y,
          width: wd.w,
          height: wd.h,
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
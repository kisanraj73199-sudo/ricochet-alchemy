import Phaser from 'phaser';
import { ThemeConfig } from '../config/ThemeConfig';

export class BattleScene extends Phaser.Scene {
  constructor() {
    super('BattleScene');
  }

  create(): void {
    const { width, topAdBannerHeight, hudTopY, arenaTopY, arenaBottomY, forgeGridTopY } = ThemeConfig.screen;
    const { colors } = ThemeConfig;

    // 1. TOP SAFE BANNER AD DOCK (Moved from bottom to top per user requirement!)
    this.add.rectangle(width / 2, topAdBannerHeight / 2, width, topAdBannerHeight, 0x1e1814)
      .setStrokeStyle(2, colors.goldBorder);
    this.add.text(width / 2, topAdBannerHeight / 2, 'ADMOB TOP BANNER AD (SAFE ZONE)', {
      fontSize: '12px',
      color: '#ffd97d',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 2. TOP HUD BAR (Safely below Top Banner Ad)
    this.add.rectangle(width / 2, hudTopY + 20, width - 16, 40, colors.panelRoyalBlue, 1)
      .setStrokeStyle(2, colors.goldBorder);
    this.add.text(24, hudTopY + 11, 'SCORE: 35,992      WAVE: 14      HP: 100%', {
      fontSize: '14px',
      color: colors.textCream,
      fontStyle: 'bold'
    });

    // 3. WARM SANDSTONE RICOCHET ARENA (Middle-Top Section)
    const arenaHeight = arenaBottomY - arenaTopY;
    this.add.rectangle(width / 2, arenaTopY + arenaHeight / 2, width - 16, arenaHeight, colors.arenaSandstone)
      .setStrokeStyle(3, colors.goldBorder);
    this.add.text(width / 2, arenaTopY + arenaHeight / 2, 'WARM FANTASY RICOCHET ARENA\n(Phase 2 Prototype Ready)', {
      fontSize: '16px',
      color: colors.textDarkBrown,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 4. BOTTOM 4x3 ALCHEMICAL FORGE MERGE GRID (100% Free of Bottom Ads!)
    const gridHeight = 290;
    this.add.rectangle(width / 2, forgeGridTopY + gridHeight / 2, width - 16, gridHeight, colors.bgWarmStone)
      .setStrokeStyle(3, colors.goldBorder);
    this.add.text(width / 2, forgeGridTopY + gridHeight / 2, '4x3 RUNE MERGE FORGE GRID\n(Zero Bottom Ad Interference!)', {
      fontSize: '15px',
      color: colors.textCream,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5);
  }
}

/**
 * Phase 8: Screen 4 - Victory Loot Chest & Opt-in Double Rewards Ad Modal
 */
import Phaser from 'phaser';
import { ThemeConfig } from '../config/ThemeConfig';
import { SaveSystem } from '../core/SaveSystem';
import { ForgeGrid } from '../gameplay/ForgeGrid';
import { AdService } from '../core/AdService';
import { SoundSynth } from '../core/SoundSynth';

interface RewardModalData {
  waveCleared: number;
  baseCoinsEarned: number;
  score: number;
}

export class RewardModalScene extends Phaser.Scene {
  private modalData: RewardModalData = { waveCleared: 1, baseCoinsEarned: 50, score: 1000 };
  private claimed = false;

  constructor() {
    super('RewardModalScene');
  }

  init(data: RewardModalData): void {
    this.modalData = {
      waveCleared: data?.waveCleared || 1,
      baseCoinsEarned: data?.baseCoinsEarned || 50,
      score: data?.score || 0
    };
    this.claimed = false;
  }

  create(): void {
    const { width, height, topAdBannerHeight } = ThemeConfig.screen;
    const { colors } = ThemeConfig;

    // 1. Dark Translucent Backdrop
    this.add.rectangle(width / 2, height / 2, width, height, 0x120d0a, 0.88);

    // 2. Keep Top Banner Ad Safe Zone Visible
    this.add.rectangle(width / 2, topAdBannerHeight / 2, width, topAdBannerHeight, 0x1e1814)
      .setStrokeStyle(2, colors.goldBorder);
    this.add.text(width / 2, topAdBannerHeight / 2, 'ADMOB TOP BANNER AD (SAFE ZONE)', {
      fontSize: '12px',
      color: '#ffd97d',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 3. VICTORY HEADER
    this.add.text(width / 2, 135, 'VICTORY!', {
      fontSize: '34px',
      color: '#ffdf73',
      fontStyle: 'bold',
      stroke: '#332211',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(width / 2, 172, `WAVE ${this.modalData.waveCleared} CLEARED!`, {
      fontSize: '14px',
      color: colors.textCream,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 4. TREASURE CHEST VISUAL (Warm Royal & Gold Chest)
    const chestY = 275;
    this.add.circle(width / 2, chestY, 64, 0xffd54f, 0.22);
    this.add.rectangle(width / 2, chestY + 10, 120, 76, 0x6d4c41)
      .setStrokeStyle(4, colors.goldHighlight);
    this.add.rectangle(width / 2, chestY - 22, 126, 28, 0x8d6e63)
      .setStrokeStyle(3, colors.goldBorder);
    this.add.circle(width / 2, chestY - 5, 12, colors.goldHighlight)
      .setStrokeStyle(2, 0x332211);

    // Glowing Rune Gems inside Chest
    this.add.circle(width / 2 - 28, chestY - 12, 11, 0xff5722).setStrokeStyle(2, 0xffffff);
    this.add.circle(width / 2, chestY - 18, 13, 0x29b6f6).setStrokeStyle(2, 0xffffff);
    this.add.circle(width / 2 + 28, chestY - 12, 11, 0xab47bc).setStrokeStyle(2, 0xffffff);

    // 5. DOUBLE REWARDS CARD (Screen 4 Layout)
    const cardY = 485;
    this.add.rectangle(width / 2, cardY, width - 36, 230, colors.panelParchment)
      .setStrokeStyle(4, colors.goldBorder);

    this.add.text(width / 2, cardY - 82, 'DOUBLE REWARDS?', {
      fontSize: '20px',
      color: colors.textDarkBrown,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.rectangle(width / 2, cardY - 22, width - 76, 68, colors.panelRoyalBlue)
      .setStrokeStyle(2, colors.goldBorder);

    const bonusCoins = this.modalData.baseCoinsEarned * 2;
    this.add.text(width / 2, cardY - 22, `🪙 +${bonusCoins} COINS   +   🔮 TIER-II RUNE`, {
      fontSize: '15px',
      color: '#ffdf73',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // WATCH AD BUTTON (Primary High-eCPM Rewarded Video Trigger)
    const watchAdBtn = this.add.rectangle(width / 2 - 74, cardY + 58, 162, 46, colors.buttonUpgradeOrange)
      .setStrokeStyle(3, 0xffffff)
      .setInteractive({ useHandCursor: true });
    this.add.text(width / 2 - 74, cardY + 58, '▶ WATCH AD (2X)', {
      fontSize: '13px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    watchAdBtn.on('pointerdown', () => {
      if (this.claimed) return;
      this.claimed = true;

      AdService.getInstance().showRewardedAd(() => {
        const save = SaveSystem.load();
        save.coins += this.modalData.baseCoinsEarned; // Adds extra 1x on top of base 1x = 2x total!
        ForgeGrid.spawnRuneInEmptySlot(save.gridRunes, 2);
        SaveSystem.save(save);
        SoundSynth.playUpgradeFanfare();
        this.scene.start('BattleScene');
      });
    });

    // NO THANKS BUTTON (Standard 1x Reward, Ethical Non-Forced Option)
    const noThanksBtn = this.add.rectangle(width / 2 + 84, cardY + 58, 132, 46, 0x6d655f)
      .setStrokeStyle(2, 0xffffff)
      .setInteractive({ useHandCursor: true });
    this.add.text(width / 2 + 84, cardY + 58, 'NO THANKS', {
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    noThanksBtn.on('pointerdown', async () => {
      if (this.claimed) return;
      this.claimed = true;
      SoundSynth.playBounceChime(2);
      await AdService.getInstance().tryShowInterstitial();
      this.scene.start('BattleScene');
    });
  }
}
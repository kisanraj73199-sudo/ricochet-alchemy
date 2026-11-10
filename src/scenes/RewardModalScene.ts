/**
 * PRO-ULTRA Screen 4: Victory Loot Chest, Spinning Sunburst & Double Rewards Modal
 * Matches the Reference Showcase Screen 4 with 3D Treasure Chest & Parchment Card.
 */
import Phaser from 'phaser';
import { ThemeConfig } from '../config/ThemeConfig';
import { SaveSystem } from '../core/SaveSystem';
import { ForgeGrid } from '../gameplay/ForgeGrid';
import { AdService } from '../core/AdService';
import { SoundSynth } from '../core/SoundSynth';
import { ArtRenderer } from '../ui/ArtRenderer';

interface RewardModalData {
  waveCleared: number;
  baseCoinsEarned: number;
  score: number;
}

export class RewardModalScene extends Phaser.Scene {
  private modalData: RewardModalData = { waveCleared: 1, baseCoinsEarned: 60, score: 1200 };
  private claimed = false;

  constructor() {
    super('RewardModalScene');
  }

  init(data: RewardModalData): void {
    this.modalData = {
      waveCleared: data?.waveCleared || 1,
      baseCoinsEarned: data?.baseCoinsEarned || 60,
      score: data?.score || 0
    };
    this.claimed = false;
  }

  create(): void {
    ArtRenderer.generateAllGameTextures(this);
    const { width, height, topAdBannerHeight } = ThemeConfig.screen;
    const { colors } = ThemeConfig;

    // 1. Rich Arcane Sanctum Backdrop
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x160e26, 0x160e26, 0x2b1b17, 0x2b1b17, 1);
    bg.fillRect(0, 0, width, height);

    // 2. Top Safe Banner Ad Dock
    this.add.rectangle(width / 2, topAdBannerHeight / 2, width, topAdBannerHeight, 0x0d0917)
      .setStrokeStyle(1.5, colors.goldBorder);
    this.add.text(width / 2, topAdBannerHeight / 2, 'ADMOB TOP BANNER AD (SAFE ZONE)', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '10px',
      color: '#ffd54f',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 3. Ornate Golden Header Banner ("VICTORY! CELEBRATE THE WIN")
    ArtRenderer.drawOrnatePanel(this, 24, 74, width - 48, 74, 0x26466d, 0x15263d, 0xffd54f);
    this.add.text(width / 2, 100, 'VICTORY!', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '30px',
      color: '#ffea00',
      fontStyle: 'bold',
      stroke: '#2b1400',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(width / 2, 130, `STAGE ${this.modalData.waveCleared} CONQUERED • CELEBRATE THE WIN!`, {
      fontFamily: "'Chakra Petch', sans-serif",
      fontSize: '11.5px',
      color: '#fff7e6',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 4. Spinning Sunburst Rays + Overflowing 3D Treasure Chest + Side Stats!
    const chestY = 262;
    const sunburst = this.add.image(width / 2, chestY, 'victory_sunburst').setScale(1.1);
    this.tweens.add({
      targets: sunburst,
      angle: 360,
      duration: 14000,
      repeat: -1
    });

    // Left & Right Battle Stats Pillars (Just like Reference Pic Screen 4!)
    this.add.text(44, chestY - 28, `TIME\n0:${35 + (this.modalData.waveCleared % 20)}`, {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '11px',
      color: '#b2ebf2',
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(44, chestY + 28, `BONUS\n+${this.modalData.waveCleared * 15}`, {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '11px',
      color: '#ffd740',
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(width - 44, chestY - 28, `KILLS\n${12 + this.modalData.waveCleared * 3}`, {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '11px',
      color: '#b2ebf2',
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(width - 44, chestY + 28, `SCORE\n${this.modalData.score}`, {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '11px',
      color: '#69f0ae',
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const chestSprite = this.add.image(width / 2, chestY, 'victory_chest_ultra').setScale(0.95);
    this.tweens.add({
      targets: chestSprite,
      y: chestY - 6,
      scaleX: 0.98,
      scaleY: 0.98,
      duration: 900,
      yoyo: true,
      repeat: -1
    });

    // Floating Sparkles around Chest
    for (let i = 0; i < 6; i++) {
      const spX = width / 2 + (i - 2.5) * 34;
      const spY = chestY - 35 + (i % 2) * 25;
      const spark = this.add.image(spX, spY, 'glow_spark').setScale(1.1);
      this.tweens.add({
        targets: spark,
        y: spY - 16,
        alpha: 0.25,
        duration: 700 + i * 140,
        yoyo: true,
        repeat: -1
      });
    }

    // 5. Ornate Parchment & Royal Blue "DOUBLE REWARDS?" Card
    const cardTopY = 368;
    const cardH = 265;
    ArtRenderer.drawOrnatePanel(this, 18, cardTopY, width - 36, cardH, 0xf5e1c0, 0xd7b384, 0xffb300);

    this.add.text(width / 2, cardTopY + 32, 'DOUBLE REWARDS?', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '20px',
      color: '#331e0e',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Royal Blue Inner Prize Box (Shows 3D Elemental Bubble + 2x Gold!)
    ArtRenderer.drawOrnatePanel(this, 36, cardTopY + 58, width - 72, 92, 0x26466d, 0x162942, 0xffd54f);

    const prizeOrb = this.add.image(width / 2 - 68, cardTopY + 104, 'orb_LIGHTNING_2').setScale(0.92);
    this.tweens.add({
      targets: prizeOrb,
      angle: 12,
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    this.add.text(width / 2 - 18, cardTopY + 104, '+', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const bonusCoins = this.modalData.baseCoinsEarned * 2;
    this.add.image(width / 2 + 24, cardTopY + 94, 'icon_coin').setScale(1.3);
    this.add.text(width / 2 + 64, cardTopY + 94, `x${bonusCoins}`, {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '19px',
      color: '#ffea00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.add.text(width / 2 + 48, cardTopY + 122, 'TIER-II RUNE + 2X GOLD', {
      fontFamily: "'Chakra Petch', sans-serif",
      fontSize: '10px',
      color: '#fff7e6',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 6. Tactile 3D Action Buttons ("WATCH AD 2X" & "NO THANKS")
    ArtRenderer.createTactileButton(
      this,
      width / 2 - 74,
      cardTopY + 196,
      'btn_ORANGE_md',
      '▶ WATCH AD (2X)',
      '12px',
      () => {
        if (this.claimed) return;
        this.claimed = true;

        AdService.getInstance().showRewardedAd(() => {
          const save = SaveSystem.load();
          save.coins += this.modalData.baseCoinsEarned;
          ForgeGrid.spawnRuneInEmptySlot(save.gridRunes, 2);
          SaveSystem.save(save);
          SoundSynth.playUpgradeFanfare();
          this.scene.start('BattleScene');
        });
      }
    );

    ArtRenderer.createTactileButton(
      this,
      width / 2 + 86,
      cardTopY + 196,
      'btn_GRAY_sm',
      'NO THANKS',
      '11px',
      async () => {
        if (this.claimed) return;
        this.claimed = true;
        SoundSynth.playBounceChime(2);
        await AdService.getInstance().tryShowInterstitial();
        this.scene.start('BattleScene');
      }
    );

    // Bottom Decorative Loot Preview Strip
    ArtRenderer.drawOrnatePanel(this, 24, 655, width - 48, 155, 0x261a38, 0x130c1e, 0xffd54f);
    this.add.text(width / 2, 680, '✨ NEXT STAGE ALCHEMICAL BOUNTY ✨', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '11px',
      color: '#ffd54f',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const previewOrbs = ['orb_FIRE_3', 'orb_ICE_3', 'orb_LIGHTNING_3', 'orb_NATURE_3'];
    previewOrbs.forEach((key, idx) => {
      const ox = 82 + idx * 76;
      this.add.image(ox, 742, key).setScale(0.88);
    });
  }
}
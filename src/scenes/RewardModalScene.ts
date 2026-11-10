/**
 * INTERACTIVE TAP-TO-OPEN VICTORY CHEST & MOVING 2X/3X JACKPOT SLIDER DASHBOARD
 */
import Phaser from 'phaser';
import { ThemeConfig } from '../config/ThemeConfig';
import { SaveSystem } from '../core/SaveSystem';
import { ForgeGrid } from '../gameplay/ForgeGrid';
import { AdService } from '../core/AdService';
import { SoundSynth } from '../core/SoundSynth';
import { ArtRenderer } from '../ui/ArtRenderer';
import { WaveSpawner } from '../gameplay/WaveSpawner';

interface RewardModalData {
  waveCleared: number;
  baseCoinsEarned: number;
  timeBonusGold?: number;
  starsEarned?: number;
  clearSeconds?: number;
  maxCombo?: number;
  score: number;
}

export class RewardModalScene extends Phaser.Scene {
  private modalData: RewardModalData = {
    waveCleared: 1,
    baseCoinsEarned: 80,
    timeBonusGold: 50,
    starsEarned: 3,
    clearSeconds: 26,
    maxCombo: 18,
    score: 1500
  };
  private isChestOpened = false;
  private claimed = false;

  private sliderCursor!: Phaser.GameObjects.Arc;
  private sliderPhase = 0;
  private currentAdMultiplier = 2;
  private adBtnLabelText?: Phaser.GameObjects.Text;
  private topCoinCounterText!: Phaser.GameObjects.Text;

  constructor() {
    super('RewardModalScene');
  }

  init(data: RewardModalData): void {
    this.modalData = {
      waveCleared: data?.waveCleared || 1,
      baseCoinsEarned: data?.baseCoinsEarned || 80,
      timeBonusGold: data?.timeBonusGold ?? 50,
      starsEarned: data?.starsEarned ?? 3,
      clearSeconds: data?.clearSeconds ?? 26,
      maxCombo: data?.maxCombo ?? 14,
      score: data?.score || 0
    };
    this.isChestOpened = false;
    this.claimed = false;
    this.sliderPhase = 0;
  }

  create(): void {
    ArtRenderer.generateAllGameTextures(this);
    const { width, height, topAdBannerHeight } = ThemeConfig.screen;
    const save = SaveSystem.load();
    const meta = WaveSpawner.getWaveMetadata(this.modalData.waveCleared);

    // 1. Dynamic Biome Backdrop matching the conquered stage!
    ArtRenderer.drawDynamicBiomeWorld(this, width, height, meta.palette);

    // 2. Top Safe Banner Ad Strip + Live Coin Counter
    this.add.rectangle(width / 2, topAdBannerHeight / 2, width, topAdBannerHeight, 0x04020a, 0.92);
    this.add.text(width / 2, topAdBannerHeight / 2, 'ADMOB TOP BANNER AD (SAFE ZONE)', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '9.5px',
      color: '#00f5ff'
    }).setOrigin(0.5);

    this.add.rectangle(72, 78, 118, 30, 0x0e0722, 0.88).setStrokeStyle(1.5, 0xffca28);
    this.add.image(28, 78, 'icon_coin').setScale(1.0);
    this.topCoinCounterText = this.add.text(46, 78, `${save.coins}`, {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '13px',
      color: '#ffea00',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    // 3. Stage Conquered Title + ⭐⭐⭐ Animated Stars
    this.add.text(width / 2, 118, `STAGE ${this.modalData.waveCleared} CONQUERED!`, {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '22px',
      color: '#00f5a0',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    const earned = this.modalData.starsEarned || 3;
    for (let i = 0; i < 3; i++) {
      const sx = width / 2 + (i - 1) * 56;
      const sy = 162 - (i === 1 ? 8 : 0);
      const isLit = i < earned;

      const starTxt = this.add.text(sx, sy, isLit ? '⭐' : '☆', {
        fontSize: i === 1 ? '38px' : '30px',
        color: isLit ? '#ffea00' : '#4a3570',
        stroke: '#000000',
        strokeThickness: 5
      }).setOrigin(0.5).setScale(0);

      this.tweens.add({
        targets: starTxt,
        scaleX: 1,
        scaleY: 1,
        delay: i * 160,
        duration: 320,
        ease: 'Back.easeOut'
      });
    }

    // 4. Interactive Shaking Closed Royal Chest (TAP TO UNLOCK!)
    const chestY = 295;
    const sunburst = this.add.image(width / 2, chestY, 'victory_sunburst').setScale(1.38).setAlpha(0.65);
    this.tweens.add({
      targets: sunburst,
      angle: 360,
      duration: 11000,
      repeat: -1
    });

    const chestSprite = this.add.image(width / 2, chestY, 'victory_chest_closed')
      .setScale(1.0)
      .setInteractive({ useHandCursor: true });

    const tapPrompt = this.add.text(width / 2, chestY + 86, '👆 TAP CHEST TO UNLOCK LOOT! 👆', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '12px',
      color: '#ffea00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    const shakeTween = this.tweens.add({
      targets: chestSprite,
      angle: { from: -4, to: 4 },
      scaleX: 1.05,
      scaleY: 0.96,
      duration: 180,
      yoyo: true,
      repeat: -1
    });

    const openChestHandler = () => {
      if (this.isChestOpened) return;
      this.isChestOpened = true;
      shakeTween.stop();
      tapPrompt.destroy();

      SoundSynth.playUpgradeFanfare();
      this.cameras.main.shake(220, 0.012);
      chestSprite.setTexture('victory_chest_ultra');
      chestSprite.setAngle(0);
      sunburst.setAlpha(1.0);

      // Flying Gold Coins Fountain into the Top Coin Counter!
      for (let c = 0; c < 12; c++) {
        const coin = this.add.image(width / 2, chestY - 10, 'icon_coin').setScale(1.1);
        const midX = width / 2 + (Math.random() - 0.5) * 160;
        const midY = chestY - 40 - Math.random() * 80;

        this.tweens.add({
          targets: coin,
          x: midX,
          y: midY,
          duration: 260 + c * 25,
          ease: 'Cubic.easeOut',
          onComplete: () => {
            this.tweens.add({
              targets: coin,
              x: 28,
              y: 78,
              scaleX: 0.5,
              scaleY: 0.5,
              duration: 380,
              onComplete: () => {
                SoundSynth.playBounceChime(4);
                coin.destroy();
              }
            });
          }
        });
      }

      this.revealPostOpenDashboard(width);
    };

    chestSprite.on('pointerdown', openChestHandler);
    // Auto-open after 1.6s if player doesn't tap immediately
    this.time.delayedCall(1600, openChestHandler);
  }

  private revealPostOpenDashboard(width: number): void {
    // 1. Sleek Glass Battle Stats Pill Row
    const statsY = 412;
    ArtRenderer.drawOrnatePanel(this, 18, statsY - 26, width - 36, 52, 0x160a33, 0x070314, 0x00f5ff);

    this.add.text(72, statsY, `⏱️ TIME: ${this.modalData.clearSeconds}s`, {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '10px',
      color: '#00f5ff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(width / 2, statsY, `🔥 MAX COMBO: ${this.modalData.maxCombo}x`, {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '10px',
      color: '#ffea00',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(width - 72, statsY, `💰 +${this.modalData.baseCoinsEarned}G`, {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '10px',
      color: '#00f5a0',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 2. Interactive Moving 2X / 3X Jackpot Multiplier Slider Bar!
    const sliderY = 492;
    this.add.text(width / 2, sliderY - 26, '🎰 TIMING JACKPOT METER (STOP ON 3X!) 🎰', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '10.5px',
      color: '#ffea00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Outer 2X zones + Center Golden 3X Bullseye Zone
    this.add.rectangle(width / 2, sliderY, 240, 18, 0x0055ff).setStrokeStyle(2, 0xffffff);
    this.add.rectangle(width / 2, sliderY, 76, 18, 0x00f5a0);

    this.add.text(width / 2 - 82, sliderY, '2X', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '10px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(width / 2, sliderY, '★ 3X ★', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '11px',
      color: '#05020d',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(width / 2 + 82, sliderY, '2X', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '10px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.sliderCursor = this.add.circle(width / 2, sliderY, 12, 0xffea00).setStrokeStyle(3, 0xffffff);

    // 3. Watch Ad Button (Awards 2X or 3X based on live slider position!)
    const adBtnContainer = ArtRenderer.createTactileButton(
      this,
      width / 2,
      565,
      'btn_ORANGE_lg',
      '▶ CLAIM 3X JACKPOT (AD)',
      '11.5px',
      () => {
        if (this.claimed) return;
        this.claimed = true;
        const mult = this.currentAdMultiplier;

        AdService.getInstance().showRewardedAd(() => {
          const save = SaveSystem.load();
          const extraGold = this.modalData.baseCoinsEarned * (mult - 1);
          save.coins += extraGold;
          ForgeGrid.spawnRuneInEmptySlot(save.gridRunes, 2);
          SaveSystem.save(save);
          this.topCoinCounterText.setText(`${save.coins}`);
          SoundSynth.playUpgradeFanfare();
          this.scene.start('BattleScene', { selectedStage: this.modalData.waveCleared + 1 });
        });
      }
    );
    this.adBtnLabelText = adBtnContainer.list[1] as Phaser.GameObjects.Text;

    // 4. Next Stage & Saga Map Buttons
    ArtRenderer.createTactileButton(
      this,
      width / 2 - 76,
      635,
      'btn_GREEN_md',
      '▶ NEXT STAGE',
      '11px',
      async () => {
        if (this.claimed) return;
        this.claimed = true;
        SoundSynth.playBounceChime(2);
        await AdService.getInstance().tryShowInterstitial();
        this.scene.start('BattleScene', { selectedStage: this.modalData.waveCleared + 1 });
      }
    );

    ArtRenderer.createTactileButton(
      this,
      width / 2 + 86,
      635,
      'btn_GRAY_sm',
      '🗺️ SAGA MAP',
      '10.5px',
      () => {
        if (this.claimed) return;
        this.claimed = true;
        this.scene.start('MenuScene');
      }
    );
  }

  update(_time: number, delta: number): void {
    if (!this.isChestOpened || this.claimed || !this.sliderCursor) return;

    this.sliderPhase += (delta / 1000) * 3.4;
    const offset = Math.sin(this.sliderPhase) * 110;
    this.sliderCursor.x = ThemeConfig.screen.width / 2 + offset;

    this.currentAdMultiplier = Math.abs(offset) <= 38 ? 3 : 2;
    if (this.adBtnLabelText) {
      const totalGold = this.modalData.baseCoinsEarned * this.currentAdMultiplier;
      this.adBtnLabelText.setText(`▶ AD: ${this.currentAdMultiplier}X JACKPOT (+${totalGold}G)`);
    }
  }
}
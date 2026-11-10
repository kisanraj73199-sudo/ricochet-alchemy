/**
 * 3-STAR ANIMATED VICTORY & SPEED-BONUS JACKPOT SCREEN
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
  timeBonusGold?: number;
  starsEarned?: number;
  clearSeconds?: number;
  score: number;
}

export class RewardModalScene extends Phaser.Scene {
  private modalData: RewardModalData = {
    waveCleared: 1,
    baseCoinsEarned: 60,
    timeBonusGold: 50,
    starsEarned: 3,
    clearSeconds: 28,
    score: 1200
  };
  private claimed = false;

  constructor() {
    super('RewardModalScene');
  }

  init(data: RewardModalData): void {
    this.modalData = {
      waveCleared: data?.waveCleared || 1,
      baseCoinsEarned: data?.baseCoinsEarned || 60,
      timeBonusGold: data?.timeBonusGold ?? 50,
      starsEarned: data?.starsEarned ?? 3,
      clearSeconds: data?.clearSeconds ?? 28,
      score: data?.score || 0
    };
    this.claimed = false;
  }

  create(): void {
    ArtRenderer.generateAllGameTextures(this);
    const { width, height, topAdBannerHeight } = ThemeConfig.screen;

    this.add.image(width / 2, height / 2, 'world_bg_seamless');

    this.add.rectangle(width / 2, topAdBannerHeight / 2, width, topAdBannerHeight, 0x04020a, 0.9);
    this.add.text(width / 2, topAdBannerHeight / 2, 'ADMOB TOP BANNER AD (SAFE ZONE)', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '9.5px',
      color: '#00f5ff'
    }).setOrigin(0.5);

    this.add.text(width / 2, 95, `STAGE ${this.modalData.waveCleared} CLEARED!`, {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '24px',
      color: '#00f5a0',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    // ⭐⭐⭐ Animated 3-Star Rating Display!
    const earned = this.modalData.starsEarned || 3;
    for (let i = 0; i < 3; i++) {
      const sx = width / 2 + (i - 1) * 58;
      const sy = 145 - (i === 1 ? 10 : 0);
      const isLit = i < earned;

      const starTxt = this.add.text(sx, sy, isLit ? '⭐' : '☆', {
        fontSize: i === 1 ? '40px' : '32px',
        color: isLit ? '#ffea00' : '#4a3570',
        stroke: '#000000',
        strokeThickness: 5
      }).setOrigin(0.5).setScale(0);

      this.tweens.add({
        targets: starTxt,
        scaleX: 1,
        scaleY: 1,
        delay: i * 180,
        duration: 340,
        ease: 'Back.easeOut'
      });
    }

    // Speed Bonus Time Banner
    const bonusStr = (this.modalData.timeBonusGold || 0) > 0
      ? `⏱️ CLEARED IN ${this.modalData.clearSeconds}s • SPEED BONUS +${this.modalData.timeBonusGold}G!`
      : `⏱️ CLEARED IN ${this.modalData.clearSeconds}s`;

    this.add.text(width / 2, 192, bonusStr, {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '10.5px',
      color: '#ffea00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Spinning Sunburst + Floating Treasure Chest
    const chestY = 315;
    const sunburst = this.add.image(width / 2, chestY, 'victory_sunburst').setScale(1.4);
    this.tweens.add({
      targets: sunburst,
      angle: 360,
      duration: 12000,
      repeat: -1
    });

    const chestSprite = this.add.image(width / 2, chestY, 'victory_chest_ultra').setScale(1.0);
    this.tweens.add({
      targets: chestSprite,
      y: chestY - 8,
      duration: 850,
      yoyo: true,
      repeat: -1
    });

    // Floating Reward Medallions
    const rewardY = 490;
    this.add.text(width / 2, rewardY - 54, '⚡ CLAIM 2X JACKPOT BOUNTY ⚡', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '15px',
      color: '#00f5ff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.add.image(width / 2 - 58, rewardY, 'medallion_MAGENTA').setScale(1.1);
    this.add.image(width / 2 - 58, rewardY, 'orb_LIGHTNING_3').setScale(0.9);

    this.add.text(width / 2, rewardY, '+', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '26px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const bonusCoins = this.modalData.baseCoinsEarned * 2;
    this.add.image(width / 2 + 58, rewardY, 'medallion_GOLD').setScale(1.1);
    this.add.text(width / 2 + 58, rewardY, `+${bonusCoins}\nGOLD`, {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '11px',
      color: '#ffffff',
      align: 'center',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    ArtRenderer.createTactileButton(
      this,
      width / 2,
      605,
      'btn_ORANGE_lg',
      '▶ WATCH AD (2X LOOT)',
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
          this.scene.start('BattleScene', { selectedStage: this.modalData.waveCleared + 1 });
        });
      }
    );

    ArtRenderer.createTactileButton(
      this,
      width / 2 - 76,
      670,
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
      670,
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
}
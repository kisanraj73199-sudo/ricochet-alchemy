/**
 * CANDY-CRUSH ILLUSTRATED SCENERY SAGA MAP, 3D ARCHWAY WORLD GATES & LUCKY SPIN WHEEL
 */
import Phaser from 'phaser';
import { ThemeConfig } from '../config/ThemeConfig';
import { SaveSystem, PlayerSaveData } from '../core/SaveSystem';
import { SoundSynth } from '../core/SoundSynth';
import { AdService } from '../core/AdService';
import { ArtRenderer } from '../ui/ArtRenderer';
import { WaveSpawner } from '../gameplay/WaveSpawner';
import { ForgeGrid } from '../gameplay/ForgeGrid';

interface SkillNodeConfig {
  key: string;
  title: string;
  desc: string;
  texKey: string;
  medallionKey: string;
  x: number;
  y: number;
  baseCost: number;
}

export class MenuScene extends Phaser.Scene {
  private saveData!: PlayerSaveData;
  private coinsText!: Phaser.GameObjects.Text;
  private totalStarsBadgeText!: Phaser.GameObjects.Text;
  private starChestText!: Phaser.GameObjects.Text;
  private starChestFill!: Phaser.GameObjects.Rectangle;

  private mapContainer!: Phaser.GameObjects.Container;
  private parallaxCloudContainer!: Phaser.GameObjects.Container;
  private techModalContainer!: Phaser.GameObjects.Container;
  private spinWheelModalContainer!: Phaser.GameObjects.Container;
  private isTechModalOpen = false;
  private isSpinWheelOpen = false;
  private isWheelSpinning = false;

  private isDraggingMap = false;
  private dragStartY = 0;
  private mapStartY = 0;
  private minMapY = -2000;
  private maxMapY = 0;
  private totalDragDistance = 0;

  private readonly skills: SkillNodeConfig[] = [
    {
      key: 'volatileMix',
      title: 'PLASMA OVERLOAD',
      desc: '+15% All Orb Damage',
      texKey: 'orb_FIRE_4',
      medallionKey: 'medallion_GOLD',
      x: 195,
      y: 280,
      baseCost: 80
    },
    {
      key: 'empoweredCore',
      title: 'ARCANE SYNERGY',
      desc: '+20% Combo Multiplier',
      texKey: 'orb_LIGHTNING_4',
      medallionKey: 'medallion_MAGENTA',
      x: 98,
      y: 465,
      baseCost: 100
    },
    {
      key: 'alchemistGreed',
      title: 'CRYSTAL HARVEST',
      desc: '+25% Gold Bounty',
      texKey: 'orb_NATURE_4',
      medallionKey: 'medallion_GREEN',
      x: 292,
      y: 465,
      baseCost: 90
    }
  ];

  constructor() {
    super('MenuScene');
  }

  create(): void {
    ArtRenderer.generateAllGameTextures(this);
    this.saveData = SaveSystem.load();
    this.isTechModalOpen = false;
    this.isSpinWheelOpen = false;
    this.isWheelSpinning = false;

    const { width, height, topAdBannerHeight } = ThemeConfig.screen;
    const currentMeta = WaveSpawner.getWaveMetadata(this.saveData.highestWave);

    // 1. Base Sky Backdrop
    ArtRenderer.drawDynamicBiomeWorld(this, width, height, currentMeta.palette);

    // 2. Scrollable Candy-Crush Illustrated Scenery Map + Parallax Cloud Layer!
    this.mapContainer = this.add.container(0, 0);
    this.parallaxCloudContainer = this.add.container(0, 0);
    this.buildScrollableSagaMap(width, height);
    this.setupMapScrollInput();

    // 3. Top Safe Banner Ad Dock
    this.add.rectangle(width / 2, topAdBannerHeight / 2, width, topAdBannerHeight, 0x04020a, 0.95)
      .setDepth(20);
    this.add.text(width / 2, topAdBannerHeight / 2, 'ADMOB TOP BANNER AD (SAFE ZONE)', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '9.5px',
      color: '#00f5ff'
    }).setOrigin(0.5).setDepth(21);

    // 4. 3D Luxury Scoreboard Crest + Floating Lucky Spin Wheel Icon!
    this.createLuxuryMainScoreboard(width);

    // 5. Centered Hero Start/Play Portal + Symmetric Side Icons
    this.createCenteredHeroBottomDeck(width, height);

    // 6. Collapsible Tech Tree & Daily Lucky Spin Wheel Modals
    this.techModalContainer = this.add.container(0, 0).setDepth(40).setVisible(false);
    this.spinWheelModalContainer = this.add.container(0, 0).setDepth(45).setVisible(false);
    this.renderTechModal();
    this.renderLuckySpinWheelModal();

    if (this.saveData.userAgeDeclared === null) {
      this.showNeutralAgeGateModal();
    } else {
      AdService.getInstance().configureAgeCompliance(this.saveData.userAgeDeclared);
      AdService.getInstance().initializeAdMob();
    }
  }

  private buildScrollableSagaMap(width: number, height: number): void {
    this.mapContainer.removeAll(true);
    this.parallaxCloudContainer.removeAll(true);

    const highest = this.saveData.highestWave || 1;
    const totalVisibleNodes = Math.max(30, highest + 14);
    const nodeSpacingY = 112;
    const bottomBaseY = height - 210;

    const topNodeY = bottomBaseY - (totalVisibleNodes - 1) * nodeSpacingY;
    this.minMapY = 0;
    this.maxMapY = Math.max(0, 260 - topNodeY);

    const getNodeX = (stage: number): number => width / 2 + Math.sin((stage - 1) * 0.75) * 104;
    const getNodeY = (stage: number): number => bottomBaseY - (stage - 1) * nodeSpacingY;

    // 1. Draw Distinct 10-Stage Biome Terrain Zones & Side Scenery Props (Candy-Crush World Feel!)
    const sceneryGraphics = this.add.graphics();
    this.mapContainer.add(sceneryGraphics);

    const propKeys = ['prop_crystal', 'prop_volcano', 'prop_biotree', 'prop_crystal', 'prop_volcano', 'prop_icepeak'];

    for (let chapterStart = 1; chapterStart <= totalVisibleNodes; chapterStart += 10) {
      const meta = WaveSpawner.getWaveMetadata(chapterStart);
      const zoneBottomY = getNodeY(chapterStart) + 65;
      const zoneTopY = getNodeY(chapterStart + 9) - 55;
      const zoneH = zoneBottomY - zoneTopY;

      // Painted Terrain Backdrop for this 10-Stage World
      sceneryGraphics.fillGradientStyle(
        meta.palette.topBg,
        meta.palette.topBg,
        meta.palette.bottomBg,
        meta.palette.bottomBg,
        0.78
      );
      sceneryGraphics.fillRect(0, zoneTopY, width, zoneH);

      // Glowing Biome River / Lava Stream / Ice fissure border along edges
      sceneryGraphics.lineStyle(3, meta.palette.railColor, 0.35);
      sceneryGraphics.lineBetween(12, zoneTopY, 12, zoneBottomY);
      sceneryGraphics.lineBetween(width - 12, zoneTopY, width - 12, zoneBottomY);
    }

    // Place 3D Scenery Props (Crystals, Volcanoes, Bio-Trees, Ice Peaks) along the left & right banks!
    for (let s = 1; s <= totalVisibleNodes; s += 2) {
      const meta = WaveSpawner.getWaveMetadata(s);
      const propKey = propKeys[meta.palette.chapterIndex % propKeys.length];
      const ny = getNodeY(s);
      const nx = getNodeX(s);
      // Place prop on the opposite side of the road curve so it never blocks nodes
      const propX = nx > width / 2 ? 38 : width - 38;
      const propSprite = this.add.image(propX, ny - 10, propKey)
        .setScale(0.82)
        .setFlipX(propX > width / 2);
      this.mapContainer.add(propSprite);

      // Add parallax drifting cloud every 4 stages
      if (s % 4 === 1) {
        const cloud = this.add.image(s % 8 === 1 ? 85 : width - 85, ny * 0.65, 'prop_cloud').setScale(1.1);
        this.parallaxCloudContainer.add(cloud);
      }
    }

    // 2. Triple-Layer Winding Saga Ribbon Path
    const pathGraphics = this.add.graphics();
    this.mapContainer.add(pathGraphics);

    for (let s = 1; s < totalVisibleNodes; s++) {
      const x1 = getNodeX(s);
      const y1 = getNodeY(s);
      const x2 = getNodeX(s + 1);
      const y2 = getNodeY(s + 1);
      const isUnlockedPath = s < highest;

      pathGraphics.lineStyle(18, isUnlockedPath ? 0x00f5ff : 0x1a0e36, isUnlockedPath ? 0.24 : 0.45);
      pathGraphics.lineBetween(x1, y1, x2, y2);

      pathGraphics.lineStyle(8, isUnlockedPath ? 0x0077ff : 0x2b194d, isUnlockedPath ? 0.58 : 0.6);
      pathGraphics.lineBetween(x1, y1, x2, y2);

      const steps = 6;
      for (let k = 1; k < steps; k++) {
        const t = k / steps;
        const sx = Phaser.Math.Linear(x1, x2, t);
        const sy = Phaser.Math.Linear(y1, y2, t);
        pathGraphics.fillStyle(isUnlockedPath ? 0xffea00 : 0x513b78, isUnlockedPath ? 0.95 : 0.45);
        pathGraphics.fillCircle(sx, sy, isUnlockedPath ? 3.8 : 2.5);
      }
    }

    // 3. Render Stage Nodes + 3D Royal Archway Ribbon Banners at Every 10th Stage!
    const starsMap = this.saveData.stageStars;

    for (let stage = 1; stage <= totalVisibleNodes; stage++) {
      const nx = getNodeX(stage);
      const ny = getNodeY(stage);
      const isBoss = WaveSpawner.isBossWave(stage);
      const isCleared = stage < highest || Boolean(starsMap[stage]);
      const isCurrent = stage === highest;
      const isLocked = stage > highest;

      // 3D Royal Archway & Curved Hanging Ribbon Banner at the start of every 10-Stage World!
      if ((stage - 1) % 10 === 0) {
        const meta = WaveSpawner.getWaveMetadata(stage);
        const chapterNum = Math.floor((stage - 1) / 10) + 1;
        const gateY = ny + 64;

        const archRibbon = this.add.image(width / 2, gateY, 'world_gate_ribbon').setScale(0.98);
        const gateTitle = this.add.text(width / 2, gateY - 9, `👑 WORLD ${chapterNum}: ${meta.biomeName} 👑`, {
          fontFamily: "'Orbitron', sans-serif",
          fontSize: '9px',
          color: '#ffea00',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 3.5
        }).setOrigin(0.5);

        const gateSub = this.add.text(width / 2, gateY + 5, `STAGES ${stage} – ${stage + 9} • ${meta.difficultyLabel}`, {
          fontFamily: "'Chakra Petch', sans-serif",
          fontSize: '8.5px',
          color: '#00f5ff',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 3
        }).setOrigin(0.5);

        this.mapContainer.add([archRibbon, gateTitle, gateSub]);
      }

      let medKey = 'medallion_CYAN';
      if (isBoss) medKey = 'medallion_MAGENTA';
      else if (isCurrent) medKey = 'medallion_GOLD';
      else if (isCleared) medKey = 'medallion_GREEN';

      const nodeScale = isBoss ? 1.0 : isCurrent ? 0.92 : 0.76;
      const nodeSprite = this.add.image(nx, ny, medKey).setScale(nodeScale);

      if (isLocked) {
        nodeSprite.setTint(0x3a2a54).setAlpha(0.72);
      } else {
        nodeSprite.setInteractive({ useHandCursor: true });
        nodeSprite.on('pointerup', () => {
          if (this.totalDragDistance < 12 && !this.isTechModalOpen && !this.isSpinWheelOpen) {
            SoundSynth.playUpgradeFanfare();
            this.saveData.selectedStage = stage;
            SaveSystem.save(this.saveData);
            this.scene.start('BattleScene', { selectedStage: stage });
          }
        });
      }

      if (isCurrent) {
        const pulseRing = this.add.circle(nx, ny, 35, 0xffea00, 0.22).setStrokeStyle(2.5, 0xffea00);
        this.tweens.add({
          targets: pulseRing,
          scaleX: 1.32,
          scaleY: 1.32,
          alpha: 0,
          duration: 1000,
          repeat: -1
        });

        const avatarToken = this.add.image(nx, ny - 46, 'cannon_turret')
          .setScale(0.48)
          .setRotation(-Math.PI / 2);

        this.tweens.add({
          targets: avatarToken,
          y: ny - 54,
          duration: 650,
          yoyo: true,
          repeat: -1
        });
        this.mapContainer.add([pulseRing, avatarToken]);
      }

      const labelStr = isBoss ? `👑\n${stage}` : isLocked ? `🔒\n${stage}` : `${stage}`;
      const numTxt = this.add.text(nx, ny, labelStr, {
        fontFamily: "'Orbitron', sans-serif",
        fontSize: isBoss ? '11.5px' : '14px',
        color: isLocked ? '#b0bec5' : isCurrent ? '#fffde7' : '#ffffff',
        align: 'center',
        fontStyle: 'bold',
        stroke: '#060312',
        strokeThickness: 4.5,
        shadow: { offsetX: 0, offsetY: 2, color: '#000000', blur: 3, fill: true }
      }).setOrigin(0.5);

      this.mapContainer.add([nodeSprite, numTxt]);

      if (isCleared) {
        const earnedStars = starsMap[stage] || 2;
        const starStr = '⭐'.repeat(earnedStars) + '☆'.repeat(Math.max(0, 3 - earnedStars));
        const starsPill = this.add.image(nx, ny + 33, 'hp_pill_badge').setScale(0.95);
        const starsTxt = this.add.text(nx, ny + 33, starStr, {
          fontSize: '11px',
          color: '#ffea00',
          stroke: '#000000',
          strokeThickness: 3
        }).setOrigin(0.5);
        this.mapContainer.add([starsPill, starsTxt]);
      }
    }

    const currentStageY = getNodeY(highest);
    const desiredOffset = height * 0.54 - currentStageY;
    this.mapContainer.y = Phaser.Math.Clamp(desiredOffset, this.minMapY, this.maxMapY);
    this.parallaxCloudContainer.y = this.mapContainer.y * 0.65;
  }

  private setupMapScrollInput(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isTechModalOpen || this.isSpinWheelOpen) return;
      if (pointer.y > 115 && pointer.y < ThemeConfig.screen.height - 165) {
        this.isDraggingMap = true;
        this.dragStartY = pointer.y;
        this.mapStartY = this.mapContainer.y;
        this.totalDragDistance = 0;
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDraggingMap || this.isTechModalOpen || this.isSpinWheelOpen) return;
      const dy = pointer.y - this.dragStartY;
      this.totalDragDistance = Math.max(this.totalDragDistance, Math.abs(dy));
      this.mapContainer.y = Phaser.Math.Clamp(this.mapStartY + dy, this.minMapY, this.maxMapY);
      this.parallaxCloudContainer.y = this.mapContainer.y * 0.65;
    });

    this.input.on('pointerup', () => {
      this.isDraggingMap = false;
    });

    this.input.on('wheel', (_pointer: unknown, _gameObjects: unknown, _deltaX: number, deltaY: number) => {
      if (this.isTechModalOpen || this.isSpinWheelOpen) return;
      this.mapContainer.y = Phaser.Math.Clamp(this.mapContainer.y - deltaY * 0.6, this.minMapY, this.maxMapY);
      this.parallaxCloudContainer.y = this.mapContainer.y * 0.65;
    });
  }

  private createLuxuryMainScoreboard(width: number): void {
    this.add.image(width / 2, 86, 'scoreboard_crest').setDepth(20);

    this.add.image(28, 82, 'icon_coin').setScale(1.05).setDepth(21);
    this.coinsText = this.add.text(45, 82, '', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '13px',
      color: '#ffea00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
      shadow: { offsetX: 0, offsetY: 2, color: '#ff6d00', blur: 3, fill: true }
    }).setOrigin(0, 0.5).setDepth(21);

    this.totalStarsBadgeText = this.add.text(width / 2, 70, '', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '11.5px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
      shadow: { offsetX: 0, offsetY: 2, color: '#00f5ff', blur: 4, fill: true }
    }).setOrigin(0.5).setDepth(21);

    const barX = width / 2;
    const barY = 90;
    const barW = 148;
    const chestBg = this.add.rectangle(barX, barY, barW, 8, 0x05020d)
      .setStrokeStyle(1.2, 0xffca28)
      .setDepth(21)
      .setInteractive({ useHandCursor: true });

    this.starChestFill = this.add.rectangle(barX - barW / 2 + 1, barY, 10, 6, 0x00f5a0)
      .setOrigin(0, 0.5)
      .setDepth(21);

    this.starChestText = this.add.text(barX, barY + 14, '', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '8.5px',
      color: '#00f5ff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(21);

    chestBg.on('pointerdown', () => this.tryClaimStarMilestoneChest());
    this.starChestText.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.tryClaimStarMilestoneChest());

    // Right Wing: Spinning Daily Lucky Wheel Icon Button!
    const spinIcon = this.add.image(width - 38, 82, 'lucky_wheel_disc')
      .setScale(0.22)
      .setDepth(21)
      .setInteractive({ useHandCursor: true });
    this.tweens.add({
      targets: spinIcon,
      angle: 360,
      duration: 6000,
      repeat: -1
    });

    this.add.text(width - 38, 104, '🎡 SPIN', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '7.5px',
      color: '#ffea00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(22);

    spinIcon.on('pointerdown', () => {
      SoundSynth.playBounceChime(4);
      this.isSpinWheelOpen = true;
      this.spinWheelModalContainer.setVisible(true);
      this.renderLuckySpinWheelModal();
    });

    this.updateCurrencyHeader();
  }

  /**
   * 🎡 Daily Lucky Spin Wheel Modal (1 Free Spin Daily + Unlimited Rewarded Ad Spins!)
   */
  private renderLuckySpinWheelModal(): void {
    this.spinWheelModalContainer.removeAll(true);
    const { width, height } = ThemeConfig.screen;

    const backdrop = this.add.rectangle(width / 2, height / 2, width, height, 0x04020c, 0.92).setInteractive();
    const panel = ArtRenderer.drawOrnatePanel(this, 18, 150, width - 36, 520, 0x1e0e42, 0x090418, 0xffca28);

    const title = this.add.text(width / 2, 188, '🎡 ALCHEMIST LUCKY WHEEL 🎡', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '15px',
      color: '#ffea00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    const wheelY = 345;
    const sunburst = this.add.image(width / 2, wheelY, 'victory_sunburst').setScale(1.1);
    const wheelDisc = this.add.image(width / 2, wheelY, 'lucky_wheel_disc').setScale(1.08);
    // Golden Pointer Arrow at top of wheel
    const pointerTxt = this.add.text(width / 2, wheelY - 118, '▼', {
      fontSize: '28px',
      color: '#00f5ff',
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(0.5);

    const statusTxt = this.add.text(width / 2, wheelY + 132, 'WIN GOLD JACKPOTS OR TIER-III RUNES!', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '10px',
      color: '#00f5a0',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const todayStr = new Date().toISOString().slice(0, 10);
    const hasFreeSpin = this.saveData.lastDailySpinDate !== todayStr;

    const triggerWheelSpin = () => {
      if (this.isWheelSpinning) return;
      this.isWheelSpinning = true;
      SoundSynth.playBounceChime(5);

      const rewards = [
        { label: '+100 GOLD!', coins: 100, runeTier: 0 },
        { label: 'TIER-II RUNE!', coins: 0, runeTier: 2 },
        { label: '+250 GOLD!', coins: 250, runeTier: 0 },
        { label: 'TIER-III RUNE!', coins: 0, runeTier: 3 },
        { label: '+150 GOLD!', coins: 150, runeTier: 0 },
        { label: '+500 JACKPOT!', coins: 500, runeTier: 0 }
      ];
      const winIdx = Math.floor(Math.random() * rewards.length);
      const targetAngle = 360 * 5 - winIdx * 60;

      this.tweens.add({
        targets: wheelDisc,
        angle: targetAngle,
        duration: 2800,
        ease: 'Cubic.easeOut',
        onComplete: () => {
          this.isWheelSpinning = false;
          const prize = rewards[winIdx];
          if (prize.coins > 0) this.saveData.coins += prize.coins;
          if (prize.runeTier > 0) ForgeGrid.spawnRuneInEmptySlot(this.saveData.gridRunes, (prize.runeTier >= 2 ? 2 : 1) as 1 | 2);
          SaveSystem.save(this.saveData);
          SoundSynth.playUpgradeFanfare();
          statusTxt.setText(`🎉 YOU WON: ${prize.label} 🎉`);
          statusTxt.setColor('#ffea00');
          this.updateCurrencyHeader();
        }
      });
    };

    const spinBtn = ArtRenderer.createTactileButton(
      this,
      width / 2,
      540,
      hasFreeSpin ? 'btn_GREEN_lg' : 'btn_ORANGE_lg',
      hasFreeSpin ? '🎡 FREE DAILY SPIN!' : '▶ WATCH AD TO SPIN',
      '12px',
      () => {
        if (this.isWheelSpinning) return;
        if (this.saveData.lastDailySpinDate !== todayStr) {
          this.saveData.lastDailySpinDate = todayStr;
          SaveSystem.save(this.saveData);
          triggerWheelSpin();
        } else {
          AdService.getInstance().showRewardedAd(() => triggerWheelSpin());
        }
      }
    );

    const closeBtn = ArtRenderer.createTactileButton(
      this,
      width / 2,
      612,
      'btn_GRAY_sm',
      '✕ CLOSE',
      '11px',
      () => {
        if (this.isWheelSpinning) return;
        this.isSpinWheelOpen = false;
        this.spinWheelModalContainer.setVisible(false);
      }
    );

    this.spinWheelModalContainer.add([backdrop, panel, title, sunburst, wheelDisc, pointerTxt, statusTxt, spinBtn, closeBtn]);
  }

  private tryClaimStarMilestoneChest(): void {
    const totalStars = Object.values(this.saveData.stageStars).reduce((acc, s) => acc + s, 0);
    const nextGoal = (this.saveData.claimedStarChests + 1) * 15;

    if (totalStars >= nextGoal) {
      this.saveData.claimedStarChests++;
      this.saveData.coins += 250;
      ForgeGrid.spawnRuneInEmptySlot(this.saveData.gridRunes, 2);
      SaveSystem.save(this.saveData);
      SoundSynth.playUpgradeFanfare();
      this.updateCurrencyHeader();
    } else {
      SoundSynth.playBounceChime(2);
    }
  }

  private createCenteredHeroBottomDeck(width: number, height: number): void {
    const dock = this.add.graphics().setDepth(19);
    dock.fillGradientStyle(0x05020d, 0x05020d, 0x09041c, 0x09041c, 0, 0, 0.96, 0.96);
    dock.fillRect(0, height - 168, width, 168);

    const techBtn = this.add.image(56, height - 78, 'medallion_MAGENTA')
      .setScale(0.92)
      .setDepth(21)
      .setInteractive({ useHandCursor: true });
    this.add.text(56, height - 78, '⚡\nTECH', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '9.5px',
      color: '#ffffff',
      align: 'center',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(22);

    techBtn.on('pointerdown', () => {
      SoundSynth.playBounceChime(4);
      this.isTechModalOpen = !this.isTechModalOpen;
      this.techModalContainer.setVisible(this.isTechModalOpen);
      if (this.isTechModalOpen) this.renderTechModal();
    });

    const centerPlayX = width / 2;
    const centerPlayY = height - 86;

    const haloBurst = this.add.image(centerPlayX, centerPlayY, 'victory_sunburst')
      .setScale(0.68)
      .setAlpha(0.75)
      .setDepth(20);
    this.tweens.add({
      targets: haloBurst,
      angle: 360,
      duration: 10000,
      repeat: -1
    });

    const playPortal = this.add.image(centerPlayX, centerPlayY, 'medallion_PLAY')
      .setScale(1.06)
      .setDepth(21)
      .setInteractive({ useHandCursor: true });

    this.tweens.add({
      targets: playPortal,
      scaleX: 1.14,
      scaleY: 1.14,
      duration: 820,
      yoyo: true,
      repeat: -1
    });

    this.add.text(centerPlayX, centerPlayY, `▶ START\nSTAGE ${this.saveData.highestWave}`, {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '12.5px',
      color: '#ffffff',
      align: 'center',
      fontStyle: 'bold',
      stroke: '#002610',
      strokeThickness: 5
    }).setOrigin(0.5).setDepth(22);

    playPortal.on('pointerdown', () => {
      if (this.isTechModalOpen || this.isSpinWheelOpen) return;
      SoundSynth.playUpgradeFanfare();
      this.saveData.selectedStage = this.saveData.highestWave;
      SaveSystem.save(this.saveData);
      this.scene.start('BattleScene', { selectedStage: this.saveData.highestWave });
    });

    const adMedallion = this.add.image(width - 56, height - 78, 'medallion_GOLD')
      .setScale(0.92)
      .setDepth(21)
      .setInteractive({ useHandCursor: true });
    this.add.text(width - 56, height - 78, '🎬\n+150G', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '9.5px',
      color: '#ffffff',
      align: 'center',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(22);

    adMedallion.on('pointerdown', () => {
      if (this.isTechModalOpen || this.isSpinWheelOpen) return;
      AdService.getInstance().showRewardedAd(() => {
        this.saveData.coins += 150;
        SaveSystem.save(this.saveData);
        SoundSynth.playUpgradeFanfare();
        this.updateCurrencyHeader();
        if (this.isTechModalOpen) this.renderTechModal();
      });
    });
  }

  private renderTechModal(): void {
    this.techModalContainer.removeAll(true);
    const { width, height } = ThemeConfig.screen;

    const backdrop = this.add.rectangle(width / 2, height / 2, width, height, 0x04020c, 0.92)
      .setInteractive();
    const title = this.add.text(width / 2, 145, '⚡ ALCHEMIST TECH CONSTELLATION ⚡', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '14px',
      color: '#00f5ff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const lines = this.add.graphics();
    lines.lineStyle(3, 0x00f5ff, 0.55);
    lines.lineBetween(195, 280, 98, 465);
    lines.lineBetween(195, 280, 292, 465);
    lines.lineBetween(98, 465, 292, 465);

    this.techModalContainer.add([backdrop, title, lines]);

    for (const skill of this.skills) {
      const currentLvl = this.saveData.grimoireLevels[skill.key] || 1;
      const cost = skill.baseCost * currentLvl;

      const halo = this.add.image(skill.x, skill.y - 24, skill.medallionKey).setScale(1.25);
      const orbIcon = this.add.image(skill.x, skill.y - 24, skill.texKey).setScale(0.92);

      const lvlBadge = this.add.text(skill.x + 28, skill.y - 50, `LV.${currentLvl}`, {
        fontFamily: "'Orbitron', sans-serif",
        fontSize: '10px',
        color: '#00f5a0',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5);

      const titleTxt = this.add.text(skill.x, skill.y + 22, skill.title, {
        fontFamily: "'Orbitron', sans-serif",
        fontSize: '10.5px',
        color: '#ffea00',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      const descTxt = this.add.text(skill.x, skill.y + 38, skill.desc, {
        fontFamily: "'Chakra Petch', sans-serif",
        fontSize: '10px',
        color: '#00f5ff',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      const canAfford = this.saveData.coins >= cost;
      const btnTex = canAfford ? 'btn_BLUE_sm' : 'btn_GRAY_sm';

      const upgBtn = ArtRenderer.createTactileButton(
        this,
        skill.x,
        skill.y + 66,
        btnTex,
        `⚡ ${cost}G`,
        '10.5px',
        () => {
          if (this.saveData.coins < cost) return;
          this.saveData.coins -= cost;
          this.saveData.grimoireLevels[skill.key] = currentLvl + 1;
          SaveSystem.save(this.saveData);
          SoundSynth.playUpgradeFanfare();
          this.updateCurrencyHeader();
          this.renderTechModal();
        }
      );

      this.techModalContainer.add([halo, orbIcon, lvlBadge, titleTxt, descTxt, upgBtn]);
    }

    const closeBtn = ArtRenderer.createTactileButton(
      this,
      width / 2,
      640,
      'btn_GREEN_md',
      '✓ BACK TO SAGA MAP',
      '11px',
      () => {
        this.isTechModalOpen = false;
        this.techModalContainer.setVisible(false);
      }
    );
    this.techModalContainer.add(closeBtn);
  }

  private showNeutralAgeGateModal(): void {
    const { width, height } = ThemeConfig.screen;
    const modalGroup = this.add.container(0, 0).setDepth(50);
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.88).setInteractive();
    const box = ArtRenderer.drawOrnatePanel(this, 22, height / 2 - 125, width - 44, 250);

    const title = this.add.text(width / 2, height / 2 - 80, 'WELCOME ALCHEMIST!', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '17px',
      color: '#00f5ff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const subtitle = this.add.text(
      width / 2,
      height / 2 - 42,
      'Select your age bracket to configure\nfamily-safe advertising settings:',
      {
        fontFamily: "'Chakra Petch', sans-serif",
        fontSize: '12px',
        color: '#ffffff',
        align: 'center'
      }
    ).setOrigin(0.5);

    modalGroup.add([overlay, box, title, subtitle]);

    const brackets = [
      { label: 'AGES 10-12', ageValue: 11, x: width / 2 - 80, y: height / 2 + 22 },
      { label: 'AGES 13-17', ageValue: 15, x: width / 2 + 80, y: height / 2 + 22 },
      { label: 'AGES 18+', ageValue: 20, x: width / 2, y: height / 2 + 76 }
    ];

    brackets.forEach((b) => {
      const btn = ArtRenderer.createTactileButton(this, b.x, b.y, 'btn_BLUE_sm', b.label, '11px', () => {
        this.saveData.userAgeDeclared = b.ageValue;
        SaveSystem.save(this.saveData);
        AdService.getInstance().configureAgeCompliance(b.ageValue);
        AdService.getInstance().initializeAdMob();
        SoundSynth.playUpgradeFanfare();
        modalGroup.destroy();
      });
      modalGroup.add(btn);
    });
  }

  private updateCurrencyHeader(): void {
    this.coinsText.setText(`${this.saveData.coins.toLocaleString()}`);

    const totalStars = Object.values(this.saveData.stageStars).reduce((acc, s) => acc + s, 0);
    const nextGoal = (this.saveData.claimedStarChests + 1) * 15;
    const ratio = Math.min(1, totalStars / nextGoal);
    this.starChestFill.width = Math.max(6, Math.round(ratio * 146));

    if (this.totalStarsBadgeText) {
      this.totalStarsBadgeText.setText(`⭐ ${totalStars} / ${nextGoal} SAGA STARS`);
    }

    if (totalStars >= nextGoal) {
      this.starChestText.setText('🎁 TAP TO OPEN STAR CHEST! 🎁');
      this.starChestText.setColor('#ffea00');
    } else {
      this.starChestText.setText(`COLLECT ${nextGoal - totalStars} MORE ⭐ FOR FREE CHEST`);
      this.starChestText.setColor('#00f5ff');
    }
  }
}
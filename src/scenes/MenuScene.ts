/**
 * CANDY-CRUSH STYLE INTERACTIVE SAGA WORLD MAP & TECH CONSTELLATION DRAWER
 * Zero TypeScript warnings, smooth vertical drag-scroll, and 3-Star stage history.
 */
import Phaser from 'phaser';
import { ThemeConfig } from '../config/ThemeConfig';
import { SaveSystem, PlayerSaveData } from '../core/SaveSystem';
import { SoundSynth } from '../core/SoundSynth';
import { AdService } from '../core/AdService';
import { ArtRenderer } from '../ui/ArtRenderer';
import { WaveSpawner } from '../gameplay/WaveSpawner';

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
  private totalStarsText!: Phaser.GameObjects.Text;

  private mapContainer!: Phaser.GameObjects.Container;
  private techModalContainer!: Phaser.GameObjects.Container;
  private isTechModalOpen = false;

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

    const { width, height, topAdBannerHeight } = ThemeConfig.screen;

    // 1. Fixed Seamless Cosmic Background
    this.add.image(width / 2, height / 2, 'world_bg_seamless');

    // 2. Scrollable Candy-Crush Winding Saga Map Container
    this.mapContainer = this.add.container(0, 0);
    this.buildScrollableSagaMap(width, height);
    this.setupMapScrollInput();

    // 3. Fixed Top Safe Banner Ad Dock
    this.add.rectangle(width / 2, topAdBannerHeight / 2, width, topAdBannerHeight, 0x04020a, 0.95)
      .setDepth(20);
    this.add.text(width / 2, topAdBannerHeight / 2, 'ADMOB TOP BANNER AD (SAFE ZONE)', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '9.5px',
      color: '#00f5ff'
    }).setOrigin(0.5).setDepth(21);

    // 4. Floating Top HUD Overlay (Gold, Total Stars, & Tech Tree Medallion)
    this.createFloatingTopHud(width);

    // 5. Floating Bottom Quick-Play Portal & Free Gold Ad Medallion
    this.createFloatingBottomControls(width, height);

    // 6. Collapsible Tech Tree Constellation Modal
    this.techModalContainer = this.add.container(0, 0).setDepth(40).setVisible(false);
    this.renderTechModal();

    if (this.saveData.userAgeDeclared === null) {
      this.showNeutralAgeGateModal();
    } else {
      AdService.getInstance().configureAgeCompliance(this.saveData.userAgeDeclared);
      AdService.getInstance().initializeAdMob();
    }
  }

  private buildScrollableSagaMap(width: number, height: number): void {
    this.mapContainer.removeAll(true);

    const highest = this.saveData.highestWave || 1;
    const totalVisibleNodes = Math.max(25, highest + 12);
    const nodeSpacingY = 105;
    const bottomBaseY = height - 180;

    const topNodeY = bottomBaseY - (totalVisibleNodes - 1) * nodeSpacingY;
    this.minMapY = 0;
    this.maxMapY = Math.max(0, 260 - topNodeY);

    const pathGraphics = this.add.graphics();
    this.mapContainer.add(pathGraphics);

    const getNodeX = (stage: number): number => width / 2 + Math.sin((stage - 1) * 0.72) * 108;
    const getNodeY = (stage: number): number => bottomBaseY - (stage - 1) * nodeSpacingY;

    // 1. Draw Winding Glowing Road
    for (let s = 1; s < totalVisibleNodes; s++) {
      const x1 = getNodeX(s);
      const y1 = getNodeY(s);
      const x2 = getNodeX(s + 1);
      const y2 = getNodeY(s + 1);

      const isUnlockedPath = s < highest;

      pathGraphics.lineStyle(12, isUnlockedPath ? 0x00f5ff : 0x231442, isUnlockedPath ? 0.28 : 0.4);
      pathGraphics.lineBetween(x1, y1, x2, y2);

      const steps = 6;
      for (let k = 1; k < steps; k++) {
        const t = k / steps;
        const sx = Phaser.Math.Linear(x1, x2, t);
        const sy = Phaser.Math.Linear(y1, y2, t);
        pathGraphics.fillStyle(isUnlockedPath ? 0x00f5a0 : 0x4a3570, isUnlockedPath ? 0.9 : 0.45);
        pathGraphics.fillCircle(sx, sy, isUnlockedPath ? 3.5 : 2.5);
      }
    }

    // 2. Render Stage Medallion Nodes & ⭐⭐⭐ Star History!
    const starsMap = this.saveData.stageStars;

    for (let stage = 1; stage <= totalVisibleNodes; stage++) {
      const nx = getNodeX(stage);
      const ny = getNodeY(stage);
      const isBoss = WaveSpawner.isBossWave(stage);
      const isCleared = stage < highest || Boolean(starsMap[stage]);
      const isCurrent = stage === highest;
      const isLocked = stage > highest;

      if ((stage - 1) % 5 === 0) {
        const meta = WaveSpawner.getWaveMetadata(stage);
        const banner = this.add.text(width / 2, ny + 52, `❖ ${meta.biomeName} (STAGES ${stage}-${stage + 4}) ❖`, {
          fontFamily: "'Orbitron', sans-serif",
          fontSize: '9.5px',
          color: '#00f5ff',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 4
        }).setOrigin(0.5);
        this.mapContainer.add(banner);
      }

      let medKey = 'medallion_CYAN';
      if (isBoss) medKey = 'medallion_MAGENTA';
      else if (isCurrent) medKey = 'medallion_GOLD';
      else if (isCleared) medKey = 'medallion_GREEN';

      const nodeScale = isBoss ? 0.96 : isCurrent ? 0.88 : 0.74;
      const nodeSprite = this.add.image(nx, ny, medKey).setScale(nodeScale);

      if (isLocked) {
        nodeSprite.setTint(0x3a2a54).setAlpha(0.75);
      } else {
        nodeSprite.setInteractive({ useHandCursor: true });
        nodeSprite.on('pointerup', () => {
          if (this.totalDragDistance < 12 && !this.isTechModalOpen) {
            SoundSynth.playUpgradeFanfare();
            this.saveData.selectedStage = stage;
            SaveSystem.save(this.saveData);
            this.scene.start('BattleScene', { selectedStage: stage });
          }
        });
      }

      if (isCurrent) {
        const pulseRing = this.add.circle(nx, ny, 34, 0xffea00, 0.18).setStrokeStyle(2.5, 0xffea00);
        this.tweens.add({
          targets: pulseRing,
          scaleX: 1.28,
          scaleY: 1.28,
          alpha: 0,
          duration: 1000,
          repeat: -1
        });

        const youTag = this.add.text(nx, ny - 42, '▼ PLAY NOW ▼', {
          fontFamily: "'Orbitron', sans-serif",
          fontSize: '9.5px',
          color: '#00f5a0',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 4
        }).setOrigin(0.5);

        this.tweens.add({
          targets: youTag,
          y: ny - 48,
          duration: 600,
          yoyo: true,
          repeat: -1
        });
        this.mapContainer.add([pulseRing, youTag]);
      }

      const labelStr = isBoss ? `👑\n${stage}` : isLocked ? `🔒\n${stage}` : `${stage}`;
      const numTxt = this.add.text(nx, ny, labelStr, {
        fontFamily: "'Orbitron', sans-serif",
        fontSize: isBoss ? '11px' : '12px',
        color: isLocked ? '#9e9e9e' : '#ffffff',
        align: 'center',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5);

      this.mapContainer.add([nodeSprite, numTxt]);

      if (isCleared) {
        const earnedStars = starsMap[stage] || 2;
        const starStr = '⭐'.repeat(earnedStars) + '☆'.repeat(Math.max(0, 3 - earnedStars));
        const starsTxt = this.add.text(nx, ny + 32, starStr, {
          fontSize: '11px',
          color: '#ffea00',
          stroke: '#000000',
          strokeThickness: 3
        }).setOrigin(0.5);
        this.mapContainer.add(starsTxt);
      }
    }

    const currentStageY = getNodeY(highest);
    const desiredOffset = height * 0.58 - currentStageY;
    this.mapContainer.y = Phaser.Math.Clamp(desiredOffset, this.minMapY, this.maxMapY);
  }

  private setupMapScrollInput(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isTechModalOpen) return;
      if (pointer.y > 105 && pointer.y < ThemeConfig.screen.height - 120) {
        this.isDraggingMap = true;
        this.dragStartY = pointer.y;
        this.mapStartY = this.mapContainer.y;
        this.totalDragDistance = 0;
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDraggingMap || this.isTechModalOpen) return;
      const dy = pointer.y - this.dragStartY;
      this.totalDragDistance = Math.max(this.totalDragDistance, Math.abs(dy));
      this.mapContainer.y = Phaser.Math.Clamp(this.mapStartY + dy, this.minMapY, this.maxMapY);
    });

    this.input.on('pointerup', () => {
      this.isDraggingMap = false;
    });

    this.input.on('wheel', (_pointer: unknown, _gameObjects: unknown, _deltaX: number, deltaY: number) => {
      if (this.isTechModalOpen) return;
      this.mapContainer.y = Phaser.Math.Clamp(this.mapContainer.y - deltaY * 0.6, this.minMapY, this.maxMapY);
    });
  }

  private createFloatingTopHud(width: number): void {
    this.add.rectangle(width / 2, 82, width, 56, 0x080414, 0.82).setDepth(20);

    this.add.image(26, 82, 'icon_coin').setScale(1.05).setDepth(21);
    this.coinsText = this.add.text(44, 82, '', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '13px',
      color: '#ffea00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0, 0.5).setDepth(21);

    this.totalStarsText = this.add.text(width / 2, 82, '', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '12px',
      color: '#00f5ff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(21);

    const techBtn = this.add.image(width - 42, 82, 'medallion_MAGENTA')
      .setScale(0.72)
      .setDepth(21)
      .setInteractive({ useHandCursor: true });
    this.add.text(width - 42, 82, '⚡\nTECH', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '8.5px',
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

    this.updateCurrencyHeader();
  }

  private createFloatingBottomControls(width: number, height: number): void {
    this.add.text(width / 2, height - 138, '↕ DRAG MAP TO VIEW STAR HISTORY • TAP ANY STAGE TO PLAY ↕', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '8.5px',
      color: '#00f5ff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(20);

    const playPortal = this.add.image(width / 2, height - 74, 'medallion_PLAY')
      .setScale(1.02)
      .setDepth(21)
      .setInteractive({ useHandCursor: true });

    this.tweens.add({
      targets: playPortal,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 850,
      yoyo: true,
      repeat: -1
    });

    this.add.text(width / 2, height - 74, `▶ STAGE ${this.saveData.highestWave}`, {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '11px',
      color: '#ffffff',
      align: 'center',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(22);

    playPortal.on('pointerdown', () => {
      if (this.isTechModalOpen) return;
      SoundSynth.playUpgradeFanfare();
      this.saveData.selectedStage = this.saveData.highestWave;
      SaveSystem.save(this.saveData);
      this.scene.start('BattleScene', { selectedStage: this.saveData.highestWave });
    });

    const adMedallion = this.add.image(width - 52, height - 70, 'medallion_GOLD')
      .setScale(0.9)
      .setDepth(21)
      .setInteractive({ useHandCursor: true });
    this.add.text(width - 52, height - 70, '🎬\n+150G', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '9px',
      color: '#ffffff',
      align: 'center',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(22);

    adMedallion.on('pointerdown', () => {
      if (this.isTechModalOpen) return;
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
    this.coinsText.setText(`${this.saveData.coins}`);
    const totalStars = Object.values(this.saveData.stageStars).reduce((acc, s) => acc + s, 0);
    this.totalStarsText.setText(`⭐ ${totalStars} SAGA STARS`);
  }
}
import Phaser from 'phaser';
import { ThemeConfig } from '../config/ThemeConfig';
import { OrbsConfig, ElementType } from '../config/OrbsConfig';
import { ArenaPhysics, ArenaBounds, BlockRect, ActiveOrb } from '../gameplay/ArenaPhysics';
import { ForgeGrid } from '../gameplay/ForgeGrid';
import { ElementalCombos } from '../gameplay/ElementalCombos';
import { WaveSpawner, MonsterTrait } from '../gameplay/WaveSpawner';
import { SoundSynth } from '../core/SoundSynth';
import { SaveSystem, PlayerSaveData } from '../core/SaveSystem';
import { AdService } from '../core/AdService';
import { ArtRenderer } from '../ui/ArtRenderer';

interface VisualBlock {
  data: BlockRect;
  trait: MonsterTrait;
  shieldHp: number;
  container: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;
  shieldRing: Phaser.GameObjects.Arc | null;
  hpBarFill: Phaser.GameObjects.Rectangle | null;
  hpText: Phaser.GameObjects.Text | null;
  lastElement: ElementType | null;
}

interface FlyingOrb extends ActiveOrb {
  element: ElementType;
  tier: number;
  trail: { x: number; y: number }[];
}

interface BattleSceneInitData {
  selectedStage?: number;
  stageNumber?: number;
}

export class BattleScene extends Phaser.Scene {
  private saveData!: PlayerSaveData;
  private arenaBounds!: ArenaBounds;
  private cannonX = 0;
  private cannonY = 0;
  private isAiming = false;
  private isVolleyActive = false;
  private isGameOver = false;
  private isForgeDrawerOpen = false;
  private aimAngleRad = -Math.PI / 2;

  private gameSpeedMultiplier = 1;
  private overdriveCharge = 0;
  private isOverdriveActive = false;

  private stageElapsedSeconds = 0;
  private targetBonusSeconds = 45;
  private bonusTimerBarFill!: Phaser.GameObjects.Rectangle;
  private bonusTimerText!: Phaser.GameObjects.Text;

  private trajectoryGraphics!: Phaser.GameObjects.Graphics;
  private orbsGraphics!: Phaser.GameObjects.Graphics;
  private cannonSprite!: Phaser.GameObjects.Image;
  private coinsText!: Phaser.GameObjects.Text;
  private waveBannerText!: Phaser.GameObjects.Text;
  private overdriveRing!: Phaser.GameObjects.Arc;
  private overdriveText!: Phaser.GameObjects.Text;
  private speedMedallionText!: Phaser.GameObjects.Text;
  private statusHintText!: Phaser.GameObjects.Text;

  private ammoBeltContainer!: Phaser.GameObjects.Container;
  private forgeDrawerContainer!: Phaser.GameObjects.Container;

  private blocks: VisualBlock[] = [];
  private activeOrbs: FlyingOrb[] = [];
  private orbSprites: Phaser.GameObjects.Image[] = [];
  private slotCenters: { x: number; y: number }[] = [];
  private dragSourceIdx: number | null = null;
  private dragGhostSprite: Phaser.GameObjects.Image | null = null;

  private score = 0;
  private wave = 1;
  private comboCount = 0;

  constructor() {
    super('BattleScene');
  }

  init(data?: BattleSceneInitData): void {
    this.saveData = SaveSystem.load();
    this.wave = data?.selectedStage || data?.stageNumber || this.saveData.selectedStage || this.saveData.highestWave || 1;
  }

  create(): void {
    ArtRenderer.generateAllGameTextures(this);

    this.saveData = SaveSystem.load();
    this.isGameOver = false;
    this.isVolleyActive = false;
    this.isForgeDrawerOpen = false;
    this.overdriveCharge = 0;
    this.isOverdriveActive = false;
    this.stageElapsedSeconds = 0;
    this.targetBonusSeconds = WaveSpawner.isBossWave(this.wave) ? 60 : 45;
    this.blocks = [];
    this.activeOrbs = [];
    this.orbSprites = [];

    const { width, height, topAdBannerHeight } = ThemeConfig.screen;

    this.arenaBounds = {
      left: 8,
      right: width - 8,
      top: 114,
      bottom: height - 128
    };
    this.cannonX = width / 2;
    this.cannonY = this.arenaBounds.bottom - 14;

    // 1. SEAMLESS EDGE-TO-EDGE WORLD BACKGROUND
    this.add.image(width / 2, height / 2, 'world_bg_seamless');

    // 2. TOP SAFE BANNER AD STRIP
    this.add.rectangle(width / 2, topAdBannerHeight / 2, width, topAdBannerHeight, 0x04020a, 0.9);
    this.add.text(width / 2, topAdBannerHeight / 2, 'ADMOB TOP BANNER AD (SAFE ZONE)', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '9.5px',
      color: '#00f5ff'
    }).setOrigin(0.5);

    // 3. FLOATING TOP HUD + SPEED-BONUS COUNTDOWN BAR
    this.createFloatingHud(width);

    // 4. FLOATING BOTTOM COMBAT DECK & AMMO BELT
    this.createBottomCombatDeck(width, height);

    // 5. SLIDE-UP HOLOGRAPHIC FORGE DRAWER
    this.createSlideUpForgeDrawer(height);

    // 6. GRAPHICS LAYERS
    this.trajectoryGraphics = this.add.graphics();
    this.orbsGraphics = this.add.graphics();

    this.spawnNewWaveBlocks();
    this.setupInputHandlers();
  }

  private createFloatingHud(width: number): void {
    this.add.rectangle(64, 76, 104, 28, 0x0e0720, 0.75).setStrokeStyle(1, 0x00f5ff, 0.4);
    this.add.image(26, 76, 'icon_coin').setScale(0.95);
    this.coinsText = this.add.text(42, 76, '', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '12px',
      color: '#ffea00',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    this.waveBannerText = this.add.text(width / 2, 66, '', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '11.5px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    const barW = 156;
    this.add.rectangle(width / 2, 85, barW, 8, 0x090414, 0.9).setStrokeStyle(1, 0xffca28);
    this.bonusTimerBarFill = this.add.rectangle(width / 2 - barW / 2 + 1, 85, barW - 2, 6, 0x00f5a0).setOrigin(0, 0.5);

    this.bonusTimerText = this.add.text(width / 2, 101, '', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '9.5px',
      color: '#00f5a0',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    const mapIcon = this.add.image(width - 34, 78, 'medallion_MAGENTA').setScale(0.68).setInteractive({ useHandCursor: true });
    this.add.text(width - 34, 78, '🗺️\nMAP', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '8.5px',
      color: '#ffffff',
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    mapIcon.on('pointerdown', () => this.scene.start('MenuScene'));
  }

  private createBottomCombatDeck(width: number, height: number): void {
    const line = this.add.graphics();
    line.lineStyle(1.5, 0xff0055, 0.35);
    line.lineBetween(16, this.cannonY - 22, width - 16, this.cannonY - 22);

    this.cannonSprite = this.add.image(this.cannonX, this.cannonY, 'cannon_turret')
      .setRotation(-Math.PI / 2);

    this.statusHintText = this.add.text(width / 2, this.cannonY - 46, 'HIT 💣 BOMBS & 🧱 BUMPER WALLS FOR PINBALL CHAOS!', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '9px',
      color: '#00f5ff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.ammoBeltContainer = this.add.container(0, 0);
    this.renderCompactAmmoBelt();

    const odX = 44;
    const odY = height - 64;
    this.add.image(odX, odY, 'medallion_GOLD').setScale(0.86);
    this.overdriveRing = this.add.circle(odX, odY, 26, 0x00f5a0, 0.2).setStrokeStyle(2.5, 0xffea00);
    this.overdriveText = this.add.text(odX, odY, '⚡\n0%', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '9.5px',
      color: '#ffffff',
      align: 'center',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // 1X -> 2X -> 3X Turbo Speed Toggle!
    const spdIcon = this.add.image(44, height - 128, 'medallion_CYAN').setScale(0.68).setInteractive({ useHandCursor: true });
    this.speedMedallionText = this.add.text(44, height - 128, '1X\nSPD', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '8.5px',
      color: '#ffffff',
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    spdIcon.on('pointerdown', () => {
      this.gameSpeedMultiplier = this.gameSpeedMultiplier === 1 ? 2 : this.gameSpeedMultiplier === 2 ? 3 : 1;
      this.speedMedallionText.setText(`${this.gameSpeedMultiplier}X\nSPD`);
      this.speedMedallionText.setColor(this.gameSpeedMultiplier > 1 ? '#ffea00' : '#ffffff');
      SoundSynth.playBounceChime(6);
    });

    const forgeBtnX = width - 44;
    const forgeBtnY = height - 64;
    const forgeMedallion = this.add.image(forgeBtnX, forgeBtnY, 'medallion_GREEN')
      .setScale(0.92)
      .setInteractive({ useHandCursor: true });
    this.add.text(forgeBtnX, forgeBtnY, '⚒️\nFORGE', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '9px',
      color: '#ffffff',
      align: 'center',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    forgeMedallion.on('pointerdown', () => {
      if (this.isVolleyActive || this.isGameOver) return;
      this.toggleForgeDrawer(!this.isForgeDrawerOpen);
    });
  }

  private renderCompactAmmoBelt(): void {
    this.ammoBeltContainer.removeAll(true);
    const { width, height } = ThemeConfig.screen;
    const dmgMult = this.getDamageMultiplier();
    const beltY = height - 58;

    const label = this.add.text(width / 2, beltY - 34, 'ACTIVE VOLLEY AMMO', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '8.5px',
      color: '#00f5ff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.ammoBeltContainer.add(label);

    for (let i = 0; i < 4; i++) {
      const sx = width / 2 - 72 + i * 48;
      const ring = this.add.image(sx, beltY, 'slot_top_queue').setScale(0.74);
      this.ammoBeltContainer.add(ring);

      const runeKey = this.saveData.gridRunes[i];
      if (runeKey && OrbsConfig[runeKey]) {
        const cfg = OrbsConfig[runeKey];
        const orb = this.add.image(sx, beltY, `orb_${cfg.element}_${cfg.tier}`).setScale(0.58);
        const dmgTxt = this.add.text(sx, beltY + 18, `${Math.round(cfg.baseDamage * dmgMult)}`, {
          fontFamily: "'Orbitron', sans-serif",
          fontSize: '8.5px',
          color: '#ffea00',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 3
        }).setOrigin(0.5);
        this.ammoBeltContainer.add([orb, dmgTxt]);
      }
    }
  }

  private createSlideUpForgeDrawer(height: number): void {
    this.forgeDrawerContainer = this.add.container(0, height).setDepth(30);
    const drawerTopY = height - 360;

    this.slotCenters = [];
    const startX = 69;
    const gapX = 84;
    const startY = drawerTopY + 68;
    const gapY = 68;

    for (let i = 0; i < 12; i++) {
      const row = Math.floor(i / 4);
      const col = i % 4;
      this.slotCenters.push({ x: startX + col * gapX, y: startY + row * gapY });
    }

    this.renderForgeGrid();
    this.forgeDrawerContainer.setVisible(false);
  }

  private toggleForgeDrawer(open: boolean): void {
    this.isForgeDrawerOpen = open;
    SoundSynth.playBounceChime(4);
    if (open) {
      this.renderForgeGrid();
      this.forgeDrawerContainer.setVisible(true);
      this.tweens.add({
        targets: this.forgeDrawerContainer,
        y: 0,
        duration: 220,
        ease: 'Back.easeOut'
      });
    } else {
      this.tweens.add({
        targets: this.forgeDrawerContainer,
        y: ThemeConfig.screen.height,
        duration: 180,
        onComplete: () => {
          this.forgeDrawerContainer.setVisible(false);
          this.renderCompactAmmoBelt();
        }
      });
    }
  }

  private renderForgeGrid(): void {
    this.forgeDrawerContainer.removeAll(true);
    const { width, height } = ThemeConfig.screen;
    const drawerTopY = height - 360;
    const dmgMult = this.getDamageMultiplier();

    const dimBg = this.add.rectangle(width / 2, height / 2, width, height, 0x020108, 0.78)
      .setInteractive();
    dimBg.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.y < drawerTopY) this.toggleForgeDrawer(false);
    });

    const sheet = ArtRenderer.drawOrnatePanel(this, 8, drawerTopY, width - 16, 352, 0x170b33, 0x070312, 0x00f5ff);

    const header = this.add.text(width / 2, drawerTopY + 22, '⚡ RUNE MERGE SANCTUM (DRAG TO MERGE • TAP SKY TO CLOSE) ⚡', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '9px',
      color: '#00f5ff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.forgeDrawerContainer.add([dimBg, sheet, header]);

    this.slotCenters.forEach((pos, idx) => {
      const isTopQueueRow = idx < 4;
      const slotImg = this.add.image(pos.x, pos.y, isTopQueueRow ? 'slot_top_queue' : 'slot_normal');
      this.forgeDrawerContainer.add(slotImg);

      const runeKey = this.saveData.gridRunes[idx];
      if (runeKey && OrbsConfig[runeKey]) {
        const cfg = OrbsConfig[runeKey];
        const boostedDmg = Math.round(cfg.baseDamage * dmgMult);
        const orbSprite = this.add.image(pos.x, pos.y - 2, `orb_${cfg.element}_${cfg.tier}`).setScale(0.76);

        const tierBadge = this.add.text(pos.x + 16, pos.y - 16, cfg.romanTier, {
          fontFamily: "'Orbitron', sans-serif",
          fontSize: '9.5px',
          color: '#ffea00',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 3
        }).setOrigin(0.5);

        const dmgLabel = this.add.text(pos.x, pos.y + 19, `${boostedDmg}`, {
          fontFamily: "'Orbitron', sans-serif",
          fontSize: '9px',
          color: '#ffffff',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 3
        }).setOrigin(0.5);

        this.forgeDrawerContainer.add([orbSprite, tierBadge, dmgLabel]);
      }
    });

    const btnY = height - 42;
    const craftBtn = ArtRenderer.createTactileButton(this, 104, btnY, 'btn_GREEN_md', '+ CRAFT RUNE (50G)', '10.5px', () => {
      if (this.saveData.coins < 50) {
        this.showPopupBanner(104, btnY - 32, 'NEED 50 GOLD!', '#ff4081');
        return;
      }
      const spawnedIdx = ForgeGrid.spawnRuneInEmptySlot(this.saveData.gridRunes, 1);
      if (spawnedIdx === -1) {
        this.showPopupBanner(104, btnY - 32, 'FULL! MERGE RUNES!', '#ffea00');
        return;
      }
      this.saveData.coins -= 50;
      SaveSystem.save(this.saveData);
      this.updateHud();
      this.renderForgeGrid();
      this.renderCompactAmmoBelt();
    });

    const adBtn = ArtRenderer.createTactileButton(this, width - 104, btnY, 'btn_ORANGE_md', '▶ AD: TIER-II RUNE', '10.5px', () => {
      AdService.getInstance().showRewardedAd(() => {
        const spawnedIdx = ForgeGrid.spawnRuneInEmptySlot(this.saveData.gridRunes, 2);
        if (spawnedIdx === -1) {
          this.showPopupBanner(width - 104, btnY - 32, 'FULL! MERGE RUNES!', '#ffea00');
          return;
        }
        SaveSystem.save(this.saveData);
        SoundSynth.playUpgradeFanfare();
        this.renderForgeGrid();
        this.renderCompactAmmoBelt();
      });
    });

    this.forgeDrawerContainer.add([craftBtn, adBtn]);
  }

  private addOverdriveCharge(amount: number): void {
    if (this.isOverdriveActive) return;
    this.overdriveCharge = Math.min(100, this.overdriveCharge + amount);
    if (this.overdriveCharge >= 100) {
      this.isOverdriveActive = true;
      this.overdriveText.setText('MAX\n2X!');
      this.overdriveText.setColor('#00f5a0');
      this.overdriveRing.setStrokeStyle(3.5, 0x00f5a0);
    } else {
      this.overdriveText.setText(`⚡\n${Math.round(this.overdriveCharge)}%`);
    }
  }

  private getDamageMultiplier(): number {
    const lvl = this.saveData.grimoireLevels.volatileMix || 1;
    return 1 + (lvl - 1) * 0.15;
  }

  private spawnNewWaveBlocks(): void {
    const rawBlocks = WaveSpawner.spawnWaveBlocks(this.wave, this.arenaBounds.top + 10, ThemeConfig.screen.width);
    this.updateHud();

    if (WaveSpawner.isBossWave(this.wave)) {
      this.cameras.main.shake(320, 0.012);
      this.showPopupBanner(ThemeConfig.screen.width / 2, this.arenaBounds.top + 36, '⚠️ BOSS: TITAN CRYSTAL SENTINEL!', '#ff007f');
    }

    rawBlocks.forEach((item, idx) => {
      const isBoss = item.archetype.isBoss;
      const isWall = item.trait === 'WALL';
      const container = this.add.container(item.data.x, item.data.y);

      if (isWall) {
        // Glowing Cyber-Bumper Wall Obstacle (Deflects orbs like a pinball bumper!)
        const wallGlow = this.add.rectangle(0, 0, item.data.width + 6, item.data.height + 6, 0x00f5ff, 0.28);
        const wallBar = this.add.rectangle(0, 0, item.data.width, item.data.height, 0x120829)
          .setStrokeStyle(2.5, 0x00f5ff);
        const wallLabel = this.add.text(0, 0, '⚡ BUMPER ⚡', {
          fontFamily: "'Orbitron', sans-serif",
          fontSize: '7.5px',
          color: '#00f5ff',
          fontStyle: 'bold'
        }).setOrigin(0.5);

        container.add([wallGlow, wallBar, wallLabel]);
        this.blocks.push({
          data: item.data,
          trait: 'WALL',
          shieldHp: 0,
          container,
          sprite: wallBar,
          shieldRing: null,
          hpBarFill: null,
          hpText: null,
          lastElement: null
        });
        return;
      }

      const sprite = this.add.image(0, 0, item.texKey);

      let shieldRing: Phaser.GameObjects.Arc | null = null;
      if (item.shieldHp > 0) {
        shieldRing = this.add.circle(0, 0, isBoss ? 48 : 28, 0x00f5ff, 0.15)
          .setStrokeStyle(2, 0x00f5ff);
      }

      const barWidth = isBoss ? 110 : 38;
      const barY = -item.data.height / 2 - 8;
      const hpBg = this.add.rectangle(0, barY, barWidth, 5, 0x05020c, 0.85);
      const hpBarFill = this.add.rectangle(-barWidth / 2, barY, barWidth, 5, item.trait === 'BOMB' ? 0xffea00 : 0xff0055)
        .setOrigin(0, 0.5);

      const badgePrefix = item.trait === 'BOMB' ? '💣 ' : item.trait === 'HEALER' ? '✨ ' : '';
      const hpText = this.add.text(0, barY - 9, `${badgePrefix}${item.data.hp}`, {
        fontFamily: "'Orbitron', sans-serif",
        fontSize: isBoss ? '12px' : '9.5px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3.5
      }).setOrigin(0.5);

      if (shieldRing) container.add(shieldRing);
      container.add([sprite, hpBg, hpBarFill, hpText]);

      this.tweens.add({
        targets: sprite,
        scaleX: 1.07,
        scaleY: 0.94,
        angle: idx % 2 === 0 ? 5 : -5,
        duration: 950 + (idx % 4) * 160,
        yoyo: true,
        repeat: -1
      });

      this.blocks.push({
        data: item.data,
        trait: item.trait,
        shieldHp: item.shieldHp,
        container,
        sprite,
        shieldRing,
        hpBarFill,
        hpText,
        lastElement: null
      });
    });
  }

  private spawnShatterParticles(x: number, y: number, color: number, count = 12): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const dist = 28 + Math.random() * 38;
      const shard = this.add.image(x, y, 'glow_spark').setTint(color).setScale(1.3);
      this.tweens.add({
        targets: shard,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.2,
        duration: 380,
        onComplete: () => shard.destroy()
      });
    }
  }

  private setupInputHandlers(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isVolleyActive || this.isGameOver) return;

      if (this.isForgeDrawerOpen) {
        const hitIdx = this.findNearestSlotIndex(pointer.x, pointer.y, 34);
        if (hitIdx !== -1 && this.saveData.gridRunes[hitIdx]) {
          this.dragSourceIdx = hitIdx;
          const cfg = OrbsConfig[this.saveData.gridRunes[hitIdx]!];
          this.dragGhostSprite = this.add.image(pointer.x, pointer.y, `orb_${cfg.element}_${cfg.tier}`)
            .setScale(0.95)
            .setDepth(35);
        }
        return;
      }

      if (pointer.y >= this.arenaBounds.top && pointer.y <= this.arenaBounds.bottom) {
        this.isAiming = true;
        this.updateAimAngle(pointer);
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isAiming && !this.isVolleyActive) {
        this.updateAimAngle(pointer);
      } else if (this.dragGhostSprite) {
        this.dragGhostSprite.setPosition(pointer.x, pointer.y);
      }
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.isAiming && !this.isVolleyActive) {
        this.isAiming = false;
        this.trajectoryGraphics.clear();
        this.fireElementalVolley();
        return;
      }

      if (this.dragSourceIdx !== null) {
        if (this.dragGhostSprite) {
          this.dragGhostSprite.destroy();
          this.dragGhostSprite = null;
        }
        const targetIdx = this.findNearestSlotIndex(pointer.x, pointer.y, 38);
        if (targetIdx !== -1) {
          const res = ForgeGrid.moveOrMergeSlot(this.saveData.gridRunes, this.dragSourceIdx, targetIdx);
          if (res.action === 'MERGED' && res.upgradedOrbId) {
            const newOrb = OrbsConfig[res.upgradedOrbId];
            SoundSynth.playUpgradeFanfare();
            const pt = this.slotCenters[targetIdx];
            this.spawnShatterParticles(pt.x, pt.y, newOrb.color, 14);
            this.showPopupBanner(pt.x, pt.y - 24, `MERGED: ${newOrb.name}!`, '#00f5a0');
            this.addOverdriveCharge(20);
          }
          SaveSystem.save(this.saveData);
          this.renderForgeGrid();
          this.renderCompactAmmoBelt();
        }
        this.dragSourceIdx = null;
      }
    });
  }

  private findNearestSlotIndex(px: number, py: number, maxDist: number): number {
    for (let i = 0; i < this.slotCenters.length; i++) {
      const dist = Phaser.Math.Distance.Between(px, py, this.slotCenters[i].x, this.slotCenters[i].y);
      if (dist <= maxDist) return i;
    }
    return -1;
  }

  private updateAimAngle(pointer: Phaser.Input.Pointer): void {
    let angle = Phaser.Math.Angle.Between(this.cannonX, this.cannonY, pointer.x, pointer.y);
    if (angle > -0.22 || angle < -Math.PI + 0.22) {
      angle = pointer.x < this.cannonX ? -Math.PI + 0.22 : -0.22;
    }
    this.aimAngleRad = angle;
    this.cannonSprite.setRotation(this.aimAngleRad);

    const pts = ArenaPhysics.computeTrajectoryPoints(this.cannonX, this.cannonY, this.aimAngleRad, this.arenaBounds, 18, 34);
    this.trajectoryGraphics.clear();
    for (let i = 0; i < pts.length; i++) {
      const alpha = 1 - (i / pts.length) * 0.65;
      this.trajectoryGraphics.fillStyle(this.isOverdriveActive ? 0x00f5a0 : 0x00f5ff, alpha * 0.5);
      this.trajectoryGraphics.fillCircle(pts[i].x, pts[i].y, 6);
      this.trajectoryGraphics.fillStyle(0xffffff, alpha);
      this.trajectoryGraphics.fillCircle(pts[i].x, pts[i].y, 2.8);
    }
  }

  private fireElementalVolley(): void {
    this.isVolleyActive = true;
    this.comboCount = 0;
    this.statusHintText.setVisible(false);

    const queue = ForgeGrid.extractFiringQueue(this.saveData.gridRunes);
    const overdriveMult = this.isOverdriveActive ? 2.0 : 1.0;
    const dmgMult = this.getDamageMultiplier() * overdriveMult;
    // High-Velocity Orbs (680 px/s normal, 820 px/s overdrive) so combat feels snappy & thrilling!
    const speed = this.isOverdriveActive ? 820 : 680;

    if (this.isOverdriveActive) {
      this.cameras.main.shake(180, 0.008);
      this.showPopupBanner(this.cannonX, this.cannonY - 56, '🔥 2X OVERDRIVE UNLEASHED! 🔥', '#00f5a0');
      this.isOverdriveActive = false;
      this.overdriveCharge = 0;
      this.overdriveText.setText('⚡\n0%');
      this.overdriveText.setColor('#ffffff');
      this.overdriveRing.setStrokeStyle(2.5, 0xffea00);
    }

    queue.forEach((orbCfg, index) => {
      this.time.delayedCall((index * 75) / this.gameSpeedMultiplier, () => {
        const sprite = this.add.image(this.cannonX, this.cannonY - 8, `orb_${orbCfg.element}_${orbCfg.tier}`)
          .setScale(0.48 + orbCfg.tier * 0.04);
        this.orbSprites.push(sprite);

        this.activeOrbs.push({
          x: this.cannonX,
          y: this.cannonY - 8,
          vx: Math.cos(this.aimAngleRad) * speed,
          vy: Math.sin(this.aimAngleRad) * speed,
          radius: 10 + orbCfg.tier,
          damage: Math.round(orbCfg.baseDamage * dmgMult),
          color: orbCfg.color,
          element: orbCfg.element,
          tier: orbCfg.tier,
          trail: [],
          active: true
        });
        SoundSynth.playBounceChime(1);
      });
    });
  }

  update(_time: number, delta: number): void {
    if (this.isGameOver) return;

    const realDt = Math.min(delta / 1000, 0.05);
    if (!this.isForgeDrawerOpen) {
      this.stageElapsedSeconds += realDt;
      this.updateSpeedBonusTimerUI();
    }

    const meta = WaveSpawner.getWaveMetadata(this.wave);
    const dt = Math.min(delta / 1000, 0.025) * this.gameSpeedMultiplier;

    for (const block of this.blocks) {
      // Only monsters descend; Bumper Walls stay fixed in place!
      if (block.trait === 'WALL') continue;

      block.data.y += meta.descentSpeed * dt;
      block.container.y = block.data.y;

      if (block.data.y + block.data.height / 2 >= this.cannonY - 22) {
        this.triggerGameOver();
        return;
      }
    }

    if (!this.isVolleyActive) return;

    this.orbsGraphics.clear();
    const activeBlockData = this.blocks.map((b) => b.data);

    this.activeOrbs.forEach((orb, idx) => {
      const sprite = this.orbSprites[idx];
      if (!orb.active) {
        if (sprite) sprite.setVisible(false);
        return;
      }

      orb.trail.push({ x: orb.x, y: orb.y });
      if (orb.trail.length > 9) orb.trail.shift();

      const res = ArenaPhysics.stepOrb(orb, dt, this.arenaBounds, activeBlockData);
      if (res.hitWall) {
        SoundSynth.playBounceChime(this.comboCount);
        this.spawnShatterParticles(orb.x, orb.y, orb.color, 5);
      }

      if (res.hitBlockId) {
        this.comboCount++;
        SoundSynth.playBounceChime(this.comboCount);
        this.addOverdriveCharge(5);
        this.applyBlockDamage(res.hitBlockId, orb.damage, orb.element, res.hitX, res.hitY);
      }

      for (let t = 0; t < orb.trail.length; t++) {
        const pt = orb.trail[t];
        const ratio = (t + 1) / orb.trail.length;
        this.orbsGraphics.fillStyle(orb.color, ratio * 0.65);
        this.orbsGraphics.fillCircle(pt.x, pt.y, orb.radius * ratio * 0.9);
      }

      if (sprite) {
        sprite.setPosition(orb.x, orb.y);
        sprite.rotation += 0.22;
      }
    });

    if (this.activeOrbs.length > 0 && this.activeOrbs.every((o) => !o.active)) {
      this.orbSprites.forEach((s) => s.destroy());
      this.orbSprites = [];
      this.activeOrbs = [];
      this.orbsGraphics.clear();
      this.isVolleyActive = false;
      this.onVolleyComplete();
    }
  }

  private updateSpeedBonusTimerUI(): void {
    const remaining = Math.max(0, this.targetBonusSeconds - this.stageElapsedSeconds);
    const ratio = remaining / this.targetBonusSeconds;
    this.bonusTimerBarFill.width = Math.max(2, ratio * 154);

    if (remaining > 0) {
      this.bonusTimerText.setText(`⏱️ 3★ SPEED BONUS: ${remaining.toFixed(1)}s (+50G)`);
      this.bonusTimerText.setColor(remaining > 12 ? '#00f5a0' : '#ffea00');
      this.bonusTimerBarFill.setFillStyle(remaining > 12 ? 0x00f5a0 : 0xffea00);
    } else {
      const twoStarRem = Math.max(0, this.targetBonusSeconds + 30 - this.stageElapsedSeconds);
      this.bonusTimerText.setText(twoStarRem > 0 ? `⏱️ 2★ TARGET: ${twoStarRem.toFixed(0)}s` : '⏱️ 1★ CLEAR MODE');
      this.bonusTimerText.setColor('#ff4081');
    }
  }

  private applyBlockDamage(blockId: string, baseDmg: number, hitElement: ElementType, hitX: number, hitY: number): void {
    const target = this.blocks.find((b) => b.data.id === blockId);
    if (!target || target.data.hp <= 0) return;

    // BUMPER WALL OBSTACLE: Indestructible pinball deflector!
    if (target.trait === 'WALL') {
      this.spawnShatterParticles(hitX, hitY, 0x00f5ff, 6);
      return;
    }

    let finalDamage = baseDmg;
    const coreLvl = this.saveData.grimoireLevels.empoweredCore || 1;
    const comboBoost = 1 + (coreLvl - 1) * 0.2;

    if (target.lastElement && target.lastElement !== hitElement) {
      const reaction = ElementalCombos.getComboMultiplier(target.lastElement, hitElement);
      if (reaction.multiplier > 1.0) {
        finalDamage = Math.round(baseDmg * reaction.multiplier * comboBoost);
        this.cameras.main.shake(90, 0.005);
        this.showPopupBanner(hitX, hitY - 22, reaction.label, reaction.color);
        this.addOverdriveCharge(12);
      }
    }
    target.lastElement = hitElement;

    if (target.shieldHp > 0) {
      target.shieldHp = Math.max(0, target.shieldHp - finalDamage);
      finalDamage = Math.round(finalDamage * 0.5);
      if (target.shieldHp <= 0 && target.shieldRing) {
        target.shieldRing.destroy();
        target.shieldRing = null;
        this.showPopupBanner(target.data.x, target.data.y - 24, 'SHIELD BROKEN!', '#00f5ff');
      }
    }

    target.data.hp = Math.max(0, target.data.hp - finalDamage);
    const badgePrefix = target.trait === 'BOMB' ? '💣 ' : target.trait === 'HEALER' ? '✨ ' : '';
    if (target.hpText) target.hpText.setText(`${badgePrefix}${target.data.hp}`);

    const barMaxW = target.data.width > 100 ? 110 : 38;
    if (target.hpBarFill) {
      target.hpBarFill.width = Math.max(0, (target.data.hp / target.data.maxHp) * barMaxW);
    }

    if (target.sprite instanceof Phaser.GameObjects.Image) {
      const img = target.sprite;
      img.setTintFill(0xffffff);
      this.time.delayedCall(60, () => {
        if (img && img.scene) img.clearTint();
      });
    }

    this.score += finalDamage * 10;
    this.updateHud();

    const dmgPopup = this.add.text(hitX, hitY - 8, `-${finalDamage}`, {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '13px',
      color: '#ffea00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.tweens.add({
      targets: dmgPopup,
      y: hitY - 34,
      alpha: 0,
      duration: 420,
      onComplete: () => dmgPopup.destroy()
    });

    if (target.data.hp <= 0) {
      this.destroyMonsterBlock(target);
    }
  }

  private destroyMonsterBlock(target: VisualBlock): void {
    SoundSynth.playShatterSound();
    this.spawnShatterParticles(target.data.x, target.data.y, target.data.color, 14);
    const bx = target.data.x;
    const by = target.data.y;
    const wasBomb = target.trait === 'BOMB';

    target.container.destroy();
    this.blocks = this.blocks.filter((b) => b.data.id !== target.data.id);

    const greedLvl = this.saveData.grimoireLevels.alchemistGreed || 1;
    const coinGain = Math.round(24 * (1 + (greedLvl - 1) * 0.25));
    this.saveData.coins += coinGain;
    SaveSystem.save(this.saveData);
    this.updateHud();

    // MASSIVE CHAIN-REACTION BOMB EXPLOSION!
    if (wasBomb) {
      this.cameras.main.shake(260, 0.015);
      this.showPopupBanner(bx, by - 18, '💥 MEGA BOMB BLAST! 💥', '#ffea00');
      this.spawnShatterParticles(bx, by, 0xff3d00, 26);

      // Visual shockwave ring
      const ring = this.add.circle(bx, by, 14, 0xffea00, 0.35).setStrokeStyle(3, 0xff3d00);
      this.tweens.add({
        targets: ring,
        radius: 145,
        alpha: 0,
        duration: 320,
        onComplete: () => ring.destroy()
      });

      const neighbors = [...this.blocks];
      for (const nb of neighbors) {
        if (nb.trait === 'WALL') continue;
        const dist = Phaser.Math.Distance.Between(bx, by, nb.data.x, nb.data.y);
        if (dist <= 155 && nb.data.hp > 0) {
          const splashDmg = Math.round(nb.data.maxHp * 0.75);
          nb.data.hp = Math.max(0, nb.data.hp - splashDmg);
          if (nb.hpText) nb.hpText.setText(`${nb.data.hp}`);
          const barMaxW = nb.data.width > 100 ? 110 : 38;
          if (nb.hpBarFill) {
            nb.hpBarFill.width = Math.max(0, (nb.data.hp / nb.data.maxHp) * barMaxW);
          }
          if (nb.data.hp <= 0) {
            this.destroyMonsterBlock(nb);
          }
        }
      }
    }
  }

  private showPopupBanner(x: number, y: number, text: string, color: string): void {
    const label = this.add.text(x, y, text, {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '11.5px',
      color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.tweens.add({
      targets: label,
      y: y - 30,
      alpha: 0,
      duration: 780,
      onComplete: () => label.destroy()
    });
  }

  private onVolleyComplete(): void {
    // Stage is cleared when all non-WALL monster blocks are destroyed!
    const remainingMonsters = this.blocks.filter((b) => b.trait !== 'WALL');

    if (remainingMonsters.length === 0) {
      const clearedWave = this.wave;
      const isFastClear = this.stageElapsedSeconds <= this.targetBonusSeconds;
      const isMediumClear = this.stageElapsedSeconds <= this.targetBonusSeconds + 30;
      const starsEarned = isFastClear ? 3 : isMediumClear ? 2 : 1;
      const timeBonusGold = isFastClear ? 50 : isMediumClear ? 20 : 0;

      const prevStars = this.saveData.stageStars[clearedWave] || 0;
      this.saveData.stageStars[clearedWave] = Math.max(prevStars, starsEarned);

      if (clearedWave >= this.saveData.highestWave) {
        this.saveData.highestWave = clearedWave + 1;
      }
      this.saveData.selectedStage = clearedWave + 1;

      const baseWaveReward = 65 + clearedWave * 12 + timeBonusGold;
      this.saveData.coins += baseWaveReward;
      SaveSystem.save(this.saveData);
      SoundSynth.playUpgradeFanfare();

      this.scene.start('RewardModalScene', {
        waveCleared: clearedWave,
        baseCoinsEarned: baseWaveReward,
        timeBonusGold,
        starsEarned,
        clearSeconds: Math.round(this.stageElapsedSeconds),
        score: this.score
      });
      return;
    }

    const healers = remainingMonsters.filter((b) => b.trait === 'HEALER' && b.data.hp > 0);
    if (healers.length > 0) {
      for (const b of remainingMonsters) {
        if (b.data.hp < b.data.maxHp) {
          const healAmt = Math.round(b.data.maxHp * 0.15);
          b.data.hp = Math.min(b.data.maxHp, b.data.hp + healAmt);
          if (b.hpText) b.hpText.setText(`${b.data.hp}`);
          const barMaxW = b.data.width > 100 ? 110 : 38;
          if (b.hpBarFill) {
            b.hpBarFill.width = Math.max(0, (b.data.hp / nbMaxHp(b)) * barMaxW);
          }
        }
      }
      this.showPopupBanner(healers[0].data.x, healers[0].data.y - 20, '✨ CRYSTAL REGEN +15%!', '#00f5a0');
    }

    this.statusHintText.setText('DRAG TO FIRE • TAP ⚒️ FORGE ICON TO MERGE RUNES');
    this.statusHintText.setVisible(true);
  }

  private triggerGameOver(): void {
    if (this.isGameOver) return;
    this.isGameOver = true;

    const { width, height } = ThemeConfig.screen;
    this.add.rectangle(width / 2, height / 2, width, height, 0x05020c, 0.9);

    this.add.text(width / 2, height / 2 - 95, 'SANCTUM BREACHED!', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '25px',
      color: '#ff0055',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - 48, `STAGE ${this.wave}   •   SCORE: ${this.score}`, {
      fontFamily: "'Chakra Petch', sans-serif",
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    ArtRenderer.createTactileButton(this, width / 2, height / 2 + 18, 'btn_GREEN_lg', '▶ AD: REVIVE STAGE', '12px', () => {
      AdService.getInstance().showRewardedAd(() => {
        for (const b of this.blocks) b.container.destroy();
        this.blocks = [];
        this.isGameOver = false;
        this.scene.restart({ selectedStage: this.wave });
      });
    });

    ArtRenderer.createTactileButton(this, width / 2, height / 2 + 82, 'btn_ORANGE_lg', '🗺️ SAGA WORLD MAP', '12px', () => {
      this.scene.start('MenuScene');
    });
  }

  private updateHud(): void {
    if (!this.coinsText) return;
    const meta = WaveSpawner.getWaveMetadata(this.wave);
    this.coinsText.setText(`${this.saveData.coins}`);
    this.waveBannerText.setText(`STAGE ${this.wave} • ${meta.biomeName}`);
  }
}

function nbMaxHp(b: VisualBlock): number {
  return b.data.maxHp || 100;
}
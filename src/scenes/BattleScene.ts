import Phaser from 'phaser';
import { ThemeConfig } from '../config/ThemeConfig';
import { OrbsConfig, ElementType } from '../config/OrbsConfig';
import { ArenaPhysics, ArenaBounds, BlockRect, ActiveOrb } from '../gameplay/ArenaPhysics';
import { ForgeGrid } from '../gameplay/ForgeGrid';
import { ElementalCombos } from '../gameplay/ElementalCombos';
import { WaveSpawner, MonsterTrait, PortalCoord } from '../gameplay/WaveSpawner';
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
  // Elemental Status Effects & Moving Wall State!
  freezeSeconds: number;
  burnTicks: number;
  wallOriginX: number;
  wallMoveDir: number;
}

interface FlyingOrb extends ActiveOrb {
  element: ElementType;
  tier: number;
  trail: { x: number; y: number }[];
  portalCooldown: number;
  flightSeconds: number;
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

  private readonly MAX_ORB_FLIGHT_SECONDS = 10.0;
  private volleyFlightSeconds = 0;
  private recallCountdownText!: Phaser.GameObjects.Text;

  // Liquid Alchemical Potion Flask Mission State
  private missionProgressHits = 0;
  private missionTargetHits = 15;
  private hyperBurstState: 'CHARGING' | 'READY' | 'ACTIVATED' | 'USED' = 'CHARGING';
  private activeVolleyTimeScale = 1.0;
  private potionLiquidFill!: Phaser.GameObjects.Rectangle;
  private missionText!: Phaser.GameObjects.Text;

  // Floating Parachute Mystery Gift State
  private parachuteSprite: Phaser.GameObjects.Image | null = null;
  private parachuteVx = 58;
  private nextParachuteSpawnTimer = 9.0;

  private entryPortals: PortalCoord[] = [];
  private exitPortals: PortalCoord[] = [];

  private stageElapsedSeconds = 0;
  private targetBonusSeconds = 45;
  private bonusTimerBarFill!: Phaser.GameObjects.Rectangle;
  private bonusTimerText!: Phaser.GameObjects.Text;

  private trajectoryGraphics!: Phaser.GameObjects.Graphics;
  private orbsGraphics!: Phaser.GameObjects.Graphics;
  private pedestalSprite!: Phaser.GameObjects.Image;
  private cannonSprite!: Phaser.GameObjects.Image;
  private coinsText!: Phaser.GameObjects.Text;
  private scoreTickerText!: Phaser.GameObjects.Text;
  private waveBannerText!: Phaser.GameObjects.Text;
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
  private maxVolleyCombo = 0;

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
    const meta = WaveSpawner.getWaveMetadata(this.wave);

    this.isGameOver = false;
    this.isVolleyActive = false;
    this.isForgeDrawerOpen = false;
    this.volleyFlightSeconds = 0;
    this.missionProgressHits = 0;
    this.missionTargetHits = meta.missionTargetHits;
    this.hyperBurstState = 'CHARGING';
    this.activeVolleyTimeScale = 1.0;
    this.maxVolleyCombo = 0;
    this.score = 0;
    this.parachuteSprite = null;
    this.nextParachuteSpawnTimer = 8.0;

    this.entryPortals = meta.entryPortals;
    this.exitPortals = meta.exitPortals;

    this.stageElapsedSeconds = 0;
    this.targetBonusSeconds = WaveSpawner.isBossWave(this.wave) ? 60 : 45;
    this.blocks = [];
    this.activeOrbs = [];
    this.orbSprites = [];

    const { width, height, topAdBannerHeight } = ThemeConfig.screen;

    this.arenaBounds = {
      left: 8,
      right: width - 8,
      top: 122,
      bottom: height - 130
    };
    this.cannonX = width / 2;
    this.cannonY = this.arenaBounds.bottom - 16;

    // 1. 10-STAGE CHAPTER WORLD THEME BACKGROUND
    ArtRenderer.drawDynamicBiomeWorld(this, width, height, meta.palette);

    // 2. MULTI-TUNNEL WORMHOLE PORTAL NETWORK
    this.createWormholePortals();

    // 3. TOP SAFE BANNER AD STRIP
    this.add.rectangle(width / 2, topAdBannerHeight / 2, width, topAdBannerHeight, 0x04020a, 0.94);
    this.add.text(width / 2, topAdBannerHeight / 2, 'ADMOB TOP BANNER AD (SAFE ZONE)', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '9.5px',
      color: '#00f5ff'
    }).setOrigin(0.5);

    // 4. LUXURY ESPORTS SCOREBOARD CREST HUD
    this.createLuxuryScoreboardHud(width);

    // 5. ROYAL DRAGON-PHOENIX LAUNCHER PEDESTAL + LIQUID POTION FLASK BUTTON
    this.createBottomCombatDeck(width, height);

    // 6. SLIDE-UP HOLOGRAPHIC FORGE DRAWER
    this.createSlideUpForgeDrawer(height);

    // 7. GRAPHICS LAYERS
    this.trajectoryGraphics = this.add.graphics();
    this.orbsGraphics = this.add.graphics();

    this.spawnNewWaveBlocks();
    this.setupInputHandlers();
  }

  private createWormholePortals(): void {
    this.entryPortals.forEach((pt, idx) => {
      const entrySprite = this.add.image(pt.x, pt.y, 'portal_BLUE').setScale(0.84);
      this.add.text(pt.x, pt.y + 28, `🌀 IN ${idx + 1}`, {
        fontFamily: "'Orbitron', sans-serif",
        fontSize: '7.5px',
        color: '#00f5ff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5);

      this.tweens.add({
        targets: entrySprite,
        angle: 360,
        duration: 3000,
        repeat: -1
      });
    });

    this.exitPortals.forEach((pt, idx) => {
      const exitSprite = this.add.image(pt.x, pt.y, 'portal_ORANGE').setScale(0.84);
      this.add.text(pt.x, pt.y + 28, `🌀 OUT ${idx + 1}`, {
        fontFamily: "'Orbitron', sans-serif",
        fontSize: '7.5px',
        color: '#ffea00',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5);

      this.tweens.add({
        targets: exitSprite,
        angle: -360,
        duration: 3000,
        repeat: -1
      });
    });
  }

  private createLuxuryScoreboardHud(width: number): void {
    this.add.image(width / 2, 86, 'scoreboard_crest');

    this.add.image(28, 78, 'icon_coin').setScale(1.0);
    this.coinsText = this.add.text(44, 78, '', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '12.5px',
      color: '#ffea00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
      shadow: { offsetX: 0, offsetY: 2, color: '#000000', blur: 3, fill: true }
    }).setOrigin(0, 0.5);

    this.waveBannerText = this.add.text(width / 2, 66, '', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '9.5px',
      color: '#00f5ff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.scoreTickerText = this.add.text(width / 2, 83, 'SCORE 000,000', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#160936',
      strokeThickness: 4,
      shadow: { offsetX: 0, offsetY: 2, color: '#00f5ff', blur: 4, fill: true }
    }).setOrigin(0.5);

    const barW = 152;
    this.add.rectangle(width / 2, 100, barW, 6, 0x05020c, 0.95).setStrokeStyle(1, 0xffca28);
    this.bonusTimerBarFill = this.add.rectangle(width / 2 - barW / 2 + 1, 100, barW - 2, 4, 0x00f5a0).setOrigin(0, 0.5);

    this.bonusTimerText = this.add.text(width / 2, 112, '', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '8.5px',
      color: '#00f5a0',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    const mapIcon = this.add.image(width - 36, 80, 'medallion_MAGENTA').setScale(0.66).setInteractive({ useHandCursor: true });
    this.add.text(width - 36, 80, '🗺️\nMAP', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '8px',
      color: '#ffffff',
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    mapIcon.on('pointerdown', () => this.scene.start('MenuScene'));
  }

  private createBottomCombatDeck(width: number, height: number): void {
    const line = this.add.graphics();
    line.lineStyle(1.5, 0xff0055, 0.35);
    line.lineBetween(16, this.cannonY - 26, width - 16, this.cannonY - 26);

    this.pedestalSprite = this.add.image(this.cannonX, this.cannonY, 'cannon_pedestal_ring')
      .setScale(0.88)
      .setAlpha(0.92);
    this.tweens.add({
      targets: this.pedestalSprite,
      angle: 360,
      duration: 9000,
      repeat: -1
    });

    this.cannonSprite = this.add.image(this.cannonX, this.cannonY, 'cannon_turret')
      .setRotation(-Math.PI / 2);

    this.recallCountdownText = this.add.text(this.cannonX, this.cannonY - 42, '', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '9.5px',
      color: '#ffea00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setVisible(false);

    this.statusHintText = this.add.text(width / 2, this.cannonY - 48, '❄️ ICE FREEZES • 🔥 FIRE BURNS • SHOOT 🎁 PARACHUTES!', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '8.5px',
      color: '#00f5ff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.ammoBeltContainer = this.add.container(0, 0);
    this.renderCompactAmmoBelt();

    // Left Floating Control: 🧪 3D Glass Alchemical Potion Flask with Rising Liquid!
    const msX = 48;
    const msY = height - 64;
    this.potionLiquidFill = this.add.rectangle(msX, msY + 22, 34, 2, 0x00f5a0, 0.85).setOrigin(0.5, 1);
    const flaskImg = this.add.image(msX, msY, 'potion_flask_glass').setScale(0.95).setInteractive({ useHandCursor: true });

    this.missionText = this.add.text(msX, msY + 4, `🧪\n0/${this.missionTargetHits}`, {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '8.5px',
      color: '#ffffff',
      align: 'center',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3.5
    }).setOrigin(0.5);

    flaskImg.on('pointerdown', () => {
      if (this.hyperBurstState === 'READY' && !this.isVolleyActive) {
        this.hyperBurstState = 'ACTIVATED';
        SoundSynth.playUpgradeFanfare();
        this.missionText.setText('🔥\nARMED!');
        this.missionText.setColor('#ffea00');
        this.potionLiquidFill.setFillStyle(0xff007f);
        this.showPopupBanner(width / 2, this.cannonY - 68, '🧪 ELIXIR OVERDRIVE ARMED FOR NEXT SHOT! 🧪', '#00f5a0');
      } else if (this.hyperBurstState === 'CHARGING') {
        this.showPopupBanner(msX + 45, msY - 36, `HIT ${this.missionTargetHits - this.missionProgressHits} MORE GEMS TO FILL FLASK!`, '#ffea00');
      }
    });

    const forgeBtnX = width - 48;
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

  private advanceMissionProgress(steps: number): void {
    if (this.hyperBurstState !== 'CHARGING') return;
    this.missionProgressHits = Math.min(this.missionTargetHits, this.missionProgressHits + steps);
    const ratio = this.missionProgressHits / this.missionTargetHits;
    this.potionLiquidFill.height = Math.max(2, Math.round(ratio * 34));

    if (this.missionProgressHits >= this.missionTargetHits) {
      this.hyperBurstState = 'READY';
      SoundSynth.playUpgradeFanfare();
      this.missionText.setText('⚡ TAP\nFLASK!');
      this.missionText.setColor('#ffea00');
      this.potionLiquidFill.setFillStyle(0xffea00);
      this.showPopupBanner(ThemeConfig.screen.width / 2, this.cannonY - 68, '🧪 POTION FULL! TAP FLASK FOR 2.2X BURST!', '#ffea00');
    } else {
      this.missionText.setText(`🧪\n${this.missionProgressHits}/${this.missionTargetHits}`);
    }
  }

  private renderCompactAmmoBelt(): void {
    this.ammoBeltContainer.removeAll(true);
    const { width, height } = ThemeConfig.screen;
    const dmgMult = this.getDamageMultiplier();
    const beltY = height - 58;

    const label = this.add.text(width / 2, beltY - 34, 'DRAGON-FORGE AMMO QUEUE', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '8px',
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
          fontSize: '9px',
          color: '#ffea00',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 3.5
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

  private getDamageMultiplier(): number {
    const lvl = this.saveData.grimoireLevels.volatileMix || 1;
    return 1 + (lvl - 1) * 0.15;
  }

  private spawnNewWaveBlocks(): void {
    const rawBlocks = WaveSpawner.spawnWaveBlocks(this.wave, this.arenaBounds.top + 10, ThemeConfig.screen.width);
    this.updateHud();

    // Cinematic Boss Warning Cutscene Banner on Every 10th Stage!
    if (WaveSpawner.isBossWave(this.wave)) {
      this.showBossWarningCutscene();
    }

    rawBlocks.forEach((item, idx) => {
      const isBoss = item.archetype.isBoss;
      const isWall = item.trait === 'WALL';
      const isBomb = item.trait === 'BOMB';
      const isPrism2X = item.trait === 'PRISM';
      const isPrism3X = item.trait === 'PRISM_3X';
      const container = this.add.container(item.data.x, item.data.y);

      if (isWall) {
        const wallGlow = this.add.rectangle(0, 0, item.data.width + 6, item.data.height + 6, 0x00f5ff, 0.32);
        const wallBar = this.add.rectangle(0, 0, item.data.width, item.data.height, 0x14082e)
          .setStrokeStyle(2.5, 0x00f5ff);

        const isVert = item.data.height > item.data.width;
        const coreLine = this.add.rectangle(
          0,
          0,
          isVert ? 4 : item.data.width - 12,
          isVert ? item.data.height - 12 : 4,
          0xffca28,
          0.9
        );

        container.add([wallGlow, wallBar, coreLine]);
        this.blocks.push({
          data: item.data,
          trait: 'WALL',
          shieldHp: 0,
          container,
          sprite: wallBar,
          shieldRing: null,
          hpBarFill: null,
          hpText: null,
          lastElement: null,
          freezeSeconds: 0,
          burnTicks: 0,
          wallOriginX: item.data.x,
          wallMoveDir: idx % 2 === 0 ? 1 : -1
        });
        return;
      }

      const sprite = this.add.image(0, 0, item.texKey);

      if (isBomb || isPrism2X || isPrism3X) {
        const tagStr = isBomb ? '☠️ TRAP' : isPrism3X ? '🔥 3X SPLIT' : '💎 2X SPLIT';
        const tagColor = isBomb ? '#ff1744' : isPrism3X ? '#ff007f' : '#00f5ff';
        const pillBg = this.add.image(0, -item.data.height / 2 - 9, 'hp_pill_badge');
        const specialText = this.add.text(0, -item.data.height / 2 - 9, tagStr, {
          fontFamily: "'Orbitron', sans-serif",
          fontSize: '8px',
          color: tagColor,
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 3
        }).setOrigin(0.5);

        container.add([sprite, pillBg, specialText]);

        this.tweens.add({
          targets: sprite,
          angle: isBomb ? 360 : -360,
          duration: isBomb ? 5000 : 3400,
          repeat: -1
        });

        this.blocks.push({
          data: item.data,
          trait: item.trait,
          shieldHp: 0,
          container,
          sprite,
          shieldRing: null,
          hpBarFill: null,
          hpText: specialText,
          lastElement: null,
          freezeSeconds: 0,
          burnTicks: 0,
          wallOriginX: item.data.x,
          wallMoveDir: 0
        });
        return;
      }

      let shieldRing: Phaser.GameObjects.Arc | null = null;
      if (item.shieldHp > 0) {
        shieldRing = this.add.circle(0, 0, isBoss ? 52 : 27, 0x00f5ff, 0.18)
          .setStrokeStyle(2.2, 0x00f5ff);
      }

      const barWidth = isBoss ? 110 : 38;
      const barY = -item.data.height / 2 - 4;
      const hpBg = this.add.rectangle(0, barY, barWidth, 5, 0x05020c, 0.9);
      const hpBarFill = this.add.rectangle(-barWidth / 2, barY, barWidth, 5, 0x00f5a0)
        .setOrigin(0, 0.5);

      const pillBadge = this.add.image(0, barY - 11, 'hp_pill_badge').setScale(isBoss ? 1.25 : 0.92);
      const badgePrefix = item.trait === 'HEALER' ? '✨' : '';
      const hpText = this.add.text(0, barY - 11, `${badgePrefix}${item.data.hp}`, {
        fontFamily: "'Orbitron', sans-serif",
        fontSize: isBoss ? '11.5px' : '9.5px',
        color: '#ffea00',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3.5
      }).setOrigin(0.5);

      if (shieldRing) container.add(shieldRing);
      container.add([sprite, hpBg, hpBarFill, pillBadge, hpText]);

      this.tweens.add({
        targets: sprite,
        scaleX: 1.06,
        scaleY: 0.95,
        duration: 900 + (idx % 4) * 160,
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
        lastElement: null,
        freezeSeconds: 0,
        burnTicks: 0,
        wallOriginX: item.data.x,
        wallMoveDir: 0
      });
    });
  }

  private showBossWarningCutscene(): void {
    const { width, height } = ThemeConfig.screen;
    this.cameras.main.shake(450, 0.015);
    SoundSynth.playUpgradeFanfare();

    const bannerGroup = this.add.container(0, height / 2 - 60).setDepth(45);
    const strip = this.add.rectangle(width / 2, 0, width, 78, 0x4a0018, 0.92)
      .setStrokeStyle(3, 0xff1744);
    const warnTxt = this.add.text(width / 2, -12, '⚠️ WARNING: TITAN BOSS APPROACHING! ⚠️', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '13px',
      color: '#ffea00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    const subTxt = this.add.text(width / 2, 14, `STAGE ${this.wave} SOVEREIGN GUARDIAN`, {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '11px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    bannerGroup.add([strip, warnTxt, subTxt]);
    this.tweens.add({
      targets: bannerGroup,
      alpha: 0,
      delay: 1600,
      duration: 400,
      onComplete: () => bannerGroup.destroy()
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
            this.advanceMissionProgress(5);
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
    const isArmed = this.hyperBurstState === 'ACTIVATED';
    for (let i = 0; i < pts.length; i++) {
      const alpha = 1 - (i / pts.length) * 0.65;
      this.trajectoryGraphics.fillStyle(isArmed ? 0x00f5a0 : 0x00f5ff, alpha * 0.55);
      this.trajectoryGraphics.fillCircle(pts[i].x, pts[i].y, 6);
      this.trajectoryGraphics.fillStyle(0xffffff, alpha);
      this.trajectoryGraphics.fillCircle(pts[i].x, pts[i].y, 2.8);
    }
  }

  private fireElementalVolley(): void {
    this.isVolleyActive = true;
    this.volleyFlightSeconds = 0;
    this.comboCount = 0;
    this.statusHintText.setVisible(false);
    this.recallCountdownText.setVisible(true);

    const queue = ForgeGrid.extractFiringQueue(this.saveData.gridRunes);
    const isOneTimeBurst = this.hyperBurstState === 'ACTIVATED';
    this.activeVolleyTimeScale = isOneTimeBurst ? 1.85 : 1.0;

    const burstDmgMult = isOneTimeBurst ? 2.2 : 1.0;
    const dmgMult = this.getDamageMultiplier() * burstDmgMult;
    const speed = 640;

    if (isOneTimeBurst) {
      this.cameras.main.shake(200, 0.009);
      this.showPopupBanner(this.cannonX, this.cannonY - 56, '🧪 ELIXIR OVERDRIVE UNLEASHED! (2.2X DMG) 🧪', '#00f5a0');
      this.hyperBurstState = 'USED';
      this.missionText.setText('✓\nUSED');
      this.missionText.setColor('#90a4ae');
      this.potionLiquidFill.height = 2;
    }

    queue.forEach((orbCfg, index) => {
      this.time.delayedCall((index * 80) / this.activeVolleyTimeScale, () => {
        if (!this.isVolleyActive) return;

        const muzzleX = this.cannonX + Math.cos(this.aimAngleRad) * 28;
        const muzzleY = this.cannonY + Math.sin(this.aimAngleRad) * 28;
        this.spawnShatterParticles(muzzleX, muzzleY, orbCfg.color, 6);

        this.tweens.add({
          targets: this.cannonSprite,
          x: this.cannonX - Math.cos(this.aimAngleRad) * 6,
          y: this.cannonY - Math.sin(this.aimAngleRad) * 6,
          scaleX: 1.12,
          scaleY: 0.9,
          duration: 45,
          yoyo: true
        });

        const sprite = this.add.image(muzzleX, muzzleY, `orb_${orbCfg.element}_${orbCfg.tier}`)
          .setScale(0.48 + orbCfg.tier * 0.04);
        this.orbSprites.push(sprite);

        this.activeOrbs.push({
          x: muzzleX,
          y: muzzleY,
          vx: Math.cos(this.aimAngleRad) * speed,
          vy: Math.sin(this.aimAngleRad) * speed,
          radius: 10 + orbCfg.tier,
          damage: Math.round(orbCfg.baseDamage * dmgMult),
          color: orbCfg.color,
          element: orbCfg.element,
          tier: orbCfg.tier,
          trail: [],
          portalCooldown: 0,
          flightSeconds: 0,
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
      this.updateParachuteMysteryGift(realDt);
    }

    const meta = WaveSpawner.getWaveMetadata(this.wave);
    const dt = Math.min(delta / 1000, 0.025) * (this.isVolleyActive ? this.activeVolleyTimeScale : 1.0);

    for (const block of this.blocks) {
      // 1. Dynamic Sliding Bumper Walls (Horizontal walls oscillate left & right on Stage 3+!)
      if (block.trait === 'WALL') {
        if (this.wave >= 3 && block.data.width > block.data.height && block.wallMoveDir !== 0) {
          block.data.x += block.wallMoveDir * 38 * realDt;
          if (Math.abs(block.data.x - block.wallOriginX) > 42) {
            block.wallMoveDir *= -1;
          }
          block.container.x = block.data.x;
        }
        continue;
      }

      if (block.trait === 'BOMB' || block.trait === 'PRISM' || block.trait === 'PRISM_3X') {
        continue;
      }

      // 2. Ice Freeze Status Effect: Pauses crystal descent while frozen!
      if (block.freezeSeconds > 0) {
        block.freezeSeconds = Math.max(0, block.freezeSeconds - realDt);
        if (block.freezeSeconds <= 0 && block.sprite instanceof Phaser.GameObjects.Image) {
          block.sprite.clearTint();
        }
        continue;
      }

      block.data.y += meta.descentSpeed * realDt;
      block.container.y = block.data.y;

      if (block.data.y + block.data.height / 2 >= this.cannonY - 22) {
        this.triggerGameOver();
        return;
      }
    }

    if (!this.isVolleyActive) return;

    this.volleyFlightSeconds += realDt;
    const remVolley = Math.max(0, this.MAX_ORB_FLIGHT_SECONDS - this.volleyFlightSeconds);
    if (remVolley <= 5.0) {
      this.recallCountdownText.setText(`⚡ AUTO-RECALL IN ${remVolley.toFixed(1)}s`);
      this.recallCountdownText.setColor(remVolley <= 2.0 ? '#ff4081' : '#ffea00');
    } else {
      this.recallCountdownText.setText('');
    }

    this.orbsGraphics.clear();
    const activeBlockData = this.blocks.map((b) => b.data);

    for (let idx = 0; idx < this.activeOrbs.length; idx++) {
      const orb = this.activeOrbs[idx];
      const sprite = this.orbSprites[idx];
      if (!orb.active) {
        if (sprite) sprite.setVisible(false);
        continue;
      }

      orb.flightSeconds += realDt;
      if (orb.flightSeconds >= this.MAX_ORB_FLIGHT_SECONDS || this.volleyFlightSeconds >= this.MAX_ORB_FLIGHT_SECONDS + 0.5) {
        orb.active = false;
        if (sprite) sprite.setVisible(false);
        this.spawnShatterParticles(orb.x, orb.y, orb.color, 10);
        SoundSynth.playBounceChime(6);
        continue;
      }

      if (orb.portalCooldown > 0) orb.portalCooldown -= realDt;

      // Check collision with Floating Parachute Mystery Gift Box!
      if (this.parachuteSprite) {
        const distGift = Phaser.Math.Distance.Between(orb.x, orb.y, this.parachuteSprite.x, this.parachuteSprite.y);
        if (distGift <= 32) {
          const gx = this.parachuteSprite.x;
          const gy = this.parachuteSprite.y;
          this.parachuteSprite.destroy();
          this.parachuteSprite = null;
          this.saveData.coins += 100;
          SaveSystem.save(this.saveData);
          this.updateHud();
          SoundSynth.playUpgradeFanfare();
          this.spawnShatterParticles(gx, gy, 0xffea00, 18);
          this.showPopupBanner(gx, gy - 18, '🎁 PARACHUTE LOOT! +100 GOLD! 🎁', '#ffea00');
        }
      }

      if (orb.portalCooldown <= 0 && this.exitPortals.length > 0) {
        for (const entryPt of this.entryPortals) {
          const distToEntry = Phaser.Math.Distance.Between(orb.x, orb.y, entryPt.x, entryPt.y);
          if (distToEntry <= 26) {
            const chosenExit = this.exitPortals[Math.floor(Math.random() * this.exitPortals.length)];
            orb.x = chosenExit.x;
            orb.y = chosenExit.y;
            orb.vy = Math.abs(orb.vy) * 0.95;
            orb.portalCooldown = 1.1;
            orb.trail = [];
            SoundSynth.playUpgradeFanfare();
            this.spawnShatterParticles(chosenExit.x, chosenExit.y, 0xffea00, 10);
            break;
          }
        }
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
        this.maxVolleyCombo = Math.max(this.maxVolleyCombo, this.comboCount);
        SoundSynth.playBounceChime(this.comboCount);
        this.checkComboStreakAnnouncement(this.comboCount);
        this.applyBlockInteraction(orb, res.hitBlockId, res.hitX, res.hitY);
      }

      for (let t = 0; t < orb.trail.length; t++) {
        const pt = orb.trail[t];
        const ratio = (t + 1) / orb.trail.length;
        this.orbsGraphics.fillStyle(orb.color, ratio * 0.65);
        this.orbsGraphics.fillCircle(pt.x, pt.y, orb.radius * ratio * 0.9);
      }

      if (sprite && orb.active) {
        sprite.setPosition(orb.x, orb.y);
        sprite.rotation += 0.2;
      }
    }

    if (this.activeOrbs.length > 0 && this.activeOrbs.every((o) => !o.active)) {
      this.orbSprites.forEach((s) => s.destroy());
      this.orbSprites = [];
      this.activeOrbs = [];
      this.orbsGraphics.clear();
      this.activeVolleyTimeScale = 1.0;
      this.isVolleyActive = false;
      this.recallCountdownText.setVisible(false);
      this.onVolleyComplete();
    }
  }

  /**
   * Spawns & drifts a Golden Parachute Mystery Gift across the arena sky!
   */
  private updateParachuteMysteryGift(dt: number): void {
    if (!this.parachuteSprite) {
      this.nextParachuteSpawnTimer -= dt;
      if (this.nextParachuteSpawnTimer <= 0) {
        this.nextParachuteSpawnTimer = 15.0;
        this.parachuteVx = Math.random() < 0.5 ? 54 : -54;
        const startX = this.parachuteVx > 0 ? 24 : ThemeConfig.screen.width - 24;
        this.parachuteSprite = this.add.image(startX, 195, 'parachute_gift').setScale(0.86);
      }
      return;
    }

    this.parachuteSprite.x += this.parachuteVx * dt;
    this.parachuteSprite.y += Math.sin(this.stageElapsedSeconds * 4) * 0.35;

    if (this.parachuteSprite.x < 18 || this.parachuteSprite.x > ThemeConfig.screen.width - 18) {
      this.parachuteSprite.destroy();
      this.parachuteSprite = null;
    }
  }

  private checkComboStreakAnnouncement(combo: number): void {
    const cx = ThemeConfig.screen.width / 2;
    if (combo === 12) {
      this.showPopupBanner(cx, 220, '🔥 12x SUPER COMBO! 🔥', '#00f5ff');
    } else if (combo === 25) {
      this.cameras.main.shake(120, 0.005);
      this.showPopupBanner(cx, 210, '⚡ 25x ULTRA STREAK! ⚡', '#ffea00');
    } else if (combo === 40) {
      this.cameras.main.shake(180, 0.008);
      this.showPopupBanner(cx, 200, '👑 40x GODLIKE RICHOCHET! 👑', '#00f5a0');
    }
  }

  private updateSpeedBonusTimerUI(): void {
    const remaining = Math.max(0, this.targetBonusSeconds - this.stageElapsedSeconds);
    const ratio = remaining / this.targetBonusSeconds;
    this.bonusTimerBarFill.width = Math.max(2, ratio * 150);

    if (remaining > 0) {
      this.bonusTimerText.setText(`⏱️ 3★ BONUS: ${remaining.toFixed(1)}s (+50G)`);
      this.bonusTimerText.setColor(remaining > 12 ? '#00f5a0' : '#ffea00');
      this.bonusTimerBarFill.setFillStyle(remaining > 12 ? 0x00f5a0 : 0xffea00);
    } else {
      const twoStarRem = Math.max(0, this.targetBonusSeconds + 30 - this.stageElapsedSeconds);
      this.bonusTimerText.setText(twoStarRem > 0 ? `⏱️ 2★ TARGET: ${twoStarRem.toFixed(0)}s` : '⏱️ 1★ CLEAR MODE');
      this.bonusTimerText.setColor('#ff4081');
    }
  }

  private applyBlockInteraction(orb: FlyingOrb, blockId: string, hitX: number, hitY: number): void {
    const target = this.blocks.find((b) => b.data.id === blockId);
    if (!target || target.data.hp <= 0) return;

    if (target.trait === 'WALL') {
      this.spawnShatterParticles(hitX, hitY, 0x00f5ff, 6);
      return;
    }

    if (target.trait === 'PRISM' || target.trait === 'PRISM_3X') {
      const isTriple = target.trait === 'PRISM_3X';
      SoundSynth.playUpgradeFanfare();
      this.spawnShatterParticles(target.data.x, target.data.y, isTriple ? 0xff007f : 0x00f5ff, 22);
      this.showPopupBanner(
        target.data.x,
        target.data.y - 22,
        isTriple ? '🔥 3X JACKPOT PRISM! +3 CLONES! 🔥' : '💎 2X PRISM! +2 CLONES! 💎',
        isTriple ? '#ffea00' : '#00f5ff'
      );

      const speed = Math.hypot(orb.vx, orb.vy) || 640;
      const offsets = isTriple ? [-0.65, 0, 0.65] : [-0.55, 0.55];

      offsets.forEach((angleOffset) => {
        const baseAngle = Math.atan2(orb.vy, orb.vx) + angleOffset;
        const cloneSprite = this.add.image(target.data.x, target.data.y, `orb_${orb.element}_${orb.tier}`)
          .setScale(0.46 + orb.tier * 0.04);
        this.orbSprites.push(cloneSprite);

        this.activeOrbs.push({
          x: target.data.x,
          y: target.data.y,
          vx: Math.cos(baseAngle) * speed,
          vy: Math.sin(baseAngle) * speed,
          radius: orb.radius,
          damage: orb.damage,
          color: orb.color,
          element: orb.element,
          tier: orb.tier,
          trail: [],
          portalCooldown: 0.4,
          flightSeconds: orb.flightSeconds,
          active: true
        });
      });

      target.data.hp = 0;
      target.container.destroy();
      this.blocks = this.blocks.filter((b) => b.data.id !== blockId);
      return;
    }

    if (target.trait === 'BOMB') {
      orb.active = false;
      this.stageElapsedSeconds += 6;
      SoundSynth.playShatterSound();
      this.cameras.main.shake(220, 0.013);
      this.spawnShatterParticles(target.data.x, target.data.y, 0xff1744, 22);
      this.showPopupBanner(target.data.x, target.data.y - 20, '☠️ HAZARD TRAP! ORB LOST & -6s TIME!', '#ff1744');

      target.data.hp = 0;
      target.container.destroy();
      this.blocks = this.blocks.filter((b) => b.data.id !== blockId);
      return;
    }

    this.advanceMissionProgress(1);

    // Apply Elemental Status Effects: ICE freezes descent for 3s; FIRE applies Burn ticks!
    if (orb.element === 'ICE') {
      target.freezeSeconds = 3.0;
    } else if (orb.element === 'FIRE') {
      target.burnTicks = 2;
    }

    let finalDamage = orb.damage;
    const coreLvl = this.saveData.grimoireLevels.empoweredCore || 1;
    const comboBoost = 1 + (coreLvl - 1) * 0.2;

    if (target.lastElement && target.lastElement !== orb.element) {
      const reaction = ElementalCombos.getComboMultiplier(target.lastElement, orb.element);
      if (reaction.multiplier > 1.0) {
        finalDamage = Math.round(orb.damage * reaction.multiplier * comboBoost);
        this.cameras.main.shake(90, 0.005);
        this.showPopupBanner(hitX, hitY - 22, reaction.label, reaction.color);
        this.advanceMissionProgress(2);
      }
    }
    target.lastElement = orb.element;

    if (target.shieldHp > 0) {
      target.shieldHp = Math.max(0, target.shieldHp - finalDamage);
      finalDamage = Math.round(finalDamage * 0.5);
      if (target.shieldHp <= 0 && target.shieldRing) {
        target.shieldRing.destroy();
        target.shieldRing = null;
        this.showPopupBanner(target.data.x, target.data.y - 24, 'SHIELD SHATTERED!', '#00f5ff');
      }
    }

    target.data.hp = Math.max(0, target.data.hp - finalDamage);
    const statusIcon = target.freezeSeconds > 0 ? '❄️' : target.burnTicks > 0 ? '🔥' : target.trait === 'HEALER' ? '✨' : '';
    if (target.hpText) target.hpText.setText(`${statusIcon}${target.data.hp}`);

    const barMaxW = target.data.width > 100 ? 110 : 38;
    if (target.hpBarFill) {
      target.hpBarFill.width = Math.max(0, (target.data.hp / target.data.maxHp) * barMaxW);
    }

    if (target.sprite instanceof Phaser.GameObjects.Image) {
      const img = target.sprite;
      img.setTintFill(0xffffff);
      this.time.delayedCall(60, () => {
        if (img && img.scene) {
          if (target.freezeSeconds > 0) img.setTint(0x80d8ff);
          else img.clearTint();
        }
      });
    }

    this.score += finalDamage * 10;
    this.updateHud();

    const dmgPopup = this.add.text(hitX, hitY - 8, `-${finalDamage}`, {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '13.5px',
      color: '#ffea00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
      shadow: { offsetX: 0, offsetY: 2, color: '#ff3d00', blur: 3, fill: true }
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
    this.spawnShatterParticles(target.data.x, target.data.y, target.data.color, 15);
    target.container.destroy();
    this.blocks = this.blocks.filter((b) => b.data.id !== target.data.id);

    const greedLvl = this.saveData.grimoireLevels.alchemistGreed || 1;
    const coinGain = Math.round(24 * (1 + (greedLvl - 1) * 0.25));
    this.saveData.coins += coinGain;
    SaveSystem.save(this.saveData);
    this.updateHud();
  }

  private showPopupBanner(x: number, y: number, text: string, color: string): void {
    const label = this.add.text(x, y, text, {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '11px',
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
    // Process Fire Burn DoT ticks on surviving monsters!
    const burnTargets = this.blocks.filter((b) => b.burnTicks > 0 && b.data.hp > 0);
    for (const bt of burnTargets) {
      bt.burnTicks--;
      const burnDmg = Math.max(8, Math.round(bt.data.maxHp * 0.1));
      bt.data.hp = Math.max(0, bt.data.hp - burnDmg);
      if (bt.hpText) bt.hpText.setText(`🔥${bt.data.hp}`);
      const barMaxW = bt.data.width > 100 ? 110 : 38;
      if (bt.hpBarFill) {
        bt.hpBarFill.width = Math.max(0, (bt.data.hp / nbMaxHp(bt)) * barMaxW);
      }
      this.showPopupBanner(bt.data.x, bt.data.y - 16, `🔥 BURN -${burnDmg}`, '#ff6d00');
      if (bt.data.hp <= 0) {
        this.destroyMonsterBlock(bt);
      }
    }

    const remainingTargets = this.blocks.filter(
      (b) => b.trait !== 'WALL' && b.trait !== 'BOMB' && b.trait !== 'PRISM' && b.trait !== 'PRISM_3X'
    );

    if (remainingTargets.length === 0) {
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
        maxCombo: this.maxVolleyCombo,
        score: this.score
      });
      return;
    }

    const healers = remainingTargets.filter((b) => b.trait === 'HEALER' && b.data.hp > 0);
    if (healers.length > 0) {
      for (const b of remainingTargets) {
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

    this.statusHintText.setText('❄️ ICE FREEZES • 🔥 FIRE BURNS • SHOOT 🎁 PARACHUTES!');
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

    this.add.text(width / 2, height / 2 - 48, `STAGE ${this.wave}   •   SCORE: ${this.score.toLocaleString()}`, {
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
    this.coinsText.setText(`${this.saveData.coins.toLocaleString()}`);
    this.waveBannerText.setText(`STAGE ${this.wave} • ${meta.biomeName}`);

    if (this.scoreTickerText) {
      const formatted = this.score.toLocaleString().padStart(7, '0');
      this.scoreTickerText.setText(`SCORE ${formatted}`);
    }
  }
}

function nbMaxHp(b: VisualBlock): number {
  return b.data.maxHp || 100;
}
import Phaser from 'phaser';
import { ThemeConfig } from '../config/ThemeConfig';
import { OrbsConfig, ElementType } from '../config/OrbsConfig';
import { ArenaPhysics, ArenaBounds, BlockRect, ActiveOrb } from '../gameplay/ArenaPhysics';
import { ForgeGrid } from '../gameplay/ForgeGrid';
import { ElementalCombos } from '../gameplay/ElementalCombos';
import { WaveSpawner } from '../gameplay/WaveSpawner';
import { SoundSynth } from '../core/SoundSynth';
import { SaveSystem, PlayerSaveData } from '../core/SaveSystem';
import { AdService } from '../core/AdService';
import { ArtRenderer } from '../ui/ArtRenderer';

interface VisualBlock {
  data: BlockRect;
  container: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Image;
  hpBarFill: Phaser.GameObjects.Rectangle;
  hpText: Phaser.GameObjects.Text;
  lastElement: ElementType | null;
}

interface FlyingOrb extends ActiveOrb {
  element: ElementType;
  tier: number;
  trail: { x: number; y: number }[];
}

export class BattleScene extends Phaser.Scene {
  private saveData!: PlayerSaveData;
  private arenaBounds!: ArenaBounds;
  private cannonX = 0;
  private cannonY = 0;
  private isAiming = false;
  private isVolleyActive = false;
  private isGameOver = false;
  private aimAngleRad = -Math.PI / 2;

  private trajectoryGraphics!: Phaser.GameObjects.Graphics;
  private orbsGraphics!: Phaser.GameObjects.Graphics;
  private cannonSprite!: Phaser.GameObjects.Image;
  private coinsText!: Phaser.GameObjects.Text;
  private waveBannerText!: Phaser.GameObjects.Text;
  private threatBadgeText!: Phaser.GameObjects.Text;
  private progressFillBar!: Phaser.GameObjects.Rectangle;
  private statusHintText!: Phaser.GameObjects.Text;
  private forgeContainer!: Phaser.GameObjects.Container;

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

  create(): void {
    ArtRenderer.generateAllGameTextures(this);

    this.saveData = SaveSystem.load();
    this.wave = this.saveData.highestWave || 1;
    this.isGameOver = false;
    this.isVolleyActive = false;
    this.blocks = [];
    this.activeOrbs = [];
    this.orbSprites = [];

    const { width, topAdBannerHeight, hudTopY, arenaTopY, arenaBottomY, forgeGridTopY } = ThemeConfig.screen;


    this.arenaBounds = {
      left: 18,
      right: width - 18,
      top: arenaTopY + 24,
      bottom: arenaBottomY - 8
    };
    this.cannonX = width / 2;
    this.cannonY = this.arenaBounds.bottom - 18;

    // 1. TOP SAFE BANNER AD DOCK (TOP_CENTER)
    this.add.rectangle(width / 2, topAdBannerHeight / 2, width, topAdBannerHeight, 0x0d0917)
      .setStrokeStyle(1.5, 0x3f2e66);
    this.add.text(width / 2, topAdBannerHeight / 2, 'ADMOB TOP BANNER AD (SAFE ZONE)', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '10px',
      color: '#ffd54f',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 2. FUTURISTIC GAMING DASHBOARD HUD + LIVE LEVEL PROGRESSION BAR
    this.createFuturisticDashboardHud(width, hudTopY);

    // 3. CRYSTAL-CLEAN FUTURISTIC ARENA BACKDROP
    this.drawRichArenaBackdrop(width, arenaTopY, arenaBottomY);

    // 4. FUTURISTIC TWIN-PRONG RAIL CANNON
    this.cannonSprite = this.add.image(this.cannonX, this.cannonY, 'cannon_turret')
      .setRotation(-Math.PI / 2);

    this.statusHintText = this.add.text(width / 2, this.cannonY - 38, 'DRAG IN ARENA TO LOCK TARGET & FIRE', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '10px',
      color: '#00e5ff',
      fontStyle: 'bold',
      stroke: '#090612',
      strokeThickness: 4
    }).setOrigin(0.5);

    // 5. BOTTOM 3D FORGE ANVIL DECK & TACTILE GAME BUTTONS
    this.drawForgeDeckBackdrop(width, forgeGridTopY);
    this.forgeContainer = this.add.container(0, 0);
    this.computeSlotCenters(forgeGridTopY);
    this.renderForgeGrid();
    this.createForgeActionButtons(width, forgeGridTopY + 278);

    // 6. GRAPHICS LAYERS
    this.trajectoryGraphics = this.add.graphics();
    this.orbsGraphics = this.add.graphics();

    this.spawnNewWaveBlocks();
    this.setupInputHandlers();
  }

  private createFuturisticDashboardHud(width: number, hudTopY: number): void {
    const g = this.add.graphics();
    g.fillGradientStyle(0x1f1638, 0x1f1638, 0x0f0a1c, 0x0f0a1c, 1);
    g.fillRoundedRect(10, hudTopY - 2, width - 20, 48, 10);
    g.lineStyle(2.5, 0x00e5ff, 0.85);
    g.strokeRoundedRect(10, hudTopY - 2, width - 20, 48, 10);

    // Custom 3D Crystal Coin Icon + Counter
    this.add.image(28, hudTopY + 13, 'icon_coin');
    this.coinsText = this.add.text(44, hudTopY + 13, '', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '12px',
      color: '#ffd740',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    // Center Stage & Threat Indicator
    this.waveBannerText = this.add.text(width / 2 - 10, hudTopY + 11, '', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '11px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Stage Roadmap Progress Bar (Shows exact progress toward Boss!)
    const barW = 148;
    const barX = width / 2 - 10;
    const barY = hudTopY + 31;
    this.add.rectangle(barX, barY, barW, 8, 0x090612).setStrokeStyle(1, 0xffd54f);
    this.progressFillBar = this.add.rectangle(barX - barW / 2 + 1, barY, 20, 6, 0x00e676).setOrigin(0, 0.5);
    this.add.image(barX + barW / 2 + 8, barY, 'icon_boss_node').setScale(0.75);

    // Tactile 3D Purple GRIMOIRE Button
    ArtRenderer.createTactileButton(this, width - 60, hudTopY + 22, 'btn_PURPLE_nav', 'SKILLS', '11px', () => {
      this.scene.start('MenuScene');
    });
  }

  private drawRichArenaBackdrop(width: number, topY: number, bottomY: number): void {
    const h = bottomY - topY;
    const g = this.add.graphics();

    // Deep Futuristic Crystal Sanctum Gradient
    g.fillGradientStyle(0x110b29, 0x110b29, 0x26173e, 0x26173e, 1);
    g.fillRoundedRect(10, topY, width - 20, h, 10);

    // Top Biome & Hardness Sub-Header Bar inside Arena
    g.fillStyle(0x1b1236, 0.95);
    g.fillRoundedRect(12, topY + 2, width - 24, 22, 6);

    this.threatBadgeText = this.add.text(width / 2, topY + 13, '', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '10px',
      color: '#ffab40',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Perspective Laser Grid
    g.lineStyle(1, 0x00e5ff, 0.11);
    for (let x = 35; x < width - 20; x += 44) {
      g.lineBetween(x, topY + 24, x, bottomY - 6);
    }
    for (let y = topY + 52; y < bottomY; y += 44) {
      g.lineBetween(14, y, width - 14, y);
    }

    // Glowing Cyan Energy Bumpers on Walls
    [topY + 95, topY + 210, topY + 310].forEach((by) => {
      this.add.rectangle(15, by, 6, 48, 0x00e5ff, 0.9).setStrokeStyle(1.5, 0xffffff);
      this.add.rectangle(width - 15, by, 6, 48, 0x00e5ff, 0.9).setStrokeStyle(1.5, 0xffffff);
    });

    // Metallic Gold & Cyan Tech Frame
    g.lineStyle(3.5, ThemeConfig.colors.goldBorder, 1);
    g.strokeRoundedRect(10, topY, width - 20, h, 10);
  }

  private drawForgeDeckBackdrop(width: number, forgeTopY: number): void {
    const g = this.add.graphics();
    g.fillGradientStyle(0x211738, 0x211738, 0x0e091a, 0x0e091a, 1);
    g.fillRoundedRect(10, forgeTopY, width - 20, 304, 12);
    g.lineStyle(3.5, ThemeConfig.colors.goldBorder, 1);
    g.strokeRoundedRect(10, forgeTopY, width - 20, 304, 12);
  }

  private getDamageMultiplier(): number {
    const lvl = this.saveData.grimoireLevels.volatileMix || 1;
    return 1 + (lvl - 1) * 0.15;
  }

  private computeSlotCenters(forgeTopY: number): void {
    this.slotCenters = [];
    const startX = 69;
    const gapX = 84;
    const startY = forgeTopY + 60;
    const gapY = 66;

    for (let i = 0; i < 12; i++) {
      const row = Math.floor(i / 4);
      const col = i % 4;
      this.slotCenters.push({ x: startX + col * gapX, y: startY + row * gapY });
    }
  }

  private renderForgeGrid(): void {
    this.forgeContainer.removeAll(true);
    const dmgMult = this.getDamageMultiplier();

    const header = this.add.text(195, ThemeConfig.screen.forgeGridTopY + 15, '⚡ RUNE FORGE MATRIX (CYAN TOP ROW FIRES VOLLEY) ⚡', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '9.5px',
      color: '#00e5ff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    this.forgeContainer.add(header);

    this.slotCenters.forEach((pos, idx) => {
      const isTopQueueRow = idx < 4;
      const slotImg = this.add.image(pos.x, pos.y, isTopQueueRow ? 'slot_top_queue' : 'slot_normal');
      this.forgeContainer.add(slotImg);

      const runeKey = this.saveData.gridRunes[idx];
      if (runeKey && OrbsConfig[runeKey]) {
        const cfg = OrbsConfig[runeKey];
        const boostedDmg = Math.round(cfg.baseDamage * dmgMult);
        const texKey = `orb_${cfg.element}_${cfg.tier}`;

        const orbSprite = this.add.image(pos.x, pos.y - 3, texKey).setScale(0.75 + cfg.tier * 0.04);

        const tierBadge = this.add.text(pos.x + 17, pos.y - 17, cfg.romanTier, {
          fontFamily: "'Orbitron', sans-serif",
          fontSize: '10px',
          color: '#ffea00',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 3
        }).setOrigin(0.5);

        const dmgLabel = this.add.text(pos.x, pos.y + 19, `${boostedDmg} DMG`, {
          fontFamily: "'Chakra Petch', sans-serif",
          fontSize: '9.5px',
          color: '#ffffff',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 3
        }).setOrigin(0.5);

        this.forgeContainer.add([orbSprite, tierBadge, dmgLabel]);
      }
    });
  }

  private createForgeActionButtons(screenWidth: number, btnY: number): void {
    // 3D Glossy Green Button: Craft Rune
    ArtRenderer.createTactileButton(this, 106, btnY, 'btn_GREEN_md', '+ FORGE RUNE (50G)', '11px', () => {
      if (this.isGameOver) return;
      if (this.saveData.coins < 50) {
        this.showPopupBanner(106, btnY - 28, 'NEED 50 COINS!', '#ff5252');
        return;
      }
      const spawnedIdx = ForgeGrid.spawnRuneInEmptySlot(this.saveData.gridRunes, 1);
      if (spawnedIdx === -1) {
        this.showPopupBanner(106, btnY - 28, 'GRID FULL! MERGE FIRST!', '#ffab40');
        return;
      }
      this.saveData.coins -= 50;
      SaveSystem.save(this.saveData);
      this.updateHud();
      this.renderForgeGrid();
    });

    // 3D Glossy Orange Button: Rewarded Ad Tier-II Rune
    ArtRenderer.createTactileButton(this, screenWidth - 106, btnY, 'btn_ORANGE_md', '▶ AD: FREE TIER-II', '11px', () => {
      if (this.isGameOver) return;
      AdService.getInstance().showRewardedAd(() => {
        const spawnedIdx = ForgeGrid.spawnRuneInEmptySlot(this.saveData.gridRunes, 2);
        if (spawnedIdx === -1) {
          this.showPopupBanner(screenWidth - 106, btnY - 28, 'GRID FULL! MERGE FIRST!', '#ffab40');
          return;
        }
        SaveSystem.save(this.saveData);
        SoundSynth.playUpgradeFanfare();
        this.showPopupBanner(screenWidth - 106, btnY - 28, 'TIER-II RUNE UNLOCKED!', '#ffd740');
        this.renderForgeGrid();
      });
    });
  }

  private spawnNewWaveBlocks(): void {
    const rawBlocks = WaveSpawner.spawnWaveBlocks(this.wave, this.arenaBounds.top, ThemeConfig.screen.width);
    this.updateHud();

    if (WaveSpawner.isBossWave(this.wave)) {
      this.cameras.main.shake(320, 0.012);
      this.showPopupBanner(ThemeConfig.screen.width / 2, this.arenaBounds.top + 36, '⚠️ BOSS RAID: TITAN CRYSTAL GOLEM!', '#ff1744');
    }

    rawBlocks.forEach((item, idx) => {
      const isBoss = item.archetype.isBoss;
      const container = this.add.container(item.data.x, item.data.y);
      const sprite = this.add.image(0, 4, item.texKey);

      // Crisp Non-Overlapping Health Bar tucked neatly above Golem crest
      const barWidth = isBoss ? 124 : 44;
      const barY = -item.data.height / 2 - 4;
      const hpBg = this.add.rectangle(0, barY, barWidth, 7, 0x090612)
        .setStrokeStyle(1.2, 0xffd54f);
      const hpBarFill = this.add.rectangle(-barWidth / 2 + 1, barY, barWidth - 2, 5, 0xff1744)
        .setOrigin(0, 0.5);

      const hpText = this.add.text(0, barY - 9, `${item.data.hp}`, {
        fontFamily: "'Orbitron', sans-serif",
        fontSize: isBoss ? '13px' : '10.5px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3.5
      }).setOrigin(0.5);

      container.add([sprite, hpBg, hpBarFill, hpText]);

      this.tweens.add({
        targets: sprite,
        scaleX: 1.04,
        scaleY: 0.96,
        duration: 850 + (idx % 4) * 160,
        yoyo: true,
        repeat: -1
      });

      this.blocks.push({
        data: item.data,
        container,
        sprite,
        hpBarFill,
        hpText,
        lastElement: null
      });
    });
  }

  private spawnShatterParticles(x: number, y: number, color: number): void {
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI * 2 * i) / 10 + Math.random() * 0.4;
      const dist = 26 + Math.random() * 28;
      const shard = this.add.image(x, y, 'glow_spark').setTint(color).setScale(1.15);
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

      if (pointer.y >= this.arenaBounds.top && pointer.y <= this.arenaBounds.bottom) {
        this.isAiming = true;
        this.updateAimAngle(pointer);
        return;
      }

      const hitIdx = this.findNearestSlotIndex(pointer.x, pointer.y, 34);
      if (hitIdx !== -1 && this.saveData.gridRunes[hitIdx]) {
        this.dragSourceIdx = hitIdx;
        const cfg = OrbsConfig[this.saveData.gridRunes[hitIdx]!];
        this.dragGhostSprite = this.add.image(pointer.x, pointer.y, `orb_${cfg.element}_${cfg.tier}`)
          .setScale(0.95)
          .setAlpha(0.9);
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
            this.spawnShatterParticles(pt.x, pt.y, newOrb.color);
            this.showPopupBanner(pt.x, pt.y - 24, `MERGED: ${newOrb.name}!`, '#00e676');
          }
          SaveSystem.save(this.saveData);
          this.renderForgeGrid();
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

    const pts = ArenaPhysics.computeTrajectoryPoints(this.cannonX, this.cannonY, this.aimAngleRad, this.arenaBounds);
    this.trajectoryGraphics.clear();
    for (let i = 0; i < pts.length; i++) {
      const alpha = 1 - (i / pts.length) * 0.6;
      this.trajectoryGraphics.fillStyle(0x00e5ff, alpha * 0.45);
      this.trajectoryGraphics.fillCircle(pts[i].x, pts[i].y, 6);
      this.trajectoryGraphics.fillStyle(0xffffff, alpha);
      this.trajectoryGraphics.fillCircle(pts[i].x, pts[i].y, 3);
    }
  }

  private fireElementalVolley(): void {
    this.isVolleyActive = true;
    this.comboCount = 0;
    this.statusHintText.setVisible(false);

    const queue = ForgeGrid.extractFiringQueue(this.saveData.gridRunes);
    const dmgMult = this.getDamageMultiplier();
    const speed = 490;

    queue.forEach((orbCfg, index) => {
      this.time.delayedCall(index * 100, () => {
        const sprite = this.add.image(this.cannonX, this.cannonY - 8, `orb_${orbCfg.element}_${orbCfg.tier}`)
          .setScale(0.46 + orbCfg.tier * 0.04);
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

    const meta = WaveSpawner.getWaveMetadata(this.wave);
    const dt = Math.min(delta / 1000, 0.025);

    for (const block of this.blocks) {
      block.data.y += meta.descentSpeed * dt;
      block.container.y = block.data.y;

      if (block.data.y + block.data.height / 2 >= this.cannonY - 20) {
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
      if (orb.trail.length > 7) orb.trail.shift();

      const res = ArenaPhysics.stepOrb(orb, dt, this.arenaBounds, activeBlockData);
      if (res.hitWall) {
        SoundSynth.playBounceChime(this.comboCount);
        this.spawnShatterParticles(orb.x, orb.y, orb.color);
      }

      if (res.hitBlockId) {
        this.comboCount++;
        SoundSynth.playBounceChime(this.comboCount);
        this.applyBlockDamage(res.hitBlockId, orb.damage, orb.element, res.hitX, res.hitY);
      }

      for (let t = 0; t < orb.trail.length; t++) {
        const pt = orb.trail[t];
        const ratio = (t + 1) / orb.trail.length;
        this.orbsGraphics.fillStyle(orb.color, ratio * 0.55);
        this.orbsGraphics.fillCircle(pt.x, pt.y, orb.radius * ratio * 0.85);
      }

      if (sprite) {
        sprite.setPosition(orb.x, orb.y);
        sprite.rotation += 0.16;
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

  private applyBlockDamage(blockId: string, baseDmg: number, hitElement: ElementType, hitX: number, hitY: number): void {
    const target = this.blocks.find((b) => b.data.id === blockId);
    if (!target || target.data.hp <= 0) return;

    let finalDamage = baseDmg;
    const coreLvl = this.saveData.grimoireLevels.empoweredCore || 1;
    const comboBoost = 1 + (coreLvl - 1) * 0.2;

    if (target.lastElement && target.lastElement !== hitElement) {
      const reaction = ElementalCombos.getComboMultiplier(target.lastElement, hitElement);
      if (reaction.multiplier > 1.0) {
        finalDamage = Math.round(baseDmg * reaction.multiplier * comboBoost);
        this.cameras.main.shake(90, 0.005);
        this.showPopupBanner(hitX, hitY - 22, reaction.label, reaction.color);
      }
    }
    target.lastElement = hitElement;

    target.data.hp = Math.max(0, target.data.hp - finalDamage);
    target.hpText.setText(`${target.data.hp}`);

    const barMaxW = target.data.width > 100 ? 122 : 42;
    target.hpBarFill.width = Math.max(0, (target.data.hp / target.data.maxHp) * barMaxW);

    target.sprite.setTintFill(0xffffff);
    this.time.delayedCall(60, () => {
      if (target && target.sprite && target.sprite.scene) target.sprite.clearTint();
    });

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
      SoundSynth.playShatterSound();
      this.spawnShatterParticles(target.data.x, target.data.y, target.data.color);
      target.container.destroy();
      this.blocks = this.blocks.filter((b) => b.data.id !== blockId);

      const greedLvl = this.saveData.grimoireLevels.alchemistGreed || 1;
      const coinGain = Math.round(22 * (1 + (greedLvl - 1) * 0.25));
      this.saveData.coins += coinGain;
      SaveSystem.save(this.saveData);
      this.updateHud();
    }
  }

  private showPopupBanner(x: number, y: number, text: string, color: string): void {
    const label = this.add.text(x, y, text, {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '12px',
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
    if (this.blocks.length === 0) {
      const clearedWave = this.wave;
      this.wave++;
      this.saveData.highestWave = Math.max(this.saveData.highestWave, this.wave);
      const baseWaveReward = 60 + clearedWave * 10;
      this.saveData.coins += baseWaveReward;
      SaveSystem.save(this.saveData);
      SoundSynth.playUpgradeFanfare();

      this.scene.start('RewardModalScene', {
        waveCleared: clearedWave,
        baseCoinsEarned: baseWaveReward,
        score: this.score
      });
      return;
    }
    this.statusHintText.setText('MERGE RUNES OR DRAG ARENA TO FIRE NEXT VOLLEY');
    this.statusHintText.setVisible(true);
  }

  private triggerGameOver(): void {
    if (this.isGameOver) return;
    this.isGameOver = true;

    const { width, height } = ThemeConfig.screen;
    this.add.rectangle(width / 2, height / 2, width, height, 0x06040c, 0.88);

    this.add.text(width / 2, height / 2 - 95, 'SANCTUM BREACHED!', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '26px',
      color: '#ff1744',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - 42, `STAGE REACHED: ${this.wave}   •   SCORE: ${this.score}`, {
      fontFamily: "'Chakra Petch', sans-serif",
      fontSize: '14px',
      color: '#fff7e6',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    ArtRenderer.createTactileButton(this, width / 2, height / 2 + 25, 'btn_GREEN_lg', '▶ AD: REVIVE STAGE', '12px', () => {
      AdService.getInstance().showRewardedAd(() => {
        for (const b of this.blocks) b.container.destroy();
        this.blocks = [];
        this.isGameOver = false;
        this.scene.restart();
      });
    });

    ArtRenderer.createTactileButton(this, width / 2, height / 2 + 88, 'btn_ORANGE_lg', 'GRIMOIRE DASHBOARD', '12px', () => {
      this.scene.start('MenuScene');
    });
  }

  private updateHud(): void {
    if (!this.coinsText) return;
    const meta = WaveSpawner.getWaveMetadata(this.wave);
    this.coinsText.setText(`${this.saveData.coins}`);
    this.waveBannerText.setText(`STAGE ${this.wave}  ➔  BOSS ${meta.nextBossWave}`);
    this.progressFillBar.width = Math.max(12, Math.round(meta.stageProgressRatio * 146));

    if (this.threatBadgeText) {
      this.threatBadgeText.setText(`❖ ${meta.biomeName} • ${meta.formationName} (${meta.difficultyLabel}) ❖`);
    }
  }
}
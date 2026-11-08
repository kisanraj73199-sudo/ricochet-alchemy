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

interface VisualBlock {
  data: BlockRect;
  box: Phaser.GameObjects.Rectangle;
  hpText: Phaser.GameObjects.Text;
  lastElement: ElementType | null;
}

interface FlyingOrb extends ActiveOrb {
  element: ElementType;
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
  private cannonBarrel!: Phaser.GameObjects.Rectangle;
  private scoreText!: Phaser.GameObjects.Text;
  private statusHintText!: Phaser.GameObjects.Text;
  private forgeContainer!: Phaser.GameObjects.Container;

  private blocks: VisualBlock[] = [];
  private activeOrbs: FlyingOrb[] = [];
  private slotCenters: { x: number; y: number }[] = [];
  private dragSourceIdx: number | null = null;
  private dragGhostCircle: Phaser.GameObjects.Arc | null = null;

  private score = 0;
  private wave = 1;
  private comboCount = 0;

  constructor() {
    super('BattleScene');
  }

  create(): void {
    this.saveData = SaveSystem.load();
    this.wave = this.saveData.highestWave || 1;
    this.isGameOver = false;
    this.isVolleyActive = false;
    this.blocks = [];
    this.activeOrbs = [];

    const { width, topAdBannerHeight, hudTopY, arenaTopY, arenaBottomY, forgeGridTopY } = ThemeConfig.screen;
    const { colors } = ThemeConfig;

    this.arenaBounds = {
      left: 14,
      right: width - 14,
      top: arenaTopY + 6,
      bottom: arenaBottomY - 6
    };
    this.cannonX = width / 2;
    this.cannonY = this.arenaBounds.bottom - 14;

    // 1. TOP SAFE BANNER AD DOCK (TOP_CENTER)
    this.add.rectangle(width / 2, topAdBannerHeight / 2, width, topAdBannerHeight, 0x1e1814)
      .setStrokeStyle(2, colors.goldBorder);
    this.add.text(width / 2, topAdBannerHeight / 2, 'ADMOB TOP BANNER AD (SAFE ZONE)', {
      fontSize: '12px',
      color: '#ffd97d',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 2. TOP HUD BAR + GRIMOIRE SKILLS BUTTON
    this.add.rectangle(width / 2, hudTopY + 20, width - 16, 40, colors.panelRoyalBlue)
      .setStrokeStyle(2, colors.goldBorder);
    this.scoreText = this.add.text(18, hudTopY + 12, '', {
      fontSize: '12px',
      color: colors.textCream,
      fontStyle: 'bold'
    });

    const menuBtn = this.add.rectangle(width - 54, hudTopY + 20, 78, 28, colors.buttonUpgradeOrange)
      .setStrokeStyle(1.5, 0xffffff)
      .setInteractive({ useHandCursor: true });
    this.add.text(width - 54, hudTopY + 20, '📖 SKILLS', {
      fontSize: '10px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    menuBtn.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });

    this.updateHud();

    // 3. WARM SANDSTONE RICOCHET ARENA
    const arenaHeight = arenaBottomY - arenaTopY;
    this.add.rectangle(width / 2, arenaTopY + arenaHeight / 2, width - 16, arenaHeight, colors.arenaSandstone)
      .setStrokeStyle(4, colors.goldBorder);

    // 4. CANNON TURRET
    this.add.circle(this.cannonX, this.cannonY, 18, colors.panelRoyalBlue)
      .setStrokeStyle(3, colors.goldBorder);
    this.cannonBarrel = this.add.rectangle(this.cannonX, this.cannonY, 32, 12, colors.goldHighlight)
      .setOrigin(0.2, 0.5)
      .setRotation(-Math.PI / 2);

    this.statusHintText = this.add.text(width / 2, this.cannonY - 32, 'DRAG RUNE TO MERGE OR DRAG ARENA TO FIRE!', {
      fontSize: '11px',
      color: colors.textDarkBrown,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 5. BOTTOM 4x3 INTERACTIVE MERGE FORGE
    const gridHeight = 304;
    this.add.rectangle(width / 2, forgeGridTopY + gridHeight / 2, width - 16, gridHeight, colors.bgWarmStone)
      .setStrokeStyle(3, colors.goldBorder);

    this.forgeContainer = this.add.container(0, 0);
    this.computeSlotCenters(forgeGridTopY);
    this.renderForgeGrid();
    this.createForgeActionButtons(width, forgeGridTopY + gridHeight - 26);

    // 6. GRAPHICS & CONTROLS
    this.trajectoryGraphics = this.add.graphics();
    this.orbsGraphics = this.add.graphics();

    this.spawnNewWaveBlocks();
    this.setupInputHandlers();
  }

  private getDamageMultiplier(): number {
    const lvl = this.saveData.grimoireLevels.volatileMix || 1;
    return 1 + (lvl - 1) * 0.15;
  }

  private computeSlotCenters(forgeTopY: number): void {
    this.slotCenters = [];
    const startX = 69;
    const gapX = 84;
    const startY = forgeTopY + 58;
    const gapY = 68;

    for (let i = 0; i < 12; i++) {
      const row = Math.floor(i / 4);
      const col = i % 4;
      this.slotCenters.push({ x: startX + col * gapX, y: startY + row * gapY });
    }
  }

  private renderForgeGrid(): void {
    this.forgeContainer.removeAll(true);
    const { colors } = ThemeConfig;
    const dmgMult = this.getDamageMultiplier();

    const header = this.add.text(195, ThemeConfig.screen.forgeGridTopY + 14, 'DRAG IDENTICAL RUNES TO MERGE (TOP ROW FIRES FIRST)', {
      fontSize: '10px',
      color: '#ffd97d',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.forgeContainer.add(header);

    this.slotCenters.forEach((pos, idx) => {
      const isTopQueueRow = idx < 4;
      const slotBg = this.add.rectangle(pos.x, pos.y, 62, 58, isTopQueueRow ? 0x33261e : 0x221a14)
        .setStrokeStyle(isTopQueueRow ? 2.5 : 1.5, isTopQueueRow ? colors.goldHighlight : colors.goldBorder);
      this.forgeContainer.add(slotBg);

      const runeKey = this.saveData.gridRunes[idx];
      if (runeKey && OrbsConfig[runeKey]) {
        const cfg = OrbsConfig[runeKey];
        const boostedDmg = Math.round(cfg.baseDamage * dmgMult);
        const orbCircle = this.add.circle(pos.x, pos.y - 3, 18 + cfg.tier * 1.5, cfg.color)
          .setStrokeStyle(2, 0xffffff);
        const tierLabel = this.add.text(pos.x, pos.y - 3, cfg.romanTier, {
          fontSize: '13px',
          color: '#ffffff',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 3
        }).setOrigin(0.5);
        const dmgLabel = this.add.text(pos.x, pos.y + 19, `${boostedDmg} DMG`, {
          fontSize: '9px',
          color: '#fff7e6',
          fontStyle: 'bold'
        }).setOrigin(0.5);

        this.forgeContainer.add([orbCircle, tierLabel, dmgLabel]);
      }
    });
  }

  private createForgeActionButtons(screenWidth: number, btnY: number): void {
    const buyBtn = this.add.rectangle(108, btnY, 168, 36, ThemeConfig.colors.buttonPlayGreen)
      .setStrokeStyle(2, 0xffffff)
      .setInteractive({ useHandCursor: true });
    this.add.text(108, btnY, '+ FORGE RUNE (50 COINS)', {
      fontSize: '11px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    buyBtn.on('pointerdown', () => {
      if (this.isGameOver) return;
      if (this.saveData.coins < 50) {
        this.showPopupBanner(108, btnY - 26, 'NEED 50 COINS!', '#ff5252');
        return;
      }
      const spawnedIdx = ForgeGrid.spawnRuneInEmptySlot(this.saveData.gridRunes, 1);
      if (spawnedIdx === -1) {
        this.showPopupBanner(108, btnY - 26, 'GRID FULL! MERGE FIRST!', '#ffab40');
        return;
      }
      this.saveData.coins -= 50;
      SaveSystem.save(this.saveData);
      SoundSynth.playBounceChime(4);
      this.updateHud();
      this.renderForgeGrid();
    });

    const adBtn = this.add.rectangle(screenWidth - 108, btnY, 168, 36, ThemeConfig.colors.buttonUpgradeOrange)
      .setStrokeStyle(2, ThemeConfig.colors.goldHighlight)
      .setInteractive({ useHandCursor: true });
    this.add.text(screenWidth - 108, btnY, 'AD: FREE TIER-II RUNE', {
      fontSize: '11px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    adBtn.on('pointerdown', () => {
      if (this.isGameOver) return;
      AdService.getInstance().showRewardedAd(() => {
        const spawnedIdx = ForgeGrid.spawnRuneInEmptySlot(this.saveData.gridRunes, 2);
        if (spawnedIdx === -1) {
          this.showPopupBanner(screenWidth - 108, btnY - 26, 'GRID FULL! MERGE FIRST!', '#ffab40');
          return;
        }
        SaveSystem.save(this.saveData);
        SoundSynth.playUpgradeFanfare();
        this.showPopupBanner(screenWidth - 108, btnY - 28, 'REWARDED AD: TIER-II RUNE!', '#ffd740');
        this.renderForgeGrid();
      });
    });
  }

  private spawnNewWaveBlocks(): void {
    const rawBlocks = WaveSpawner.spawnWaveBlocks(this.wave, this.arenaBounds.top, ThemeConfig.screen.width);

    if (WaveSpawner.isBossWave(this.wave)) {
      this.cameras.main.shake(300, 0.012);
      this.showPopupBanner(ThemeConfig.screen.width / 2, this.arenaBounds.top + 30, '⚠️ WARNING: GIANT CRYSTAL GOLEM!', '#ff5252');
    }

    for (const item of rawBlocks) {
      const box = this.add.rectangle(item.data.x, item.data.y, item.data.width, item.data.height, item.data.color)
        .setStrokeStyle(2, 0xffffff);
      const hpText = this.add.text(item.data.x, item.data.y, `${item.data.hp}`, {
        fontSize: '13px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      this.blocks.push({ data: item.data, box, hpText, lastElement: null });
    }
  }

  private spawnShatterParticles(x: number, y: number, color: number): void {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8 + Math.random() * 0.4;
      const dist = 22 + Math.random() * 24;
      const shard = this.add.rectangle(x, y, 7, 7, color).setRotation(angle);
      this.tweens.add({
        targets: shard,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.2,
        duration: 360,
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
        this.dragGhostCircle = this.add.circle(pointer.x, pointer.y, 22, cfg.color, 0.85)
          .setStrokeStyle(3, 0xffffff);
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isAiming && !this.isVolleyActive) {
        this.updateAimAngle(pointer);
      } else if (this.dragGhostCircle) {
        this.dragGhostCircle.setPosition(pointer.x, pointer.y);
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
        if (this.dragGhostCircle) {
          this.dragGhostCircle.destroy();
          this.dragGhostCircle = null;
        }
        const targetIdx = this.findNearestSlotIndex(pointer.x, pointer.y, 38);
        if (targetIdx !== -1) {
          const res = ForgeGrid.moveOrMergeSlot(this.saveData.gridRunes, this.dragSourceIdx, targetIdx);
          if (res.action === 'MERGED' && res.upgradedOrbId) {
            const newOrb = OrbsConfig[res.upgradedOrbId];
            SoundSynth.playUpgradeFanfare();
            const pt = this.slotCenters[targetIdx];
            this.spawnShatterParticles(pt.x, pt.y, newOrb.color);
            this.showPopupBanner(pt.x, pt.y - 24, `MERGED: ${newOrb.name}!`, '#69f0ae');
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
    this.cannonBarrel.setRotation(this.aimAngleRad);

    const pts = ArenaPhysics.computeTrajectoryPoints(this.cannonX, this.cannonY, this.aimAngleRad, this.arenaBounds);
    this.trajectoryGraphics.clear();
    for (let i = 0; i < pts.length; i++) {
      const alpha = 1 - (i / pts.length) * 0.65;
      this.trajectoryGraphics.fillStyle(0xfff3c4, alpha);
      this.trajectoryGraphics.fillCircle(pts[i].x, pts[i].y, 3.5);
    }
  }

  private fireElementalVolley(): void {
    this.isVolleyActive = true;
    this.comboCount = 0;
    this.statusHintText.setVisible(false);

    const queue = ForgeGrid.extractFiringQueue(this.saveData.gridRunes);
    const dmgMult = this.getDamageMultiplier();
    const speed = 470;

    queue.forEach((orbCfg, index) => {
      this.time.delayedCall(index * 105, () => {
        this.activeOrbs.push({
          x: this.cannonX,
          y: this.cannonY - 8,
          vx: Math.cos(this.aimAngleRad) * speed,
          vy: Math.sin(this.aimAngleRad) * speed,
          radius: 8 + orbCfg.tier,
          damage: Math.round(orbCfg.baseDamage * dmgMult),
          color: orbCfg.color,
          element: orbCfg.element,
          active: true
        });
        SoundSynth.playBounceChime(1);
      });
    });
  }

  update(_time: number, delta: number): void {
    if (this.isGameOver) return;

    const descentSpeed = 1.2 + this.wave * 0.12;
    const dt = Math.min(delta / 1000, 0.025);

    for (const block of this.blocks) {
      block.data.y += descentSpeed * dt;
      block.box.y = block.data.y;
      block.hpText.y = block.data.y;

      if (block.data.y + block.data.height / 2 >= this.cannonY - 20) {
        this.triggerGameOver();
        return;
      }
    }

    if (!this.isVolleyActive) return;

    this.orbsGraphics.clear();
    const activeBlockData = this.blocks.map((b) => b.data);

    for (const orb of this.activeOrbs) {
      if (!orb.active) continue;

      const res = ArenaPhysics.stepOrb(orb, dt, this.arenaBounds, activeBlockData);
      if (res.hitWall) SoundSynth.playBounceChime(this.comboCount);

      if (res.hitBlockId) {
        this.comboCount++;
        SoundSynth.playBounceChime(this.comboCount);
        this.applyBlockDamage(res.hitBlockId, orb.damage, orb.element, res.hitX, res.hitY);
      }

      this.orbsGraphics.fillStyle(0xffffff, 0.9);
      this.orbsGraphics.fillCircle(orb.x, orb.y, orb.radius + 2);
      this.orbsGraphics.fillStyle(orb.color, 1);
      this.orbsGraphics.fillCircle(orb.x, orb.y, orb.radius);
    }

    if (this.activeOrbs.length > 0 && this.activeOrbs.every((o) => !o.active)) {
      this.activeOrbs = [];
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
        this.cameras.main.shake(90, 0.004);
        this.showPopupBanner(hitX, hitY - 22, reaction.label, reaction.color);
      }
    }
    target.lastElement = hitElement;

    target.data.hp = Math.max(0, target.data.hp - finalDamage);
    target.hpText.setText(`${target.data.hp}`);
    this.score += finalDamage * 10;
    this.updateHud();

    const dmgPopup = this.add.text(hitX, hitY - 8, `-${finalDamage}`, {
      fontSize: '13px',
      color: '#ffeb3b',
      fontStyle: 'bold',
      stroke: '#332211',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.tweens.add({
      targets: dmgPopup,
      y: hitY - 32,
      alpha: 0,
      duration: 420,
      onComplete: () => dmgPopup.destroy()
    });

    if (target.data.hp <= 0) {
      SoundSynth.playShatterSound();
      this.spawnShatterParticles(target.data.x, target.data.y, target.data.color);
      target.box.destroy();
      target.hpText.destroy();
      this.blocks = this.blocks.filter((b) => b.data.id !== blockId);

      const greedLvl = this.saveData.grimoireLevels.alchemistGreed || 1;
      const coinGain = Math.round(20 * (1 + (greedLvl - 1) * 0.25));
      this.saveData.coins += coinGain;
      SaveSystem.save(this.saveData);
      this.updateHud();
    }
  }

  private showPopupBanner(x: number, y: number, text: string, color: string): void {
    const label = this.add.text(x, y, text, {
      fontSize: '12px',
      color,
      fontStyle: 'bold',
      stroke: '#1e1814',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.tweens.add({
      targets: label,
      y: y - 28,
      alpha: 0,
      duration: 750,
      onComplete: () => label.destroy()
    });
  }

  private onVolleyComplete(): void {
    if (this.blocks.length === 0) {
      const clearedWave = this.wave;
      this.wave++;
      this.saveData.highestWave = Math.max(this.saveData.highestWave, this.wave);
      const baseWaveReward = 60;
      this.saveData.coins += baseWaveReward;
      SaveSystem.save(this.saveData);
      SoundSynth.playUpgradeFanfare();

      // Open Screen 4: Victory Loot Chest & Opt-in Double Rewards Modal!
      this.scene.start('RewardModalScene', {
        waveCleared: clearedWave,
        baseCoinsEarned: baseWaveReward,
        score: this.score
      });
      return;
    }
    this.statusHintText.setText('MERGE RUNES BELOW OR DRAG ARENA TO FIRE!');
    this.statusHintText.setVisible(true);
  }

  private triggerGameOver(): void {
    if (this.isGameOver) return;
    this.isGameOver = true;

    const { width, height } = ThemeConfig.screen;
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.82);

    this.add.text(width / 2, height / 2 - 90, 'BREACHED!', {
      fontSize: '32px',
      color: '#ff5252',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - 35, `FINAL WAVE: ${this.wave}   SCORE: ${this.score}`, {
      fontSize: '14px',
      color: '#fff7e6',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const reviveBtn = this.add.rectangle(width / 2, height / 2 + 35, 240, 46, ThemeConfig.colors.buttonPlayGreen)
      .setStrokeStyle(3, 0xffffff)
      .setInteractive({ useHandCursor: true });
    this.add.text(width / 2, height / 2 + 35, '▶ WATCH AD: REVIVE & CLEAR ROW', {
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    reviveBtn.on('pointerdown', () => {
      AdService.getInstance().showRewardedAd(() => {
        for (const b of this.blocks) {
          b.box.destroy();
          b.hpText.destroy();
        }
        this.blocks = [];
        this.isGameOver = false;
        this.scene.restart();
      });
    });

    const menuBtn = this.add.rectangle(width / 2, height / 2 + 98, 240, 40, 0x5c4033)
      .setStrokeStyle(2, ThemeConfig.colors.goldBorder)
      .setInteractive({ useHandCursor: true });
    this.add.text(width / 2, height / 2 + 98, 'RETURN TO GRIMOIRE MENU', {
      fontSize: '12px',
      color: '#ffd97d',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    menuBtn.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });
  }

  private updateHud(): void {
    if (!this.scoreText) return;
    this.scoreText.setText(`COINS: ${this.saveData.coins}    WAVE: ${this.wave}    SCORE: ${this.score}`);
  }
}
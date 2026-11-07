import Phaser from 'phaser';
import { ThemeConfig } from '../config/ThemeConfig';
import { OrbsConfig } from '../config/OrbsConfig';
import { ArenaPhysics, ArenaBounds, BlockRect, ActiveOrb } from '../gameplay/ArenaPhysics';
import { SoundSynth } from '../core/SoundSynth';

interface VisualBlock {
  data: BlockRect;
  box: Phaser.GameObjects.Rectangle;
  hpText: Phaser.GameObjects.Text;
}

export class BattleScene extends Phaser.Scene {
  private arenaBounds!: ArenaBounds;
  private cannonX = 0;
  private cannonY = 0;
  private isAiming = false;
  private isVolleyActive = false;
  private aimAngleRad = -Math.PI / 2;

  private trajectoryGraphics!: Phaser.GameObjects.Graphics;
  private orbsGraphics!: Phaser.GameObjects.Graphics;
  private cannonBarrel!: Phaser.GameObjects.Rectangle;
  private scoreText!: Phaser.GameObjects.Text;
  private statusHintText!: Phaser.GameObjects.Text;

  private blocks: VisualBlock[] = [];
  private activeOrbs: ActiveOrb[] = [];
  private score = 0;
  private wave = 1;
  private comboCount = 0;

  constructor() {
    super('BattleScene');
  }

  create(): void {
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

    // 1. TOP SAFE BANNER AD DOCK (Always at TOP_CENTER)
    this.add.rectangle(width / 2, topAdBannerHeight / 2, width, topAdBannerHeight, 0x1e1814)
      .setStrokeStyle(2, colors.goldBorder);
    this.add.text(width / 2, topAdBannerHeight / 2, 'ADMOB TOP BANNER AD (SAFE ZONE)', {
      fontSize: '12px',
      color: '#ffd97d',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 2. TOP HUD BAR
    this.add.rectangle(width / 2, hudTopY + 20, width - 16, 40, colors.panelRoyalBlue)
      .setStrokeStyle(2, colors.goldBorder);
    this.scoreText = this.add.text(24, hudTopY + 11, 'SCORE: 0        WAVE: 1        HP: 100%', {
      fontSize: '14px',
      color: colors.textCream,
      fontStyle: 'bold'
    });

    // 3. WARM SANDSTONE RICOCHET ARENA
    const arenaHeight = arenaBottomY - arenaTopY;
    this.add.rectangle(width / 2, arenaTopY + arenaHeight / 2, width - 16, arenaHeight, colors.arenaSandstone)
      .setStrokeStyle(4, colors.goldBorder);

    // Subtle stone floor grid lines inside arena
    const gridLines = this.add.graphics();
    gridLines.lineStyle(1, 0xc4a77d, 0.45);
    for (let gx = 40; gx < width - 20; gx += 45) {
      gridLines.lineBetween(gx, this.arenaBounds.top, gx, this.arenaBounds.bottom);
    }
    for (let gy = this.arenaBounds.top + 45; gy < this.arenaBounds.bottom; gy += 45) {
      gridLines.lineBetween(this.arenaBounds.left, gy, this.arenaBounds.right, gy);
    }

    // 4. ALCHEMICAL CANNON TURRET AT ARENA BOTTOM
    this.add.circle(this.cannonX, this.cannonY, 18, colors.panelRoyalBlue)
      .setStrokeStyle(3, colors.goldBorder);
    this.cannonBarrel = this.add.rectangle(this.cannonX, this.cannonY, 32, 12, colors.goldHighlight)
      .setOrigin(0.2, 0.5)
      .setRotation(-Math.PI / 2);

    this.statusHintText = this.add.text(width / 2, this.cannonY - 34, 'DRAG IN ARENA TO AIM & RELEASE TO FIRE!', {
      fontSize: '12px',
      color: colors.textDarkBrown,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 5. BOTTOM 4x3 RUNE MERGE FORGE PREVIEW
    const gridHeight = 290;
    this.add.rectangle(width / 2, forgeGridTopY + gridHeight / 2, width - 16, gridHeight, colors.bgWarmStone)
      .setStrokeStyle(3, colors.goldBorder);
    this.renderForgePreviewSlots(width, forgeGridTopY);

    // 6. GRAPHICS LAYERS FOR TRAJECTORY & ELEMENTAL ORBS
    this.trajectoryGraphics = this.add.graphics();
    this.orbsGraphics = this.add.graphics();

    // 7. SPAWN INITIAL CRYSTAL MONSTER WAVE & BIND TOUCH CONTROLS
    this.spawnCrystalWave();
    this.setupTouchControls();
  }

  private renderForgePreviewSlots(screenWidth: number, forgeTopY: number): void {
    const { colors } = ThemeConfig;
    this.add.text(screenWidth / 2, forgeTopY + 20, 'EQUIPPED VOLLEY QUEUE (Phase 3 Merge Grid Next)', {
      fontSize: '12px',
      color: '#ffd97d',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const sampleOrbs = [OrbsConfig.FIRE_1, OrbsConfig.ICE_1, OrbsConfig.LIGHTNING_1, OrbsConfig.NATURE_1];
    const startX = 66;
    const gap = 86;

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        const sx = startX + col * gap;
        const sy = forgeTopY + 68 + row * 78;
        this.add.rectangle(sx, sy, 68, 68, 0x261e18)
          .setStrokeStyle(2, colors.goldBorder);

        if (row === 0) {
          const orbCfg = sampleOrbs[col];
          this.add.circle(sx, sy, 20, orbCfg.color).setStrokeStyle(2, 0xffffff);
        }
      }
    }
  }

  private spawnCrystalWave(): void {
    const cols = 5;
    const blockW = 58;
    const blockH = 42;
    const startX = 56;
    const gapX = 68;

    const palette = [0x29b6f6, 0xab47bc, 0xff7043, 0x26a69a];

    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < cols; c++) {
        const bx = startX + c * gapX;
        const by = this.arenaBounds.top + 55 + r * 54;
        const hp = (3 + this.wave * 2 - r) * 12;
        const color = palette[(r + c + this.wave) % palette.length];

        const rectData: BlockRect = {
          id: `crystal_${this.wave}_${r}_${c}_${Date.now()}`,
          x: bx,
          y: by,
          width: blockW,
          height: blockH,
          hp,
          maxHp: hp,
          color
        };

        const box = this.add.rectangle(bx, by, blockW, blockH, color)
          .setStrokeStyle(2, 0xffffff);
        const hpText = this.add.text(bx, by, `${hp}`, {
          fontSize: '14px',
          color: '#ffffff',
          fontStyle: 'bold'
        }).setOrigin(0.5);

        this.blocks.push({ data: rectData, box, hpText });
      }
    }
  }

  private setupTouchControls(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isVolleyActive) return;
      if (pointer.y >= this.arenaBounds.top && pointer.y <= this.arenaBounds.bottom) {
        this.isAiming = true;
        this.updateAimAngle(pointer);
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isAiming || this.isVolleyActive) return;
      this.updateAimAngle(pointer);
    });

    this.input.on('pointerup', () => {
      if (!this.isAiming || this.isVolleyActive) return;
      this.isAiming = false;
      this.trajectoryGraphics.clear();
      this.fireElementalVolley();
    });
  }

  private updateAimAngle(pointer: Phaser.Input.Pointer): void {
    let angle = Phaser.Math.Angle.Between(this.cannonX, this.cannonY, pointer.x, pointer.y);
    if (angle > -0.22 || angle < -Math.PI + 0.22) {
      angle = pointer.x < this.cannonX ? -Math.PI + 0.22 : -0.22;
    }
    this.aimAngleRad = angle;
    this.cannonBarrel.setRotation(this.aimAngleRad);

    // Draw dotted trajectory line
    const pts = ArenaPhysics.computeTrajectoryPoints(
      this.cannonX,
      this.cannonY,
      this.aimAngleRad,
      this.arenaBounds
    );

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

    const queue = [
      OrbsConfig.FIRE_1,
      OrbsConfig.ICE_1,
      OrbsConfig.LIGHTNING_1,
      OrbsConfig.NATURE_1,
      OrbsConfig.FIRE_1
    ];

    const speed = 460;
    queue.forEach((orbCfg, index) => {
      this.time.delayedCall(index * 110, () => {
        this.activeOrbs.push({
          x: this.cannonX,
          y: this.cannonY - 8,
          vx: Math.cos(this.aimAngleRad) * speed,
          vy: Math.sin(this.aimAngleRad) * speed,
          radius: 9,
          damage: orbCfg.baseDamage,
          color: orbCfg.color,
          active: true
        });
        SoundSynth.playBounceChime(1);
      });
    });
  }

  update(_time: number, delta: number): void {
    if (!this.isVolleyActive) return;

    const dt = Math.min(delta / 1000, 0.025);
    this.orbsGraphics.clear();

    const activeBlockData = this.blocks.map((b) => b.data);

    for (const orb of this.activeOrbs) {
      if (!orb.active) continue;

      const res = ArenaPhysics.stepOrb(orb, dt, this.arenaBounds, activeBlockData);

      if (res.hitWall) {
        SoundSynth.playBounceChime(this.comboCount);
      }

      if (res.hitBlockId) {
        this.comboCount++;
        SoundSynth.playBounceChime(this.comboCount);
        this.applyBlockDamage(res.hitBlockId, orb.damage, res.hitX, res.hitY);
      }

      // Render glowing elemental orb
      this.orbsGraphics.fillStyle(0xffffff, 0.9);
      this.orbsGraphics.fillCircle(orb.x, orb.y, orb.radius + 2);
      this.orbsGraphics.fillStyle(orb.color, 1);
      this.orbsGraphics.fillCircle(orb.x, orb.y, orb.radius);
    }

    // Check if all orbs finished their flight
    if (this.activeOrbs.length > 0 && this.activeOrbs.every((o) => !o.active)) {
      this.activeOrbs = [];
      this.isVolleyActive = false;
      this.onVolleyComplete();
    }
  }

  private applyBlockDamage(blockId: string, damage: number, hitX: number, hitY: number): void {
    const target = this.blocks.find((b) => b.data.id === blockId);
    if (!target || target.data.hp <= 0) return;

    target.data.hp = Math.max(0, target.data.hp - damage);
    target.hpText.setText(`${target.data.hp}`);
    this.score += damage * 10;
    this.updateHud();

    // Floating damage popup
    const dmgPopup = this.add.text(hitX, hitY - 10, `-${damage}`, {
      fontSize: '13px',
      color: '#ffeb3b',
      fontStyle: 'bold',
      stroke: '#332211',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.tweens.add({
      targets: dmgPopup,
      y: hitY - 34,
      alpha: 0,
      duration: 420,
      onComplete: () => dmgPopup.destroy()
    });

    if (target.data.hp <= 0) {
      target.box.destroy();
      target.hpText.destroy();
      this.blocks = this.blocks.filter((b) => b.data.id !== blockId);
    }
  }

  private onVolleyComplete(): void {
    if (this.blocks.length === 0) {
      this.wave++;
      this.updateHud();
      this.spawnCrystalWave();
    }
    this.statusHintText.setText('DRAG TO AIM NEXT VOLLEY!');
    this.statusHintText.setVisible(true);
  }

  private updateHud(): void {
    this.scoreText.setText(`SCORE: ${this.score}        WAVE: ${this.wave}        HP: 100%`);
  }
}
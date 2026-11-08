/**
 * Phase 5: Screen 1 - Warm Fantasy Alchemist Grimoire & Skill Tree Menu
 */
import Phaser from 'phaser';
import { ThemeConfig } from '../config/ThemeConfig';
import { SaveSystem, PlayerSaveData } from '../core/SaveSystem';
import { SoundSynth } from '../core/SoundSynth';

interface SkillNodeConfig {
  key: string;
  title: string;
  desc: string;
  x: number;
  y: number;
  color: number;
  baseCost: number;
}

export class MenuScene extends Phaser.Scene {
  private saveData!: PlayerSaveData;
  private coinsText!: Phaser.GameObjects.Text;
  private treeContainer!: Phaser.GameObjects.Container;

  private readonly skills: SkillNodeConfig[] = [
    {
      key: 'volatileMix',
      title: 'Volatile Mix',
      desc: '+15% All Orb Damage',
      x: 195,
      y: 265,
      color: 0xff5722,
      baseCost: 80
    },
    {
      key: 'empoweredCore',
      title: 'Empowered Core',
      desc: '+20% Elemental Combo Bonus',
      x: 105,
      y: 425,
      color: 0xab47bc,
      baseCost: 100
    },
    {
      key: 'alchemistGreed',
      title: 'Alchemist Greed',
      desc: '+25% Bonus Coins Dropped',
      x: 285,
      y: 425,
      color: 0x4caf50,
      baseCost: 90
    }
  ];

  constructor() {
    super('MenuScene');
  }

  create(): void {
    this.saveData = SaveSystem.load();
    const { width, height, topAdBannerHeight } = ThemeConfig.screen;
    const { colors } = ThemeConfig;

    // 1. TOP SAFE BANNER AD DOCK
    this.add.rectangle(width / 2, topAdBannerHeight / 2, width, topAdBannerHeight, 0x1e1814)
      .setStrokeStyle(2, colors.goldBorder);
    this.add.text(width / 2, topAdBannerHeight / 2, 'ADMOB TOP BANNER AD (SAFE ZONE)', {
      fontSize: '12px',
      color: '#ffd97d',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 2. TITLE HEADER & CURRENCY BAR
    this.add.rectangle(width / 2, 108, width - 20, 68, colors.panelRoyalBlue)
      .setStrokeStyle(3, colors.goldBorder);

    this.add.text(width / 2, 94, 'RICOCHET ALCHEMY: FORGE & FIRE', {
      fontSize: '16px',
      color: '#ffdf73',
      fontStyle: 'bold',
      stroke: '#1e1814',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.coinsText = this.add.text(width / 2, 120, '', {
      fontSize: '13px',
      color: colors.textCream,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.updateCurrencyHeader();

    // 3. WARM PARCHMENT GRIMOIRE SKILL TREE PANEL (Screen 1 Look)
    this.add.rectangle(width / 2, 420, width - 24, 510, colors.panelParchment)
      .setStrokeStyle(4, colors.goldBorder);

    this.add.rectangle(width / 2, 185, 220, 34, colors.panelRoyalBlue)
      .setStrokeStyle(2, colors.goldBorder);
    this.add.text(width / 2, 185, 'ALCHEMIST GRIMOIRE', {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.treeContainer = this.add.container(0, 0);
    this.renderSkillTree();

    // 4. BOTTOM ACTION BUTTONS (PLAY & FREE COINS AD)
    const playBtn = this.add.rectangle(110, height - 70, 175, 54, colors.buttonPlayGreen)
      .setStrokeStyle(3, 0xffffff)
      .setInteractive({ useHandCursor: true });
    this.add.text(110, height - 70, '▶ PLAY BATTLE', {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#1b5e20',
      strokeThickness: 3
    }).setOrigin(0.5);

    playBtn.on('pointerdown', () => {
      SoundSynth.playUpgradeFanfare();
      this.scene.start('BattleScene');
    });

    const freeGoldBtn = this.add.rectangle(width - 110, height - 70, 175, 54, colors.buttonUpgradeOrange)
      .setStrokeStyle(3, colors.goldHighlight)
      .setInteractive({ useHandCursor: true });
    this.add.text(width - 110, height - 70, '🎁 AD: +150 COINS', {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#332211',
      strokeThickness: 3
    }).setOrigin(0.5);

    freeGoldBtn.on('pointerdown', () => {
      this.saveData.coins += 150;
      SaveSystem.save(this.saveData);
      SoundSynth.playUpgradeFanfare();
      this.updateCurrencyHeader();
      this.renderSkillTree();
    });
  }

  private renderSkillTree(): void {
    this.treeContainer.removeAll(true);
    const { colors } = ThemeConfig;

    // Connecting golden branches between skill nodes
    const lines = this.add.graphics();
    lines.lineStyle(5, 0x8d6e63, 1);
    lines.lineBetween(195, 265, 105, 425);
    lines.lineBetween(195, 265, 285, 425);
    lines.lineBetween(105, 425, 285, 425);
    this.treeContainer.add(lines);

    for (const skill of this.skills) {
      const currentLvl = this.saveData.grimoireLevels[skill.key] || 1;
      const cost = skill.baseCost * currentLvl;

      const card = this.add.rectangle(skill.x, skill.y, 152, 128, 0x3b2f26)
        .setStrokeStyle(3, colors.goldBorder);

      const orbIcon = this.add.circle(skill.x, skill.y - 30, 22, skill.color)
        .setStrokeStyle(3, colors.goldHighlight);

      const lvlBadge = this.add.text(skill.x, skill.y - 30, `Lv.${currentLvl}`, {
        fontSize: '12px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5);

      const titleTxt = this.add.text(skill.x, skill.y + 4, skill.title, {
        fontSize: '12px',
        color: '#ffdf73',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      const descTxt = this.add.text(skill.x, skill.y + 21, skill.desc, {
        fontSize: '9px',
        color: '#fff7e6'
      }).setOrigin(0.5);

      const canAfford = this.saveData.coins >= cost;
      const upgBtn = this.add.rectangle(skill.x, skill.y + 45, 126, 26, canAfford ? colors.buttonPlayGreen : 0x616161)
        .setStrokeStyle(1.5, 0xffffff)
        .setInteractive({ useHandCursor: true });

      const btnTxt = this.add.text(skill.x, skill.y + 45, `UPGRADE (${cost}G)`, {
        fontSize: '10px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      upgBtn.on('pointerdown', () => {
        if (this.saveData.coins < cost) {
          SoundSynth.playBounceChime(1);
          return;
        }
        this.saveData.coins -= cost;
        this.saveData.grimoireLevels[skill.key] = currentLvl + 1;
        SaveSystem.save(this.saveData);
        SoundSynth.playUpgradeFanfare();
        this.updateCurrencyHeader();
        this.renderSkillTree();
      });

      this.treeContainer.add([card, orbIcon, lvlBadge, titleTxt, descTxt, upgBtn, btnTxt]);
    }

    // Bottom info summary on parchment
    const infoText = this.add.text(
      ThemeConfig.screen.width / 2,
      585,
      'Upgrades permanently boost your Elemental Runes in all waves!',
      {
        fontSize: '11px',
        color: colors.textDarkBrown,
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);
    this.treeContainer.add(infoText);
  }

  private updateCurrencyHeader(): void {
    this.coinsText.setText(`🪙 COINS: ${this.saveData.coins}      🏆 BEST WAVE: ${this.saveData.highestWave}`);
  }
}
/**
 * Futuristic Crystal-Clean Command Dashboard & Grimoire Skill Tree
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
  x: number;
  y: number;
  baseCost: number;
}

export class MenuScene extends Phaser.Scene {
  private saveData!: PlayerSaveData;
  private coinsText!: Phaser.GameObjects.Text;
  private stageInfoText!: Phaser.GameObjects.Text;
  private treeContainer!: Phaser.GameObjects.Container;

  private readonly skills: SkillNodeConfig[] = [
    {
      key: 'volatileMix',
      title: 'VOLATILE MIX',
      desc: '+15% All Rune Damage',
      texKey: 'orb_FIRE_3',
      x: 195,
      y: 315,
      baseCost: 80
    },
    {
      key: 'empoweredCore',
      title: 'ARCANE CORE',
      desc: '+20% Combo Multiplier',
      texKey: 'orb_LIGHTNING_3',
      x: 105,
      y: 495,
      baseCost: 100
    },
    {
      key: 'alchemistGreed',
      title: 'CRYSTAL GREED',
      desc: '+25% Gold Drops',
      texKey: 'orb_NATURE_3',
      x: 285,
      y: 495,
      baseCost: 90
    }
  ];

  constructor() {
    super('MenuScene');
  }

  create(): void {
    ArtRenderer.generateAllGameTextures(this);
    this.saveData = SaveSystem.load();
    const { width, height, topAdBannerHeight } = ThemeConfig.screen;
    const { colors } = ThemeConfig;

    // 1. TOP SAFE BANNER AD DOCK
    this.add.rectangle(width / 2, topAdBannerHeight / 2, width, topAdBannerHeight, 0x0d0917)
      .setStrokeStyle(1.5, 0x3f2e66);
    this.add.text(width / 2, topAdBannerHeight / 2, 'ADMOB TOP BANNER AD (SAFE ZONE)', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '10px',
      color: '#ffd54f',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 2. FUTURISTIC COMMAND DASHBOARD HEADER
    const g = this.add.graphics();
    g.fillGradientStyle(0x21153b, 0x21153b, 0x100a20, 0x100a20, 1);
    g.fillRoundedRect(12, 70, width - 24, 118, 12);
    g.lineStyle(3, colors.goldBorder, 1);
    g.strokeRoundedRect(12, 70, width - 24, 118, 12);

    this.add.text(width / 2, 92, 'RICOCHET ALCHEMY', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '18px',
      color: '#00e5ff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.add.image(width / 2 - 62, 118, 'icon_coin');
    this.coinsText = this.add.text(width / 2 - 46, 118, '', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '14px',
      color: '#ffd740',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    // Infinite Stage Progression Roadmap inside Dashboard
    this.stageInfoText = this.add.text(width / 2, 145, '', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '10.5px',
      color: '#fff7e6',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.drawCampaignStageNodes(width / 2, 170);
    this.updateCurrencyHeader();

    // 3. FUTURISTIC CRYSTAL GRIMOIRE PANEL
    g.fillGradientStyle(0x160f29, 0x160f29, 0x2a1b4e, 0x2a1b4e, 1);
    g.fillRoundedRect(12, 200, width - 24, 465, 14);
    g.lineStyle(3.5, 0x00e5ff, 0.8);
    g.strokeRoundedRect(12, 200, width - 24, 465, 14);

    this.add.rectangle(width / 2, 222, 240, 32, 0x0d081a)
      .setStrokeStyle(2, colors.goldHighlight);
    this.add.text(width / 2, 222, '❖ ALCHEMIST TECH TREE ❖', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '12px',
      color: '#ffdf73',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.treeContainer = this.add.container(0, 0);
    this.renderSkillTree();

    // 4. BOTTOM 3D GLOSSY TACTILE GAME BUTTONS
    ArtRenderer.createTactileButton(this, 106, height - 66, 'btn_GREEN_lg', '▶ LAUNCH STAGE', '13px', () => {
      SoundSynth.playUpgradeFanfare();
      this.scene.start('BattleScene');
    });

    ArtRenderer.createTactileButton(this, width - 106, height - 66, 'btn_ORANGE_lg', '▶ AD: +150 GOLD', '13px', () => {
      AdService.getInstance().showRewardedAd(() => {
        this.saveData.coins += 150;
        SaveSystem.save(this.saveData);
        SoundSynth.playUpgradeFanfare();
        this.updateCurrencyHeader();
        this.renderSkillTree();
      });
    });

    if (this.saveData.userAgeDeclared === null) {
      this.showNeutralAgeGateModal();
    } else {
      AdService.getInstance().configureAgeCompliance(this.saveData.userAgeDeclared);
      AdService.getInstance().initializeAdMob();
    }
  }

  private drawCampaignStageNodes(centerX: number, y: number): void {
    const wave = this.saveData.highestWave || 1;
    const cycleStart = Math.floor((wave - 1) / 5) * 5 + 1;
    const g = this.add.graphics();
    g.lineStyle(3, 0x00e5ff, 0.5);
    g.lineBetween(centerX - 110, y, centerX + 110, y);

    for (let i = 0; i < 5; i++) {
      const stageNum = cycleStart + i;
      const nx = centerX - 110 + i * 55;
      const isReached = stageNum <= wave;
      const isCurrent = stageNum === wave;

      this.add.circle(nx, y, isCurrent ? 11 : 8, isReached ? 0x00e676 : 0x261e38)
        .setStrokeStyle(2, isCurrent ? 0xffea00 : 0x00e5ff);
      this.add.text(nx, y, `${stageNum}`, {
        fontFamily: "'Orbitron', sans-serif",
        fontSize: '9px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);
    }
  }

  private renderSkillTree(): void {
    this.treeContainer.removeAll(true);

    // Glowing Cyan Energy Conduit Lines between nodes
    const lines = this.add.graphics();
    lines.lineStyle(4, 0x00e5ff, 0.55);
    lines.lineBetween(195, 315, 105, 495);
    lines.lineBetween(195, 315, 285, 495);
    lines.lineBetween(105, 495, 285, 495);
    this.treeContainer.add(lines);

    for (const skill of this.skills) {
      const currentLvl = this.saveData.grimoireLevels[skill.key] || 1;
      const cost = skill.baseCost * currentLvl;

      // Bevelled Dark Crystal Card
      const card = this.add.rectangle(skill.x, skill.y, 156, 144, 0x0f0a1c)
        .setStrokeStyle(2.5, 0xffd54f);

      const orbIcon = this.add.image(skill.x, skill.y - 34, skill.texKey).setScale(0.92);

      const lvlBadge = this.add.text(skill.x + 26, skill.y - 52, `LV.${currentLvl}`, {
        fontFamily: "'Orbitron', sans-serif",
        fontSize: '10px',
        color: '#00e676',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5);

      const titleTxt = this.add.text(skill.x, skill.y + 4, skill.title, {
        fontFamily: "'Orbitron', sans-serif",
        fontSize: '11px',
        color: '#ffdf73',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      const descTxt = this.add.text(skill.x, skill.y + 21, skill.desc, {
        fontFamily: "'Chakra Petch', sans-serif",
        fontSize: '10px',
        color: '#b2ebf2'
      }).setOrigin(0.5);

      const canAfford = this.saveData.coins >= cost;
      const btnTex = canAfford ? 'btn_BLUE_sm' : 'btn_GRAY_sm';

      const upgBtn = ArtRenderer.createTactileButton(
        this,
        skill.x,
        skill.y + 49,
        btnTex,
        `UPGRADE (${cost}G)`,
        '10px',
        () => {
          if (this.saveData.coins < cost) return;
          this.saveData.coins -= cost;
          this.saveData.grimoireLevels[skill.key] = currentLvl + 1;
          SaveSystem.save(this.saveData);
          SoundSynth.playUpgradeFanfare();
          this.updateCurrencyHeader();
          this.renderSkillTree();
        }
      );

      this.treeContainer.add([card, orbIcon, lvlBadge, titleTxt, descTxt, upgBtn]);
    }

    // Properly wrapped footer note inside panel bounds
    const infoText = this.add.text(
      ThemeConfig.screen.width / 2,
      625,
      'PERMANENTLY AMPLIFIES RUNE POWER ACROSS INFINITE STAGES',
      {
        fontFamily: "'Orbitron', sans-serif",
        fontSize: '9.5px',
        color: '#ffd54f',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);
    this.treeContainer.add(infoText);
  }

  private showNeutralAgeGateModal(): void {
    const { width, height } = ThemeConfig.screen;
    const modalGroup = this.add.container(0, 0);
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85).setInteractive();
    const box = this.add.rectangle(width / 2, height / 2, width - 36, 250, 0x160f29)
      .setStrokeStyle(3, 0x00e5ff);

    const title = this.add.text(width / 2, height / 2 - 80, 'WELCOME ALCHEMIST!', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '17px',
      color: '#ffdf73',
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
    const wave = this.saveData.highestWave || 1;
    const meta = WaveSpawner.getWaveMetadata(wave);
    this.coinsText.setText(`${this.saveData.coins} GOLD`);
    this.stageInfoText.setText(`STAGE ${wave}: ${meta.biomeName} (${meta.difficultyLabel})`);
  }
}
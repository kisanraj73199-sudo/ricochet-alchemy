/**
 * PRO-ULTRA Screen 1: Ornate Alchemist Grimoire Skill Tree & Command Dashboard
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
      y: 320,
      baseCost: 80
    },
    {
      key: 'empoweredCore',
      title: 'EMPOWERED CORE',
      desc: '+20% Combo Multiplier',
      texKey: 'orb_LIGHTNING_3',
      x: 105,
      y: 500,
      baseCost: 100
    },
    {
      key: 'alchemistGreed',
      title: 'ALCHEMIST GREED',
      desc: '+25% Gold Drops',
      texKey: 'orb_NATURE_3',
      x: 285,
      y: 500,
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

    // 1. Top Safe Banner Ad Dock
    this.add.rectangle(width / 2, topAdBannerHeight / 2, width, topAdBannerHeight, 0x0d0917)
      .setStrokeStyle(1.5, colors.goldBorder);
    this.add.text(width / 2, topAdBannerHeight / 2, 'ADMOB TOP BANNER AD (SAFE ZONE)', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '10px',
      color: '#ffd54f',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 2. Ornate Royal Blue & Gold Command Header
    ArtRenderer.drawOrnatePanel(this, 12, 68, width - 24, 120, 0x26466d, 0x14243b, 0xffd54f);

    this.add.text(width / 2, 90, 'RICOCHET ALCHEMY', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '19px',
      color: '#ffea00',
      fontStyle: 'bold',
      stroke: '#241200',
      strokeThickness: 5
    }).setOrigin(0.5);

    this.add.image(width / 2 - 64, 116, 'icon_coin').setScale(1.1);
    this.coinsText = this.add.text(width / 2 - 46, 116, '', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '14px',
      color: '#ffd740',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0, 0.5);

    this.stageInfoText = this.add.text(width / 2, 143, '', {
      fontFamily: "'Chakra Petch', sans-serif",
      fontSize: '11px',
      color: '#fff7e6',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.drawCampaignStageNodes(width / 2, 168);
    this.updateCurrencyHeader();

    // 3. Warm Parchment & Gold Ornate Grimoire Panel (Matching Reference Pic Screen 1!)
    ArtRenderer.drawOrnatePanel(this, 12, 198, width - 24, 470, 0xf3dcb9, 0xd4b07f, 0xffb300);

    // Royal Blue Ribbon Header on top of Parchment
    ArtRenderer.drawOrnatePanel(this, width / 2 - 125, 208, 250, 36, 0x26466d, 0x162942, 0xffd54f);
    this.add.text(width / 2, 226, '✨ ALCHEMIST GRIMOIRE ✨', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '12px',
      color: '#ffdf73',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.treeContainer = this.add.container(0, 0);
    this.renderSkillTree();

    // 4. Bottom 3D Glossy Tactile Game Buttons
    ArtRenderer.createTactileButton(this, 106, height - 66, 'btn_GREEN_lg', '▶ PLAY BATTLE', '13px', () => {
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
    g.lineStyle(3.5, 0xffd54f, 0.65);
    g.lineBetween(centerX - 110, y, centerX + 110, y);

    for (let i = 0; i < 5; i++) {
      const stageNum = cycleStart + i;
      const nx = centerX - 110 + i * 55;
      const isReached = stageNum <= wave;
      const isCurrent = stageNum === wave;

      this.add.circle(nx, y, isCurrent ? 11 : 8, isReached ? 0x00c853 : 0x1a2639)
        .setStrokeStyle(2, isCurrent ? 0xffea00 : 0xffd54f);
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

    // Ornate Golden Conduit Lines connecting Skill Nodes
    const lines = this.add.graphics();
    lines.lineStyle(7, 0x5d3a1a, 1);
    lines.lineBetween(195, 320, 105, 500);
    lines.lineBetween(195, 320, 285, 500);
    lines.lineBetween(105, 500, 285, 500);
    lines.lineStyle(3, 0xffd54f, 1);
    lines.lineBetween(195, 320, 105, 500);
    lines.lineBetween(195, 320, 285, 500);
    lines.lineBetween(105, 500, 285, 500);
    this.treeContainer.add(lines);

    for (const skill of this.skills) {
      const currentLvl = this.saveData.grimoireLevels[skill.key] || 1;
      const cost = skill.baseCost * currentLvl;

      // Ornate Dark Stone Skill Node Card
      const card = ArtRenderer.drawOrnatePanel(
        this,
        skill.x - 78,
        skill.y - 74,
        156,
        148,
        0x3b281e,
        0x1f140e,
        0xffca28
      );

      const orbIcon = this.add.image(skill.x, skill.y - 34, skill.texKey).setScale(0.94);

      const lvlBadge = this.add.text(skill.x + 28, skill.y - 52, `Lv.${currentLvl}`, {
        fontFamily: "'Orbitron', sans-serif",
        fontSize: '10px',
        color: '#69f0ae',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5);

      const titleTxt = this.add.text(skill.x, skill.y + 4, skill.title, {
        fontFamily: "'Orbitron', sans-serif",
        fontSize: '11px',
        color: '#ffdf73',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5);

      const descTxt = this.add.text(skill.x, skill.y + 21, skill.desc, {
        fontFamily: "'Chakra Petch', sans-serif",
        fontSize: '10px',
        color: '#fff7e6',
        fontStyle: 'bold'
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

    const infoText = this.add.text(
      ThemeConfig.screen.width / 2,
      634,
      'PERMANENTLY BOOSTS ELEMENTAL RUNE POWER IN ALL STAGES',
      {
        fontFamily: "'Orbitron', sans-serif",
        fontSize: '9.5px',
        color: '#3e2723',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);
    this.treeContainer.add(infoText);
  }

  private showNeutralAgeGateModal(): void {
    const { width, height } = ThemeConfig.screen;
    const modalGroup = this.add.container(0, 0);
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85).setInteractive();
    const box = ArtRenderer.drawOrnatePanel(this, 22, height / 2 - 125, width - 44, 250, 0x26466d, 0x14243b, 0xffd54f);

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
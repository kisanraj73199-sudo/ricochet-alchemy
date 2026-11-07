import Phaser from 'phaser';
import { ThemeConfig } from './config/ThemeConfig';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { BattleScene } from './scenes/BattleScene';
import { RewardModalScene } from './scenes/RewardModalScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: ThemeConfig.screen.width,
  height: ThemeConfig.screen.height,
  backgroundColor: '#2b231d',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, MenuScene, BattleScene, RewardModalScene]
};

new Phaser.Game(config);

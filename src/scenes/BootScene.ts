import Phaser from 'phaser';
import { SaveSystem } from '../core/SaveSystem';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create(): void {
    // Load & automatically migrate offline save data on startup
    SaveSystem.load();
    this.scene.start('BattleScene');
  }
}

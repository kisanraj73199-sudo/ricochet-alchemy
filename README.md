# Ricochet Alchemy: Forge & Fire (Blueprint & Modular Architecture)

Welcome to the official repository for **Ricochet Alchemy: Forge & Fire**!
This project is built with **Phaser 3 + TypeScript + Vite + Capacitor** for Android, designed with strict modularity (max ~150 lines per file) so solo developers and future collaborators can work cleanly in VS Code.

## Key UI & AdMob Layout Decision
* **Top Safe Banner Ad (`TOP_CENTER`)**: As updated in our blueprint, the Banner Ad is placed at the **VERY TOP** of the screen (`60px` reserved safe header with a `12px` golden stone separator border below it).
* **Why Top Banner?** Since the player's thumb is constantly dragging and merging runes on the **Bottom 4x3 Forge Grid** and aiming at the bottom cannon, placing the Banner Ad at the **TOP** guarantees **ZERO accidental clicks** during intense gameplay and keeps the bottom controls 100% comfortable!

## Quick Start in VS Code
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run Instant Live Preview (Laptop + Wi-Fi Mobile):
   ```bash
   npm run dev
   ```
3. Run Automated Unit Tests:
   ```bash
   npm test
   ```
4. Build for Android:
   ```bash
   npm run android:sync
   ```

## Folder Structure
- `src/config/`: Pure data files (Theme colors, Orbs stats, Monster waves, AdMob IDs & Top-Banner config).
- `src/core/`: Reusable core systems (`SaveSystem.ts` with schema migration, `AdService.ts` with Top Banner & 180s interstitial cooldown, `SoundSynth.ts`, `EventBus.ts`).
- `src/gameplay/`: Modular gameplay engines (`ArenaPhysics.ts`, `ForgeGrid.ts`, `ElementalCombos.ts`, `WaveSpawner.ts`).
- `src/scenes/`: Screen flows (`BootScene.ts`, `MenuScene.ts`, `BattleScene.ts`, `RewardModalScene.ts`).
- `.github/workflows/`: Automated GitHub Actions for `branch-1` Debug APK previews and `main` Signed Play Store AAB releases.

/**
 * PRO-ULTRA 10-STAGE WORLD SCENERY, 2X/3X PRISM BUBBLES & 3D SCOREBOARD ART ENGINE
 */
import Phaser from 'phaser';
import { ElementType } from '../config/OrbsConfig';
import { SoundSynth } from '../core/SoundSynth';
import { BiomePalette } from '../gameplay/WaveSpawner';

export class ArtRenderer {
    public static generateAllGameTextures(scene: Phaser.Scene): void {
        if (scene.textures.exists('mega_upgrade_v7')) return;
        scene.textures.createCanvas('mega_upgrade_v7', 2, 2)?.refresh();

        this.createSeamlessWorldBackground(scene);

        // 1. Player Elemental Orbs
        const elements: ElementType[] = ['FIRE', 'ICE', 'LIGHTNING', 'NATURE'];
        for (const el of elements) {
            for (let tier = 1; tier <= 4; tier++) {
                this.createUltraOrbTexture(scene, `orb_${el}_${tier}`, el, tier);
            }
        }

        // 2. Super-Shiny 3D Gem Bubbles + Cursed Bomb + 2X & 3X Multiball Prisms + Wormhole Portals
        this.createShinyTargetBubbleTexture(scene, 'monster_ICE', '#ffffff', '#00f5ff', '#0055ff', '#001233', false);
        this.createShinyTargetBubbleTexture(scene, 'monster_VOID', '#ffffff', '#ff6ec7', '#aa00ff', '#21003b', false);
        this.createShinyTargetBubbleTexture(scene, 'monster_MAGMA', '#fffde7', '#ffab00', '#ff1744', '#3e000b', false);
        this.createShinyTargetBubbleTexture(scene, 'monster_HEALER', '#ffffff', '#69f0ae', '#00c853', '#002910', false);
        this.createShinyTargetBubbleTexture(scene, 'monster_BOSS', '#ffffff', '#00f5ff', '#ff007f', '#1c0038', true);
        this.createCursedBombBubbleTexture(scene, 'monster_BOMB');
        this.createPrismMysteryBubbleTexture(scene, 'monster_PRISM', '2X', '#00f5ff', '#7c4dff');
        this.createPrismMysteryBubbleTexture(scene, 'monster_PRISM_3X', '3X', '#ffea00', '#ff007f');
        this.createWormholePortalTexture(scene, 'portal_BLUE', '#00f5ff', '#0044ff');
        this.createWormholePortalTexture(scene, 'portal_ORANGE', '#ffea00', '#ff3d00');

        // 3. Medallions, 3D Number Badges & Hero Play Portal
        this.createIconMedallionTexture(scene, 'medallion_CYAN', 66, '#00f5ff', '#0055ff');
        this.createIconMedallionTexture(scene, 'medallion_GOLD', 66, '#ffea00', '#ff6d00');
        this.createIconMedallionTexture(scene, 'medallion_GREEN', 66, '#00f5a0', '#008c4a');
        this.createIconMedallionTexture(scene, 'medallion_MAGENTA', 66, '#ff4081', '#8e00b8');
        this.createHeroPlayPortalTexture(scene, 'medallion_PLAY', 114);
        this.create3DNumberPillTexture(scene, 'hp_pill_badge', 46, 18);

        // 4. Sleek Pill Action Buttons
        this.createSleekPillTexture(scene, 'btn_GREEN_lg', 180, 52, '#00f5a0', '#009e52');
        this.createSleekPillTexture(scene, 'btn_ORANGE_lg', 180, 52, '#ff9100', '#ff0055');
        this.createSleekPillTexture(scene, 'btn_GREEN_md', 160, 44, '#00f5a0', '#009e52');
        this.createSleekPillTexture(scene, 'btn_ORANGE_md', 160, 44, '#ff9100', '#ff0055');
        this.createSleekPillTexture(scene, 'btn_BLUE_sm', 126, 34, '#00f5ff', '#0055ff');
        this.createSleekPillTexture(scene, 'btn_GRAY_sm', 126, 34, '#607d8b', '#263238');
        this.createSleekPillTexture(scene, 'btn_PURPLE_nav', 88, 34, '#ff4081', '#7b1fa2');

        // 5. Luxury Scoreboard Crest, Dragon-Tech Cannon, Spinning Pedestal, Chests & Particles
        this.createLuxuryScoreboardCrestTexture(scene);
        this.createHoloRingSlotTexture(scene, 'slot_normal', false);
        this.createHoloRingSlotTexture(scene, 'slot_top_queue', true);
        this.createCannonPedestalRingTexture(scene);
        this.createFuturisticCannonTexture(scene);
        this.createClosedChestTexture(scene);
        this.createTreasureChestTexture(scene);
        this.createSunburstTexture(scene);
        this.createCustomGameIcons(scene);
        this.createParticleTexture(scene);
    }

    private static create3DNumberPillTexture(scene: Phaser.Scene, key: string, w: number, h: number): void {
        const canvasTex = scene.textures.createCanvas(key, w, h);
        if (!canvasTex) return;
        const ctx = canvasTex.getContext();

        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, 'rgba(24, 12, 48, 0.92)');
        grad.addColorStop(1, 'rgba(6, 3, 14, 0.95)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(1, 1, w - 2, h - 2, h / 2);
        ctx.fill();

        ctx.lineWidth = 1.4;
        ctx.strokeStyle = 'rgba(255, 202, 40, 0.85)';
        ctx.stroke();

        canvasTex.refresh();
    }

    private static createLuxuryScoreboardCrestTexture(scene: Phaser.Scene): void {
        const w = 378;
        const h = 64;
        const canvasTex = scene.textures.createCanvas('scoreboard_crest', w, h);
        if (!canvasTex) return;
        const ctx = canvasTex.getContext();
        const cx = w / 2;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.beginPath();
        ctx.roundRect(4, 6, w - 8, h - 8, 16);
        ctx.fill();

        const bodyGrad = ctx.createLinearGradient(0, 2, 0, h - 6);
        bodyGrad.addColorStop(0, '#1e1042');
        bodyGrad.addColorStop(0.5, '#0e0724');
        bodyGrad.addColorStop(1, '#060312');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.roundRect(4, 3, w - 8, h - 9, 16);
        ctx.fill();

        const crownGrad = ctx.createLinearGradient(cx - 95, 2, cx + 95, h - 4);
        crownGrad.addColorStop(0, '#2b145e');
        crownGrad.addColorStop(0.5, '#160936');
        crownGrad.addColorStop(1, '#2b145e');
        ctx.fillStyle = crownGrad;
        ctx.beginPath();
        ctx.moveTo(cx - 98, 3);
        ctx.lineTo(cx + 98, 3);
        ctx.lineTo(cx + 82, h - 4);
        ctx.lineTo(cx - 82, h - 4);
        ctx.closePath();
        ctx.fill();

        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#ffca28';
        ctx.beginPath();
        ctx.roundRect(4, 3, w - 8, h - 9, 16);
        ctx.stroke();

        ctx.lineWidth = 1.8;
        ctx.strokeStyle = '#00f5ff';
        ctx.beginPath();
        ctx.moveTo(cx - 96, 4);
        ctx.lineTo(cx - 82, h - 5);
        ctx.moveTo(cx + 96, 4);
        ctx.lineTo(cx + 82, h - 5);
        ctx.stroke();

        const shine = ctx.createLinearGradient(0, 4, 0, 22);
        shine.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
        shine.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = shine;
        ctx.beginPath();
        ctx.roundRect(14, 5, w - 28, 16, 8);
        ctx.fill();

        canvasTex.refresh();
    }

    private static createCannonPedestalRingTexture(scene: Phaser.Scene): void {
        const size = 104;
        const canvasTex = scene.textures.createCanvas('cannon_pedestal_ring', size, size);
        if (!canvasTex) return;
        const ctx = canvasTex.getContext();
        const cx = size / 2;
        const cy = size / 2;

        const glow = ctx.createRadialGradient(cx, cy, 8, cx, cy, 48);
        glow.addColorStop(0, 'rgba(255, 145, 0, 0.55)');
        glow.addColorStop(0.55, 'rgba(0, 245, 255, 0.35)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, 48, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffca28';
        ctx.lineWidth = 2.5;
        for (let i = 0; i < 6; i++) {
            const a = (Math.PI * 2 * i) / 6;
            ctx.beginPath();
            ctx.arc(cx, cy, 38, a + 0.08, a + 0.82);
            ctx.stroke();
        }

        ctx.strokeStyle = 'rgba(0, 245, 255, 0.75)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const a = (Math.PI * 2 * i) / 8;
            const px = cx + Math.cos(a) * 29;
            const py = cy + Math.sin(a) * 29;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();

        for (let i = 0; i < 8; i++) {
            const a = (Math.PI * 2 * i) / 8;
            const nx = cx + Math.cos(a) * 38;
            const ny = cy + Math.sin(a) * 38;
            ctx.fillStyle = i % 2 === 0 ? '#00f5ff' : '#ffea00';
            ctx.beginPath();
            ctx.arc(nx, ny, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        canvasTex.refresh();
    }

    private static createFuturisticCannonTexture(scene: Phaser.Scene): void {
        const size = 92;
        const canvasTex = scene.textures.createCanvas('cannon_turret', size, size);
        if (!canvasTex) return;
        const ctx = canvasTex.getContext();
        const cx = 42;
        const cy = size / 2;

        const muzzleGlow = ctx.createRadialGradient(cx + 28, cy, 2, cx + 28, cy, 18);
        muzzleGlow.addColorStop(0, 'rgba(255, 234, 0, 0.9)');
        muzzleGlow.addColorStop(0.6, 'rgba(255, 61, 0, 0.45)');
        muzzleGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = muzzleGlow;
        ctx.beginPath();
        ctx.arc(cx + 28, cy, 18, 0, Math.PI * 2);
        ctx.fill();

        const barrelGrad = ctx.createLinearGradient(cx, cy - 11, cx + 34, cy + 11);
        barrelGrad.addColorStop(0, '#1a0b36');
        barrelGrad.addColorStop(0.5, '#00f5ff');
        barrelGrad.addColorStop(1, '#ff6d00');
        ctx.fillStyle = barrelGrad;
        ctx.beginPath();
        ctx.roundRect(cx, cy - 9, 34, 18, 6);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        const wingGrad = ctx.createLinearGradient(cx - 18, cy - 28, cx + 28, cy + 28);
        wingGrad.addColorStop(0, '#fff59d');
        wingGrad.addColorStop(0.45, '#ffca28');
        wingGrad.addColorStop(0.85, '#ff3d00');
        wingGrad.addColorStop(1, '#880e4f');

        ctx.fillStyle = wingGrad;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(cx - 10, cy - 12);
        ctx.lineTo(cx + 32, cy - 7);
        ctx.lineTo(cx + 22, cy - 19);
        ctx.lineTo(cx - 4, cy - 28);
        ctx.lineTo(cx - 18, cy - 18);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx - 10, cy + 12);
        ctx.lineTo(cx + 32, cy + 7);
        ctx.lineTo(cx + 22, cy + 19);
        ctx.lineTo(cx - 4, cy + 28);
        ctx.lineTo(cx - 18, cy + 18);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        const baseGrad = ctx.createRadialGradient(cx - 5, cy - 5, 3, cx, cy, 20);
        baseGrad.addColorStop(0, '#311b61');
        baseGrad.addColorStop(1, '#090414');
        ctx.fillStyle = baseGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, 19, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#ffca28';
        ctx.stroke();

        const gemGrad = ctx.createRadialGradient(cx - 3, cy - 3, 1, cx, cy, 11);
        gemGrad.addColorStop(0, '#ffffff');
        gemGrad.addColorStop(0.45, '#00f5ff');
        gemGrad.addColorStop(0.85, '#0055ff');
        gemGrad.addColorStop(1, '#001945');
        ctx.fillStyle = gemGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        canvasTex.refresh();
    }

    /**
     * Renders a Completely Distinct 10-Stage World Scenery & Color Theme!
     * Every 10 stages (1-10, 11-20, 21-30, 31-40, 41-50, 51-60) switches both colors AND sacred geometry!
     */
    public static drawDynamicBiomeWorld(
        scene: Phaser.Scene,
        width: number,
        height: number,
        palette: BiomePalette
    ): void {
        const g = scene.add.graphics();

        // 1. Deep 10-Stage World Sky Gradient
        g.fillGradientStyle(palette.topBg, palette.topBg, palette.bottomBg, palette.bottomBg, 1);
        g.fillRect(0, 0, width, height);

        // 2. Dual Pulsing Nebula Auroras
        const neb1 = scene.add.circle(width * 0.3, height * 0.35, 165, palette.nebulaGlow, 0.12);
        const neb2 = scene.add.circle(width * 0.72, height * 0.56, 155, palette.railColor, 0.1);
        scene.tweens.add({
            targets: [neb1, neb2],
            scaleX: 1.2,
            scaleY: 1.2,
            alpha: 0.04,
            duration: 2800,
            yoyo: true,
            repeat: -1
        });

        // 3. Unique Architectural Background Pattern per 10-Stage Chapter!
        g.lineStyle(1.2, palette.gridColor, 0.11);
        if (palette.patternStyle === 'MAGMA') {
            // Diagonal Volcanic Fissure Lines
            for (let i = -200; i < height; i += 65) {
                g.lineBetween(0, i, width, i + 180);
                g.lineBetween(width, i, 0, i + 180);
            }
        } else if (palette.patternStyle === 'BIORING') {
            // Concentric Bio-AlchemicalSacred Rings
            for (let r = 60; r <= 320; r += 65) {
                g.strokeCircle(width / 2, height * 0.44, r);
            }
        } else if (palette.patternStyle === 'CYBER') {
            // Perspective Synthwave Horizon Rays
            for (let x = -120; x <= width + 120; x += 60) {
                g.lineBetween(width / 2, 110, x, height - 100);
            }
            for (let y = 160; y < height - 100; y += 46) {
                g.lineBetween(0, y, width, y);
            }
        } else if (palette.patternStyle === 'SOLAR') {
            // Imperial Golden Diamond Lattice
            for (let y = 130; y < height - 120; y += 70) {
                for (let x = 45; x < width - 30; x += 75) {
                    g.strokeRect(x - 18, y - 18, 36, 36);
                }
            }
        } else {
            // Crystal Starlight & Frost Matrix Grid
            for (let y = 120; y < height - 90; y += 52) {
                g.lineBetween(0, y, width, y);
            }
            for (let x = 32; x < width; x += 55) {
                g.lineBetween(x, 105, x, height - 90);
            }
        }

        // 4. Left & Right Laser Bumper Rails
        g.fillStyle(palette.railColor, 0.85);
        g.fillRect(0, 100, 4, height - 210);
        g.fillRect(width - 4, 100, 4, height - 210);

        // 5. Floating Chapter Particles
        for (let i = 0; i < 9; i++) {
            const px = 30 + ((i * 43) % (width - 60));
            const py = 140 + ((i * 79) % (height - 280));
            const mote = scene.add.image(px, py, 'glow_spark')
                .setTint(palette.particleTint)
                .setAlpha(0.42)
                .setScale(0.7);

            scene.tweens.add({
                targets: mote,
                y: py - 38,
                alpha: 0.1,
                duration: 1700 + i * 230,
                yoyo: true,
                repeat: -1
            });
        }
    }

    private static createSeamlessWorldBackground(scene: Phaser.Scene): void {
        const w = 390;
        const h = 844;
        const canvasTex = scene.textures.createCanvas('world_bg_seamless', w, h);
        if (!canvasTex) return;
        const ctx = canvasTex.getContext();

        const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, '#04020b');
        bgGrad.addColorStop(0.32, '#0d0626');
        bgGrad.addColorStop(0.68, '#1a0b3e');
        bgGrad.addColorStop(1, '#070314');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        canvasTex.refresh();
    }

    /**
     * Supports both '2X' (Cyan-Violet) and '3X' (Gold-Magenta Jackpot) Multiball Split-Prism Bubbles!
     */
    private static createPrismMysteryBubbleTexture(
        scene: Phaser.Scene,
        key: string,
        label: string,
        c1: string,
        c2: string
    ): void {
        const size = 62;
        const canvasTex = scene.textures.createCanvas(key, size, size);
        if (!canvasTex) return;
        const ctx = canvasTex.getContext();
        const cx = size / 2;
        const cy = size / 2;
        const r = 22;

        const halo = ctx.createRadialGradient(cx, cy, r * 0.4, cx, cy, r + 8);
        halo.addColorStop(0, c1);
        halo.addColorStop(0.55, c2);
        halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(cx, cy, r + 8, 0, Math.PI * 2);
        ctx.fill();

        const bodyGrad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
        bodyGrad.addColorStop(0, '#ffffff');
        bodyGrad.addColorStop(0.3, c1);
        bodyGrad.addColorStop(0.75, c2);
        bodyGrad.addColorStop(1, '#1a0033');

        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.lineWidth = 2.6;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 15px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, cx, cy + 1);

        ctx.fillStyle = 'rgba(255,255,255,0.88)';
        ctx.beginPath();
        ctx.ellipse(cx - 5, cy - 10, 9, 4, -0.45, 0, Math.PI * 2);
        ctx.fill();

        canvasTex.refresh();
    }

    private static createWormholePortalTexture(
        scene: Phaser.Scene,
        key: string,
        brightHex: string,
        deepHex: string
    ): void {
        const size = 64;
        const canvasTex = scene.textures.createCanvas(key, size, size);
        if (!canvasTex) return;
        const ctx = canvasTex.getContext();
        const cx = size / 2;
        const cy = size / 2;

        const glow = ctx.createRadialGradient(cx, cy, 4, cx, cy, 28);
        glow.addColorStop(0, '#ffffff');
        glow.addColorStop(0.35, brightHex);
        glow.addColorStop(0.7, deepHex);
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, 28, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.2;
        for (let i = 0; i < 3; i++) {
            const a = (Math.PI * 2 * i) / 3;
            ctx.beginPath();
            ctx.arc(cx, cy, 16, a, a + 1.3);
            ctx.stroke();
        }

        ctx.fillStyle = '#05020d';
        ctx.beginPath();
        ctx.arc(cx, cy, 7, 0, Math.PI * 2);
        ctx.fill();

        canvasTex.refresh();
    }

    private static createShinyTargetBubbleTexture(
        scene: Phaser.Scene,
        key: string,
        specHex: string,
        brightHex: string,
        midHex: string,
        deepHex: string,
        isBoss: boolean
    ): void {
        const size = isBoss ? 156 : 62;
        const canvasTex = scene.textures.createCanvas(key, size, size);
        if (!canvasTex) return;
        const ctx = canvasTex.getContext();
        const cx = size / 2;
        const cy = size / 2;
        const r = isBoss ? 58 : 23;

        const halo = ctx.createRadialGradient(cx, cy, r * 0.65, cx, cy, r + (isBoss ? 16 : 7));
        halo.addColorStop(0, brightHex);
        halo.addColorStop(0.55, midHex);
        halo.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(cx, cy, r + (isBoss ? 16 : 7), 0, Math.PI * 2);
        ctx.fill();

        const sphereGrad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.32, 2, cx, cy, r);
        sphereGrad.addColorStop(0, specHex);
        sphereGrad.addColorStop(0.28, brightHex);
        sphereGrad.addColorStop(0.68, midHex);
        sphereGrad.addColorStop(1, deepHex);

        ctx.fillStyle = sphereGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.38)';
        ctx.lineWidth = isBoss ? 2 : 1.2;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const a = (Math.PI * 2 * i) / 6;
            const px = cx + Math.cos(a) * (r * 0.62);
            const py = cy + Math.sin(a) * (r * 0.62);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();

        const rimLight = ctx.createLinearGradient(cx, cy + r * 0.3, cx, cy + r);
        rimLight.addColorStop(0, 'rgba(255,255,255,0)');
        rimLight.addColorStop(1, brightHex);
        ctx.fillStyle = rimLight;
        ctx.beginPath();
        ctx.arc(cx, cy, r - 1.5, 0.35, Math.PI - 0.35);
        ctx.fill();

        ctx.lineWidth = isBoss ? 3.5 : 2.2;
        ctx.strokeStyle = isBoss ? '#ffea00' : '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();

        const glossGrad = ctx.createLinearGradient(cx - r * 0.5, cy - r * 0.85, cx, cy - r * 0.1);
        glossGrad.addColorStop(0, 'rgba(255,255,255,0.96)');
        glossGrad.addColorStop(1, 'rgba(255,255,255,0.0)');
        ctx.fillStyle = glossGrad;
        ctx.beginPath();
        ctx.ellipse(cx - r * 0.24, cy - r * 0.45, r * 0.46, r * 0.24, -0.45, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx - r * 0.54, cy - r * 0.14, isBoss ? 4.5 : 2.4, 0, Math.PI * 2);
        ctx.fill();

        canvasTex.refresh();
    }

    private static createCursedBombBubbleTexture(scene: Phaser.Scene, key: string): void {
        const size = 62;
        const canvasTex = scene.textures.createCanvas(key, size, size);
        if (!canvasTex) return;
        const ctx = canvasTex.getContext();
        const cx = size / 2;
        const cy = size / 2;
        const r = 21;

        const aura = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r + 8);
        aura.addColorStop(0, 'rgba(255, 0, 60, 0.9)');
        aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(cx, cy, r + 8, 0, Math.PI * 2);
        ctx.fill();

        for (let i = 0; i < 8; i++) {
            const a = (Math.PI * 2 * i) / 8;
            const sx = cx + Math.cos(a) * (r + 5);
            const sy = cy + Math.sin(a) * (r + 5);
            ctx.fillStyle = '#ff1744';
            ctx.beginPath();
            ctx.arc(sx, sy, 3.2, 0, Math.PI * 2);
            ctx.fill();
        }

        const bodyGrad = ctx.createRadialGradient(cx - 6, cy - 6, 2, cx, cy, r);
        bodyGrad.addColorStop(0, '#ff5252');
        bodyGrad.addColorStop(0.45, '#880e4f');
        bodyGrad.addColorStop(0.85, '#1a000d');
        bodyGrad.addColorStop(1, '#000000');

        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.lineWidth = 2.4;
        ctx.strokeStyle = '#ff1744';
        ctx.stroke();

        ctx.strokeStyle = '#ffea00';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx - 7, cy - 7);
        ctx.lineTo(cx + 7, cy + 7);
        ctx.moveTo(cx + 7, cy - 7);
        ctx.lineTo(cx - 7, cy + 7);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.beginPath();
        ctx.ellipse(cx - 5, cy - 10, 9, 4, -0.45, 0, Math.PI * 2);
        ctx.fill();

        canvasTex.refresh();
    }

    private static createHeroPlayPortalTexture(scene: Phaser.Scene, key: string, size: number): void {
        const canvasTex = scene.textures.createCanvas(key, size, size);
        if (!canvasTex) return;
        const ctx = canvasTex.getContext();
        const cx = size / 2;
        const cy = size / 2;
        const r = size / 2 - 8;

        const glow = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r + 7);
        glow.addColorStop(0, 'rgba(0, 245, 160, 0.95)');
        glow.addColorStop(0.6, 'rgba(0, 229, 255, 0.45)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, r + 7, 0, Math.PI * 2);
        ctx.fill();

        const ringGrad = ctx.createLinearGradient(0, 0, size, size);
        ringGrad.addColorStop(0, '#fff59d');
        ringGrad.addColorStop(0.5, '#ffca28');
        ringGrad.addColorStop(1, '#ff6f00');
        ctx.fillStyle = ringGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        const coreGrad = ctx.createRadialGradient(cx - 10, cy - 12, 4, cx, cy, r - 6);
        coreGrad.addColorStop(0, '#b9f6ca');
        coreGrad.addColorStop(0.45, '#00e676');
        coreGrad.addColorStop(0.85, '#0077c2');
        coreGrad.addColorStop(1, '#00264d');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, r - 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        ctx.fillStyle = 'rgba(255,255,255,0.65)';
        ctx.beginPath();
        ctx.ellipse(cx - 6, cy - (r - 6) * 0.5, (r - 6) * 0.52, (r - 6) * 0.24, -0.3, 0, Math.PI * 2);
        ctx.fill();

        canvasTex.refresh();
    }

    private static createIconMedallionTexture(
        scene: Phaser.Scene,
        key: string,
        size: number,
        rimHex: string,
        coreHex: string
    ): void {
        const canvasTex = scene.textures.createCanvas(key, size, size);
        if (!canvasTex) return;
        const ctx = canvasTex.getContext();
        const cx = size / 2;
        const cy = size / 2;
        const r = size / 2 - 5;

        const glow = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r + 5);
        glow.addColorStop(0, rimHex);
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
        ctx.fill();

        const grad = ctx.createRadialGradient(cx - 6, cy - 8, 2, cx, cy, r);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.25, rimHex);
        grad.addColorStop(0.68, coreHex);
        grad.addColorStop(1, '#080314');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        ctx.fillStyle = 'rgba(255,255,255,0.58)';
        ctx.beginPath();
        ctx.ellipse(cx - 3, cy - r * 0.48, r * 0.52, r * 0.24, -0.25, 0, Math.PI * 2);
        ctx.fill();

        canvasTex.refresh();
    }

    private static createSleekPillTexture(
        scene: Phaser.Scene,
        key: string,
        w: number,
        h: number,
        c1: string,
        c2: string
    ): void {
        const canvasTex = scene.textures.createCanvas(key, w, h);
        if (!canvasTex) return;
        const ctx = canvasTex.getContext();
        const r = h / 2 - 3;

        const grad = ctx.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, c1);
        grad.addColorStop(1, c2);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(3, 3, w - 6, h - 6, r);
        ctx.fill();

        ctx.lineWidth = 2.2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        ctx.fillStyle = 'rgba(255,255,255,0.38)';
        ctx.beginPath();
        ctx.roundRect(10, 5, w - 20, (h - 10) * 0.4, r);
        ctx.fill();

        canvasTex.refresh();
    }

    public static drawOrnatePanel(
        scene: Phaser.Scene,
        x: number,
        y: number,
        w: number,
        h: number,
        topColor: number = 0x140a29,
        bottomColor: number = 0x070312,
        borderColor: number = 0x00f5ff
    ): Phaser.GameObjects.Graphics {
        const g = scene.add.graphics();
        g.fillGradientStyle(topColor, topColor, bottomColor, bottomColor, 0.84);
        g.fillRoundedRect(x, y, w, h, 24);
        g.lineStyle(1.5, borderColor, 0.45);
        g.strokeRoundedRect(x, y, w, h, 24);
        return g;
    }

    public static createTactileButton(
        scene: Phaser.Scene,
        x: number,
        y: number,
        texKey: string,
        label: string,
        fontSize: string,
        onClick: () => void
    ): Phaser.GameObjects.Container {
        const container = scene.add.container(x, y);
        const bg = scene.add.image(0, 0, texKey);
        const txt = scene.add.text(0, -1, label, {
            fontFamily: "'Orbitron', 'Chakra Petch', sans-serif",
            fontSize,
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#05020d',
            strokeThickness: 4,
            shadow: { offsetX: 0, offsetY: 2, color: '#000000', blur: 3, fill: true }
        }).setOrigin(0.5);

        container.add([bg, txt]);
        bg.setInteractive({ useHandCursor: true });

        bg.on('pointerdown', () => {
            SoundSynth.playBounceChime(3);
            scene.tweens.add({
                targets: container,
                scaleX: 0.9,
                scaleY: 0.9,
                duration: 60,
                yoyo: true,
                onComplete: () => onClick()
            });
        });

        return container;
    }

    private static createHoloRingSlotTexture(scene: Phaser.Scene, key: string, isPrimary: boolean): void {
        const size = 64;
        const canvasTex = scene.textures.createCanvas(key, size, size);
        if (!canvasTex) return;
        const ctx = canvasTex.getContext();
        const cx = size / 2;
        const cy = size / 2;

        const grad = ctx.createRadialGradient(cx, cy, 8, cx, cy, 28);
        grad.addColorStop(0, 'rgba(15, 8, 34, 0.85)');
        grad.addColorStop(0.75, isPrimary ? 'rgba(0, 245, 255, 0.28)' : 'rgba(255, 202, 40, 0.18)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, 28, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = isPrimary ? '#00f5ff' : 'rgba(255, 202, 40, 0.65)';
        ctx.lineWidth = isPrimary ? 2.4 : 1.6;
        ctx.beginPath();
        ctx.arc(cx, cy, 24, 0, Math.PI * 2);
        ctx.stroke();

        canvasTex.refresh();
    }

    private static createUltraOrbTexture(
        scene: Phaser.Scene,
        key: string,
        element: ElementType,
        tier: number
    ): void {
        const size = 68;
        const canvasTex = scene.textures.createCanvas(key, size, size);
        if (!canvasTex) return;
        const ctx = canvasTex.getContext();
        const cx = size / 2;
        const cy = size / 2;
        const r = 23;

        const palettes: Record<ElementType, { core: string; mid: string; rim: string; deep: string; glow: string }> = {
            FIRE: { core: '#ffffff', mid: '#ff6d00', rim: '#ff1744', deep: '#3b0000', glow: 'rgba(255, 110, 0, 0.95)' },
            ICE: { core: '#ffffff', mid: '#00f5ff', rim: '#0066ff', deep: '#001538', glow: 'rgba(0, 245, 255, 0.95)' },
            LIGHTNING: { core: '#ffffff', mid: '#ff4081', rim: '#aa00ff', deep: '#210038', glow: 'rgba(224, 64, 251, 0.95)' },
            NATURE: { core: '#ffffff', mid: '#00f5a0', rim: '#00a152', deep: '#002610', glow: 'rgba(0, 245, 160, 0.95)' }
        };
        const pal = palettes[element];

        const auraGrad = ctx.createRadialGradient(cx, cy, r - 6, cx, cy, r + 9);
        auraGrad.addColorStop(0, pal.glow);
        auraGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, r + 9, 0, Math.PI * 2);
        ctx.fill();

        const sphereGrad = ctx.createRadialGradient(cx - 6, cy - 8, 2, cx, cy, r);
        sphereGrad.addColorStop(0, pal.core);
        sphereGrad.addColorStop(0.35, pal.mid);
        sphereGrad.addColorStop(0.76, pal.rim);
        sphereGrad.addColorStop(1, pal.deep);

        ctx.fillStyle = sphereGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#ffffff';
        ctx.shadowColor = pal.core;
        ctx.shadowBlur = 8;

        if (element === 'FIRE') {
            ctx.beginPath();
            ctx.moveTo(cx, cy - 11);
            ctx.quadraticCurveTo(cx + 10, cy - 2, cx + 6, cy + 8);
            ctx.quadraticCurveTo(cx, cy + 13, cx - 6, cy + 8);
            ctx.quadraticCurveTo(cx - 10, cy - 2, cx, cy - 11);
            ctx.fill();
        } else if (element === 'ICE') {
            ctx.lineWidth = 2.5;
            for (let i = 0; i < 3; i++) {
                const a = (Math.PI / 3) * i;
                ctx.beginPath();
                ctx.moveTo(cx - Math.cos(a) * 10, cy - Math.sin(a) * 10);
                ctx.lineTo(cx + Math.cos(a) * 10, cy + Math.sin(a) * 10);
                ctx.stroke();
            }
        } else if (element === 'LIGHTNING') {
            ctx.beginPath();
            ctx.moveTo(cx + 4, cy - 12);
            ctx.lineTo(cx - 7, cy + 1);
            ctx.lineTo(cx - 1, cy + 1);
            ctx.lineTo(cx - 4, cy + 12);
            ctx.lineTo(cx + 7, cy - 2);
            ctx.lineTo(cx + 1, cy - 2);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.moveTo(cx, cy - 11);
            ctx.quadraticCurveTo(cx + 9, cy + 2, cx + 5, cy + 9);
            ctx.arc(cx, cy + 6, 6, 0.3, Math.PI - 0.3);
            ctx.quadraticCurveTo(cx - 9, cy + 2, cx, cy - 11);
            ctx.fill();
        }
        ctx.restore();

        ctx.lineWidth = tier >= 2 ? 2.6 : 2;
        ctx.strokeStyle = tier >= 3 ? '#ffea00' : tier === 2 ? '#00f5ff' : '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();

        const glossGrad = ctx.createLinearGradient(cx - 14, cy - 20, cx, cy - 4);
        glossGrad.addColorStop(0, 'rgba(255,255,255,0.95)');
        glossGrad.addColorStop(1, 'rgba(255,255,255,0.0)');
        ctx.fillStyle = glossGrad;
        ctx.beginPath();
        ctx.ellipse(cx - 6, cy - 11, 10.5, 5.2, -0.48, 0, Math.PI * 2);
        ctx.fill();

        canvasTex.refresh();
    }

    private static createClosedChestTexture(scene: Phaser.Scene): void {
        const w = 220;
        const h = 175;
        const canvasTex = scene.textures.createCanvas('victory_chest_closed', w, h);
        if (!canvasTex) return;
        const ctx = canvasTex.getContext();
        const cx = w / 2;

        const glow = ctx.createRadialGradient(cx, 95, 10, cx, 95, 84);
        glow.addColorStop(0, 'rgba(255, 202, 40, 0.7)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, 95, 84, 0, Math.PI * 2);
        ctx.fill();

        const lidGrad = ctx.createLinearGradient(0, 42, 0, 88);
        lidGrad.addColorStop(0, '#4a2387');
        lidGrad.addColorStop(1, '#1d0b3b');
        ctx.fillStyle = lidGrad;
        ctx.beginPath();
        ctx.roundRect(cx - 76, 44, 152, 44, [22, 22, 4, 4]);
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#ffca28';
        ctx.stroke();

        const baseGrad = ctx.createLinearGradient(0, 86, 0, 156);
        baseGrad.addColorStop(0, '#2c1359');
        baseGrad.addColorStop(1, '#0e0521');
        ctx.fillStyle = baseGrad;
        ctx.beginPath();
        ctx.roundRect(cx - 78, 86, 156, 68, [4, 4, 16, 16]);
        ctx.fill();
        ctx.lineWidth = 4.5;
        ctx.strokeStyle = '#ffca28';
        ctx.stroke();

        ctx.fillStyle = '#ffca28';
        ctx.fillRect(cx - 46, 44, 14, 110);
        ctx.fillRect(cx + 32, 44, 14, 110);

        ctx.fillStyle = '#00f5ff';
        ctx.beginPath();
        ctx.roundRect(cx - 20, 70, 40, 44, 11);
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        canvasTex.refresh();
    }

    private static createTreasureChestTexture(scene: Phaser.Scene): void {
        const w = 220;
        const h = 175;
        const canvasTex = scene.textures.createCanvas('victory_chest_ultra', w, h);
        if (!canvasTex) return;
        const ctx = canvasTex.getContext();
        const cx = w / 2;

        const glow = ctx.createRadialGradient(cx, 78, 10, cx, 78, 92);
        glow.addColorStop(0, 'rgba(255, 255, 255, 1)');
        glow.addColorStop(0.4, 'rgba(0, 245, 255, 0.75)');
        glow.addColorStop(0.75, 'rgba(213, 0, 249, 0.45)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, 78, 92, 0, Math.PI * 2);
        ctx.fill();

        const lidGrad = ctx.createLinearGradient(0, 18, 0, 70);
        lidGrad.addColorStop(0, '#311b61');
        lidGrad.addColorStop(1, '#140a2e');
        ctx.fillStyle = lidGrad;
        ctx.beginPath();
        ctx.roundRect(cx - 74, 22, 148, 48, [22, 22, 4, 4]);
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#ffca28';
        ctx.stroke();

        const gems = [
            { x: cx - 44, y: 74, r: 16, c1: '#fff59d', c2: '#ff3d00' },
            { x: cx + 42, y: 75, r: 16, c1: '#e1f5fe', c2: '#00f5ff' },
            { x: cx - 18, y: 66, r: 18, c1: '#f3e5f5', c2: '#ff007f' },
            { x: cx + 16, y: 68, r: 17, c1: '#fff9c4', c2: '#00f5a0' },
            { x: cx, y: 58, r: 16, c1: '#ffffff', c2: '#ffea00' }
        ];

        for (const g of gems) {
            const gg = ctx.createRadialGradient(g.x - 4, g.y - 4, 2, g.x, g.y, g.r);
            gg.addColorStop(0, g.c1);
            gg.addColorStop(1, g.c2);
            ctx.fillStyle = gg;
            ctx.beginPath();
            ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();
        }

        const baseGrad = ctx.createLinearGradient(0, 80, 0, 156);
        baseGrad.addColorStop(0, '#24124d');
        baseGrad.addColorStop(1, '#0d061f');
        ctx.fillStyle = baseGrad;
        ctx.beginPath();
        ctx.roundRect(cx - 78, 80, 156, 74, [4, 4, 16, 16]);
        ctx.fill();
        ctx.lineWidth = 4.5;
        ctx.strokeStyle = '#ffca28';
        ctx.stroke();

        canvasTex.refresh();
    }

    private static createSunburstTexture(scene: Phaser.Scene): void {
        const size = 260;
        const canvasTex = scene.textures.createCanvas('victory_sunburst', size, size);
        if (!canvasTex) return;
        const ctx = canvasTex.getContext();
        const cx = size / 2;
        const cy = size / 2;

        const rays = 16;
        for (let i = 0; i < rays; i++) {
            const a1 = (i * 2 * Math.PI) / rays;
            const a2 = a1 + Math.PI / rays;
            const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, size / 2);
            grad.addColorStop(0, 'rgba(0, 245, 255, 0.55)');
            grad.addColorStop(0.6, 'rgba(213, 0, 249, 0.22)');
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, size / 2, a1, a2);
            ctx.closePath();
            ctx.fill();
        }
        canvasTex.refresh();
    }

    private static createCustomGameIcons(scene: Phaser.Scene): void {
        const coinTex = scene.textures.createCanvas('icon_coin', 24, 24);
        if (coinTex) {
            const ctx = coinTex.getContext();
            const grad = ctx.createRadialGradient(9, 8, 2, 12, 12, 10);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.55, '#ffd740');
            grad.addColorStop(1, '#ff6f00');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(12, 12, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            coinTex.refresh();
        }

        const bossTex = scene.textures.createCanvas('icon_boss_node', 24, 24);
        if (bossTex) {
            const ctx = bossTex.getContext();
            ctx.fillStyle = '#ff0055';
            ctx.beginPath();
            ctx.arc(12, 12, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#00f5ff';
            ctx.lineWidth = 2;
            ctx.stroke();
            bossTex.refresh();
        }
    }

    private static createParticleTexture(scene: Phaser.Scene): void {
        const canvasTex = scene.textures.createCanvas('glow_spark', 16, 16);
        if (!canvasTex) return;
        const ctx = canvasTex.getContext();
        const grad = ctx.createRadialGradient(8, 8, 1, 8, 8, 8);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.5, 'rgba(0, 245, 255, 0.85)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 16, 16);
        canvasTex.refresh();
    }
}
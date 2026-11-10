/**
 * ZERO-BOX EDGE-TO-EDGE PRO GAME ART ENGINE
 * Generates Full-Screen Seamless Worlds, 3D Crystalline Core Sentinels,
 * Floating Circular Icon Medallions, and High-Impact Elemental Spheres.
 */
import Phaser from 'phaser';
import { ElementType } from '../config/OrbsConfig';
import { SoundSynth } from '../core/SoundSynth';

export class ArtRenderer {
    public static generateAllGameTextures(scene: Phaser.Scene): void {
        if (scene.textures.exists('edge_to_edge_v3')) return;
        scene.textures.createCanvas('edge_to_edge_v3', 2, 2)?.refresh();

        // 1. Full-Screen Seamless Background Texture (390x844 Edge-to-Edge)
        this.createSeamlessWorldBackground(scene);

        // 2. 3D Elemental Plasma Spheres (Tiers 1 to 4)
        const elements: ElementType[] = ['FIRE', 'ICE', 'LIGHTNING', 'NATURE'];
        for (const el of elements) {
            for (let tier = 1; tier <= 4; tier++) {
                this.createUltraOrbTexture(scene, `orb_${el}_${tier}`, el, tier);
            }
        }

        // 3. 3D Multi-Crystal Core Sentinels (Targets we shatter in the arena!)
        this.createCrystalSentinelTexture(scene, 'monster_ICE', '#00f5ff', '#0066ff', '#001945', false);
        this.createCrystalSentinelTexture(scene, 'monster_VOID', '#ff4081', '#aa00ff', '#240042', false);
        this.createCrystalSentinelTexture(scene, 'monster_MAGMA', '#ffea00', '#ff3d00', '#4a0700', false);
        this.createCrystalSentinelTexture(scene, 'monster_BOMB', '#ffffff', '#ff1744', '#5c0011', false);
        this.createCrystalSentinelTexture(scene, 'monster_HEALER', '#b9f6ca', '#00e676', '#003b19', false);
        this.createCrystalSentinelTexture(scene, 'monster_BOSS', '#00f5ff', '#ff007f', '#1f003d', true);

        // 4. Floating Circular & Hexagonal Icon Medallions (Replaces Boxy Buttons!)
        this.createIconMedallionTexture(scene, 'medallion_CYAN', 64, '#00f5ff', '#0055ff');
        this.createIconMedallionTexture(scene, 'medallion_GOLD', 64, '#ffea00', '#ff6d00');
        this.createIconMedallionTexture(scene, 'medallion_GREEN', 64, '#00f5a0', '#008c4a');
        this.createIconMedallionTexture(scene, 'medallion_MAGENTA', 64, '#ff4081', '#8e00b8');
        this.createIconMedallionTexture(scene, 'medallion_PLAY', 96, '#00f5a0', '#0077ff');

        // 5. Sleek Pill Action Badges (For Upgrade / Launch / Ad actions without boxy borders)
        this.createSleekPillTexture(scene, 'btn_GREEN_lg', 176, 50, '#00f5a0', '#009e52');
        this.createSleekPillTexture(scene, 'btn_ORANGE_lg', 176, 50, '#ff9100', '#ff0055');
        this.createSleekPillTexture(scene, 'btn_GREEN_md', 158, 42, '#00f5a0', '#009e52');
        this.createSleekPillTexture(scene, 'btn_ORANGE_md', 158, 42, '#ff9100', '#ff0055');
        this.createSleekPillTexture(scene, 'btn_BLUE_sm', 124, 32, '#00f5ff', '#0055ff');
        this.createSleekPillTexture(scene, 'btn_GRAY_sm', 124, 32, '#607d8b', '#263238');
        this.createSleekPillTexture(scene, 'btn_PURPLE_nav', 86, 32, '#ff4081', '#7b1fa2');

        // 6. Floating Holo-Ring Slot, Cannon, Chest & Particles
        this.createHoloRingSlotTexture(scene, 'slot_normal', false);
        this.createHoloRingSlotTexture(scene, 'slot_top_queue', true);
        this.createFuturisticCannonTexture(scene);
        this.createTreasureChestTexture(scene);
        this.createSunburstTexture(scene);
        this.createCustomGameIcons(scene);
        this.createParticleTexture(scene);
    }

    private static createSeamlessWorldBackground(scene: Phaser.Scene): void {
        const w = 390;
        const h = 844;
        const canvasTex = scene.textures.createCanvas('world_bg_seamless', w, h);
        if (!canvasTex) return;
        const ctx = canvasTex.getContext();

        // Deep Abyssal Space-Cavern Vertical Gradient
        const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, '#05020d');
        bgGrad.addColorStop(0.35, '#0c0621');
        bgGrad.addColorStop(0.75, '#170b36');
        bgGrad.addColorStop(1, '#080314');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Ambient Center Arcane Nebula Glow
        const nebGrad = ctx.createRadialGradient(w / 2, h * 0.42, 10, w / 2, h * 0.42, 240);
        nebGrad.addColorStop(0, 'rgba(0, 245, 255, 0.12)');
        nebGrad.addColorStop(0.5, 'rgba(170, 0, 255, 0.07)');
        nebGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = nebGrad;
        ctx.fillRect(0, 0, w, h);

        // Subtle Perspective Energy Floor Grid (Fades smoothly into the void—no hard box!)
        ctx.strokeStyle = 'rgba(0, 245, 255, 0.06)';
        ctx.lineWidth = 1;
        for (let y = 120; y < h - 80; y += 52) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }
        for (let x = 30; x < w; x += 55) {
            ctx.beginPath();
            ctx.moveTo(x, 100);
            ctx.lineTo(x, h - 80);
            ctx.stroke();
        }

        // Left & Right Edge Energy Rails (Full-bleed screen edge laser bumpers)
        const railGrad = ctx.createLinearGradient(0, 100, 0, h - 100);
        railGrad.addColorStop(0, 'rgba(0,245,255,0)');
        railGrad.addColorStop(0.2, 'rgba(0,245,255,0.65)');
        railGrad.addColorStop(0.8, 'rgba(255,0,127,0.65)');
        railGrad.addColorStop(1, 'rgba(255,0,127,0)');
        ctx.fillStyle = railGrad;
        ctx.fillRect(0, 90, 4, h - 180);
        ctx.fillRect(w - 4, 90, 4, h - 180);

        canvasTex.refresh();
    }

    /**
     * Creates a 3D Crystalline Core Sentinel (Multi-spiked crystal cluster + glowing core)
     * Replaces the old flat pentagon blocks!
     */
    private static createCrystalSentinelTexture(
        scene: Phaser.Scene,
        key: string,
        coreHex: string,
        midHex: string,
        deepHex: string,
        isBoss: boolean
    ): void {
        const w = isBoss ? 176 : 64;
        const h = isBoss ? 110 : 64;
        const canvasTex = scene.textures.createCanvas(key, w, h);
        if (!canvasTex) return;
        const ctx = canvasTex.getContext();
        const cx = w / 2;
        const cy = h / 2 + 2;
        const r = isBoss ? 44 : 22;

        // 1. Outer Radiant Energy Halo
        const halo = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r * 1.35);
        halo.addColorStop(0, coreHex);
        halo.addColorStop(0.5, midHex);
        halo.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 1.35, 0, Math.PI * 2);
        ctx.fill();

        // 2. 8 Jagged 3D Crystal Shards radiating from the core
        const spikes = isBoss ? 10 : 8;
        for (let i = 0; i < spikes; i++) {
            const angle = (Math.PI * 2 * i) / spikes;
            const len = r * (i % 2 === 0 ? 1.18 : 0.96);
            const tipX = cx + Math.cos(angle) * len;
            const tipY = cy + Math.sin(angle) * len;
            const leftX = cx + Math.cos(angle - 0.32) * (r * 0.55);
            const leftY = cy + Math.sin(angle - 0.32) * (r * 0.55);
            const rightX = cx + Math.cos(angle + 0.32) * (r * 0.55);
            const rightY = cy + Math.sin(angle + 0.32) * (r * 0.55);

            const spikeGrad = ctx.createLinearGradient(cx, cy, tipX, tipY);
            spikeGrad.addColorStop(0, deepHex);
            spikeGrad.addColorStop(0.6, midHex);
            spikeGrad.addColorStop(1, coreHex);

            ctx.fillStyle = spikeGrad;
            ctx.beginPath();
            ctx.moveTo(leftX, leftY);
            ctx.lineTo(tipX, tipY);
            ctx.lineTo(rightX, rightY);
            ctx.closePath();
            ctx.fill();

            ctx.lineWidth = 1.2;
            ctx.strokeStyle = 'rgba(255,255,255,0.65)';
            ctx.stroke();
        }

        // 3. Central Faceted Octagonal Gem Shell
        const bodyGrad = ctx.createRadialGradient(cx - 5, cy - 5, 2, cx, cy, r * 0.78);
        bodyGrad.addColorStop(0, '#ffffff');
        bodyGrad.addColorStop(0.3, coreHex);
        bodyGrad.addColorStop(0.75, midHex);
        bodyGrad.addColorStop(1, deepHex);

        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const a = (Math.PI * 2 * i) / 8 + Math.PI / 8;
            const px = cx + Math.cos(a) * (r * 0.76);
            const py = cy + Math.sin(a) * (r * 0.76);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        // 4. Glowing Angry Sentinel Visor Eyes inside Core
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = coreHex;
        ctx.shadowBlur = 8;
        const eyeSpan = isBoss ? 16 : 6;
        const eyeW = isBoss ? 10 : 5;
        const eyeH = isBoss ? 5 : 3;

        ctx.beginPath();
        ctx.moveTo(cx - eyeSpan - eyeW, cy - 3);
        ctx.lineTo(cx - eyeSpan + 1, cy);
        ctx.lineTo(cx - eyeSpan - 2, cy + eyeH);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(cx + eyeSpan + eyeW, cy - 3);
        ctx.lineTo(cx + eyeSpan - 1, cy);
        ctx.lineTo(cx + eyeSpan + 2, cy + eyeH);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

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

        // Outer Neon Bloom
        const glow = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r + 5);
        glow.addColorStop(0, rimHex);
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
        ctx.fill();

        // Hexagonal / Circular Medallion Body
        const grad = ctx.createRadialGradient(cx - 6, cy - 8, 2, cx, cy, r);
        grad.addColorStop(0, rimHex);
        grad.addColorStop(0.55, coreHex);
        grad.addColorStop(1, '#090414');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        // Top Glass Specular Shine
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.beginPath();
        ctx.ellipse(cx, cy - r * 0.48, r * 0.55, r * 0.24, 0, 0, Math.PI * 2);
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

        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.stroke();

        // Subtle top sheen
        ctx.fillStyle = 'rgba(255,255,255,0.32)';
        ctx.beginPath();
        ctx.roundRect(10, 5, w - 20, (h - 10) * 0.38, r);
        ctx.fill();

        canvasTex.refresh();
    }

    /**
     * Soft Translucent Glass Overlay (NO hard box border or corner rivets!)
     */
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
        g.fillGradientStyle(topColor, topColor, bottomColor, bottomColor, 0.72);
        g.fillRoundedRect(x, y, w, h, 22);
        g.lineStyle(1.2, borderColor, 0.28);
        g.strokeRoundedRect(x, y, w, h, 22);
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
            strokeThickness: 4
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

        // Circular Holographic Energy Ring (NO square slot boxes!)
        const grad = ctx.createRadialGradient(cx, cy, 8, cx, cy, 28);
        grad.addColorStop(0, 'rgba(15, 8, 34, 0.85)');
        grad.addColorStop(0.75, isPrimary ? 'rgba(0, 245, 255, 0.25)' : 'rgba(170, 0, 255, 0.18)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, 28, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = isPrimary ? '#00f5ff' : 'rgba(255, 202, 40, 0.55)';
        ctx.lineWidth = isPrimary ? 2.2 : 1.5;
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
            FIRE: { core: '#fffde7', mid: '#ff6d00', rim: '#ff1744', deep: '#3b0000', glow: 'rgba(255, 110, 0, 0.95)' },
            ICE: { core: '#ffffff', mid: '#00f5ff', rim: '#0066ff', deep: '#001538', glow: 'rgba(0, 245, 255, 0.95)' },
            LIGHTNING: { core: '#ffffff', mid: '#ff4081', rim: '#aa00ff', deep: '#210038', glow: 'rgba(224, 64, 251, 0.95)' },
            NATURE: { core: '#f9fbe7', mid: '#00f5a0', rim: '#00a152', deep: '#002610', glow: 'rgba(0, 245, 160, 0.95)' }
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
        sphereGrad.addColorStop(0.38, pal.mid);
        sphereGrad.addColorStop(0.78, pal.rim);
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

        ctx.lineWidth = tier >= 2 ? 2.5 : 1.8;
        ctx.strokeStyle = tier >= 3 ? '#ffea00' : tier === 2 ? '#00f5ff' : 'rgba(255,255,255,0.85)';
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();

        const glossGrad = ctx.createLinearGradient(cx - 14, cy - 20, cx, cy - 4);
        glossGrad.addColorStop(0, 'rgba(255,255,255,0.9)');
        glossGrad.addColorStop(1, 'rgba(255,255,255,0.0)');
        ctx.fillStyle = glossGrad;
        ctx.beginPath();
        ctx.ellipse(cx - 6, cy - 11, 10, 5, -0.48, 0, Math.PI * 2);
        ctx.fill();

        canvasTex.refresh();
    }

    private static createFuturisticCannonTexture(scene: Phaser.Scene): void {
        const canvasTex = scene.textures.createCanvas('cannon_turret', 76, 76);
        if (!canvasTex) return;
        const ctx = canvasTex.getContext();
        const cx = 38;
        const cy = 38;

        // Outer Glowing Energy Halo
        const glow = ctx.createRadialGradient(cx, cy, 8, cx, cy, 34);
        glow.addColorStop(0, 'rgba(0, 245, 255, 0.6)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, 34, 0, Math.PI * 2);
        ctx.fill();

        // Forward Plasma Wings pointing Right (0 rad)
        const wingGrad = ctx.createLinearGradient(cx, cy - 16, cx + 34, cy + 16);
        wingGrad.addColorStop(0, '#ffca28');
        wingGrad.addColorStop(1, '#00f5ff');
        ctx.fillStyle = wingGrad;
        ctx.beginPath();
        ctx.moveTo(cx - 4, cy - 16);
        ctx.lineTo(cx + 34, cy - 5);
        ctx.lineTo(cx + 34, cy - 11);
        ctx.lineTo(cx + 6, cy - 22);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(cx - 4, cy + 16);
        ctx.lineTo(cx + 34, cy + 5);
        ctx.lineTo(cx + 34, cy + 11);
        ctx.lineTo(cx + 6, cy + 22);
        ctx.closePath();
        ctx.fill();

        // Central Core Orb
        const coreGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 16);
        coreGrad.addColorStop(0, '#ffffff');
        coreGrad.addColorStop(0.5, '#00f5ff');
        coreGrad.addColorStop(1, '#120826');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 2.5;
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
            grad.addColorStop(0, '#fff9c4');
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
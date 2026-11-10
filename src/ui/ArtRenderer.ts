/**
 * PRO-ULTRA AAA Fantasy & Arcane Game Art Generator
 * Renders Multi-Layered 3D Glass/Magma Orbs, Overflowing Treasure Chests,
 * Spinning God-Rays, Ornate Corner-Gem Panels, and Squishy 3D Tactile Buttons.
 */
import Phaser from 'phaser';
import { ElementType } from '../config/OrbsConfig';
import { SoundSynth } from '../core/SoundSynth';

export class ArtRenderer {
    public static generateAllGameTextures(scene: Phaser.Scene): void {
        if (scene.textures.exists('ultra_orb_FIRE_1')) return;

        // 1. Hyper-Glossy 3D Elemental Bubbles/Orbs (Tiers 1 to 4)
        const elements: ElementType[] = ['FIRE', 'ICE', 'LIGHTNING', 'NATURE'];
        for (const el of elements) {
            for (let tier = 1; tier <= 4; tier++) {
                this.createUltraOrbTexture(scene, `orb_${el}_${tier}`, el, tier);
            }
        }
        // Marker texture so we don't regenerate
        scene.textures.createCanvas('ultra_orb_FIRE_1', 2, 2)?.refresh();

        // 2. 3D Faceted Crystal Golems (Blue, Purple, Magma, Armored, Boss)
        this.createCrystalMonsterTexture(scene, 'monster_ICE', '#00f5ff', '#0288d1', '#012a4a', false);
        this.createCrystalMonsterTexture(scene, 'monster_VOID', '#ea80fc', '#8e24aa', '#2c003e', false);
        this.createCrystalMonsterTexture(scene, 'monster_MAGMA', '#ff8a65', '#e64a19', '#4e1200', false);
        this.createCrystalMonsterTexture(scene, 'monster_ARMOR', '#fff59d', '#fbc02d', '#5f4300', false);
        this.createCrystalMonsterTexture(scene, 'monster_BOSS', '#18ffff', '#7c4dff', '#1a0033', true);

        // 3. 3D Bevelled Anvil Forge Slots, Arcane Cannon & Overflowing Victory Chest!
        this.createBevelledSlotTexture(scene, 'slot_normal', false);
        this.createBevelledSlotTexture(scene, 'slot_top_queue', true);
        this.createFuturisticCannonTexture(scene);
        this.createTreasureChestTexture(scene);
        this.createSunburstTexture(scene);
        this.createCustomGameIcons(scene);
        this.createParticleTexture(scene);

        // 4. 3D Glossy Tactile Game Buttons with Gold/Metallic Borders
        this.createButtonTexture(scene, 'btn_GREEN_lg', 176, 52, '#69f0ae', '#00c853', '#1b5e20', '#ffd54f');
        this.createButtonTexture(scene, 'btn_ORANGE_lg', 176, 52, '#ffd740', '#ff6d00', '#bf360c', '#fff8e1');
        this.createButtonTexture(scene, 'btn_GREEN_md', 168, 42, '#69f0ae', '#00c853', '#1b5e20', '#ffd54f');
        this.createButtonTexture(scene, 'btn_ORANGE_md', 168, 42, '#ffd740', '#ff6d00', '#bf360c', '#fff8e1');
        this.createButtonTexture(scene, 'btn_BLUE_sm', 136, 34, '#40c4ff', '#0091ea', '#01579b', '#ffd54f');
        this.createButtonTexture(scene, 'btn_GRAY_sm', 136, 34, '#b0bec5', '#546e7a', '#263238', '#cfd8dc');
        this.createButtonTexture(scene, 'btn_PURPLE_nav', 94, 32, '#ea80fc', '#8e24aa', '#4a148c', '#ffd54f');
    }

    /**
     * Draws an ornate commercial-grade game panel with double gold borders and corner gems
     */
    public static drawOrnatePanel(
        scene: Phaser.Scene,
        x: number,
        y: number,
        w: number,
        h: number,
        topColor: number,
        bottomColor: number,
        borderColor: number = 0xfbc02d
    ): Phaser.GameObjects.Graphics {
        const g = scene.add.graphics();

        // Outer drop shadow
        g.fillStyle(0x000000, 0.55);
        g.fillRoundedRect(x + 3, y + 5, w, h, 14);

        // Main gradient fill
        g.fillGradientStyle(topColor, topColor, bottomColor, bottomColor, 1);
        g.fillRoundedRect(x, y, w, h, 14);

        // Inner dark bevel line
        g.lineStyle(2, 0x120a1f, 0.8);
        g.strokeRoundedRect(x + 4, y + 4, w - 8, h - 8, 10);

        // Outer thick metallic gold frame
        g.lineStyle(4, borderColor, 1);
        g.strokeRoundedRect(x, y, w, h, 14);

        // Top specular highlight line
        g.lineStyle(1.5, 0xfff9c4, 0.75);
        g.lineBetween(x + 16, y + 2, x + w - 16, y + 2);

        // 4 Ornate Corner Rivet Gems
        const corners = [
            [x + 10, y + 10],
            [x + w - 10, y + 10],
            [x + 10, y + h - 10],
            [x + w - 10, y + h - 10]
        ];
        for (const [cx, cy] of corners) {
            g.fillStyle(0xffea00, 1);
            g.fillCircle(cx, cy, 4);
            g.lineStyle(1.2, 0x5d4037, 1);
            g.strokeCircle(cx, cy, 4);
        }

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
        const txt = scene.add.text(0, -2, label, {
            fontFamily: "'Orbitron', 'Chakra Petch', sans-serif",
            fontSize,
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#1a0d00',
            strokeThickness: 4,
            shadow: { offsetX: 0, offsetY: 2, color: '#000000', blur: 2, fill: true }
        }).setOrigin(0.5);

        container.add([bg, txt]);
        bg.setInteractive({ useHandCursor: true });

        bg.on('pointerdown', () => {
            SoundSynth.playBounceChime(3);
            scene.tweens.add({
                targets: container,
                scaleX: 0.9,
                scaleY: 0.9,
                duration: 65,
                yoyo: true,
                onComplete: () => onClick()
            });
        });

        return container;
    }

    private static createButtonTexture(
        scene: Phaser.Scene,
        key: string,
        w: number,
        h: number,
        topHex: string,
        midHex: string,
        bottomBevelHex: string,
        rimHex: string
    ): void {
        const canvasTex = scene.textures.createCanvas(key, w, h);
        if (!canvasTex) return;
        const ctx = canvasTex.getContext();
        const r = 13;

        // 1. Dark Drop Shadow + 3D Bottom Lip
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.beginPath();
        ctx.roundRect(2, 6, w - 4, h - 6, r);
        ctx.fill();

        ctx.fillStyle = bottomBevelHex;
        ctx.beginPath();
        ctx.roundRect(2, 4, w - 4, h - 6, r);
        ctx.fill();

        // 2. Main Rich Juicy Gradient Body
        const bodyGrad = ctx.createLinearGradient(0, 2, 0, h - 7);
        bodyGrad.addColorStop(0, topHex);
        bodyGrad.addColorStop(0.5, midHex);
        bodyGrad.addColorStop(1, bottomBevelHex);
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.roundRect(2, 2, w - 4, h - 8, r);
        ctx.fill();

        // 3. Top Curved Glass Shine
        const shineGrad = ctx.createLinearGradient(0, 3, 0, h * 0.46);
        shineGrad.addColorStop(0, 'rgba(255,255,255,0.78)');
        shineGrad.addColorStop(1, 'rgba(255,255,255,0.05)');
        ctx.fillStyle = shineGrad;
        ctx.beginPath();
        ctx.roundRect(7, 4, w - 14, (h - 10) * 0.44, r - 4);
        ctx.fill();

        // 4. Golden/Metallic Outer Rim
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = rimHex;
        ctx.beginPath();
        ctx.roundRect(2, 2, w - 4, h - 8, r);
        ctx.stroke();

        canvasTex.refresh();
    }

    /**
     * Renders the Pro-Ultra 3D Elemental Bubble/Orb matching the Reference Pic & Launcher Icon
     */
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
        const r = 24;

        const palettes: Record<ElementType, { core: string; mid: string; rim: string; deep: string; glow: string }> = {
            FIRE: { core: '#fffde7', mid: '#ff6d00', rim: '#d50000', deep: '#4a0000', glow: 'rgba(255, 145, 0, 0.9)' },
            ICE: { core: '#ffffff', mid: '#00e5ff', rim: '#0077c2', deep: '#00224b', glow: 'rgba(0, 229, 255, 0.9)' },
            LIGHTNING: { core: '#ffffff', mid: '#e040fb', rim: '#7b1fa2', deep: '#240046', glow: 'rgba(224, 64, 251, 0.9)' },
            NATURE: { core: '#f9fbe7', mid: '#00e676', rim: '#00a152', deep: '#003314', glow: 'rgba(105, 240, 174, 0.9)' }
        };
        const pal = palettes[element];

        // 1. Outer Elemental Halo & Energy Spikes for Tier 2+
        const auraGrad = ctx.createRadialGradient(cx, cy, r - 5, cx, cy, r + 9);
        auraGrad.addColorStop(0, pal.glow);
        auraGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, r + 9, 0, Math.PI * 2);
        ctx.fill();

        // 2. Deep 3D Glass Sphere Base
        const sphereGrad = ctx.createRadialGradient(cx - 6, cy - 8, 2, cx, cy, r);
        sphereGrad.addColorStop(0, pal.core);
        sphereGrad.addColorStop(0.38, pal.mid);
        sphereGrad.addColorStop(0.78, pal.rim);
        sphereGrad.addColorStop(1, pal.deep);

        ctx.fillStyle = sphereGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        // 3. Swirling Magma Cells / Frost Shards / Electric Arcs inside the Bubble!
        ctx.save();
        ctx.strokeStyle = pal.core;
        ctx.lineWidth = tier >= 2 ? 2.0 : 1.2;
        ctx.globalAlpha = 0.55 + tier * 0.1;
        for (let i = 0; i < 3 + tier; i++) {
            const a = (Math.PI * 2 * i) / (3 + tier);
            ctx.beginPath();
            ctx.arc(cx + Math.cos(a) * 6, cy + Math.sin(a) * 6, r * 0.48, a, a + 1.8);
            ctx.stroke();
        }
        ctx.restore();

        // 4. Crisp Center Elemental Emblem with Bright Bloom
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#ffffff';
        ctx.shadowColor = pal.core;
        ctx.shadowBlur = 8;

        if (element === 'FIRE') {
            ctx.beginPath();
            ctx.moveTo(cx, cy - 12);
            ctx.quadraticCurveTo(cx + 11, cy - 2, cx + 6, cy + 9);
            ctx.quadraticCurveTo(cx, cy + 14, cx - 6, cy + 9);
            ctx.quadraticCurveTo(cx - 11, cy - 2, cx, cy - 12);
            ctx.fill();
        } else if (element === 'ICE') {
            ctx.lineWidth = 2.6;
            for (let i = 0; i < 3; i++) {
                const a = (Math.PI / 3) * i;
                ctx.beginPath();
                ctx.moveTo(cx - Math.cos(a) * 11, cy - Math.sin(a) * 11);
                ctx.lineTo(cx + Math.cos(a) * 11, cy + Math.sin(a) * 11);
                ctx.stroke();
            }
        } else if (element === 'LIGHTNING') {
            ctx.beginPath();
            ctx.moveTo(cx + 4, cy - 13);
            ctx.lineTo(cx - 7, cy + 1);
            ctx.lineTo(cx - 1, cy + 1);
            ctx.lineTo(cx - 4, cy + 13);
            ctx.lineTo(cx + 7, cy - 2);
            ctx.lineTo(cx + 1, cy - 2);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.moveTo(cx, cy - 12);
            ctx.quadraticCurveTo(cx + 10, cy + 2, cx + 5, cy + 9);
            ctx.arc(cx, cy + 6, 6, 0.3, Math.PI - 0.3);
            ctx.quadraticCurveTo(cx - 10, cy + 2, cx, cy - 12);
            ctx.fill();
        }
        ctx.restore();

        // 5. Outer Metallic Gold/White Ring for Tier Distinction
        ctx.lineWidth = tier >= 2 ? 3 : 2;
        ctx.strokeStyle = tier >= 3 ? '#ffd740' : tier === 2 ? '#fff59d' : 'rgba(255,255,255,0.85)';
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();

        // 6. Dual Curved Bubble Glass Specular Highlights (Top-Left & Bottom-Right Rim)
        const glossGrad = ctx.createLinearGradient(cx - 14, cy - 20, cx, cy - 4);
        glossGrad.addColorStop(0, 'rgba(255,255,255,0.92)');
        glossGrad.addColorStop(1, 'rgba(255,255,255,0.0)');
        ctx.fillStyle = glossGrad;
        ctx.beginPath();
        ctx.ellipse(cx - 6, cy - 11, 11, 5.5, -0.48, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.beginPath();
        ctx.arc(cx - 13, cy - 4, 2.2, 0, Math.PI * 2);
        ctx.fill();

        canvasTex.refresh();
    }

    /**
     * Renders the Screen 4 Overflowing Open Treasure Chest filled with Glowing Gems & Runes!
     */
    private static createTreasureChestTexture(scene: Phaser.Scene): void {
        const w = 220;
        const h = 175;
        const canvasTex = scene.textures.createCanvas('victory_chest_ultra', w, h);
        if (!canvasTex) return;
        const ctx = canvasTex.getContext();
        const cx = w / 2;

        // 1. Magical Golden/Cyan Aura Burst behind Open Lid
        const glow = ctx.createRadialGradient(cx, 78, 10, cx, 78, 88);
        glow.addColorStop(0, 'rgba(255, 245, 157, 1)');
        glow.addColorStop(0.45, 'rgba(0, 229, 255, 0.65)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, 78, 88, 0, Math.PI * 2);
        ctx.fill();

        // 2. Open Upper Chest Lid (Curved Royal Wood & Gold Trim)
        const lidGrad = ctx.createLinearGradient(0, 18, 0, 70);
        lidGrad.addColorStop(0, '#8d4e2a');
        lidGrad.addColorStop(1, '#3e1f0d');
        ctx.fillStyle = lidGrad;
        ctx.beginPath();
        ctx.roundRect(cx - 74, 22, 148, 48, [22, 22, 4, 4]);
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#ffd54f';
        ctx.stroke();

        // Gold Straps on Lid
        ctx.fillStyle = '#ffca28';
        ctx.fillRect(cx - 42, 22, 12, 48);
        ctx.fillRect(cx + 30, 22, 12, 48);

        // 3. Overflowing Treasure Pile Inside (Gold Coins + Glowing Elemental Orbs + Gems!)
        const gems = [
            { x: cx - 44, y: 74, r: 16, c1: '#fff59d', c2: '#ff5722' }, // Fire Orb
            { x: cx + 42, y: 75, r: 16, c1: '#e1f5fe', c2: '#00e5ff' }, // Ice Orb
            { x: cx - 18, y: 66, r: 18, c1: '#f3e5f5', c2: '#d500f9' }, // Lightning Orb
            { x: cx + 16, y: 68, r: 17, c1: '#fff9c4', c2: '#00e676' }, // Nature Orb
            { x: cx, y: 58, r: 15, c1: '#ffffff', c2: '#ffea00' }       // Crown Gold Gem
        ];

        // Gold coin mound base
        ctx.fillStyle = '#ffd740';
        ctx.beginPath();
        ctx.ellipse(cx, 82, 68, 22, 0, Math.PI, Math.PI * 2);
        ctx.fill();

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

        // 4. Lower Heavy Chest Base (3D Wood Planks + Thick Gold Frame + Center Lock)
        const baseGrad = ctx.createLinearGradient(0, 80, 0, 156);
        baseGrad.addColorStop(0, '#6d3b1e');
        baseGrad.addColorStop(1, '#2b1408');
        ctx.fillStyle = baseGrad;
        ctx.beginPath();
        ctx.roundRect(cx - 78, 80, 156, 74, [4, 4, 16, 16]);
        ctx.fill();
        ctx.lineWidth = 4.5;
        ctx.strokeStyle = '#ffd54f';
        ctx.stroke();

        // Vertical Gold Reinforcements on Base
        ctx.fillStyle = '#ffca28';
        ctx.fillRect(cx - 46, 80, 14, 74);
        ctx.fillRect(cx + 32, 80, 14, 74);

        // Ornate Center Golden Keyhole Shield
        ctx.fillStyle = '#ffd740';
        ctx.beginPath();
        ctx.roundRect(cx - 18, 72, 36, 40, 10);
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        ctx.fillStyle = '#1a0d00';
        ctx.beginPath();
        ctx.arc(cx, 88, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(cx - 3, 88, 6, 12);

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
            grad.addColorStop(0, 'rgba(255, 215, 64, 0.55)');
            grad.addColorStop(0.6, 'rgba(255, 145, 0, 0.22)');
            grad.addColorStop(1, 'rgba(255, 145, 0, 0)');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, size / 2, a1, a2);
            ctx.closePath();
            ctx.fill();
        }
        canvasTex.refresh();
    }

    private static createFuturisticCannonTexture(scene: Phaser.Scene): void {
        const canvasTex = scene.textures.createCanvas('cannon_turret', 68, 68);
        if (!canvasTex) return;
        const ctx = canvasTex.getContext();
        const cx = 34;
        const cy = 34;

        ctx.fillStyle = '#2b1b12';
        ctx.strokeStyle = '#ffd54f';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(cx, cy, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        const railGrad = ctx.createLinearGradient(cx, cy - 12, cx + 30, cy + 12);
        railGrad.addColorStop(0, '#ffd54f');
        railGrad.addColorStop(1, '#ff6d00');
        ctx.fillStyle = railGrad;
        ctx.beginPath();
        ctx.roundRect(cx + 2, cy - 11, 28, 7, 3);
        ctx.roundRect(cx + 2, cy + 4, 28, 7, 3);
        ctx.fill();

        const coreGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 14);
        coreGrad.addColorStop(0, '#ffffff');
        coreGrad.addColorStop(0.5, '#00e5ff');
        coreGrad.addColorStop(1, '#004ecb');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, 13, 0, Math.PI * 2);
        ctx.fill();

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
            ctx.fillStyle = '#fffde7';
            ctx.fillRect(10, 7, 4, 10);
            coinTex.refresh();
        }

        const bossTex = scene.textures.createCanvas('icon_boss_node', 24, 24);
        if (bossTex) {
            const ctx = bossTex.getContext();
            ctx.fillStyle = '#ff1744';
            ctx.beginPath();
            ctx.arc(12, 12, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffd54f';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(9, 11, 2.2, 0, Math.PI * 2);
            ctx.arc(15, 11, 2.2, 0, Math.PI * 2);
            ctx.fill();
            bossTex.refresh();
        }
    }

    private static createCrystalMonsterTexture(
        scene: Phaser.Scene,
        key: string,
        lightHex: string,
        midHex: string,
        darkHex: string,
        isBoss: boolean
    ): void {
        const w = isBoss ? 176 : 58;
        const h = isBoss ? 78 : 38;
        const canvasTex = scene.textures.createCanvas(key, w, h);
        if (!canvasTex) return;
        const ctx = canvasTex.getContext();
        const cx = w / 2;
        const cy = h / 2;

        const drawCrystalPolygon = (pts: [number, number][], fill: string | CanvasGradient, stroke: string) => {
            ctx.beginPath();
            ctx.moveTo(pts[0][0], pts[0][1]);
            for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
            ctx.closePath();
            ctx.fillStyle = fill;
            ctx.fill();
            ctx.lineWidth = 1.6;
            ctx.strokeStyle = stroke;
            ctx.stroke();
        };

        const rx = isBoss ? 68 : 23;
        const ry = isBoss ? 31 : 16;

        drawCrystalPolygon(
            [
                [cx - rx - 4, cy],
                [cx - rx + 5, cy - ry + 1],
                [cx - rx + 12, cy + 3],
                [cx - rx + 2, cy + ry - 1]
            ],
            midHex,
            lightHex
        );
        drawCrystalPolygon(
            [
                [cx + rx + 4, cy],
                [cx + rx - 5, cy - ry + 1],
                [cx + rx - 12, cy + 3],
                [cx + rx - 2, cy + ry - 1]
            ],
            midHex,
            lightHex
        );

        const bodyGrad = ctx.createLinearGradient(cx, cy - ry, cx, cy + ry);
        bodyGrad.addColorStop(0, lightHex);
        bodyGrad.addColorStop(0.55, midHex);
        bodyGrad.addColorStop(1, darkHex);

        drawCrystalPolygon(
            [
                [cx, cy - ry],
                [cx + rx - 3, cy - ry * 0.42],
                [cx + rx - 6, cy + ry * 0.65],
                [cx, cy + ry],
                [cx - rx + 6, cy + ry * 0.65],
                [cx - rx + 3, cy - ry * 0.42]
            ],
            bodyGrad,
            '#ffffff'
        );

        ctx.strokeStyle = 'rgba(255,255,255,0.45)';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(cx, cy - ry);
        ctx.lineTo(cx - rx * 0.45, cy);
        ctx.lineTo(cx, cy + ry);
        ctx.lineTo(cx + rx * 0.45, cy);
        ctx.closePath();
        ctx.stroke();

        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = lightHex;
        ctx.shadowBlur = 8;

        const eyeOffsetX = isBoss ? 20 : 8;
        const eyeW = isBoss ? 12 : 5;
        const eyeH = isBoss ? 6 : 3.5;

        ctx.beginPath();
        ctx.moveTo(cx - eyeOffsetX - eyeW, cy - 3);
        ctx.lineTo(cx - eyeOffsetX + 2, cy);
        ctx.lineTo(cx - eyeOffsetX - 2, cy + eyeH - 1);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(cx + eyeOffsetX + eyeW, cy - 3);
        ctx.lineTo(cx + eyeOffsetX - 2, cy);
        ctx.lineTo(cx + eyeOffsetX + 2, cy + eyeH - 1);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        canvasTex.refresh();
    }

    private static createBevelledSlotTexture(scene: Phaser.Scene, key: string, isTopRow: boolean): void {
        const w = 68;
        const h = 60;
        const canvasTex = scene.textures.createCanvas(key, w, h);
        if (!canvasTex) return;
        const ctx = canvasTex.getContext();

        // Rich 3D Golden Stone Anvil Slot matching Reference Pic!
        const outerGrad = ctx.createLinearGradient(0, 0, 0, h);
        outerGrad.addColorStop(0, isTopRow ? '#ffe57f' : '#d49a45');
        outerGrad.addColorStop(1, isTopRow ? '#ff6f00' : '#5d340d');

        ctx.fillStyle = outerGrad;
        ctx.beginPath();
        ctx.roundRect(2, 2, w - 4, h - 4, 12);
        ctx.fill();

        const innerGrad = ctx.createLinearGradient(0, 6, 0, h - 6);
        innerGrad.addColorStop(0, '#1a1215');
        innerGrad.addColorStop(1, '#32242b');

        ctx.fillStyle = innerGrad;
        ctx.beginPath();
        ctx.roundRect(5, 5, w - 10, h - 10, 9);
        ctx.fill();

        // Subtle Golden Anvil Silhouette inside empty slot
        ctx.fillStyle = 'rgba(255, 213, 79, 0.14)';
        ctx.fillRect(w / 2 - 11, h / 2 - 4, 22, 5);
        ctx.fillRect(w / 2 - 6, h / 2 + 1, 12, 6);

        canvasTex.refresh();
    }

    private static createParticleTexture(scene: Phaser.Scene): void {
        const canvasTex = scene.textures.createCanvas('glow_spark', 16, 16);
        if (!canvasTex) return;
        const ctx = canvasTex.getContext();
        const grad = ctx.createRadialGradient(8, 8, 1, 8, 8, 8);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.5, 'rgba(255, 215, 64, 0.85)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 16, 16);
        canvasTex.refresh();
    }
}
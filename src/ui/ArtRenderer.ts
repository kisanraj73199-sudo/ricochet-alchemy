/**
 * Futuristic Crystal-Clean HD Game UI, 3D Tactile Buttons & Custom Icon Generator
 */
import Phaser from 'phaser';
import { ElementType } from '../config/OrbsConfig';
import { SoundSynth } from '../core/SoundSynth';

export type ButtonTheme = 'GREEN' | 'ORANGE' | 'BLUE' | 'PURPLE' | 'GRAY';

export class ArtRenderer {
    public static generateAllGameTextures(scene: Phaser.Scene): void {
        if (scene.textures.exists('orb_FIRE_1')) return;

        // 1. 3D Glossy Elemental Orbs (Tiers 1 to 4)
        const elements: ElementType[] = ['FIRE', 'ICE', 'LIGHTNING', 'NATURE'];
        for (const el of elements) {
            for (let tier = 1; tier <= 4; tier++) {
                this.createGlossyOrbTexture(scene, `orb_${el}_${tier}`, el, tier);
            }
        }

        // 2. Crisp Non-Overlapping Crystal Golems (Blue, Purple, Magma, Armored, Boss)
        this.createCrystalMonsterTexture(scene, 'monster_ICE', '#00f5ff', '#0288d1', '#012a4a', false);
        this.createCrystalMonsterTexture(scene, 'monster_VOID', '#ea80fc', '#8e24aa', '#2c003e', false);
        this.createCrystalMonsterTexture(scene, 'monster_MAGMA', '#ff8a65', '#e64a19', '#4e1200', false);
        this.createCrystalMonsterTexture(scene, 'monster_ARMOR', '#fff59d', '#fbc02d', '#5f4300', false);
        this.createCrystalMonsterTexture(scene, 'monster_BOSS', '#18ffff', '#7c4dff', '#1a0033', true);

        // 3. Futuristic Bevelled Forge Slots & Custom Cannon Turret
        this.createBevelledSlotTexture(scene, 'slot_normal', false);
        this.createBevelledSlotTexture(scene, 'slot_top_queue', true);
        this.createFuturisticCannonTexture(scene);
        this.createCustomGameIcons(scene);
        this.createParticleTexture(scene);

        // 4. 3D Glossy Tactile Button Textures
        this.createButtonTexture(scene, 'btn_GREEN_lg', 174, 48, '#00e676', '#00a152', '#004d25');
        this.createButtonTexture(scene, 'btn_ORANGE_lg', 174, 48, '#ffab40', '#ff6d00', '#7a2f00');
        this.createButtonTexture(scene, 'btn_GREEN_md', 166, 38, '#00e676', '#00a152', '#004d25');
        this.createButtonTexture(scene, 'btn_ORANGE_md', 166, 38, '#ffab40', '#ff6d00', '#7a2f00');
        this.createButtonTexture(scene, 'btn_BLUE_sm', 132, 30, '#00e5ff', '#0091ea', '#003c6c');
        this.createButtonTexture(scene, 'btn_GRAY_sm', 132, 30, '#90a4ae', '#546e7a', '#263238');
        this.createButtonTexture(scene, 'btn_PURPLE_nav', 92, 30, '#e040fb', '#7b1fa2', '#38006b');
    }

    /**
     * Creates an interactive, tactile 3D game button with press-down bounce physics
     */
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
            stroke: '#090612',
            strokeThickness: 4
        }).setOrigin(0.5);

        container.add([bg, txt]);
        bg.setInteractive({ useHandCursor: true });

        bg.on('pointerdown', () => {
            SoundSynth.playBounceChime(3);
            scene.tweens.add({
                targets: container,
                scaleX: 0.92,
                scaleY: 0.92,
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
        bottomBevelHex: string
    ): void {
        const canvasTex = scene.textures.createCanvas(key, w, h);
        if (!canvasTex) return;
        const ctx = canvasTex.getContext();
        const r = 12;

        // 1. 3D Bottom Shadow Bevel
        ctx.fillStyle = bottomBevelHex;
        ctx.beginPath();
        ctx.roundRect(2, 5, w - 4, h - 6, r);
        ctx.fill();

        // 2. Main Glossy Button Body
        const bodyGrad = ctx.createLinearGradient(0, 2, 0, h - 6);
        bodyGrad.addColorStop(0, topHex);
        bodyGrad.addColorStop(1, midHex);
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.roundRect(2, 2, w - 4, h - 7, r);
        ctx.fill();

        // 3. Top Glass Specular Shine Bar
        const shineGrad = ctx.createLinearGradient(0, 3, 0, h * 0.45);
        shineGrad.addColorStop(0, 'rgba(255,255,255,0.65)');
        shineGrad.addColorStop(1, 'rgba(255,255,255,0.05)');
        ctx.fillStyle = shineGrad;
        ctx.beginPath();
        ctx.roundRect(6, 4, w - 12, (h - 8) * 0.42, r - 4);
        ctx.fill();

        // 4. Crisp Metallic Rim Border
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(2, 2, w - 4, h - 7, r);
        ctx.stroke();

        canvasTex.refresh();
    }

    private static createFuturisticCannonTexture(scene: Phaser.Scene): void {
        const canvasTex = scene.textures.createCanvas('cannon_turret', 68, 68);
        if (!canvasTex) return;
        const ctx = canvasTex.getContext();
        const cx = 34;
        const cy = 34;

        // Outer Golden Hexagonal Tech Ring
        ctx.fillStyle = '#1b142e';
        ctx.strokeStyle = '#ffd54f';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Twin Futuristic Railgun Prongs pointing Right (0 rad)
        const railGrad = ctx.createLinearGradient(cx, cy - 12, cx + 30, cy + 12);
        railGrad.addColorStop(0, '#ffd54f');
        railGrad.addColorStop(1, '#00e5ff');
        ctx.fillStyle = railGrad;
        ctx.beginPath();
        ctx.roundRect(cx + 2, cy - 11, 28, 7, 3);
        ctx.roundRect(cx + 2, cy + 4, 28, 7, 3);
        ctx.fill();

        // Glowing Plasma Core Chamber
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
        // 1. 3D Crystal Coin Icon ('icon_coin')
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
            // Inner diamond star
            ctx.fillStyle = '#fffde7';
            ctx.fillRect(10, 7, 4, 10);
            coinTex.refresh();
        }

        // 2. Boss Skull / Threat Badge ('icon_skull')
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

    private static createGlossyOrbTexture(
        scene: Phaser.Scene,
        key: string,
        element: ElementType,
        tier: number
    ): void {
        const size = 64;
        const canvasTex = scene.textures.createCanvas(key, size, size);
        if (!canvasTex) return;
        const ctx = canvasTex.getContext();
        const cx = size / 2;
        const cy = size / 2;
        const r = 23;

        const palettes: Record<ElementType, { core: string; mid: string; rim: string; glow: string }> = {
            FIRE: { core: '#fff59d', mid: '#ff5722', rim: '#b71c1c', glow: 'rgba(255, 110, 0, 0.8)' },
            ICE: { core: '#e1f5fe', mid: '#00e5ff', rim: '#01579b', glow: 'rgba(0, 229, 255, 0.8)' },
            LIGHTNING: { core: '#f3e5f5', mid: '#d500f9', rim: '#4a148c', glow: 'rgba(213, 0, 249, 0.8)' },
            NATURE: { core: '#fff9c4', mid: '#00e676', rim: '#1b5e20', glow: 'rgba(0, 230, 118, 0.8)' }
        };
        const pal = palettes[element];

        if (tier >= 2) {
            const auraGrad = ctx.createRadialGradient(cx, cy, r - 4, cx, cy, r + 8);
            auraGrad.addColorStop(0, pal.glow);
            auraGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = auraGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, r + 8, 0, Math.PI * 2);
            ctx.fill();
        }

        const sphereGrad = ctx.createRadialGradient(cx - 7, cy - 7, 3, cx, cy, r);
        sphereGrad.addColorStop(0, pal.core);
        sphereGrad.addColorStop(0.55, pal.mid);
        sphereGrad.addColorStop(1, pal.rim);

        ctx.fillStyle = sphereGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.lineWidth = tier >= 3 ? 3 : 2;
        ctx.strokeStyle = tier >= 2 ? '#ffd54f' : '#ffffff';
        ctx.stroke();

        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#ffffff';
        ctx.shadowColor = pal.core;
        ctx.shadowBlur = 6;

        if (element === 'FIRE') {
            ctx.beginPath();
            ctx.moveTo(cx, cy - 11);
            ctx.quadraticCurveTo(cx + 10, cy - 2, cx + 6, cy + 8);
            ctx.quadraticCurveTo(cx, cy + 13, cx - 6, cy + 8);
            ctx.quadraticCurveTo(cx - 10, cy - 2, cx, cy - 11);
            ctx.fill();
        } else if (element === 'ICE') {
            ctx.lineWidth = 2.4;
            for (let i = 0; i < 3; i++) {
                const a = (Math.PI / 3) * i;
                ctx.beginPath();
                ctx.moveTo(cx - Math.cos(a) * 10, cy - Math.sin(a) * 10);
                ctx.lineTo(cx + Math.cos(a) * 10, cy + Math.sin(a) * 10);
                ctx.stroke();
            }
        } else if (element === 'LIGHTNING') {
            ctx.beginPath();
            ctx.moveTo(cx + 3, cy - 12);
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

        // Top-left glossy highlight
        const glossGrad = ctx.createLinearGradient(cx - 12, cy - 18, cx, cy - 2);
        glossGrad.addColorStop(0, 'rgba(255,255,255,0.8)');
        glossGrad.addColorStop(1, 'rgba(255,255,255,0.0)');
        ctx.fillStyle = glossGrad;
        ctx.beginPath();
        ctx.ellipse(cx - 5, cy - 10, 10, 5, -0.45, 0, Math.PI * 2);
        ctx.fill();

        canvasTex.refresh();
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

        // Side Crystal Spikes
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

        // Inner Crystal Facet Lines
        ctx.strokeStyle = 'rgba(255,255,255,0.45)';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(cx, cy - ry);
        ctx.lineTo(cx - rx * 0.45, cy);
        ctx.lineTo(cx, cy + ry);
        ctx.lineTo(cx + rx * 0.45, cy);
        ctx.closePath();
        ctx.stroke();

        // Fierce Glowing Eyes
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

        const outerGrad = ctx.createLinearGradient(0, 0, 0, h);
        outerGrad.addColorStop(0, isTopRow ? '#00e5ff' : '#ffd54f');
        outerGrad.addColorStop(1, isTopRow ? '#006064' : '#8d5300');

        ctx.fillStyle = outerGrad;
        ctx.beginPath();
        ctx.roundRect(2, 2, w - 4, h - 4, 11);
        ctx.fill();

        const innerGrad = ctx.createLinearGradient(0, 6, 0, h - 6);
        innerGrad.addColorStop(0, '#0f0b1a');
        innerGrad.addColorStop(1, '#231b3a');

        ctx.fillStyle = innerGrad;
        ctx.beginPath();
        ctx.roundRect(5, 5, w - 10, h - 10, 8);
        ctx.fill();

        // Subtle Futuristic Crosshair in Empty Slot
        ctx.strokeStyle = isTopRow ? 'rgba(0, 229, 255, 0.18)' : 'rgba(255, 213, 79, 0.14)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, 12, 0, Math.PI * 2);
        ctx.stroke();

        canvasTex.refresh();
    }

    private static createParticleTexture(scene: Phaser.Scene): void {
        const canvasTex = scene.textures.createCanvas('glow_spark', 16, 16);
        if (!canvasTex) return;
        const ctx = canvasTex.getContext();
        const grad = ctx.createRadialGradient(8, 8, 1, 8, 8, 8);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.5, 'rgba(0, 229, 255, 0.85)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 16, 16);
        canvasTex.refresh();
    }
}
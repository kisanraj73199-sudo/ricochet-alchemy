/**
 * Phase 2: Top Arena Ricochet Physics, Trajectory Raycasting & AABB Block Collisions
 * Strictly modular & pure math so it runs at 60/120 FPS on any Android phone.
 */

export interface ArenaBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface BlockRect {
  id: string;
  x: number;      // Center X
  y: number;      // Center Y
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  color: number;
}

export interface ActiveOrb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  color: number;
  active: boolean;
}

export class ArenaPhysics {
  public static calculateReflection(vx: number, vy: number, hitNormalX: number, hitNormalY: number) {
    const dot = vx * hitNormalX + vy * hitNormalY;
    return {
      vx: vx - 2 * dot * hitNormalX,
      vy: vy - 2 * dot * hitNormalY
    };
  }

  /**
   * Computes dotted aiming points from cannon origin with 1 wall bounce preview
   */
  public static computeTrajectoryPoints(
    startX: number,
    startY: number,
    aimAngleRad: number,
    bounds: ArenaBounds,
    stepDistance = 16,
    maxSteps = 28
  ): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];
    let cx = startX;
    let cy = startY;
    let dx = Math.cos(aimAngleRad);
    let dy = Math.sin(aimAngleRad);

    // Clamp angle so player always aims upward into the arena
    if (dy > -0.18) {
      dy = -0.18;
      const sign = dx >= 0 ? 1 : -1;
      dx = sign * Math.sqrt(1 - dy * dy);
    }

    for (let i = 0; i < maxSteps; i++) {
      cx += dx * stepDistance;
      cy += dy * stepDistance;

      if (cx <= bounds.left + 8) {
        cx = bounds.left + 8;
        dx = -dx;
      } else if (cx >= bounds.right - 8) {
        cx = bounds.right - 8;
        dx = -dx;
      }

      if (cy <= bounds.top + 8) {
        cy = bounds.top + 8;
        points.push({ x: cx, y: cy });
        break;
      }

      points.push({ x: cx, y: cy });
    }

    return points;
  }

  /**
   * Advances a single orb by dt (seconds) and checks wall + crystal block collisions
   */
  public static stepOrb(
    orb: ActiveOrb,
    dt: number,
    bounds: ArenaBounds,
    blocks: BlockRect[]
  ): { hitWall: boolean; hitBlockId: string | null; hitX: number; hitY: number } {
    let hitWall = false;
    let hitBlockId: string | null = null;

    orb.x += orb.vx * dt;
    orb.y += orb.vy * dt;

    // 1. Left & Right Wall Ricochet
    if (orb.x - orb.radius <= bounds.left) {
      orb.x = bounds.left + orb.radius;
      orb.vx = Math.abs(orb.vx);
      hitWall = true;
    } else if (orb.x + orb.radius >= bounds.right) {
      orb.x = bounds.right - orb.radius;
      orb.vx = -Math.abs(orb.vx);
      hitWall = true;
    }

    // 2. Top Ceiling Ricochet
    if (orb.y - orb.radius <= bounds.top) {
      orb.y = bounds.top + orb.radius;
      orb.vy = Math.abs(orb.vy);
      hitWall = true;
    }

    // 3. Bottom Floor Recall (Orb finishes flight when returning to bottom)
    if (orb.y + orb.radius >= bounds.bottom) {
      orb.active = false;
      return { hitWall: false, hitBlockId: null, hitX: orb.x, hitY: orb.y };
    }

    // 4. Crystal Monster Block Collisions (Circle vs AABB)
    for (const block of blocks) {
      if (block.hp <= 0) continue;

      const halfW = block.width / 2;
      const halfH = block.height / 2;
      const closestX = Math.max(block.x - halfW, Math.min(orb.x, block.x + halfW));
      const closestY = Math.max(block.y - halfH, Math.min(orb.y, block.y + halfH));

      const distX = orb.x - closestX;
      const distY = orb.y - closestY;
      const distSq = distX * distX + distY * distY;

      if (distSq <= orb.radius * orb.radius) {
        hitBlockId = block.id;
        const overlapX = halfW + orb.radius - Math.abs(orb.x - block.x);
        const overlapY = halfH + orb.radius - Math.abs(orb.y - block.y);

        if (overlapX < overlapY) {
          orb.vx = -orb.vx;
          orb.x += orb.x < block.x ? -overlapX : overlapX;
        } else {
          orb.vy = -orb.vy;
          orb.y += orb.y < block.y ? -overlapY : overlapY;
        }
        break;
      }
    }

    return { hitWall, hitBlockId, hitX: orb.x, hitY: orb.y };
  }
}
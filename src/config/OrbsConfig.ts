export type ElementType = 'FIRE' | 'ICE' | 'LIGHTNING' | 'NATURE';

export interface OrbStats {
  id: string;
  element: ElementType;
  tier: 1 | 2 | 3 | 4;
  romanTier: string;
  name: string;
  baseDamage: number;
  color: number;
  nextTierId: string | null;
}

export const OrbsConfig: Record<string, OrbStats> = {
  // FIRE FAMILY
  FIRE_1: { id: 'FIRE_1', element: 'FIRE', tier: 1, romanTier: 'I', name: 'Ember I', baseDamage: 14, color: 0xff5722, nextTierId: 'FIRE_2' },
  FIRE_2: { id: 'FIRE_2', element: 'FIRE', tier: 2, romanTier: 'II', name: 'Magma II', baseDamage: 32, color: 0xff3d00, nextTierId: 'FIRE_3' },
  FIRE_3: { id: 'FIRE_3', element: 'FIRE', tier: 3, romanTier: 'III', name: 'Solar III', baseDamage: 75, color: 0xff9100, nextTierId: 'FIRE_4' },
  FIRE_4: { id: 'FIRE_4', element: 'FIRE', tier: 4, romanTier: 'IV', name: 'Supernova IV', baseDamage: 180, color: 0xffea00, nextTierId: null },

  // ICE FAMILY
  ICE_1: { id: 'ICE_1', element: 'ICE', tier: 1, romanTier: 'I', name: 'Frost I', baseDamage: 12, color: 0x29b6f6, nextTierId: 'ICE_2' },
  ICE_2: { id: 'ICE_2', element: 'ICE', tier: 2, romanTier: 'II', name: 'Glacier II', baseDamage: 28, color: 0x00b0ff, nextTierId: 'ICE_3' },
  ICE_3: { id: 'ICE_3', element: 'ICE', tier: 3, romanTier: 'III', name: 'Blizzard III', baseDamage: 65, color: 0x00e5ff, nextTierId: 'ICE_4' },
  ICE_4: { id: 'ICE_4', element: 'ICE', tier: 4, romanTier: 'IV', name: 'Absolute Zero IV', baseDamage: 160, color: 0x84ffff, nextTierId: null },

  // LIGHTNING FAMILY
  LIGHTNING_1: { id: 'LIGHTNING_1', element: 'LIGHTNING', tier: 1, romanTier: 'I', name: 'Spark I', baseDamage: 13, color: 0xab47bc, nextTierId: 'LIGHTNING_2' },
  LIGHTNING_2: { id: 'LIGHTNING_2', element: 'LIGHTNING', tier: 2, romanTier: 'II', name: 'Surge II', baseDamage: 30, color: 0x9c27b0, nextTierId: 'LIGHTNING_3' },
  LIGHTNING_3: { id: 'LIGHTNING_3', element: 'LIGHTNING', tier: 3, romanTier: 'III', name: 'Tempest III', baseDamage: 70, color: 0xd500f9, nextTierId: 'LIGHTNING_4' },
  LIGHTNING_4: { id: 'LIGHTNING_4', element: 'LIGHTNING', tier: 4, romanTier: 'IV', name: 'Thunder God IV', baseDamage: 170, color: 0xea80fc, nextTierId: null },

  // NATURE / OIL FAMILY
  NATURE_1: { id: 'NATURE_1', element: 'NATURE', tier: 1, romanTier: 'I', name: 'Alch Oil I', baseDamage: 11, color: 0x66bb6a, nextTierId: 'NATURE_2' },
  NATURE_2: { id: 'NATURE_2', element: 'NATURE', tier: 2, romanTier: 'II', name: 'Venom II', baseDamage: 26, color: 0x43a047, nextTierId: 'NATURE_3' },
  NATURE_3: { id: 'NATURE_3', element: 'NATURE', tier: 3, romanTier: 'III', name: 'Acid Brew III', baseDamage: 60, color: 0x00e676, nextTierId: 'NATURE_4' },
  NATURE_4: { id: 'NATURE_4', element: 'NATURE', tier: 4, romanTier: 'IV', name: 'Plague Star IV', baseDamage: 150, color: 0xb9f6ca, nextTierId: null }
};

export const TIER_1_KEYS = ['FIRE_1', 'ICE_1', 'LIGHTNING_1', 'NATURE_1'] as const;
export const TIER_2_KEYS = ['FIRE_2', 'ICE_2', 'LIGHTNING_2', 'NATURE_2'] as const;
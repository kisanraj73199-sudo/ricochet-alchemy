export type ElementType = 'FIRE' | 'ICE' | 'LIGHTNING' | 'NATURE';

export interface OrbStats {
  id: string;
  element: ElementType;
  tier: 1 | 2 | 3 | 4;
  name: string;
  baseDamage: number;
  color: number;
  effectDescription: string;
}

export const OrbsConfig: Record<string, OrbStats> = {
  FIRE_1: {
    id: 'FIRE_1',
    element: 'FIRE',
    tier: 1,
    name: 'Ember Rune',
    baseDamage: 12,
    color: 0xff5722,
    effectDescription: 'Ignites crystal targets on impact.'
  },
  ICE_1: {
    id: 'ICE_1',
    element: 'ICE',
    tier: 1,
    name: 'Frost Rune',
    baseDamage: 10,
    color: 0x29b6f6,
    effectDescription: 'Chills targets and makes them brittle.'
  },
  LIGHTNING_1: {
    id: 'LIGHTNING_1',
    element: 'LIGHTNING',
    tier: 1,
    name: 'Spark Rune',
    baseDamage: 11,
    color: 0xab47bc,
    effectDescription: 'Chains electric arcs to adjacent crystals.'
  },
  NATURE_1: {
    id: 'NATURE_1',
    element: 'NATURE',
    tier: 1,
    name: 'Venom Rune',
    baseDamage: 9,
    color: 0x66bb6a,
    effectDescription: 'Coats targets in reactive alchemical oil.'
  }
};

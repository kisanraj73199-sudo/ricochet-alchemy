/**
 * Phase 3: Elemental Reaction & Combo Multiplier System
 * Rewards players for ordering runes strategically in their 4x3 Forge Grid.
 */
import { ElementType } from '../config/OrbsConfig';

export interface ComboReaction {
  multiplier: number;
  label: string;
  color: string;
}

export class ElementalCombos {
  public static getComboMultiplier(first: ElementType, second: ElementType): ComboReaction {
    if (first === 'NATURE' && second === 'FIRE') {
      return { multiplier: 2.5, label: 'MAGMA IGNITION! x2.5', color: '#ff5722' };
    }
    if (first === 'ICE' && second === 'LIGHTNING') {
      return { multiplier: 2.2, label: 'SUPERCONDUCTOR! x2.2', color: '#00e5ff' };
    }
    if (first === 'FIRE' && second === 'ICE') {
      return { multiplier: 2.0, label: 'THERMAL SHOCK! x2.0', color: '#80d8ff' };
    }
    if (first === 'NATURE' && second === 'LIGHTNING') {
      return { multiplier: 1.8, label: 'BIO-SURGE! x1.8', color: '#b9f6ca' };
    }
    return { multiplier: 1.0, label: '', color: '#ffeb3b' };
  }
}
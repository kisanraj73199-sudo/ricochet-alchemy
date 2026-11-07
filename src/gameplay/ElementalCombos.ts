/**
 * Phase 3 Blueprint Stub: Elemental Combo Multiplier Logic (Oil + Fire, Frost + Shatter, etc.)
 */
import { ElementType } from '../config/OrbsConfig';

export class ElementalCombos {
  public static getComboMultiplier(first: ElementType, second: ElementType): { multiplier: number; label: string } {
    if (first === 'NATURE' && second === 'FIRE') {
      return { multiplier: 2.5, label: 'MAGMA IGNITION!' };
    }
    if (first === 'ICE' && second === 'LIGHTNING') {
      return { multiplier: 2.2, label: 'SUPERCONDUCTOR SHATTER!' };
    }
    return { multiplier: 1.0, label: '' };
  }
}

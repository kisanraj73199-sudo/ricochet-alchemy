/**
 * Phase 3 Blueprint Stub: Bottom 4x3 Rune Merge Grid Logic
 */
export class ForgeGrid {
  public static canMerge(slotA: string | null, slotB: string | null): boolean {
    if (!slotA || !slotB) return false;
    return slotA === slotB;
  }
}

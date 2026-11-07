/**
 * Warm Fantasy Royal-Stone & Gold Theme Configuration
 * Designed for authentic commercial game feel (Not dark/hacking matrix theme).
 * Includes TOP BANNER AD safe layout coordinates.
 */

export const ThemeConfig = {
  screen: {
    width: 390,
    height: 844,
    // TOP BANNER AD SAFE ZONE (Screen 2 & 3 Update)
    topAdBannerHeight: 60,
    topAdSafePadding: 12,
    hudTopY: 72,          // Starts safely below the Top Banner Ad + Padding
    arenaTopY: 124,       // Main Ricochet Arena Top
    arenaBottomY: 510,    // Main Ricochet Arena Bottom (Cannon position)
    forgeGridTopY: 525,   // Bottom 4x3 Rune Merge Grid (Zero ad interference at bottom!)
    forgeGridBottomY: 825
  },
  colors: {
    // Warm Arcane Stone & Parchment Palette
    bgWarmStone: 0x3b2f26,
    arenaSandstone: 0xd9bf9b,
    panelRoyalBlue: 0x26466d,
    panelParchment: 0xf0d9b5,
    goldBorder: 0xe6b450,
    goldHighlight: 0xffdf73,
    buttonPlayGreen: 0x4caf50,
    buttonUpgradeOrange: 0xe07a2b,
    textCream: '#fff7e6',
    textDarkBrown: '#332211',
    dangerRed: 0xd94141
  }
} as const;

export interface MonsterArchetype {
  id: string;
  name: string;
  baseHp: number;
  isBoss: boolean;
  color: number;
  rewardCoins: number;
}

export const MonstersConfig: Record<string, MonsterArchetype> = {
  CRYSTAL_GUARD: {
    id: 'CRYSTAL_GUARD',
    name: 'Quartz Sentinel',
    baseHp: 45,
    isBoss: false,
    color: 0x4fc3f7,
    rewardCoins: 10
  },
  OBSIDIAN_BRUTE: {
    id: 'OBSIDIAN_BRUTE',
    name: 'Obsidian Brute',
    baseHp: 120,
    isBoss: false,
    color: 0x7e57c2,
    rewardCoins: 25
  },
  BOSS_CRYSTAL_GOLEM: {
    id: 'BOSS_CRYSTAL_GOLEM',
    name: 'Giant Crystal Golem',
    baseHp: 1200,
    isBoss: true,
    color: 0x26c6da,
    rewardCoins: 300
  }
};

export type ItemType = 'ore' | 'refined' | 'ingot' | 'component' | 'electronic' | 'machine';
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'exotic' | 'artifact';

export interface RequestLimitConfig {
  [key: string]: {
    maxQuantity: number;
    cooldownMinutes: number;
  };
}

export const REQUEST_LIMITS: RequestLimitConfig = {
  common: { maxQuantity: 100, cooldownMinutes: 30 },
  uncommon: { maxQuantity: 50, cooldownMinutes: 45 },
  rare: { maxQuantity: 25, cooldownMinutes: 60 },
  epic: { maxQuantity: 10, cooldownMinutes: 90 },
  legendary: { maxQuantity: 3, cooldownMinutes: 120 },
  mythic: { maxQuantity: 2, cooldownMinutes: 150 },
  exotic: { maxQuantity: 1, cooldownMinutes: 180 },
  artifact: { maxQuantity: 1, cooldownMinutes: 240 },
};

export const RARITY_DONATION_BONUS: Record<ItemRarity, number> = {
  common: 1,
  uncommon: 1.5,
  rare: 2.5,
  epic: 5,
  legendary: 10,
  mythic: 20,
  exotic: 40,
  artifact: 100,
};

export function getPerkMultiplier(perkType: string, level: number): number {
  switch (perkType) {
    case 'request_limit':
      return 1 + level * 0.15;
    case 'cooldown_reduction':
      return 1 - level * 0.08;
    case 'donation_bonus':
      return 1 + level * 0.1;
    case 'request_slots':
      return 1 + level * 0.5;
    default:
      return 1;
  }
}

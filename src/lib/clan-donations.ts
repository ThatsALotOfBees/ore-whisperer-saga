import type { ItemRarity } from '@/types/clan';
import { REQUEST_LIMITS, RARITY_DONATION_BONUS, getPerkMultiplier } from '@/types/clan';
import type { RECIPE_MAP } from '@/data/recipes';
import type { OreRarity } from '@/data/ores';

export function getRarityFromOre(oreRarity: OreRarity): ItemRarity {
  const rarityMap: Record<OreRarity, ItemRarity> = {
    'common': 'common',
    'uncommon': 'uncommon',
    'rare': 'rare',
    'epic': 'epic',
    'legendary': 'legendary',
    'mythic': 'mythic',
    'exotic': 'exotic',
    'artifact': 'artifact',
  };
  return rarityMap[oreRarity];
}

export function getItemRarity(itemId: string, recipes: typeof RECIPE_MAP, ores: Record<string, any>): ItemRarity {
  if (ores[itemId]) {
    return getRarityFromOre(ores[itemId].rarity);
  }
  const recipe = recipes[itemId];
  if (!recipe) return 'common';
  const maxIngredientRarity = recipe.ingredients
    .map(ing => getItemRarity(ing.itemId, recipes, ores))
    .reduce((max, curr) => {
      const rarityOrder: ItemRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'exotic', 'artifact'];
      return rarityOrder.indexOf(curr) > rarityOrder.indexOf(max) ? curr : max;
    }, 'common' as ItemRarity);
  if (recipe.requiredMachine) {
    const rarityOrder: ItemRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'exotic', 'artifact'];
    const machineIndex = rarityOrder.indexOf(maxIngredientRarity);
    return rarityOrder[Math.min(machineIndex + 1, 7)];
  }
  return maxIngredientRarity;
}

export function getMaxRequestQuantity(
  itemRarity: ItemRarity,
  baseQuantity: number,
  perks: any[]
): number {
  const limitConfig = REQUEST_LIMITS[itemRarity];
  let maxQty = baseQuantity || limitConfig?.maxQuantity || 10;
  const limitPerk = perks.find((p: any) => p.perk_type === 'request_limit');
  if (limitPerk) {
    maxQty = Math.floor(maxQty * getPerkMultiplier('request_limit', limitPerk.level));
  }
  return maxQty;
}

export function getRequestCooldownMs(
  itemRarity: ItemRarity,
  perks: any[]
): number {
  const limitConfig = REQUEST_LIMITS[itemRarity];
  let cooldownMs = (limitConfig?.cooldownMinutes || 60) * 60 * 1000;
  const cooldownPerk = perks.find((p: any) => p.perk_type === 'cooldown_reduction');
  if (cooldownPerk) {
    cooldownMs = Math.floor(cooldownMs * getPerkMultiplier('cooldown_reduction', cooldownPerk.level));
  }
  return cooldownMs;
}

export function getDonationReward(
  itemRarity: ItemRarity,
  quantity: number,
  itemBaseValue: number,
  perks: any[]
): number {
  let reward = itemBaseValue * quantity * RARITY_DONATION_BONUS[itemRarity];
  const bonusPerk = perks.find((p: any) => p.perk_type === 'donation_bonus');
  if (bonusPerk) {
    reward = Math.floor(reward * getPerkMultiplier('donation_bonus', bonusPerk.level));
  }
  return Math.floor(reward);
}

export function canMakeRequest(lastRequestTime: Date | null, cooldownMs: number): boolean {
  if (!lastRequestTime) return true;
  return Date.now() - new Date(lastRequestTime).getTime() >= cooldownMs;
}

export function getRequestCooldownRemaining(lastRequestTime: Date | null, cooldownMs: number): number {
  if (!lastRequestTime) return 0;
  const elapsed = Date.now() - new Date(lastRequestTime).getTime();
  return Math.max(0, cooldownMs - elapsed);
}

export function formatCooldownRemaining(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function isRequestComplete(request: any): boolean {
  return request.quantity_fulfilled >= request.quantity_needed;
}

export function getRequestProgress(request: any): number {
  return Math.min(1, request.quantity_fulfilled / request.quantity_needed);
}

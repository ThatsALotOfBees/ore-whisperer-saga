import type { ItemRarity } from '@/types/clan';
import { REQUEST_LIMITS, RARITY_DONATION_BONUS, getPerkMultiplier } from '@/types/clan';
import { getItemRarity } from './item-utils';

export function getRarityFromOre(oreRarity: string): ItemRarity {
  return oreRarity as ItemRarity;
}

export function getItemRarityFromId(itemId: string): ItemRarity {
  return getItemRarity(itemId) as ItemRarity;
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

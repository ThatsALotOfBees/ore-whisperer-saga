import { ORE_MAP, SPECIAL_MINING_DROPS, type OreRarity } from '@/data/ores';
import { RECIPE_MAP } from '@/data/recipes';

/**
 * Gets the rarity of any item by its ID.
 * Priority: 
 * 1. ORE_MAP (Ores/Refined/Ingots)
 * 2. SPECIAL_MINING_DROPS (Special items like boot/seed pack)
 * 3. RECIPE_MAP (Crafted items based on category)
 */
export function getItemRarity(itemId: string): OreRarity {
  // 1. Check ORE_MAP
  const ore = ORE_MAP[itemId];
  if (ore) return ore.rarity;

  // 2. Check SPECIAL_MINING_DROPS
  const special = SPECIAL_MINING_DROPS.find(d => d.id === itemId);
  if (special) return special.rarity;

  // 3. Check RECIPE_MAP
  const recipe = RECIPE_MAP[itemId];
  if (recipe) {
    if (recipe.category === 'machine') return 'epic';
    if (recipe.category === 'electronic') return 'rare';
    return 'uncommon';
  }

  // Fallback
  return 'common';
}

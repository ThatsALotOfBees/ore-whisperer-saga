// ─── Garden / Plant System ───────────────────────────────────────────────────
import type { OreRarity } from './ores';

export type PlantRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface PlantDef {
  id: string;
  name: string;
  rarity: PlantRarity;
  growTimeMs: number; // base grow time in ms (10 min = 600000)
  passiveIncomePerTick: number; // currency per tick while growing
  harvestBonus: number; // bonus currency on harvest
  seedReturnBase: number; // seeds returned unupgraded
  emoji: string;
}

export interface SeedPack {
  id: string;
  name: string;
  description: string;
}

// Seed pack is a generic item the player finds while mining
export const SEED_PACK: SeedPack = {
  id: 'seed_pack',
  name: 'Seed Pack',
  description: 'A mysterious packet of seeds. Open to receive a random plant seed.',
};

// Rarity roll chances for seed packs
export const SEED_RARITY_CHANCES: { rarity: PlantRarity; chance: number }[] = [
  { rarity: 'common', chance: 0.55 },
  { rarity: 'uncommon', chance: 0.25 },
  { rarity: 'rare', chance: 0.12 },
  { rarity: 'epic', chance: 0.06 },
  { rarity: 'legendary', chance: 0.02 },
];

// ─── Plant Definitions ──────────────────────────────────────────────────────
const BASE_GROW = 600000; // 10 minutes

export const ALL_PLANTS: PlantDef[] = [
  // Common (55%)
  { id: 'dandelion', name: 'Dandelion', rarity: 'common', growTimeMs: BASE_GROW, passiveIncomePerTick: 1, harvestBonus: 15, seedReturnBase: 1, emoji: '🌼' },
  { id: 'wheat_grass', name: 'Wheat Grass', rarity: 'common', growTimeMs: BASE_GROW, passiveIncomePerTick: 1, harvestBonus: 12, seedReturnBase: 1, emoji: '🌾' },
  { id: 'clover', name: 'Lucky Clover', rarity: 'common', growTimeMs: BASE_GROW, passiveIncomePerTick: 1, harvestBonus: 18, seedReturnBase: 1, emoji: '🍀' },
  { id: 'moss_patch', name: 'Moss Patch', rarity: 'common', growTimeMs: BASE_GROW, passiveIncomePerTick: 1, harvestBonus: 10, seedReturnBase: 1, emoji: '🌿' },
  { id: 'fern', name: 'Cave Fern', rarity: 'common', growTimeMs: BASE_GROW, passiveIncomePerTick: 2, harvestBonus: 14, seedReturnBase: 1, emoji: '🌱' },

  // Uncommon (25%)
  { id: 'glowshroom', name: 'Glowshroom', rarity: 'uncommon', growTimeMs: BASE_GROW, passiveIncomePerTick: 3, harvestBonus: 35, seedReturnBase: 1, emoji: '🍄' },
  { id: 'crystal_tulip', name: 'Crystal Tulip', rarity: 'uncommon', growTimeMs: BASE_GROW, passiveIncomePerTick: 4, harvestBonus: 40, seedReturnBase: 1, emoji: '🌷' },
  { id: 'iron_vine', name: 'Iron Vine', rarity: 'uncommon', growTimeMs: BASE_GROW, passiveIncomePerTick: 3, harvestBonus: 38, seedReturnBase: 1, emoji: '🌻' },
  { id: 'dust_bloom', name: 'Dust Bloom', rarity: 'uncommon', growTimeMs: BASE_GROW, passiveIncomePerTick: 4, harvestBonus: 42, seedReturnBase: 1, emoji: '💐' },

  // Rare (12%)
  { id: 'ember_rose', name: 'Ember Rose', rarity: 'rare', growTimeMs: BASE_GROW, passiveIncomePerTick: 8, harvestBonus: 90, seedReturnBase: 1, emoji: '🌹' },
  { id: 'frost_lily', name: 'Frost Lily', rarity: 'rare', growTimeMs: BASE_GROW, passiveIncomePerTick: 9, harvestBonus: 100, seedReturnBase: 1, emoji: '❄️' },
  { id: 'shadow_fern', name: 'Shadow Fern', rarity: 'rare', growTimeMs: BASE_GROW, passiveIncomePerTick: 7, harvestBonus: 85, seedReturnBase: 1, emoji: '🌑' },

  // Epic (6%)
  { id: 'void_orchid', name: 'Void Orchid', rarity: 'epic', growTimeMs: BASE_GROW, passiveIncomePerTick: 18, harvestBonus: 250, seedReturnBase: 1, emoji: '🪻' },
  { id: 'plasma_blossom', name: 'Plasma Blossom', rarity: 'epic', growTimeMs: BASE_GROW, passiveIncomePerTick: 20, harvestBonus: 280, seedReturnBase: 1, emoji: '⚡' },

  // Legendary (2%)
  { id: 'singularity_bloom', name: 'Singularity Bloom', rarity: 'legendary', growTimeMs: BASE_GROW, passiveIncomePerTick: 50, harvestBonus: 800, seedReturnBase: 1, emoji: '✨' },
];

export const PLANT_MAP: Record<string, PlantDef> = {};
ALL_PLANTS.forEach(p => { PLANT_MAP[p.id] = p; });

// Roll a seed from a seed pack
export function rollSeedFromPack(): PlantDef {
  const roll = Math.random();
  let cumulative = 0;
  let targetRarity: PlantRarity = 'common';

  for (const { rarity, chance } of SEED_RARITY_CHANCES) {
    cumulative += chance;
    if (roll <= cumulative) {
      targetRarity = rarity;
      break;
    }
  }

  const plantsOfRarity = ALL_PLANTS.filter(p => p.rarity === targetRarity);
  return plantsOfRarity[Math.floor(Math.random() * plantsOfRarity.length)];
}

// ─── Garden Upgrade Costs ────────────────────────────────────────────────────
export const PLOT_COST_BASE = 500;
export const PLOT_COST_MULTIPLIER = 1.8;
export const GROW_SPEED_UPGRADE_BASE = 300;
export const GROW_SPEED_UPGRADE_MULTIPLIER = 2.0;
export const HARVEST_UPGRADE_BASE = 400;
export const HARVEST_UPGRADE_MULTIPLIER = 2.2;
export const MAX_PLOTS_PER_GREENHOUSE = 9;
export const GROW_SPEED_MAX_LEVEL = 10;
export const HARVEST_MAX_LEVEL = 10;

// Passive income tick interval (every 5 seconds)
export const GARDEN_TICK_INTERVAL = 5000;

// Plant rarity color map (for UI)
export const PLANT_RARITY_COLORS: Record<PlantRarity, string> = {
  common: 'text-muted-foreground',
  uncommon: 'text-green-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-amber-400',
};

export const PLANT_RARITY_BORDER: Record<PlantRarity, string> = {
  common: 'border-muted-foreground/30',
  uncommon: 'border-green-400/30',
  rare: 'border-blue-400/30',
  epic: 'border-purple-400/30',
  legendary: 'border-amber-400/30',
};

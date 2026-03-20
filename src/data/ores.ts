export type OreRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'exotic' | 'artifact';

export interface Ore {
  id: string;
  name: string;
  tier: number;
  rarity: OreRarity;
  miningChance: number;
  smeltYield: number;
  refineMultiplier: number;
  refineCost: number;
  value: number;
  hardness: 'low' | 'medium' | 'high' | 'extreme';
  processingDifficulty: 'easy' | 'moderate' | 'expensive' | 'extreme';
  minSmeltTier: number;
}

// ─── Common (Tier 1) ── 20 ores ─────────────────────────────────────────────
const commonOres: Ore[] = [
  { id: 'stone', name: 'Stone', tier: 1, rarity: 'common', miningChance: 0.30, smeltYield: 1, refineMultiplier: 1.2, refineCost: 2, value: 1, hardness: 'low', processingDifficulty: 'easy', minSmeltTier: 1 },
  { id: 'coal', name: 'Coal', tier: 1, rarity: 'common', miningChance: 0.28, smeltYield: 1, refineMultiplier: 1.3, refineCost: 3, value: 2, hardness: 'low', processingDifficulty: 'easy', minSmeltTier: 1 },
  { id: 'iron', name: 'Iron Ore', tier: 1, rarity: 'common', miningChance: 0.25, smeltYield: 2, refineMultiplier: 1.5, refineCost: 5, value: 3, hardness: 'low', processingDifficulty: 'easy', minSmeltTier: 1 },
  { id: 'copper', name: 'Copper Ore', tier: 1, rarity: 'common', miningChance: 0.24, smeltYield: 2, refineMultiplier: 1.5, refineCost: 5, value: 4, hardness: 'low', processingDifficulty: 'easy', minSmeltTier: 1 },
  { id: 'tin', name: 'Tin Ore', tier: 1, rarity: 'common', miningChance: 0.22, smeltYield: 2, refineMultiplier: 1.4, refineCost: 6, value: 4, hardness: 'low', processingDifficulty: 'easy', minSmeltTier: 1 },
  { id: 'aluminum', name: 'Aluminum Ore', tier: 1, rarity: 'common', miningChance: 0.20, smeltYield: 2, refineMultiplier: 1.5, refineCost: 7, value: 5, hardness: 'low', processingDifficulty: 'easy', minSmeltTier: 1 },
  { id: 'lead', name: 'Lead Ore', tier: 1, rarity: 'common', miningChance: 0.20, smeltYield: 2, refineMultiplier: 1.4, refineCost: 5, value: 3, hardness: 'low', processingDifficulty: 'easy', minSmeltTier: 1 },
  { id: 'zinc', name: 'Zinc Ore', tier: 1, rarity: 'common', miningChance: 0.19, smeltYield: 2, refineMultiplier: 1.4, refineCost: 6, value: 4, hardness: 'low', processingDifficulty: 'easy', minSmeltTier: 1 },
  { id: 'nickel', name: 'Nickel Ore', tier: 1, rarity: 'common', miningChance: 0.18, smeltYield: 2, refineMultiplier: 1.4, refineCost: 7, value: 5, hardness: 'low', processingDifficulty: 'easy', minSmeltTier: 1 },
  { id: 'bauxite', name: 'Bauxite', tier: 1, rarity: 'common', miningChance: 0.18, smeltYield: 1, refineMultiplier: 1.3, refineCost: 5, value: 4, hardness: 'low', processingDifficulty: 'easy', minSmeltTier: 1 },
  { id: 'sandstone', name: 'Sandstone', tier: 1, rarity: 'common', miningChance: 0.17, smeltYield: 1, refineMultiplier: 1.2, refineCost: 3, value: 2, hardness: 'low', processingDifficulty: 'easy', minSmeltTier: 1 },
  { id: 'limestone', name: 'Limestone', tier: 1, rarity: 'common', miningChance: 0.17, smeltYield: 1, refineMultiplier: 1.2, refineCost: 3, value: 2, hardness: 'low', processingDifficulty: 'easy', minSmeltTier: 1 },
  { id: 'clay', name: 'Clay', tier: 1, rarity: 'common', miningChance: 0.16, smeltYield: 1, refineMultiplier: 1.2, refineCost: 2, value: 2, hardness: 'low', processingDifficulty: 'easy', minSmeltTier: 1 },
  { id: 'gypsum', name: 'Gypsum', tier: 1, rarity: 'common', miningChance: 0.16, smeltYield: 1, refineMultiplier: 1.2, refineCost: 3, value: 2, hardness: 'low', processingDifficulty: 'easy', minSmeltTier: 1 },
  { id: 'chalk', name: 'Chalk', tier: 1, rarity: 'common', miningChance: 0.15, smeltYield: 1, refineMultiplier: 1.1, refineCost: 2, value: 1, hardness: 'low', processingDifficulty: 'easy', minSmeltTier: 1 },
  { id: 'gravel', name: 'Gravel', tier: 1, rarity: 'common', miningChance: 0.15, smeltYield: 1, refineMultiplier: 1.1, refineCost: 2, value: 1, hardness: 'low', processingDifficulty: 'easy', minSmeltTier: 1 },
  { id: 'basalt', name: 'Basalt', tier: 1, rarity: 'common', miningChance: 0.14, smeltYield: 1, refineMultiplier: 1.3, refineCost: 4, value: 3, hardness: 'medium', processingDifficulty: 'easy', minSmeltTier: 1 },
  { id: 'granite', name: 'Granite', tier: 1, rarity: 'common', miningChance: 0.14, smeltYield: 1, refineMultiplier: 1.3, refineCost: 4, value: 3, hardness: 'medium', processingDifficulty: 'easy', minSmeltTier: 1 },
  { id: 'diorite', name: 'Diorite', tier: 1, rarity: 'common', miningChance: 0.13, smeltYield: 1, refineMultiplier: 1.2, refineCost: 3, value: 2, hardness: 'medium', processingDifficulty: 'easy', minSmeltTier: 1 },
  { id: 'andesite', name: 'Andesite', tier: 1, rarity: 'common', miningChance: 0.13, smeltYield: 1, refineMultiplier: 1.2, refineCost: 3, value: 2, hardness: 'medium', processingDifficulty: 'easy', minSmeltTier: 1 },
];

// ─── Uncommon (Tier 2) ── 20 ores ───────────────────────────────────────────
const uncommonOres: Ore[] = [
  { id: 'quartz', name: 'Quartz', tier: 2, rarity: 'uncommon', miningChance: 0.10, smeltYield: 1, refineMultiplier: 1.6, refineCost: 8, value: 6, hardness: 'medium', processingDifficulty: 'moderate', minSmeltTier: 3 },
  { id: 'feldspar', name: 'Feldspar', tier: 2, rarity: 'uncommon', miningChance: 0.10, smeltYield: 1, refineMultiplier: 1.4, refineCost: 7, value: 5, hardness: 'medium', processingDifficulty: 'moderate', minSmeltTier: 3 },
  { id: 'mica', name: 'Mica', tier: 2, rarity: 'uncommon', miningChance: 0.09, smeltYield: 1, refineMultiplier: 1.5, refineCost: 8, value: 6, hardness: 'medium', processingDifficulty: 'moderate', minSmeltTier: 3 },
  { id: 'sulfur', name: 'Sulfur', tier: 2, rarity: 'uncommon', miningChance: 0.09, smeltYield: 1, refineMultiplier: 1.4, refineCost: 7, value: 5, hardness: 'medium', processingDifficulty: 'moderate', minSmeltTier: 3 },
  { id: 'graphite', name: 'Graphite', tier: 2, rarity: 'uncommon', miningChance: 0.09, smeltYield: 1, refineMultiplier: 1.5, refineCost: 8, value: 7, hardness: 'medium', processingDifficulty: 'moderate', minSmeltTier: 3 },
  { id: 'fluorite', name: 'Fluorite', tier: 2, rarity: 'uncommon', miningChance: 0.08, smeltYield: 1, refineMultiplier: 1.5, refineCost: 9, value: 7, hardness: 'medium', processingDifficulty: 'moderate', minSmeltTier: 3 },
  { id: 'calcite', name: 'Calcite', tier: 2, rarity: 'uncommon', miningChance: 0.08, smeltYield: 1, refineMultiplier: 1.4, refineCost: 7, value: 5, hardness: 'medium', processingDifficulty: 'moderate', minSmeltTier: 3 },
  { id: 'dolomite', name: 'Dolomite', tier: 2, rarity: 'uncommon', miningChance: 0.08, smeltYield: 1, refineMultiplier: 1.4, refineCost: 7, value: 5, hardness: 'medium', processingDifficulty: 'moderate', minSmeltTier: 3 },
  { id: 'magnetite', name: 'Magnetite', tier: 2, rarity: 'uncommon', miningChance: 0.07, smeltYield: 1, refineMultiplier: 1.6, refineCost: 10, value: 8, hardness: 'medium', processingDifficulty: 'moderate', minSmeltTier: 3 },
  { id: 'hematite', name: 'Hematite', tier: 2, rarity: 'uncommon', miningChance: 0.07, smeltYield: 1, refineMultiplier: 1.5, refineCost: 9, value: 7, hardness: 'medium', processingDifficulty: 'moderate', minSmeltTier: 3 },
  { id: 'chromite', name: 'Chromite', tier: 2, rarity: 'uncommon', miningChance: 0.07, smeltYield: 1, refineMultiplier: 1.5, refineCost: 10, value: 8, hardness: 'medium', processingDifficulty: 'moderate', minSmeltTier: 3 },
  { id: 'ilmenite', name: 'Ilmenite', tier: 2, rarity: 'uncommon', miningChance: 0.06, smeltYield: 1, refineMultiplier: 1.5, refineCost: 10, value: 8, hardness: 'medium', processingDifficulty: 'moderate', minSmeltTier: 3 },
  { id: 'rutile', name: 'Rutile', tier: 2, rarity: 'uncommon', miningChance: 0.06, smeltYield: 1, refineMultiplier: 1.6, refineCost: 11, value: 9, hardness: 'medium', processingDifficulty: 'moderate', minSmeltTier: 3 },
  { id: 'pyrite', name: 'Pyrite', tier: 2, rarity: 'uncommon', miningChance: 0.06, smeltYield: 1, refineMultiplier: 1.5, refineCost: 9, value: 8, hardness: 'medium', processingDifficulty: 'moderate', minSmeltTier: 3 },
  { id: 'galena', name: 'Galena', tier: 2, rarity: 'uncommon', miningChance: 0.06, smeltYield: 1, refineMultiplier: 1.5, refineCost: 9, value: 7, hardness: 'medium', processingDifficulty: 'moderate', minSmeltTier: 3 },
  { id: 'sphalerite', name: 'Sphalerite', tier: 2, rarity: 'uncommon', miningChance: 0.05, smeltYield: 1, refineMultiplier: 1.5, refineCost: 10, value: 8, hardness: 'medium', processingDifficulty: 'moderate', minSmeltTier: 3 },
  { id: 'talc', name: 'Talc', tier: 2, rarity: 'uncommon', miningChance: 0.05, smeltYield: 1, refineMultiplier: 1.3, refineCost: 6, value: 5, hardness: 'low', processingDifficulty: 'moderate', minSmeltTier: 3 },
  { id: 'kaolinite', name: 'Kaolinite', tier: 2, rarity: 'uncommon', miningChance: 0.05, smeltYield: 1, refineMultiplier: 1.4, refineCost: 7, value: 6, hardness: 'low', processingDifficulty: 'moderate', minSmeltTier: 3 },
  { id: 'barite', name: 'Barite', tier: 2, rarity: 'uncommon', miningChance: 0.05, smeltYield: 1, refineMultiplier: 1.5, refineCost: 9, value: 7, hardness: 'medium', processingDifficulty: 'moderate', minSmeltTier: 3 },
  { id: 'halite', name: 'Halite', tier: 2, rarity: 'uncommon', miningChance: 0.05, smeltYield: 1, refineMultiplier: 1.3, refineCost: 6, value: 5, hardness: 'low', processingDifficulty: 'moderate', minSmeltTier: 3 },
];

// ─── Rare (Tier 3) ── 20 ores ───────────────────────────────────────────────
const rareOres: Ore[] = [
  { id: 'silver', name: 'Silver Ore', tier: 3, rarity: 'rare', miningChance: 0.04, smeltYield: 1, refineMultiplier: 1.8, refineCost: 15, value: 15, hardness: 'medium', processingDifficulty: 'moderate', minSmeltTier: 5 },
  { id: 'gold', name: 'Gold Ore', tier: 3, rarity: 'rare', miningChance: 0.03, smeltYield: 1, refineMultiplier: 2.0, refineCost: 30, value: 40, hardness: 'medium', processingDifficulty: 'moderate', minSmeltTier: 5 },
  { id: 'platinum', name: 'Platinum Ore', tier: 3, rarity: 'rare', miningChance: 0.025, smeltYield: 1, refineMultiplier: 2.0, refineCost: 50, value: 60, hardness: 'high', processingDifficulty: 'expensive', minSmeltTier: 5 },
  { id: 'palladium', name: 'Palladium Ore', tier: 3, rarity: 'rare', miningChance: 0.024, smeltYield: 1, refineMultiplier: 2.0, refineCost: 45, value: 55, hardness: 'high', processingDifficulty: 'expensive', minSmeltTier: 5 },
  { id: 'cobalt', name: 'Cobalt Ore', tier: 3, rarity: 'rare', miningChance: 0.023, smeltYield: 1, refineMultiplier: 1.8, refineCost: 35, value: 30, hardness: 'high', processingDifficulty: 'expensive', minSmeltTier: 5 },
  { id: 'lithium', name: 'Lithium Ore', tier: 3, rarity: 'rare', miningChance: 0.022, smeltYield: 1, refineMultiplier: 1.7, refineCost: 25, value: 25, hardness: 'medium', processingDifficulty: 'moderate', minSmeltTier: 5 },
  { id: 'tungsten', name: 'Tungsten Ore', tier: 3, rarity: 'rare', miningChance: 0.020, smeltYield: 1, refineMultiplier: 1.9, refineCost: 40, value: 45, hardness: 'high', processingDifficulty: 'expensive', minSmeltTier: 5 },
  { id: 'molybdenum', name: 'Molybdenum Ore', tier: 3, rarity: 'rare', miningChance: 0.019, smeltYield: 1, refineMultiplier: 1.8, refineCost: 35, value: 35, hardness: 'high', processingDifficulty: 'expensive', minSmeltTier: 5 },
  { id: 'vanadium', name: 'Vanadium Ore', tier: 3, rarity: 'rare', miningChance: 0.018, smeltYield: 1, refineMultiplier: 1.7, refineCost: 30, value: 28, hardness: 'high', processingDifficulty: 'moderate', minSmeltTier: 5 },
  { id: 'beryllium', name: 'Beryllium Ore', tier: 3, rarity: 'rare', miningChance: 0.017, smeltYield: 1, refineMultiplier: 1.8, refineCost: 35, value: 32, hardness: 'high', processingDifficulty: 'expensive', minSmeltTier: 5 },
  { id: 'strontium', name: 'Strontium Ore', tier: 3, rarity: 'rare', miningChance: 0.016, smeltYield: 1, refineMultiplier: 1.6, refineCost: 25, value: 22, hardness: 'medium', processingDifficulty: 'moderate', minSmeltTier: 5 },
  { id: 'zirconium', name: 'Zirconium Ore', tier: 3, rarity: 'rare', miningChance: 0.015, smeltYield: 1, refineMultiplier: 1.7, refineCost: 30, value: 28, hardness: 'high', processingDifficulty: 'expensive', minSmeltTier: 5 },
  { id: 'niobium', name: 'Niobium Ore', tier: 3, rarity: 'rare', miningChance: 0.014, smeltYield: 1, refineMultiplier: 1.8, refineCost: 35, value: 35, hardness: 'high', processingDifficulty: 'expensive', minSmeltTier: 5 },
  { id: 'tantalum', name: 'Tantalum Ore', tier: 3, rarity: 'rare', miningChance: 0.013, smeltYield: 1, refineMultiplier: 1.9, refineCost: 40, value: 42, hardness: 'high', processingDifficulty: 'expensive', minSmeltTier: 5 },
  { id: 'arsenopyrite', name: 'Arsenopyrite', tier: 3, rarity: 'rare', miningChance: 0.012, smeltYield: 1, refineMultiplier: 1.6, refineCost: 20, value: 18, hardness: 'medium', processingDifficulty: 'moderate', minSmeltTier: 5 },
  { id: 'realgar', name: 'Realgar', tier: 3, rarity: 'rare', miningChance: 0.012, smeltYield: 1, refineMultiplier: 1.5, refineCost: 18, value: 16, hardness: 'medium', processingDifficulty: 'moderate', minSmeltTier: 5 },
  { id: 'orpiment', name: 'Orpiment', tier: 3, rarity: 'rare', miningChance: 0.011, smeltYield: 1, refineMultiplier: 1.5, refineCost: 18, value: 16, hardness: 'medium', processingDifficulty: 'moderate', minSmeltTier: 5 },
  { id: 'pitchblende', name: 'Pitchblende', tier: 3, rarity: 'rare', miningChance: 0.010, smeltYield: 1, refineMultiplier: 2.0, refineCost: 50, value: 50, hardness: 'high', processingDifficulty: 'expensive', minSmeltTier: 5 },
  { id: 'cassiterite', name: 'Cassiterite', tier: 3, rarity: 'rare', miningChance: 0.010, smeltYield: 1, refineMultiplier: 1.7, refineCost: 25, value: 20, hardness: 'medium', processingDifficulty: 'moderate', minSmeltTier: 5 },
  { id: 'bornite', name: 'Bornite', tier: 3, rarity: 'rare', miningChance: 0.010, smeltYield: 1, refineMultiplier: 1.6, refineCost: 22, value: 18, hardness: 'medium', processingDifficulty: 'moderate', minSmeltTier: 5 },
];

// ─── Epic (Tier 4) ── 15 ores ───────────────────────────────────────────────
const epicOres: Ore[] = [
  { id: 'titanium', name: 'Titanium Ore', tier: 4, rarity: 'epic', miningChance: 0.008, smeltYield: 1, refineMultiplier: 1.7, refineCost: 20, value: 20, hardness: 'high', processingDifficulty: 'expensive', minSmeltTier: 8 },
  { id: 'iridium', name: 'Iridium Ore', tier: 4, rarity: 'epic', miningChance: 0.007, smeltYield: 1, refineMultiplier: 2.2, refineCost: 60, value: 80, hardness: 'extreme', processingDifficulty: 'extreme', minSmeltTier: 9 },
  { id: 'osmium', name: 'Osmium Ore', tier: 4, rarity: 'epic', miningChance: 0.007, smeltYield: 1, refineMultiplier: 2.1, refineCost: 55, value: 75, hardness: 'extreme', processingDifficulty: 'extreme', minSmeltTier: 9 },
  { id: 'rhodium', name: 'Rhodium Ore', tier: 4, rarity: 'epic', miningChance: 0.006, smeltYield: 1, refineMultiplier: 2.2, refineCost: 60, value: 85, hardness: 'extreme', processingDifficulty: 'extreme', minSmeltTier: 9 },
  { id: 'ruthenium_ore', name: 'Ruthenium Ore', tier: 4, rarity: 'epic', miningChance: 0.006, smeltYield: 1, refineMultiplier: 2.0, refineCost: 50, value: 70, hardness: 'high', processingDifficulty: 'expensive', minSmeltTier: 9 },
  { id: 'thorium', name: 'Thorium Ore', tier: 4, rarity: 'epic', miningChance: 0.005, smeltYield: 1, refineMultiplier: 2.3, refineCost: 70, value: 90, hardness: 'high', processingDifficulty: 'expensive', minSmeltTier: 9 },
  { id: 'uraninite', name: 'Uraninite', tier: 4, rarity: 'epic', miningChance: 0.005, smeltYield: 1, refineMultiplier: 2.5, refineCost: 80, value: 100, hardness: 'high', processingDifficulty: 'extreme', minSmeltTier: 9 },
  { id: 'columbite', name: 'Columbite', tier: 4, rarity: 'epic', miningChance: 0.005, smeltYield: 1, refineMultiplier: 1.8, refineCost: 40, value: 50, hardness: 'high', processingDifficulty: 'expensive', minSmeltTier: 9 },
  { id: 'monazite', name: 'Monazite', tier: 4, rarity: 'epic', miningChance: 0.004, smeltYield: 1, refineMultiplier: 2.0, refineCost: 55, value: 65, hardness: 'high', processingDifficulty: 'expensive', minSmeltTier: 9 },
  { id: 'xenotime', name: 'Xenotime', tier: 4, rarity: 'epic', miningChance: 0.004, smeltYield: 1, refineMultiplier: 2.0, refineCost: 55, value: 65, hardness: 'high', processingDifficulty: 'expensive', minSmeltTier: 9 },
  { id: 'spodumene', name: 'Spodumene', tier: 4, rarity: 'epic', miningChance: 0.004, smeltYield: 1, refineMultiplier: 1.8, refineCost: 45, value: 55, hardness: 'high', processingDifficulty: 'expensive', minSmeltTier: 9 },
  { id: 'lepidolite', name: 'Lepidolite', tier: 4, rarity: 'epic', miningChance: 0.004, smeltYield: 1, refineMultiplier: 1.7, refineCost: 40, value: 48, hardness: 'medium', processingDifficulty: 'expensive', minSmeltTier: 9 },
  { id: 'petalite', name: 'Petalite', tier: 4, rarity: 'epic', miningChance: 0.003, smeltYield: 1, refineMultiplier: 1.7, refineCost: 42, value: 50, hardness: 'medium', processingDifficulty: 'expensive', minSmeltTier: 9 },
  { id: 'amblygonite', name: 'Amblygonite', tier: 4, rarity: 'epic', miningChance: 0.003, smeltYield: 1, refineMultiplier: 1.8, refineCost: 45, value: 52, hardness: 'high', processingDifficulty: 'expensive', minSmeltTier: 9 },
  { id: 'pollucite', name: 'Pollucite', tier: 4, rarity: 'epic', miningChance: 0.003, smeltYield: 1, refineMultiplier: 1.9, refineCost: 50, value: 58, hardness: 'high', processingDifficulty: 'expensive', minSmeltTier: 9 },
];

// ─── Legendary (Tier 5) ── 10 ores ──────────────────────────────────────────
const legendaryOres: Ore[] = [
  { id: 'diamond', name: 'Diamond Ore', tier: 5, rarity: 'legendary', miningChance: 0.002, smeltYield: 1, refineMultiplier: 2.5, refineCost: 100, value: 200, hardness: 'extreme', processingDifficulty: 'extreme', minSmeltTier: 13 },
  { id: 'emerald', name: 'Emerald Ore', tier: 5, rarity: 'legendary', miningChance: 0.002, smeltYield: 1, refineMultiplier: 2.3, refineCost: 90, value: 180, hardness: 'extreme', processingDifficulty: 'extreme', minSmeltTier: 13 },
  { id: 'ruby', name: 'Ruby Ore', tier: 5, rarity: 'legendary', miningChance: 0.0018, smeltYield: 1, refineMultiplier: 2.3, refineCost: 90, value: 180, hardness: 'extreme', processingDifficulty: 'extreme', minSmeltTier: 13 },
  { id: 'sapphire', name: 'Sapphire Ore', tier: 5, rarity: 'legendary', miningChance: 0.0018, smeltYield: 1, refineMultiplier: 2.3, refineCost: 90, value: 175, hardness: 'extreme', processingDifficulty: 'extreme', minSmeltTier: 13 },
  { id: 'alexandrite', name: 'Alexandrite Ore', tier: 5, rarity: 'legendary', miningChance: 0.0015, smeltYield: 1, refineMultiplier: 2.5, refineCost: 110, value: 220, hardness: 'extreme', processingDifficulty: 'extreme', minSmeltTier: 13 },
  { id: 'painite', name: 'Painite', tier: 5, rarity: 'legendary', miningChance: 0.0012, smeltYield: 1, refineMultiplier: 2.8, refineCost: 130, value: 280, hardness: 'extreme', processingDifficulty: 'extreme', minSmeltTier: 13 },
  { id: 'benitoite', name: 'Benitoite', tier: 5, rarity: 'legendary', miningChance: 0.0012, smeltYield: 1, refineMultiplier: 2.6, refineCost: 120, value: 250, hardness: 'extreme', processingDifficulty: 'extreme', minSmeltTier: 13 },
  { id: 'taaffeite', name: 'Taaffeite', tier: 5, rarity: 'legendary', miningChance: 0.0010, smeltYield: 1, refineMultiplier: 2.8, refineCost: 140, value: 300, hardness: 'extreme', processingDifficulty: 'extreme', minSmeltTier: 13 },
  { id: 'red_beryl', name: 'Red Beryl', tier: 5, rarity: 'legendary', miningChance: 0.0010, smeltYield: 1, refineMultiplier: 2.7, refineCost: 135, value: 290, hardness: 'extreme', processingDifficulty: 'extreme', minSmeltTier: 13 },
  { id: 'grandidierite', name: 'Grandidierite', tier: 5, rarity: 'legendary', miningChance: 0.0008, smeltYield: 1, refineMultiplier: 3.0, refineCost: 150, value: 350, hardness: 'extreme', processingDifficulty: 'extreme', minSmeltTier: 13 },
];

// ─── Mythic (Tier 6) ── 10 ores ─────────────────────────────────────────────
const mythicOres: Ore[] = [
  { id: 'californium', name: 'Californium Ore', tier: 6, rarity: 'mythic', miningChance: 0.0006, smeltYield: 1, refineMultiplier: 3.0, refineCost: 200, value: 500, hardness: 'extreme', processingDifficulty: 'extreme', minSmeltTier: 15 },
  { id: 'neptunium', name: 'Neptunium Ore', tier: 6, rarity: 'mythic', miningChance: 0.0006, smeltYield: 1, refineMultiplier: 3.0, refineCost: 200, value: 480, hardness: 'extreme', processingDifficulty: 'extreme', minSmeltTier: 15 },
  { id: 'plutonium', name: 'Plutonium Ore', tier: 6, rarity: 'mythic', miningChance: 0.0005, smeltYield: 1, refineMultiplier: 3.2, refineCost: 220, value: 550, hardness: 'extreme', processingDifficulty: 'extreme', minSmeltTier: 15 },
  { id: 'francium', name: 'Francium Trace Ore', tier: 6, rarity: 'mythic', miningChance: 0.0004, smeltYield: 1, refineMultiplier: 3.5, refineCost: 250, value: 600, hardness: 'extreme', processingDifficulty: 'extreme', minSmeltTier: 15 },
  { id: 'actinium', name: 'Actinium Ore', tier: 6, rarity: 'mythic', miningChance: 0.0004, smeltYield: 1, refineMultiplier: 3.0, refineCost: 200, value: 480, hardness: 'extreme', processingDifficulty: 'extreme', minSmeltTier: 15 },
  { id: 'protactinium', name: 'Protactinium Ore', tier: 6, rarity: 'mythic', miningChance: 0.0004, smeltYield: 1, refineMultiplier: 3.0, refineCost: 210, value: 500, hardness: 'extreme', processingDifficulty: 'extreme', minSmeltTier: 15 },
  { id: 'scandium', name: 'Scandium Ore', tier: 6, rarity: 'mythic', miningChance: 0.0003, smeltYield: 1, refineMultiplier: 2.8, refineCost: 180, value: 420, hardness: 'extreme', processingDifficulty: 'extreme', minSmeltTier: 15 },
  { id: 'yttrium', name: 'Yttrium Ore', tier: 6, rarity: 'mythic', miningChance: 0.0003, smeltYield: 1, refineMultiplier: 2.8, refineCost: 180, value: 420, hardness: 'extreme', processingDifficulty: 'extreme', minSmeltTier: 15 },
  { id: 'lanthanum', name: 'Lanthanum Ore', tier: 6, rarity: 'mythic', miningChance: 0.0003, smeltYield: 1, refineMultiplier: 2.8, refineCost: 180, value: 400, hardness: 'extreme', processingDifficulty: 'extreme', minSmeltTier: 15 },
  { id: 'cerium', name: 'Cerium Ore', tier: 6, rarity: 'mythic', miningChance: 0.0003, smeltYield: 1, refineMultiplier: 2.8, refineCost: 175, value: 380, hardness: 'extreme', processingDifficulty: 'extreme', minSmeltTier: 15 },
];

// ─── Exotic / Crystalix (Tier 7) ── 5 ores ──────────────────────────────────
const exoticOres: Ore[] = [
  { id: 'veinite', name: 'Veinite', tier: 7, rarity: 'exotic', miningChance: 0.0002, smeltYield: 1, refineMultiplier: 4.0, refineCost: 300, value: 800, hardness: 'extreme', processingDifficulty: 'extreme', minSmeltTier: 17 },
  { id: 'void_crystal', name: 'Void Crystal', tier: 7, rarity: 'exotic', miningChance: 0.00015, smeltYield: 1, refineMultiplier: 4.0, refineCost: 350, value: 1000, hardness: 'extreme', processingDifficulty: 'extreme', minSmeltTier: 17 },
  { id: 'dark_matter', name: 'Dark Matter Residue', tier: 7, rarity: 'exotic', miningChance: 0.0001, smeltYield: 1, refineMultiplier: 5.0, refineCost: 400, value: 1500, hardness: 'extreme', processingDifficulty: 'extreme', minSmeltTier: 17 },
  { id: 'entropy_shard', name: 'Entropy Shard', tier: 7, rarity: 'exotic', miningChance: 0.00008, smeltYield: 1, refineMultiplier: 5.0, refineCost: 450, value: 2000, hardness: 'extreme', processingDifficulty: 'extreme', minSmeltTier: 17 },
  { id: 'singularity', name: 'Singularity Core Fragment', tier: 7, rarity: 'exotic', miningChance: 0.00005, smeltYield: 1, refineMultiplier: 6.0, refineCost: 500, value: 3000, hardness: 'extreme', processingDifficulty: 'extreme', minSmeltTier: 17 },
];

// ─── Combined ────────────────────────────────────────────────────────────────
export const ALL_ORES: Ore[] = [
  ...commonOres,
  ...uncommonOres,
  ...rareOres,
  ...epicOres,
  ...legendaryOres,
  ...mythicOres,
  ...exoticOres,
];

export const ORE_MAP: Record<string, Ore> = {};
ALL_ORES.forEach(ore => { ORE_MAP[ore.id] = ore; });

// Special mining drops (not ores — returned separately)
export interface SpecialDrop {
  id: string;
  name: string;
  chance: number; // flat chance per mine tick
  rarity: OreRarity;
}

export const SPECIAL_MINING_DROPS: SpecialDrop[] = [
  { id: 'plant_in_a_boot', name: 'Plant In A Boot', chance: 0.001, rarity: 'artifact' },
  { id: 'seed_pack', name: 'Seed Pack', chance: 0.01, rarity: 'artifact' },
];

export function rollMiningDrop(luckMultiplier: number = 1): Ore | null {
  const shuffled = [...ALL_ORES].sort(() => Math.random() - 0.5);
  for (const ore of shuffled) {
    if (Math.random() < ore.miningChance * luckMultiplier) {
      return ore;
    }
  }
  // Fallback: return a random common ore
  const commons = ALL_ORES.filter(o => o.rarity === 'common');
  return commons[Math.floor(Math.random() * commons.length)];
}

export function rollSpecialDrops(): SpecialDrop[] {
  return SPECIAL_MINING_DROPS.filter(drop => Math.random() < drop.chance);
}

export const RARITY_ORDER: OreRarity[] = [
  'common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'exotic', 'artifact'
];

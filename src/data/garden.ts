// ─── Garden / Plant System ───────────────────────────────────────────────────
import type { OreRarity } from './ores';

export type PlantRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'crystalized';

export interface PlantDef {
  id: string;
  name: string;
  rarity: PlantRarity;
  growTimeMs: number; // base grow time in ms
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
  { rarity: 'common', chance: 0.45 },
  { rarity: 'uncommon', chance: 0.20 },
  { rarity: 'rare', chance: 0.15 },
  { rarity: 'epic', chance: 0.10 },
  { rarity: 'legendary', chance: 0.05 },
  { rarity: 'mythic', chance: 0.03 },
  { rarity: 'crystalized', chance: 0.02 },
];

// ─── Plant Definitions ──────────────────────────────────────────────────────
const BASE_GROW = 600000; // 10 minutes

export const ALL_PLANTS: PlantDef[] = [
  // 🌿 Common (45%)
  { id: 'dandelion', name: 'Dandelion', rarity: 'common', growTimeMs: BASE_GROW, passiveIncomePerTick: 1, harvestBonus: 15, seedReturnBase: 1, emoji: '🌼' },
  { id: 'wheat_grass', name: 'Wheat Grass', rarity: 'common', growTimeMs: BASE_GROW, passiveIncomePerTick: 1, harvestBonus: 12, seedReturnBase: 1, emoji: '🌾' },
  { id: 'clover', name: 'Lucky Clover', rarity: 'common', growTimeMs: BASE_GROW, passiveIncomePerTick: 1, harvestBonus: 18, seedReturnBase: 1, emoji: '🍀' },
  { id: 'moss_patch', name: 'Moss Patch', rarity: 'common', growTimeMs: BASE_GROW, passiveIncomePerTick: 1, harvestBonus: 10, seedReturnBase: 1, emoji: '🌿' },
  { id: 'fern', name: 'Cave Fern', rarity: 'common', growTimeMs: BASE_GROW, passiveIncomePerTick: 2, harvestBonus: 14, seedReturnBase: 1, emoji: '🌱' },
  { id: 'dustroot', name: 'Dustroot', rarity: 'common', growTimeMs: BASE_GROW, passiveIncomePerTick: 1, harvestBonus: 12, seedReturnBase: 1, emoji: '🥔' },
  { id: 'pale_moss', name: 'Pale Moss', rarity: 'common', growTimeMs: BASE_GROW, passiveIncomePerTick: 1, harvestBonus: 11, seedReturnBase: 1, emoji: '☁️' },
  { id: 'ironweed', name: 'Ironweed', rarity: 'common', growTimeMs: BASE_GROW, passiveIncomePerTick: 2, harvestBonus: 16, seedReturnBase: 1, emoji: '🔗' },
  { id: 'soft_vein_fern', name: 'Soft Vein Fern', rarity: 'common', growTimeMs: BASE_GROW, passiveIncomePerTick: 2, harvestBonus: 15, seedReturnBase: 1, emoji: '🎋' },
  { id: 'ash_bloom', name: 'Ash Bloom', rarity: 'common', growTimeMs: BASE_GROW, passiveIncomePerTick: 1, harvestBonus: 14, seedReturnBase: 1, emoji: '💨' },
  { id: 'crater_grass', name: 'Crater Grass', rarity: 'common', growTimeMs: BASE_GROW, passiveIncomePerTick: 1, harvestBonus: 13, seedReturnBase: 1, emoji: '🌑' },
  { id: 'hollow_stem', name: 'Hollow Stem', rarity: 'common', growTimeMs: BASE_GROW, passiveIncomePerTick: 1, harvestBonus: 12, seedReturnBase: 1, emoji: '🛶' },
  { id: 'grey_thistle', name: 'Grey Thistle', rarity: 'common', growTimeMs: BASE_GROW, passiveIncomePerTick: 2, harvestBonus: 17, seedReturnBase: 1, emoji: '🥀' },
  { id: 'dryspine_bush', name: 'Dryspine Bush', rarity: 'common', growTimeMs: BASE_GROW, passiveIncomePerTick: 1, harvestBonus: 14, seedReturnBase: 1, emoji: '🌵' },
  { id: 'coldcap_fungus', name: 'Coldcap Fungus', rarity: 'common', growTimeMs: BASE_GROW, passiveIncomePerTick: 2, harvestBonus: 16, seedReturnBase: 1, emoji: '🧊' },
  { id: 'rift_clover', name: 'Rift Clover', rarity: 'common', growTimeMs: BASE_GROW, passiveIncomePerTick: 2, harvestBonus: 18, seedReturnBase: 1, emoji: '💠' },
  { id: 'stonepetal', name: 'Stonepetal', rarity: 'common', growTimeMs: BASE_GROW, passiveIncomePerTick: 1, harvestBonus: 15, seedReturnBase: 1, emoji: '🪨' },
  { id: 'murk_vine', name: 'Murk Vine', rarity: 'common', growTimeMs: BASE_GROW, passiveIncomePerTick: 2, harvestBonus: 16, seedReturnBase: 1, emoji: '🌫️' },
  { id: 'lowlight_shrub', name: 'Lowlight Shrub', rarity: 'common', growTimeMs: BASE_GROW, passiveIncomePerTick: 2, harvestBonus: 15, seedReturnBase: 1, emoji: '💡' },
  { id: 'cracked_reed', name: 'Cracked Reed', rarity: 'common', growTimeMs: BASE_GROW, passiveIncomePerTick: 1, harvestBonus: 12, seedReturnBase: 1, emoji: '🥢' },
  { id: 'dull_ivy', name: 'Dull Ivy', rarity: 'common', growTimeMs: BASE_GROW, passiveIncomePerTick: 1, harvestBonus: 11, seedReturnBase: 1, emoji: '🎢' },
  { id: 'frostgrass', name: 'Frostgrass', rarity: 'common', growTimeMs: BASE_GROW, passiveIncomePerTick: 2, harvestBonus: 16, seedReturnBase: 1, emoji: '❄️' },
  { id: 'blight_leaf', name: 'Blight Leaf', rarity: 'common', growTimeMs: BASE_GROW, passiveIncomePerTick: 1, harvestBonus: 14, seedReturnBase: 1, emoji: '🍂' },
  { id: 'thinroot_cluster', name: 'Thinroot Cluster', rarity: 'common', growTimeMs: BASE_GROW, passiveIncomePerTick: 1, harvestBonus: 13, seedReturnBase: 1, emoji: '🕸️' },
  { id: 'emberweed', name: 'Emberweed', rarity: 'common', growTimeMs: BASE_GROW, passiveIncomePerTick: 2, harvestBonus: 17, seedReturnBase: 1, emoji: '🔥' },

  // 🍀 Uncommon (20%)
  { id: 'glowshroom', name: 'Glowshroom', rarity: 'uncommon', growTimeMs: BASE_GROW, passiveIncomePerTick: 3, harvestBonus: 35, seedReturnBase: 1, emoji: '🍄' },
  { id: 'crystal_tulip', name: 'Crystal Tulip', rarity: 'uncommon', growTimeMs: BASE_GROW, passiveIncomePerTick: 4, harvestBonus: 40, seedReturnBase: 1, emoji: '🌷' },
  { id: 'iron_vine', name: 'Iron Vine', rarity: 'uncommon', growTimeMs: BASE_GROW, passiveIncomePerTick: 3, harvestBonus: 38, seedReturnBase: 1, emoji: '🌻' },
  { id: 'dust_bloom', name: 'Dust Bloom', rarity: 'uncommon', growTimeMs: BASE_GROW, passiveIncomePerTick: 4, harvestBonus: 42, seedReturnBase: 1, emoji: '💐' },
  { id: 'veinbloom', name: 'Veinbloom', rarity: 'uncommon', growTimeMs: BASE_GROW, passiveIncomePerTick: 4, harvestBonus: 45, seedReturnBase: 1, emoji: '🩸' },
  { id: 'glowcap_fungus', name: 'Glowcap Fungus', rarity: 'uncommon', growTimeMs: BASE_GROW, passiveIncomePerTick: 5, harvestBonus: 48, seedReturnBase: 1, emoji: '🔦' },
  { id: 'redspike_thistle', name: 'Redspike Thistle', rarity: 'uncommon', growTimeMs: BASE_GROW, passiveIncomePerTick: 4, harvestBonus: 44, seedReturnBase: 1, emoji: '📍' },
  { id: 'pulse_fern', name: 'Pulse Fern', rarity: 'uncommon', growTimeMs: BASE_GROW, passiveIncomePerTick: 5, harvestBonus: 50, seedReturnBase: 1, emoji: '💓' },
  { id: 'crystal_reed', name: 'Crystal Reed', rarity: 'uncommon', growTimeMs: BASE_GROW, passiveIncomePerTick: 6, harvestBonus: 55, seedReturnBase: 1, emoji: '💎' },
  { id: 'ironbark_sapling', name: 'Ironbark Sapling', rarity: 'uncommon', growTimeMs: BASE_GROW, passiveIncomePerTick: 5, harvestBonus: 52, seedReturnBase: 1, emoji: '🌲' },
  { id: 'static_ivy', name: 'Static Ivy', rarity: 'uncommon', growTimeMs: BASE_GROW, passiveIncomePerTick: 6, harvestBonus: 58, seedReturnBase: 1, emoji: '⚡' },
  { id: 'heatroot', name: 'Heatroot', rarity: 'uncommon', growTimeMs: BASE_GROW, passiveIncomePerTick: 5, harvestBonus: 54, seedReturnBase: 1, emoji: '🌡️' },
  { id: 'bluecap_mushroom', name: 'Bluecap Mushroom', rarity: 'uncommon', growTimeMs: BASE_GROW, passiveIncomePerTick: 4, harvestBonus: 48, seedReturnBase: 1, emoji: '🔵' },
  { id: 'thorncoil_vine', name: 'Thorncoil Vine', rarity: 'uncommon', growTimeMs: BASE_GROW, passiveIncomePerTick: 5, harvestBonus: 56, seedReturnBase: 1, emoji: '➰' },
  { id: 'bloodleaf_shrub', name: 'Bloodleaf Shrub', rarity: 'uncommon', growTimeMs: BASE_GROW, passiveIncomePerTick: 6, harvestBonus: 60, seedReturnBase: 1, emoji: '💉' },
  { id: 'lumigrass', name: 'Lumigrass', rarity: 'uncommon', growTimeMs: BASE_GROW, passiveIncomePerTick: 5, harvestBonus: 52, seedReturnBase: 1, emoji: '✨' },
  { id: 'vapor_petal', name: 'Vapor Petal', rarity: 'uncommon', growTimeMs: BASE_GROW, passiveIncomePerTick: 4, harvestBonus: 46, seedReturnBase: 1, emoji: '🌫️' },
  { id: 'coilstem_plant', name: 'Coilstem Plant', rarity: 'uncommon', growTimeMs: BASE_GROW, passiveIncomePerTick: 5, harvestBonus: 54, seedReturnBase: 1, emoji: '🌀' },
  { id: 'shockbud', name: 'Shockbud', rarity: 'uncommon', growTimeMs: BASE_GROW, passiveIncomePerTick: 7, harvestBonus: 65, seedReturnBase: 1, emoji: '💥' },
  { id: 'silver_moss', name: 'Silver Moss', rarity: 'uncommon', growTimeMs: BASE_GROW, passiveIncomePerTick: 5, harvestBonus: 52, seedReturnBase: 1, emoji: '🔘' },
  { id: 'echo_bloom', name: 'Echo Bloom', rarity: 'uncommon', growTimeMs: BASE_GROW, passiveIncomePerTick: 6, harvestBonus: 58, seedReturnBase: 1, emoji: '📣' },
  { id: 'frostvine', name: 'Frostvine', rarity: 'uncommon', growTimeMs: BASE_GROW, passiveIncomePerTick: 5, harvestBonus: 54, seedReturnBase: 1, emoji: '🧣' },
  { id: 'acidcap_fungus', name: 'Acidcap Fungus', rarity: 'uncommon', growTimeMs: BASE_GROW, passiveIncomePerTick: 7, harvestBonus: 66, seedReturnBase: 1, emoji: '🧪' },
  { id: 'duskwort', name: 'Duskwort', rarity: 'uncommon', growTimeMs: BASE_GROW, passiveIncomePerTick: 5, harvestBonus: 52, seedReturnBase: 1, emoji: '🕶️' },

  // 🔷 Rare (15%)
  { id: 'ember_rose', name: 'Ember Rose', rarity: 'rare', growTimeMs: BASE_GROW, passiveIncomePerTick: 8, harvestBonus: 90, seedReturnBase: 1, emoji: '🌹' },
  { id: 'frost_lily', name: 'Frost Lily', rarity: 'rare', growTimeMs: BASE_GROW, passiveIncomePerTick: 9, harvestBonus: 100, seedReturnBase: 1, emoji: '❄️' },
  { id: 'shadow_fern', name: 'Shadow Fern', rarity: 'rare', growTimeMs: BASE_GROW, passiveIncomePerTick: 7, harvestBonus: 85, seedReturnBase: 1, emoji: '🌑' },
  { id: 'moonlight_blossom', name: 'Moonlight Blossom', rarity: 'rare', growTimeMs: BASE_GROW, passiveIncomePerTick: 10, harvestBonus: 110, seedReturnBase: 1, emoji: '🌙' },
  { id: 'sunfire_cactus', name: 'Sunfire Cactus', rarity: 'rare', growTimeMs: BASE_GROW, passiveIncomePerTick: 11, harvestBonus: 120, seedReturnBase: 1, emoji: '☀️' },

  // 🟣 Epic (10%)
  { id: 'void_orchid', name: 'Void Orchid', rarity: 'epic', growTimeMs: BASE_GROW, passiveIncomePerTick: 18, harvestBonus: 250, seedReturnBase: 1, emoji: '🪻' },
  { id: 'plasma_blossom', name: 'Plasma Blossom', rarity: 'epic', growTimeMs: BASE_GROW, passiveIncomePerTick: 20, harvestBonus: 280, seedReturnBase: 1, emoji: '⚡' },
  { id: 'veinite_bloom', name: 'Veinite Bloom', rarity: 'epic', growTimeMs: BASE_GROW, passiveIncomePerTick: 22, harvestBonus: 300, seedReturnBase: 1, emoji: '🎆' },
  { id: 'bloodthorn_flower', name: 'Bloodthorn Flower', rarity: 'epic', growTimeMs: BASE_GROW, passiveIncomePerTick: 24, harvestBonus: 320, seedReturnBase: 1, emoji: '🥀' },
  { id: 'neon_pulse_orchid', name: 'Neon Pulse Orchid', rarity: 'epic', growTimeMs: BASE_GROW, passiveIncomePerTick: 26, harvestBonus: 350, seedReturnBase: 1, emoji: '🔮' },
  { id: 'cryostem_lotus', name: 'Cryostem Lotus', rarity: 'epic', growTimeMs: BASE_GROW, passiveIncomePerTick: 28, harvestBonus: 380, seedReturnBase: 1, emoji: '❄️' },
  { id: 'obsidian_petal', name: 'Obsidian Petal', rarity: 'epic', growTimeMs: BASE_GROW, passiveIncomePerTick: 25, harvestBonus: 340, seedReturnBase: 1, emoji: '🌑' },
  { id: 'radiant_veinflower', name: 'Radiant Veinflower', rarity: 'epic', growTimeMs: BASE_GROW, passiveIncomePerTick: 30, harvestBonus: 400, seedReturnBase: 1, emoji: '🌟' },
  { id: 'parasite_bloom', name: 'Parasite Bloom', rarity: 'epic', growTimeMs: BASE_GROW, passiveIncomePerTick: 32, harvestBonus: 420, seedReturnBase: 1, emoji: '🕷️' },
  { id: 'volt_fern', name: 'Volt Fern', rarity: 'epic', growTimeMs: BASE_GROW, passiveIncomePerTick: 35, harvestBonus: 460, seedReturnBase: 1, emoji: '🔋' },
  { id: 'shard_blossom', name: 'Shard Blossom', rarity: 'epic', growTimeMs: BASE_GROW, passiveIncomePerTick: 28, harvestBonus: 380, seedReturnBase: 1, emoji: '💎' },
  { id: 'plasma_root', name: 'Plasma Root', rarity: 'epic', growTimeMs: BASE_GROW, passiveIncomePerTick: 32, harvestBonus: 440, seedReturnBase: 1, emoji: '🌀' },
  { id: 'nightflare_petal', name: 'Nightflare Petal', rarity: 'epic', growTimeMs: BASE_GROW, passiveIncomePerTick: 34, harvestBonus: 480, seedReturnBase: 1, emoji: '🌋' },
  { id: 'venom_bloom', name: 'Venom Bloom', rarity: 'epic', growTimeMs: BASE_GROW, passiveIncomePerTick: 36, harvestBonus: 500, seedReturnBase: 1, emoji: '🐍' },
  { id: 'spectral_ivy', name: 'Spectral Ivy', rarity: 'epic', growTimeMs: BASE_GROW, passiveIncomePerTick: 30, harvestBonus: 420, seedReturnBase: 1, emoji: '👻' },
  { id: 'ember_lotus', name: 'Ember Lotus', rarity: 'epic', growTimeMs: BASE_GROW, passiveIncomePerTick: 33, harvestBonus: 460, seedReturnBase: 1, emoji: '🔥' },
  { id: 'rift_orchid', name: 'Rift Orchid', rarity: 'epic', growTimeMs: BASE_GROW, passiveIncomePerTick: 38, harvestBonus: 550, seedReturnBase: 1, emoji: '🌌' },
  { id: 'stormvine', name: 'Stormvine', rarity: 'epic', growTimeMs: BASE_GROW, passiveIncomePerTick: 35, harvestBonus: 520, seedReturnBase: 1, emoji: '⛈️' },
  { id: 'fracture_bloom', name: 'Fracture Bloom', rarity: 'epic', growTimeMs: BASE_GROW, passiveIncomePerTick: 30, harvestBonus: 440, seedReturnBase: 1, emoji: '💢' },
  { id: 'hollow_petal_cluster', name: 'Hollow Petal Cluster', rarity: 'epic', growTimeMs: BASE_GROW, passiveIncomePerTick: 32, harvestBonus: 460, seedReturnBase: 1, emoji: '🐚' },
  { id: 'ion_flower', name: 'Ion Flower', rarity: 'epic', growTimeMs: BASE_GROW, passiveIncomePerTick: 40, harvestBonus: 600, seedReturnBase: 1, emoji: '⚛️' },
  { id: 'lumen_thistle', name: 'Lumen Thistle', rarity: 'epic', growTimeMs: BASE_GROW, passiveIncomePerTick: 35, harvestBonus: 520, seedReturnBase: 1, emoji: '🔆' },

  // ✨ Legendary (5%)
  { id: 'singularity_bloom', name: 'Singularity Bloom', rarity: 'legendary', growTimeMs: BASE_GROW, passiveIncomePerTick: 50, harvestBonus: 800, seedReturnBase: 1, emoji: '✨' },
  { id: 'titan_vein_tree', name: 'Titan Vein Tree', rarity: 'legendary', growTimeMs: BASE_GROW, passiveIncomePerTick: 65, harvestBonus: 1100, seedReturnBase: 1, emoji: '🌳' },
  { id: 'heartroot_core', name: 'Heartroot Core', rarity: 'legendary', growTimeMs: BASE_GROW, passiveIncomePerTick: 70, harvestBonus: 1250, seedReturnBase: 1, emoji: '❤️' },
  { id: 'wardens_bloom', name: 'Warden\'s Bloom', rarity: 'legendary', growTimeMs: BASE_GROW, passiveIncomePerTick: 75, harvestBonus: 1300, seedReturnBase: 1, emoji: '🛡️' },
  { id: 'black_petal_crown', name: 'Black Petal Crown', rarity: 'legendary', growTimeMs: BASE_GROW, passiveIncomePerTick: 80, harvestBonus: 1400, seedReturnBase: 1, emoji: '👑' },
  { id: 'living_veinite_tree', name: 'Living Veinite Tree', rarity: 'legendary', growTimeMs: BASE_GROW, passiveIncomePerTick: 85, harvestBonus: 1500, seedReturnBase: 1, emoji: '🎋' },
  { id: 'soulvine_cluster', name: 'Soulvine Cluster', rarity: 'legendary', growTimeMs: BASE_GROW, passiveIncomePerTick: 90, harvestBonus: 1600, seedReturnBase: 1, emoji: '🔮' },
  { id: 'crimson_halo_flower', name: 'Crimson Halo Flower', rarity: 'legendary', growTimeMs: BASE_GROW, passiveIncomePerTick: 95, harvestBonus: 1700, seedReturnBase: 1, emoji: '⭕' },
  { id: 'oblivion_lotus', name: 'Oblivion Lotus', rarity: 'legendary', growTimeMs: BASE_GROW, passiveIncomePerTick: 100, harvestBonus: 1800, seedReturnBase: 1, emoji: '🌑' },
  { id: 'neural_blossom', name: 'Neural Blossom', rarity: 'legendary', growTimeMs: BASE_GROW, passiveIncomePerTick: 110, harvestBonus: 2000, seedReturnBase: 1, emoji: '🧠' },
  { id: 'stormheart_tree', name: 'Stormheart Tree', rarity: 'legendary', growTimeMs: BASE_GROW, passiveIncomePerTick: 115, harvestBonus: 2100, seedReturnBase: 1, emoji: '⛈️' },
  { id: 'abyssal_bloom', name: 'Abyssal Bloom', rarity: 'legendary', growTimeMs: BASE_GROW, passiveIncomePerTick: 120, harvestBonus: 2200, seedReturnBase: 1, emoji: '🌊' },
  { id: 'voidroot_spire', name: 'Voidroot Spire', rarity: 'legendary', growTimeMs: BASE_GROW, passiveIncomePerTick: 125, harvestBonus: 2300, seedReturnBase: 1, emoji: '🗼' },
  { id: 'crowned_thorns', name: 'Crowned Thorns', rarity: 'legendary', growTimeMs: BASE_GROW, passiveIncomePerTick: 130, harvestBonus: 2400, seedReturnBase: 1, emoji: '🤴' },
  { id: 'echoheart_vine', name: 'Echoheart Vine', rarity: 'legendary', growTimeMs: BASE_GROW, passiveIncomePerTick: 135, harvestBonus: 2500, seedReturnBase: 1, emoji: '💓' },
  { id: 'blood_sunflower', name: 'Blood Sunflower', rarity: 'legendary', growTimeMs: BASE_GROW, passiveIncomePerTick: 140, harvestBonus: 2600, seedReturnBase: 1, emoji: '🌻' },
  { id: 'phantom_bloom_tree', name: 'Phantom Bloom Tree', rarity: 'legendary', growTimeMs: BASE_GROW, passiveIncomePerTick: 150, harvestBonus: 2800, seedReturnBase: 1, emoji: '👻' },
  { id: 'radiant_core_plant', name: 'Radiant Core Plant', rarity: 'legendary', growTimeMs: BASE_GROW, passiveIncomePerTick: 160, harvestBonus: 3000, seedReturnBase: 1, emoji: '🔆' },
  { id: 'dread_petal_mass', name: 'Dread Petal Mass', rarity: 'legendary', growTimeMs: BASE_GROW, passiveIncomePerTick: 170, harvestBonus: 3200, seedReturnBase: 1, emoji: '🥀' },
  { id: 'celestial_thorn', name: 'Celestial Thorn', rarity: 'legendary', growTimeMs: BASE_GROW, passiveIncomePerTick: 180, harvestBonus: 3500, seedReturnBase: 1, emoji: '🌌' },
  { id: 'gravity_bloom', name: 'Gravity Bloom', rarity: 'legendary', growTimeMs: BASE_GROW, passiveIncomePerTick: 200, harvestBonus: 4000, seedReturnBase: 1, emoji: '🕳️' },

  // 🔮 Mythic (3%)
  { id: 'worldroot_entity', name: 'Worldroot Entity', rarity: 'mythic', growTimeMs: BASE_GROW, passiveIncomePerTick: 300, harvestBonus: 6000, seedReturnBase: 1, emoji: '🌍' },
  { id: 'veinite_godflower', name: 'Veinite Godflower', rarity: 'mythic', growTimeMs: BASE_GROW, passiveIncomePerTick: 350, harvestBonus: 7000, seedReturnBase: 1, emoji: '⛩️' },
  { id: 'living_hive_bloom', name: 'Living Hive Bloom', rarity: 'mythic', growTimeMs: BASE_GROW, passiveIncomePerTick: 400, harvestBonus: 8000, seedReturnBase: 1, emoji: '🐝' },
  { id: 'timepetal_orchid', name: 'Timepetal Orchid', rarity: 'mythic', growTimeMs: BASE_GROW, passiveIncomePerTick: 450, harvestBonus: 9000, seedReturnBase: 1, emoji: '⏳' },
  { id: 'singularity_vine', name: 'Singularity Vine', rarity: 'mythic', growTimeMs: BASE_GROW, passiveIncomePerTick: 500, harvestBonus: 10000, seedReturnBase: 1, emoji: '🌀' },
  { id: 'reality_blossom', name: 'Reality Blossom', rarity: 'mythic', growTimeMs: BASE_GROW, passiveIncomePerTick: 550, harvestBonus: 11000, seedReturnBase: 1, emoji: '🌠' },
  { id: 'fleshgarden_core', name: 'Fleshgarden Core', rarity: 'mythic', growTimeMs: BASE_GROW, passiveIncomePerTick: 600, harvestBonus: 12000, seedReturnBase: 1, emoji: '🥩' },
  { id: 'voidmind_flower', name: 'Voidmind Flower', rarity: 'mythic', growTimeMs: BASE_GROW, passiveIncomePerTick: 650, harvestBonus: 13000, seedReturnBase: 1, emoji: '🧠' },
  { id: 'titans_heart_bloom', name: 'Titan\'s Heart Bloom', rarity: 'mythic', growTimeMs: BASE_GROW, passiveIncomePerTick: 700, harvestBonus: 14000, seedReturnBase: 1, emoji: '💓' },
  { id: 'infinite_stem', name: 'Infinite Stem', rarity: 'mythic', growTimeMs: BASE_GROW, passiveIncomePerTick: 750, harvestBonus: 15000, seedReturnBase: 1, emoji: '♾️' },
  { id: 'parasite_queen_bloom', name: 'Parasite Queen Bloom', rarity: 'mythic', growTimeMs: BASE_GROW, passiveIncomePerTick: 800, harvestBonus: 16000, seedReturnBase: 1, emoji: '🕷️' },
  { id: 'astral_vein_tree', name: 'Astral Vein Tree', rarity: 'mythic', growTimeMs: BASE_GROW, passiveIncomePerTick: 850, harvestBonus: 17000, seedReturnBase: 1, emoji: '🔭' },
  { id: 'dimensional_lotus', name: 'Dimensional Lotus', rarity: 'mythic', growTimeMs: BASE_GROW, passiveIncomePerTick: 900, harvestBonus: 18000, seedReturnBase: 1, emoji: '🚪' },
  { id: 'mindbreaker_ivy', name: 'Mindbreaker Ivy', rarity: 'mythic', growTimeMs: BASE_GROW, passiveIncomePerTick: 950, harvestBonus: 19000, seedReturnBase: 1, emoji: '🧩' },
  { id: 'black_sun_root', name: 'Black Sun Root', rarity: 'mythic', growTimeMs: BASE_GROW, passiveIncomePerTick: 1000, harvestBonus: 20000, seedReturnBase: 1, emoji: '☀️' },
  { id: 'orbital_bloom', name: 'Orbital Bloom', rarity: 'mythic', growTimeMs: BASE_GROW, passiveIncomePerTick: 1100, harvestBonus: 22000, seedReturnBase: 1, emoji: '🛰️' },
  { id: 'neural_nexus_plant', name: 'Neural Nexus Plant', rarity: 'mythic', growTimeMs: BASE_GROW, passiveIncomePerTick: 1200, harvestBonus: 25000, seedReturnBase: 1, emoji: '💻' },
  { id: 'chaos_petal_core', name: 'Chaos Petal Core', rarity: 'mythic', growTimeMs: BASE_GROW, passiveIncomePerTick: 1300, harvestBonus: 28000, seedReturnBase: 1, emoji: '🧨' },
  { id: 'eternal_bloom', name: 'Eternal Bloom', rarity: 'mythic', growTimeMs: BASE_GROW, passiveIncomePerTick: 1400, harvestBonus: 30000, seedReturnBase: 1, emoji: '♾️' },
  { id: 'wardens_garden', name: 'Warden\'s Garden', rarity: 'mythic', growTimeMs: BASE_GROW, passiveIncomePerTick: 1500, harvestBonus: 35000, seedReturnBase: 1, emoji: '🏛️' },

  // 💎 Crystalized (2%)
  { id: 'crystal_bloom', name: 'Crystal Bloom', rarity: 'crystalized', growTimeMs: BASE_GROW, passiveIncomePerTick: 2000, harvestBonus: 50000, seedReturnBase: 1, emoji: '💎' },
  { id: 'veinite_crystal_flower', name: 'Veinite Crystal Flower', rarity: 'crystalized', growTimeMs: BASE_GROW, passiveIncomePerTick: 2200, harvestBonus: 55000, seedReturnBase: 1, emoji: '🔮' },
  { id: 'shardroot_cluster', name: 'Shardroot Cluster', rarity: 'crystalized', growTimeMs: BASE_GROW, passiveIncomePerTick: 2400, harvestBonus: 60000, seedReturnBase: 1, emoji: '🧊' },
  { id: 'prism_petal', name: 'Prism Petal', rarity: 'crystalized', growTimeMs: BASE_GROW, passiveIncomePerTick: 2600, harvestBonus: 65000, seedReturnBase: 1, emoji: '🌈' },
  { id: 'glassvine', name: 'Glassvine', rarity: 'crystalized', growTimeMs: BASE_GROW, passiveIncomePerTick: 2800, harvestBonus: 70000, seedReturnBase: 1, emoji: '🍷' },
  { id: 'diamond_thorn_plant', name: 'Diamond Thorn Plant', rarity: 'crystalized', growTimeMs: BASE_GROW, passiveIncomePerTick: 3000, harvestBonus: 75000, seedReturnBase: 1, emoji: '💍' },
  { id: 'lattice_bloom', name: 'Lattice Bloom', rarity: 'crystalized', growTimeMs: BASE_GROW, passiveIncomePerTick: 3200, harvestBonus: 80000, seedReturnBase: 1, emoji: '🕸️' },
  { id: 'crystal_lotus', name: 'Crystal Lotus', rarity: 'crystalized', growTimeMs: BASE_GROW, passiveIncomePerTick: 3400, harvestBonus: 85000, seedReturnBase: 1, emoji: '❄️' },
  { id: 'fractured_orchid', name: 'Fractured Orchid', rarity: 'crystalized', growTimeMs: BASE_GROW, passiveIncomePerTick: 3600, harvestBonus: 90000, seedReturnBase: 1, emoji: '💢' },
  { id: 'gemstem_plant', name: 'Gemstem Plant', rarity: 'crystalized', growTimeMs: BASE_GROW, passiveIncomePerTick: 3800, harvestBonus: 95000, seedReturnBase: 1, emoji: '🎁' },
  { id: 'radiant_crystal_tree', name: 'Radiant Crystal Tree', rarity: 'crystalized', growTimeMs: BASE_GROW, passiveIncomePerTick: 4000, harvestBonus: 100000, seedReturnBase: 1, emoji: '🌟' },
  { id: 'prismheart_bloom', name: 'Prismheart Bloom', rarity: 'crystalized', growTimeMs: BASE_GROW, passiveIncomePerTick: 4500, harvestBonus: 110000, seedReturnBase: 1, emoji: '💖' },
  { id: 'frozen_crystal_vine', name: 'Frozen Crystal Vine', rarity: 'crystalized', growTimeMs: BASE_GROW, passiveIncomePerTick: 5000, harvestBonus: 120000, seedReturnBase: 1, emoji: '🥶' },
  { id: 'lightshard_flower', name: 'Lightshard Flower', rarity: 'crystalized', growTimeMs: BASE_GROW, passiveIncomePerTick: 5500, harvestBonus: 130000, seedReturnBase: 1, emoji: '🏮' },
  { id: 'reflective_petal_cluster', name: 'Reflective Petal Cluster', rarity: 'crystalized', growTimeMs: BASE_GROW, passiveIncomePerTick: 6000, harvestBonus: 140000, seedReturnBase: 1, emoji: '🪞' },
  { id: 'crystalline_halo_bloom', name: 'Crystalline Halo Bloom', rarity: 'crystalized', growTimeMs: BASE_GROW, passiveIncomePerTick: 6500, harvestBonus: 150000, seedReturnBase: 1, emoji: '😇' },
  { id: 'spectrum_lotus', name: 'Spectrum Lotus', rarity: 'crystalized', growTimeMs: BASE_GROW, passiveIncomePerTick: 7000, harvestBonus: 160000, seedReturnBase: 1, emoji: '🚥' },
  { id: 'shardstorm_plant', name: 'Shardstorm Plant', rarity: 'crystalized', growTimeMs: BASE_GROW, passiveIncomePerTick: 8000, harvestBonus: 180000, seedReturnBase: 1, emoji: '🌪️' },
  { id: 'facet_bloom', name: 'Facet Bloom', rarity: 'crystalized', growTimeMs: BASE_GROW, passiveIncomePerTick: 9000, harvestBonus: 200000, seedReturnBase: 1, emoji: '🃏' },
  { id: 'hypercrystal_core_plant', name: 'Hypercrystal Core Plant', rarity: 'crystalized', growTimeMs: BASE_GROW, passiveIncomePerTick: 10000, harvestBonus: 250000, seedReturnBase: 1, emoji: '💠' },
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
  mythic: 'text-pink-400',
  crystalized: 'text-cyan-400',
};

export const PLANT_RARITY_BORDER: Record<PlantRarity, string> = {
  common: 'border-muted-foreground/30',
  uncommon: 'border-green-400/30',
  rare: 'border-blue-400/30',
  epic: 'border-purple-400/30',
  legendary: 'border-amber-400/30',
  mythic: 'border-pink-400/30',
  crystalized: 'border-cyan-400/30',
};

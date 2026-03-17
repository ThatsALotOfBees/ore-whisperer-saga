export type OreRarity = 'common' | 'uncommon' | 'rare' | 'exotic' | 'void' | 'radioactive';

export interface Ore {
  id: string;
  name: string;
  rarity: OreRarity;
  miningChance: number;
  smeltYield: number;
  refineMultiplier: number;
  refineCost: number;
  value: number;
}

const baseOres: Ore[] = [
  { id: 'iron', name: 'Iron', rarity: 'common', miningChance: 0.25, smeltYield: 2, refineMultiplier: 1.5, refineCost: 5, value: 3 },
  { id: 'copper', name: 'Copper', rarity: 'common', miningChance: 0.22, smeltYield: 2, refineMultiplier: 1.5, refineCost: 5, value: 4 },
  { id: 'tin', name: 'Tin', rarity: 'common', miningChance: 0.20, smeltYield: 2, refineMultiplier: 1.4, refineCost: 6, value: 4 },
  { id: 'lead', name: 'Lead', rarity: 'common', miningChance: 0.18, smeltYield: 2, refineMultiplier: 1.4, refineCost: 5, value: 3 },
  { id: 'silicon', name: 'Silicon', rarity: 'common', miningChance: 0.16, smeltYield: 1, refineMultiplier: 1.6, refineCost: 8, value: 6 },
  { id: 'aluminum', name: 'Aluminum', rarity: 'common', miningChance: 0.15, smeltYield: 2, refineMultiplier: 1.5, refineCost: 7, value: 5 },
  { id: 'silver', name: 'Silver', rarity: 'uncommon', miningChance: 0.08, smeltYield: 1, refineMultiplier: 1.8, refineCost: 15, value: 15 },
  { id: 'gold', name: 'Gold', rarity: 'rare', miningChance: 0.03, smeltYield: 1, refineMultiplier: 2.0, refineCost: 30, value: 40 },
  { id: 'platinum', name: 'Platinum', rarity: 'rare', miningChance: 0.02, smeltYield: 1, refineMultiplier: 2.0, refineCost: 50, value: 60 },
  { id: 'titanium', name: 'Titanium', rarity: 'uncommon', miningChance: 0.06, smeltYield: 1, refineMultiplier: 1.7, refineCost: 20, value: 20 },
];

const rareEarthNames = [
  'Neodymium', 'Terbium', 'Dysprosium', 'Cerium', 'Lanthanum',
  'Praseodymium', 'Samarium', 'Europium', 'Gadolinium', 'Holmium',
  'Erbium', 'Thulium', 'Ytterbium', 'Lutetium', 'Yttrium',
  'Scandium', 'Promethium', 'Hafnium', 'Tantalum', 'Niobium',
];

const radioactiveNames = [
  'Uranium', 'Thorium', 'Plutonium', 'Radium', 'Polonium',
  'Americium', 'Curium', 'Berkelium', 'Californium', 'Einsteinium',
];

const voidPrefixes = [
  'Aetheric', 'Void', 'Null', 'Phantom', 'Shadow', 'Abyssal', 'Eldritch',
  'Spectral', 'Nether', 'Obsidian', 'Crimson', 'Frozen', 'Solar', 'Lunar',
];
const voidSuffixes = [
  'Chalcocite', 'Garnet', 'Onyx', 'Beryl', 'Quartz', 'Topaz', 'Opal',
  'Jade', 'Spinel', 'Zircon', 'Pyrite', 'Galena', 'Sphalerite', 'Magnetite',
  'Hematite', 'Bauxite', 'Cinnabar', 'Malachite', 'Azurite', 'Cassiterite',
];

const rareEarths: Ore[] = rareEarthNames.map((name, i) => ({
  id: name.toLowerCase(),
  name,
  rarity: 'exotic' as OreRarity,
  miningChance: 0.015 - (i * 0.0005),
  smeltYield: 1,
  refineMultiplier: 2.2,
  refineCost: 40 + i * 5,
  value: 50 + i * 10,
}));

const radioactives: Ore[] = radioactiveNames.map((name, i) => ({
  id: name.toLowerCase(),
  name,
  rarity: 'radioactive' as OreRarity,
  miningChance: 0.008 - (i * 0.0005),
  smeltYield: 1,
  refineMultiplier: 2.5,
  refineCost: 80 + i * 15,
  value: 100 + i * 20,
}));

const voidOres: Ore[] = [];
let voidIndex = 0;
for (const prefix of voidPrefixes) {
  for (const suffix of voidSuffixes) {
    if (voidIndex >= 70) break;
    voidOres.push({
      id: `${prefix.toLowerCase()}_${suffix.toLowerCase()}`,
      name: `${prefix}-${suffix}`,
      rarity: 'void',
      miningChance: 0.005 - (voidIndex * 0.00003),
      smeltYield: 1,
      refineMultiplier: 3.0,
      refineCost: 100 + voidIndex * 8,
      value: 150 + voidIndex * 15,
    });
    voidIndex++;
  }
  if (voidIndex >= 70) break;
}

export const ALL_ORES: Ore[] = [...baseOres, ...rareEarths, ...radioactives, ...voidOres];

export const ORE_MAP: Record<string, Ore> = {};
ALL_ORES.forEach(ore => { ORE_MAP[ore.id] = ore; });

export function rollMiningDrop(luckMultiplier: number = 1): Ore | null {
  const shuffled = [...ALL_ORES].sort(() => Math.random() - 0.5);
  for (const ore of shuffled) {
    if (Math.random() < ore.miningChance * luckMultiplier) {
      return ore;
    }
  }
  return shuffled.find(o => o.rarity === 'common') || shuffled[0];
}

export const RARITY_ORDER: OreRarity[] = ['common', 'uncommon', 'rare', 'exotic', 'radioactive', 'void'];

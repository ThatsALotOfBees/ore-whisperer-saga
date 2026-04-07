import { RECIPE_MAP } from './recipes';

export interface UpgradeCost {
  itemId: string;
  type: 'ingot' | 'item' | 'currency';
  quantity: number;
}

export interface FactoryMachineTier {
  level: number;
  cost: UpgradeCost[];
  effect: number;
  powerDraw: number;
  powerGen: number;
}

export interface FactoryMachineDef {
  id: string;
  name: string;
  description: string;
  category: 'generator' | 'miner' | 'smelter' | 'refiner' | 'assembler';
  icon: string;
  basePowerDraw: number;
  basePowerGen: number;
  baseEffect: number;
  effectLabel: string;
  tiers: FactoryMachineTier[];
}

export type VeinType = 'iron' | 'copper' | 'stone' | 'coal' | 'gold' | 'veinite' | null;

export interface TileVein {
  type: VeinType;
  richness: number; // multiplier for output
}

/** Deterministic vein generation based on grid index */
export function getTileVein(index: number): TileVein {
  // Simple pseudo-random using index
  const hash = (index * 15485863) % 1000;
  
  if (hash < 30) return { type: 'veinite', richness: 1.5 };
  if (hash < 100) return { type: 'gold', richness: 1.2 };
  if (hash < 250) return { type: 'coal', richness: 1.0 };
  if (hash < 450) return { type: 'copper', richness: 1.0 };
  if (hash < 700) return { type: 'iron', richness: 1.0 };
  if (hash < 900) return { type: 'stone', richness: 0.8 };
  
  return { type: null, richness: 0 };
}

// ─── Helper: Generate 26 Tiers ───────────────────────────────────────────────

function generateTiers(
  machineId: string,
  baseEffect: number,
  effectStep: number,
  basePower: number,
  powerStep: number,
  isGenerator: boolean
): FactoryMachineTier[] {
  const tiers: FactoryMachineTier[] = [];

  for (let lvl = 1; lvl <= 26; lvl++) {
    const cost: UpgradeCost[] = [];
    
    // Currency scaling: Level^2.5 * 1000
    cost.push({ itemId: 'currency', type: 'currency', quantity: Math.floor(Math.pow(lvl, 2.5) * 500) });

    // Item scaling: 
    // T1 (1-5): metal_plate, metal_rod
    // T2 (6-10): gear_assembly, pcb_blank
    // T3 (11-15): precision_gear, processor
    // T4 (16-20): heavy_frame, industrial_gearbox
    // T5 (21-25): nano_frame, quantum_gate
    // T6 (26): singularity, veinite_core
    
    const qty = Math.floor(2 + lvl / 2);
    
    if (lvl <= 5) {
      cost.push({ itemId: 'metal_plate', type: 'item', quantity: qty * 2 });
      if (lvl > 2) cost.push({ itemId: 'metal_rod', type: 'item', quantity: qty });
    } else if (lvl <= 10) {
      cost.push({ itemId: 'gear_assembly', type: 'item', quantity: qty });
      cost.push({ itemId: 'pcb_blank', type: 'item', quantity: Math.max(1, Math.floor(qty / 2)) });
    } else if (lvl <= 15) {
      cost.push({ itemId: 'precision_gear', type: 'item', quantity: qty });
      cost.push({ itemId: 'processor', type: 'item', quantity: 1 });
    } else if (lvl <= 20) {
      cost.push({ itemId: 'heavy_frame', type: 'item', quantity: 1 });
      cost.push({ itemId: 'industrial_gearbox', type: 'item', quantity: 2 });
    } else if (lvl <= 25) {
      cost.push({ itemId: 'nano_frame', type: 'item', quantity: 1 });
      cost.push({ itemId: 'quantum_gate', type: 'item', quantity: 1 });
    } else {
      // Level 26: The Wall
      cost.push({ itemId: 'veinite_core', type: 'item', quantity: 1 });
      cost.push({ itemId: 'singularity_chassis', type: 'item', quantity: 1 });
    }

    tiers.push({
      level: lvl,
      cost,
      effect: baseEffect + (lvl - 1) * effectStep,
      powerDraw: isGenerator ? 0 : basePower + (lvl - 1) * powerStep,
      powerGen: isGenerator ? basePower + (lvl - 1) * powerStep : 0,
    });
  }

  return tiers;
}

// ─── Machine Definitions ─────────────────────────────────────────────────────

export const FACTORY_MACHINES: FactoryMachineDef[] = [
  {
    id: 'basic_miner',
    name: 'Auto-Drill Rig',
    description: 'Extracts common ores from the plot automatically.',
    category: 'miner',
    icon: '🚜',
    basePowerDraw: 10,
    basePowerGen: 0,
    baseEffect: 1, // 1 ore per cycle
    effectLabel: 'ores / cycle',
    tiers: generateTiers('basic_miner', 1, 0.5, 10, 5, false),
  },
  {
    id: 'solar_collector',
    name: 'Solar Collector',
    description: 'Generates power from ambient light.',
    category: 'generator',
    icon: '☀️',
    basePowerDraw: 0,
    basePowerGen: 25,
    baseEffect: 0,
    effectLabel: 'W',
    tiers: generateTiers('solar_collector', 0, 0, 25, 15, true),
  },
  {
    id: 'thermal_generator',
    name: 'Thermal Generator',
    description: 'Converts core heat into usable electrical energy.',
    category: 'generator',
    icon: '🌋',
    basePowerDraw: 0,
    basePowerGen: 100,
    baseEffect: 0,
    effectLabel: 'W',
    tiers: generateTiers('thermal_generator', 0, 0, 100, 50, true),
  },
  {
    id: 'auto_smelter',
    name: 'Automated Foundry',
    description: 'Processes raw ores into ingots on the grid.',
    category: 'smelter',
    icon: '🏭',
    basePowerDraw: 30,
    basePowerGen: 0,
    baseEffect: 1, // units per cycle
    effectLabel: 'speed multiplier',
    tiers: generateTiers('auto_smelter', 1.0, 0.2, 30, 15, false),
  },
  {
      id: 'auto_assembler',
      name: 'Logic Assembler',
      description: 'Automatically crafts components from ingredients.',
      category: 'assembler',
      icon: '🤖',
      basePowerDraw: 50,
      basePowerGen: 0,
      baseEffect: 1,
      effectLabel: 'crafting speed',
      tiers: generateTiers('auto_assembler', 1.0, 0.25, 50, 25, false),
  }
];

export const FACTORY_MACHINE_MAP: Record<string, FactoryMachineDef> = {};
FACTORY_MACHINES.forEach(m => { FACTORY_MACHINE_MAP[m.id] = m; });

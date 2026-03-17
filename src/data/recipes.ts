export interface CraftingRecipe {
  id: string;
  name: string;
  category: 'component' | 'electronic' | 'machine';
  ingredients: { itemId: string; type: 'ingot' | 'item'; quantity: number }[];
  outputQuantity: number;
  requiredMachine?: string;
  description: string;
}

export interface MiningUpgrade {
  id: string;
  name: string;
  description: string;
  maxLevel: number;
  baseCost: number;
  costMultiplier: number;
  effect: 'speed' | 'luck' | 'multiDrop';
  effectPerLevel: number;
}

export interface FoundryUpgrade {
  id: string;
  name: string;
  tier: number;
  cost: { itemId: string; type: 'ingot' | 'item' | 'currency'; quantity: number }[];
  slots: number;
  speedMultiplier: number;
  description: string;
}

export const MINING_UPGRADES: MiningUpgrade[] = [
  { id: 'drill_speed', name: 'Drill Speed', description: 'Faster mining ticks', maxLevel: 10, baseCost: 50, costMultiplier: 2.2, effect: 'speed', effectPerLevel: 0.15 },
  { id: 'ore_scanner', name: 'Ore Scanner', description: 'Higher chance for rare ores', maxLevel: 10, baseCost: 100, costMultiplier: 2.5, effect: 'luck', effectPerLevel: 0.12 },
  { id: 'multi_drill', name: 'Multi-Drill', description: 'Chance to mine multiple ores', maxLevel: 5, baseCost: 500, costMultiplier: 3.0, effect: 'multiDrop', effectPerLevel: 0.1 },
];

export const FOUNDRY_TIERS: FoundryUpgrade[] = [
  { id: 'induction_furnace', name: 'Induction Furnace', tier: 1, cost: [], slots: 1, speedMultiplier: 1.0, description: 'Basic smelting. 1 slot, standard speed.' },
  { id: 'arc_smelter', name: 'Arc Smelter', tier: 2, cost: [{ itemId: 'currency', type: 'currency', quantity: 500 }, { itemId: 'iron', type: 'ingot', quantity: 20 }, { itemId: 'copper', type: 'ingot', quantity: 15 }], slots: 2, speedMultiplier: 1.5, description: '2 slots, 1.5x speed.' },
  { id: 'plasma_kiln', name: 'Plasma Kiln', tier: 3, cost: [{ itemId: 'currency', type: 'currency', quantity: 2000 }, { itemId: 'titanium', type: 'ingot', quantity: 10 }, { itemId: 'platinum', type: 'ingot', quantity: 5 }], slots: 4, speedMultiplier: 3.0, description: '4 slots, 3x speed. Requires refined ores.' },
];

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  // Basic Components
  { id: 'carbon_film', name: 'Carbon Film', category: 'component', ingredients: [{ itemId: 'lead', type: 'ingot', quantity: 2 }], outputQuantity: 4, description: 'Thin carbon layer for resistors' },
  { id: 'ceramic_base', name: 'Ceramic Base', category: 'component', ingredients: [{ itemId: 'silicon', type: 'ingot', quantity: 1 }, { itemId: 'aluminum', type: 'ingot', quantity: 1 }], outputQuantity: 3, description: 'Heat-resistant ceramic substrate' },
  { id: 'copper_foil', name: 'Copper Foil', category: 'component', ingredients: [{ itemId: 'copper', type: 'ingot', quantity: 3 }], outputQuantity: 2, description: 'Thin copper sheeting' },
  { id: 'copper_trace', name: 'Copper Trace', category: 'component', ingredients: [{ itemId: 'copper_foil', type: 'item', quantity: 1 }], outputQuantity: 4, description: 'Etched copper pathways' },
  { id: 'gold_wire', name: 'Gold Wire', category: 'component', ingredients: [{ itemId: 'gold', type: 'ingot', quantity: 1 }], outputQuantity: 2, description: 'Ultra-fine gold bonding wire' },
  { id: 'gold_trace', name: 'Gold Trace', category: 'component', ingredients: [{ itemId: 'gold_wire', type: 'item', quantity: 2 }], outputQuantity: 1, description: 'Precision gold circuit pathway' },
  { id: 'fiberglass_sheet', name: 'Fiberglass Sheet', category: 'component', ingredients: [{ itemId: 'silicon', type: 'ingot', quantity: 2 }, { itemId: 'aluminum', type: 'ingot', quantity: 1 }], outputQuantity: 2, description: 'Rigid PCB substrate' },
  { id: 'electrolyte_solution', name: 'Electrolyte Solution', category: 'component', ingredients: [{ itemId: 'tin', type: 'ingot', quantity: 1 }, { itemId: 'lead', type: 'ingot', quantity: 1 }], outputQuantity: 3, description: 'Conductive ionic solution' },
  { id: 'solder', name: 'Solder', category: 'component', ingredients: [{ itemId: 'tin', type: 'ingot', quantity: 2 }, { itemId: 'lead', type: 'ingot', quantity: 1 }], outputQuantity: 5, description: 'Tin-lead solder alloy' },
  { id: 'silicon_wafer', name: 'Silicon Wafer', category: 'component', ingredients: [{ itemId: 'silicon', type: 'ingot', quantity: 5 }], outputQuantity: 1, requiredMachine: 'wafer_cutter', description: 'Ultra-pure silicon disc' },

  // Electronics
  { id: 'resistor', name: 'Resistor', category: 'electronic', ingredients: [{ itemId: 'ceramic_base', type: 'item', quantity: 1 }, { itemId: 'carbon_film', type: 'item', quantity: 1 }], outputQuantity: 4, description: 'Limits current flow' },
  { id: 'capacitor', name: 'Capacitor', category: 'electronic', ingredients: [{ itemId: 'aluminum', type: 'ingot', quantity: 1 }, { itemId: 'electrolyte_solution', type: 'item', quantity: 1 }], outputQuantity: 3, description: 'Stores electrical charge' },
  { id: 'transistor', name: 'Transistor', category: 'electronic', ingredients: [{ itemId: 'silicon', type: 'ingot', quantity: 1 }, { itemId: 'gold_wire', type: 'item', quantity: 1 }, { itemId: 'solder', type: 'item', quantity: 1 }], outputQuantity: 2, description: 'Semiconductor switch' },
  { id: 'diode', name: 'Diode', category: 'electronic', ingredients: [{ itemId: 'silicon', type: 'ingot', quantity: 1 }, { itemId: 'copper_trace', type: 'item', quantity: 1 }], outputQuantity: 3, description: 'One-way current gate' },
  { id: 'pcb_blank', name: 'PCB (Blank)', category: 'electronic', ingredients: [{ itemId: 'fiberglass_sheet', type: 'item', quantity: 1 }, { itemId: 'copper_foil', type: 'item', quantity: 1 }], outputQuantity: 1, description: 'Unpopulated circuit board' },
  { id: 'inductor', name: 'Inductor', category: 'electronic', ingredients: [{ itemId: 'copper', type: 'ingot', quantity: 3 }, { itemId: 'iron', type: 'ingot', quantity: 1 }], outputQuantity: 2, description: 'Magnetic energy storage coil' },
  { id: 'logic_controller', name: 'Logic Controller', category: 'electronic', ingredients: [{ itemId: 'pcb_blank', type: 'item', quantity: 1 }, { itemId: 'transistor', type: 'item', quantity: 4 }, { itemId: 'gold_wire', type: 'item', quantity: 1 }, { itemId: 'solder', type: 'item', quantity: 2 }], outputQuantity: 1, description: 'Programmable logic unit' },
  { id: 'processor', name: 'Processor', category: 'electronic', ingredients: [{ itemId: 'silicon_wafer', type: 'item', quantity: 1 }, { itemId: 'gold_trace', type: 'item', quantity: 2 }, { itemId: 'transistor', type: 'item', quantity: 8 }, { itemId: 'solder', type: 'item', quantity: 4 }], outputQuantity: 1, requiredMachine: 'lithography_machine', description: 'Advanced computation unit' },
  { id: 'memory_module', name: 'Memory Module', category: 'electronic', ingredients: [{ itemId: 'pcb_blank', type: 'item', quantity: 1 }, { itemId: 'capacitor', type: 'item', quantity: 8 }, { itemId: 'transistor', type: 'item', quantity: 4 }, { itemId: 'solder', type: 'item', quantity: 2 }], outputQuantity: 1, description: 'DRAM storage module' },
  { id: 'power_regulator', name: 'Power Regulator', category: 'electronic', ingredients: [{ itemId: 'inductor', type: 'item', quantity: 2 }, { itemId: 'capacitor', type: 'item', quantity: 2 }, { itemId: 'diode', type: 'item', quantity: 2 }, { itemId: 'resistor', type: 'item', quantity: 4 }], outputQuantity: 1, description: 'Voltage regulation circuit' },

  // Machines (craftable & unlockable)
  { id: 'wafer_cutter', name: 'Wafer Cutter', category: 'machine', ingredients: [{ itemId: 'titanium', type: 'ingot', quantity: 5 }, { itemId: 'platinum', type: 'ingot', quantity: 2 }, { itemId: 'logic_controller', type: 'item', quantity: 1 }], outputQuantity: 1, description: 'Precision silicon cutting tool' },
  { id: 'lithography_machine', name: 'Lithography Machine', category: 'machine', ingredients: [{ itemId: 'titanium', type: 'ingot', quantity: 10 }, { itemId: 'gold', type: 'ingot', quantity: 5 }, { itemId: 'logic_controller', type: 'item', quantity: 2 }, { itemId: 'power_regulator', type: 'item', quantity: 1 }], outputQuantity: 1, description: 'UV lithography for chip fabrication' },
  { id: 'etching_station', name: 'Etching Station', category: 'machine', ingredients: [{ itemId: 'silver', type: 'ingot', quantity: 5 }, { itemId: 'titanium', type: 'ingot', quantity: 3 }, { itemId: 'logic_controller', type: 'item', quantity: 1 }], outputQuantity: 1, description: 'Chemical etching for PCB traces' },
];

export const RECIPE_MAP: Record<string, CraftingRecipe> = {};
CRAFTING_RECIPES.forEach(r => { RECIPE_MAP[r.id] = r; });

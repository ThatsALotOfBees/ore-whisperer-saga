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
  canAlloy: boolean;
  automationSupport: boolean;
  description: string;
}

// ─── Mining Upgrades ─────────────────────────────────────────────────────────
export const MINING_UPGRADES: MiningUpgrade[] = [
  { id: 'drill_speed', name: 'Drill Speed', description: 'Faster mining ticks', maxLevel: 10, baseCost: 50, costMultiplier: 2.2, effect: 'speed', effectPerLevel: 0.15 },
  { id: 'ore_scanner', name: 'Ore Scanner', description: 'Higher chance for rare ores', maxLevel: 10, baseCost: 100, costMultiplier: 2.5, effect: 'luck', effectPerLevel: 0.12 },
  { id: 'multi_drill', name: 'Multi-Drill', description: 'Chance to mine multiple ores', maxLevel: 5, baseCost: 500, costMultiplier: 3.0, effect: 'multiDrop', effectPerLevel: 0.1 },
  { id: 'auto_miner_speed', name: 'Auto-Miner Speed', description: 'Faster auto-mining (15% per level)', maxLevel: 10, baseCost: 200, costMultiplier: 2.5, effect: 'speed', effectPerLevel: 0.15 },
];

// ─── 20-Tier Foundry Progression ─────────────────────────────────────────────
export const FOUNDRY_TIERS: FoundryUpgrade[] = [
  // Tier 1: Starter
  { id: 'electric_furnace_1', name: 'Electric Furnace I', tier: 1, cost: [], slots: 1, speedMultiplier: 1.0, canAlloy: false, automationSupport: false, description: 'Starter furnace. 1 slot, standard speed.' },
  // Tier 2
  { id: 'electric_furnace_2', name: 'Electric Furnace II', tier: 2, cost: [
    { itemId: 'currency', type: 'currency', quantity: 500 },
    { itemId: 'iron', type: 'ingot', quantity: 20 },
    { itemId: 'copper', type: 'ingot', quantity: 15 },
  ], slots: 2, speedMultiplier: 1.3, canAlloy: false, automationSupport: false, description: '2 slots, 1.3x speed. Processes 2 ores at once.' },
  // Tier 3: Alloy unlock
  { id: 'alloy_furnace_1', name: 'Electric Alloy Furnace I', tier: 3, cost: [
    { itemId: 'currency', type: 'currency', quantity: 1500 },
    { itemId: 'tin', type: 'ingot', quantity: 20 },
    { itemId: 'zinc', type: 'ingot', quantity: 15 },
    { itemId: 'nickel', type: 'ingot', quantity: 10 },
  ], slots: 2, speedMultiplier: 1.5, canAlloy: true, automationSupport: false, description: '2 slots, 1.5x speed. Unlocks alloy smelting.' },
  // Tier 4
  { id: 'alloy_furnace_2', name: 'Electric Alloy Furnace II', tier: 4, cost: [
    { itemId: 'currency', type: 'currency', quantity: 3000 },
    { itemId: 'aluminum', type: 'ingot', quantity: 25 },
    { itemId: 'quartz', type: 'ingot', quantity: 10 },
  ], slots: 3, speedMultiplier: 1.8, canAlloy: true, automationSupport: false, description: '3 slots, 1.8x speed. Higher alloy yield.' },
  // Tier 5
  { id: 'industrial_smelter_1', name: 'Industrial Electric Smelter I', tier: 5, cost: [
    { itemId: 'currency', type: 'currency', quantity: 6000 },
    { itemId: 'silver', type: 'ingot', quantity: 10 },
    { itemId: 'magnetite', type: 'ingot', quantity: 15 },
  ], slots: 3, speedMultiplier: 2.2, canAlloy: true, automationSupport: false, description: '3 slots, 2.2x speed. Processes mid-tier ores.' },
  // Tier 6: Automation unlock
  { id: 'industrial_smelter_2', name: 'Industrial Electric Smelter II', tier: 6, cost: [
    { itemId: 'currency', type: 'currency', quantity: 10000 },
    { itemId: 'gold', type: 'ingot', quantity: 5 },
    { itemId: 'chromite', type: 'ingot', quantity: 10 },
    { itemId: 'gear_assembly', type: 'item', quantity: 2 },
  ], slots: 4, speedMultiplier: 2.5, canAlloy: true, automationSupport: true, description: '4 slots, 2.5x speed. Adds automation support.' },
  // Tier 7
  { id: 'precision_smelter_1', name: 'Precision Electric Smelter I', tier: 7, cost: [
    { itemId: 'currency', type: 'currency', quantity: 18000 },
    { itemId: 'platinum', type: 'ingot', quantity: 5 },
    { itemId: 'cobalt', type: 'ingot', quantity: 8 },
    { itemId: 'compact_gearbox', type: 'item', quantity: 1 },
  ], slots: 4, speedMultiplier: 3.0, canAlloy: true, automationSupport: true, description: '4 slots, 3x speed. Required for refined components.' },
  // Tier 8
  { id: 'precision_smelter_2', name: 'Precision Electric Smelter II', tier: 8, cost: [
    { itemId: 'currency', type: 'currency', quantity: 30000 },
    { itemId: 'tungsten', type: 'ingot', quantity: 8 },
    { itemId: 'lithium', type: 'ingot', quantity: 5 },
    { itemId: 'stabilizer_unit', type: 'item', quantity: 1 },
  ], slots: 5, speedMultiplier: 3.5, canAlloy: true, automationSupport: true, description: '5 slots, 3.5x speed. Unlocks Tier 3 components.' },
  // Tier 9
  { id: 'advanced_furnace_1', name: 'Advanced Electric Furnace I', tier: 9, cost: [
    { itemId: 'currency', type: 'currency', quantity: 50000 },
    { itemId: 'titanium', type: 'ingot', quantity: 10 },
    { itemId: 'molybdenum', type: 'ingot', quantity: 5 },
    { itemId: 'modular_frame', type: 'item', quantity: 1 },
  ], slots: 5, speedMultiplier: 4.0, canAlloy: true, automationSupport: true, description: '5 slots, 4x speed. High throughput; multi-ore alloying.' },
  // Tier 10
  { id: 'advanced_furnace_2', name: 'Advanced Electric Furnace II', tier: 10, cost: [
    { itemId: 'currency', type: 'currency', quantity: 80000 },
    { itemId: 'tantalum', type: 'ingot', quantity: 5 },
    { itemId: 'niobium', type: 'ingot', quantity: 5 },
    { itemId: 'structural_core', type: 'item', quantity: 1 },
  ], slots: 6, speedMultiplier: 4.5, canAlloy: true, automationSupport: true, description: '6 slots, 4.5x speed. Supports rare mid-game ores.' },
  // Tier 11: Plasma
  { id: 'plasma_smelter_1', name: 'Plasma Electric Smelter I', tier: 11, cost: [
    { itemId: 'currency', type: 'currency', quantity: 120000 },
    { itemId: 'iridium', type: 'ingot', quantity: 3 },
    { itemId: 'osmium', type: 'ingot', quantity: 3 },
    { itemId: 'heavy_frame', type: 'item', quantity: 1 },
  ], slots: 6, speedMultiplier: 5.5, canAlloy: true, automationSupport: true, description: '6 slots, 5.5x speed. Plasma heating; exotic alloys.' },
  // Tier 12
  { id: 'plasma_smelter_2', name: 'Plasma Electric Smelter II', tier: 12, cost: [
    { itemId: 'currency', type: 'currency', quantity: 180000 },
    { itemId: 'rhodium', type: 'ingot', quantity: 3 },
    { itemId: 'thorium', type: 'ingot', quantity: 3 },
    { itemId: 'cooling_assembly', type: 'item', quantity: 2 },
  ], slots: 7, speedMultiplier: 6.5, canAlloy: true, automationSupport: true, description: '7 slots, 6.5x speed. Faster plasma reactions.' },
  // Tier 13: Nano
  { id: 'nano_smelter_1', name: 'Nano Electric Smelter I', tier: 13, cost: [
    { itemId: 'currency', type: 'currency', quantity: 300000 },
    { itemId: 'diamond', type: 'ingot', quantity: 2 },
    { itemId: 'emerald', type: 'ingot', quantity: 2 },
    { itemId: 'nano_frame', type: 'item', quantity: 1 },
  ], slots: 7, speedMultiplier: 8.0, canAlloy: true, automationSupport: true, description: '7 slots, 8x speed. Micro-level precision; electronics-ready.' },
  // Tier 14
  { id: 'nano_smelter_2', name: 'Nano Electric Smelter II', tier: 14, cost: [
    { itemId: 'currency', type: 'currency', quantity: 500000 },
    { itemId: 'ruby', type: 'ingot', quantity: 2 },
    { itemId: 'sapphire', type: 'ingot', quantity: 2 },
    { itemId: 'precision_matrix', type: 'item', quantity: 1 },
  ], slots: 8, speedMultiplier: 10.0, canAlloy: true, automationSupport: true, description: '8 slots, 10x speed. Extremely fast; Tier 4 components.' },
  // Tier 15: Fusion
  { id: 'fusion_smelter_1', name: 'Fusion Electric Smelter I', tier: 15, cost: [
    { itemId: 'currency', type: 'currency', quantity: 800000 },
    { itemId: 'painite', type: 'ingot', quantity: 1 },
    { itemId: 'taaffeite', type: 'ingot', quantity: 1 },
    { itemId: 'energy_channel_core', type: 'item', quantity: 1 },
  ], slots: 8, speedMultiplier: 12.0, canAlloy: true, automationSupport: true, description: '8 slots, 12x speed. Fusion-based; ultra-rare ores.' },
  // Tier 16
  { id: 'fusion_smelter_2', name: 'Fusion Electric Smelter II', tier: 16, cost: [
    { itemId: 'currency', type: 'currency', quantity: 1200000 },
    { itemId: 'grandidierite', type: 'ingot', quantity: 1 },
    { itemId: 'californium', type: 'ingot', quantity: 1 },
    { itemId: 'fusion_housing', type: 'item', quantity: 1 },
  ], slots: 10, speedMultiplier: 15.0, canAlloy: true, automationSupport: true, description: '10 slots, 15x speed. Massive throughput; endgame alloys.' },
  // Tier 17: Void
  { id: 'void_smelter_1', name: 'Void Electric Smelter I', tier: 17, cost: [
    { itemId: 'currency', type: 'currency', quantity: 2000000 },
    { itemId: 'veinite', type: 'ingot', quantity: 1 },
    { itemId: 'void_crystal', type: 'ingot', quantity: 1 },
    { itemId: 'quantum_frame', type: 'item', quantity: 1 },
  ], slots: 10, speedMultiplier: 18.0, canAlloy: true, automationSupport: true, description: '10 slots, 18x speed. Handles Veinite + Void Ores.' },
  // Tier 18
  { id: 'void_smelter_2', name: 'Void Electric Smelter II', tier: 18, cost: [
    { itemId: 'currency', type: 'currency', quantity: 3500000 },
    { itemId: 'dark_matter', type: 'ingot', quantity: 1 },
    { itemId: 'dimensional_coupler', type: 'item', quantity: 1 },
  ], slots: 12, speedMultiplier: 22.0, canAlloy: true, automationSupport: true, description: '12 slots, 22x speed. Multi-input; massive efficiency.' },
  // Tier 19: Entropy
  { id: 'entropy_smelter', name: 'Entropy Electric Smelter', tier: 19, cost: [
    { itemId: 'currency', type: 'currency', quantity: 6000000 },
    { itemId: 'entropy_shard', type: 'ingot', quantity: 1 },
    { itemId: 'reality_stabilizer', type: 'item', quantity: 1 },
  ], slots: 14, speedMultiplier: 28.0, canAlloy: true, automationSupport: true, description: '14 slots, 28x speed. Near-singularity energy.' },
  // Tier 20: Solar Singularity
  { id: 'singularity_smelter', name: 'Solar Singularity Smelter', tier: 20, cost: [
    { itemId: 'currency', type: 'currency', quantity: 10000000 },
    { itemId: 'singularity', type: 'ingot', quantity: 1 },
    { itemId: 'singularity_chassis', type: 'item', quantity: 1 },
    { itemId: 'temporal_stabilizer', type: 'item', quantity: 1 },
  ], slots: 20, speedMultiplier: 50.0, canAlloy: true, automationSupport: true, description: '20 slots, 50x speed. A miniature sun. Melts anything instantly.' },
];

// ─── 100 Components ──────────────────────────────────────────────────────────

// Tier 1: Basic Parts (1-15)
// Machine: wafer_cutter — cuts and shapes raw ingots into basic structural parts
const tier1Components: CraftingRecipe[] = [
  { id: 'metal_plate', name: 'Metal Plate', category: 'component', requiredMachine: 'wafer_cutter', ingredients: [{ itemId: 'iron', type: 'ingot', quantity: 3 }], outputQuantity: 4, description: 'Flat iron sheet for structural use' },
  { id: 'reinforced_plate', name: 'Reinforced Plate', category: 'component', requiredMachine: 'wafer_cutter', ingredients: [{ itemId: 'iron', type: 'ingot', quantity: 2 }, { itemId: 'nickel', type: 'ingot', quantity: 1 }], outputQuantity: 2, description: 'Hardened plate for heavy duty' },
  { id: 'metal_rod', name: 'Metal Rod', category: 'component', requiredMachine: 'wafer_cutter', ingredients: [{ itemId: 'iron', type: 'ingot', quantity: 2 }], outputQuantity: 4, description: 'Solid iron rod' },
  { id: 'metal_beam', name: 'Metal Beam', category: 'component', requiredMachine: 'wafer_cutter', ingredients: [{ itemId: 'iron', type: 'ingot', quantity: 4 }, { itemId: 'zinc', type: 'ingot', quantity: 1 }], outputQuantity: 2, description: 'Structural support beam' },
  { id: 'fastener_set', name: 'Fastener Set', category: 'component', requiredMachine: 'wafer_cutter', ingredients: [{ itemId: 'tin', type: 'ingot', quantity: 2 }, { itemId: 'iron', type: 'ingot', quantity: 1 }], outputQuantity: 6, description: 'Assorted bolts and nuts' },
  { id: 'bolt_pack', name: 'Bolt Pack', category: 'component', requiredMachine: 'wafer_cutter', ingredients: [{ itemId: 'iron', type: 'ingot', quantity: 2 }, { itemId: 'tin', type: 'ingot', quantity: 1 }], outputQuantity: 8, description: 'Standard bolt assortment' },
  { id: 'screw_set', name: 'Screw Set', category: 'component', requiredMachine: 'wafer_cutter', ingredients: [{ itemId: 'tin', type: 'ingot', quantity: 2 }, { itemId: 'zinc', type: 'ingot', quantity: 1 }], outputQuantity: 8, description: 'Precision screw collection' },
  { id: 'basic_frame', name: 'Basic Frame', category: 'component', requiredMachine: 'wafer_cutter', ingredients: [{ itemId: 'iron', type: 'ingot', quantity: 4 }, { itemId: 'aluminum', type: 'ingot', quantity: 2 }], outputQuantity: 2, description: 'Simple structural frame' },
  { id: 'small_gear', name: 'Small Gear', category: 'component', requiredMachine: 'wafer_cutter', ingredients: [{ itemId: 'copper', type: 'ingot', quantity: 2 }, { itemId: 'tin', type: 'ingot', quantity: 1 }], outputQuantity: 4, description: 'Small toothed wheel' },
  { id: 'spring_coil', name: 'Spring Coil', category: 'component', requiredMachine: 'wafer_cutter', ingredients: [{ itemId: 'iron', type: 'ingot', quantity: 2 }, { itemId: 'copper', type: 'ingot', quantity: 1 }], outputQuantity: 4, description: 'Coiled tension spring' },
  { id: 'wire_bundle', name: 'Wire Bundle', category: 'component', requiredMachine: 'wafer_cutter', ingredients: [{ itemId: 'copper', type: 'ingot', quantity: 3 }], outputQuantity: 6, description: 'Bundled copper wiring' },
  { id: 'insulated_layer', name: 'Insulated Layer', category: 'component', requiredMachine: 'wafer_cutter', ingredients: [{ itemId: 'lead', type: 'ingot', quantity: 2 }, { itemId: 'clay', type: 'ingot', quantity: 1 }], outputQuantity: 4, description: 'Protective insulation' },
  { id: 'contact_pin', name: 'Contact Pin', category: 'component', requiredMachine: 'wafer_cutter', ingredients: [{ itemId: 'copper', type: 'ingot', quantity: 1 }, { itemId: 'tin', type: 'ingot', quantity: 1 }], outputQuantity: 6, description: 'Electrical contact point' },
  { id: 'connector_piece', name: 'Connector Piece', category: 'component', requiredMachine: 'wafer_cutter', ingredients: [{ itemId: 'copper', type: 'ingot', quantity: 2 }, { itemId: 'zinc', type: 'ingot', quantity: 1 }], outputQuantity: 4, description: 'Standard connector' },
  { id: 'basic_housing', name: 'Basic Housing', category: 'component', requiredMachine: 'wafer_cutter', ingredients: [{ itemId: 'aluminum', type: 'ingot', quantity: 3 }, { itemId: 'iron', type: 'ingot', quantity: 1 }], outputQuantity: 2, description: 'Protective outer casing' },
];

// Tier 2: Structured Parts (16-30)
// Machine: etching_station — assembles and joins basic parts into structured subassemblies
const tier2Components: CraftingRecipe[] = [
  { id: 'reinforced_frame', name: 'Reinforced Frame', category: 'component', requiredMachine: 'etching_station', ingredients: [{ itemId: 'basic_frame', type: 'item', quantity: 1 }, { itemId: 'reinforced_plate', type: 'item', quantity: 2 }], outputQuantity: 1, description: 'Heavy-duty structural frame' },
  { id: 'gear_assembly', name: 'Gear Assembly', category: 'component', requiredMachine: 'etching_station', ingredients: [{ itemId: 'small_gear', type: 'item', quantity: 3 }, { itemId: 'metal_rod', type: 'item', quantity: 1 }], outputQuantity: 1, description: 'Interlocking gear system' },
  { id: 'shaft_component', name: 'Shaft Component', category: 'component', requiredMachine: 'etching_station', ingredients: [{ itemId: 'metal_rod', type: 'item', quantity: 2 }, { itemId: 'quartz', type: 'ingot', quantity: 1 }], outputQuantity: 2, description: 'Precision rotation shaft' },
  { id: 'bearing_unit', name: 'Bearing Unit', category: 'component', requiredMachine: 'etching_station', ingredients: [{ itemId: 'iron', type: 'ingot', quantity: 2 }, { itemId: 'chromite', type: 'ingot', quantity: 1 }], outputQuantity: 2, description: 'Low-friction bearing' },
  { id: 'mechanical_joint', name: 'Mechanical Joint', category: 'component', requiredMachine: 'etching_station', ingredients: [{ itemId: 'metal_rod', type: 'item', quantity: 1 }, { itemId: 'fastener_set', type: 'item', quantity: 1 }, { itemId: 'spring_coil', type: 'item', quantity: 1 }], outputQuantity: 2, description: 'Articulating connection' },
  { id: 'structural_panel', name: 'Structural Panel', category: 'component', requiredMachine: 'etching_station', ingredients: [{ itemId: 'metal_plate', type: 'item', quantity: 2 }, { itemId: 'magnetite', type: 'ingot', quantity: 1 }], outputQuantity: 2, description: 'Reinforced flat panel' },
  { id: 'cable_harness', name: 'Cable Harness', category: 'component', requiredMachine: 'etching_station', ingredients: [{ itemId: 'wire_bundle', type: 'item', quantity: 2 }, { itemId: 'insulated_layer', type: 'item', quantity: 1 }], outputQuantity: 2, description: 'Organized cable assembly' },
  { id: 'insulated_panel', name: 'Insulated Panel', category: 'component', requiredMachine: 'etching_station', ingredients: [{ itemId: 'structural_panel', type: 'item', quantity: 1 }, { itemId: 'insulated_layer', type: 'item', quantity: 1 }], outputQuantity: 2, description: 'Heat-shielded panel' },
  { id: 'connector_array', name: 'Connector Array', category: 'component', requiredMachine: 'etching_station', ingredients: [{ itemId: 'connector_piece', type: 'item', quantity: 3 }, { itemId: 'contact_pin', type: 'item', quantity: 2 }], outputQuantity: 1, description: 'Multi-pin connector block' },
  { id: 'mounting_bracket', name: 'Mounting Bracket', category: 'component', requiredMachine: 'etching_station', ingredients: [{ itemId: 'metal_plate', type: 'item', quantity: 1 }, { itemId: 'bolt_pack', type: 'item', quantity: 1 }], outputQuantity: 3, description: 'Universal mounting hardware' },
  { id: 'rotary_component', name: 'Rotary Component', category: 'component', requiredMachine: 'etching_station', ingredients: [{ itemId: 'gear_assembly', type: 'item', quantity: 1 }, { itemId: 'bearing_unit', type: 'item', quantity: 1 }], outputQuantity: 1, description: 'Rotating mechanism core' },
  { id: 'pressure_seal', name: 'Pressure Seal', category: 'component', requiredMachine: 'etching_station', ingredients: [{ itemId: 'lead', type: 'ingot', quantity: 2 }, { itemId: 'graphite', type: 'ingot', quantity: 1 }], outputQuantity: 3, description: 'Airtight seal ring' },
  { id: 'compact_housing', name: 'Compact Housing', category: 'component', requiredMachine: 'etching_station', ingredients: [{ itemId: 'basic_housing', type: 'item', quantity: 1 }, { itemId: 'screw_set', type: 'item', quantity: 1 }], outputQuantity: 2, description: 'Small protective enclosure' },
  { id: 'support_frame', name: 'Support Frame', category: 'component', requiredMachine: 'etching_station', ingredients: [{ itemId: 'basic_frame', type: 'item', quantity: 1 }, { itemId: 'mounting_bracket', type: 'item', quantity: 2 }], outputQuantity: 1, description: 'Elevated support structure' },
  { id: 'alignment_module', name: 'Alignment Module', category: 'component', requiredMachine: 'etching_station', ingredients: [{ itemId: 'shaft_component', type: 'item', quantity: 1 }, { itemId: 'bearing_unit', type: 'item', quantity: 1 }], outputQuantity: 1, description: 'Precision alignment device' },
];

// Tier 3: Precision Components (31-50)
// Machine: cnc_mill — computer-controlled precision milling for fine tolerances
const tier3Components: CraftingRecipe[] = [
  { id: 'precision_gear', name: 'Precision Gear', category: 'component', requiredMachine: 'cnc_mill', ingredients: [{ itemId: 'small_gear', type: 'item', quantity: 2 }, { itemId: 'silver', type: 'ingot', quantity: 1 }], outputQuantity: 2, description: 'Ultra-fine toothed gear' },
  { id: 'micro_connector', name: 'Micro Connector', category: 'component', requiredMachine: 'cnc_mill', ingredients: [{ itemId: 'contact_pin', type: 'item', quantity: 2 }, { itemId: 'gold', type: 'ingot', quantity: 1 }], outputQuantity: 3, description: 'Miniature electrical connector' },
  { id: 'fine_wiring', name: 'Fine Wiring Bundle', category: 'component', requiredMachine: 'cnc_mill', ingredients: [{ itemId: 'wire_bundle', type: 'item', quantity: 1 }, { itemId: 'silver', type: 'ingot', quantity: 1 }], outputQuantity: 3, description: 'High-conductivity thin wire' },
  { id: 'signal_contact', name: 'Signal Contact', category: 'component', requiredMachine: 'cnc_mill', ingredients: [{ itemId: 'micro_connector', type: 'item', quantity: 1 }, { itemId: 'gold', type: 'ingot', quantity: 1 }], outputQuantity: 2, description: 'Low-noise signal interface' },
  { id: 'micro_frame', name: 'Micro Frame', category: 'component', requiredMachine: 'cnc_mill', ingredients: [{ itemId: 'aluminum', type: 'ingot', quantity: 3 }, { itemId: 'silver', type: 'ingot', quantity: 1 }], outputQuantity: 2, description: 'Miniature structural frame' },
  { id: 'compact_gearbox', name: 'Compact Gearbox', category: 'component', requiredMachine: 'cnc_mill', ingredients: [{ itemId: 'precision_gear', type: 'item', quantity: 2 }, { itemId: 'shaft_component', type: 'item', quantity: 1 }], outputQuantity: 1, description: 'Small multi-gear assembly' },
  { id: 'stabilizer_unit', name: 'Stabilizer Unit', category: 'component', requiredMachine: 'cnc_mill', ingredients: [{ itemId: 'spring_coil', type: 'item', quantity: 2 }, { itemId: 'bearing_unit', type: 'item', quantity: 1 }, { itemId: 'cobalt', type: 'ingot', quantity: 1 }], outputQuantity: 1, description: 'Vibration dampening device' },
  { id: 'control_housing', name: 'Control Housing', category: 'component', requiredMachine: 'cnc_mill', ingredients: [{ itemId: 'compact_housing', type: 'item', quantity: 1 }, { itemId: 'insulated_panel', type: 'item', quantity: 1 }], outputQuantity: 1, description: 'Shielded electronics enclosure' },
  { id: 'modular_frame', name: 'Modular Frame', category: 'component', requiredMachine: 'cnc_mill', ingredients: [{ itemId: 'reinforced_frame', type: 'item', quantity: 1 }, { itemId: 'mounting_bracket', type: 'item', quantity: 2 }, { itemId: 'tungsten', type: 'ingot', quantity: 1 }], outputQuantity: 1, description: 'Reconfigurable frame system' },
  { id: 'thermal_plate', name: 'Thermal Plate', category: 'component', requiredMachine: 'cnc_mill', ingredients: [{ itemId: 'metal_plate', type: 'item', quantity: 1 }, { itemId: 'copper', type: 'ingot', quantity: 3 }, { itemId: 'silver', type: 'ingot', quantity: 1 }], outputQuantity: 2, description: 'Heat-dissipating plate' },
  { id: 'energy_channel', name: 'Energy Channel', category: 'component', requiredMachine: 'cnc_mill', ingredients: [{ itemId: 'wire_bundle', type: 'item', quantity: 2 }, { itemId: 'quartz', type: 'ingot', quantity: 2 }, { itemId: 'lithium', type: 'ingot', quantity: 1 }], outputQuantity: 1, description: 'Directed energy conduit' },
  { id: 'contact_matrix', name: 'Contact Matrix', category: 'component', requiredMachine: 'cnc_mill', ingredients: [{ itemId: 'connector_array', type: 'item', quantity: 1 }, { itemId: 'signal_contact', type: 'item', quantity: 2 }], outputQuantity: 1, description: 'High-density contact grid' },
  { id: 'data_interface_base', name: 'Data Interface Base', category: 'component', requiredMachine: 'cnc_mill', ingredients: [{ itemId: 'contact_matrix', type: 'item', quantity: 1 }, { itemId: 'micro_frame', type: 'item', quantity: 1 }], outputQuantity: 1, description: 'Data bus foundation' },
  { id: 'sensor_mount', name: 'Sensor Mount', category: 'component', requiredMachine: 'cnc_mill', ingredients: [{ itemId: 'micro_frame', type: 'item', quantity: 1 }, { itemId: 'alignment_module', type: 'item', quantity: 1 }], outputQuantity: 1, description: 'Precision sensor housing' },
  { id: 'precision_shaft', name: 'Precision Shaft', category: 'component', requiredMachine: 'cnc_mill', ingredients: [{ itemId: 'shaft_component', type: 'item', quantity: 1 }, { itemId: 'platinum', type: 'ingot', quantity: 1 }], outputQuantity: 1, description: 'Ultra-smooth rotation axis' },
  { id: 'reinforced_joint', name: 'Reinforced Joint', category: 'component', requiredMachine: 'cnc_mill', ingredients: [{ itemId: 'mechanical_joint', type: 'item', quantity: 1 }, { itemId: 'cobalt', type: 'ingot', quantity: 1 }], outputQuantity: 2, description: 'High-stress articulation' },
  { id: 'structural_core', name: 'Structural Core', category: 'component', requiredMachine: 'cnc_mill', ingredients: [{ itemId: 'reinforced_frame', type: 'item', quantity: 1 }, { itemId: 'reinforced_plate', type: 'item', quantity: 2 }, { itemId: 'tungsten', type: 'ingot', quantity: 1 }], outputQuantity: 1, description: 'Central structural element' },
  { id: 'balance_assembly', name: 'Balance Assembly', category: 'component', requiredMachine: 'cnc_mill', ingredients: [{ itemId: 'stabilizer_unit', type: 'item', quantity: 1 }, { itemId: 'precision_gear', type: 'item', quantity: 1 }], outputQuantity: 1, description: 'Dynamic balance mechanism' },
  { id: 'micro_housing', name: 'Micro Housing', category: 'component', requiredMachine: 'cnc_mill', ingredients: [{ itemId: 'compact_housing', type: 'item', quantity: 1 }, { itemId: 'gold', type: 'ingot', quantity: 1 }], outputQuantity: 1, description: 'Precious-metal lined case' },
  { id: 'compact_assembly', name: 'Compact Assembly', category: 'component', requiredMachine: 'cnc_mill', ingredients: [{ itemId: 'micro_frame', type: 'item', quantity: 1 }, { itemId: 'compact_gearbox', type: 'item', quantity: 1 }, { itemId: 'fastener_set', type: 'item', quantity: 1 }], outputQuantity: 1, description: 'Pre-assembled miniature unit' },
];

// Tier 4: Industrial Components (51-70)
// Machine: plasma_welder — high-temperature plasma fusion for industrial-grade assemblies
const tier4Components: CraftingRecipe[] = [
  { id: 'heavy_frame', name: 'Heavy Frame', category: 'component', requiredMachine: 'plasma_welder', ingredients: [{ itemId: 'structural_core', type: 'item', quantity: 1 }, { itemId: 'titanium', type: 'ingot', quantity: 3 }], outputQuantity: 1, description: 'Industrial-grade frame' },
  { id: 'industrial_gearbox', name: 'Industrial Gearbox', category: 'component', requiredMachine: 'cnc_mill', ingredients: [{ itemId: 'compact_gearbox', type: 'item', quantity: 2 }, { itemId: 'titanium', type: 'ingot', quantity: 2 }], outputQuantity: 1, description: 'High-torque gear system' },
  { id: 'reinforced_shaft', name: 'Reinforced Shaft', category: 'component', requiredMachine: 'plasma_welder', ingredients: [{ itemId: 'precision_shaft', type: 'item', quantity: 1 }, { itemId: 'titanium', type: 'ingot', quantity: 2 }], outputQuantity: 1, description: 'Unbreakable rotation axis' },
  { id: 'load_bearing_unit', name: 'Load Bearing Unit', category: 'component', requiredMachine: 'plasma_welder', ingredients: [{ itemId: 'bearing_unit', type: 'item', quantity: 2 }, { itemId: 'iridium', type: 'ingot', quantity: 1 }], outputQuantity: 1, description: 'Extreme-load bearing' },
  { id: 'advanced_housing', name: 'Advanced Housing', category: 'component', requiredMachine: 'plasma_welder', ingredients: [{ itemId: 'control_housing', type: 'item', quantity: 1 }, { itemId: 'titanium', type: 'ingot', quantity: 2 }], outputQuantity: 1, description: 'Armored enclosure' },
  { id: 'thermal_regulator', name: 'Thermal Regulator Unit', category: 'component', requiredMachine: 'cnc_mill', ingredients: [{ itemId: 'thermal_plate', type: 'item', quantity: 2 }, { itemId: 'energy_channel', type: 'item', quantity: 1 }], outputQuantity: 1, description: 'Active heat management' },
  { id: 'energy_conduit', name: 'Energy Conduit', category: 'component', requiredMachine: 'plasma_welder', ingredients: [{ itemId: 'energy_channel', type: 'item', quantity: 2 }, { itemId: 'monazite', type: 'ingot', quantity: 1 }], outputQuantity: 1, description: 'High-capacity power line' },
  { id: 'power_transfer_unit', name: 'Power Transfer Unit', category: 'component', requiredMachine: 'plasma_welder', ingredients: [{ itemId: 'energy_conduit', type: 'item', quantity: 1 }, { itemId: 'rotary_component', type: 'item', quantity: 1 }], outputQuantity: 1, description: 'Mechanical-electrical converter' },
  { id: 'structural_matrix', name: 'Structural Matrix', category: 'component', requiredMachine: 'plasma_welder', ingredients: [{ itemId: 'structural_core', type: 'item', quantity: 2 }, { itemId: 'titanium', type: 'ingot', quantity: 2 }], outputQuantity: 1, description: 'Interconnected support grid' },
  { id: 'machine_chassis', name: 'Machine Chassis', category: 'component', requiredMachine: 'etching_station', ingredients: [{ itemId: 'iron', type: 'ingot', quantity: 10 }, { itemId: 'aluminum', type: 'ingot', quantity: 8 }, { itemId: 'copper', type: 'ingot', quantity: 5 }, { itemId: 'zinc', type: 'ingot', quantity: 4 }], outputQuantity: 1, description: 'Complete machine body' },
  { id: 'high_tension_spring', name: 'High-Tension Spring', category: 'component', requiredMachine: 'plasma_welder', ingredients: [{ itemId: 'spring_coil', type: 'item', quantity: 2 }, { itemId: 'tungsten', type: 'ingot', quantity: 2 }], outputQuantity: 2, description: 'Extreme-force spring' },
  { id: 'industrial_joint', name: 'Industrial Joint', category: 'component', requiredMachine: 'plasma_welder', ingredients: [{ itemId: 'reinforced_joint', type: 'item', quantity: 2 }, { itemId: 'titanium', type: 'ingot', quantity: 1 }], outputQuantity: 1, description: 'Heavy machinery articulation' },
  { id: 'stabilized_frame', name: 'Stabilized Frame', category: 'component', requiredMachine: 'plasma_welder', ingredients: [{ itemId: 'modular_frame', type: 'item', quantity: 1 }, { itemId: 'stabilizer_unit', type: 'item', quantity: 2 }], outputQuantity: 1, description: 'Vibration-free platform' },
  { id: 'dynamic_balancer', name: 'Dynamic Balancer', category: 'component', requiredMachine: 'plasma_welder', ingredients: [{ itemId: 'balance_assembly', type: 'item', quantity: 2 }, { itemId: 'load_bearing_unit', type: 'item', quantity: 1 }], outputQuantity: 1, description: 'Active balance system' },
  { id: 'pressure_core', name: 'Pressure Core', category: 'component', requiredMachine: 'plasma_welder', ingredients: [{ itemId: 'pressure_seal', type: 'item', quantity: 3 }, { itemId: 'structural_core', type: 'item', quantity: 1 }], outputQuantity: 1, description: 'Pressurized chamber core' },
  { id: 'flow_regulator', name: 'Flow Regulator', category: 'component', requiredMachine: 'cnc_mill', ingredients: [{ itemId: 'pressure_seal', type: 'item', quantity: 2 }, { itemId: 'precision_gear', type: 'item', quantity: 1 }, { itemId: 'cobalt', type: 'ingot', quantity: 1 }], outputQuantity: 1, description: 'Fluid flow controller' },
  { id: 'cooling_assembly', name: 'Cooling Assembly', category: 'component', requiredMachine: 'cnc_mill', ingredients: [{ itemId: 'thermal_regulator', type: 'item', quantity: 1 }, { itemId: 'flow_regulator', type: 'item', quantity: 1 }], outputQuantity: 1, description: 'Active cooling system' },
  { id: 'signal_conduit', name: 'Signal Conduit', category: 'component', requiredMachine: 'plasma_welder', ingredients: [{ itemId: 'fine_wiring', type: 'item', quantity: 2 }, { itemId: 'data_interface_base', type: 'item', quantity: 1 }, { itemId: 'gold', type: 'ingot', quantity: 2 }], outputQuantity: 1, description: 'High-bandwidth signal path' },
  { id: 'reinforced_assembly', name: 'Reinforced Assembly', category: 'component', requiredMachine: 'plasma_welder', ingredients: [{ itemId: 'compact_assembly', type: 'item', quantity: 1 }, { itemId: 'reinforced_plate', type: 'item', quantity: 2 }, { itemId: 'titanium', type: 'ingot', quantity: 1 }], outputQuantity: 1, description: 'Hardened pre-built unit' },
  { id: 'multi_phase_coupler', name: 'Multi-Phase Coupler', category: 'component', requiredMachine: 'plasma_welder', ingredients: [{ itemId: 'connector_array', type: 'item', quantity: 2 }, { itemId: 'energy_conduit', type: 'item', quantity: 1 }, { itemId: 'platinum', type: 'ingot', quantity: 1 }], outputQuantity: 1, description: 'Multi-power-phase connector' },
];

// Tier 5: High-Tech Components (71-85)
// Machine: centrifuge — high-speed separation and precision exotic-material processing
const tier5Components: CraftingRecipe[] = [
  { id: 'nano_frame', name: 'Nano Frame', category: 'component', requiredMachine: 'centrifuge', ingredients: [{ itemId: 'micro_frame', type: 'item', quantity: 2 }, { itemId: 'diamond', type: 'ingot', quantity: 1 }], outputQuantity: 1, description: 'Molecular-scale structure' },
  { id: 'precision_matrix', name: 'Precision Matrix', category: 'component', requiredMachine: 'centrifuge', ingredients: [{ itemId: 'contact_matrix', type: 'item', quantity: 2 }, { itemId: 'emerald', type: 'ingot', quantity: 1 }], outputQuantity: 1, description: 'Ultra-high-density contacts' },
  { id: 'energy_channel_core', name: 'Energy Channel Core', category: 'component', requiredMachine: 'centrifuge', ingredients: [{ itemId: 'energy_conduit', type: 'item', quantity: 2 }, { itemId: 'ruby', type: 'ingot', quantity: 1 }], outputQuantity: 1, description: 'Concentrated energy path' },
  { id: 'hyper_conductor', name: 'Hyper Conductor Assembly', category: 'component', requiredMachine: 'centrifuge', ingredients: [{ itemId: 'fine_wiring', type: 'item', quantity: 3 }, { itemId: 'sapphire', type: 'ingot', quantity: 1 }, { itemId: 'platinum', type: 'ingot', quantity: 2 }], outputQuantity: 1, description: 'Near-zero-resistance conductor' },
  { id: 'phase_coupler', name: 'Phase Coupler', category: 'component', requiredMachine: 'centrifuge', ingredients: [{ itemId: 'multi_phase_coupler', type: 'item', quantity: 1 }, { itemId: 'alexandrite', type: 'ingot', quantity: 1 }], outputQuantity: 1, description: 'Quantum phase alignment' },
  { id: 'gravity_stabilizer', name: 'Gravity Stabilizer', category: 'component', requiredMachine: 'centrifuge', ingredients: [{ itemId: 'dynamic_balancer', type: 'item', quantity: 1 }, { itemId: 'painite', type: 'ingot', quantity: 1 }], outputQuantity: 1, description: 'Gravitational compensation' },
  { id: 'fusion_housing', name: 'Fusion Housing', category: 'component', requiredMachine: 'centrifuge', ingredients: [{ itemId: 'advanced_housing', type: 'item', quantity: 1 }, { itemId: 'diamond', type: 'ingot', quantity: 2 }], outputQuantity: 1, description: 'Fusion-containment casing' },
  { id: 'energy_transfer_core', name: 'Energy Transfer Core', category: 'component', requiredMachine: 'centrifuge', ingredients: [{ itemId: 'power_transfer_unit', type: 'item', quantity: 1 }, { itemId: 'energy_channel_core', type: 'item', quantity: 1 }], outputQuantity: 1, description: 'Lossless energy transfer' },
  { id: 'high_density_assembly', name: 'High-Density Assembly', category: 'component', requiredMachine: 'centrifuge', ingredients: [{ itemId: 'reinforced_assembly', type: 'item', quantity: 1 }, { itemId: 'benitoite', type: 'ingot', quantity: 1 }], outputQuantity: 1, description: 'Compressed functional unit' },
  { id: 'smart_structural_frame', name: 'Smart Structural Frame', category: 'component', requiredMachine: 'centrifuge', ingredients: [{ itemId: 'stabilized_frame', type: 'item', quantity: 1 }, { itemId: 'signal_conduit', type: 'item', quantity: 1 }, { itemId: 'taaffeite', type: 'ingot', quantity: 1 }], outputQuantity: 1, description: 'Self-monitoring frame' },
  { id: 'advanced_coupling', name: 'Advanced Coupling Unit', category: 'component', requiredMachine: 'centrifuge', ingredients: [{ itemId: 'multi_phase_coupler', type: 'item', quantity: 1 }, { itemId: 'hyper_conductor', type: 'item', quantity: 1 }], outputQuantity: 1, description: 'Multi-dimensional coupling' },
  { id: 'energy_compression', name: 'Energy Compression Module', category: 'component', requiredMachine: 'centrifuge', ingredients: [{ itemId: 'energy_transfer_core', type: 'item', quantity: 1 }, { itemId: 'pressure_core', type: 'item', quantity: 1 }], outputQuantity: 1, description: 'Compresses energy density' },
  { id: 'nano_gear_system', name: 'Nano Gear System', category: 'component', requiredMachine: 'centrifuge', ingredients: [{ itemId: 'compact_gearbox', type: 'item', quantity: 1 }, { itemId: 'nano_frame', type: 'item', quantity: 1 }, { itemId: 'diamond', type: 'ingot', quantity: 1 }], outputQuantity: 1, description: 'Molecular-scale gears' },
  { id: 'stabilization_core', name: 'Stabilization Core', category: 'component', requiredMachine: 'centrifuge', ingredients: [{ itemId: 'gravity_stabilizer', type: 'item', quantity: 1 }, { itemId: 'structural_core', type: 'item', quantity: 1 }], outputQuantity: 1, description: 'Central stability nexus' },
  { id: 'high_precision_housing', name: 'High-Precision Housing', category: 'component', requiredMachine: 'centrifuge', ingredients: [{ itemId: 'fusion_housing', type: 'item', quantity: 1 }, { itemId: 'nano_frame', type: 'item', quantity: 1 }], outputQuantity: 1, description: 'Ultimate protective case' },
];

// Tier 6: Quantum Components (86-95)
// Machine: advanced_fab — advanced fabrication plant for quantum-scale manufacturing
const tier6Components: CraftingRecipe[] = [
  { id: 'quantum_frame', name: 'Quantum Frame', category: 'component', requiredMachine: 'advanced_fab', ingredients: [{ itemId: 'nano_frame', type: 'item', quantity: 2 }, { itemId: 'californium', type: 'ingot', quantity: 1 }], outputQuantity: 1, description: 'Quantum-stable structure' },
  { id: 'entanglement_housing', name: 'Entanglement Housing', category: 'component', requiredMachine: 'advanced_fab', ingredients: [{ itemId: 'high_precision_housing', type: 'item', quantity: 1 }, { itemId: 'neptunium', type: 'ingot', quantity: 1 }], outputQuantity: 1, description: 'Entangled particle container' },
  { id: 'phase_alignment_core', name: 'Phase Alignment Core', category: 'component', requiredMachine: 'advanced_fab', ingredients: [{ itemId: 'phase_coupler', type: 'item', quantity: 2 }, { itemId: 'plutonium', type: 'ingot', quantity: 1 }], outputQuantity: 1, description: 'Quantum phase synchronizer' },
  { id: 'time_stable_assembly', name: 'Time-Stable Assembly', category: 'component', requiredMachine: 'advanced_fab', ingredients: [{ itemId: 'stabilization_core', type: 'item', quantity: 1 }, { itemId: 'francium', type: 'ingot', quantity: 1 }], outputQuantity: 1, description: 'Temporally locked unit' },
  { id: 'dimensional_coupler', name: 'Dimensional Coupler', category: 'component', requiredMachine: 'advanced_fab', ingredients: [{ itemId: 'advanced_coupling', type: 'item', quantity: 1 }, { itemId: 'actinium', type: 'ingot', quantity: 1 }], outputQuantity: 1, description: 'Cross-dimensional connector' },
  { id: 'quantum_channel', name: 'Quantum Channel', category: 'component', requiredMachine: 'advanced_fab', ingredients: [{ itemId: 'energy_channel_core', type: 'item', quantity: 1 }, { itemId: 'protactinium', type: 'ingot', quantity: 1 }], outputQuantity: 1, description: 'Quantum energy pathway' },
  { id: 'energy_singularity_housing', name: 'Energy Singularity Housing', category: 'component', requiredMachine: 'advanced_fab', ingredients: [{ itemId: 'fusion_housing', type: 'item', quantity: 1 }, { itemId: 'scandium', type: 'ingot', quantity: 1 }, { itemId: 'energy_compression', type: 'item', quantity: 1 }], outputQuantity: 1, description: 'Singularity containment' },
  { id: 'reality_stabilizer', name: 'Reality Stabilizer', category: 'component', requiredMachine: 'advanced_fab', ingredients: [{ itemId: 'gravity_stabilizer', type: 'item', quantity: 1 }, { itemId: 'yttrium', type: 'ingot', quantity: 1 }, { itemId: 'time_stable_assembly', type: 'item', quantity: 1 }], outputQuantity: 1, description: 'Fabric-of-reality anchor' },
  { id: 'quantum_structural_matrix', name: 'Quantum Structural Matrix', category: 'component', requiredMachine: 'advanced_fab', ingredients: [{ itemId: 'structural_matrix', type: 'item', quantity: 1 }, { itemId: 'quantum_frame', type: 'item', quantity: 1 }, { itemId: 'lanthanum', type: 'ingot', quantity: 1 }], outputQuantity: 1, description: 'Quantum-reinforced grid' },
  { id: 'temporal_stabilizer', name: 'Temporal Stabilizer Unit', category: 'component', requiredMachine: 'advanced_fab', ingredients: [{ itemId: 'reality_stabilizer', type: 'item', quantity: 1 }, { itemId: 'cerium', type: 'ingot', quantity: 1 }], outputQuantity: 1, description: 'Time-flow regulator' },
];

// Tier 7: Void / Crystalix (96-100)
// Machine: quantum_lab — quantum research facility for void-matter manipulation
const tier7Components: CraftingRecipe[] = [
  { id: 'veinite_core', name: 'Veinite Structural Core', category: 'component', requiredMachine: 'quantum_lab', ingredients: [{ itemId: 'structural_matrix', type: 'item', quantity: 1 }, { itemId: 'veinite', type: 'ingot', quantity: 2 }], outputQuantity: 1, description: 'Living structure core' },
  { id: 'void_frame', name: 'Void Frame', category: 'component', requiredMachine: 'quantum_lab', ingredients: [{ itemId: 'quantum_frame', type: 'item', quantity: 1 }, { itemId: 'void_crystal', type: 'ingot', quantity: 2 }], outputQuantity: 1, description: 'Null-space frame' },
  { id: 'entropy_assembly', name: 'Entropy Assembly', category: 'component', requiredMachine: 'quantum_lab', ingredients: [{ itemId: 'time_stable_assembly', type: 'item', quantity: 1 }, { itemId: 'entropy_shard', type: 'ingot', quantity: 2 }], outputQuantity: 1, description: 'Entropy-harnessing unit' },
  { id: 'dark_matter_housing', name: 'Dark Matter Housing', category: 'component', requiredMachine: 'quantum_lab', ingredients: [{ itemId: 'entanglement_housing', type: 'item', quantity: 1 }, { itemId: 'dark_matter', type: 'ingot', quantity: 2 }], outputQuantity: 1, description: 'Dark matter containment' },
  { id: 'singularity_chassis', name: 'Singularity Chassis', category: 'component', requiredMachine: 'quantum_lab', ingredients: [{ itemId: 'machine_chassis', type: 'item', quantity: 1 }, { itemId: 'singularity', type: 'ingot', quantity: 2 }, { itemId: 'void_frame', type: 'item', quantity: 1 }], outputQuantity: 1, description: 'Ultimate machine body' },
];

// ─── Electronics ─────────────────────────────────────────────────────────────
const electronics: CraftingRecipe[] = [
  // Basic Electronics — laser_cutter: precision cutting for circuit substrates and basic components
  { id: 'resistor', name: 'Resistor', category: 'electronic', requiredMachine: 'laser_cutter', ingredients: [{ itemId: 'insulated_layer', type: 'item', quantity: 1 }, { itemId: 'graphite', type: 'ingot', quantity: 1 }], outputQuantity: 4, description: 'Limits current flow' },
  { id: 'capacitor', name: 'Capacitor', category: 'electronic', requiredMachine: 'laser_cutter', ingredients: [{ itemId: 'metal_plate', type: 'item', quantity: 1 }, { itemId: 'energy_channel', type: 'item', quantity: 1 }], outputQuantity: 3, description: 'Stores electrical charge' },
  { id: 'transistor', name: 'Transistor', category: 'electronic', requiredMachine: 'laser_cutter', ingredients: [{ itemId: 'quartz', type: 'ingot', quantity: 1 }, { itemId: 'fine_wiring', type: 'item', quantity: 1 }, { itemId: 'fastener_set', type: 'item', quantity: 1 }], outputQuantity: 2, description: 'Semiconductor switch' },
  { id: 'diode', name: 'Diode', category: 'electronic', requiredMachine: 'laser_cutter', ingredients: [{ itemId: 'quartz', type: 'ingot', quantity: 1 }, { itemId: 'contact_pin', type: 'item', quantity: 1 }], outputQuantity: 3, description: 'One-way current gate' },
  { id: 'inductor', name: 'Inductor', category: 'electronic', requiredMachine: 'laser_cutter', ingredients: [{ itemId: 'wire_bundle', type: 'item', quantity: 2 }, { itemId: 'rotary_component', type: 'item', quantity: 1 }], outputQuantity: 2, description: 'Magnetic energy storage coil' },

  // Intermediate Electronics — chemical_reactor: chemical etching and deposition for PCBs/logic
  { id: 'pcb_blank', name: 'PCB (Blank)', category: 'electronic', requiredMachine: 'chemical_reactor', ingredients: [{ itemId: 'insulated_panel', type: 'item', quantity: 1 }, { itemId: 'wire_bundle', type: 'item', quantity: 1 }], outputQuantity: 1, description: 'Unpopulated circuit board' },
  { id: 'led', name: 'LED', category: 'electronic', requiredMachine: 'chemical_reactor', ingredients: [{ itemId: 'quartz', type: 'ingot', quantity: 1 }, { itemId: 'fine_wiring', type: 'item', quantity: 1 }], outputQuantity: 3, description: 'Light-emitting diode' },
  { id: 'signal_amplifier', name: 'Signal Amplifier', category: 'electronic', requiredMachine: 'chemical_reactor', ingredients: [{ itemId: 'transistor', type: 'item', quantity: 3 }, { itemId: 'resistor', type: 'item', quantity: 2 }], outputQuantity: 1, description: 'Boosts signal strength' },
  { id: 'motor_controller', name: 'Motor Controller', category: 'electronic', requiredMachine: 'chemical_reactor', ingredients: [{ itemId: 'transistor', type: 'item', quantity: 4 }, { itemId: 'capacitor', type: 'item', quantity: 2 }, { itemId: 'diode', type: 'item', quantity: 2 }], outputQuantity: 1, description: 'Speed and direction control' },
  { id: 'power_regulator', name: 'Power Regulator', category: 'electronic', requiredMachine: 'chemical_reactor', ingredients: [{ itemId: 'inductor', type: 'item', quantity: 2 }, { itemId: 'capacitor', type: 'item', quantity: 2 }, { itemId: 'diode', type: 'item', quantity: 2 }, { itemId: 'resistor', type: 'item', quantity: 4 }], outputQuantity: 1, description: 'Voltage regulation circuit' },

  // Advanced Electronics — chemical_reactor for logic/memory, lithography for processors
  { id: 'logic_controller', name: 'Logic Controller', category: 'electronic', requiredMachine: 'laser_cutter', ingredients: [{ itemId: 'insulated_panel', type: 'item', quantity: 1 }, { itemId: 'contact_pin', type: 'item', quantity: 4 }, { itemId: 'fine_wiring', type: 'item', quantity: 1 }, { itemId: 'fastener_set', type: 'item', quantity: 2 }], outputQuantity: 1, description: 'Programmable logic unit' },
  { id: 'memory_module', name: 'Memory Module', category: 'electronic', requiredMachine: 'chemical_reactor', ingredients: [{ itemId: 'insulated_panel', type: 'item', quantity: 1 }, { itemId: 'metal_plate', type: 'item', quantity: 8 }, { itemId: 'contact_pin', type: 'item', quantity: 4 }, { itemId: 'fastener_set', type: 'item', quantity: 2 }], outputQuantity: 1, description: 'DRAM storage module' },
  { id: 'processor', name: 'Processor', category: 'electronic', requiredMachine: 'lithography_machine', ingredients: [{ itemId: 'compact_assembly', type: 'item', quantity: 1 }, { itemId: 'signal_contact', type: 'item', quantity: 2 }, { itemId: 'contact_pin', type: 'item', quantity: 8 }, { itemId: 'fastener_set', type: 'item', quantity: 4 }], outputQuantity: 1, description: 'Advanced computation unit' },
  { id: 'microcontroller', name: 'Microcontroller', category: 'electronic', requiredMachine: 'lithography_machine', ingredients: [{ itemId: 'compact_assembly', type: 'item', quantity: 1 }, { itemId: 'transistor', type: 'item', quantity: 6 }, { itemId: 'memory_module', type: 'item', quantity: 1 }], outputQuantity: 1, description: 'Simple programmable processor' },
  { id: 'gpu_core', name: 'GPU Core', category: 'electronic', requiredMachine: 'advanced_fab', ingredients: [{ itemId: 'compact_assembly', type: 'item', quantity: 2 }, { itemId: 'transistor', type: 'item', quantity: 16 }, { itemId: 'memory_module', type: 'item', quantity: 2 }, { itemId: 'cooling_assembly', type: 'item', quantity: 1 }], outputQuantity: 1, description: 'Graphics processing unit' },
  { id: 'quantum_gate', name: 'Quantum Gate', category: 'electronic', requiredMachine: 'quantum_lab', ingredients: [{ itemId: 'platinum', type: 'ingot', quantity: 3 }, { itemId: 'hyper_conductor', type: 'item', quantity: 1 }, { itemId: 'energy_channel_core', type: 'item', quantity: 1 }], outputQuantity: 1, description: 'Quantum computation element' },
];

// ─── Machines ────────────────────────────────────────────────────────────────
// Machines themselves have no requiredMachine — they are assembled in the Craft tab
const machines: CraftingRecipe[] = [
  // ── Basic Machines ───────────────────────────────────────────────────────────
  // These are the first machines crafted, so their ingredients must be pure ingots
  // (no requiredMachine on any ingredient).

  // wafer_cutter: first machine unlocked; iron/copper/aluminum ingots only
  { id: 'wafer_cutter', name: 'Wafer Cutter', category: 'machine', ingredients: [
    { itemId: 'iron', type: 'ingot', quantity: 20 },
    { itemId: 'copper', type: 'ingot', quantity: 10 },
    { itemId: 'aluminum', type: 'ingot', quantity: 8 },
    { itemId: 'tin', type: 'ingot', quantity: 5 },
  ], outputQuantity: 1, description: 'Precision silicon cutting tool' },

  // etching_station: second basic machine; adds zinc/nickel for hardened parts
  { id: 'etching_station', name: 'Etching Station', category: 'machine', ingredients: [
    { itemId: 'iron', type: 'ingot', quantity: 25 },
    { itemId: 'copper', type: 'ingot', quantity: 15 },
    { itemId: 'zinc', type: 'ingot', quantity: 10 },
    { itemId: 'lead', type: 'ingot', quantity: 8 },
  ], outputQuantity: 1, description: 'Chemical etching for PCB traces' },

  // lithography_machine: requires quartz + silver (tier 2/3 ores) — mid basic tier
  { id: 'lithography_machine', name: 'Lithography Machine', category: 'machine', ingredients: [
    { itemId: 'iron', type: 'ingot', quantity: 20 },
    { itemId: 'aluminum', type: 'ingot', quantity: 15 },
    { itemId: 'quartz', type: 'ingot', quantity: 10 },
    { itemId: 'silver', type: 'ingot', quantity: 5 },
    { itemId: 'copper', type: 'ingot', quantity: 10 },
  ], outputQuantity: 1, description: 'UV lithography for chip fabrication' },

  // ── Intermediate Machines ────────────────────────────────────────────────────
  // Built after basic machines exist; can use items produced by wafer_cutter / etching_station / lithography_machine.

  // cnc_mill: uses etching_station items (machine_chassis, gear_assembly, shaft_component) + lithography_machine (processor) + laser_cutter (logic_controller)
  { id: 'cnc_mill', name: 'CNC Mill', category: 'machine', ingredients: [
    { itemId: 'machine_chassis', type: 'item', quantity: 1 },
    { itemId: 'gear_assembly', type: 'item', quantity: 2 },
    { itemId: 'shaft_component', type: 'item', quantity: 2 },
    { itemId: 'connector_array', type: 'item', quantity: 2 },
    { itemId: 'rotary_component', type: 'item', quantity: 1 },
  ], outputQuantity: 1, description: 'Precision machining centerpiece' },

  // laser_cutter: built after cnc_mill; uses cnc_mill outputs (energy_channel, fine_wiring, micro_frame)
  { id: 'laser_cutter', name: 'Laser Cutter', category: 'machine', ingredients: [
    { itemId: 'machine_chassis', type: 'item', quantity: 1 },
    { itemId: 'energy_channel', type: 'item', quantity: 2 },
    { itemId: 'fine_wiring', type: 'item', quantity: 3 },
    { itemId: 'micro_frame', type: 'item', quantity: 2 },
  ], outputQuantity: 1, description: 'Precision laser cutting system' },

  // plasma_welder: needs cnc_mill outputs (thermal_regulator) + chemical_reactor outputs (power_regulator)
  { id: 'plasma_welder', name: 'Plasma Welder', category: 'machine', ingredients: [
    { itemId: 'machine_chassis', type: 'item', quantity: 1 },
    { itemId: 'thermal_regulator', type: 'item', quantity: 2 },
    { itemId: 'power_regulator', type: 'item', quantity: 2 },
  ], outputQuantity: 1, description: 'High-temperature fusion welding' },

  // chemical_reactor: needs plasma_welder outputs (pressure_core) + logic_controller (chemical_reactor)
  // Bootstrap: logic_controller requires chemical_reactor — move chemical_reactor to use laser_cutter outputs instead
  { id: 'chemical_reactor', name: 'Chemical Reactor', category: 'machine', ingredients: [
    { itemId: 'machine_chassis', type: 'item', quantity: 1 },
    { itemId: 'control_housing', type: 'item', quantity: 1 },
    { itemId: 'resistor', type: 'item', quantity: 6 },
    { itemId: 'capacitor', type: 'item', quantity: 4 },
  ], outputQuantity: 1, description: 'Batch chemical synthesis unit' },

  // centrifuge: needs plasma_welder (dynamic_balancer) + chemical_reactor (motor_controller)
  { id: 'centrifuge', name: 'Centrifuge', category: 'machine', ingredients: [
    { itemId: 'machine_chassis', type: 'item', quantity: 1 },
    { itemId: 'dynamic_balancer', type: 'item', quantity: 1 },
    { itemId: 'motor_controller', type: 'item', quantity: 1 },
  ], outputQuantity: 1, description: 'High-speed separation apparatus' },

  // ── Advanced Machines ────────────────────────────────────────────────────────
  { id: 'advanced_fab', name: 'Advanced Fabrication Plant', category: 'machine', ingredients: [
    { itemId: 'smart_structural_frame', type: 'item', quantity: 1 },
    { itemId: 'precision_matrix', type: 'item', quantity: 1 },
    { itemId: 'microcontroller', type: 'item', quantity: 4 },
    { itemId: 'high_precision_housing', type: 'item', quantity: 1 },
  ], outputQuantity: 1, description: 'State-of-the-art chip manufacturing' },

  { id: 'quantum_lab', name: 'Quantum Lab', category: 'machine', ingredients: [
    { itemId: 'quantum_structural_matrix', type: 'item', quantity: 1 },
    { itemId: 'entanglement_housing', type: 'item', quantity: 1 },
    { itemId: 'hyper_conductor', type: 'item', quantity: 3 },
    { itemId: 'phase_alignment_core', type: 'item', quantity: 1 },
  ], outputQuantity: 1, description: 'Quantum research facility' },

  // ── Greenhouse ──────────────────────────────────────────────────────────────
  { id: 'greenhouse', name: 'Greenhouse', category: 'machine', ingredients: [
    { itemId: 'plant_in_a_boot', type: 'item', quantity: 1 },
    { itemId: 'veinite', type: 'ingot', quantity: 3 },
  ], outputQuantity: 1, description: 'A structure for growing plants. Unlocks the Garden tab.' },
];

// ─── Combined Recipe List ────────────────────────────────────────────────────
export const CRAFTING_RECIPES: CraftingRecipe[] = [
  ...tier1Components,
  ...tier2Components,
  ...tier3Components,
  ...tier4Components,
  ...tier5Components,
  ...tier6Components,
  ...tier7Components,
  ...electronics,
  ...machines,
];

export const RECIPE_MAP: Record<string, CraftingRecipe> = {};
CRAFTING_RECIPES.forEach(r => { RECIPE_MAP[r.id] = r; });

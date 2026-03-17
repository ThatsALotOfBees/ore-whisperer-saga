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
  // Basic Components (Tier 1-2)
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

  // Additional Basic Components (Tier 2-3)
  { id: 'titanium_alloy', name: 'Titanium Alloy Sheet', category: 'component', ingredients: [{ itemId: 'titanium', type: 'ingot', quantity: 3 }, { itemId: 'aluminum', type: 'ingot', quantity: 2 }], outputQuantity: 2, description: 'Lightweight high-strength material' },
  { id: 'thermal_paste', name: 'Thermal Paste', category: 'component', ingredients: [{ itemId: 'copper', type: 'ingot', quantity: 2 }, { itemId: 'silver', type: 'ingot', quantity: 1 }], outputQuantity: 4, description: 'Thermally conductive compound' },
  { id: 'heat_sink', name: 'Heat Sink', category: 'component', ingredients: [{ itemId: 'aluminum', type: 'ingot', quantity: 4 }, { itemId: 'copper_foil', type: 'item', quantity: 2 }], outputQuantity: 1, description: 'Dissipates excess heat' },
  { id: 'substrate_film', name: 'Substrate Film', category: 'component', ingredients: [{ itemId: 'silicon', type: 'ingot', quantity: 3 }, { itemId: 'lead', type: 'ingot', quantity: 1 }], outputQuantity: 3, description: 'Base layer for components' },
  { id: 'epoxy_resin', name: 'Epoxy Resin', category: 'component', ingredients: [{ itemId: 'tin', type: 'ingot', quantity: 2 }, { itemId: 'copper', type: 'ingot', quantity: 1 }], outputQuantity: 3, description: 'Binding and protective coating' },
  { id: 'glass_insulator', name: 'Glass Insulator', category: 'component', ingredients: [{ itemId: 'silicon', type: 'ingot', quantity: 2 }], outputQuantity: 4, description: 'Electrical insulation' },
  { id: 'magnetic_core', name: 'Magnetic Core', category: 'component', ingredients: [{ itemId: 'iron', type: 'ingot', quantity: 4 }], outputQuantity: 2, description: 'Ferrite coil core' },
  { id: 'silver_paste', name: 'Silver Paste', category: 'component', ingredients: [{ itemId: 'silver', type: 'ingot', quantity: 2 }, { itemId: 'copper', type: 'ingot', quantity: 1 }], outputQuantity: 3, description: 'Conductive paste for bonding' },
  { id: 'mica_sheet', name: 'Mica Sheet', category: 'component', ingredients: [{ itemId: 'silicon', type: 'ingot', quantity: 1 }], outputQuantity: 5, description: 'High-temperature insulator' },
  { id: 'copper_powder', name: 'Copper Powder', category: 'component', ingredients: [{ itemId: 'copper', type: 'ingot', quantity: 3 }], outputQuantity: 6, description: 'Finely divided copper particles' },

  // Mid-tier Components (Tier 3-4)
  { id: 'gold_plating', name: 'Gold Plating', category: 'component', ingredients: [{ itemId: 'gold', type: 'ingot', quantity: 1 }, { itemId: 'silver', type: 'ingot', quantity: 1 }], outputQuantity: 2, description: 'Corrosion-resistant coating' },
  { id: 'crystal_oscillator', name: 'Crystal Oscillator', category: 'component', ingredients: [{ itemId: 'titanium', type: 'ingot', quantity: 1 }, { itemId: 'gold_wire', type: 'item', quantity: 1 }], outputQuantity: 1, description: 'Frequency reference element' },
  { id: 'vacuum_tube', name: 'Vacuum Tube', category: 'component', ingredients: [{ itemId: 'glass_insulator', type: 'item', quantity: 2 }, { itemId: 'copper_foil', type: 'item', quantity: 1 }], outputQuantity: 1, description: 'Electron emission device' },
  { id: 'relay_switch', name: 'Relay Switch', category: 'component', ingredients: [{ itemId: 'copper', type: 'ingot', quantity: 2 }, { itemId: 'magnetic_core', type: 'item', quantity: 1 }], outputQuantity: 2, description: 'Electromagnetic switch' },
  { id: 'voltage_converter', name: 'Voltage Converter', category: 'component', ingredients: [{ itemId: 'titanium', type: 'ingot', quantity: 2 }, { itemId: 'inductor', type: 'item', quantity: 1 }], outputQuantity: 1, description: 'Steps voltage up or down' },
  { id: 'circuit_breaker', name: 'Circuit Breaker', category: 'component', ingredients: [{ itemId: 'copper', type: 'ingot', quantity: 2 }, { itemId: 'silver', type: 'ingot', quantity: 1 }], outputQuantity: 2, description: 'Overcurrent protection device' },
  { id: 'transformer_core', name: 'Transformer Core', category: 'component', ingredients: [{ itemId: 'iron', type: 'ingot', quantity: 5 }, { itemId: 'copper', type: 'ingot', quantity: 2 }], outputQuantity: 1, description: 'Magnetic coupling element' },
  { id: 'platinum_electrode', name: 'Platinum Electrode', category: 'component', ingredients: [{ itemId: 'platinum', type: 'ingot', quantity: 2 }], outputQuantity: 2, description: 'Stable electrochemical interface' },
  { id: 'rare_earth_magnet', name: 'Rare Earth Magnet', category: 'component', ingredients: [{ itemId: 'neodymium', type: 'ingot', quantity: 3 }], outputQuantity: 1, description: 'Powerful permanent magnet' },
  { id: 'carbon_nanotube', name: 'Carbon Nanotube Bundle', category: 'component', ingredients: [{ itemId: 'lead', type: 'ingot', quantity: 2 }, { itemId: 'carbon_film', type: 'item', quantity: 1 }], outputQuantity: 1, description: 'Molecular-scale wire' },

  // Advanced Components (Tier 4-5)
  { id: 'quantum_dot', name: 'Quantum Dot', category: 'component', ingredients: [{ itemId: 'silicon', type: 'ingot', quantity: 3 }, { itemId: 'rare_earth_magnet', type: 'item', quantity: 1 }], outputQuantity: 1, description: 'Nanoscale light emitter' },
  { id: 'graphene_sheet', name: 'Graphene Sheet', category: 'component', ingredients: [{ itemId: 'carbon_film', type: 'item', quantity: 3 }], outputQuantity: 1, description: 'Single-atom-thick carbon lattice' },
  { id: 'superconductor', name: 'Superconductor Wire', category: 'component', ingredients: [{ itemId: 'platinum', type: 'ingot', quantity: 4 }, { itemId: 'gold_wire', type: 'item', quantity: 2 }], outputQuantity: 1, description: 'Zero-resistance conductor' },
  { id: 'holographic_matrix', name: 'Holographic Matrix', category: 'component', ingredients: [{ itemId: 'titanium', type: 'ingot', quantity: 3 }, { itemId: 'crystal_oscillator', type: 'item', quantity: 1 }], outputQuantity: 1, description: 'Three-dimensional data storage' },
  { id: 'ion_channel', name: 'Ion Channel', category: 'component', ingredients: [{ itemId: 'platinum', type: 'ingot', quantity: 2 }, { itemId: 'electrolyte_solution', type: 'item', quantity: 2 }], outputQuantity: 1, description: 'Ionic transport device' },

  // Electronics (Basic)
  { id: 'resistor', name: 'Resistor', category: 'electronic', ingredients: [{ itemId: 'ceramic_base', type: 'item', quantity: 1 }, { itemId: 'carbon_film', type: 'item', quantity: 1 }], outputQuantity: 4, description: 'Limits current flow' },
  { id: 'capacitor', name: 'Capacitor', category: 'electronic', ingredients: [{ itemId: 'aluminum', type: 'ingot', quantity: 1 }, { itemId: 'electrolyte_solution', type: 'item', quantity: 1 }], outputQuantity: 3, description: 'Stores electrical charge' },
  { id: 'transistor', name: 'Transistor', category: 'electronic', ingredients: [{ itemId: 'silicon', type: 'ingot', quantity: 1 }, { itemId: 'gold_wire', type: 'item', quantity: 1 }, { itemId: 'solder', type: 'item', quantity: 1 }], outputQuantity: 2, description: 'Semiconductor switch' },
  { id: 'diode', name: 'Diode', category: 'electronic', ingredients: [{ itemId: 'silicon', type: 'ingot', quantity: 1 }, { itemId: 'copper_trace', type: 'item', quantity: 1 }], outputQuantity: 3, description: 'One-way current gate' },
  { id: 'inductor', name: 'Inductor', category: 'electronic', ingredients: [{ itemId: 'copper', type: 'ingot', quantity: 3 }, { itemId: 'iron', type: 'ingot', quantity: 1 }], outputQuantity: 2, description: 'Magnetic energy storage coil' },

  // Electronics (Intermediate)
  { id: 'pcb_blank', name: 'PCB (Blank)', category: 'electronic', ingredients: [{ itemId: 'fiberglass_sheet', type: 'item', quantity: 1 }, { itemId: 'copper_foil', type: 'item', quantity: 1 }], outputQuantity: 1, description: 'Unpopulated circuit board' },
  { id: 'led', name: 'LED', category: 'electronic', ingredients: [{ itemId: 'silicon', type: 'ingot', quantity: 1 }, { itemId: 'gold_wire', type: 'item', quantity: 1 }], outputQuantity: 3, description: 'Light-emitting diode' },
  { id: 'photoresistor', name: 'Photoresistor', category: 'electronic', ingredients: [{ itemId: 'silicon', type: 'ingot', quantity: 1 }, { itemId: 'carbon_film', type: 'item', quantity: 1 }], outputQuantity: 2, description: 'Light-sensitive resistance' },
  { id: 'hall_effect_sensor', name: 'Hall Effect Sensor', category: 'electronic', ingredients: [{ itemId: 'silicon', type: 'ingot', quantity: 2 }, { itemId: 'rare_earth_magnet', type: 'item', quantity: 1 }], outputQuantity: 1, description: 'Magnetic field detector' },
  { id: 'strain_gauge', name: 'Strain Gauge', category: 'electronic', ingredients: [{ itemId: 'copper', type: 'ingot', quantity: 1 }, { itemId: 'carbon_film', type: 'item', quantity: 2 }], outputQuantity: 2, description: 'Mechanical stress sensor' },
  { id: 'accelerometer', name: 'Accelerometer', category: 'electronic', ingredients: [{ itemId: 'silicon', type: 'ingot', quantity: 2 }, { itemId: 'titanium', type: 'ingot', quantity: 1 }], outputQuantity: 1, description: 'Motion detection sensor' },
  { id: 'gyroscope', name: 'Gyroscope', category: 'electronic', ingredients: [{ itemId: 'titanium', type: 'ingot', quantity: 2 }, { itemId: 'rare_earth_magnet', type: 'item', quantity: 1 }], outputQuantity: 1, description: 'Rotation detection sensor' },
  { id: 'signal_amplifier', name: 'Signal Amplifier', category: 'electronic', ingredients: [{ itemId: 'transistor', type: 'item', quantity: 3 }, { itemId: 'resistor', type: 'item', quantity: 2 }], outputQuantity: 1, description: 'Boosts signal strength' },
  { id: 'adc_converter', name: 'ADC Converter', category: 'electronic', ingredients: [{ itemId: 'capacitor', type: 'item', quantity: 4 }, { itemId: 'transistor', type: 'item', quantity: 2 }], outputQuantity: 1, description: 'Analog to digital converter' },
  { id: 'microcontroller', name: 'Microcontroller', category: 'electronic', ingredients: [{ itemId: 'silicon_wafer', type: 'item', quantity: 1 }, { itemId: 'transistor', type: 'item', quantity: 6 }, { itemId: 'memory_module', type: 'item', quantity: 1 }], outputQuantity: 1, requiredMachine: 'lithography_machine', description: 'Simple programmable processor' },
  { id: 'fpga_chip', name: 'FPGA Chip', category: 'electronic', ingredients: [{ itemId: 'silicon_wafer', type: 'item', quantity: 1 }, { itemId: 'transistor', type: 'item', quantity: 12 }, { itemId: 'gold_trace', type: 'item', quantity: 2 }], outputQuantity: 1, requiredMachine: 'lithography_machine', description: 'Reconfigurable logic array' },
  { id: 'radio_transceiver', name: 'Radio Transceiver', category: 'electronic', ingredients: [{ itemId: 'crystal_oscillator', type: 'item', quantity: 1 }, { itemId: 'signal_amplifier', type: 'item', quantity: 2 }, { itemId: 'inductor', type: 'item', quantity: 2 }], outputQuantity: 1, description: 'Wireless communication module' },

  // Electronics (Advanced)
  { id: 'logic_controller', name: 'Logic Controller', category: 'electronic', ingredients: [{ itemId: 'pcb_blank', type: 'item', quantity: 1 }, { itemId: 'transistor', type: 'item', quantity: 4 }, { itemId: 'gold_wire', type: 'item', quantity: 1 }, { itemId: 'solder', type: 'item', quantity: 2 }], outputQuantity: 1, description: 'Programmable logic unit' },
  { id: 'processor', name: 'Processor', category: 'electronic', ingredients: [{ itemId: 'silicon_wafer', type: 'item', quantity: 1 }, { itemId: 'gold_trace', type: 'item', quantity: 2 }, { itemId: 'transistor', type: 'item', quantity: 8 }, { itemId: 'solder', type: 'item', quantity: 4 }], outputQuantity: 1, requiredMachine: 'lithography_machine', description: 'Advanced computation unit' },
  { id: 'memory_module', name: 'Memory Module', category: 'electronic', ingredients: [{ itemId: 'pcb_blank', type: 'item', quantity: 1 }, { itemId: 'capacitor', type: 'item', quantity: 8 }, { itemId: 'transistor', type: 'item', quantity: 4 }, { itemId: 'solder', type: 'item', quantity: 2 }], outputQuantity: 1, description: 'DRAM storage module' },
  { id: 'power_regulator', name: 'Power Regulator', category: 'electronic', ingredients: [{ itemId: 'inductor', type: 'item', quantity: 2 }, { itemId: 'capacitor', type: 'item', quantity: 2 }, { itemId: 'diode', type: 'item', quantity: 2 }, { itemId: 'resistor', type: 'item', quantity: 4 }], outputQuantity: 1, description: 'Voltage regulation circuit' },
  { id: 'gpu_core', name: 'GPU Core', category: 'electronic', ingredients: [{ itemId: 'silicon_wafer', type: 'item', quantity: 2 }, { itemId: 'transistor', type: 'item', quantity: 16 }, { itemId: 'memory_module', type: 'item', quantity: 2 }, { itemId: 'heat_sink', type: 'item', quantity: 1 }], outputQuantity: 1, requiredMachine: 'advanced_fab', description: 'Graphics processing unit' },
  { id: 'neural_accelerator', name: 'Neural Accelerator', category: 'electronic', ingredients: [{ itemId: 'fpga_chip', type: 'item', quantity: 2 }, { itemId: 'processor', type: 'item', quantity: 1 }, { itemId: 'memory_module', type: 'item', quantity: 3 }], outputQuantity: 1, requiredMachine: 'quantum_lab', description: 'AI computation module' },
  { id: 'quantum_gate', name: 'Quantum Gate', category: 'electronic', ingredients: [{ itemId: 'platinum', type: 'ingot', quantity: 3 }, { itemId: 'superconductor', type: 'item', quantity: 1 }, { itemId: 'holographic_matrix', type: 'item', quantity: 1 }], outputQuantity: 1, requiredMachine: 'quantum_lab', description: 'Quantum computation element' },
  { id: 'biochip', name: 'Biochip', category: 'electronic', ingredients: [{ itemId: 'silicon_wafer', type: 'item', quantity: 1 }, { itemId: 'ion_channel', type: 'item', quantity: 2 }, { itemId: 'protein_scaffold', type: 'item', quantity: 1 }], outputQuantity: 1, requiredMachine: 'bio_synthesizer', description: 'Biological-silicon hybrid' },

  // Machines (Basic)
  { id: 'wafer_cutter', name: 'Wafer Cutter', category: 'machine', ingredients: [{ itemId: 'titanium', type: 'ingot', quantity: 5 }, { itemId: 'platinum', type: 'ingot', quantity: 2 }, { itemId: 'logic_controller', type: 'item', quantity: 1 }], outputQuantity: 1, description: 'Precision silicon cutting tool' },
  { id: 'lithography_machine', name: 'Lithography Machine', category: 'machine', ingredients: [{ itemId: 'titanium', type: 'ingot', quantity: 10 }, { itemId: 'gold', type: 'ingot', quantity: 5 }, { itemId: 'logic_controller', type: 'item', quantity: 2 }, { itemId: 'power_regulator', type: 'item', quantity: 1 }], outputQuantity: 1, description: 'UV lithography for chip fabrication' },
  { id: 'etching_station', name: 'Etching Station', category: 'machine', ingredients: [{ itemId: 'silver', type: 'ingot', quantity: 5 }, { itemId: 'titanium', type: 'ingot', quantity: 3 }, { itemId: 'logic_controller', type: 'item', quantity: 1 }], outputQuantity: 1, description: 'Chemical etching for PCB traces' },

  // Machines (Intermediate)
  { id: 'cnc_mill', name: 'CNC Mill', category: 'machine', ingredients: [{ itemId: 'titanium', type: 'ingot', quantity: 15 }, { itemId: 'platinum', type: 'ingot', quantity: 5 }, { itemId: 'logic_controller', type: 'item', quantity: 3 }, { itemId: 'processor', type: 'item', quantity: 1 }], outputQuantity: 1, description: 'Precision machining centerpiece' },
  { id: 'injection_molder', name: 'Injection Molder', category: 'machine', ingredients: [{ itemId: 'titanium', type: 'ingot', quantity: 12 }, { itemId: 'heat_sink', type: 'item', quantity: 3 }, { itemId: 'logic_controller', type: 'item', quantity: 2 }, { itemId: 'power_regulator', type: 'item', quantity: 1 }], outputQuantity: 1, description: 'Polymer injection molding system' },
  { id: '3d_printer', name: '3D Printer', category: 'machine', ingredients: [{ itemId: 'titanium', type: 'ingot', quantity: 10 }, { itemId: 'aluminum', type: 'ingot', quantity: 5 }, { itemId: 'logic_controller', type: 'item', quantity: 2 }, { itemId: 'adc_converter', type: 'item', quantity: 1 }], outputQuantity: 1, description: 'Additive manufacturing apparatus' },
  { id: 'laser_cutter', name: 'Laser Cutter', category: 'machine', ingredients: [{ itemId: 'titanium', type: 'ingot', quantity: 8 }, { itemId: 'gold', type: 'ingot', quantity: 3 }, { itemId: 'crystal_oscillator', type: 'item', quantity: 1 }, { itemId: 'logic_controller', type: 'item', quantity: 1 }], outputQuantity: 1, description: 'Precision laser cutting system' },
  { id: 'plasma_welder', name: 'Plasma Welder', category: 'machine', ingredients: [{ itemId: 'titanium', type: 'ingot', quantity: 12 }, { itemId: 'platinum', type: 'ingot', quantity: 4 }, { itemId: 'power_regulator', type: 'item', quantity: 2 }, { itemId: 'heat_sink', type: 'item', quantity: 2 }], outputQuantity: 1, description: 'High-temperature fusion welding' },
  { id: 'chemical_reactor', name: 'Chemical Reactor', category: 'machine', ingredients: [{ itemId: 'titanium', type: 'ingot', quantity: 10 }, { itemId: 'platinum', type: 'ingot', quantity: 3 }, { itemId: 'logic_controller', type: 'item', quantity: 2 }], outputQuantity: 1, description: 'Batch chemical synthesis unit' },
  { id: 'centrifuge', name: 'Centrifuge', category: 'machine', ingredients: [{ itemId: 'titanium', type: 'ingot', quantity: 8 }, { itemId: 'aluminum', type: 'ingot', quantity: 4 }, { itemId: 'motor_controller', type: 'item', quantity: 1 }], outputQuantity: 1, description: 'High-speed separation apparatus' },

  // Machines (Advanced)
  { id: 'vacuum_chamber', name: 'Vacuum Chamber', category: 'machine', ingredients: [{ itemId: 'titanium', type: 'ingot', quantity: 15 }, { itemId: 'platinum', type: 'ingot', quantity: 6 }, { itemId: 'power_regulator', type: 'item', quantity: 2 }, { itemId: 'logic_controller', type: 'item', quantity: 2 }], outputQuantity: 1, description: 'Ultra-high vacuum environment' },
  { id: 'clean_room', name: 'Clean Room', category: 'machine', ingredients: [{ itemId: 'titanium', type: 'ingot', quantity: 20 }, { itemId: 'platinum', type: 'ingot', quantity: 8 }, { itemId: 'microcontroller', type: 'item', quantity: 3 }, { itemId: 'logic_controller', type: 'item', quantity: 3 }], outputQuantity: 1, description: 'Particle-filtered assembly space' },
  { id: 'quantum_processor', name: 'Quantum Processor Fab', category: 'machine', ingredients: [{ itemId: 'platinum', type: 'ingot', quantity: 10 }, { itemId: 'quantum_gate', type: 'item', quantity: 3 }, { itemId: 'superconductor', type: 'item', quantity: 2 }, { itemId: 'processor', type: 'item', quantity: 2 }], outputQuantity: 1, requiredMachine: 'quantum_lab', description: 'Quantum computer manufacturing' },
  { id: 'advanced_fab', name: 'Advanced Fabrication Plant', category: 'machine', ingredients: [{ itemId: 'titanium', type: 'ingot', quantity: 25 }, { itemId: 'gold', type: 'ingot', quantity: 10 }, { itemId: 'platinum', type: 'ingot', quantity: 5 }, { itemId: 'microcontroller', type: 'item', quantity: 4 }, { itemId: 'gpu_core', type: 'item', quantity: 1 }], outputQuantity: 1, description: 'State-of-the-art chip manufacturing' },
  { id: 'quantum_lab', name: 'Quantum Lab', category: 'machine', ingredients: [{ itemId: 'platinum', type: 'ingot', quantity: 15 }, { itemId: 'superconductor', type: 'item', quantity: 3 }, { itemId: 'holographic_matrix', type: 'item', quantity: 2 }, { itemId: 'neural_accelerator', type: 'item', quantity: 1 }], outputQuantity: 1, description: 'Quantum research facility' },
  { id: 'bio_synthesizer', name: 'Bio Synthesizer', category: 'machine', ingredients: [{ itemId: 'titanium', type: 'ingot', quantity: 12 }, { itemId: 'ion_channel', type: 'item', quantity: 3 }, { itemId: 'microcontroller', type: 'item', quantity: 2 }, { itemId: 'adc_converter', type: 'item', quantity: 2 }], outputQuantity: 1, description: 'Biological molecule synthesis' },

  // Utility Items
  { id: 'motor_controller', name: 'Motor Controller', category: 'electronic', ingredients: [{ itemId: 'transistor', type: 'item', quantity: 4 }, { itemId: 'capacitor', type: 'item', quantity: 2 }, { itemId: 'diode', type: 'item', quantity: 2 }], outputQuantity: 1, description: 'Speed and direction control' },
  { id: 'protein_scaffold', name: 'Protein Scaffold', category: 'component', ingredients: [{ itemId: 'platinum', type: 'ingot', quantity: 1 }, { itemId: 'carbon_nanotube', type: 'item', quantity: 1 }], outputQuantity: 1, description: 'Biological structure template' },
];

export const RECIPE_MAP: Record<string, CraftingRecipe> = {};
CRAFTING_RECIPES.forEach(r => { RECIPE_MAP[r.id] = r; });

// ─── Refinery System ────────────────────────────────────────────────────────
// The Refinery passively processes ores into Refined, Polished, or Perfect variants.
// 20 upgrades × 5 tiers across Speed, Value, Risk, and Mutation Synergy categories.

export type RefineryUpgradeCategory = 'speed' | 'value' | 'risk' | 'mutation';
export type RefineryOutputType = 'refined' | 'polished' | 'perfect';

export interface RefineryUpgradeTier {
  level: number;
  effect: number; // raw numeric effect (meaning depends on upgrade)
  description: string;
  cost: { itemId: string; type: 'item' | 'ingot' | 'currency'; quantity: number }[];
}

export interface RefineryUpgradeDef {
  id: string;
  name: string;
  category: RefineryUpgradeCategory;
  icon: string;
  maxTier: number;
  tiers: RefineryUpgradeTier[];
  effectLabel: string; // e.g. "+X% speed"
}

// ─── Heat Thresholds ────────────────────────────────────────────────────────
export const HEAT_LOW_MAX = 40;
export const HEAT_MEDIUM_MAX = 75;
export const HEAT_MAX = 100;
export const HEAT_DECAY_PER_SECOND = 0.5; // passive cooling per second
export const BASE_PROCESS_TIME_MS = 8000; // 8 seconds base
export const BASE_BATCH_SIZE = 1;
export const REFINERY_TICK_MS = 1000;

// ─── Idle Scaling ────────────────────────────────────────────────────────────
// Session starts when the refinery is first loaded. Bonuses scale with session length.
export function getIdleSpeedMultiplier(sessionMs: number): number {
  // Ramp from 1x to 2x over 30 minutes
  const minutes = sessionMs / 60_000;
  return 1 + Math.min(1, minutes / 30);
}

export function getIdleQualityBonus(sessionMs: number): number {
  // +0 to +15% chance for higher quality outcomes over 60 minutes
  const minutes = sessionMs / 60_000;
  return Math.min(0.15, minutes / 400);
}

export function getIdleBatchBonus(sessionMs: number): number {
  // +0 to +3 extra batch items over 45 minutes
  const minutes = sessionMs / 60_000;
  return Math.floor(Math.min(3, minutes / 15));
}

// ─── Speed Upgrades (5) ────────────────────────────────────────────────────
const speedUpgrades: RefineryUpgradeDef[] = [
  {
    id: 'rustbreak_gears', name: 'Rustbreak Gears', category: 'speed', icon: '⚙️',
    maxTier: 5, effectLabel: '+X% processing speed',
    tiers: [
      { level: 1, effect: 0.10, description: '+10% processing speed', cost: [
        { itemId: 'currency', type: 'currency', quantity: 500 },
        { itemId: 'small_gear', type: 'item', quantity: 4 },
        { itemId: 'metal_rod', type: 'item', quantity: 2 },
      ]},
      { level: 2, effect: 0.20, description: '+20% processing speed', cost: [
        { itemId: 'currency', type: 'currency', quantity: 2000 },
        { itemId: 'gear_assembly', type: 'item', quantity: 2 },
        { itemId: 'bearing_unit', type: 'item', quantity: 2 },
      ]},
      { level: 3, effect: 0.35, description: '+35% processing speed', cost: [
        { itemId: 'currency', type: 'currency', quantity: 8000 },
        { itemId: 'compact_gearbox', type: 'item', quantity: 1 },
        { itemId: 'precision_gear', type: 'item', quantity: 3 },
      ]},
      { level: 4, effect: 0.55, description: '+55% processing speed', cost: [
        { itemId: 'currency', type: 'currency', quantity: 30000 },
        { itemId: 'industrial_gearbox', type: 'item', quantity: 1 },
        { itemId: 'reinforced_shaft', type: 'item', quantity: 1 },
      ]},
      { level: 5, effect: 0.80, description: '+80% processing speed', cost: [
        { itemId: 'currency', type: 'currency', quantity: 120000 },
        { itemId: 'nano_gear_system', type: 'item', quantity: 1 },
        { itemId: 'energy_transfer_core', type: 'item', quantity: 1 },
      ]},
    ],
  },
  {
    id: 'overclock_pistons', name: 'Overclock Pistons', category: 'speed', icon: '🔧',
    maxTier: 5, effectLabel: '-X% cycle time',
    tiers: [
      { level: 1, effect: 0.08, description: '-8% cycle time', cost: [
        { itemId: 'currency', type: 'currency', quantity: 600 },
        { itemId: 'spring_coil', type: 'item', quantity: 4 },
        { itemId: 'metal_plate', type: 'item', quantity: 3 },
      ]},
      { level: 2, effect: 0.16, description: '-16% cycle time', cost: [
        { itemId: 'currency', type: 'currency', quantity: 2500 },
        { itemId: 'mechanical_joint', type: 'item', quantity: 2 },
        { itemId: 'shaft_component', type: 'item', quantity: 2 },
      ]},
      { level: 3, effect: 0.26, description: '-26% cycle time', cost: [
        { itemId: 'currency', type: 'currency', quantity: 10000 },
        { itemId: 'stabilizer_unit', type: 'item', quantity: 1 },
        { itemId: 'precision_shaft', type: 'item', quantity: 1 },
      ]},
      { level: 4, effect: 0.40, description: '-40% cycle time', cost: [
        { itemId: 'currency', type: 'currency', quantity: 40000 },
        { itemId: 'high_tension_spring', type: 'item', quantity: 2 },
        { itemId: 'dynamic_balancer', type: 'item', quantity: 1 },
      ]},
      { level: 5, effect: 0.55, description: '-55% cycle time', cost: [
        { itemId: 'currency', type: 'currency', quantity: 150000 },
        { itemId: 'stabilization_core', type: 'item', quantity: 1 },
        { itemId: 'gravity_stabilizer', type: 'item', quantity: 1 },
      ]},
    ],
  },
  {
    id: 'chainfeed_intake', name: 'Chainfeed Intake', category: 'speed', icon: '📦',
    maxTier: 5, effectLabel: '+X batch size',
    tiers: [
      { level: 1, effect: 1, description: '+1 batch size', cost: [
        { itemId: 'currency', type: 'currency', quantity: 800 },
        { itemId: 'basic_frame', type: 'item', quantity: 2 },
        { itemId: 'bolt_pack', type: 'item', quantity: 4 },
      ]},
      { level: 2, effect: 2, description: '+2 batch size', cost: [
        { itemId: 'currency', type: 'currency', quantity: 3000 },
        { itemId: 'reinforced_frame', type: 'item', quantity: 1 },
        { itemId: 'cable_harness', type: 'item', quantity: 2 },
      ]},
      { level: 3, effect: 4, description: '+4 batch size', cost: [
        { itemId: 'currency', type: 'currency', quantity: 12000 },
        { itemId: 'modular_frame', type: 'item', quantity: 1 },
        { itemId: 'rotary_component', type: 'item', quantity: 2 },
      ]},
      { level: 4, effect: 7, description: '+7 batch size', cost: [
        { itemId: 'currency', type: 'currency', quantity: 50000 },
        { itemId: 'stabilized_frame', type: 'item', quantity: 1 },
        { itemId: 'structural_matrix', type: 'item', quantity: 1 },
      ]},
      { level: 5, effect: 12, description: '+12 batch size', cost: [
        { itemId: 'currency', type: 'currency', quantity: 200000 },
        { itemId: 'smart_structural_frame', type: 'item', quantity: 1 },
        { itemId: 'quantum_structural_matrix', type: 'item', quantity: 1 },
      ]},
    ],
  },
  {
    id: 'auto_pressure_flow', name: 'Auto-Pressure Flow', category: 'speed', icon: '💨',
    maxTier: 5, effectLabel: '-X% delay between cycles',
    tiers: [
      { level: 1, effect: 0.15, description: '-15% inter-cycle delay', cost: [
        { itemId: 'currency', type: 'currency', quantity: 700 },
        { itemId: 'fastener_set', type: 'item', quantity: 4 },
        { itemId: 'connector_piece', type: 'item', quantity: 3 },
      ]},
      { level: 2, effect: 0.30, description: '-30% inter-cycle delay', cost: [
        { itemId: 'currency', type: 'currency', quantity: 2800 },
        { itemId: 'pressure_seal', type: 'item', quantity: 3 },
        { itemId: 'connector_array', type: 'item', quantity: 1 },
      ]},
      { level: 3, effect: 0.50, description: '-50% inter-cycle delay', cost: [
        { itemId: 'currency', type: 'currency', quantity: 11000 },
        { itemId: 'flow_regulator', type: 'item', quantity: 1 },
        { itemId: 'pressure_core', type: 'item', quantity: 1 },
      ]},
      { level: 4, effect: 0.70, description: '-70% inter-cycle delay', cost: [
        { itemId: 'currency', type: 'currency', quantity: 45000 },
        { itemId: 'cooling_assembly', type: 'item', quantity: 1 },
        { itemId: 'thermal_regulator', type: 'item', quantity: 1 },
      ]},
      { level: 5, effect: 0.90, description: '-90% inter-cycle delay', cost: [
        { itemId: 'currency', type: 'currency', quantity: 180000 },
        { itemId: 'energy_compression', type: 'item', quantity: 1 },
        { itemId: 'phase_coupler', type: 'item', quantity: 1 },
      ]},
    ],
  },
  {
    id: 'hypercycle_core', name: 'Hypercycle Core', category: 'speed', icon: '⚡',
    maxTier: 5, effectLabel: 'X% instant completion chance',
    tiers: [
      { level: 1, effect: 0.03, description: '3% instant completion chance', cost: [
        { itemId: 'currency', type: 'currency', quantity: 1000 },
        { itemId: 'wire_bundle', type: 'item', quantity: 4 },
        { itemId: 'contact_pin', type: 'item', quantity: 4 },
      ]},
      { level: 2, effect: 0.06, description: '6% instant completion chance', cost: [
        { itemId: 'currency', type: 'currency', quantity: 4000 },
        { itemId: 'energy_channel', type: 'item', quantity: 1 },
        { itemId: 'signal_contact', type: 'item', quantity: 2 },
      ]},
      { level: 3, effect: 0.10, description: '10% instant completion chance', cost: [
        { itemId: 'currency', type: 'currency', quantity: 15000 },
        { itemId: 'energy_conduit', type: 'item', quantity: 1 },
        { itemId: 'contact_matrix', type: 'item', quantity: 1 },
      ]},
      { level: 4, effect: 0.16, description: '16% instant completion chance', cost: [
        { itemId: 'currency', type: 'currency', quantity: 60000 },
        { itemId: 'energy_channel_core', type: 'item', quantity: 1 },
        { itemId: 'power_transfer_unit', type: 'item', quantity: 1 },
      ]},
      { level: 5, effect: 0.25, description: '25% instant completion chance', cost: [
        { itemId: 'currency', type: 'currency', quantity: 250000 },
        { itemId: 'quantum_channel', type: 'item', quantity: 1 },
        { itemId: 'dimensional_coupler', type: 'item', quantity: 1 },
      ]},
    ],
  },
];

// ─── Value Upgrades (5) ────────────────────────────────────────────────────
const valueUpgrades: RefineryUpgradeDef[] = [
  {
    id: 'density_calibration', name: 'Density Calibration', category: 'value', icon: '💎',
    maxTier: 5, effectLabel: '+X% refined ore value',
    tiers: [
      { level: 1, effect: 0.10, description: '+10% refined ore value', cost: [
        { itemId: 'currency', type: 'currency', quantity: 600 },
        { itemId: 'insulated_layer', type: 'item', quantity: 3 },
        { itemId: 'basic_housing', type: 'item', quantity: 2 },
      ]},
      { level: 2, effect: 0.22, description: '+22% refined ore value', cost: [
        { itemId: 'currency', type: 'currency', quantity: 2400 },
        { itemId: 'insulated_panel', type: 'item', quantity: 2 },
        { itemId: 'structural_panel', type: 'item', quantity: 2 },
      ]},
      { level: 3, effect: 0.38, description: '+38% refined ore value', cost: [
        { itemId: 'currency', type: 'currency', quantity: 9000 },
        { itemId: 'thermal_plate', type: 'item', quantity: 2 },
        { itemId: 'sensor_mount', type: 'item', quantity: 1 },
      ]},
      { level: 4, effect: 0.60, description: '+60% refined ore value', cost: [
        { itemId: 'currency', type: 'currency', quantity: 35000 },
        { itemId: 'thermal_regulator', type: 'item', quantity: 1 },
        { itemId: 'signal_conduit', type: 'item', quantity: 1 },
      ]},
      { level: 5, effect: 1.00, description: '+100% refined ore value', cost: [
        { itemId: 'currency', type: 'currency', quantity: 140000 },
        { itemId: 'precision_matrix', type: 'item', quantity: 1 },
        { itemId: 'high_density_assembly', type: 'item', quantity: 1 },
      ]},
    ],
  },
  {
    id: 'polish_sequencer', name: 'Polish Sequencer', category: 'value', icon: '✨',
    maxTier: 5, effectLabel: '+X% polished ore chance',
    tiers: [
      { level: 1, effect: 0.05, description: '+5% polished chance', cost: [
        { itemId: 'currency', type: 'currency', quantity: 800 },
        { itemId: 'screw_set', type: 'item', quantity: 4 },
        { itemId: 'small_gear', type: 'item', quantity: 3 },
      ]},
      { level: 2, effect: 0.10, description: '+10% polished chance', cost: [
        { itemId: 'currency', type: 'currency', quantity: 3200 },
        { itemId: 'alignment_module', type: 'item', quantity: 1 },
        { itemId: 'bearing_unit', type: 'item', quantity: 2 },
      ]},
      { level: 3, effect: 0.18, description: '+18% polished chance', cost: [
        { itemId: 'currency', type: 'currency', quantity: 12000 },
        { itemId: 'balance_assembly', type: 'item', quantity: 1 },
        { itemId: 'micro_housing', type: 'item', quantity: 1 },
      ]},
      { level: 4, effect: 0.28, description: '+28% polished chance', cost: [
        { itemId: 'currency', type: 'currency', quantity: 48000 },
        { itemId: 'load_bearing_unit', type: 'item', quantity: 1 },
        { itemId: 'reinforced_assembly', type: 'item', quantity: 1 },
      ]},
      { level: 5, effect: 0.40, description: '+40% polished chance', cost: [
        { itemId: 'currency', type: 'currency', quantity: 190000 },
        { itemId: 'nano_frame', type: 'item', quantity: 1 },
        { itemId: 'high_precision_housing', type: 'item', quantity: 1 },
      ]},
    ],
  },
  {
    id: 'perfection_index', name: 'Perfection Index', category: 'value', icon: '🌟',
    maxTier: 5, effectLabel: '+X% perfect ore chance',
    tiers: [
      { level: 1, effect: 0.02, description: '+2% perfect chance', cost: [
        { itemId: 'currency', type: 'currency', quantity: 1200 },
        { itemId: 'contact_pin', type: 'item', quantity: 4 },
        { itemId: 'connector_piece', type: 'item', quantity: 4 },
      ]},
      { level: 2, effect: 0.05, description: '+5% perfect chance', cost: [
        { itemId: 'currency', type: 'currency', quantity: 5000 },
        { itemId: 'micro_connector', type: 'item', quantity: 2 },
        { itemId: 'fine_wiring', type: 'item', quantity: 2 },
      ]},
      { level: 3, effect: 0.09, description: '+9% perfect chance', cost: [
        { itemId: 'currency', type: 'currency', quantity: 20000 },
        { itemId: 'data_interface_base', type: 'item', quantity: 1 },
        { itemId: 'compact_assembly', type: 'item', quantity: 1 },
      ]},
      { level: 4, effect: 0.14, description: '+14% perfect chance', cost: [
        { itemId: 'currency', type: 'currency', quantity: 80000 },
        { itemId: 'advanced_housing', type: 'item', quantity: 1 },
        { itemId: 'multi_phase_coupler', type: 'item', quantity: 1 },
      ]},
      { level: 5, effect: 0.22, description: '+22% perfect chance', cost: [
        { itemId: 'currency', type: 'currency', quantity: 350000 },
        { itemId: 'entanglement_housing', type: 'item', quantity: 1 },
        { itemId: 'phase_alignment_core', type: 'item', quantity: 1 },
      ]},
    ],
  },
  {
    id: 'compression_matrix', name: 'Compression Matrix', category: 'value', icon: '🗜️',
    maxTier: 5, effectLabel: '+X% final output value multiplier',
    tiers: [
      { level: 1, effect: 0.08, description: 'x1.08 final output value', cost: [
        { itemId: 'currency', type: 'currency', quantity: 900 },
        { itemId: 'metal_beam', type: 'item', quantity: 2 },
        { itemId: 'reinforced_plate', type: 'item', quantity: 2 },
      ]},
      { level: 2, effect: 0.18, description: 'x1.18 final output value', cost: [
        { itemId: 'currency', type: 'currency', quantity: 3500 },
        { itemId: 'structural_core', type: 'item', quantity: 1 },
        { itemId: 'support_frame', type: 'item', quantity: 1 },
      ]},
      { level: 3, effect: 0.32, description: 'x1.32 final output value', cost: [
        { itemId: 'currency', type: 'currency', quantity: 13000 },
        { itemId: 'heavy_frame', type: 'item', quantity: 1 },
        { itemId: 'control_housing', type: 'item', quantity: 1 },
      ]},
      { level: 4, effect: 0.50, description: 'x1.50 final output value', cost: [
        { itemId: 'currency', type: 'currency', quantity: 55000 },
        { itemId: 'machine_chassis', type: 'item', quantity: 1 },
        { itemId: 'industrial_gearbox', type: 'item', quantity: 1 },
      ]},
      { level: 5, effect: 0.80, description: 'x1.80 final output value', cost: [
        { itemId: 'currency', type: 'currency', quantity: 220000 },
        { itemId: 'smart_structural_frame', type: 'item', quantity: 1 },
        { itemId: 'fusion_housing', type: 'item', quantity: 1 },
      ]},
    ],
  },
  {
    id: 'refined_echo', name: 'Refined Echo', category: 'value', icon: '🔁',
    maxTier: 5, effectLabel: 'X% chance to duplicate output',
    tiers: [
      { level: 1, effect: 0.04, description: '4% duplicate chance', cost: [
        { itemId: 'currency', type: 'currency', quantity: 1000 },
        { itemId: 'spring_coil', type: 'item', quantity: 3 },
        { itemId: 'wire_bundle', type: 'item', quantity: 3 },
      ]},
      { level: 2, effect: 0.08, description: '8% duplicate chance', cost: [
        { itemId: 'currency', type: 'currency', quantity: 4000 },
        { itemId: 'rotary_component', type: 'item', quantity: 1 },
        { itemId: 'cable_harness', type: 'item', quantity: 2 },
      ]},
      { level: 3, effect: 0.14, description: '14% duplicate chance', cost: [
        { itemId: 'currency', type: 'currency', quantity: 16000 },
        { itemId: 'energy_channel', type: 'item', quantity: 1 },
        { itemId: 'reinforced_joint', type: 'item', quantity: 2 },
      ]},
      { level: 4, effect: 0.22, description: '22% duplicate chance', cost: [
        { itemId: 'currency', type: 'currency', quantity: 65000 },
        { itemId: 'energy_conduit', type: 'item', quantity: 1 },
        { itemId: 'industrial_joint', type: 'item', quantity: 1 },
      ]},
      { level: 5, effect: 0.35, description: '35% duplicate chance', cost: [
        { itemId: 'currency', type: 'currency', quantity: 280000 },
        { itemId: 'energy_channel_core', type: 'item', quantity: 1 },
        { itemId: 'advanced_coupling', type: 'item', quantity: 1 },
      ]},
    ],
  },
];

// ─── Risk / Power Upgrades (5) ──────────────────────────────────────────────
const riskUpgrades: RefineryUpgradeDef[] = [
  {
    id: 'overheat_drive', name: 'Overheat Drive', category: 'risk', icon: '🔥',
    maxTier: 5, effectLabel: '+X% speed, +X heat/cycle',
    tiers: [
      { level: 1, effect: 0.15, description: '+15% speed, +5 heat/cycle', cost: [
        { itemId: 'currency', type: 'currency', quantity: 500 },
        { itemId: 'insulated_layer', type: 'item', quantity: 3 },
        { itemId: 'metal_plate', type: 'item', quantity: 4 },
      ]},
      { level: 2, effect: 0.30, description: '+30% speed, +8 heat/cycle', cost: [
        { itemId: 'currency', type: 'currency', quantity: 2000 },
        { itemId: 'insulated_panel', type: 'item', quantity: 2 },
        { itemId: 'structural_panel', type: 'item', quantity: 1 },
      ]},
      { level: 3, effect: 0.50, description: '+50% speed, +12 heat/cycle', cost: [
        { itemId: 'currency', type: 'currency', quantity: 8000 },
        { itemId: 'thermal_plate', type: 'item', quantity: 2 },
        { itemId: 'control_housing', type: 'item', quantity: 1 },
      ]},
      { level: 4, effect: 0.75, description: '+75% speed, +16 heat/cycle', cost: [
        { itemId: 'currency', type: 'currency', quantity: 32000 },
        { itemId: 'thermal_regulator', type: 'item', quantity: 1 },
        { itemId: 'cooling_assembly', type: 'item', quantity: 1 },
      ]},
      { level: 5, effect: 1.00, description: '+100% speed, +20 heat/cycle', cost: [
        { itemId: 'currency', type: 'currency', quantity: 130000 },
        { itemId: 'energy_transfer_core', type: 'item', quantity: 1 },
        { itemId: 'fusion_housing', type: 'item', quantity: 1 },
      ]},
    ],
  },
  {
    id: 'thermal_instability', name: 'Thermal Instability', category: 'risk', icon: '🌡️',
    maxTier: 5, effectLabel: 'heat → +X% reward',
    tiers: [
      { level: 1, effect: 0.005, description: '+0.5% value per heat point', cost: [
        { itemId: 'currency', type: 'currency', quantity: 700 },
        { itemId: 'spring_coil', type: 'item', quantity: 3 },
        { itemId: 'contact_pin', type: 'item', quantity: 3 },
      ]},
      { level: 2, effect: 0.010, description: '+1% value per heat point', cost: [
        { itemId: 'currency', type: 'currency', quantity: 2800 },
        { itemId: 'alignment_module', type: 'item', quantity: 1 },
        { itemId: 'compact_housing', type: 'item', quantity: 1 },
      ]},
      { level: 3, effect: 0.018, description: '+1.8% value per heat point', cost: [
        { itemId: 'currency', type: 'currency', quantity: 11000 },
        { itemId: 'stabilizer_unit', type: 'item', quantity: 1 },
        { itemId: 'micro_housing', type: 'item', quantity: 1 },
      ]},
      { level: 4, effect: 0.028, description: '+2.8% value per heat point', cost: [
        { itemId: 'currency', type: 'currency', quantity: 45000 },
        { itemId: 'advanced_housing', type: 'item', quantity: 1 },
        { itemId: 'dynamic_balancer', type: 'item', quantity: 1 },
      ]},
      { level: 5, effect: 0.040, description: '+4% value per heat point', cost: [
        { itemId: 'currency', type: 'currency', quantity: 180000 },
        { itemId: 'high_precision_housing', type: 'item', quantity: 1 },
        { itemId: 'stabilization_core', type: 'item', quantity: 1 },
      ]},
    ],
  },
  {
    id: 'critical_melt', name: 'Critical Melt', category: 'risk', icon: '💀',
    maxTier: 5, effectLabel: 'X% ore destroy → high payout',
    tiers: [
      { level: 1, effect: 0.05, description: '5% destroy → 3x payout', cost: [
        { itemId: 'currency', type: 'currency', quantity: 1200 },
        { itemId: 'metal_beam', type: 'item', quantity: 2 },
        { itemId: 'basic_frame', type: 'item', quantity: 2 },
      ]},
      { level: 2, effect: 0.08, description: '8% destroy → 4x payout', cost: [
        { itemId: 'currency', type: 'currency', quantity: 5000 },
        { itemId: 'reinforced_frame', type: 'item', quantity: 1 },
        { itemId: 'pressure_seal', type: 'item', quantity: 2 },
      ]},
      { level: 3, effect: 0.12, description: '12% destroy → 5x payout', cost: [
        { itemId: 'currency', type: 'currency', quantity: 20000 },
        { itemId: 'structural_core', type: 'item', quantity: 1 },
        { itemId: 'pressure_core', type: 'item', quantity: 1 },
      ]},
      { level: 4, effect: 0.16, description: '16% destroy → 7x payout', cost: [
        { itemId: 'currency', type: 'currency', quantity: 80000 },
        { itemId: 'heavy_frame', type: 'item', quantity: 1 },
        { itemId: 'structural_matrix', type: 'item', quantity: 1 },
      ]},
      { level: 5, effect: 0.22, description: '22% destroy → 10x payout', cost: [
        { itemId: 'currency', type: 'currency', quantity: 320000 },
        { itemId: 'quantum_structural_matrix', type: 'item', quantity: 1 },
        { itemId: 'reality_stabilizer', type: 'item', quantity: 1 },
      ]},
    ],
  },
  {
    id: 'volatile_yield', name: 'Volatile Yield', category: 'risk', icon: '🎲',
    maxTier: 5, effectLabel: '±X% output value variance',
    tiers: [
      { level: 1, effect: 0.20, description: '±20% output value', cost: [
        { itemId: 'currency', type: 'currency', quantity: 600 },
        { itemId: 'bolt_pack', type: 'item', quantity: 4 },
        { itemId: 'screw_set', type: 'item', quantity: 4 },
      ]},
      { level: 2, effect: 0.35, description: '±35% output value', cost: [
        { itemId: 'currency', type: 'currency', quantity: 2400 },
        { itemId: 'mechanical_joint', type: 'item', quantity: 2 },
        { itemId: 'mounting_bracket', type: 'item', quantity: 2 },
      ]},
      { level: 3, effect: 0.50, description: '±50% output value', cost: [
        { itemId: 'currency', type: 'currency', quantity: 9500 },
        { itemId: 'compact_gearbox', type: 'item', quantity: 1 },
        { itemId: 'balance_assembly', type: 'item', quantity: 1 },
      ]},
      { level: 4, effect: 0.70, description: '±70% output value', cost: [
        { itemId: 'currency', type: 'currency', quantity: 38000 },
        { itemId: 'industrial_gearbox', type: 'item', quantity: 1 },
        { itemId: 'load_bearing_unit', type: 'item', quantity: 1 },
      ]},
      { level: 5, effect: 1.00, description: '±100% output value', cost: [
        { itemId: 'currency', type: 'currency', quantity: 160000 },
        { itemId: 'gravity_stabilizer', type: 'item', quantity: 1 },
        { itemId: 'nano_gear_system', type: 'item', quantity: 1 },
      ]},
    ],
  },
  {
    id: 'combustion_loop', name: 'Combustion Loop', category: 'risk', icon: '🔄',
    maxTier: 5, effectLabel: 'X% recover destroyed ores',
    tiers: [
      { level: 1, effect: 0.15, description: '15% recovery of destroyed ores', cost: [
        { itemId: 'currency', type: 'currency', quantity: 800 },
        { itemId: 'wire_bundle', type: 'item', quantity: 3 },
        { itemId: 'insulated_layer', type: 'item', quantity: 3 },
      ]},
      { level: 2, effect: 0.30, description: '30% recovery of destroyed ores', cost: [
        { itemId: 'currency', type: 'currency', quantity: 3200 },
        { itemId: 'cable_harness', type: 'item', quantity: 2 },
        { itemId: 'compact_housing', type: 'item', quantity: 1 },
      ]},
      { level: 3, effect: 0.45, description: '45% recovery of destroyed ores', cost: [
        { itemId: 'currency', type: 'currency', quantity: 12000 },
        { itemId: 'energy_channel', type: 'item', quantity: 1 },
        { itemId: 'control_housing', type: 'item', quantity: 1 },
      ]},
      { level: 4, effect: 0.60, description: '60% recovery of destroyed ores', cost: [
        { itemId: 'currency', type: 'currency', quantity: 50000 },
        { itemId: 'energy_conduit', type: 'item', quantity: 1 },
        { itemId: 'thermal_regulator', type: 'item', quantity: 1 },
      ]},
      { level: 5, effect: 0.80, description: '80% recovery of destroyed ores', cost: [
        { itemId: 'currency', type: 'currency', quantity: 200000 },
        { itemId: 'energy_channel_core', type: 'item', quantity: 1 },
        { itemId: 'time_stable_assembly', type: 'item', quantity: 1 },
      ]},
    ],
  },
];

// ─── Mutation / Synergy Upgrades (5) ────────────────────────────────────────
const mutationUpgrades: RefineryUpgradeDef[] = [
  {
    id: 'veinite_infusion', name: 'Veinite Infusion', category: 'mutation', icon: '🩸',
    maxTier: 5, effectLabel: 'refined ores improve mutations',
    tiers: [
      { level: 1, effect: 0.05, description: '+5% mutation quality from refined ores', cost: [
        { itemId: 'currency', type: 'currency', quantity: 2000 },
        { itemId: 'veinite', type: 'ingot', quantity: 1 },
        { itemId: 'connector_piece', type: 'item', quantity: 3 },
      ]},
      { level: 2, effect: 0.12, description: '+12% mutation quality from refined ores', cost: [
        { itemId: 'currency', type: 'currency', quantity: 8000 },
        { itemId: 'veinite', type: 'ingot', quantity: 2 },
        { itemId: 'connector_array', type: 'item', quantity: 1 },
      ]},
      { level: 3, effect: 0.22, description: '+22% mutation quality from refined ores', cost: [
        { itemId: 'currency', type: 'currency', quantity: 30000 },
        { itemId: 'veinite', type: 'ingot', quantity: 3 },
        { itemId: 'signal_conduit', type: 'item', quantity: 1 },
      ]},
      { level: 4, effect: 0.35, description: '+35% mutation quality from refined ores', cost: [
        { itemId: 'currency', type: 'currency', quantity: 120000 },
        { itemId: 'veinite', type: 'ingot', quantity: 5 },
        { itemId: 'veinite_core', type: 'item', quantity: 1 },
      ]},
      { level: 5, effect: 0.50, description: '+50% mutation quality from refined ores', cost: [
        { itemId: 'currency', type: 'currency', quantity: 500000 },
        { itemId: 'veinite', type: 'ingot', quantity: 8 },
        { itemId: 'veinite_resonance_shard', type: 'item', quantity: 1 },
      ]},
    ],
  },
  {
    id: 'sanguine_catalyst', name: 'Sanguine Catalyst', category: 'mutation', icon: '💉',
    maxTier: 5, effectLabel: 'X% pre-mutated refined ores',
    tiers: [
      { level: 1, effect: 0.03, description: '3% chance for pre-applied mutations', cost: [
        { itemId: 'currency', type: 'currency', quantity: 2500 },
        { itemId: 'veinite', type: 'ingot', quantity: 1 },
        { itemId: 'contact_pin', type: 'item', quantity: 4 },
      ]},
      { level: 2, effect: 0.07, description: '7% chance for pre-applied mutations', cost: [
        { itemId: 'currency', type: 'currency', quantity: 10000 },
        { itemId: 'veinite', type: 'ingot', quantity: 2 },
        { itemId: 'micro_connector', type: 'item', quantity: 2 },
      ]},
      { level: 3, effect: 0.13, description: '13% chance for pre-applied mutations', cost: [
        { itemId: 'currency', type: 'currency', quantity: 40000 },
        { itemId: 'veinite', type: 'ingot', quantity: 3 },
        { itemId: 'data_interface_base', type: 'item', quantity: 1 },
      ]},
      { level: 4, effect: 0.20, description: '20% chance for pre-applied mutations', cost: [
        { itemId: 'currency', type: 'currency', quantity: 160000 },
        { itemId: 'veinite', type: 'ingot', quantity: 5 },
        { itemId: 'blood_crystal_matrix', type: 'item', quantity: 1 },
      ]},
      { level: 5, effect: 0.30, description: '30% chance for pre-applied mutations', cost: [
        { itemId: 'currency', type: 'currency', quantity: 650000 },
        { itemId: 'veinite', type: 'ingot', quantity: 8 },
        { itemId: 'mutation_catalyst_core', type: 'item', quantity: 1 },
      ]},
    ],
  },
  {
    id: 'hemophage_recycling', name: 'Hemophage Recycling', category: 'mutation', icon: '🧬',
    maxTier: 5, effectLabel: 'generates biomass from refining',
    tiers: [
      { level: 1, effect: 0.10, description: '10% chance biomass per cycle', cost: [
        { itemId: 'currency', type: 'currency', quantity: 1500 },
        { itemId: 'veinite', type: 'ingot', quantity: 1 },
        { itemId: 'basic_housing', type: 'item', quantity: 2 },
      ]},
      { level: 2, effect: 0.20, description: '20% chance biomass per cycle', cost: [
        { itemId: 'currency', type: 'currency', quantity: 6000 },
        { itemId: 'veinite', type: 'ingot', quantity: 2 },
        { itemId: 'compact_housing', type: 'item', quantity: 2 },
      ]},
      { level: 3, effect: 0.35, description: '35% chance biomass per cycle', cost: [
        { itemId: 'currency', type: 'currency', quantity: 24000 },
        { itemId: 'veinite', type: 'ingot', quantity: 3 },
        { itemId: 'control_housing', type: 'item', quantity: 1 },
      ]},
      { level: 4, effect: 0.50, description: '50% chance biomass per cycle', cost: [
        { itemId: 'currency', type: 'currency', quantity: 100000 },
        { itemId: 'veinite', type: 'ingot', quantity: 5 },
        { itemId: 'parasite_host_chamber', type: 'item', quantity: 1 },
      ]},
      { level: 5, effect: 0.70, description: '70% chance biomass per cycle', cost: [
        { itemId: 'currency', type: 'currency', quantity: 400000 },
        { itemId: 'veinite', type: 'ingot', quantity: 8 },
        { itemId: 'flesh_fusion_engine', type: 'item', quantity: 1 },
      ]},
    ],
  },
  {
    id: 'living_conversion', name: 'Living Conversion', category: 'mutation', icon: '🌱',
    maxTier: 5, effectLabel: 'X% ores multiply post-refine',
    tiers: [
      { level: 1, effect: 0.02, description: '2% ore self-replication', cost: [
        { itemId: 'currency', type: 'currency', quantity: 3000 },
        { itemId: 'veinite', type: 'ingot', quantity: 1 },
        { itemId: 'spring_coil', type: 'item', quantity: 3 },
      ]},
      { level: 2, effect: 0.05, description: '5% ore self-replication', cost: [
        { itemId: 'currency', type: 'currency', quantity: 12000 },
        { itemId: 'veinite', type: 'ingot', quantity: 2 },
        { itemId: 'rotary_component', type: 'item', quantity: 1 },
      ]},
      { level: 3, effect: 0.09, description: '9% ore self-replication', cost: [
        { itemId: 'currency', type: 'currency', quantity: 50000 },
        { itemId: 'veinite', type: 'ingot', quantity: 3 },
        { itemId: 'energy_conduit', type: 'item', quantity: 1 },
      ]},
      { level: 4, effect: 0.14, description: '14% ore self-replication', cost: [
        { itemId: 'currency', type: 'currency', quantity: 200000 },
        { itemId: 'veinite', type: 'ingot', quantity: 5 },
        { itemId: 'parasite_growth_node', type: 'item', quantity: 1 },
      ]},
      { level: 5, effect: 0.22, description: '22% ore self-replication', cost: [
        { itemId: 'currency', type: 'currency', quantity: 800000 },
        { itemId: 'veinite', type: 'ingot', quantity: 8 },
        { itemId: 'black_vein_conduit', type: 'item', quantity: 1 },
      ]},
    ],
  },
  {
    id: 'crimson_feedback', name: 'Crimson Feedback Loop', category: 'mutation', icon: '♻️',
    maxTier: 5, effectLabel: 'mutated ores → +X% refinery speed',
    tiers: [
      { level: 1, effect: 0.02, description: '+2% speed per mutated ore held', cost: [
        { itemId: 'currency', type: 'currency', quantity: 2000 },
        { itemId: 'veinite', type: 'ingot', quantity: 1 },
        { itemId: 'wire_bundle', type: 'item', quantity: 3 },
      ]},
      { level: 2, effect: 0.04, description: '+4% speed per mutated ore held', cost: [
        { itemId: 'currency', type: 'currency', quantity: 8000 },
        { itemId: 'veinite', type: 'ingot', quantity: 2 },
        { itemId: 'cable_harness', type: 'item', quantity: 2 },
      ]},
      { level: 3, effect: 0.07, description: '+7% speed per mutated ore held', cost: [
        { itemId: 'currency', type: 'currency', quantity: 32000 },
        { itemId: 'veinite', type: 'ingot', quantity: 3 },
        { itemId: 'signal_conduit', type: 'item', quantity: 1 },
      ]},
      { level: 4, effect: 0.11, description: '+11% speed per mutated ore held', cost: [
        { itemId: 'currency', type: 'currency', quantity: 130000 },
        { itemId: 'veinite', type: 'ingot', quantity: 5 },
        { itemId: 'blood_reactor_chamber', type: 'item', quantity: 1 },
      ]},
      { level: 5, effect: 0.16, description: '+16% speed per mutated ore held', cost: [
        { itemId: 'currency', type: 'currency', quantity: 550000 },
        { itemId: 'veinite', type: 'ingot', quantity: 8 },
        { itemId: 'veinite_overload_core', type: 'item', quantity: 1 },
      ]},
    ],
  },
];

// ─── Combined ────────────────────────────────────────────────────────────────
export const ALL_REFINERY_UPGRADES: RefineryUpgradeDef[] = [
  ...speedUpgrades,
  ...valueUpgrades,
  ...riskUpgrades,
  ...mutationUpgrades,
];

export const REFINERY_UPGRADE_MAP: Record<string, RefineryUpgradeDef> = {};
ALL_REFINERY_UPGRADES.forEach(u => { REFINERY_UPGRADE_MAP[u.id] = u; });

// ─── Processing Logic ───────────────────────────────────────────────────────

/** Get the heat generated per processing cycle */
export function getHeatPerCycle(upgrades: Record<string, number>): number {
  const overheatLevel = upgrades['overheat_drive'] || 0;
  if (overheatLevel === 0) return 2; // base heat
  const heatMap = [2, 5, 8, 12, 16, 20];
  return heatMap[overheatLevel] ?? 2;
}

/** Get the critical melt payout multiplier */
export function getCriticalMeltMultiplier(level: number): number {
  const map = [0, 3, 4, 5, 7, 10];
  return map[level] ?? 0;
}

/** Get the effective processing time in ms */
export function getProcessTime(upgrades: Record<string, number>, sessionMs: number, mutatedOreCount: number): number {
  let time = BASE_PROCESS_TIME_MS;

  // Rustbreak Gears: +speed = less time
  const rgLevel = upgrades['rustbreak_gears'] || 0;
  if (rgLevel > 0) {
    const speedBoost = REFINERY_UPGRADE_MAP['rustbreak_gears'].tiers[rgLevel - 1].effect;
    time /= (1 + speedBoost);
  }

  // Overclock Pistons: reduce cycle time
  const opLevel = upgrades['overclock_pistons'] || 0;
  if (opLevel > 0) {
    const reduction = REFINERY_UPGRADE_MAP['overclock_pistons'].tiers[opLevel - 1].effect;
    time *= (1 - reduction);
  }

  // Overheat Drive: extra speed
  const ohLevel = upgrades['overheat_drive'] || 0;
  if (ohLevel > 0) {
    const speedBoost = REFINERY_UPGRADE_MAP['overheat_drive'].tiers[ohLevel - 1].effect;
    time /= (1 + speedBoost);
  }

  // Crimson Feedback Loop: speed per mutated ore
  const cfLevel = upgrades['crimson_feedback'] || 0;
  if (cfLevel > 0 && mutatedOreCount > 0) {
    const perOre = REFINERY_UPGRADE_MAP['crimson_feedback'].tiers[cfLevel - 1].effect;
    time /= (1 + perOre * Math.min(mutatedOreCount, 20)); // cap at 20 ores
  }

  // Idle scaling
  time /= getIdleSpeedMultiplier(sessionMs);

  // Auto-Pressure Flow: reduce delay (simulated as further time reduction)
  const apLevel = upgrades['auto_pressure_flow'] || 0;
  if (apLevel > 0) {
    const delayReduction = REFINERY_UPGRADE_MAP['auto_pressure_flow'].tiers[apLevel - 1].effect;
    time *= (1 - delayReduction * 0.3); // 30% of the delay reduction factor
  }

  return Math.max(500, Math.floor(time)); // min 500ms
}

/** Get batch size */
export function getBatchSize(upgrades: Record<string, number>, sessionMs: number): number {
  let batch = BASE_BATCH_SIZE;

  const ciLevel = upgrades['chainfeed_intake'] || 0;
  if (ciLevel > 0) {
    batch += REFINERY_UPGRADE_MAP['chainfeed_intake'].tiers[ciLevel - 1].effect;
  }

  batch += getIdleBatchBonus(sessionMs);
  return batch;
}

/** Roll the output type: refined, polished, or perfect */
export function rollOutputType(
  upgrades: Record<string, number>,
  sessionMs: number,
  heat: number,
): RefineryOutputType {
  const polishLevel = upgrades['polish_sequencer'] || 0;
  const perfectLevel = upgrades['perfection_index'] || 0;

  let polishChance = 0.10; // base 10%
  let perfectChance = 0.02; // base 2%

  if (polishLevel > 0) polishChance += REFINERY_UPGRADE_MAP['polish_sequencer'].tiers[polishLevel - 1].effect;
  if (perfectLevel > 0) perfectChance += REFINERY_UPGRADE_MAP['perfection_index'].tiers[perfectLevel - 1].effect;

  // Idle quality bonus
  const idleBonus = getIdleQualityBonus(sessionMs);
  polishChance += idleBonus;
  perfectChance += idleBonus * 0.5;

  // Medium heat bonus
  if (heat >= HEAT_LOW_MAX && heat < HEAT_MEDIUM_MAX) {
    polishChance += 0.05;
    perfectChance += 0.02;
  }

  const roll = Math.random();
  if (roll < perfectChance) return 'perfect';
  if (roll < perfectChance + polishChance) return 'polished';
  return 'refined';
}

/** Calculate the value multiplier for a refined output */
export function getOutputValueMultiplier(
  outputType: RefineryOutputType,
  upgrades: Record<string, number>,
  heat: number,
): number {
  let mult = outputType === 'perfect' ? 5.0 : outputType === 'polished' ? 2.5 : 1.5;

  // Density Calibration
  const dcLevel = upgrades['density_calibration'] || 0;
  if (dcLevel > 0) mult *= (1 + REFINERY_UPGRADE_MAP['density_calibration'].tiers[dcLevel - 1].effect);

  // Compression Matrix
  const cmLevel = upgrades['compression_matrix'] || 0;
  if (cmLevel > 0) mult *= (1 + REFINERY_UPGRADE_MAP['compression_matrix'].tiers[cmLevel - 1].effect);

  // Thermal Instability: heat → value
  const tiLevel = upgrades['thermal_instability'] || 0;
  if (tiLevel > 0) {
    const perHeat = REFINERY_UPGRADE_MAP['thermal_instability'].tiers[tiLevel - 1].effect;
    mult *= (1 + perHeat * heat);
  }

  // Volatile Yield: random variance
  const vyLevel = upgrades['volatile_yield'] || 0;
  if (vyLevel > 0) {
    const variance = REFINERY_UPGRADE_MAP['volatile_yield'].tiers[vyLevel - 1].effect;
    mult *= (1 + (Math.random() * 2 - 1) * variance);
  }

  return Math.max(0.1, mult);
}

/** Check if there should be high-heat penalty */
export function getHeatPenalty(heat: number): { oreDestroyed: boolean; valuePenalty: number } {
  if (heat >= HEAT_MEDIUM_MAX) {
    // High heat: chance to lose ores, value penalty
    const destroyChance = (heat - HEAT_MEDIUM_MAX) / (HEAT_MAX - HEAT_MEDIUM_MAX) * 0.3;
    return {
      oreDestroyed: Math.random() < destroyChance,
      valuePenalty: 0.8, // 20% value loss at high heat
    };
  }
  return { oreDestroyed: false, valuePenalty: 1.0 };
}

// ─── Machine automation configuration ────────────────────────────────────────

const BASIC_MACHINES = ['wafer_cutter', 'etching_station'];
const INTERMEDIATE_MACHINES = ['cnc_mill', 'laser_cutter', 'plasma_welder', 'chemical_reactor', 'centrifuge'];
const ADVANCED_MACHINES = ['advanced_fab', 'quantum_lab'];

function getBaseAutomationInterval(machineId: string): number {
  if (BASIC_MACHINES.includes(machineId)) return 10000;
  if (INTERMEDIATE_MACHINES.includes(machineId)) return 7000;
  if (ADVANCED_MACHINES.includes(machineId)) return 4000;
  return 10000;
}

export function getAutomationInterval(machineId: string, level: number = 0): number {
  const base = getBaseAutomationInterval(machineId);
  // Each level reduces interval by 8%, min 20% of base
  return Math.max(base * 0.2, Math.floor(base * Math.pow(0.92, level)));
}

export const MACHINE_UPGRADE_MAX_LEVEL = 10;

export function getMachineUpgradeCost(machineId: string, currentLevel: number): number {
  const baseCost = ADVANCED_MACHINES.includes(machineId) ? 5000
    : INTERMEDIATE_MACHINES.includes(machineId) ? 2000
    : 800;
  return Math.floor(baseCost * Math.pow(2.2, currentLevel));
}

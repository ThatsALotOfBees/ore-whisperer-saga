import { type GameState } from '@/hooks/useGameState';

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: (state: GameState) => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_mine',
    name: 'Scratching the Surface',
    description: 'Extract your first 1,000 ores.',
    icon: '⛏️',
    condition: (state) => state.totalMined >= 1000,
  },
  {
    id: 'wealthy_miner',
    name: 'Capitalist',
    description: 'Accumulate 1,000,000 currency.',
    icon: '💰',
    condition: (state) => state.currency >= 1_000_000,
  },
  {
    id: 'industrialist',
    name: 'Industrial Revolution',
    description: 'Upgrade to a Tier 10 Foundry.',
    icon: '🏭',
    condition: (state) => state.foundryTier >= 10,
  },
  {
    id: 'botanist',
    name: 'Void Botanist',
    description: 'Expand operations into biology (Craft a Greenhouse).',
    icon: '🌱',
    condition: (state) => state.unlockedMachines.includes('greenhouse'),
  },
  {
    id: 'blood_magic',
    name: 'Blood Magic',
    description: 'Unlock the secrets of Sanguinite Transmutation.',
    icon: '🩸',
    condition: (state) => state.unlockedMachines.includes('sanguinite_transmutation_table'),
  },
  {
    id: 'quantum_leap',
    name: 'Quantum Leap',
    description: 'Construct the Quantum Lab.',
    icon: '⚛️',
    condition: (state) => state.unlockedMachines.includes('quantum_lab'),
  },
  {
    id: 'the_cycle_begins',
    name: 'The Cycle Begins',
    description: 'Perform your first Rebirth.',
    icon: '🌌',
    condition: (state) => state.rebirthCount >= 1,
  },
  {
    id: 'echoes_of_void',
    name: 'Echoes of the Void',
    description: 'Achieve 3 simultaneous active mining points.',
    icon: '🌠',
    condition: (state) => state.miningPoints && state.miningPoints.length >= 3,
  },
];

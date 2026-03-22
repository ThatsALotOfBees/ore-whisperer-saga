// ─── Mutation System ─────────────────────────────────────────────────────────

export type MutationId =
  // Positive
  | 'dense' | 'duplicating' | 'refined_veins' | 'charged'
  // Corrupted
  | 'decaying' | 'leeching' | 'unstable_core'
  // Sanguine (rare)
  | 'bloodbound' | 'hemorrhaging' | 'living_ore';

export type MutationType = 'positive' | 'corrupted' | 'sanguine';
export type MutationTier = 1 | 2 | 3;

export type TransmutationFailure = 'degraded' | 'corrupt_mass' | 'overgrowth';

export interface MutationModifier {
  id: MutationId;
  name: string;
  type: MutationType;
  tier: MutationTier;
  description: string;
  /** Multiplier applied to the final sell value */
  sellValueMultiplier?: number;
  /** Chance (0-1) to double quantity on sell */
  extraDropChance?: number;
  /** % income drained passively per minute (0-1) */
  incomeDecayRate?: number;
  /** Sell value variance factor (0-1), random ± */
  valueVariance?: number;
}

// ─── Positive ────────────────────────────────────────────────────────────────
const denseMutations: MutationModifier[] = [
  { id: 'dense', name: 'Dense I', type: 'positive', tier: 1, description: '+25% sell value', sellValueMultiplier: 1.25 },
  { id: 'dense', name: 'Dense II', type: 'positive', tier: 2, description: '+50% sell value', sellValueMultiplier: 1.50 },
  { id: 'dense', name: 'Dense III', type: 'positive', tier: 3, description: '+80% sell value', sellValueMultiplier: 1.80 },
];

const duplicatingMutations: MutationModifier[] = [
  { id: 'duplicating', name: 'Duplicating I', type: 'positive', tier: 1, description: '10% chance to double output on sell', extraDropChance: 0.10 },
  { id: 'duplicating', name: 'Duplicating II', type: 'positive', tier: 2, description: '20% chance to double output on sell', extraDropChance: 0.20 },
  { id: 'duplicating', name: 'Duplicating III', type: 'positive', tier: 3, description: '35% chance to double output on sell', extraDropChance: 0.35 },
];

const refinedVeinsMutations: MutationModifier[] = [
  { id: 'refined_veins', name: 'Refined Veins I', type: 'positive', tier: 1, description: '+30% sell value from refined ore bonus', sellValueMultiplier: 1.30 },
  { id: 'refined_veins', name: 'Refined Veins II', type: 'positive', tier: 2, description: '+60% sell value from refined ore bonus', sellValueMultiplier: 1.60 },
  { id: 'refined_veins', name: 'Refined Veins III', type: 'positive', tier: 3, description: '+100% sell value — counts as triple-refined', sellValueMultiplier: 2.00 },
];

const chargedMutations: MutationModifier[] = [
  { id: 'charged', name: 'Charged I', type: 'positive', tier: 1, description: '+5% sell value, resonates with nearby miners', sellValueMultiplier: 1.05 },
  { id: 'charged', name: 'Charged II', type: 'positive', tier: 2, description: '+12% sell value, strong charge resonance', sellValueMultiplier: 1.12 },
  { id: 'charged', name: 'Charged III', type: 'positive', tier: 3, description: '+20% sell value, powerful charge field', sellValueMultiplier: 1.20 },
];

// ─── Corrupted ───────────────────────────────────────────────────────────────
const decayingMutations: MutationModifier[] = [
  { id: 'decaying', name: 'Decaying I', type: 'corrupted', tier: 1, description: 'Sell for -15% value (decaying matter)', sellValueMultiplier: 0.85 },
  { id: 'decaying', name: 'Decaying II', type: 'corrupted', tier: 2, description: 'Sell for -25% value (rapid decay)', sellValueMultiplier: 0.75 },
  { id: 'decaying', name: 'Decaying III', type: 'corrupted', tier: 3, description: 'Sell for -40% value (terminal decay)', sellValueMultiplier: 0.60 },
];

const leechingMutations: MutationModifier[] = [
  { id: 'leeching', name: 'Leeching I', type: 'corrupted', tier: 1, description: '-8% sell value, drains ambient income', sellValueMultiplier: 0.92, incomeDecayRate: 0.005 },
  { id: 'leeching', name: 'Leeching II', type: 'corrupted', tier: 2, description: '-15% sell value, heavy leech aura', sellValueMultiplier: 0.85, incomeDecayRate: 0.01 },
  { id: 'leeching', name: 'Leeching III', type: 'corrupted', tier: 3, description: '-25% sell value, voracious leech', sellValueMultiplier: 0.75, incomeDecayRate: 0.02 },
];

const unstableCoreMutations: MutationModifier[] = [
  { id: 'unstable_core', name: 'Unstable Core I', type: 'corrupted', tier: 1, description: '±10% sell value variance', valueVariance: 0.10 },
  { id: 'unstable_core', name: 'Unstable Core II', type: 'corrupted', tier: 2, description: '±25% sell value variance', valueVariance: 0.25 },
  { id: 'unstable_core', name: 'Unstable Core III', type: 'corrupted', tier: 3, description: '±50% sell value variance — extreme spikes', valueVariance: 0.50 },
];

// ─── Sanguine ────────────────────────────────────────────────────────────────
const bloodboundMutations: MutationModifier[] = [
  { id: 'bloodbound', name: 'Bloodbound I', type: 'sanguine', tier: 1, description: '+1% value per 1,000 total ores mined', sellValueMultiplier: 1.01 },
  { id: 'bloodbound', name: 'Bloodbound II', type: 'sanguine', tier: 2, description: '+2% value per 1,000 total ores mined', sellValueMultiplier: 1.02 },
  { id: 'bloodbound', name: 'Bloodbound III', type: 'sanguine', tier: 3, description: '+4% value per 1,000 total ores mined', sellValueMultiplier: 1.04 },
];

const hemorrhagingMutations: MutationModifier[] = [
  { id: 'hemorrhaging', name: 'Hemorrhaging I', type: 'sanguine', tier: 1, description: '5% chance of +1 bonus quantity on sell', extraDropChance: 0.05 },
  { id: 'hemorrhaging', name: 'Hemorrhaging II', type: 'sanguine', tier: 2, description: '12% chance of +1 bonus quantity on sell', extraDropChance: 0.12 },
  { id: 'hemorrhaging', name: 'Hemorrhaging III', type: 'sanguine', tier: 3, description: '25% chance of +1 bonus quantity on sell', extraDropChance: 0.25 },
];

const livingOreMutations: MutationModifier[] = [
  { id: 'living_ore', name: 'Living Ore I', type: 'sanguine', tier: 1, description: '+15% value — grows in potency while held', sellValueMultiplier: 1.15 },
  { id: 'living_ore', name: 'Living Ore II', type: 'sanguine', tier: 2, description: '+30% value — living ore cluster', sellValueMultiplier: 1.30 },
  { id: 'living_ore', name: 'Living Ore III', type: 'sanguine', tier: 3, description: '+55% value — apex living ore', sellValueMultiplier: 1.55 },
];

// ─── All Mutations by Type ────────────────────────────────────────────────────
export const POSITIVE_MUTATIONS: MutationModifier[][] = [
  denseMutations, duplicatingMutations, refinedVeinsMutations, chargedMutations,
];

export const CORRUPTED_MUTATIONS: MutationModifier[][] = [
  decayingMutations, leechingMutations, unstableCoreMutations,
];

export const SANGUINE_MUTATIONS: MutationModifier[][] = [
  bloodboundMutations, hemorrhagingMutations, livingOreMutations,
];

export const ALL_MUTATION_GROUPS = [...POSITIVE_MUTATIONS, ...CORRUPTED_MUTATIONS, ...SANGUINE_MUTATIONS];

/** Pick a random modifier of a given type at a given tier */
export function rollMutation(type: MutationType, tier: MutationTier): MutationModifier {
  const pool = type === 'positive' ? POSITIVE_MUTATIONS
    : type === 'corrupted' ? CORRUPTED_MUTATIONS
    : SANGUINE_MUTATIONS;
  const group = pool[Math.floor(Math.random() * pool.length)];
  return group[tier - 1];
}

/** Roll 1–3 mutations based on veiniteBoost and biomassBoost */
export function rollMutations(
  veiniteBoost: number,
  biomassBoost: boolean,
  tier: MutationTier,
): MutationModifier[] {
  const count = veiniteBoost === 0 ? 1 : veiniteBoost <= 2 ? 2 : 3;
  const sanguineChance = biomassBoost ? 0.25 : 0.10;
  const results: MutationModifier[] = [];
  const usedIds = new Set<string>();

  for (let i = 0; i < count; i++) {
    const roll = Math.random();
    let type: MutationType;
    if (roll < sanguineChance) {
      type = 'sanguine';
    } else if (roll < sanguineChance + 0.20) {
      type = 'corrupted';
    } else {
      type = 'positive';
    }
    const mutation = rollMutation(type, tier);
    // Avoid exact duplicates
    if (!usedIds.has(mutation.name)) {
      usedIds.add(mutation.name);
      results.push(mutation);
    }
  }
  return results;
}

/** Roll failure outcome */
export function rollFailureOutcome(): TransmutationFailure {
  const roll = Math.random();
  if (roll < 0.5) return 'degraded';
  if (roll < 0.8) return 'corrupt_mass';
  return 'overgrowth';
}

/** Compute base failure chance */
export function getFailureChance(tier: MutationTier): number {
  return 0.05 + (tier - 1) * 0.15; // T1: 5%, T2: 20%, T3: 35%
}

/** Determine tier from veiniteBoost */
export function getTierFromBoost(veiniteBoost: number): MutationTier {
  if (veiniteBoost >= 4) return 3;
  if (veiniteBoost >= 2) return 2;
  return 1;
}

/** Base processing duration in ms by ore tier */
export function getTransmutationDuration(oreTier: number, mutationTier: MutationTier): number {
  // 30s for tier 1 ores, scaling to 5min for tier 7, then boosted by mutation tier
  const baseMs = Math.min(30_000 + (oreTier - 1) * 40_000, 300_000);
  const tierMultiplier = mutationTier === 1 ? 1 : mutationTier === 2 ? 1.5 : 2;
  return Math.floor(baseMs * tierMultiplier);
}

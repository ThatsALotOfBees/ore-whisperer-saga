import { createContext, useContext, useReducer, useEffect, useRef, useCallback, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ALL_ORES, ORE_MAP, rollMiningDrop, type Ore, type OreRarity } from '@/data/ores';
import { MINING_UPGRADES, FOUNDRY_TIERS, CRAFTING_RECIPES, RECIPE_MAP, type FoundryUpgrade } from '@/data/recipes';

export interface SmeltingJob {
  oreId: string;
  refined: boolean;
  startTime: number;
  duration: number;
}

export interface AutomationJob {
  machineId: string;
  recipeId: string;
  enabled: boolean;
  interval: number;
  lastCraft: number;
}

export interface GameState {
  currency: number;
  ores: Record<string, number>;
  refinedOres: Record<string, number>;
  ingots: Record<string, number>;
  items: Record<string, number>;
  miningUpgrades: Record<string, number>;
  foundryTier: number;
  smeltingJobs: SmeltingJob[];
  unlockedMachines: string[];
  automationJobs: AutomationJob[];
  autoMinerEnabled: boolean;
  totalMined: number;
  lastDrop: { ore: Ore; quantity: number } | null;
}

const initialState: GameState = {
  currency: 100,
  ores: {},
  refinedOres: {},
  ingots: {},
  items: {},
  miningUpgrades: { drill_speed: 0, ore_scanner: 0, multi_drill: 0 },
  foundryTier: 1,
  smeltingJobs: [],
  unlockedMachines: [],
  automationJobs: [],
  autoMinerEnabled: false,
  totalMined: 0,
  lastDrop: null,
};

// ─── Processing difficulty -> smelting speed factor ──────────────────────────
const PROCESSING_SPEED_FACTOR: Record<string, number> = {
  easy: 1.0,
  moderate: 0.7,
  expensive: 0.4,
  extreme: 0.2,
};

type Action =
  | { type: 'MINE_TICK' }
  | { type: 'SELL_ITEM'; itemId: string; itemType: 'ore' | 'refined' | 'ingot' | 'item'; quantity: number }
  | { type: 'DEDUCT_FOR_LISTING'; itemId: string; itemType: 'ore' | 'refined' | 'ingot' | 'item'; quantity: number }
  | { type: 'RETURN_FROM_LISTING'; itemId: string; itemType: 'ore' | 'refined' | 'ingot' | 'item'; quantity: number; itemName: string }
  | { type: 'RECEIVE_PURCHASE'; itemId: string; itemType: 'ore' | 'refined' | 'ingot' | 'item'; quantity: number; totalCost: number }
  | { type: 'REFINE_ORE'; oreId: string; quantity: number }
  | { type: 'START_SMELT'; oreId: string; refined: boolean }
  | { type: 'COMPLETE_SMELT'; jobIndex: number }
  | { type: 'UPGRADE_MINING'; upgradeId: string }
  | { type: 'UPGRADE_FOUNDRY' }
  | { type: 'CRAFT_ITEM'; recipeId: string }
  | { type: 'TICK_SMELTING' }
  | { type: 'TOGGLE_AUTO_MINER' }
  | { type: 'TOGGLE_AUTOMATION'; machineId: string; recipeId: string }
  | { type: 'TICK_AUTOMATION' }
  | { type: 'LOAD_STATE'; state: GameState };

function getMiningSpeed(state: GameState): number {
  const level = state.miningUpgrades.drill_speed || 0;
  return 1 + level * 0.15;
}

function getLuck(state: GameState): number {
  const level = state.miningUpgrades.ore_scanner || 0;
  return 1 + level * 0.12;
}

function getMultiChance(state: GameState): number {
  const level = state.miningUpgrades.multi_drill || 0;
  return level * 0.1;
}

function getCurrentFoundry(state: GameState): FoundryUpgrade {
  return FOUNDRY_TIERS[state.foundryTier - 1] || FOUNDRY_TIERS[0];
}

function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'MINE_TICK': {
      const luck = getLuck(state);
      const ore = rollMiningDrop(luck);
      if (!ore) return state;

      let quantity = 1;
      if (Math.random() < getMultiChance(state)) quantity = 2;

      const newOres = { ...state.ores };
      newOres[ore.id] = (newOres[ore.id] || 0) + quantity;

      return {
        ...state,
        ores: newOres,
        totalMined: state.totalMined + quantity,
        lastDrop: { ore, quantity },
      };
    }

    case 'SELL_ITEM': {
      const { itemId, itemType, quantity } = action;
      const ore = ORE_MAP[itemId];
      let value = ore ? ore.value : 10;
      if (itemType === 'refined') value = Math.floor(value * 1.5);
      if (itemType === 'ingot') value = Math.floor(value * 2.5);
      if (itemType === 'item') {
        const recipe = RECIPE_MAP[itemId];
        value = recipe ? recipe.ingredients.reduce((sum, ing) => {
          const o = ORE_MAP[ing.itemId];
          return sum + (o ? o.value * ing.quantity : 20 * ing.quantity);
        }, 0) * 2 : 50;
      }

      const source = itemType === 'ore' ? 'ores' : itemType === 'refined' ? 'refinedOres' : itemType === 'ingot' ? 'ingots' : 'items';
      const current = state[source][itemId] || 0;
      if (current < quantity) return state;

      const newSource = { ...state[source] };
      newSource[itemId] = current - quantity;
      if (newSource[itemId] <= 0) delete newSource[itemId];

      return { ...state, [source]: newSource, currency: state.currency + value * quantity };
    }

    case 'DEDUCT_FOR_LISTING': {
      // Removes items from inventory when a marketplace listing is created (no currency gain)
      const { itemId, itemType, quantity } = action;
      const sourceKey = itemType === 'ore' ? 'ores' : itemType === 'refined' ? 'refinedOres' : itemType === 'ingot' ? 'ingots' : 'items';
      const current = state[sourceKey][itemId] || 0;
      if (current < quantity) return state;
      const newSource = { ...state[sourceKey] };
      newSource[itemId] = current - quantity;
      if (newSource[itemId] <= 0) delete newSource[itemId];
      return { ...state, [sourceKey]: newSource };
    }

    case 'RETURN_FROM_LISTING': {
      // Returns items to inventory when a listing is cancelled
      const { itemId, itemType, quantity } = action;
      const sourceKey = itemType === 'ore' ? 'ores' : itemType === 'refined' ? 'refinedOres' : itemType === 'ingot' ? 'ingots' : 'items';
      const newSource = { ...state[sourceKey] };
      newSource[itemId] = (newSource[itemId] || 0) + quantity;
      return { ...state, [sourceKey]: newSource };
    }

    case 'RECEIVE_PURCHASE': {
      // Buyer receives items and pays currency
      const { itemId, itemType, quantity, totalCost } = action;
      if (state.currency < totalCost) return state;
      const sourceKey = itemType === 'ore' ? 'ores' : itemType === 'refined' ? 'refinedOres' : itemType === 'ingot' ? 'ingots' : 'items';
      const newSource = { ...state[sourceKey] };
      newSource[itemId] = (newSource[itemId] || 0) + quantity;
      return { ...state, [sourceKey]: newSource, currency: state.currency - totalCost };
    }

    case 'REFINE_ORE': {
      const { oreId, quantity } = action;
      const ore = ORE_MAP[oreId];
      if (!ore) return state;
      const totalCost = ore.refineCost * quantity;
      if (state.currency < totalCost || (state.ores[oreId] || 0) < quantity) return state;

      const newOres = { ...state.ores };
      newOres[oreId] = (newOres[oreId] || 0) - quantity;
      if (newOres[oreId] <= 0) delete newOres[oreId];

      const newRefined = { ...state.refinedOres };
      newRefined[oreId] = (newRefined[oreId] || 0) + quantity;

      return { ...state, ores: newOres, refinedOres: newRefined, currency: state.currency - totalCost };
    }

    case 'START_SMELT': {
      const foundry = getCurrentFoundry(state);
      if (state.smeltingJobs.length >= foundry.slots) return state;

      const { oreId, refined } = action;
      const ore = ORE_MAP[oreId];
      if (!ore) return state;

      // Check foundry tier meets ore's minimum smelt tier
      if (state.foundryTier < ore.minSmeltTier) return state;

      const source = refined ? state.refinedOres : state.ores;
      if ((source[oreId] || 0) < 1) return state;

      const newSource = { ...source };
      newSource[oreId] = (newSource[oreId] || 0) - 1;
      if (newSource[oreId] <= 0) delete newSource[oreId];

      const baseDuration = 5000;
      const processingFactor = PROCESSING_SPEED_FACTOR[ore.processingDifficulty] || 1.0;
      const duration = baseDuration / (foundry.speedMultiplier * processingFactor);

      const job: SmeltingJob = { oreId, refined, startTime: Date.now(), duration };
      const stateKey = refined ? 'refinedOres' : 'ores';

      return { ...state, [stateKey]: newSource, smeltingJobs: [...state.smeltingJobs, job] };
    }

    case 'COMPLETE_SMELT': {
      const job = state.smeltingJobs[action.jobIndex];
      if (!job) return state;

      const ore = ORE_MAP[job.oreId];
      if (!ore) return state;

      let yieldAmount = ore.smeltYield;
      if (job.refined) yieldAmount = Math.ceil(yieldAmount * ore.refineMultiplier);

      const newIngots = { ...state.ingots };
      newIngots[job.oreId] = (newIngots[job.oreId] || 0) + yieldAmount;

      const newJobs = state.smeltingJobs.filter((_, i) => i !== action.jobIndex);

      return { ...state, ingots: newIngots, smeltingJobs: newJobs };
    }

    case 'UPGRADE_MINING': {
      const upgrade = MINING_UPGRADES.find(u => u.id === action.upgradeId);
      if (!upgrade) return state;
      const currentLevel = state.miningUpgrades[upgrade.id] || 0;
      if (currentLevel >= upgrade.maxLevel) return state;
      const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel));
      if (state.currency < cost) return state;

      return {
        ...state,
        currency: state.currency - cost,
        miningUpgrades: { ...state.miningUpgrades, [upgrade.id]: currentLevel + 1 },
      };
    }

    case 'UPGRADE_FOUNDRY': {
      const nextTier = FOUNDRY_TIERS[state.foundryTier];
      if (!nextTier) return state;

      let canAfford = true;
      for (const cost of nextTier.cost) {
        if (cost.type === 'currency') {
          if (state.currency < cost.quantity) canAfford = false;
        } else if (cost.type === 'ingot') {
          if ((state.ingots[cost.itemId] || 0) < cost.quantity) canAfford = false;
        } else if (cost.type === 'item') {
          if ((state.items[cost.itemId] || 0) < cost.quantity) canAfford = false;
        }
      }
      if (!canAfford) return state;

      let newState = { ...state, foundryTier: state.foundryTier + 1 };
      for (const cost of nextTier.cost) {
        if (cost.type === 'currency') {
          newState.currency -= cost.quantity;
        } else if (cost.type === 'ingot') {
          const newIngots = { ...newState.ingots };
          newIngots[cost.itemId] = (newIngots[cost.itemId] || 0) - cost.quantity;
          if (newIngots[cost.itemId] <= 0) delete newIngots[cost.itemId];
          newState.ingots = newIngots;
        } else if (cost.type === 'item') {
          const newItems = { ...newState.items };
          newItems[cost.itemId] = (newItems[cost.itemId] || 0) - cost.quantity;
          if (newItems[cost.itemId] <= 0) delete newItems[cost.itemId];
          newState.items = newItems;
        }
      }
      return newState;
    }

    case 'CRAFT_ITEM': {
      const recipe = RECIPE_MAP[action.recipeId];
      if (!recipe) return state;
      if (recipe.requiredMachine && !state.unlockedMachines.includes(recipe.requiredMachine)) return state;

      let newState = { ...state };
      for (const ing of recipe.ingredients) {
        const source = ing.type === 'ingot' ? 'ingots' : 'items';
        const current = newState[source][ing.itemId] || 0;
        if (current < ing.quantity) return state;
      }

      // Deduct
      let newIngots = { ...newState.ingots };
      let newItems = { ...newState.items };
      for (const ing of recipe.ingredients) {
        if (ing.type === 'ingot') {
          newIngots[ing.itemId] = (newIngots[ing.itemId] || 0) - ing.quantity;
          if (newIngots[ing.itemId] <= 0) delete newIngots[ing.itemId];
        } else {
          newItems[ing.itemId] = (newItems[ing.itemId] || 0) - ing.quantity;
          if (newItems[ing.itemId] <= 0) delete newItems[ing.itemId];
        }
      }

      newItems[recipe.id] = (newItems[recipe.id] || 0) + recipe.outputQuantity;

      // If machine, unlock it
      const newMachines = recipe.category === 'machine'
        ? [...new Set([...newState.unlockedMachines, recipe.id])]
        : newState.unlockedMachines;

      return { ...newState, ingots: newIngots, items: newItems, unlockedMachines: newMachines };
    }

    case 'TOGGLE_AUTO_MINER': {
      return { ...state, autoMinerEnabled: !state.autoMinerEnabled };
    }

    case 'TOGGLE_AUTOMATION': {
      const { machineId, recipeId } = action;
      if (!state.unlockedMachines.includes(machineId)) return state;

      const existing = state.automationJobs.find(j => j.machineId === machineId);
      if (existing) {
        // If same recipe, toggle on/off. If different recipe, switch recipe.
        if (existing.recipeId === recipeId) {
          return {
            ...state,
            automationJobs: state.automationJobs.map(j =>
              j.machineId === machineId ? { ...j, enabled: !j.enabled } : j
            ),
          };
        } else {
          return {
            ...state,
            automationJobs: state.automationJobs.map(j =>
              j.machineId === machineId ? { ...j, recipeId, enabled: true, lastCraft: Date.now() } : j
            ),
          };
        }
      }

      // New automation job
      const interval = getAutomationInterval(machineId);
      const newJob: AutomationJob = {
        machineId,
        recipeId,
        enabled: true,
        interval,
        lastCraft: Date.now(),
      };
      return { ...state, automationJobs: [...state.automationJobs, newJob] };
    }

    case 'TICK_AUTOMATION': {
      const now = Date.now();
      let changed = false;
      let newState = state;

      for (const job of state.automationJobs) {
        if (!job.enabled) continue;
        if (now - job.lastCraft < job.interval) continue;

        // Try to auto-craft
        const recipe = RECIPE_MAP[job.recipeId];
        if (!recipe) continue;
        if (recipe.requiredMachine && !newState.unlockedMachines.includes(recipe.requiredMachine)) continue;

        // Check ingredients
        let canCraft = true;
        for (const ing of recipe.ingredients) {
          const source = ing.type === 'ingot' ? newState.ingots : newState.items;
          if ((source[ing.itemId] || 0) < ing.quantity) {
            canCraft = false;
            break;
          }
        }

        if (canCraft) {
          newState = gameReducer(newState, { type: 'CRAFT_ITEM', recipeId: job.recipeId });
          // Update lastCraft timestamp
          newState = {
            ...newState,
            automationJobs: newState.automationJobs.map(j =>
              j.machineId === job.machineId ? { ...j, lastCraft: now } : j
            ),
          };
          changed = true;
        }
      }

      return changed ? newState : state;
    }

    case 'TICK_SMELTING': {
      const now = Date.now();
      let changed = false;
      let newState = state;
      for (let i = state.smeltingJobs.length - 1; i >= 0; i--) {
        const job = state.smeltingJobs[i];
        if (now - job.startTime >= job.duration) {
          newState = gameReducer(newState, { type: 'COMPLETE_SMELT', jobIndex: i });
          changed = true;
        }
      }
      return changed ? newState : state;
    }

    case 'LOAD_STATE':
      return action.state;

    default:
      return state;
  }
}

// ─── Automation interval by machine tier ─────────────────────────────────────
// Lower tier machines run slower (simpler recipes); advanced machines run faster
const MACHINE_INTERVALS: Record<string, number> = {
  wafer_cutter: 12000,       // Tier 1 recipes — fast output, simple parts
  etching_station: 10000,    // Tier 2 recipes — slightly more complex assemblies
  cnc_mill: 9000,            // Tier 3 precision components
  laser_cutter: 8000,        // Basic electronics
  plasma_welder: 7000,       // Tier 4 industrial components
  chemical_reactor: 7000,    // Intermediate + advanced electronics
  lithography_machine: 6000, // Processors / microcontrollers — high value
  centrifuge: 5000,          // Tier 5 high-tech components
  advanced_fab: 4000,        // Tier 6 quantum components + GPU cores
  quantum_lab: 3000,         // Tier 7 void components + quantum gates — endgame
};

function getAutomationInterval(machineId: string): number {
  return MACHINE_INTERVALS[machineId] ?? 10000;
}

// ─── Save state migration ────────────────────────────────────────────────────
const ORE_ID_REMAP: Record<string, string> = {
  silicon: 'quartz',
  neodymium: 'monazite',
};

// Old foundry tier -> new foundry tier mapping
const FOUNDRY_TIER_REMAP: Record<number, number> = {
  1: 1,
  2: 2,
  3: 5,
};

function migrateOreRecord(record: Record<string, number>): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [key, val] of Object.entries(record)) {
    const newKey = ORE_ID_REMAP[key] || key;
    // Only keep entries for ores that exist in the new system
    if (ORE_MAP[newKey]) {
      result[newKey] = (result[newKey] || 0) + val;
    }
  }
  return result;
}

function migrateState(saved: any): GameState {
  const state = { ...initialState, ...saved, smeltingJobs: [] };

  // Migrate ore records
  if (state.ores) state.ores = migrateOreRecord(state.ores);
  if (state.refinedOres) state.refinedOres = migrateOreRecord(state.refinedOres);
  if (state.ingots) state.ingots = migrateOreRecord(state.ingots);

  // Migrate foundry tier if it was from old 3-tier system
  if (state.foundryTier && FOUNDRY_TIER_REMAP[state.foundryTier] !== undefined && state.foundryTier <= 3) {
    state.foundryTier = FOUNDRY_TIER_REMAP[state.foundryTier];
  }

  // Ensure new fields exist
  if (!state.automationJobs) state.automationJobs = [];
  if (state.autoMinerEnabled === undefined) state.autoMinerEnabled = false;

  return state;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<Action>;
  miningSpeed: number;
  foundry: FoundryUpgrade;
  saveStatus: SaveStatus;
}

const GameContext = createContext<GameContextType | null>(null);

function loadState(): GameState {
  try {
    const saved = localStorage.getItem('voidmarket_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      return migrateState(parsed);
    }
  } catch {}
  return initialState;
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, loadState);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>('');

  // Load from Supabase on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) { setLoaded(true); return; }
        const { data } = await supabase
          .from('profiles')
          .select('game_state')
          .eq('user_id', user.id)
          .single();
        if (data?.game_state && !cancelled) {
          const migrated = migrateState(data.game_state as any);
          dispatch({ type: 'LOAD_STATE', state: migrated });
        }
      } catch {}
      if (!cancelled) setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, []);

  // Save to localStorage + debounced Supabase save
  const saveToSupabase = useCallback(async (gameState: GameState) => {
    try {
      setSaveStatus('saving');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setSaveStatus('idle'); return; }
      const { lastDrop, smeltingJobs, ...saveable } = gameState;
      const { error } = await supabase.from('profiles').update({
        game_state: saveable as any,
        total_mined: gameState.totalMined,
        currency: gameState.currency,
      }).eq('user_id', user.id);
      setSaveStatus(error ? 'error' : 'saved');
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
    }
  }, []);

  useEffect(() => {
    const { lastDrop, smeltingJobs, ...toSave } = state;
    localStorage.setItem('voidmarket_state', JSON.stringify(toSave));

    const serialized = JSON.stringify(toSave);
    if (serialized === lastSavedRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      lastSavedRef.current = serialized;
      saveToSupabase(state);
    }, 500);
  }, [state, saveToSupabase]);

  // Tick smelting
  useEffect(() => {
    const interval = setInterval(() => dispatch({ type: 'TICK_SMELTING' }), 500);
    return () => clearInterval(interval);
  }, []);

  // Tick automation
  useEffect(() => {
    const interval = setInterval(() => dispatch({ type: 'TICK_AUTOMATION' }), 2000);
    return () => clearInterval(interval);
  }, []);

  // Auto-miner tick
  useEffect(() => {
    if (!state.autoMinerEnabled) return;
    const autoMinerLevel = state.miningUpgrades.auto_miner_speed || 0;
    const intervalMs = Math.max(2000, 10000 * Math.pow(0.85, autoMinerLevel));
    const interval = setInterval(() => dispatch({ type: 'MINE_TICK' }), intervalMs);
    return () => clearInterval(interval);
  }, [state.autoMinerEnabled, state.miningUpgrades.auto_miner_speed]);

  const miningSpeed = getMiningSpeed(state);
  const foundry = getCurrentFoundry(state);

  return (
    <GameContext.Provider value={{ state, dispatch, miningSpeed, foundry, saveStatus }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}

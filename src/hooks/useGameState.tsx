import { createContext, useContext, useReducer, useEffect, useRef, useCallback, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ALL_ORES, ORE_MAP, SPECIAL_MINING_DROPS, rollMiningDrop, rollSpecialDrops, type Ore, type OreRarity } from '@/data/ores';
import { MINING_UPGRADES, FOUNDRY_TIERS, CRAFTING_RECIPES, RECIPE_MAP, type FoundryUpgrade } from '@/data/recipes';
import { playSound } from '@/lib/audio';
import {
  PLANT_MAP, ALL_PLANTS, rollSeedFromPack,
  PLOT_COST_BASE, PLOT_COST_MULTIPLIER,
  GROW_SPEED_UPGRADE_BASE, GROW_SPEED_UPGRADE_MULTIPLIER,
  HARVEST_UPGRADE_BASE, HARVEST_UPGRADE_MULTIPLIER,
  MAX_PLOTS_PER_GREENHOUSE, GROW_SPEED_MAX_LEVEL, HARVEST_MAX_LEVEL,
  GARDEN_TICK_INTERVAL,
  type PlantDef, type PlantRarity,
} from '@/data/garden';
import {
  type MutationModifier, type MutationTier, type TransmutationFailure,
  rollMutations, rollFailureOutcome, getFailureChance, getTierFromBoost,
  getTransmutationDuration,
} from '@/data/mutations';
import { ACHIEVEMENTS } from '@/data/achievements';
import {
  REFINERY_UPGRADE_MAP, REFINERY_TICK_MS, HEAT_DECAY_PER_SECOND, HEAT_MAX,
  getProcessTime, getBatchSize, rollOutputType, getOutputValueMultiplier,
  getHeatPerCycle, getHeatPenalty, getCriticalMeltMultiplier,
  type RefineryOutputType,
} from '@/data/refinery';

export interface SmeltingJob {
  oreId: string;
  refined: boolean;
  startTime: number;
  duration: number;
  quantity?: number;
}

export interface AutomationJob {
  machineId: string;
  recipeId: string;
  enabled: boolean;
  interval: number;
  lastCraft: number;
}

// ─── Mining Point Types ──────────────────────────────────────────────────────
export interface MiningPoint {
  id: string;
  name: string;
  upgrades: Record<string, number>;
  autoMinerEnabled: boolean;
  lastAutoMine: number;
}

// ─── Transmutation Types ─────────────────────────────────────────────────────
export interface MutatedOre {
  id: string;
  oreId: string;
  mutations: MutationModifier[];
  quantity: number;
  createdAt: number;
  failureOutcome?: TransmutationFailure;
}

export interface TransmutationJob {
  id: string;
  tableId: string;
  oreId: string;
  veiniteBoost: number;
  biomassBoost: boolean;
  startTime: number;
  duration: number;
  tier: MutationTier;
}

export interface TransmutationTable {
  id: string;
  activeJob: TransmutationJob | null;
}

// ─── Garden Types ────────────────────────────────────────────────────────────
export interface GardenPlot {
  plantId: string | null; // null = empty
  plantedAt: number | null; // timestamp
  lastIncomeTick: number; // last time passive income was collected
}

export interface Greenhouse {
  id: string;
  plots: GardenPlot[];
  growSpeedLevel: number; // upgrade level
  harvestLevel: number; // upgrade level
}

// ─── Refinery Types ──────────────────────────────────────────────────────────
export interface RefineryOutput {
  id: string;
  oreId: string;
  outputType: RefineryOutputType; // 'refined' | 'polished' | 'perfect'
  quantity: number;
  valueMultiplier: number;
  collected: boolean;
}

export interface Refinery {
  upgrades: Record<string, number>; // upgradeId -> tier level (0 = not purchased)
  heat: number; // 0-100
  inputOreId: string | null; // currently set ore to process
  inputQuantity: number; // how many ores in queue
  processing: boolean;
  processStartTime: number;
  processDuration: number;
  sessionStartTime: number; // when the refinery session began (for idle scaling)
  totalProcessed: number; // lifetime ores processed
}

export interface GameState {
  currency: number;
  ores: Record<string, number>;
  refinedOres: Record<string, number>;
  ingots: Record<string, number>;
  items: Record<string, number>;
  seeds: Record<string, number>; // plantId -> count
  miningPoints: MiningPoint[];
  activeMiningPointId: string;
  rebirthCount: number;
  unlockedAchievements: string[];
  foundryTier: number;
  transmutationTables: TransmutationTable[];
  mutatedOres: MutatedOre[];
  smeltingJobs: SmeltingJob[];
  smeltingQueue: SmeltingJob[];
  unlockedMachines: string[];
  lastViewedVersion?: string;
  automationJobs: AutomationJob[];
  totalMined: number;
  lastDrop: { ore: Ore; quantity: number } | null;
  lastSpecialDrop: { id: string; name: string; rarity: string; timestamp: number } | null;
  greenhouses: Greenhouse[];
  refinery: Refinery | null;
  refineryOutputs: RefineryOutput[];
  settings: {
    showBackground: boolean;
  };
  pinnedTabs: string[];
  autoDeleteSeeds: string[];
}

const initialState: GameState = {
  currency: 100,
  ores: {},
  refinedOres: {},
  ingots: {},
  items: {},
  seeds: {},
  miningPoints: [{
    id: 'mp_0',
    name: 'Extraction Point 01',
    upgrades: { drill_speed: 0, ore_scanner: 0, multi_drill: 0, auto_miner_speed: 0 },
    autoMinerEnabled: false,
    lastAutoMine: 0,
  }],
  activeMiningPointId: 'mp_0',
  rebirthCount: 0,
  unlockedAchievements: [],
  foundryTier: 1,
  smeltingJobs: [],
  smeltingQueue: [],
  unlockedMachines: [],
  lastViewedVersion: 'v0.54', // Start from currently known version
  automationJobs: [],
  totalMined: 0,
  lastDrop: null,
  lastSpecialDrop: null,
  greenhouses: [],
  transmutationTables: [],
  mutatedOres: [],
  refinery: null,
  refineryOutputs: [],
  settings: {
    showBackground: true,
  },
  pinnedTabs: ['mine', 'inventory', 'upgrades'],
  autoDeleteSeeds: [],
};

// ─── Processing difficulty -> smelting speed factor ──────────────────────────
const PROCESSING_SPEED_FACTOR: Record<string, number> = {
  easy: 1.0,
  moderate: 0.7,
  expensive: 0.4,
  extreme: 0.2,
};

type Action =
  | { type: 'MINE_TICK'; pointId?: string }
  | { type: 'SELL_ITEM'; itemId: string; itemType: 'ore' | 'refined' | 'ingot' | 'item'; quantity: number }
  | { type: 'DEDUCT_FOR_LISTING'; itemId: string; itemType: 'ore' | 'refined' | 'ingot' | 'item'; quantity: number }
  | { type: 'RETURN_FROM_LISTING'; itemId: string; itemType: 'ore' | 'refined' | 'ingot' | 'item'; quantity: number; itemName: string }
  | { type: 'RECEIVE_PURCHASE'; itemId: string; itemType: 'ore' | 'refined' | 'ingot' | 'item'; quantity: number; totalCost: number }
  | { type: 'REFINE_ORE'; oreId: string; quantity: number }
  | { type: 'START_SMELT'; oreId: string; refined: boolean; quantity?: number }
  | { type: 'COMPLETE_SMELT'; jobIndex: number }
  | { type: 'CANCEL_SMELTIC_JOB'; jobIndex: number; isQueue: boolean }
  | { type: 'SWITCH_MINING_POINT'; pointId: string }
  | { type: 'UPGRADE_MINING'; upgradeId: string }
  | { type: 'UPGRADE_FOUNDRY' }
  | { type: 'CRAFT_ITEM'; recipeId: string }
  | { type: 'TICK_SMELTING' }
  | { type: 'TOGGLE_AUTO_MINER' }
  | { type: 'TICK_AUTO_MINERS' }
  | { type: 'TOGGLE_AUTOMATION'; machineId: string; recipeId: string }
  | { type: 'TICK_AUTOMATION' }
  | { type: 'LOAD_STATE'; state: GameState }
  // Garden actions
  | { type: 'OPEN_SEED_PACK' }
  | { type: 'PLANT_SEED'; greenhouseIndex: number; plotIndex: number; plantId: string }
  | { type: 'HARVEST_PLANT'; greenhouseIndex: number; plotIndex: number }
  | { type: 'ADD_PLOT'; greenhouseIndex: number }
  | { type: 'UPGRADE_GROW_SPEED'; greenhouseIndex: number }
  | { type: 'UPGRADE_HARVEST'; greenhouseIndex: number }
  | { type: 'REPLANT_ALL'; greenhouseIndex: number }
  | { type: 'SMELT_EVERYTHING' }
  | { type: 'TICK_GARDEN' }
  | { type: 'ACKNOWLEDGE_UPDATE', version: string }
  | { type: 'PERFORM_REBIRTH' }
  // Transmutation actions
  | { type: 'START_TRANSMUTATION'; tableId: string; oreId: string; veiniteBoost: number; biomassBoost: boolean }
  | { type: 'COMPLETE_TRANSMUTATION'; tableId: string; result: MutatedOre }
  | { type: 'TICK_TRANSMUTATION' }
  | { type: 'SELL_MUTATED_ORE'; mutatedOreId: string }
  | { type: 'DISCARD_MUTATED_ORE'; mutatedOreId: string }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<GameState['settings']> }
  | { type: 'TOGGLE_PIN_TAB'; tabId: string }
  | { type: 'RECEIVE_PURCHASE'; itemId: string; itemType: 'ore' | 'refined' | 'ingot' | 'item'; quantity: number; totalCost: number }
  | { type: 'TRASH_SEED'; plantId: string; quantity?: number }
  | { type: 'TOGGLE_AUTO_DELETE_SEED'; plantId: string }
  | { type: 'GIVE_ITEM'; itemId: string; quantity: number }
  // Refinery actions
  | { type: 'INSERT_ORE_REFINERY'; oreId: string; quantity: number }
  | { type: 'TICK_REFINERY' }
  | { type: 'COLLECT_REFINERY_OUTPUT'; outputId: string }
  | { type: 'COLLECT_ALL_REFINERY_OUTPUTS' }
  | { type: 'UPGRADE_REFINERY'; upgradeId: string }
  | { type: 'RESET_REFINERY_HEAT' };

export function getMiningSpeed(point: MiningPoint): number {
  const level = point.upgrades.drill_speed || 0;
  return 1 + level * 0.15;
}

export function getLuck(point: MiningPoint): number {
  const level = point.upgrades.ore_scanner || 0;
  return 1 + level * 0.12;
}

export function getMultiChance(point: MiningPoint): number {
  const level = point.upgrades.multi_drill || 0;
  return level * 0.1;
}

function getCurrentFoundry(state: GameState): FoundryUpgrade {
  return FOUNDRY_TIERS[state.foundryTier - 1] || FOUNDRY_TIERS[0];
}

export function getGrowSpeedMultiplier(level: number): number {
  return 1 + level * 0.15; // 15% faster per level
}

export function getHarvestDupeChance(level: number): number {
  return level * 0.05; // 5% chance per level (max 50% at lv10)
}

function checkAchievements(state: GameState): GameState {
  let newState = state;
  let newUnlocked = [...state.unlockedAchievements];
  let changed = false;

  for (const ach of ACHIEVEMENTS) {
    if (!newUnlocked.includes(ach.id) && ach.condition(state)) {
      newUnlocked.push(ach.id);
      changed = true;
    }
  }

  if (changed) {
    newState = { ...state, unlockedAchievements: newUnlocked };
  }
  return newState;
}

function gameReducerBase(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.settings }
      };
    case 'TOGGLE_PIN_TAB': {
      const { tabId } = action as { type: 'TOGGLE_PIN_TAB'; tabId: string };
      const pinned = state.pinnedTabs || [];
      const newPinned = pinned.includes(tabId)
        ? pinned.filter(t => t !== tabId)
        : [...pinned, tabId];
      return { ...state, pinnedTabs: newPinned };
    }
    case 'TRASH_SEED': {
      const { plantId, quantity } = action as { type: 'TRASH_SEED'; plantId: string; quantity?: number };
      const currentQty = state.seeds[plantId] || 0;
      const amountToRemove = quantity || currentQty;
      
      if (amountToRemove <= 0) return state;
      
      const newSeeds = { ...state.seeds };
      newSeeds[plantId] = Math.max(0, currentQty - amountToRemove);
      if (newSeeds[plantId] <= 0) delete newSeeds[plantId];
      
      return { ...state, seeds: newSeeds };
    }

    case 'TOGGLE_AUTO_DELETE_SEED': {
      const { plantId } = action as { type: 'TOGGLE_AUTO_DELETE_SEED'; plantId: string };
      const current = state.autoDeleteSeeds || [];
      const newAutoDelete = current.includes(plantId)
        ? current.filter(id => id !== plantId)
        : [...current, plantId];
      
      return { ...state, autoDeleteSeeds: newAutoDelete };
    }

    case 'GIVE_ITEM': {
      const { itemId, quantity } = action as { type: 'GIVE_ITEM'; itemId: string; quantity: number };
      const ore = ORE_MAP[itemId];
      const special = SPECIAL_MINING_DROPS.find(s => s.id === itemId);
      
      let newState = { ...state };
      
      // Handle greenhouses specially
      if (itemId === 'greenhouse') {
        const newGreenhouses = [...state.greenhouses];
        for (let i = 0; i < quantity; i++) {
          newGreenhouses.push({
            id: `gh_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            plots: [{ plantId: null, plantedAt: null, lastIncomeTick: Date.now() }],
            growSpeedLevel: 0,
            harvestLevel: 0,
          });
        }
        newState.greenhouses = newGreenhouses;
      } 
      // Handle transmutation tables specially
      else if (itemId === 'transmutation_table') {
        const newTables = [...state.transmutationTables];
        for (let i = 0; i < quantity; i++) {
          newTables.push({
            id: `tt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            activeJob: null,
          });
        }
        newState.transmutationTables = newTables;
      }
      // Handle refinery specially
      else if (itemId === 'ore_refinery' && !newState.refinery) {
        newState.refinery = {
          upgrades: {},
          heat: 0,
          inputOreId: null,
          inputQuantity: 0,
          processing: false,
          processStartTime: 0,
          processDuration: 0,
          sessionStartTime: Date.now(),
          totalProcessed: 0,
        };
        const newMachines = [...new Set([...newState.unlockedMachines, 'ore_refinery'])];
        newState.unlockedMachines = newMachines;
      }
      // Standard item/ore handling
      else {
        const newItems = { ...state.items };
        const newOres = { ...state.ores };
        
        if (special || (!ore && !RECIPE_MAP[itemId])) {
          newItems[itemId] = (newItems[itemId] || 0) + quantity;
        } else {
          newOres[itemId] = (newOres[itemId] || 0) + quantity;
        }
        
        newState.items = newItems;
        newState.ores = newOres;
      }

      if (special) {
        newState.lastSpecialDrop = { 
          id: special.id, 
          name: special.name, 
          rarity: special.rarity, 
          timestamp: Date.now() 
        };
      }
      
      return newState;
    }

    case 'RECEIVE_PURCHASE': {
      const { itemId, itemType, quantity, totalCost } = action as { 
        type: 'RECEIVE_PURCHASE'; 
        itemId: string; 
        itemType: 'ore' | 'refined' | 'ingot' | 'item'; 
        quantity: number; 
        totalCost: number 
      };
      
      let newState = { ...state, currency: state.currency - totalCost };
      
      if (itemType === 'ore') {
        newState.ores = { ...newState.ores, [itemId]: (newState.ores[itemId] || 0) + quantity };
      } else if (itemType === 'refined') {
        newState.refinedOres = { ...newState.refinedOres, [itemId]: (newState.refinedOres[itemId] || 0) + quantity };
      } else if (itemType === 'ingot') {
        newState.ingots = { ...newState.ingots, [itemId]: (newState.ingots[itemId] || 0) + quantity };
      } else if (itemType === 'item') {
        // Handle greenhouses specially
        if (itemId === 'greenhouse') {
          const newGreenhouses = [...newState.greenhouses];
          for (let i = 0; i < quantity; i++) {
            newGreenhouses.push({
              id: `gh_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              plots: [{ plantId: null, plantedAt: null, lastIncomeTick: Date.now() }],
              growSpeedLevel: 0,
              harvestLevel: 0,
            });
          }
          newState.greenhouses = newGreenhouses;
        } 
        // Handle transmutation tables specially
        else if (itemId === 'transmutation_table') {
          const newTables = [...newState.transmutationTables];
          for (let i = 0; i < quantity; i++) {
            newTables.push({
              id: `tt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              activeJob: null,
            });
          }
          newState.transmutationTables = newTables;
        }
        else {
          newState.items = { ...newState.items, [itemId]: (newState.items[itemId] || 0) + quantity };
        }
      }
      
      return newState;
    }

    case 'MINE_TICK': {
      const activePoint = state.miningPoints.find(p => p.id === (action.pointId || state.activeMiningPointId)) || state.miningPoints[0];
      const luck = getLuck(activePoint);
      const ore = rollMiningDrop(luck);
      if (!ore) return state;

      let quantity = 1;
      if (Math.random() < getMultiChance(activePoint)) quantity = 2;

      const newOres = { ...state.ores };
      newOres[ore.id] = (newOres[ore.id] || 0) + quantity;

      const specialDrops = rollSpecialDrops();
      let newItems = state.items;
      let lastSpecialDrop: { id: string; name: string; rarity: string; timestamp: number } | null = null;

      if (specialDrops.length > 0) {
        newItems = { ...state.items };
        for (const drop of specialDrops) {
          newItems[drop.id] = (newItems[drop.id] || 0) + 1;
          lastSpecialDrop = { id: drop.id, name: drop.name, rarity: drop.rarity, timestamp: Date.now() };
        }
      }

      return {
        ...state,
        ores: newOres,
        items: newItems,
        totalMined: state.totalMined + quantity,
        lastDrop: { ore, quantity },
        lastSpecialDrop,
      };
    }

    case 'SELL_ITEM': {
      const { itemId, itemType, quantity } = action as { type: 'SELL_ITEM'; itemId: string; itemType: any; quantity: number };
      const ore = ORE_MAP[itemId];
      let value = ore ? ore.value : 10;
      if (itemType === 'refined') value = Math.floor(value * 1.5);
      if (itemType === 'ingot') value = Math.floor(value * 2.5);
      if (itemType === 'item') {
        const special = SPECIAL_MINING_DROPS.find(s => s.id === itemId);
        if (special && special.value) {
          value = special.value;
        } else {
          const recipe = RECIPE_MAP[itemId];
          value = recipe ? recipe.ingredients.reduce((sum, ing) => {
            const o = ORE_MAP[ing.itemId];
            return sum + (o ? o.value * ing.quantity : 20 * ing.quantity);
          }, 0) * 2 : 50;
        }
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
      const { itemId, itemType, quantity } = action;
      const sourceKey = itemType === 'ore' ? 'ores' : itemType === 'refined' ? 'refinedOres' : itemType === 'ingot' ? 'ingots' : 'items';
      const newSource = { ...state[sourceKey] };
      newSource[itemId] = (newSource[itemId] || 0) + quantity;
      return { ...state, [sourceKey]: newSource };
    }

    case 'RECEIVE_PURCHASE': {
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
      const { oreId, refined, quantity = 1 } = action;
      const ore = ORE_MAP[oreId];
      if (!ore || state.foundryTier < ore.minSmeltTier) return state;

      const foundry = getCurrentFoundry(state);
      const sourceKey = refined ? 'refinedOres' : 'ores';
      const available = state[sourceKey][oreId] || 0;
      const toStartCount = Math.min(quantity, available);
      if (toStartCount <= 0) return state;

      let newState = { ...state };
      const newSource = { ...state[sourceKey] };
      newSource[oreId] = available - toStartCount;
      if (newSource[oreId] <= 0) delete newSource[oreId];
      newState[sourceKey] = newSource;

      const baseDuration = 5000;
      const processingFactor = PROCESSING_SPEED_FACTOR[ore.processingDifficulty] || 1.0;
      const duration = baseDuration / (foundry.speedMultiplier * processingFactor);

      const newActiveJobs = [...state.smeltingJobs];
      const newQueuedJobs = [...state.smeltingQueue];

      let remainingCount = toStartCount;
      while (remainingCount > 0 && newActiveJobs.length < foundry.slots) {
        newActiveJobs.push({ oreId, refined, startTime: Date.now(), duration });
        remainingCount--;
      }

      if (remainingCount > 0) {
        // Try to merge with the last queued job if it's the exact same type
        const last = newQueuedJobs[newQueuedJobs.length - 1];
        if (last && last.oreId === oreId && last.refined === refined) {
          last.quantity = (last.quantity || 1) + remainingCount;
        } else {
          newQueuedJobs.push({ oreId, refined, startTime: 0, duration, quantity: remainingCount });
        }
      }

      return { ...newState, smeltingJobs: newActiveJobs, smeltingQueue: newQueuedJobs };
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

      let newActiveJobs = state.smeltingJobs.filter((_, i) => i !== action.jobIndex);
      let newQueuedJobs = [...state.smeltingQueue];

      // Fill empty slot from queue
      const foundry = getCurrentFoundry(state);
      while (newActiveJobs.length < foundry.slots && newQueuedJobs.length > 0) {
        const nextJob = newQueuedJobs[0];
        const qty = nextJob.quantity || 1;
        newActiveJobs.push({ ...nextJob, startTime: Date.now(), quantity: undefined });
        if (qty > 1) {
          nextJob.quantity = qty - 1;
        } else {
          newQueuedJobs.shift();
        }
      }

      return { ...state, ingots: newIngots, smeltingJobs: newActiveJobs, smeltingQueue: newQueuedJobs };
    }

    case 'CANCEL_SMELTIC_JOB': {
      const { jobIndex, isQueue } = action;
      const job = isQueue ? state.smeltingQueue[jobIndex] : state.smeltingJobs[jobIndex];
      if (!job) return state;

      const sourceKey = job.refined ? 'refinedOres' : 'ores';
      const newSource = { ...state[sourceKey] };
      const returnQty = isQueue ? (job.quantity || 1) : 1;
      newSource[job.oreId] = (newSource[job.oreId] || 0) + returnQty;

      let newActiveJobs = [...state.smeltingJobs];
      let newQueuedJobs = [...state.smeltingQueue];

      if (isQueue) {
        newQueuedJobs.splice(jobIndex, 1);
      } else {
        newActiveJobs.splice(jobIndex, 1);
        // Start next job from queue if it was an active job cancelled
        const foundry = getCurrentFoundry(state);
        while (newActiveJobs.length < foundry.slots && newQueuedJobs.length > 0) {
          const nextJob = newQueuedJobs[0];
          const qty = nextJob.quantity || 1;
          newActiveJobs.push({ ...nextJob, startTime: Date.now(), quantity: undefined });
          if (qty > 1) {
            nextJob.quantity = qty - 1;
          } else {
            newQueuedJobs.shift();
          }
        }
      }

      return { ...state, [sourceKey]: newSource, smeltingJobs: newActiveJobs, smeltingQueue: newQueuedJobs };
    }

    case 'SWITCH_MINING_POINT': {
      return { ...state, activeMiningPointId: action.pointId };
    }

    case 'UPGRADE_MINING': {
      const point = state.miningPoints.find(p => p.id === state.activeMiningPointId);
      const upgrade = MINING_UPGRADES.find(u => u.id === action.upgradeId);
      if (!point || !upgrade) return state;

      const currentLevel = point.upgrades[upgrade.id] || 0;
      if (currentLevel >= upgrade.maxLevel) return state;
      const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel));
      if (state.currency < cost) return state;

      const newPoints = state.miningPoints.map(p => {
        if (p.id !== point.id) return p;
        return {
          ...p,
          upgrades: { ...p.upgrades, [upgrade.id]: currentLevel + 1 }
        };
      });

      return {
        ...state,
        currency: state.currency - cost,
        miningPoints: newPoints,
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
      let newMachines = recipe.category === 'machine'
        ? [...new Set([...newState.unlockedMachines, recipe.id])]
        : newState.unlockedMachines;

      // If transmutation table, create a new table entry
      let newTransmutationTables = newState.transmutationTables;
      if (recipe.id === 'sanguinite_transmutation_table') {
        const table: TransmutationTable = {
          id: `tt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          activeJob: null,
        };
        newTransmutationTables = [...newTransmutationTables, table];
      }

      // If greenhouse, create a new greenhouse with 1 plot
      let newGreenhouses = newState.greenhouses;
      if (recipe.id === 'greenhouse') {
        const gh: Greenhouse = {
          id: `gh_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          plots: [{ plantId: null, plantedAt: null, lastIncomeTick: Date.now() }],
          growSpeedLevel: 0,
          harvestLevel: 0,
        };
        newGreenhouses = [...newGreenhouses, gh];
      }

      // If refinery, create a new refinery
      let newRefinery = newState.refinery;
      if (recipe.id === 'ore_refinery' && !newRefinery) {
        newRefinery = {
          upgrades: {},
          heat: 0,
          inputOreId: null,
          inputQuantity: 0,
          processing: false,
          processStartTime: 0,
          processDuration: 0,
          sessionStartTime: Date.now(),
          totalProcessed: 0,
        };
      }

      return { ...newState, ingots: newIngots, items: newItems, unlockedMachines: newMachines, greenhouses: newGreenhouses, transmutationTables: newTransmutationTables, refinery: newRefinery ?? newState.refinery };
    }

    case 'TOGGLE_AUTO_MINER': {
      const newPoints = state.miningPoints.map(p => {
        if (p.id !== state.activeMiningPointId) return p;
        return { ...p, autoMinerEnabled: !p.autoMinerEnabled };
      });
      return { ...state, miningPoints: newPoints };
    }

    case 'TICK_AUTO_MINERS': {
      const now = Date.now();
      let changed = false;
      const newOres = { ...state.ores };
      const newItems = { ...state.items };
      let totalMinedGained = 0;

      const newPoints = state.miningPoints.map(point => {
        if (!point.autoMinerEnabled) return point;
        const level = point.upgrades.auto_miner_speed || 0;
        const intervalMs = Math.max(2000, 10000 * Math.pow(0.85, level));
        
        if (now - point.lastAutoMine >= intervalMs) {
          const luck = getLuck(point);
          const ore = rollMiningDrop(luck);
          if (ore) {
            let quantity = 1;
            if (Math.random() < getMultiChance(point)) quantity = 2;
            newOres[ore.id] = (newOres[ore.id] || 0) + quantity;
            totalMinedGained += quantity;

            const specialDrops = rollSpecialDrops();
            specialDrops.forEach(drop => {
              newItems[drop.id] = (newItems[drop.id] || 0) + 1;
            });
          }
          changed = true;
          return { ...point, lastAutoMine: now };
        }
        return point;
      });

      if (!changed) return state;
      return { 
        ...state, 
        ores: newOres, 
        items: newItems, 
        totalMined: state.totalMined + totalMinedGained,
        miningPoints: newPoints 
      };
    }

    case 'TOGGLE_AUTOMATION': {
      const { machineId, recipeId } = action;
      if (!state.unlockedMachines.includes(machineId)) return state;

      const existing = state.automationJobs.find(j => j.machineId === machineId);
      if (existing) {
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
      const newIngots = { ...state.ingots };
      const newItems = { ...state.items };
      const newJobs = [...state.automationJobs];

      for (let i = 0; i < newJobs.length; i++) {
        const job = newJobs[i];
        if (!job.enabled) continue;
        if (now - job.lastCraft < job.interval) continue;

        const recipe = RECIPE_MAP[job.recipeId];
        if (!recipe) continue;
        if (recipe.requiredMachine && !state.unlockedMachines.includes(recipe.requiredMachine)) continue;

        let canCraft = true;
        for (const ing of recipe.ingredients) {
          const source = ing.type === 'ingot' ? newIngots : newItems;
          if ((source[ing.itemId] || 0) < ing.quantity) {
            canCraft = false;
            break;
          }
        }

        if (canCraft) {
          // Deduct
          for (const ing of recipe.ingredients) {
            if (ing.type === 'ingot') {
              newIngots[ing.itemId] -= ing.quantity;
              if (newIngots[ing.itemId] <= 0) delete newIngots[ing.itemId];
            } else {
              newItems[ing.itemId] -= ing.quantity;
              if (newItems[ing.itemId] <= 0) delete newItems[ing.itemId];
            }
          }
          // Add
          newItems[recipe.id] = (newItems[recipe.id] || 0) + recipe.outputQuantity;
          // Update lastCraft
          newJobs[i] = { ...job, lastCraft: now };
          changed = true;
        }
      }

      if (!changed) return state;
      return { ...state, ingots: newIngots, items: newItems, automationJobs: newJobs };
    }

    case 'TICK_SMELTING': {
      const now = Date.now();
      const finishedIndices = [];
      for (let i = 0; i < state.smeltingJobs.length; i++) {
        const job = state.smeltingJobs[i];
        if (now - job.startTime >= job.duration) {
          finishedIndices.push(i);
        }
      }

      if (finishedIndices.length === 0) return state;

      const newIngots = { ...state.ingots };
      const newActiveJobs = state.smeltingJobs.filter((_, i) => !finishedIndices.includes(i));
      const newQueuedJobs = [...state.smeltingQueue];

      // Process yields for all finished jobs
      for (const idx of finishedIndices) {
        const job = state.smeltingJobs[idx];
        const ore = ORE_MAP[job.oreId];
        if (ore) {
          let yieldAmount = ore.smeltYield;
          if (job.refined) yieldAmount = Math.ceil(yieldAmount * ore.refineMultiplier);
          newIngots[job.oreId] = (newIngots[job.oreId] || 0) + yieldAmount;
        }
      }

      // Refill active jobs from queue
      const foundry = getCurrentFoundry(state);
      while (newActiveJobs.length < foundry.slots && newQueuedJobs.length > 0) {
        const nextJob = newQueuedJobs[0];
        const qty = nextJob.quantity || 1;
        newActiveJobs.push({ ...nextJob, startTime: now, quantity: undefined });
        if (qty > 1) {
          nextJob.quantity = qty - 1;
        } else {
          newQueuedJobs.shift();
        }
      }

      return { ...state, ingots: newIngots, smeltingJobs: newActiveJobs, smeltingQueue: newQueuedJobs };
    }

    // ─── Garden Actions ─────────────────────────────────────────────────────
    case 'OPEN_SEED_PACK': {
      const seedPacks = state.items['seed_pack'] || 0;
      if (seedPacks < 1) return state;

      const plant = rollSeedFromPack();
      const newItems = { ...state.items };
      newItems['seed_pack'] = seedPacks - 1;
      if (newItems['seed_pack'] <= 0) delete newItems['seed_pack'];

      const newSeeds = { ...state.seeds };
      if (!state.autoDeleteSeeds?.includes(plant.id)) {
        newSeeds[plant.id] = (newSeeds[plant.id] || 0) + 1;
      }

      return { ...state, items: newItems, seeds: newSeeds };
    }

    case 'PLANT_SEED': {
      const { greenhouseIndex, plotIndex, plantId } = action;
      const gh = state.greenhouses[greenhouseIndex];
      if (!gh) return state;
      const plot = gh.plots[plotIndex];
      if (!plot || plot.plantId) return state; // plot occupied
      if ((state.seeds[plantId] || 0) < 1) return state;

      const newSeeds = { ...state.seeds };
      newSeeds[plantId] = (newSeeds[plantId] || 0) - 1;
      if (newSeeds[plantId] <= 0) delete newSeeds[plantId];

      const newGreenhouses = state.greenhouses.map((g, gi) => {
        if (gi !== greenhouseIndex) return g;
        return {
          ...g,
          plots: g.plots.map((p, pi) => {
            if (pi !== plotIndex) return p;
            return { plantId, plantedAt: Date.now(), lastIncomeTick: Date.now() };
          }),
        };
      });

      return { ...state, seeds: newSeeds, greenhouses: newGreenhouses };
    }

    case 'REPLANT_ALL': {
      const { greenhouseIndex } = action;
      let currentState = state;
      let gh = currentState.greenhouses[greenhouseIndex];
      if (!gh) return state;

      // 1. Harvest all ready plants first
      for (let pi = 0; pi < gh.plots.length; pi++) {
        const plot = gh.plots[pi];
        if (plot.plantId && plot.plantedAt) {
          const plant = PLANT_MAP[plot.plantId];
          const growSpeed = getGrowSpeedMultiplier(gh.growSpeedLevel);
          const adjustedGrowTime = plant.growTimeMs / growSpeed;
          const elapsed = Date.now() - plot.plantedAt;
          
          if (elapsed >= adjustedGrowTime) {
            currentState = gameReducer(currentState, { type: 'HARVEST_PLANT', greenhouseIndex, plotIndex: pi });
          }
        }
      }

      // 2. Refresh gh reference from the updated state
      gh = currentState.greenhouses[greenhouseIndex];
      let currentSeeds = { ...currentState.seeds };
      const rarityPriority: PlantRarity[] = ['crystalized', 'mythic', 'legendary', 'epic', 'rare', 'uncommon', 'common'];

      const newPlots = gh.plots.map(p => {
        if (p.plantId) return p;

        // Find best seed
        for (const rarity of rarityPriority) {
          const seedsOfRarity = ALL_PLANTS.filter(plant => plant.rarity === rarity);
          const availableSeed = seedsOfRarity.find(s => currentSeeds[s.id] > 0);

          if (availableSeed) {
            currentSeeds[availableSeed.id]--;
            if (currentSeeds[availableSeed.id] <= 0) delete currentSeeds[availableSeed.id];
            return { plantId: availableSeed.id, plantedAt: Date.now(), lastIncomeTick: Date.now() };
          }
        }
        return p;
      });

      const finalGreenhouses = currentState.greenhouses.map((g, gi) => (gi === greenhouseIndex ? { ...g, plots: newPlots } : g));
      return { ...currentState, seeds: currentSeeds, greenhouses: finalGreenhouses };
    }

    case 'SMELT_EVERYTHING': {
      if (state.foundryTier < 8) return state;

      let newState = state;
      // Smelt all eligible ores
      const oreEntries = Object.entries(state.ores).filter(([, q]) => q > 0);
      for (const [id, qty] of oreEntries) {
        const ore = ORE_MAP[id];
        if (ore && ore.minSmeltTier <= state.foundryTier) {
          newState = gameReducer(newState, { type: 'START_SMELT', oreId: id, refined: false, quantity: qty });
        }
      }

      // Smelt all eligible refined ores
      const refinedEntries = Object.entries(state.refinedOres).filter(([, q]) => q > 0);
      for (const [id, qty] of refinedEntries) {
        const ore = ORE_MAP[id];
        if (ore && ore.minSmeltTier <= state.foundryTier) {
          newState = gameReducer(newState, { type: 'START_SMELT', oreId: id, refined: true, quantity: qty });
        }
      }

      return newState;
    }

    case 'HARVEST_PLANT': {
      const { greenhouseIndex, plotIndex } = action;
      const gh = state.greenhouses[greenhouseIndex];
      if (!gh) return state;
      const plot = gh.plots[plotIndex];
      if (!plot || !plot.plantId || !plot.plantedAt) return state;

      const plant = PLANT_MAP[plot.plantId];
      if (!plant) return state;

      const growSpeed = getGrowSpeedMultiplier(gh.growSpeedLevel);
      const adjustedGrowTime = plant.growTimeMs / growSpeed;
      const elapsed = Date.now() - plot.plantedAt;
      if (elapsed < adjustedGrowTime) return state; // not ready

      const dupeChance = getHarvestDupeChance(gh.harvestLevel);
      const isDupe = Math.random() < dupeChance;
      const multiplier = isDupe ? 2 : 1;

      const bonus = Math.floor(plant.harvestBonus * multiplier);
      const seedReturn = Math.floor(plant.seedReturnBase * multiplier);

      const newSeeds = { ...state.seeds };
      if (plot.plantId && !state.autoDeleteSeeds?.includes(plot.plantId)) {
        newSeeds[plot.plantId] = (newSeeds[plot.plantId] || 0) + seedReturn;
      }

      const newGreenhouses = state.greenhouses.map((g, gi) => {
        if (gi !== greenhouseIndex) return g;
        return {
          ...g,
          plots: g.plots.map((p, pi) => {
            if (pi !== plotIndex) return p;
            return { plantId: null, plantedAt: null, lastIncomeTick: Date.now() };
          }),
        };
      });

      return { ...state, currency: state.currency + bonus, seeds: newSeeds, greenhouses: newGreenhouses };
    }

    case 'ADD_PLOT': {
      const { greenhouseIndex } = action;
      const gh = state.greenhouses[greenhouseIndex];
      if (!gh || gh.plots.length >= MAX_PLOTS_PER_GREENHOUSE) return state;

      const cost = Math.floor(PLOT_COST_BASE * Math.pow(PLOT_COST_MULTIPLIER, gh.plots.length - 1));
      if (state.currency < cost) return state;

      const newGreenhouses = state.greenhouses.map((g, gi) => {
        if (gi !== greenhouseIndex) return g;
        return {
          ...g,
          plots: [...g.plots, { plantId: null, plantedAt: null, lastIncomeTick: Date.now() }],
        };
      });

      return { ...state, currency: state.currency - cost, greenhouses: newGreenhouses };
    }

    case 'UPGRADE_GROW_SPEED': {
      const { greenhouseIndex } = action;
      const gh = state.greenhouses[greenhouseIndex];
      if (!gh || gh.growSpeedLevel >= GROW_SPEED_MAX_LEVEL) return state;

      const cost = Math.floor(GROW_SPEED_UPGRADE_BASE * Math.pow(GROW_SPEED_UPGRADE_MULTIPLIER, gh.growSpeedLevel));
      if (state.currency < cost) return state;

      const newGreenhouses = state.greenhouses.map((g, gi) => {
        if (gi !== greenhouseIndex) return g;
        return { ...g, growSpeedLevel: g.growSpeedLevel + 1 };
      });

      return { ...state, currency: state.currency - cost, greenhouses: newGreenhouses };
    }

    case 'UPGRADE_HARVEST': {
      const { greenhouseIndex } = action;
      const gh = state.greenhouses[greenhouseIndex];
      if (!gh || gh.harvestLevel >= HARVEST_MAX_LEVEL) return state;

      const cost = Math.floor(HARVEST_UPGRADE_BASE * Math.pow(HARVEST_UPGRADE_MULTIPLIER, gh.harvestLevel));
      if (state.currency < cost) return state;

      const newGreenhouses = state.greenhouses.map((g, gi) => {
        if (gi !== greenhouseIndex) return g;
        return { ...g, harvestLevel: g.harvestLevel + 1 };
      });

      return { ...state, currency: state.currency - cost, greenhouses: newGreenhouses };
    }

    case 'TICK_GARDEN': {
      if (state.greenhouses.length === 0) return state;

      const now = Date.now();
      let totalIncome = 0;
      let changed = false;

      const newGreenhouses = state.greenhouses.map(gh => {
        const growSpeed = getGrowSpeedMultiplier(gh.growSpeedLevel);
        return {
          ...gh,
          plots: gh.plots.map(plot => {
            if (!plot.plantId || !plot.plantedAt) return plot;

            const plant = PLANT_MAP[plot.plantId];
            if (!plant) return plot;

            const adjustedGrowTime = plant.growTimeMs / growSpeed;
            const elapsed = now - plot.plantedAt;

            // Fully grown plants stop generating income
            if (elapsed >= adjustedGrowTime) return plot;

            // Calculate ticks since last income
            const ticksSinceLastIncome = Math.floor((now - plot.lastIncomeTick) / GARDEN_TICK_INTERVAL);
            if (ticksSinceLastIncome > 0) {
              totalIncome += plant.passiveIncomePerTick * ticksSinceLastIncome;
              changed = true;
              return { ...plot, lastIncomeTick: now };
            }

            return plot;
          }),
        };
      });

      if (!changed) return state;

      return { ...state, currency: state.currency + totalIncome, greenhouses: newGreenhouses };
    }

    case 'LOAD_STATE': {
      const loaded = action.state;
      if (loaded.smeltingQueue && loaded.smeltingQueue.length > 0) {
        const newQueue: SmeltingJob[] = [];
        for (const job of loaded.smeltingQueue) {
          const last = newQueue[newQueue.length - 1];
          if (last && last.oreId === job.oreId && last.refined === job.refined) {
            last.quantity = (last.quantity || 1) + (job.quantity || 1);
          } else {
            newQueue.push({ ...job, quantity: job.quantity || 1 });
          }
        }
        loaded.smeltingQueue = newQueue;
      }
      return loaded;
    }

    case 'ACKNOWLEDGE_UPDATE': {
      return { ...state, lastViewedVersion: action.version };
    }

    case 'PERFORM_REBIRTH': {
      if (!state.unlockedMachines.includes('quantum_lab')) return state;
      if (state.currency < 30_000_000) return state;
      if ((state.ingots['veinite'] || 0) < 30) return state;

      const nextRebirthCount = state.rebirthCount + 1;
      const numPoints = nextRebirthCount + 1; // You get N+1 points

      const newMiningPoints: MiningPoint[] = [];
      for (let i = 0; i < numPoints; i++) {
        newMiningPoints.push({
          id: `mp_${nextRebirthCount}_${i}`,
          name: `Extraction Point 0${i + 1}`,
          upgrades: { drill_speed: 0, ore_scanner: 0, multi_drill: 0, auto_miner_speed: 0 },
          autoMinerEnabled: false,
          lastAutoMine: 0,
        });
      }

      return {
        ...initialState,
        totalMined: state.totalMined,
        rebirthCount: nextRebirthCount,
        unlockedAchievements: state.unlockedAchievements,
        miningPoints: newMiningPoints,
        activeMiningPointId: newMiningPoints[0].id,
      };
    }

    // ─── Transmutation Actions ───────────────────────────────────────────────
    case 'START_TRANSMUTATION': {
      const { tableId, oreId, veiniteBoost, biomassBoost } = action;
      const table = state.transmutationTables.find(t => t.id === tableId);
      if (!table || table.activeJob) return state; // table busy

      const ore = ORE_MAP[oreId];
      if (!ore) return state;

      // Deduct 1 ingot of the chosen ore
      const currentIngot = state.ingots[oreId] || 0;
      if (currentIngot < 1) return state;

      // Deduct veinite boost ingots
      const currentVeinite = state.ingots['veinite'] || 0;
      if (currentVeinite < veiniteBoost) return state;

      const tier = getTierFromBoost(veiniteBoost);
      const duration = getTransmutationDuration(ore.tier, tier);

      const newIngots = { ...state.ingots };
      newIngots[oreId] = currentIngot - 1;
      if (newIngots[oreId] <= 0) delete newIngots[oreId];
      if (veiniteBoost > 0) {
        newIngots['veinite'] = (newIngots['veinite'] || 0) - veiniteBoost;
        if (newIngots['veinite'] <= 0) delete newIngots['veinite'];
      }

      const job: TransmutationJob = {
        id: `tj_${Date.now()}`,
        tableId,
        oreId,
        veiniteBoost,
        biomassBoost,
        startTime: Date.now(),
        duration,
        tier,
      };

      const newTables = state.transmutationTables.map(t =>
        t.id === tableId ? { ...t, activeJob: job } : t
      );

      return { ...state, ingots: newIngots, transmutationTables: newTables };
    }

    case 'COMPLETE_TRANSMUTATION': {
      const { tableId, result } = action;
      const newTables = state.transmutationTables.map(t =>
        t.id === tableId ? { ...t, activeJob: null } : t
      );
      return {
        ...state,
        transmutationTables: newTables,
        mutatedOres: [...state.mutatedOres, result],
      };
    }

    case 'TICK_TRANSMUTATION': {
      const now = Date.now();
      let newState = state;
      let changed = false;

      for (const table of state.transmutationTables) {
        const job = table.activeJob;
        if (!job) continue;
        if (now - job.startTime < job.duration) continue;

        // Job complete — roll result
        const failChance = getFailureChance(job.tier);
        const failed = Math.random() < failChance;

        let result: MutatedOre;
        if (failed) {
          const outcome = rollFailureOutcome();
          result = {
            id: `mo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            oreId: job.oreId,
            mutations: [],
            quantity: outcome === 'overgrowth' ? 3 : 1,
            createdAt: now,
            failureOutcome: outcome,
          };
        } else {
          const mutations = rollMutations(job.veiniteBoost, job.biomassBoost, job.tier);
          result = {
            id: `mo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            oreId: job.oreId,
            mutations,
            quantity: 1,
            createdAt: now,
          };
        }

        newState = gameReducer(newState, { type: 'COMPLETE_TRANSMUTATION', tableId: table.id, result });
        changed = true;
      }

      return changed ? newState : state;
    }

    case 'SELL_MUTATED_ORE': {
      const { mutatedOreId } = action;
      const mutated = state.mutatedOres.find(m => m.id === mutatedOreId);
      if (!mutated) return state;

      const ore = ORE_MAP[mutated.oreId];
      const baseValue = ore ? ore.value * 2.5 : 50; // ingot base value

      // Apply mutation multipliers
      let finalValue = baseValue;
      let bonusQty = 0;
      for (const mod of mutated.mutations) {
        if (mod.sellValueMultiplier) finalValue *= mod.sellValueMultiplier;
        if (mod.valueVariance) {
          const variance = (Math.random() * 2 - 1) * mod.valueVariance;
          finalValue *= (1 + variance);
        }
        if (mod.extraDropChance && Math.random() < mod.extraDropChance) bonusQty++;
      }

      // Bloodbound: scale with total mined
      for (const mod of mutated.mutations) {
        if (mod.id === 'bloodbound') {
          const thousands = Math.floor(state.totalMined / 1000);
          finalValue *= (1 + thousands * (mod.sellValueMultiplier! - 1));
        }
      }

      // Failure outcomes
      if (mutated.failureOutcome === 'degraded') finalValue *= 0.3;
      if (mutated.failureOutcome === 'corrupt_mass') finalValue = 0;
      if (mutated.failureOutcome === 'overgrowth') finalValue *= 0.5;

      const totalQty = mutated.quantity + bonusQty;
      const earned = Math.max(0, Math.floor(finalValue * totalQty));

      return {
        ...state,
        currency: state.currency + earned,
        mutatedOres: state.mutatedOres.filter(m => m.id !== mutatedOreId),
      };
    }

    case 'DISCARD_MUTATED_ORE': {
      return {
        ...state,
        mutatedOres: state.mutatedOres.filter(m => m.id !== action.mutatedOreId),
      };
    }

    // ─── Refinery Actions ─────────────────────────────────────────────────────
    case 'INSERT_ORE_REFINERY': {
      if (!state.refinery) return state;
      const { oreId, quantity } = action as { type: 'INSERT_ORE_REFINERY'; oreId: string; quantity: number };
      const available = state.ores[oreId] || 0;
      const toInsert = Math.min(quantity, available);
      if (toInsert <= 0) return state;

      const newOres = { ...state.ores };
      newOres[oreId] = available - toInsert;
      if (newOres[oreId] <= 0) delete newOres[oreId];

      const ref = { ...state.refinery };
      if (ref.inputOreId === oreId) {
        ref.inputQuantity += toInsert;
      } else {
        // Return any existing input ores
        if (ref.inputOreId && ref.inputQuantity > 0 && !ref.processing) {
          newOres[ref.inputOreId] = (newOres[ref.inputOreId] || 0) + ref.inputQuantity;
        }
        ref.inputOreId = oreId;
        ref.inputQuantity = toInsert;
      }

      // Start processing if not already
      if (!ref.processing && ref.inputQuantity > 0) {
        const sessionMs = Date.now() - ref.sessionStartTime;
        ref.processing = true;
        ref.processStartTime = Date.now();
        ref.processDuration = getProcessTime(ref.upgrades, sessionMs, state.mutatedOres.length);
      }

      return { ...state, ores: newOres, refinery: ref };
    }

    case 'TICK_REFINERY': {
      if (!state.refinery || !state.refinery.processing) {
        // Passive heat decay even when not processing
        if (state.refinery && state.refinery.heat > 0) {
          const ref = { ...state.refinery };
          ref.heat = Math.max(0, ref.heat - HEAT_DECAY_PER_SECOND);
          return { ...state, refinery: ref };
        }
        return state;
      }

      const now = Date.now();
      const ref = { ...state.refinery };
      const elapsed = now - ref.processStartTime;

      // Check for instant completion (Hypercycle Core)
      const hcLevel = ref.upgrades['hypercycle_core'] || 0;
      const isInstant = hcLevel > 0 && Math.random() < REFINERY_UPGRADE_MAP['hypercycle_core'].tiers[hcLevel - 1].effect;

      if (elapsed < ref.processDuration && !isInstant) {
        // Still processing, just decay heat
        ref.heat = Math.max(0, ref.heat - HEAT_DECAY_PER_SECOND * 0.5);
        return { ...state, refinery: ref };
      }

      // ─── Processing complete ───
      const sessionMs = now - ref.sessionStartTime;
      const batchSize = Math.min(getBatchSize(ref.upgrades, sessionMs), ref.inputQuantity);
      const ore = ref.inputOreId ? ORE_MAP[ref.inputOreId] : null;

      if (!ore || batchSize <= 0) {
        ref.processing = false;
        return { ...state, refinery: ref };
      }

      // Generate heat
      ref.heat = Math.min(HEAT_MAX, ref.heat + getHeatPerCycle(ref.upgrades));

      // Check high heat penalty
      const penalty = getHeatPenalty(ref.heat);
      let newOutputs = [...state.refineryOutputs];
      let newOres = { ...state.ores };
      let bonusCurrency = 0;

      // Critical Melt check
      const cmLevel = ref.upgrades['critical_melt'] || 0;
      const cmChance = cmLevel > 0 ? REFINERY_UPGRADE_MAP['critical_melt'].tiers[cmLevel - 1].effect : 0;
      const cmMultiplier = getCriticalMeltMultiplier(cmLevel);

      // Combustion Loop recovery
      const clLevel = ref.upgrades['combustion_loop'] || 0;
      const clRecovery = clLevel > 0 ? REFINERY_UPGRADE_MAP['combustion_loop'].tiers[clLevel - 1].effect : 0;

      // Refined Echo duplicate
      const reLevel = ref.upgrades['refined_echo'] || 0;
      const reDupeChance = reLevel > 0 ? REFINERY_UPGRADE_MAP['refined_echo'].tiers[reLevel - 1].effect : 0;

      // Living Conversion self-replication
      const lcLevel = ref.upgrades['living_conversion'] || 0;
      const lcChance = lcLevel > 0 ? REFINERY_UPGRADE_MAP['living_conversion'].tiers[lcLevel - 1].effect : 0;

      // Hemophage Recycling biomass generation
      const hrLevel = ref.upgrades['hemophage_recycling'] || 0;
      const hrChance = hrLevel > 0 ? REFINERY_UPGRADE_MAP['hemophage_recycling'].tiers[hrLevel - 1].effect : 0;

      let newItems = { ...state.items };

      for (let i = 0; i < batchSize; i++) {
        // Critical melt: destroy ore for big payout
        if (Math.random() < cmChance) {
          bonusCurrency += Math.floor(ore.value * cmMultiplier);
          // Combustion loop: chance to recover
          if (Math.random() < clRecovery) {
            newOres[ore.id] = (newOres[ore.id] || 0) + 1;
          }
          continue;
        }

        // High heat penalty: ore destroyed
        if (penalty.oreDestroyed && Math.random() < 0.3) {
          if (Math.random() < clRecovery) {
            newOres[ore.id] = (newOres[ore.id] || 0) + 1;
          }
          continue;
        }

        // Roll output type
        const outputType = rollOutputType(ref.upgrades, sessionMs, ref.heat);
        let valueMult = getOutputValueMultiplier(outputType, ref.upgrades, ref.heat);
        valueMult *= penalty.valuePenalty;

        let qty = 1;
        // Refined Echo duplicate
        if (Math.random() < reDupeChance) qty = 2;

        const output: RefineryOutput = {
          id: `ro_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          oreId: ore.id,
          outputType,
          quantity: qty,
          valueMultiplier: valueMult,
          collected: false,
        };
        newOutputs.push(output);

        // Hemophage: generate biomass item
        if (Math.random() < hrChance) {
          newItems['biomass'] = (newItems['biomass'] || 0) + 1;
        }
      }

      // Living Conversion: self-replication
      if (Math.random() < lcChance) {
        newOres[ore.id] = (newOres[ore.id] || 0) + 1;
      }

      // Update refinery state
      ref.inputQuantity -= batchSize;
      ref.totalProcessed += batchSize;

      if (ref.inputQuantity > 0) {
        // Continue processing
        ref.processStartTime = now;
        ref.processDuration = getProcessTime(ref.upgrades, sessionMs, state.mutatedOres.length);
      } else {
        ref.processing = false;
        ref.inputOreId = null;
      }

      return {
        ...state,
        refinery: ref,
        refineryOutputs: newOutputs,
        ores: newOres,
        items: newItems,
        currency: state.currency + bonusCurrency,
      };
    }

    case 'COLLECT_REFINERY_OUTPUT': {
      const { outputId } = action as { type: 'COLLECT_REFINERY_OUTPUT'; outputId: string };
      const output = state.refineryOutputs.find(o => o.id === outputId);
      if (!output || output.collected) return state;

      const ore = ORE_MAP[output.oreId];
      if (!ore) return state;

      const value = Math.floor(ore.value * output.valueMultiplier * output.quantity);

      return {
        ...state,
        currency: state.currency + value,
        refineryOutputs: state.refineryOutputs.filter(o => o.id !== outputId),
      };
    }

    case 'COLLECT_ALL_REFINERY_OUTPUTS': {
      let totalValue = 0;
      for (const output of state.refineryOutputs) {
        const ore = ORE_MAP[output.oreId];
        if (ore) {
          totalValue += Math.floor(ore.value * output.valueMultiplier * output.quantity);
        }
      }

      return {
        ...state,
        currency: state.currency + totalValue,
        refineryOutputs: [],
      };
    }

    case 'UPGRADE_REFINERY': {
      if (!state.refinery) return state;
      const { upgradeId } = action as { type: 'UPGRADE_REFINERY'; upgradeId: string };
      const upgradeDef = REFINERY_UPGRADE_MAP[upgradeId];
      if (!upgradeDef) return state;

      const currentLevel = state.refinery.upgrades[upgradeId] || 0;
      if (currentLevel >= upgradeDef.maxTier) return state;

      const tier = upgradeDef.tiers[currentLevel];
      if (!tier) return state;

      // Check costs
      let newState = { ...state };
      let newCurrency = state.currency;
      const newItems = { ...state.items };
      const newIngots = { ...state.ingots };

      for (const cost of tier.cost) {
        if (cost.type === 'currency') {
          if (newCurrency < cost.quantity) return state;
        } else if (cost.type === 'item') {
          if ((newItems[cost.itemId] || 0) < cost.quantity) return state;
        } else if (cost.type === 'ingot') {
          if ((newIngots[cost.itemId] || 0) < cost.quantity) return state;
        }
      }

      // Deduct costs
      for (const cost of tier.cost) {
        if (cost.type === 'currency') {
          newCurrency -= cost.quantity;
        } else if (cost.type === 'item') {
          newItems[cost.itemId] = (newItems[cost.itemId] || 0) - cost.quantity;
          if (newItems[cost.itemId] <= 0) delete newItems[cost.itemId];
        } else if (cost.type === 'ingot') {
          newIngots[cost.itemId] = (newIngots[cost.itemId] || 0) - cost.quantity;
          if (newIngots[cost.itemId] <= 0) delete newIngots[cost.itemId];
        }
      }

      const newRef = { ...state.refinery };
      newRef.upgrades = { ...newRef.upgrades, [upgradeId]: currentLevel + 1 };

      return {
        ...newState,
        currency: newCurrency,
        items: newItems,
        ingots: newIngots,
        refinery: newRef,
      };
    }

    case 'RESET_REFINERY_HEAT': {
      if (!state.refinery) return state;
      return {
        ...state,
        refinery: { ...state.refinery, heat: Math.max(0, state.refinery.heat - 30) },
      };
    }

    default:
      return state;
  }
}

function gameReducer(state: GameState, action: Action): GameState {
  const nextState = gameReducerBase(state, action);
  return checkAchievements(nextState);
}

// ─── Automation interval by machine tier ─────────────────────────────────────
const MACHINE_INTERVALS: Record<string, number> = {
  wafer_cutter: 12000,
  etching_station: 10000,
  cnc_mill: 9000,
  laser_cutter: 8000,
  plasma_welder: 7000,
  chemical_reactor: 7000,
  lithography_machine: 6000,
  centrifuge: 5000,
  advanced_fab: 4000,
  quantum_lab: 3000,
};

function getAutomationInterval(machineId: string): number {
  return MACHINE_INTERVALS[machineId] ?? 10000;
}

// ─── Save state migration ────────────────────────────────────────────────────
const ORE_ID_REMAP: Record<string, string> = {
  silicon: 'quartz',
  neodymium: 'monazite',
};

const FOUNDRY_TIER_REMAP: Record<number, number> = {
  1: 1,
  2: 2,
  3: 5,
};

function migrateOreRecord(record: Record<string, number>): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [key, val] of Object.entries(record)) {
    const newKey = ORE_ID_REMAP[key] || key;
    if (ORE_MAP[newKey]) {
      result[newKey] = (result[newKey] || 0) + val;
    }
  }
  return result;
}

function migrateState(saved: any): GameState {
  const state = { ...initialState, ...saved, smeltingJobs: [] };

  if (state.ores) state.ores = migrateOreRecord(state.ores);
  if (state.refinedOres) state.refinedOres = migrateOreRecord(state.refinedOres);
  if (state.ingots) state.ingots = migrateOreRecord(state.ingots);

  if (state.foundryTier && FOUNDRY_TIER_REMAP[state.foundryTier] !== undefined && state.foundryTier <= 3) {
    state.foundryTier = FOUNDRY_TIER_REMAP[state.foundryTier];
  }

  // Handle older save shape for mining upgrades
  if (!state.miningPoints || state.miningPoints.length === 0) {
    const legacyUpgrades = (state as any).miningUpgrades || { drill_speed: 0, ore_scanner: 0, multi_drill: 0 };
    const legacyAuto = !!(state as any).autoMinerEnabled;
    state.miningPoints = [{
      id: 'mp_legacy',
      name: 'Extraction Point 01',
      upgrades: legacyUpgrades,
      autoMinerEnabled: legacyAuto,
      lastAutoMine: 0,
    }];
    state.activeMiningPointId = 'mp_legacy';
  }

  if (state.rebirthCount === undefined) state.rebirthCount = 0;
  if (!state.unlockedAchievements) state.unlockedAchievements = [];

  if (!state.automationJobs) state.automationJobs = [];
  if (!state.seeds) state.seeds = {};
  if (!state.greenhouses) state.greenhouses = [];
  if (!state.lastSpecialDrop) state.lastSpecialDrop = null;
  if (!state.smeltingQueue) state.smeltingQueue = [];
  if (!state.transmutationTables) state.transmutationTables = [];
  if (!state.mutatedOres) state.mutatedOres = [];
  if (state.refinery === undefined) state.refinery = null;
  if (!state.refineryOutputs) state.refineryOutputs = [];
  // Reset session start time for refinery on load
  if (state.refinery) {
    state.refinery.sessionStartTime = Date.now();
    state.refinery.processing = false; // stop stale processing
  }

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
  const [loaded, setLoaded] = useState(false);
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
      const { lastDrop, lastSpecialDrop, ...saveable } = gameState;
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

  const pendingSaveRef = useRef<GameState | null>(null);

  useEffect(() => {
    const { lastDrop, smeltingJobs, lastSpecialDrop, ...toSave } = state;
    localStorage.setItem('voidmarket_state', JSON.stringify(toSave));
    pendingSaveRef.current = state;
  }, [state]);

  // Periodic saver (throttle Supabase sync to every 15s to prevent database overload)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!pendingSaveRef.current) return;
      
      const stateToSave = pendingSaveRef.current;
      const { lastDrop, lastSpecialDrop, ...toSave } = stateToSave;
      const serialized = JSON.stringify(toSave);
      
      if (serialized !== lastSavedRef.current) {
        lastSavedRef.current = serialized;
        saveToSupabase(stateToSave);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [saveToSupabase]);

  // Save on tab close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!pendingSaveRef.current) return;
      const stateToSave = pendingSaveRef.current;
      const { lastDrop, lastSpecialDrop, ...toSave } = stateToSave;
      const serialized = JSON.stringify(toSave);
      
      if (serialized !== lastSavedRef.current) {
        // We use fetch with keepalive if possible, or just fire and forget
        // Standard supabase update usually works in beforeunload if it's fast
        saveToSupabase(stateToSave);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveToSupabase]);

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

  // Auto-miner tick loop (multi-point support)
  useEffect(() => {
    const interval = setInterval(() => dispatch({ type: 'TICK_AUTO_MINERS' }), 100);
    return () => clearInterval(interval);
  }, []);

  // Garden tick
  useEffect(() => {
    if (state.greenhouses.length === 0) return;
    const interval = setInterval(() => dispatch({ type: 'TICK_GARDEN' }), GARDEN_TICK_INTERVAL);
    return () => clearInterval(interval);
  }, [state.greenhouses.length]);

  // Transmutation tick
  useEffect(() => {
    if (state.transmutationTables.length === 0) return;
    const interval = setInterval(() => dispatch({ type: 'TICK_TRANSMUTATION' }), 1000);
    return () => clearInterval(interval);
  }, [state.transmutationTables.length]);

  // Refinery tick
  useEffect(() => {
    if (!state.refinery) return;
    const interval = setInterval(() => dispatch({ type: 'TICK_REFINERY' }), REFINERY_TICK_MS);
    return () => clearInterval(interval);
  }, [!!state.refinery]);

  const activePoint = state.miningPoints.find(p => p.id === state.activeMiningPointId) || state.miningPoints[0];
  const miningSpeed = getMiningSpeed(activePoint);
  const foundry = getCurrentFoundry(state);

  // Expose global giveMe command for console
  useEffect(() => {
    (window as any).giveMe = (itemNameOrId: string, quantity: number = 1) => {
      const q = Number(quantity) || 1;
      const term = itemNameOrId.toLowerCase();
      
      const special = SPECIAL_MINING_DROPS.find(s => s.name.toLowerCase() === term || s.id === term);
      const ore = ALL_ORES.find(o => o.name.toLowerCase() === term || o.id === term);
      const recipe = Object.values(RECIPE_MAP).find(r => r.name.toLowerCase() === term || r.id === term);
      
      const id = special?.id || ore?.id || recipe?.id || itemNameOrId;
      dispatch({ type: 'GIVE_ITEM', itemId: id, quantity: q });
      console.log(`%c[ADMIN] %cGiving ${q}x ${id}`, 'color: #8F00FF; font-weight: bold', 'color: inherit');
    };
  }, [dispatch]);

  // Sound effect for artifacts
  useEffect(() => {
    if (state.lastSpecialDrop && state.lastSpecialDrop.rarity === 'artifact') {
      playSound('artifact', 0.8);
    }
  }, [state.lastSpecialDrop?.timestamp]);

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

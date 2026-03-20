import { createContext, useContext, useReducer, useEffect, useRef, useCallback, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ALL_ORES, ORE_MAP, rollMiningDrop, rollSpecialDrops, type Ore, type OreRarity } from '@/data/ores';
import { MINING_UPGRADES, FOUNDRY_TIERS, CRAFTING_RECIPES, RECIPE_MAP, type FoundryUpgrade } from '@/data/recipes';
import {
  PLANT_MAP, ALL_PLANTS, rollSeedFromPack,
  PLOT_COST_BASE, PLOT_COST_MULTIPLIER,
  GROW_SPEED_UPGRADE_BASE, GROW_SPEED_UPGRADE_MULTIPLIER,
  HARVEST_UPGRADE_BASE, HARVEST_UPGRADE_MULTIPLIER,
  MAX_PLOTS_PER_GREENHOUSE, GROW_SPEED_MAX_LEVEL, HARVEST_MAX_LEVEL,
  GARDEN_TICK_INTERVAL,
  type PlantDef, type PlantRarity,
} from '@/data/garden';

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

export interface GameState {
  currency: number;
  ores: Record<string, number>;
  refinedOres: Record<string, number>;
  ingots: Record<string, number>;
  items: Record<string, number>;
  seeds: Record<string, number>; // plantId -> count
  miningUpgrades: Record<string, number>;
  foundryTier: number;
  smeltingJobs: SmeltingJob[];
  smeltingQueue: SmeltingJob[];
  unlockedMachines: string[];
  automationJobs: AutomationJob[];
  autoMinerEnabled: boolean;
  totalMined: number;
  lastDrop: { ore: Ore; quantity: number } | null;
  lastSpecialDrop: string | null; // name of last special drop for UI feedback
  greenhouses: Greenhouse[];
}

const initialState: GameState = {
  currency: 100,
  ores: {},
  refinedOres: {},
  ingots: {},
  items: {},
  seeds: {},
  miningUpgrades: { drill_speed: 0, ore_scanner: 0, multi_drill: 0 },
  foundryTier: 1,
  smeltingJobs: [],
  smeltingQueue: [],
  unlockedMachines: [],
  automationJobs: [],
  autoMinerEnabled: false,
  totalMined: 0,
  lastDrop: null,
  lastSpecialDrop: null,
  greenhouses: [],
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
  | { type: 'START_SMELT'; oreId: string; refined: boolean; quantity?: number }
  | { type: 'COMPLETE_SMELT'; jobIndex: number }
  | { type: 'CANCEL_SMELTIC_JOB'; jobIndex: number; isQueue: boolean }
  | { type: 'UPGRADE_MINING'; upgradeId: string }
  | { type: 'UPGRADE_FOUNDRY' }
  | { type: 'CRAFT_ITEM'; recipeId: string }
  | { type: 'TICK_SMELTING' }
  | { type: 'TOGGLE_AUTO_MINER' }
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
  | { type: 'TICK_GARDEN' };

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

export function getGrowSpeedMultiplier(level: number): number {
  return 1 + level * 0.15; // 15% faster per level
}

export function getHarvestDupeChance(level: number): number {
  return level * 0.05; // 5% chance per level (max 50% at lv10)
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

      // Check for special drops
      const specialDrops = rollSpecialDrops();
      let newItems = state.items;
      let lastSpecialDrop: string | null = null;

      if (specialDrops.length > 0) {
        newItems = { ...state.items };
        for (const drop of specialDrops) {
          newItems[drop.id] = (newItems[drop.id] || 0) + 1;
          lastSpecialDrop = drop.name;
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

      for (let i = 0; i < toStartCount; i++) {
        const job: SmeltingJob = { oreId, refined, startTime: 0, duration };
        if (newActiveJobs.length < foundry.slots) {
          job.startTime = Date.now();
          newActiveJobs.push(job);
        } else {
          newQueuedJobs.push(job);
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
      if (newActiveJobs.length < foundry.slots && newQueuedJobs.length > 0) {
        const nextJob = { ...newQueuedJobs.shift()! };
        nextJob.startTime = Date.now();
        newActiveJobs.push(nextJob);
      }

      return { ...state, ingots: newIngots, smeltingJobs: newActiveJobs, smeltingQueue: newQueuedJobs };
    }

    case 'CANCEL_SMELTIC_JOB': {
      const { jobIndex, isQueue } = action;
      const job = isQueue ? state.smeltingQueue[jobIndex] : state.smeltingJobs[jobIndex];
      if (!job) return state;

      const sourceKey = job.refined ? 'refinedOres' : 'ores';
      const newSource = { ...state[sourceKey] };
      newSource[job.oreId] = (newSource[job.oreId] || 0) + 1;

      let newActiveJobs = [...state.smeltingJobs];
      let newQueuedJobs = [...state.smeltingQueue];

      if (isQueue) {
        newQueuedJobs.splice(jobIndex, 1);
      } else {
        newActiveJobs.splice(jobIndex, 1);
        // Start next job from queue if it was an active job cancelled
        const foundry = getCurrentFoundry(state);
        if (newActiveJobs.length < foundry.slots && newQueuedJobs.length > 0) {
          const nextJob = { ...newQueuedJobs.shift()! };
          nextJob.startTime = Date.now();
          newActiveJobs.push(nextJob);
        }
      }

      return { ...state, [sourceKey]: newSource, smeltingJobs: newActiveJobs, smeltingQueue: newQueuedJobs };
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
      let newMachines = recipe.category === 'machine'
        ? [...new Set([...newState.unlockedMachines, recipe.id])]
        : newState.unlockedMachines;

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

      return { ...newState, ingots: newIngots, items: newItems, unlockedMachines: newMachines, greenhouses: newGreenhouses };
    }

    case 'TOGGLE_AUTO_MINER': {
      return { ...state, autoMinerEnabled: !state.autoMinerEnabled };
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
      let newState = state;

      for (const job of state.automationJobs) {
        if (!job.enabled) continue;
        if (now - job.lastCraft < job.interval) continue;

        const recipe = RECIPE_MAP[job.recipeId];
        if (!recipe) continue;
        if (recipe.requiredMachine && !newState.unlockedMachines.includes(recipe.requiredMachine)) continue;

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

    // ─── Garden Actions ─────────────────────────────────────────────────────
    case 'OPEN_SEED_PACK': {
      const seedPacks = state.items['seed_pack'] || 0;
      if (seedPacks < 1) return state;

      const plant = rollSeedFromPack();
      const newItems = { ...state.items };
      newItems['seed_pack'] = seedPacks - 1;
      if (newItems['seed_pack'] <= 0) delete newItems['seed_pack'];

      const newSeeds = { ...state.seeds };
      newSeeds[plant.id] = (newSeeds[plant.id] || 0) + 1;

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
      const gh = state.greenhouses[greenhouseIndex];
      if (!gh) return state;

      let currentSeeds = { ...state.seeds };
      const rarityPriority: PlantRarity[] = ['legendary', 'epic', 'rare', 'uncommon', 'common'];

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

      const newGreenhouses = state.greenhouses.map((g, gi) => (gi === greenhouseIndex ? { ...g, plots: newPlots } : g));
      return { ...state, seeds: currentSeeds, greenhouses: newGreenhouses };
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
      newSeeds[plot.plantId] = (newSeeds[plot.plantId] || 0) + seedReturn;

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

    case 'LOAD_STATE':
      return action.state;

    default:
      return state;
  }
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

  if (!state.automationJobs) state.automationJobs = [];
  if (state.autoMinerEnabled === undefined) state.autoMinerEnabled = false;
  if (!state.seeds) state.seeds = {};
  if (!state.greenhouses) state.greenhouses = [];
  if (!state.lastSpecialDrop) state.lastSpecialDrop = null;
  if (!state.smeltingQueue) state.smeltingQueue = [];

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
      const { lastDrop, smeltingJobs, lastSpecialDrop, ...saveable } = gameState;
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
    const { lastDrop, smeltingJobs, lastSpecialDrop, ...toSave } = state;
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

  // Garden tick
  useEffect(() => {
    if (state.greenhouses.length === 0) return;
    const interval = setInterval(() => dispatch({ type: 'TICK_GARDEN' }), GARDEN_TICK_INTERVAL);
    return () => clearInterval(interval);
  }, [state.greenhouses.length]);

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

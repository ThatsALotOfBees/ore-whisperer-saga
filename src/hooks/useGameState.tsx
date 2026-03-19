import { createContext, useContext, useReducer, useCallback, useEffect, ReactNode } from 'react';
import { ALL_ORES, ORE_MAP, rollMiningDrop, type Ore, type OreRarity } from '@/data/ores';
import { MINING_UPGRADES, FOUNDRY_TIERS, CRAFTING_RECIPES, RECIPE_MAP } from '@/data/recipes';

export interface SmeltingJob {
  oreId: string;
  refined: boolean;
  startTime: number;
  duration: number;
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
  totalMined: 0,
  lastDrop: null,
};

type Action =
  | { type: 'MINE_TICK' }
  | { type: 'SELL_ITEM'; itemId: string; itemType: 'ore' | 'refined' | 'ingot' | 'item'; quantity: number }
  | { type: 'CREATE_LISTING'; itemId: string; itemType: 'ore' | 'refined' | 'ingot' | 'item'; quantity: number; pricePerUnit: number }
  | { type: 'BUY_ITEM'; listingId: string }
  | { type: 'CANCEL_LISTING'; listingId: string }
  | { type: 'REFINE_ORE'; oreId: string; quantity: number }
  | { type: 'START_SMELT'; oreId: string; refined: boolean }
  | { type: 'COMPLETE_SMELT'; jobIndex: number }
  | { type: 'UPGRADE_MINING'; upgradeId: string }
  | { type: 'UPGRADE_FOUNDRY' }
  | { type: 'CRAFT_ITEM'; recipeId: string }
  | { type: 'TICK_SMELTING' }
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

function getCurrentFoundry(state: GameState) {
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
      const source = refined ? state.refinedOres : state.ores;
      if ((source[oreId] || 0) < 1) return state;

      const newSource = { ...source };
      newSource[oreId] = (newSource[oreId] || 0) - 1;
      if (newSource[oreId] <= 0) delete newSource[oreId];

      const baseDuration = 5000;
      const duration = baseDuration / foundry.speedMultiplier;

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

    case 'CREATE_LISTING': {
      const { itemId, itemType, quantity, pricePerUnit } = action;
      const source = itemType === 'ore' ? 'ores' : itemType === 'refined' ? 'refinedOres' : itemType === 'ingot' ? 'ingots' : 'items';
      const current = state[source][itemId] || 0;
      if (current < quantity) return state;

      const newSource = { ...state[source] };
      newSource[itemId] = current - quantity;
      if (newSource[itemId] <= 0) delete newSource[itemId];

      return { ...state, [source]: newSource };
    }

    case 'BUY_ITEM': {
      // This will be handled by the marketplace component
      return state;
    }

    case 'CANCEL_LISTING': {
      // This will be handled by the marketplace component  
      return state;
    }

    default:
      return state;
  }
}

interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<Action>;
  miningSpeed: number;
  foundry: ReturnType<typeof getCurrentFoundry>;
}

const GameContext = createContext<GameContextType | null>(null);

function loadState(): GameState {
  try {
    const saved = localStorage.getItem('voidmarket_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...initialState, ...parsed, smeltingJobs: [] };
    }
  } catch {}
  return initialState;
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, loadState);

  useEffect(() => {
    const { lastDrop, ...toSave } = state;
    localStorage.setItem('voidmarket_state', JSON.stringify(toSave));
  }, [state]);

  // Tick smelting
  useEffect(() => {
    const interval = setInterval(() => dispatch({ type: 'TICK_SMELTING' }), 500);
    return () => clearInterval(interval);
  }, []);

  const miningSpeed = getMiningSpeed(state);
  const foundry = getCurrentFoundry(state);

  return (
    <GameContext.Provider value={{ state, dispatch, miningSpeed, foundry }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}

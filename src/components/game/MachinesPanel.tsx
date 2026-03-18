import { useState, useEffect, useMemo } from 'react';
import { useGame, type AutomationJob } from '@/hooks/useGameState';
import { getAutomationInterval, getMachineUpgradeCost, MACHINE_UPGRADE_MAX_LEVEL } from '@/data/machines';
import { CRAFTING_RECIPES, RECIPE_MAP, type CraftingRecipe } from '@/data/recipes';
import { ORE_MAP } from '@/data/ores';

/** Recipes that a given machine can produce (recipes that require it, or general recipes). */
function getRecipesForMachine(machineId: string): CraftingRecipe[] {
  return CRAFTING_RECIPES.filter(
    r => r.requiredMachine === machineId || (!r.requiredMachine && r.category !== 'machine'),
  );
}

function MachineCard({
  machineId,
  job,
  level,
  now,
}: {
  machineId: string;
  job: AutomationJob | undefined;
  level: number;
  now: number;
}) {
  const { state, dispatch } = useGame();
  const [selecting, setSelecting] = useState(false);
  const [search, setSearch] = useState('');

  const recipe = job ? RECIPE_MAP[job.recipeId] : null;
  const machineRecipe = RECIPE_MAP[machineId];
  const machineName = machineRecipe?.name || machineId;

  const interval = getAutomationInterval(machineId, level);
  const elapsed = job && job.enabled ? Math.min(now - job.lastCraft, interval) : 0;
  const progressPct = job && job.enabled ? Math.min(100, (elapsed / interval) * 100) : 0;

  const upgradeCost = getMachineUpgradeCost(machineId, level);
  const canUpgrade = level < MACHINE_UPGRADE_MAX_LEVEL && state.currency >= upgradeCost;

  const availableRecipes = useMemo(() => {
    let recipes = getRecipesForMachine(machineId);
    if (search) {
      const q = search.toLowerCase();
      recipes = recipes.filter(r => r.name.toLowerCase().includes(q));
    }
    return recipes;
  }, [machineId, search]);

  const canCraftRecipe = (r: CraftingRecipe) => {
    return r.ingredients.every(ing => {
      const source = ing.type === 'ingot' ? state.ingots : state.items;
      return (source[ing.itemId] || 0) >= ing.quantity;
    });
  };

  return (
    <div className="min-w-[260px] max-w-[300px] flex-shrink-0 border border-border bg-card rounded-sm flex flex-col">
      {/* Machine header */}
      <div className="px-3 py-2 border-b border-border">
        <div className="flex items-center justify-between">
          <span className="font-mono-game text-xs text-foreground truncate">{machineName}</span>
          <span className="font-mono-game text-[9px] text-muted-foreground">Lv.{level}</span>
        </div>
        <p className="font-mono-game text-[9px] text-muted-foreground mt-0.5">
          Interval: {(interval / 1000).toFixed(1)}s
        </p>
      </div>

      {/* Current production */}
      <div className="px-3 py-2 flex-1">
        {recipe && job ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono-game text-[10px] text-primary truncate">
                {recipe.name} x{recipe.outputQuantity}
              </span>
              <button
                onClick={() => dispatch({ type: 'TOGGLE_AUTOMATION', machineId, recipeId: job.recipeId })}
                className={`font-mono-game text-[9px] uppercase px-1.5 py-0.5 border transition-colors ${
                  job.enabled
                    ? 'border-primary text-primary bg-primary/10'
                    : 'border-destructive/50 text-destructive'
                }`}
              >
                {job.enabled ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Ingredients status */}
            <div className="flex flex-wrap gap-1">
              {recipe.ingredients.map((ing, i) => {
                const source = ing.type === 'ingot' ? state.ingots : state.items;
                const have = source[ing.itemId] || 0;
                const enough = have >= ing.quantity;
                const label =
                  ing.type === 'ingot'
                    ? (ORE_MAP[ing.itemId]?.name || ing.itemId) + ' Ingot'
                    : RECIPE_MAP[ing.itemId]?.name || ing.itemId;
                return (
                  <span
                    key={i}
                    className={`font-mono-game text-[8px] px-1 py-0.5 border rounded-sm ${
                      enough ? 'border-primary/30 text-primary' : 'border-destructive/30 text-destructive'
                    }`}
                  >
                    {have}/{ing.quantity} {label}
                  </span>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="font-mono-game text-[10px] text-muted-foreground/50 text-center py-3">
            No recipe selected
          </p>
        )}

        <button
          onClick={() => setSelecting(!selecting)}
          className="mt-2 w-full font-mono-game text-[9px] uppercase tracking-wider py-1 border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
        >
          {selecting ? 'Close' : 'Select Recipe'}
        </button>

        {/* Recipe selector */}
        {selecting && (
          <div className="mt-2 space-y-1">
            <input
              type="text"
              placeholder="Search recipes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-background border border-border px-2 py-1 font-mono-game text-[9px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent"
            />
            <div className="max-h-[140px] overflow-y-auto custom-scrollbar space-y-0.5">
              {availableRecipes.length === 0 && (
                <p className="text-[9px] text-muted-foreground/50 text-center py-2">No recipes</p>
              )}
              {availableRecipes.map(r => {
                const craftable = canCraftRecipe(r);
                const isActive = job?.recipeId === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => {
                      dispatch({ type: 'TOGGLE_AUTOMATION', machineId, recipeId: r.id });
                      setSelecting(false);
                      setSearch('');
                    }}
                    className={`w-full text-left font-mono-game text-[9px] px-2 py-1 border transition-colors ${
                      isActive
                        ? 'border-primary bg-primary/10 text-primary'
                        : craftable
                          ? 'border-border hover:border-primary/30 text-foreground'
                          : 'border-border/50 text-muted-foreground/60'
                    }`}
                  >
                    <span className="truncate block">{r.name}</span>
                    <span className="text-[8px] text-muted-foreground">{r.category}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="px-3 pb-2">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-200"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="font-mono-game text-[8px] text-muted-foreground/60 text-right mt-0.5">
          {Math.floor(progressPct)}%
        </p>
      </div>

      {/* Upgrade button */}
      <div className="px-3 pb-2">
        <button
          onClick={() => dispatch({ type: 'UPGRADE_MACHINE', machineId })}
          disabled={!canUpgrade}
          className="w-full font-mono-game text-[9px] uppercase tracking-wider py-1 border border-accent text-accent hover:bg-accent/10 disabled:opacity-30 transition-colors"
        >
          {level >= MACHINE_UPGRADE_MAX_LEVEL
            ? 'Max Level'
            : `Upgrade (${upgradeCost.toLocaleString()})`}
        </button>
      </div>
    </div>
  );
}

export function MachinesPanel() {
  const { state } = useGame();
  const [now, setNow] = useState(Date.now());

  // Tick the timer for progress bars
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(interval);
  }, []);

  const jobMap = useMemo(() => {
    const map: Record<string, AutomationJob> = {};
    for (const job of state.automationJobs) {
      map[job.machineId] = job;
    }
    return map;
  }, [state.automationJobs]);

  if (state.unlockedMachines.length === 0) {
    return (
      <div className="p-4">
        <p className="font-mono-game text-xs text-muted-foreground/50 text-center py-8">
          No machines unlocked yet. Craft machines in the Fabrication Lab.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-mono-game text-xs tracking-[0.2em] uppercase text-muted-foreground">
          Machine Bay
        </h2>
        <span className="font-mono-game text-[10px] text-accent">
          {state.unlockedMachines.length} machine{state.unlockedMachines.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Horizontal scrolling machine list */}
      <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
        {state.unlockedMachines.map(machineId => (
          <MachineCard
            key={machineId}
            machineId={machineId}
            job={jobMap[machineId]}
            level={state.machineLevels[machineId] || 0}
            now={now}
          />
        ))}
      </div>
    </div>
  );
}

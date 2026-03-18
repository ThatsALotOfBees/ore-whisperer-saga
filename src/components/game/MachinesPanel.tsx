import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '@/hooks/useGameState';
import { CRAFTING_RECIPES, RECIPE_MAP, type CraftingRecipe } from '@/data/recipes';
import { ORE_MAP } from '@/data/ores';

export function MachinesPanel() {
  const { state, dispatch } = useGame();
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  // Tick for progress bars
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(interval);
  }, []);

  // Get all unlocked machines
  const unlockedMachines = useMemo(() => {
    return state.unlockedMachines
      .map(id => RECIPE_MAP[id])
      .filter(Boolean) as CraftingRecipe[];
  }, [state.unlockedMachines]);

  // Auto-select first machine
  useEffect(() => {
    if (!selectedMachine && unlockedMachines.length > 0) {
      setSelectedMachine(unlockedMachines[0].id);
    }
  }, [unlockedMachines, selectedMachine]);

  // Get recipes that require the selected machine
  const machineRecipes = useMemo(() => {
    if (!selectedMachine) return [];
    return CRAFTING_RECIPES.filter(r => r.requiredMachine === selectedMachine);
  }, [selectedMachine]);

  // Get automation job for selected machine
  const automationJob = useMemo(() => {
    return state.automationJobs.find(j => j.machineId === selectedMachine);
  }, [state.automationJobs, selectedMachine]);

  const canCraft = (recipe: CraftingRecipe) => {
    return recipe.ingredients.every(ing => {
      const source = ing.type === 'ingot' ? state.ingots : state.items;
      return (source[ing.itemId] || 0) >= ing.quantity;
    });
  };

  const getIngredientLabel = (itemId: string, type: 'ingot' | 'item') => {
    if (type === 'ingot') {
      return (ORE_MAP[itemId]?.name || itemId) + ' Ingot';
    }
    return RECIPE_MAP[itemId]?.name || itemId;
  };

  if (unlockedMachines.length === 0) return null;

  const selectedMachineData = selectedMachine ? RECIPE_MAP[selectedMachine] : null;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-mono-game text-xs tracking-[0.2em] uppercase text-muted-foreground">Machine Bay</h2>
        <span className="font-mono-game text-[10px] text-accent">
          {unlockedMachines.length} machine{unlockedMachines.length !== 1 ? 's' : ''} online
        </span>
      </div>

      {/* Machine carousel */}
      <div className="overflow-x-auto custom-scrollbar pb-2">
        <div className="flex gap-3 min-w-min">
          {unlockedMachines.map(machine => {
            const job = state.automationJobs.find(j => j.machineId === machine.id);
            const isSelected = selectedMachine === machine.id;
            const isRunning = job?.enabled;
            let progress = 0;
            if (job?.enabled) {
              const elapsed = now - job.lastCraft;
              progress = Math.min(100, (elapsed / job.interval) * 100);
            }

            return (
              <motion.button
                key={machine.id}
                onClick={() => {
                  setSelectedMachine(machine.id);
                  setSelectedRecipe(null);
                }}
                whileHover={{ y: -2 }}
                className={`flex-shrink-0 w-44 border rounded-sm p-3 space-y-2 text-left transition-colors ${
                  isSelected
                    ? 'border-primary bg-primary/10'
                    : isRunning
                    ? 'border-accent/40 bg-accent/5'
                    : 'border-border bg-card hover:border-border/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono-game text-[10px] text-foreground truncate">{machine.name}</span>
                  {isRunning && (
                    <span className="font-mono-game text-[8px] text-accent uppercase animate-pulse">RUN</span>
                  )}
                </div>

                {job?.enabled && (
                  <div className="space-y-1">
                    <p className="font-mono-game text-[8px] text-muted-foreground truncate">
                      → {RECIPE_MAP[job.recipeId]?.name || 'Unknown'}
                    </p>
                  </div>
                )}

                {!job?.enabled && (
                  <p className="font-mono-game text-[8px] text-muted-foreground/50 uppercase">Idle</p>
                )}

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-border rounded-sm overflow-hidden">
                  <motion.div
                    className={`h-full ${isRunning ? 'bg-accent' : 'bg-muted'}`}
                    style={{ width: `${progress}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Selected machine details */}
      {selectedMachineData && (
        <div className="border border-border bg-card rounded-sm p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-mono-game text-sm text-foreground">{selectedMachineData.name}</h3>
              <p className="font-mono-game text-[10px] text-muted-foreground">{selectedMachineData.description}</p>
            </div>
            {automationJob && (
              <div className="flex items-center gap-2">
                <span className={`font-mono-game text-[9px] uppercase ${automationJob.enabled ? 'text-accent' : 'text-muted-foreground'}`}>
                  {automationJob.enabled ? 'Running' : 'Paused'}
                </span>
              </div>
            )}
          </div>

          {/* Current production */}
          {automationJob?.enabled && (
            <div className="border border-accent/20 bg-accent/5 rounded-sm p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono-game text-[10px] text-accent uppercase">Currently Producing</span>
                <button
                  onClick={() => dispatch({ type: 'TOGGLE_AUTOMATION', machineId: selectedMachine!, recipeId: automationJob.recipeId })}
                  className="font-mono-game text-[9px] uppercase px-2 py-0.5 border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
                >
                  Stop
                </button>
              </div>
              <p className="font-mono-game text-xs text-foreground">
                {RECIPE_MAP[automationJob.recipeId]?.name || automationJob.recipeId}
              </p>
              <p className="font-mono-game text-[9px] text-muted-foreground">
                Cycle: {(automationJob.interval / 1000).toFixed(1)}s
              </p>
              {/* Live progress */}
              <div className="w-full h-2 bg-border rounded-sm overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-accent to-primary"
                  style={{ width: `${Math.min(100, ((now - automationJob.lastCraft) / automationJob.interval) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Available recipes */}
          <div className="space-y-2">
            <p className="font-mono-game text-[10px] uppercase tracking-wider text-muted-foreground">
              Available Recipes ({machineRecipes.length})
            </p>

            {machineRecipes.length === 0 && (
              <p className="text-[10px] text-muted-foreground/50">No recipes available for this machine.</p>
            )}

            <div className="space-y-1.5 max-h-[40vh] overflow-y-auto custom-scrollbar">
              {machineRecipes.map(recipe => {
                const craftable = canCraft(recipe);
                const isActive = automationJob?.recipeId === recipe.id && automationJob?.enabled;

                return (
                  <div
                    key={recipe.id}
                    className={`border rounded-sm p-3 space-y-2 ${
                      isActive
                        ? 'border-accent/40 bg-accent/5'
                        : craftable
                        ? 'border-primary/30 bg-primary/5'
                        : 'border-border bg-card'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono-game text-xs text-foreground">{recipe.name}</span>
                        <span className="font-mono-game text-[10px] text-muted-foreground ml-2">x{recipe.outputQuantity}</span>
                      </div>
                      {isActive && (
                        <span className="font-mono-game text-[8px] text-accent uppercase">Active</span>
                      )}
                    </div>

                    <p className="text-[10px] text-muted-foreground">{recipe.description}</p>

                    {/* Ingredients */}
                    <div className="flex flex-wrap gap-1">
                      {recipe.ingredients.map((ing, i) => {
                        const source = ing.type === 'ingot' ? state.ingots : state.items;
                        const has = (source[ing.itemId] || 0) >= ing.quantity;
                        return (
                          <span
                            key={i}
                            className={`font-mono-game text-[9px] px-1.5 py-0.5 border rounded-sm ${
                              has ? 'border-primary/30 text-primary' : 'border-destructive/30 text-destructive'
                            }`}
                          >
                            {ing.quantity}x {getIngredientLabel(ing.itemId, ing.type)}
                          </span>
                        );
                      })}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => dispatch({ type: 'CRAFT_ITEM', recipeId: recipe.id })}
                        disabled={!craftable}
                        className="font-mono-game text-[10px] uppercase tracking-wider px-3 py-1 border border-primary text-primary hover:bg-primary/10 disabled:opacity-30 transition-colors"
                      >
                        Craft 1x
                      </button>
                      <button
                        onClick={() => dispatch({ type: 'TOGGLE_AUTOMATION', machineId: selectedMachine!, recipeId: recipe.id })}
                        className={`font-mono-game text-[10px] uppercase tracking-wider px-3 py-1 border transition-colors ${
                          isActive
                            ? 'border-destructive/30 text-destructive hover:bg-destructive/10'
                            : 'border-accent/30 text-accent hover:bg-accent/10'
                        }`}
                      >
                        {isActive ? 'Stop Auto' : 'Auto-Craft'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Also show recipes that this machine can produce (not requiring this machine but craftable generally) */}
          {machineRecipes.length === 0 && (
            <div className="space-y-2">
              <p className="font-mono-game text-[10px] uppercase tracking-wider text-muted-foreground">
                General Recipes (craft with this machine)
              </p>
              <p className="text-[10px] text-muted-foreground/50">
                This machine is used as a prerequisite for other recipes. Check the Craft tab for items that need it.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

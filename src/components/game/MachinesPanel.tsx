import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '@/hooks/useGameState';
import { CRAFTING_RECIPES, RECIPE_MAP, type CraftingRecipe } from '@/data/recipes';
import { ORE_MAP } from '@/data/ores';

type MachineTab = 'recipes' | 'automation';

export function MachinesPanel() {
  const { state, dispatch } = useGame();
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<MachineTab>('recipes');
  const [recipeSearch, setRecipeSearch] = useState('');
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

  // Reset tab/search when switching machines
  const selectMachine = (id: string) => {
    setSelectedMachine(id);
    setRecipeSearch('');
  };

  // All recipes that require the selected machine
  const machineRecipes = useMemo(() => {
    if (!selectedMachine) return [];
    return CRAFTING_RECIPES.filter(r => r.requiredMachine === selectedMachine);
  }, [selectedMachine]);

  // Filtered by search
  const filteredRecipes = useMemo(() => {
    if (!recipeSearch.trim()) return machineRecipes;
    const q = recipeSearch.toLowerCase();
    return machineRecipes.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q)
    );
  }, [machineRecipes, recipeSearch]);

  // Automation job for selected machine
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

  const getIngredientHas = (itemId: string, type: 'ingot' | 'item', required: number) => {
    const source = type === 'ingot' ? state.ingots : state.items;
    return source[itemId] || 0;
  };

  // Craftable vs locked recipe counts
  const craftableCount = useMemo(() => machineRecipes.filter(r => canCraft(r)).length, [machineRecipes, state]);
  const autoRecipe = automationJob ? RECIPE_MAP[automationJob.recipeId] : null;

  if (unlockedMachines.length === 0) return null;

  const selectedMachineData = selectedMachine ? RECIPE_MAP[selectedMachine] : null;

  // Progress for the automation job of the currently selected machine
  const autoProgress = automationJob?.enabled
    ? Math.min(100, ((now - automationJob.lastCraft) / automationJob.interval) * 100)
    : 0;

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
        <div className="flex gap-2 min-w-min">
          {unlockedMachines.map(machine => {
            const job = state.automationJobs.find(j => j.machineId === machine.id);
            const isSelected = selectedMachine === machine.id;
            const isRunning = job?.enabled;
            const progress = isRunning ? Math.min(100, ((now - job!.lastCraft) / job!.interval) * 100) : 0;
            const recipesForMachine = CRAFTING_RECIPES.filter(r => r.requiredMachine === machine.id);
            const craftableForMachine = recipesForMachine.filter(r => canCraft(r)).length;

            return (
              <motion.button
                key={machine.id}
                onClick={() => selectMachine(machine.id)}
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
                    <span className="font-mono-game text-[8px] text-accent uppercase animate-pulse ml-1 flex-shrink-0">RUN</span>
                  )}
                </div>

                {isRunning && autoRecipe && job?.machineId === machine.id ? (
                  <p className="font-mono-game text-[8px] text-muted-foreground truncate">
                    → {RECIPE_MAP[job.recipeId]?.name || '?'}
                  </p>
                ) : (
                  <p className="font-mono-game text-[8px] text-muted-foreground/50">
                    {recipesForMachine.length} recipe{recipesForMachine.length !== 1 ? 's' : ''}
                    {craftableForMachine > 0 && (
                      <span className="text-primary ml-1">({craftableForMachine} ready)</span>
                    )}
                  </p>
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
        <div className="border border-border bg-card rounded-sm overflow-hidden">
          {/* Machine header */}
          <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-mono-game text-sm text-foreground">{selectedMachineData.name}</h3>
              <p className="font-mono-game text-[9px] text-muted-foreground">{selectedMachineData.description}</p>
            </div>
            {automationJob?.enabled && (
              <div className="flex-shrink-0 flex flex-col items-end gap-1">
                <span className="font-mono-game text-[8px] text-accent uppercase animate-pulse">Auto-Crafting</span>
                <span className="font-mono-game text-[8px] text-muted-foreground truncate max-w-[100px]">
                  {autoRecipe?.name || '?'}
                </span>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border">
            {([
              { key: 'recipes' as MachineTab, label: `Recipes (${machineRecipes.length})` },
              { key: 'automation' as MachineTab, label: automationJob?.enabled ? 'Automation ●' : 'Automation' },
            ] as { key: MachineTab; label: string }[]).map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex-1 font-mono-game text-[9px] uppercase tracking-wider py-2 px-3 transition-colors border-r last:border-r-0 border-border ${
                  activeTab === t.key
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Recipes Tab */}
          {activeTab === 'recipes' && (
            <div className="p-3 space-y-3">
              {machineRecipes.length === 0 ? (
                <p className="text-[10px] text-muted-foreground/50 text-center py-4">
                  No recipes assigned to this machine.
                </p>
              ) : (
                <>
                  {/* Search + summary */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Search recipes..."
                      value={recipeSearch}
                      onChange={e => setRecipeSearch(e.target.value)}
                      className="flex-1 bg-background border border-border px-2 py-1 font-mono-game text-[10px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent"
                    />
                    {craftableCount > 0 && (
                      <span className="font-mono-game text-[9px] text-primary flex-shrink-0">
                        {craftableCount}/{machineRecipes.length} ready
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 max-h-[45vh] overflow-y-auto custom-scrollbar pr-1">
                    {filteredRecipes.length === 0 && (
                      <p className="text-[10px] text-muted-foreground/50 text-center py-4">No recipes match search.</p>
                    )}
                    <AnimatePresence initial={false}>
                      {filteredRecipes.map(recipe => {
                        const craftable = canCraft(recipe);
                        const isAutoActive = automationJob?.recipeId === recipe.id && automationJob?.enabled;

                        return (
                          <motion.div
                            key={recipe.id}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`border rounded-sm p-3 space-y-2 ${
                              isAutoActive
                                ? 'border-accent/40 bg-accent/5'
                                : craftable
                                ? 'border-primary/20 bg-primary/5'
                                : 'border-border/50 bg-card'
                            }`}
                          >
                            {/* Recipe header */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono-game text-xs text-foreground">{recipe.name}</span>
                                  <span className="font-mono-game text-[9px] text-muted-foreground">→ x{recipe.outputQuantity}</span>
                                </div>
                                <p className="font-mono-game text-[9px] text-muted-foreground/70 mt-0.5">{recipe.description}</p>
                              </div>
                              <div className="flex-shrink-0 flex flex-col items-end gap-1">
                                <span className={`font-mono-game text-[8px] uppercase px-1.5 py-0.5 rounded-sm ${
                                  recipe.category === 'machine'
                                    ? 'bg-primary/20 text-primary'
                                    : recipe.category === 'electronic'
                                    ? 'bg-accent/20 text-accent'
                                    : 'bg-muted text-muted-foreground'
                                }`}>
                                  {recipe.category}
                                </span>
                                {isAutoActive && (
                                  <span className="font-mono-game text-[8px] text-accent uppercase animate-pulse">auto</span>
                                )}
                              </div>
                            </div>

                            {/* Ingredients */}
                            <div className="flex flex-wrap gap-1">
                              {recipe.ingredients.map((ing, i) => {
                                const has = getIngredientHas(ing.itemId, ing.type, ing.quantity);
                                const satisfied = has >= ing.quantity;
                                return (
                                  <span
                                    key={i}
                                    className={`font-mono-game text-[9px] px-1.5 py-0.5 border rounded-sm ${
                                      satisfied
                                        ? 'border-primary/30 text-primary bg-primary/5'
                                        : 'border-destructive/30 text-destructive bg-destructive/5'
                                    }`}
                                    title={`Have ${has}, need ${ing.quantity}`}
                                  >
                                    {ing.quantity}x {getIngredientLabel(ing.itemId, ing.type)}
                                    <span className="opacity-60 ml-1">({has})</span>
                                  </span>
                                );
                              })}
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-2 pt-0.5">
                              <button
                                onClick={() => dispatch({ type: 'CRAFT_ITEM', recipeId: recipe.id })}
                                disabled={!craftable}
                                className="font-mono-game text-[10px] uppercase tracking-wider px-3 py-1 border border-primary text-primary hover:bg-primary/10 disabled:opacity-30 transition-colors"
                              >
                                Craft 1×
                              </button>
                              <button
                                onClick={() => dispatch({ type: 'TOGGLE_AUTOMATION', machineId: selectedMachine!, recipeId: recipe.id })}
                                className={`font-mono-game text-[10px] uppercase tracking-wider px-3 py-1 border transition-colors ${
                                  isAutoActive
                                    ? 'border-destructive/40 text-destructive hover:bg-destructive/10'
                                    : 'border-accent/40 text-accent hover:bg-accent/10'
                                }`}
                              >
                                {isAutoActive ? 'Stop Auto' : 'Auto-Craft'}
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Automation Tab */}
          {activeTab === 'automation' && (
            <div className="p-3 space-y-3">
              {!automationJob || !automationJob.enabled ? (
                <div className="space-y-2 py-2">
                  <p className="font-mono-game text-[10px] text-muted-foreground/60 text-center">
                    No automation running on this machine.
                  </p>
                  <p className="font-mono-game text-[9px] text-muted-foreground/40 text-center">
                    Select a recipe in the Recipes tab and press Auto-Craft to start.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Status header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono-game text-[10px] text-accent uppercase">Currently Producing</span>
                      <p className="font-mono-game text-sm text-foreground mt-0.5">{autoRecipe?.name || '?'}</p>
                      {autoRecipe && (
                        <p className="font-mono-game text-[9px] text-muted-foreground">{autoRecipe.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => dispatch({ type: 'TOGGLE_AUTOMATION', machineId: selectedMachine!, recipeId: automationJob.recipeId })}
                      className="font-mono-game text-[9px] uppercase px-3 py-1 border border-destructive/40 text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      Stop
                    </button>
                  </div>

                  {/* Cycle info */}
                  <div className="flex items-center gap-4">
                    <span className="font-mono-game text-[9px] text-muted-foreground">
                      Cycle: {(automationJob.interval / 1000).toFixed(1)}s
                    </span>
                    <span className="font-mono-game text-[9px] text-muted-foreground">
                      Output: ×{autoRecipe?.outputQuantity ?? '?'} per cycle
                    </span>
                  </div>

                  {/* Live progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="font-mono-game text-[9px] text-muted-foreground uppercase">Progress</span>
                      <span className="font-mono-game text-[9px] text-accent">{autoProgress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-3 bg-border rounded-sm overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-accent to-primary"
                        style={{ width: `${autoProgress}%` }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                  </div>

                  {/* Current ingredients status */}
                  {autoRecipe && (
                    <div className="space-y-1.5">
                      <span className="font-mono-game text-[9px] uppercase text-muted-foreground">Ingredient Status</span>
                      <div className="flex flex-wrap gap-1">
                        {autoRecipe.ingredients.map((ing, i) => {
                          const has = ing.type === 'ingot'
                            ? (state.ingots[ing.itemId] || 0)
                            : (state.items[ing.itemId] || 0);
                          const satisfied = has >= ing.quantity;
                          // How many more cycles can we run?
                          const cycles = Math.floor(has / ing.quantity);
                          return (
                            <span
                              key={i}
                              className={`font-mono-game text-[9px] px-1.5 py-0.5 border rounded-sm ${
                                satisfied
                                  ? 'border-primary/30 text-primary bg-primary/5'
                                  : 'border-destructive/30 text-destructive bg-destructive/5'
                              }`}
                            >
                              {getIngredientLabel(ing.itemId, ing.type)}: {has}/{ing.quantity}
                              {satisfied && cycles > 1 && (
                                <span className="opacity-60 ml-1">({cycles} cycles)</span>
                              )}
                            </span>
                          );
                        })}
                      </div>
                      {autoRecipe.ingredients.some(ing => {
                        const has = ing.type === 'ingot' ? (state.ingots[ing.itemId] || 0) : (state.items[ing.itemId] || 0);
                        return has < ing.quantity;
                      }) && (
                        <p className="font-mono-game text-[9px] text-destructive/80">
                          ⚠ Missing ingredients — machine will pause until restocked
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useGame } from '@/hooks/useGameState';
import { CRAFTING_RECIPES, type CraftingRecipe } from '@/data/recipes';
import { ORE_MAP } from '@/data/ores';
import { useState } from 'react';

type CatFilter = 'all' | 'component' | 'electronic' | 'machine';

export function CraftingStation() {
  const { state, dispatch } = useGame();
  const [filter, setFilter] = useState<CatFilter>('all');

  const filtered = filter === 'all' ? CRAFTING_RECIPES : CRAFTING_RECIPES.filter(r => r.category === filter);

  const canCraft = (recipe: CraftingRecipe) => {
    if (recipe.requiredMachine && !state.unlockedMachines.includes(recipe.requiredMachine)) return false;
    return recipe.ingredients.every(ing => {
      const source = ing.type === 'ingot' ? state.ingots : state.items;
      return (source[ing.itemId] || 0) >= ing.quantity;
    });
  };

  const hasIngredient = (itemId: string, type: 'ingot' | 'item', qty: number) => {
    const source = type === 'ingot' ? state.ingots : state.items;
    return (source[itemId] || 0) >= qty;
  };

  const filters: { key: CatFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'component', label: 'Components' },
    { key: 'electronic', label: 'Electronics' },
    { key: 'machine', label: 'Machines' },
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-mono-game text-xs tracking-[0.2em] uppercase text-muted-foreground">Fabrication Lab</h2>
        <span className="font-mono-game text-[10px] text-muted-foreground">
          Machines: {state.unlockedMachines.length}
        </span>
      </div>

      <div className="flex gap-1">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`font-mono-game text-[10px] uppercase tracking-wider px-3 py-1.5 border transition-colors ${
              filter === f.key ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
        {filtered.map(recipe => {
          const craftable = canCraft(recipe);
          const locked = recipe.requiredMachine && !state.unlockedMachines.includes(recipe.requiredMachine);

          return (
            <div
              key={recipe.id}
              className={`border rounded-sm p-3 space-y-2 ${
                locked ? 'border-border/50 opacity-50' : craftable ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono-game text-xs text-foreground">{recipe.name}</span>
                  <span className="font-mono-game text-[10px] text-muted-foreground ml-2">×{recipe.outputQuantity}</span>
                </div>
                {recipe.category === 'machine' && (
                  <span className="font-mono-game text-[9px] uppercase tracking-wider text-accent">Machine</span>
                )}
              </div>

              <p className="text-[10px] text-muted-foreground">{recipe.description}</p>

              {locked && (
                <p className="font-mono-game text-[10px] text-destructive">
                  Requires: {CRAFTING_RECIPES.find(r => r.id === recipe.requiredMachine)?.name || recipe.requiredMachine}
                </p>
              )}

              <div className="flex flex-wrap gap-1">
                {recipe.ingredients.map((ing, i) => {
                  const has = hasIngredient(ing.itemId, ing.type, ing.quantity);
                  const label = ing.type === 'ingot'
                    ? (ORE_MAP[ing.itemId]?.name || ing.itemId) + ' Ingot'
                    : CRAFTING_RECIPES.find(r => r.id === ing.itemId)?.name || ing.itemId;
                  return (
                    <span
                      key={i}
                      className={`font-mono-game text-[10px] px-1.5 py-0.5 border rounded-sm ${
                        has ? 'border-primary/30 text-primary' : 'border-destructive/30 text-destructive'
                      }`}
                    >
                      {ing.quantity}× {label}
                    </span>
                  );
                })}
              </div>

              <button
                onClick={() => dispatch({ type: 'CRAFT_ITEM', recipeId: recipe.id })}
                disabled={!craftable}
                className="font-mono-game text-[10px] uppercase tracking-wider px-3 py-1 border border-primary text-primary hover:bg-primary/10 disabled:opacity-30 transition-colors"
              >
                Fabricate
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

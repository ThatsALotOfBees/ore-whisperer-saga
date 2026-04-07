import { useGame } from '@/hooks/useGameState';
import { useNavigation } from '@/hooks/useNavigation';
import { CRAFTING_RECIPES, RECIPE_MAP, type CraftingRecipe } from '@/data/recipes';
import { ORE_MAP, type OreRarity } from '@/data/ores';
import { useState, useMemo, useEffect } from 'react';

type CatFilter = 'all' | 'component' | 'electronic' | 'machine';

interface CraftingStationProps {
  selectedItem?: string | null;
}

export function CraftingStation({ selectedItem }: CraftingStationProps) {
  const { state, dispatch } = useGame();
  const { clearSelectedItem, navigateToTab, goBack, canGoBack } = useNavigation();
  const [filter, setFilter] = useState<CatFilter>('all');
  const [search, setSearch] = useState('');

  // If we have a selectedItem, find and highlight the recipe
  useEffect(() => {
    if (selectedItem) {
      const recipe = RECIPE_MAP[selectedItem];
      if (recipe) {
        // Set search to the recipe name to highlight it
        setSearch(recipe.name);
        // Set filter to the recipe's category
        if (recipe.category !== 'component' && recipe.category !== 'electronic' && recipe.category !== 'machine') {
          setFilter('all');
        } else {
          setFilter(recipe.category);
        }
        // Clear the selected item after a short delay
        setTimeout(() => clearSelectedItem(), 100);
      }
    }
  }, [selectedItem, clearSelectedItem]);

  const filtered = useMemo(() => {
    let recipes = filter === 'all' ? CRAFTING_RECIPES : CRAFTING_RECIPES.filter(r => r.category === filter);
    if (search) {
      const q = search.toLowerCase();
      recipes = recipes.filter(r => r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q));
    }
    return recipes;
  }, [filter, search]);

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

  const handleIngredientClick = (ing: { itemId: string; type: 'ingot' | 'item'; quantity: number }, fromRecipeId: string) => {
    // Only navigate to crafting for 'item' type ingredients that have recipes
    if (ing.type === 'item') {
      const recipe = RECIPE_MAP[ing.itemId];
      if (recipe) {
        navigateToTab('craft', ing.itemId, fromRecipeId);
      }
    }
  };

  const filters: { key: CatFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'component', label: 'Components' },
    { key: 'electronic', label: 'Electronics' },
    { key: 'machine', label: 'Machines' },
  ];

  const getCategoryColor = (cat: string): string => {
    switch (cat) {
      case 'component': return 'text-muted-foreground';
      case 'electronic': return 'text-rarity-rare';
      case 'machine': return 'text-rarity-epic';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {canGoBack && (
            <button
              onClick={goBack}
              className="font-mono-game text-[10px] text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider flex items-center gap-1"
            >
              <span>⬅</span> Back
            </button>
          )}
          <h2 className="font-mono-game text-xs tracking-[0.2em] uppercase text-muted-foreground">Fabrication Lab</h2>
        </div>
        <span className="font-mono-game text-[10px] text-muted-foreground">
          Machines: {state.unlockedMachines.length}
        </span>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search recipes..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full bg-card border border-border px-3 py-1.5 font-mono-game text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent"
      />

      {/* Category filters */}
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

      {/* Results count */}
      <p className="font-mono-game text-[9px] text-muted-foreground/60">
        {filtered.length} recipe{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Recipe list */}
      <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
        {filtered.length === 0 && (
          <p className="text-xs text-muted-foreground/50 text-center py-6">No recipes match your search</p>
        )}
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
                <div className="flex items-center gap-2">
                  <span className="font-mono-game text-xs text-foreground">{recipe.name}</span>
                  <span className="font-mono-game text-[10px] text-muted-foreground">x{recipe.outputQuantity}</span>
                  <span className={`font-mono-game text-[8px] uppercase tracking-wider ${getCategoryColor(recipe.category)}`}>
                    {recipe.category}
                  </span>
                </div>
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
                    : RECIPE_MAP[ing.itemId]?.name || ing.itemId;
                  const isClickable = ing.type === 'item' && RECIPE_MAP[ing.itemId];
                  
                  return (
                    <span
                      key={i}
                      onClick={() => isClickable && handleIngredientClick(ing, recipe.id)}
                      className={`font-mono-game text-[10px] px-1.5 py-0.5 border rounded-sm ${
                        isClickable 
                          ? 'cursor-pointer hover:bg-primary/10 hover:border-primary/50 transition-colors' 
                          : ''
                      } ${
                        has ? 'border-primary/30 text-primary' : 'border-destructive/30 text-destructive'
                      }`}
                    >
                      {ing.quantity}x {label}
                      {isClickable && <span className="ml-1 text-[6px] opacity-60">🔗</span>}
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

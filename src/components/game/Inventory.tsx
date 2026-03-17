import { useGame } from '@/hooks/useGameState';
import { ORE_MAP, RARITY_ORDER, type OreRarity } from '@/data/ores';
import { RECIPE_MAP } from '@/data/recipes';
import { useState } from 'react';

type TabType = 'ores' | 'refined' | 'ingots' | 'items';

export function Inventory() {
  const { state, dispatch } = useGame();
  const [tab, setTab] = useState<TabType>('ores');

  const tabs: { key: TabType; label: string }[] = [
    { key: 'ores', label: 'Raw Ores' },
    { key: 'refined', label: 'Refined' },
    { key: 'ingots', label: 'Ingots' },
    { key: 'items', label: 'Items' },
  ];

  const getItems = () => {
    switch (tab) {
      case 'ores': return Object.entries(state.ores).map(([id, qty]) => ({ id, qty, ore: ORE_MAP[id] })).filter(i => i.ore);
      case 'refined': return Object.entries(state.refinedOres).map(([id, qty]) => ({ id, qty, ore: ORE_MAP[id] })).filter(i => i.ore);
      case 'ingots': return Object.entries(state.ingots).map(([id, qty]) => ({ id, qty, ore: ORE_MAP[id] })).filter(i => i.ore);
      case 'items': return Object.entries(state.items).map(([id, qty]) => ({ id, qty, recipe: RECIPE_MAP[id] }));
    }
  };

  const items = getItems();
  const sellType = tab === 'ores' ? 'ore' : tab === 'refined' ? 'refined' : tab === 'ingots' ? 'ingot' : 'item';

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-mono-game text-xs tracking-[0.2em] uppercase text-muted-foreground">Inventory</h2>
        <span className="font-mono-game text-sm text-accent">{state.currency.toLocaleString()} ¤</span>
      </div>

      <div className="flex gap-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`font-mono-game text-[10px] uppercase tracking-wider px-3 py-1.5 border transition-colors ${
              tab === t.key ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-1 max-h-[60vh] overflow-y-auto">
        {items.length === 0 && (
          <p className="text-xs text-muted-foreground/50 text-center py-8">Nothing here yet. Start mining!</p>
        )}
        {items.map((item: any) => {
          const name = item.ore ? item.ore.name : item.recipe?.name || item.id;
          const rarity: OreRarity = item.ore?.rarity || 'common';
          return (
            <div key={item.id} className={`flex items-center justify-between px-3 py-2 border bg-card rounded-sm border-rarity-${rarity}`}>
              <div className="flex items-center gap-3">
                <span className={`font-mono-game text-xs text-rarity-${rarity}`}>{name}</span>
                {item.ore && (
                  <span className={`text-[9px] uppercase tracking-wider font-mono-game text-rarity-${rarity} opacity-60`}>{rarity}</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono-game text-sm text-foreground">{item.qty}</span>
                <button
                  onClick={() => dispatch({ type: 'SELL_ITEM', itemId: item.id, itemType: sellType, quantity: 1 })}
                  className="font-mono-game text-[10px] uppercase px-2 py-0.5 border border-accent/30 text-accent hover:bg-accent/10 transition-colors"
                >
                  Sell
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

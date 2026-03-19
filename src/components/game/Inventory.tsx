import { useGame } from '@/hooks/useGameState';
import { ORE_MAP, type OreRarity } from '@/data/ores';
import { RECIPE_MAP } from '@/data/recipes';
import { useState, useMemo } from 'react';
import { playSound } from '@/lib/audio';
import { ItemBrowser, type BrowsableItem } from './ItemBrowser';

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

  const items: BrowsableItem[] = useMemo(() => {
    switch (tab) {
      case 'ores':
        return Object.entries(state.ores)
          .filter(([id, qty]) => qty > 0 && ORE_MAP[id])
          .map(([id, qty]) => ({
            id,
            name: ORE_MAP[id].name,
            rarity: ORE_MAP[id].rarity,
            quantity: qty,
            category: `tier-${ORE_MAP[id].tier}`,
          }));
      case 'refined':
        return Object.entries(state.refinedOres)
          .filter(([id, qty]) => qty > 0 && ORE_MAP[id])
          .map(([id, qty]) => ({
            id,
            name: ORE_MAP[id].name + ' (Refined)',
            rarity: ORE_MAP[id].rarity,
            quantity: qty,
            category: `tier-${ORE_MAP[id].tier}`,
          }));
      case 'ingots':
        return Object.entries(state.ingots)
          .filter(([id, qty]) => qty > 0 && ORE_MAP[id])
          .map(([id, qty]) => ({
            id,
            name: ORE_MAP[id].name + ' Ingot',
            rarity: ORE_MAP[id].rarity,
            quantity: qty,
            category: `tier-${ORE_MAP[id].tier}`,
          }));
      case 'items':
        return Object.entries(state.items)
          .filter(([, qty]) => qty > 0)
          .map(([id, qty]) => {
            const recipe = RECIPE_MAP[id];
            return {
              id,
              name: recipe?.name || id,
              rarity: (recipe?.category === 'machine' ? 'epic' : recipe?.category === 'electronic' ? 'rare' : 'uncommon') as OreRarity,
              quantity: qty,
              category: recipe?.category || 'unknown',
            };
          });
    }
  }, [tab, state.ores, state.refinedOres, state.ingots, state.items]);

  const sellType = tab === 'ores' ? 'ore' : tab === 'refined' ? 'refined' : tab === 'ingots' ? 'ingot' : 'item';

  const handleSell = (item: BrowsableItem) => {
    playSound('click');
    dispatch({ type: 'SELL_ITEM', itemId: item.id, itemType: sellType, quantity: 1 });
  };

  const handleSelect = (item: BrowsableItem) => {
    if (tab === 'ores' || tab === 'refined') {
      playSound('success');
      dispatch({ type: 'START_SMELT', oreId: item.id, refined: tab === 'refined' });
    }
  };

  const itemCategories = tab === 'items'
    ? [
        { key: 'component', label: 'Components' },
        { key: 'electronic', label: 'Electronics' },
        { key: 'machine', label: 'Machines' },
      ]
    : undefined;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-mono-game text-xs tracking-[0.2em] uppercase text-muted-foreground">Inventory</h2>
        <span className="font-mono-game text-sm text-accent">{state.currency.toLocaleString()} ¤</span>
      </div>

      <div className="flex gap-1 flex-wrap">
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
                  onClick={() => {
                    // Show a prompt to choose between quick sell or marketplace
                    const choice = window.confirm('List on marketplace? (Cancel for quick sell)');
                    if (choice) {
                      // Navigate to marketplace with pre-filled data
                      // This would be better handled with state management, but for now redirect
                      const marketplaceTab = document.querySelector('[data-tab="marketplace"]') as HTMLButtonElement;
                      if (marketplaceTab) marketplaceTab.click();
                    } else {
                      dispatch({ type: 'SELL_ITEM', itemId: item.id, itemType: sellType, quantity: 1 });
                    }
                  }}
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

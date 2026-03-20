import { useGame } from '@/hooks/useGameState';
import { ORE_MAP, type OreRarity } from '@/data/ores';
import { RECIPE_MAP } from '@/data/recipes';
import { useState, useMemo } from 'react';
import { playSound } from '@/lib/audio';
import { ItemBrowser, type BrowsableItem } from './ItemBrowser';
import { getItemRarity } from '@/lib/item-utils';

type TabType = 'ores' | 'refined' | 'ingots' | 'items';

export function Inventory() {
  const { state, dispatch } = useGame();
  const [tab, setTab] = useState<TabType>('ores');
  const [sellQuantities, setSellQuantities] = useState<Record<string, number>>({});

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
              rarity: getItemRarity(id),
              quantity: qty,
              category: recipe?.category || 'unknown',
            };
          });
    }
  }, [tab, state.ores, state.refinedOres, state.ingots, state.items]);

  const sellType = tab === 'ores' ? 'ore' : tab === 'refined' ? 'refined' : tab === 'ingots' ? 'ingot' : 'item';

  const getSellQty = (itemId: string) => sellQuantities[itemId] || 1;

  const handleSell = (item: BrowsableItem) => {
    const qty = Math.min(getSellQty(item.id), item.quantity);
    if (qty < 1) return;
    playSound('click');
    dispatch({ type: 'SELL_ITEM', itemId: item.id, itemType: sellType, quantity: qty });
    // Reset quantity after sell
    setSellQuantities(prev => ({ ...prev, [item.id]: 1 }));
  };

  const handleSelect = (item: BrowsableItem) => {
    if (tab === 'ores' || tab === 'refined') {
      playSound('success');
      dispatch({ type: 'START_SMELT', oreId: item.id, refined: tab === 'refined' });
    }
  };

  const handleSellQtyChange = (itemId: string, qty: number) => {
    setSellQuantities(prev => ({ ...prev, [itemId]: qty }));
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

      <ItemBrowser
        items={items}
        onSelect={handleSelect}
        onAction={handleSell}
        actionLabel="Sell"
        placeholder={`Search ${tab}...`}
        emptyMessage={items.length === 0 ? 'Nothing here yet. Start mining!' : 'No items match your search'}
        showRarityFilter={true}
        categories={itemCategories}
        maxHeight="50vh"
        showSellQty={true}
        sellQuantities={sellQuantities}
        onSellQtyChange={handleSellQtyChange}
      />
    </div>
  );
}

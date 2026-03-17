import { useGame } from '@/hooks/useGameState';
import { ORE_MAP, RARITY_ORDER, type OreRarity } from '@/data/ores';
import { RECIPE_MAP } from '@/data/recipes';
import { useState, useMemo, useRef } from 'react';
import { playSound } from '@/lib/audio';
import { motion } from 'framer-motion';

type TabType = 'ores' | 'refined' | 'ingots' | 'items';

export function Inventory() {
  const { state, dispatch } = useGame();
  const [tab, setTab] = useState<TabType>('ores');
  const [searchQuery, setSearchQuery] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const tabs: { key: TabType; label: string }[] = [
    { key: 'ores', label: 'Raw Ores' },
    { key: 'refined', label: 'Refined' },
    { key: 'ingots', label: 'Ingots' },
    { key: 'items', label: 'Items' },
  ];

  const getItems = useMemo(() => {
    switch (tab) {
      case 'ores': return Object.entries(state.ores).map(([id, qty]) => ({ id, qty, ore: ORE_MAP[id] })).filter(i => i.ore);
      case 'refined': return Object.entries(state.refinedOres).map(([id, qty]) => ({ id, qty, ore: ORE_MAP[id] })).filter(i => i.ore);
      case 'ingots': return Object.entries(state.ingots).map(([id, qty]) => ({ id, qty, ore: ORE_MAP[id] })).filter(i => i.ore);
      case 'items': return Object.entries(state.items).map(([id, qty]) => ({ id, qty, recipe: RECIPE_MAP[id] }));
    }
  }, [tab, state.ores, state.refinedOres, state.ingots, state.items]);

  const filteredItems = useMemo(() => {
    return getItems.filter((item: any) => {
      const name = item.ore ? item.ore.name : item.recipe?.name || item.id;
      return name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [getItems, searchQuery]);

  const sellType = tab === 'ores' ? 'ore' : tab === 'refined' ? 'refined' : tab === 'ingots' ? 'ingot' : 'item';

  const handleSell = (itemId: string) => {
    playSound('click');
    dispatch({ type: 'SELL_ITEM', itemId, itemType: sellType, quantity: 1 });
  };

  const handleAutoSmelt = (oreId: string) => {
    const ore = ORE_MAP[oreId];
    if (!ore) return;

    const quantity = (tab === 'ores' ? state.ores[oreId] : state.refinedOres[oreId]) || 0;
    let remaining = quantity;

    playSound('success');
    while (remaining > 0) {
      dispatch({ type: 'START_SMELT', oreId, refined: tab === 'refined' });
      remaining--;
    }
  };

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
            onClick={() => {
              setTab(t.key);
              setSearchQuery('');
            }}
            className={`font-mono-game text-[10px] uppercase tracking-wider px-3 py-1.5 border transition-colors ${
              tab === t.key ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <input
        type="text"
        placeholder="Search items..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full bg-card border border-border px-3 py-1.5 font-mono-game text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent"
      />

      <div ref={scrollRef} className="space-y-1 max-h-[50vh] overflow-y-auto custom-scrollbar">
        {filteredItems.length === 0 && (
          <p className="text-xs text-muted-foreground/50 text-center py-8">
            {getItems.length === 0 ? 'Nothing here yet. Start mining!' : 'No items match your search'}
          </p>
        )}
        {filteredItems.map((item: any) => {
          const name = item.ore ? item.ore.name : item.recipe?.name || item.id;
          const rarity: OreRarity = item.ore?.rarity || 'common';
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ x: 2 }}
              className={`flex items-center justify-between px-3 py-2 border bg-card rounded-sm border-rarity-${rarity} group`}
            >
              <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => {
                if ((tab === 'ores' || tab === 'refined') && item.ore) {
                  handleAutoSmelt(item.id);
                }
              }} title={tab === 'ores' || tab === 'refined' ? 'Ctrl+Click to auto-smelt all' : undefined}>
                <span className={`font-mono-game text-xs text-rarity-${rarity}`}>{name}</span>
                {item.ore && (
                  <span className={`text-[9px] uppercase tracking-wider font-mono-game text-rarity-${rarity} opacity-60`}>{rarity}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono-game text-sm text-foreground">{item.qty}</span>
                <button
                  onClick={() => handleSell(item.id)}
                  className="font-mono-game text-[10px] uppercase px-2 py-0.5 border border-accent/30 text-accent hover:bg-accent/10 transition-colors opacity-0 group-hover:opacity-100"
                >
                  Sell
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

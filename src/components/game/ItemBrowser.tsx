import { useState, useMemo } from 'react';
import { ORE_MAP, RARITY_ORDER, type OreRarity } from '@/data/ores';
import { RECIPE_MAP } from '@/data/recipes';

export interface BrowsableItem {
  id: string;
  name: string;
  rarity: OreRarity;
  quantity: number;
  category?: string;
  extra?: string;
  disabled?: boolean;
  disabledReason?: string;
}

interface ItemBrowserProps {
  items: BrowsableItem[];
  onSelect?: (item: BrowsableItem) => void;
  onAction?: (item: BrowsableItem) => void;
  actionLabel?: string;
  actionDisabled?: (item: BrowsableItem) => boolean;
  selectedId?: string | null;
  placeholder?: string;
  emptyMessage?: string;
  showRarityFilter?: boolean;
  categories?: { key: string; label: string }[];
  maxHeight?: string;
  showSellQty?: boolean;
  sellQuantities?: Record<string, number>;
  onSellQtyChange?: (itemId: string, qty: number) => void;
}

export function ItemBrowser({
  items,
  onSelect,
  onAction,
  actionLabel,
  actionDisabled,
  selectedId,
  placeholder = 'Search...',
  emptyMessage = 'No items found',
  showRarityFilter = true,
  categories,
  maxHeight = '50vh',
  showSellQty = false,
  sellQuantities = {},
  onSellQtyChange,
}: ItemBrowserProps) {
  const [search, setSearch] = useState('');
  const [rarityFilter, setRarityFilter] = useState<OreRarity | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = !search || item.name.toLowerCase().includes(search.toLowerCase());
      const matchesRarity = rarityFilter === 'all' || item.rarity === rarityFilter;
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      return matchesSearch && matchesRarity && matchesCategory;
    });
  }, [items, search, rarityFilter, categoryFilter]);

  const sortedItems = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const ri = RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity);
      if (ri !== 0) return ri;
      return a.name.localeCompare(b.name);
    });
  }, [filtered]);

  const rarityCounts = useMemo(() => {
    const counts: Partial<Record<OreRarity, number>> = {};
    items.forEach(item => {
      counts[item.rarity] = (counts[item.rarity] || 0) + 1;
    });
    return counts;
  }, [items]);

  return (
    <div className="space-y-2">
      <input
        type="text"
        placeholder={placeholder}
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full bg-card border border-border px-3 py-1.5 font-mono-game text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent"
      />

      {categories && categories.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`font-mono-game text-[10px] uppercase tracking-wider px-2 py-1 border transition-colors ${
              categoryFilter === 'all' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => setCategoryFilter(cat.key)}
              className={`font-mono-game text-[10px] uppercase tracking-wider px-2 py-1 border transition-colors ${
                categoryFilter === cat.key ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {showRarityFilter && (
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setRarityFilter('all')}
            className={`font-mono-game text-[9px] uppercase tracking-wider px-1.5 py-0.5 border transition-colors ${
              rarityFilter === 'all' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            All ({items.length})
          </button>
          {RARITY_ORDER.filter(r => rarityCounts[r]).map(r => (
            <button
              key={r}
              onClick={() => setRarityFilter(r)}
              className={`font-mono-game text-[9px] uppercase tracking-wider px-1.5 py-0.5 border transition-colors ${
                rarityFilter === r ? `border-rarity-${r} bg-rarity-${r} text-rarity-${r}` : `border-border text-rarity-${r} hover:border-rarity-${r}`
              }`}
            >
              {r} ({rarityCounts[r]})
            </button>
          ))}
        </div>
      )}

      <p className="font-mono-game text-[9px] text-muted-foreground/60">
        {sortedItems.length} result{sortedItems.length !== 1 ? 's' : ''}
      </p>

      <div className="space-y-1 overflow-y-auto custom-scrollbar" style={{ maxHeight }}>
        {sortedItems.length === 0 && (
          <p className="text-xs text-muted-foreground/50 text-center py-6">{emptyMessage}</p>
        )}
        {sortedItems.map(item => {
          const isSelected = selectedId === item.id;
          const isDisabled = item.disabled;
          const isActionDisabled = actionDisabled ? actionDisabled(item) : false;
          const sellQty = sellQuantities[item.id] || 1;

          return (
            <div
              key={item.id}
              onClick={() => !isDisabled && onSelect?.(item)}
              className={`flex items-center justify-between px-3 py-2 border rounded-sm transition-colors ${
                isDisabled
                  ? 'border-border/50 opacity-40 cursor-not-allowed'
                  : isSelected
                  ? `border-primary bg-primary/10 cursor-pointer`
                  : `border-rarity-${item.rarity} bg-card hover:bg-card/80 cursor-pointer`
              }`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className={`font-mono-game text-xs text-rarity-${item.rarity} truncate`}>{item.name}</span>
                <span className={`text-[8px] uppercase tracking-wider font-mono-game text-rarity-${item.rarity} opacity-50 shrink-0`}>
                  {item.rarity}
                </span>
                {item.extra && (
                  <span className="text-[9px] font-mono-game text-muted-foreground shrink-0">{item.extra}</span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {item.quantity > 0 && (
                  <span className="font-mono-game text-sm text-foreground">{item.quantity}</span>
                )}
                {isDisabled && item.disabledReason && (
                  <span className="font-mono-game text-[9px] text-destructive">{item.disabledReason}</span>
                )}
                {onAction && !isDisabled && (
                  <div className="flex items-center gap-1">
                    {showSellQty && item.quantity > 1 && (
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={e => { e.stopPropagation(); onSellQtyChange?.(item.id, Math.max(1, sellQty - (sellQty >= 100 ? 10 : sellQty >= 10 ? 5 : 1))); }}
                          className="font-mono-game text-[9px] px-1 py-0.5 border border-border text-muted-foreground hover:text-foreground hover:border-accent transition-colors"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={item.quantity}
                          value={sellQty}
                          onClick={e => e.stopPropagation()}
                          onChange={e => {
                            const v = Math.max(1, Math.min(item.quantity, parseInt(e.target.value) || 1));
                            onSellQtyChange?.(item.id, v);
                          }}
                          className="w-10 bg-card border border-border px-1 py-0.5 font-mono-game text-[10px] text-center text-foreground focus:outline-none focus:border-accent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          onClick={e => { e.stopPropagation(); onSellQtyChange?.(item.id, Math.min(item.quantity, sellQty + (sellQty >= 100 ? 10 : sellQty >= 10 ? 5 : 1))); }}
                          className="font-mono-game text-[9px] px-1 py-0.5 border border-border text-muted-foreground hover:text-foreground hover:border-accent transition-colors"
                        >
                          +
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); onSellQtyChange?.(item.id, item.quantity); }}
                          className="font-mono-game text-[8px] uppercase px-1 py-0.5 border border-border text-muted-foreground hover:text-foreground hover:border-accent transition-colors"
                        >
                          All
                        </button>
                      </div>
                    )}
                    <button
                      onClick={e => { e.stopPropagation(); onAction(item); }}
                      disabled={isActionDisabled}
                      className="font-mono-game text-[10px] uppercase px-2 py-0.5 border border-accent/30 text-accent hover:bg-accent/10 disabled:opacity-30 transition-colors"
                    >
                      {actionLabel || 'Action'}{showSellQty && item.quantity > 1 ? ` (${sellQty})` : ''}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

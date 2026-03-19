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

  // Group by rarity for display
  const sortedItems = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const ri = RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity);
      if (ri !== 0) return ri;
      return a.name.localeCompare(b.name);
    });
  }, [filtered]);

  // Count items per rarity for badges
  const rarityCounts = useMemo(() => {
    const counts: Partial<Record<OreRarity, number>> = {};
    items.forEach(item => {
      counts[item.rarity] = (counts[item.rarity] || 0) + 1;
    });
    return counts;
  }, [items]);

  return (
    <div className="space-y-2">
      {/* Search bar */}
      <input
        type="text"
        placeholder={placeholder}
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full bg-card border border-border px-3 py-1.5 font-mono-game text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent"
      />

      {/* Category filter */}
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

      {/* Rarity filter */}
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

      {/* Results count */}
      <p className="font-mono-game text-[9px] text-muted-foreground/60">
        {sortedItems.length} result{sortedItems.length !== 1 ? 's' : ''}
      </p>

      {/* Item list */}
      <div className="space-y-1 overflow-y-auto custom-scrollbar" style={{ maxHeight }}>
        {sortedItems.length === 0 && (
          <p className="text-xs text-muted-foreground/50 text-center py-6">{emptyMessage}</p>
        )}
        {sortedItems.map(item => {
          const isSelected = selectedId === item.id;
          const isDisabled = item.disabled;
          const isActionDisabled = actionDisabled ? actionDisabled(item) : false;

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
                  <button
                    onClick={e => { e.stopPropagation(); onAction(item); }}
                    disabled={isActionDisabled}
                    className="font-mono-game text-[10px] uppercase px-2 py-0.5 border border-accent/30 text-accent hover:bg-accent/10 disabled:opacity-30 transition-colors"
                  >
                    {actionLabel || 'Action'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

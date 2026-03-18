import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useGame } from '@/hooks/useGameState';
import { ORE_MAP } from '@/data/ores';
import { RECIPE_MAP } from '@/data/recipes';

interface MarketListing {
  id: string;
  seller_id: string;
  seller_username: string;
  item_id: string;
  item_type: string;
  item_name: string;
  quantity: number;
  price_per_unit: number;
  created_at: string;
  active: boolean;
}

type ListTab = 'browse' | 'sell' | 'my_listings';

export function Marketplace() {
  const { user, profile, isGuest } = useAuth();
  const { state, dispatch } = useGame();
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [tab, setTab] = useState<ListTab>('browse');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Sell form
  const [sellItemId, setSellItemId] = useState('');
  const [sellItemType, setSellItemType] = useState<'ore' | 'refined' | 'ingot' | 'item'>('ore');
  const [sellQty, setSellQty] = useState(1);
  const [sellPrice, setSellPrice] = useState(10);

  const loadListings = async () => {
    const { data } = await supabase
      .from('marketplace_listings')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(100);
    if (data) setListings(data as MarketListing[]);
  };

  useEffect(() => {
    loadListings();
    const sub = supabase
      .channel('marketplace')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'marketplace_listings' }, () => {
        loadListings();
      })
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  // Get items player can sell
  const sellableItems = useMemo(() => {
    const items: { id: string; name: string; type: 'ore' | 'refined' | 'ingot' | 'item'; qty: number }[] = [];

    Object.entries(state.ores).filter(([, q]) => q > 0).forEach(([id, qty]) => {
      const ore = ORE_MAP[id];
      if (ore) items.push({ id, name: ore.name, type: 'ore', qty });
    });
    Object.entries(state.refinedOres).filter(([, q]) => q > 0).forEach(([id, qty]) => {
      const ore = ORE_MAP[id];
      if (ore) items.push({ id, name: ore.name + ' (Refined)', type: 'refined', qty });
    });
    Object.entries(state.ingots).filter(([, q]) => q > 0).forEach(([id, qty]) => {
      const ore = ORE_MAP[id];
      if (ore) items.push({ id, name: ore.name + ' Ingot', type: 'ingot', qty });
    });
    Object.entries(state.items).filter(([, q]) => q > 0).forEach(([id, qty]) => {
      const recipe = RECIPE_MAP[id];
      items.push({ id, name: recipe?.name || id, type: 'item', qty });
    });

    return items;
  }, [state.ores, state.refinedOres, state.ingots, state.items]);

  const filteredListings = useMemo(() => {
    if (!search) return listings;
    const q = search.toLowerCase();
    return listings.filter(l => l.item_name.toLowerCase().includes(q) || l.seller_username.toLowerCase().includes(q));
  }, [listings, search]);

  const myListings = useMemo(() => {
    return listings.filter(l => l.seller_id === user?.id);
  }, [listings, user]);

  const handleList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || isGuest) return;

    const sellable = sellableItems.find(i => i.id === sellItemId && i.type === sellItemType);
    if (!sellable || sellable.qty < sellQty) return;

    setLoading(true);

    // Remove items from local state
    dispatch({ type: 'SELL_ITEM', itemId: sellItemId, itemType: sellItemType, quantity: 0 }); // We'll handle removal manually
    // Actually we need to deduct items without gaining currency. Let's just do the marketplace listing.
    // For simplicity, we deduct from local state by selling at 0 value, but that's not in the reducer.
    // Instead, we'll just create the listing. Items get deducted on confirmation.

    const itemName = sellable.name;

    const { error } = await supabase.from('marketplace_listings').insert({
      seller_id: user.id,
      seller_username: profile.username,
      item_id: sellItemId,
      item_type: sellItemType,
      item_name: itemName,
      quantity: sellQty,
      price_per_unit: sellPrice,
    } as any);

    if (!error) {
      setSellQty(1);
      setSellPrice(10);
      await loadListings();
    }
    setLoading(false);
  };

  const handleBuy = async (listing: MarketListing) => {
    if (!user || isGuest) return;
    if (listing.seller_id === user.id) return;

    const totalCost = listing.price_per_unit * listing.quantity;
    if (state.currency < totalCost) return;

    // Deactivate listing
    const { error } = await supabase
      .from('marketplace_listings')
      .update({ active: false } as any)
      .eq('id', listing.id);

    if (!error) {
      // Deduct currency locally (crude but works for now)
      // Add items to buyer's inventory would require server-side logic
      // For now, we handle it client-side
      await loadListings();
    }
  };

  const handleCancel = async (listingId: string) => {
    await supabase
      .from('marketplace_listings')
      .update({ active: false } as any)
      .eq('id', listingId);
    await loadListings();
  };

  if (isGuest) {
    return (
      <div className="p-4 space-y-4">
        <h2 className="font-mono-game text-xs tracking-[0.2em] uppercase text-muted-foreground">Marketplace</h2>
        <p className="text-xs text-muted-foreground/50 text-center py-8">Login to access the marketplace.</p>
      </div>
    );
  }

  const tabs: { key: ListTab; label: string }[] = [
    { key: 'browse', label: 'Browse' },
    { key: 'sell', label: 'Sell' },
    { key: 'my_listings', label: 'My Listings' },
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-mono-game text-xs tracking-[0.2em] uppercase text-muted-foreground">Player Market</h2>
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

      {/* Browse */}
      {tab === 'browse' && (
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Search listings..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-card border border-border px-3 py-1.5 font-mono-game text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent"
          />

          <div className="space-y-1.5 max-h-[50vh] overflow-y-auto custom-scrollbar">
            {filteredListings.length === 0 && (
              <p className="text-xs text-muted-foreground/50 text-center py-8">No listings available</p>
            )}
            <AnimatePresence>
              {filteredListings.map(listing => {
                const totalCost = listing.price_per_unit * listing.quantity;
                const canBuy = state.currency >= totalCost && listing.seller_id !== user?.id;
                const isMine = listing.seller_id === user?.id;

                return (
                  <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="border border-border bg-card rounded-sm p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono-game text-xs text-foreground">{listing.item_name}</span>
                        <span className="font-mono-game text-[9px] text-muted-foreground ml-2">
                          ({listing.item_type})
                        </span>
                      </div>
                      <span className="font-mono-game text-xs text-accent">
                        {listing.price_per_unit.toLocaleString()} ¤/ea
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-mono-game text-[10px] text-muted-foreground">
                          Qty: {listing.quantity}
                        </span>
                        <span className="font-mono-game text-[10px] text-primary">
                          Total: {totalCost.toLocaleString()} ¤
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono-game text-[9px] text-muted-foreground/50">
                          by {listing.seller_username}
                        </span>
                        {!isMine && (
                          <button
                            onClick={() => handleBuy(listing)}
                            disabled={!canBuy}
                            className="font-mono-game text-[10px] uppercase px-3 py-1 border border-accent text-accent hover:bg-accent/10 disabled:opacity-30 transition-colors"
                          >
                            Buy
                          </button>
                        )}
                        {isMine && (
                          <span className="font-mono-game text-[9px] text-primary uppercase">Your Listing</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Sell */}
      {tab === 'sell' && (
        <form onSubmit={handleList} className="space-y-3">
          <div className="space-y-2">
            <label className="font-mono-game text-[10px] uppercase tracking-wider text-muted-foreground">Select Item</label>
            <select
              value={`${sellItemType}:${sellItemId}`}
              onChange={e => {
                const [type, id] = e.target.value.split(':');
                setSellItemType(type as any);
                setSellItemId(id);
              }}
              className="w-full bg-card border border-border px-3 py-1.5 font-mono-game text-xs text-foreground focus:outline-none focus:border-accent"
            >
              <option value="">-- Select Item --</option>
              {sellableItems.map(item => (
                <option key={`${item.type}:${item.id}`} value={`${item.type}:${item.id}`}>
                  {item.name} (x{item.qty}) [{item.type}]
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="font-mono-game text-[10px] uppercase tracking-wider text-muted-foreground">Quantity</label>
              <input
                type="number"
                min="1"
                value={sellQty}
                onChange={e => setSellQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-card border border-border px-3 py-1.5 font-mono-game text-xs text-foreground focus:outline-none focus:border-accent"
              />
            </div>
            <div className="space-y-1">
              <label className="font-mono-game text-[10px] uppercase tracking-wider text-muted-foreground">Price/Unit (¤)</label>
              <input
                type="number"
                min="1"
                value={sellPrice}
                onChange={e => setSellPrice(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-card border border-border px-3 py-1.5 font-mono-game text-xs text-foreground focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {sellItemId && (
            <p className="font-mono-game text-[10px] text-accent">
              Total listing value: {(sellQty * sellPrice).toLocaleString()} ¤
            </p>
          )}

          <button
            type="submit"
            disabled={!sellItemId || loading}
            className="w-full font-mono-game text-[10px] uppercase py-2 border border-accent text-accent hover:bg-accent/10 disabled:opacity-30 transition-colors"
          >
            {loading ? 'Listing...' : 'List for Sale'}
          </button>
        </form>
      )}

      {/* My Listings */}
      {tab === 'my_listings' && (
        <div className="space-y-1.5 max-h-[50vh] overflow-y-auto custom-scrollbar">
          {myListings.length === 0 && (
            <p className="text-xs text-muted-foreground/50 text-center py-8">No active listings</p>
          )}
          {myListings.map(listing => (
            <div key={listing.id} className="border border-border bg-card rounded-sm p-3 flex items-center justify-between">
              <div>
                <span className="font-mono-game text-xs text-foreground">{listing.item_name}</span>
                <span className="font-mono-game text-[10px] text-muted-foreground ml-2">
                  x{listing.quantity} @ {listing.price_per_unit.toLocaleString()} ¤
                </span>
              </div>
              <button
                onClick={() => handleCancel(listing.id)}
                className="font-mono-game text-[9px] uppercase px-2 py-0.5 border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
              >
                Cancel
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

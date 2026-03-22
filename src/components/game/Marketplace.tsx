import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useGame } from '@/hooks/useGameState';
import { ORE_MAP, type OreRarity } from '@/data/ores';
import { RECIPE_MAP } from '@/data/recipes';
import { getItemRarity } from '@/lib/item-utils';

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
  const [statusMsg, setStatusMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Sell form
  const [sellItemId, setSellItemId] = useState('');
  const [sellItemType, setSellItemType] = useState<'ore' | 'refined' | 'ingot' | 'item'>('ore');
  const [sellQty, setSellQty] = useState(1);
  const [sellPrice, setSellPrice] = useState(10);

  const showStatus = (text: string, ok: boolean) => {
    setStatusMsg({ text, ok });
    setTimeout(() => setStatusMsg(null), 3000);
  };

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
    const items: { id: string; name: string; type: 'ore' | 'refined' | 'ingot' | 'item'; qty: number; rarity: OreRarity }[] = [];

    Object.entries(state.ores).filter(([, q]) => q > 0).forEach(([id, qty]) => {
      const ore = ORE_MAP[id];
      if (ore) items.push({ id, name: ore.name, type: 'ore', qty, rarity: ore.rarity });
    });
    Object.entries(state.refinedOres).filter(([, q]) => q > 0).forEach(([id, qty]) => {
      const ore = ORE_MAP[id];
      if (ore) items.push({ id, name: ore.name + ' (Refined)', type: 'refined', qty, rarity: ore.rarity });
    });
    Object.entries(state.ingots).filter(([, q]) => q > 0).forEach(([id, qty]) => {
      const ore = ORE_MAP[id];
      if (ore) items.push({ id, name: ore.name + ' Ingot', type: 'ingot', qty, rarity: ore.rarity });
    });
    Object.entries(state.items).filter(([, q]) => q > 0).forEach(([id, qty]) => {
      items.push({ id, name: RECIPE_MAP[id]?.name || id, type: 'item', qty, rarity: getItemRarity(id) });
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

  // Get max qty the player can list (accounting for items already listed)
  const getAvailableQty = (itemId: string, itemType: 'ore' | 'refined' | 'ingot' | 'item') => {
    const sellable = sellableItems.find(i => i.id === itemId && i.type === itemType);
    return sellable?.qty ?? 0;
  };

  const handleList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || isGuest) return;

    const sellable = sellableItems.find(i => i.id === sellItemId && i.type === sellItemType);
    if (!sellable) return;
    if (sellable.qty < sellQty) {
      showStatus(`Not enough ${sellable.name} in inventory`, false);
      return;
    }

    setLoading(true);

    // Deduct items from local inventory immediately
    dispatch({ type: 'DEDUCT_FOR_LISTING', itemId: sellItemId, itemType: sellItemType, quantity: sellQty });

    const { error } = await supabase.from('marketplace_listings').insert({
      seller_id: user.id,
      seller_username: profile.username,
      item_id: sellItemId,
      item_type: sellItemType,
      item_name: sellable.name,
      quantity: sellQty,
      price_per_unit: sellPrice,
    } as any);

    if (error) {
      // Rollback inventory deduction on failure
      dispatch({ type: 'RETURN_FROM_LISTING', itemId: sellItemId, itemType: sellItemType, quantity: sellQty, itemName: sellable.name });
      showStatus('Failed to create listing: ' + error.message, false);
    } else {
      setSellQty(1);
      setSellPrice(10);
      showStatus(`Listed ${sellQty}x ${sellable.name} for ${sellPrice.toLocaleString()} ¤ each`, true);
      await loadListings();
    }
    setLoading(false);
  };

  const handleBuy = async (listing: MarketListing, buyQty: number) => {
    if (!user || isGuest) return;
    if (listing.seller_id === user.id) return;

    const totalCost = listing.price_per_unit * buyQty;
    if (state.currency < totalCost) {
      showStatus('Not enough currency', false);
      return;
    }

    setLoading(true);

    const { data, error } = await (supabase.rpc as any)('purchase_marketplace_listing', {
      listing_id: listing.id,
      buyer_id: user.id,
    }) as { data: any; error: any };

    if (error || !data?.success) {
      showStatus(data?.error || error?.message || 'Purchase failed', false);
    } else {
      dispatch({
        type: 'RECEIVE_PURCHASE',
        itemId: data.item_id,
        itemType: data.item_type as 'ore' | 'refined' | 'ingot' | 'item',
        quantity: data.quantity,
        totalCost: data.total_cost,
      });
      showStatus(`Bought ${data.quantity}x ${data.item_name} for ${data.total_cost.toLocaleString()} ¤`, true);
      await loadListings();
    }
    setLoading(false);
  };

  const handleCancel = async (listing: MarketListing) => {
    if (!user) return;
    setLoading(true);

    const { error } = await supabase
      .from('marketplace_listings')
      .update({ active: false } as any)
      .eq('id', listing.id)
      .eq('seller_id', user.id); // RLS + safety check

    if (error) {
      showStatus('Failed to cancel listing', false);
    } else {
      // Return items to inventory
      dispatch({
        type: 'RETURN_FROM_LISTING',
        itemId: listing.item_id,
        itemType: listing.item_type as 'ore' | 'refined' | 'ingot' | 'item',
        quantity: listing.quantity,
        itemName: listing.item_name,
      });
      showStatus(`Cancelled listing — ${listing.quantity}x ${listing.item_name} returned`, true);
      await loadListings();
    }
    setLoading(false);
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
    { key: 'my_listings', label: `My Listings${myListings.length > 0 ? ` (${myListings.length})` : ''}` },
  ];

  const selectedSellable = sellItemId
    ? sellableItems.find(i => i.id === sellItemId && i.type === sellItemType)
    : null;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-mono-game text-xs tracking-[0.2em] uppercase text-muted-foreground">Player Market</h2>
        <span className="font-mono-game text-sm text-accent">{state.currency.toLocaleString()} ¤</span>
      </div>

      {/* Status message */}
      <AnimatePresence>
        {statusMsg && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`font-mono-game text-[10px] px-3 py-2 border rounded-sm ${
              statusMsg.ok
                ? 'border-accent/40 bg-accent/10 text-accent'
                : 'border-destructive/40 bg-destructive/10 text-destructive'
            }`}
          >
            {statusMsg.text}
          </motion.div>
        )}
      </AnimatePresence>

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
                const canBuy = state.currency >= totalCost && listing.seller_id !== user?.id && !loading;
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
                        <span className={`font-mono-game text-xs text-rarity-${getItemRarity(listing.item_id)}`}>
                          {listing.item_name}
                        </span>
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
                          <div className="flex gap-1.5">
                            {listing.quantity > 1 && (
                              <button
                                onClick={() => handleBuy(listing, 1)}
                                disabled={loading || state.currency < listing.price_per_unit}
                                className="font-mono-game text-[9px] uppercase px-2 py-0.5 border border-primary/50 text-primary hover:bg-primary/10 disabled:opacity-30 transition-colors"
                              >
                                Buy 1
                              </button>
                            )}
                            <button
                              onClick={() => handleBuy(listing, listing.quantity)}
                              disabled={!canBuy}
                              className="font-mono-game text-[9px] uppercase px-2 py-0.5 border border-accent text-accent hover:bg-accent/10 disabled:opacity-30 transition-colors"
                            >
                              {listing.quantity > 1 ? `Buy All (${listing.quantity})` : 'Buy'}
                            </button>
                          </div>
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
          {sellableItems.length === 0 && (
            <p className="text-xs text-muted-foreground/50 text-center py-4">No items in inventory to list.</p>
          )}

          {sellableItems.length > 0 && (
            <>
              <div className="space-y-2">
                <label className="font-mono-game text-[10px] uppercase tracking-wider text-muted-foreground">Select Item</label>
                <select
                  value={`${sellItemType}:${sellItemId}`}
                  onChange={e => {
                    const [type, ...rest] = e.target.value.split(':');
                    const id = rest.join(':');
                    setSellItemType(type as any);
                    setSellItemId(id);
                    setSellQty(1);
                  }}
                  className="w-full bg-card border border-border px-3 py-1.5 font-mono-game text-xs text-foreground focus:outline-none focus:border-accent"
                >
                  <option value=":">-- Select Item --</option>
                  {sellableItems.map(item => (
                    <option key={`${item.type}:${item.id}`} value={`${item.type}:${item.id}`}>
                      {item.name} (x{item.qty}) [{item.type}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-mono-game text-[10px] uppercase tracking-wider text-muted-foreground">
                    Quantity {selectedSellable ? `(max ${selectedSellable.qty})` : ''}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={selectedSellable?.qty ?? undefined}
                    value={sellQty}
                    onChange={e => setSellQty(Math.max(1, Math.min(selectedSellable?.qty ?? 999999, parseInt(e.target.value) || 1)))}
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
                <div className="space-y-1">
                  <p className="font-mono-game text-[10px] text-accent">
                    Total listing value: {(sellQty * sellPrice).toLocaleString()} ¤
                  </p>
                  <p className="font-mono-game text-[9px] text-muted-foreground/60">
                    Items are removed from your inventory when listed. They are returned if you cancel.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={!sellItemId || loading || (selectedSellable ? selectedSellable.qty < sellQty : true)}
                className="w-full font-mono-game text-[10px] uppercase py-2 border border-accent text-accent hover:bg-accent/10 disabled:opacity-30 transition-colors"
              >
                {loading ? 'Listing...' : 'List for Sale'}
              </button>
            </>
          )}
        </form>
      )}

      {/* My Listings */}
      {tab === 'my_listings' && (
        <div className="space-y-1.5 max-h-[50vh] overflow-y-auto custom-scrollbar">
          {myListings.length === 0 && (
            <p className="text-xs text-muted-foreground/50 text-center py-8">No active listings</p>
          )}
          {myListings.map(listing => (
            <div key={listing.id} className="border border-border bg-card rounded-sm p-3 flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <span className={`font-mono-game text-xs block truncate text-rarity-${getItemRarity(listing.item_id)}`}>
                  {listing.item_name}
                </span>
                <span className="font-mono-game text-[10px] text-muted-foreground">
                  x{listing.quantity} @ {listing.price_per_unit.toLocaleString()} ¤
                  <span className="text-accent ml-2">= {(listing.quantity * listing.price_per_unit).toLocaleString()} ¤</span>
                </span>
              </div>
              <button
                onClick={() => handleCancel(listing)}
                disabled={loading}
                className="flex-shrink-0 font-mono-game text-[9px] uppercase px-2 py-0.5 border border-destructive/30 text-destructive hover:bg-destructive/10 disabled:opacity-30 transition-colors"
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

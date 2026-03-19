import { useState, useEffect } from 'react';
import { useGame } from '@/hooks/useGameState';
import { useAuth } from '@/hooks/useAuth';
import { ORE_MAP, type OreRarity } from '@/data/ores';
import { RECIPE_MAP } from '@/data/recipes';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface MarketplaceListing {
  id: string;
  seller_id: string;
  item_type: 'ore' | 'refined' | 'ingot' | 'item';
  item_id: string;
  quantity: number;
  price_per_unit: number;
  total_price: number;
  status: 'active' | 'sold' | 'cancelled';
  seller_username?: string;
  created_at: string;
}

export function Marketplace() {
  const { state, dispatch } = useGame();
  const { user } = useAuth();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedItem, setSelectedItem] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [pricePerUnit, setPricePerUnit] = useState('');

  useEffect(() => {
    fetchListings();
    
    const channel = supabase
      .channel('marketplace_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'marketplace_listings' },
        () => fetchListings()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const fetchListings = async () => {
    const { data, error } = await supabase
      .from('marketplace_listings')
      .select(`
        *,
        profiles!marketplace_listings_seller_id_fkey (
          username
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching listings:', error);
      return;
    }

    setListings(data.map((listing: any) => ({
      ...listing,
      seller_username: listing.profiles?.username
    })));
    setLoading(false);
  };

  const getAvailableItems = () => {
    const items = [];
    
    Object.entries(state.ores).forEach(([id, qty]) => {
      if (qty > 0) items.push({ id, type: 'ore' as const, name: ORE_MAP[id]?.name || id, qty });
    });
    
    Object.entries(state.refinedOres).forEach(([id, qty]) => {
      if (qty > 0) items.push({ id, type: 'refined' as const, name: ORE_MAP[id]?.name || id, qty });
    });
    
    Object.entries(state.ingots).forEach(([id, qty]) => {
      if (qty > 0) items.push({ id, type: 'ingot' as const, name: ORE_MAP[id]?.name || id, qty });
    });
    
    Object.entries(state.items).forEach(([id, qty]) => {
      if (qty > 0) items.push({ id, type: 'item' as const, name: RECIPE_MAP[id]?.name || id, qty });
    });

    return items;
  };

  const createListing = async () => {
    if (!user || !selectedItem || !pricePerUnit || selectedQuantity < 1) {
      toast.error('Please fill all fields correctly');
      return;
    }

    const item = getAvailableItems().find(item => `${item.type}-${item.id}` === selectedItem);
    if (!item || item.qty < selectedQuantity) {
      toast.error('Not enough items');
      return;
    }

    setCreating(true);

    const { error } = await supabase.from('marketplace_listings').insert({
      seller_id: user.id,
      item_type: item.type,
      item_id: item.id,
      quantity: selectedQuantity,
      price_per_unit: parseInt(pricePerUnit)
    });

    if (error) {
      toast.error('Failed to create listing: ' + error.message);
    } else {
      dispatch({ type: 'CREATE_LISTING', itemId: item.id, itemType: item.type, quantity: selectedQuantity, pricePerUnit: parseInt(pricePerUnit) });
      toast.success('Listing created successfully');
      setSelectedItem('');
      setSelectedQuantity(1);
      setPricePerUnit('');
    }

    setCreating(false);
  };

  const buyItem = async (listing: MarketplaceListing) => {
    if (!user) return;
    
    if (state.currency < listing.total_price) {
      toast.error('Insufficient funds');
      return;
    }

    if (listing.seller_id === user.id) {
      toast.error('Cannot buy your own listing');
      return;
    }

    const { error } = await supabase.rpc('buy_marketplace_item', {
      listing_id: listing.id,
      buyer_id: user.id
    });

    if (error) {
      toast.error('Purchase failed: ' + error.message);
    } else {
      // Update local state
      const source = listing.item_type === 'ore' ? 'ores' : listing.item_type === 'refined' ? 'refinedOres' : listing.item_type === 'ingot' ? 'ingots' : 'items';
      const newSource = { ...state[source] };
      newSource[listing.item_id] = (newSource[listing.item_id] || 0) + listing.quantity;
      
      // This would be handled by a real-time update from the database
      toast.success('Purchase successful!');
    }
  };

  const cancelListing = async (listingId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('marketplace_listings')
      .update({ status: 'cancelled' })
      .eq('id', listingId)
      .eq('seller_id', user.id);

    if (error) {
      toast.error('Failed to cancel listing: ' + error.message);
    } else {
      toast.success('Listing cancelled');
    }
  };

  const getItemName = (listing: MarketplaceListing) => {
    if (listing.item_type === 'item') {
      return RECIPE_MAP[listing.item_id]?.name || listing.item_id;
    }
    return ORE_MAP[listing.item_id]?.name || listing.item_id;
  };

  const getItemRarity = (listing: MarketplaceListing): OreRarity => {
    if (listing.item_type === 'item') return 'common';
    const ore = ORE_MAP[listing.item_id];
    return ore?.rarity || 'common';
  };

  if (loading) {
    return (
      <div className="p-4">
        <p className="font-mono-game text-xs text-muted-foreground animate-pulse">Loading marketplace...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-mono-game text-xs tracking-[0.2em] uppercase text-muted-foreground">Marketplace</h2>
        <span className="font-mono-game text-sm text-accent">{state.currency.toLocaleString()} ¤</span>
      </div>

      {/* Create Listing */}
      <div className="border border-border rounded-sm p-4 space-y-4">
        <h3 className="font-mono-game text-[10px] uppercase tracking-wider text-muted-foreground">Create Listing</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="font-mono-game text-[9px] uppercase">Item</Label>
            <Select value={selectedItem} onValueChange={setSelectedItem}>
              <SelectTrigger className="font-mono-game text-xs">
                <SelectValue placeholder="Select item" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableItems().map(item => (
                  <SelectItem key={`${item.type}-${item.id}`} value={`${item.type}-${item.id}`}>
                    {item.name} ({item.qty} available)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="font-mono-game text-[9px] uppercase">Quantity</Label>
            <Input
              type="number"
              min="1"
              value={selectedQuantity}
              onChange={(e) => setSelectedQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="font-mono-game text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label className="font-mono-game text-[9px] uppercase">Price per Unit</Label>
            <Input
              type="number"
              min="1"
              placeholder="0"
              value={pricePerUnit}
              onChange={(e) => setPricePerUnit(e.target.value)}
              className="font-mono-game text-xs"
            />
          </div>

          <div className="flex items-end">
            <Button
              onClick={createListing}
              disabled={creating || !selectedItem || !pricePerUnit}
              className="font-mono-game text-[10px] uppercase"
            >
              {creating ? 'Creating...' : 'Create Listing'}
            </Button>
          </div>
        </div>
      </div>

      {/* Listings */}
      <div className="space-y-2">
        <h3 className="font-mono-game text-[10px] uppercase tracking-wider text-muted-foreground">Active Listings</h3>
        
        {listings.length === 0 ? (
          <p className="text-xs text-muted-foreground/50 text-center py-8">No active listings</p>
        ) : (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {listings.map(listing => {
              const rarity = getItemRarity(listing);
              return (
                <div key={listing.id} className={`border border-rarity-${rarity} rounded-sm p-3 bg-card`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono-game text-xs text-rarity-${rarity}`}>
                          {getItemName(listing)}
                        </span>
                        <span className="text-[9px] uppercase tracking-wider font-mono-game text-muted-foreground">
                          {listing.item_type}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="font-mono-game text-[10px] text-muted-foreground">
                          Qty: {listing.quantity}
                        </span>
                        <span className="font-mono-game text-[10px] text-accent">
                          {listing.price_per_unit.toLocaleString()} ¤/unit
                        </span>
                        <span className="font-mono-game text-[10px] text-foreground font-bold">
                          Total: {listing.total_price.toLocaleString()} ¤
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono-game text-[9px] text-muted-foreground">
                          Seller: {listing.seller_username}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {listing.seller_id === user?.id ? (
                        <Button
                          onClick={() => cancelListing(listing.id)}
                          variant="destructive"
                          size="sm"
                          className="font-mono-game text-[9px] uppercase"
                        >
                          Cancel
                        </Button>
                      ) : (
                        <Button
                          onClick={() => buyItem(listing)}
                          disabled={state.currency < listing.total_price}
                          size="sm"
                          className="font-mono-game text-[9px] uppercase"
                        >
                          Buy
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

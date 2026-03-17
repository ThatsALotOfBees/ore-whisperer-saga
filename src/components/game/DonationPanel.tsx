import { useState, useMemo } from 'react';
import { useClanDonations } from '@/hooks/useClanDonations';
import { useGame } from '@/hooks/useGameState';
import { useAuth } from '@/hooks/useAuth';
import { ORE_MAP } from '@/data/ores';
import { RECIPE_MAP } from '@/data/recipes';
import {
  getItemRarity,
  getMaxRequestQuantity,
  getRequestCooldownMs,
  getDonationReward,
  getRequestProgress,
  formatCooldownRemaining,
  canMakeRequest,
  getRequestCooldownRemaining,
} from '@/lib/clan-donations';
import { playSound } from '@/lib/audio';
import { motion } from 'framer-motion';

type TabType = 'browse' | 'requests' | 'donations';

export function DonationPanel() {
  const { state } = useGame();
  const { user } = useAuth();
  const { requests, perks, createRequest, donate, isItemDiscovered } = useClanDonations();

  const [tab, setTab] = useState<TabType>('requests');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'ores' | 'components' | 'electronics' | 'machines'>('all');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ id: string; type: string } | null>(null);
  const [requestQuantity, setRequestQuantity] = useState(1);
  const [donatingTo, setDonatingTo] = useState<string | null>(null);
  const [donateQuantity, setDonateQuantity] = useState(1);

  const tabs: { key: TabType; label: string }[] = [
    { key: 'requests', label: 'Active Requests' },
    { key: 'browse', label: 'Browse Items' },
    { key: 'donations', label: 'My Donations' },
  ];

  const browseItems = useMemo(() => {
    const items: Array<{ id: string; name: string; type: string; rarity: string; quantity: number }> = [];

    Object.entries(state.ores).forEach(([id, qty]) => {
      const ore = ORE_MAP[id];
      if (ore) {
        items.push({
          id,
          name: ore.name,
          type: 'ore',
          rarity: ore.rarity,
          quantity: qty,
        });
      }
    });

    Object.entries(state.items).forEach(([id, qty]) => {
      const recipe = RECIPE_MAP[id];
      if (recipe && isItemDiscovered(id)) {
        items.push({
          id,
          name: recipe.name,
          type: recipe.category,
          rarity: getItemRarity(id, RECIPE_MAP, ORE_MAP),
          quantity: qty,
        });
      }
    });

    return items
      .filter((item) => {
        if (selectedCategory !== 'all' && item.type !== selectedCategory) return false;
        if (!searchQuery) return true;
        return item.name.toLowerCase().includes(searchQuery.toLowerCase());
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [state.ores, state.items, searchQuery, selectedCategory, isItemDiscovered]);

  const myRequests = requests.filter((r) => r.requester_id === user?.id);
  const otherRequests = requests.filter((r) => r.requester_id !== user?.id);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    const rarity = getItemRarity(selectedItem.id, RECIPE_MAP, ORE_MAP);
    const maxQty = getMaxRequestQuantity(rarity, 0, perks);

    if (requestQuantity > maxQty) {
      playSound('error');
      return;
    }

    await createRequest(selectedItem.id, selectedItem.type, requestQuantity, rarity);
    playSound('success');
    setShowRequestModal(false);
    setSelectedItem(null);
    setRequestQuantity(1);
  };

  const handleDonate = async (requestId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!donatingTo) return;

    const request = requests.find((r) => r.id === requestId);
    if (!request) return;

    const availableQuantity = Math.min(
      donateQuantity,
      request.quantity_needed - request.quantity_fulfilled
    );

    await donate(requestId, availableQuantity);
    playSound('success');
    setDonatingTo(null);
    setDonateQuantity(1);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-mono-game text-xs tracking-[0.2em] uppercase text-muted-foreground">Clan Donations</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-1">
        {tabs.map((t) => (
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

      {/* Browse Items Tab */}
      {tab === 'browse' && (
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card border border-border px-3 py-1.5 font-mono-game text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent"
          />

          <div className="flex gap-1 flex-wrap">
            {['all', 'ores', 'components', 'electronics', 'machines'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat as any)}
                className={`font-mono-game text-[9px] uppercase px-2 py-1 border transition-colors ${
                  selectedCategory === cat
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="space-y-1 max-h-[50vh] overflow-y-auto">
            {browseItems.length === 0 ? (
              <p className="text-xs text-muted-foreground/50 text-center py-8">No items discovered yet</p>
            ) : (
              browseItems.map((item) => (
                <motion.div
                  key={item.id}
                  whileHover={{ x: 2 }}
                  className={`flex items-center justify-between px-3 py-2 border rounded-sm cursor-pointer transition-colors border-rarity-${item.rarity} hover:bg-card/80`}
                  onClick={() => {
                    setSelectedItem(item);
                    setShowRequestModal(true);
                  }}
                >
                  <div>
                    <span className={`font-mono-game text-xs text-rarity-${item.rarity}`}>{item.name}</span>
                    <span className={`ml-2 text-[9px] uppercase tracking-wider font-mono-game text-rarity-${item.rarity} opacity-60`}>
                      {item.rarity}
                    </span>
                  </div>
                  <span className="font-mono-game text-sm text-foreground">{item.quantity}</span>
                </motion.div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Active Requests Tab */}
      {tab === 'requests' && (
        <div className="space-y-3">
          {myRequests.length > 0 && (
            <div className="border border-primary/30 bg-primary/5 p-3 rounded-sm space-y-2">
              <p className="font-mono-game text-[10px] uppercase text-primary">Your Requests</p>
              {myRequests.map((req) => (
                <RequestCard key={req.id} request={req} isOwner={true} />
              ))}
            </div>
          )}

          {otherRequests.length > 0 && (
            <div className="space-y-1.5">
              <p className="font-mono-game text-[10px] uppercase text-muted-foreground">Clan Requests</p>
              {otherRequests.map((req) => (
                <RequestCard
                  key={req.id}
                  request={req}
                  onDonate={() => {
                    setDonatingTo(req.id);
                    setDonateQuantity(1);
                  }}
                />
              ))}
            </div>
          )}

          {requests.length === 0 && (
            <p className="text-xs text-muted-foreground/50 text-center py-8">No active requests</p>
          )}
        </div>
      )}

      {/* Donations Tab */}
      {tab === 'donations' && (
        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          <p className="font-mono-game text-[10px] uppercase text-muted-foreground">Your Contributions</p>
          <p className="text-xs text-muted-foreground">View your donation history here</p>
        </div>
      )}

      {/* Request Modal */}
      {showRequestModal && selectedItem && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowRequestModal(false)}
        >
          <motion.form
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCreateRequest}
            className="bg-card border border-primary/50 p-4 rounded-sm max-w-sm w-full space-y-3"
          >
            <h3 className="font-mono-game text-sm text-primary uppercase">{selectedItem.id}</h3>

            <div className="space-y-2">
              <label className="font-mono-game text-[10px] uppercase text-muted-foreground">Quantity</label>
              <input
                type="number"
                min="1"
                value={requestQuantity}
                onChange={(e) => setRequestQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-background border border-border px-3 py-1.5 font-mono-game text-xs text-foreground focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowRequestModal(false)}
                className="flex-1 font-mono-game text-[10px] uppercase py-1.5 border border-border text-muted-foreground hover:bg-border/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 font-mono-game text-[10px] uppercase py-1.5 border border-primary text-primary hover:bg-primary/10 transition-colors"
              >
                Request
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}

      {/* Donate Modal */}
      {donatingTo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setDonatingTo(null)}
        >
          <motion.form
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => handleDonate(donatingTo, e)}
            className="bg-card border border-accent/50 p-4 rounded-sm max-w-sm w-full space-y-3"
          >
            <h3 className="font-mono-game text-sm text-accent uppercase">Make Donation</h3>

            <div className="space-y-2">
              <label className="font-mono-game text-[10px] uppercase text-muted-foreground">Quantity to Donate</label>
              <input
                type="number"
                min="1"
                value={donateQuantity}
                onChange={(e) => setDonateQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-background border border-border px-3 py-1.5 font-mono-game text-xs text-foreground focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDonatingTo(null)}
                className="flex-1 font-mono-game text-[10px] uppercase py-1.5 border border-border text-muted-foreground hover:bg-border/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 font-mono-game text-[10px] uppercase py-1.5 border border-accent text-accent hover:bg-accent/10 transition-colors"
              >
                Donate
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </div>
  );
}

function RequestCard({
  request,
  isOwner = false,
  onDonate,
}: {
  request: any;
  isOwner?: boolean;
  onDonate?: () => void;
}) {
  const progress = getRequestProgress(request);
  const item = ORE_MAP[request.item_id] || RECIPE_MAP[request.item_id];

  return (
    <motion.div
      whileHover={{ y: -1 }}
      className={`border rounded-sm p-3 space-y-2 ${
        isOwner ? 'border-primary/30 bg-primary/5' : 'border-accent/30 bg-accent/5'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono-game text-xs text-foreground">{item?.name || request.item_id}</span>
          <span className={`ml-2 text-[9px] uppercase text-rarity-${request.rarity}`}>{request.rarity}</span>
        </div>
        {!isOwner && onDonate && (
          <button
            onClick={onDonate}
            className="font-mono-game text-[10px] uppercase px-2 py-0.5 border border-accent text-accent hover:bg-accent/10 transition-colors"
          >
            Donate
          </button>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-[9px]">
          <span className="font-mono-game text-muted-foreground">Progress</span>
          <span className="font-mono-game text-foreground">
            {request.quantity_fulfilled} / {request.quantity_needed}
          </span>
        </div>
        <div className="w-full h-2 bg-border rounded-sm overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-accent to-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    </motion.div>
  );
}

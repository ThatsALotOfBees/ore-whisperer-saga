import { useGame } from '@/hooks/useGameState';
import { useNavigation } from '@/hooks/useNavigation';
import { ORE_MAP } from '@/data/ores';
import { FOUNDRY_TIERS, RECIPE_MAP } from '@/data/recipes';
import { useState, useEffect, useMemo } from 'react';
import { ItemBrowser, type BrowsableItem } from './ItemBrowser';

export function Foundry() {
  const { state, dispatch, foundry } = useGame();
  const { navigateToTab } = useNavigation();
  const [selectedOre, setSelectedOre] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  const handleItemClick = (cost: { itemId: string; type: string; quantity: number }) => {
    // Only navigate to crafting for 'item' type requirements
    if (cost.type === 'item') {
      const recipe = RECIPE_MAP[cost.itemId];
      if (recipe) {
        navigateToTab('craft', cost.itemId);
      }
    }
  };

  useEffect(() => {
    if (state.smeltingJobs.length === 0) return;
    const interval = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(interval);
  }, [state.smeltingJobs.length]);

  const handleSmeltAll = () => {
    if (!selectedOre) return;
    const ore = ORE_MAP[selectedOre];
    if (!ore || state.foundryTier < ore.minSmeltTier) return;

    const available = state.ores[selectedOre] || 0;
    if (available <= 0) return;

    dispatch({ type: 'START_SMELT', oreId: selectedOre, refined: false, quantity: available });
  };

  const handleSmeltOne = () => {
    if (!selectedOre) return;
    dispatch({ type: 'START_SMELT', oreId: selectedOre, refined: false, quantity: 1 });
  };

  const handleCancelJob = (index: number, isQueue: boolean) => {
    dispatch({ type: 'CANCEL_SMELTIC_JOB', jobIndex: index, isQueue });
  };



  const nextTier = FOUNDRY_TIERS[state.foundryTier];

  // Smelt ore selection items
  const smeltItems: BrowsableItem[] = useMemo(() => {
    return Object.entries(state.ores)
      .filter(([id, qty]) => qty > 0 && ORE_MAP[id])
      .map(([id, qty]) => {
        const ore = ORE_MAP[id];
        const canSmelt = state.foundryTier >= ore.minSmeltTier;
        return {
          id,
          name: ore.name,
          rarity: ore.rarity,
          quantity: qty,
          disabled: !canSmelt,
          disabledReason: !canSmelt ? `T${ore.minSmeltTier}` : undefined,
        };
      });
  }, [state.ores, state.foundryTier]);

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-mono-game text-xs tracking-[0.2em] uppercase text-muted-foreground">Foundry</h2>
        <span className="font-mono-game text-xs text-accent">{foundry.name} (Tier {foundry.tier})</span>
      </div>

      {/* Smelting Slots */}
      <div className="space-y-2">
        <p className="font-mono-game text-[10px] uppercase tracking-wider text-muted-foreground">
          Active Smelting ({state.smeltingJobs.length}/{foundry.slots})
        </p>
        <div className="grid gap-2">
          {state.smeltingJobs.map((job, i) => {
            const ore = ORE_MAP[job.oreId];
            const elapsed = now - job.startTime;
            const pct = Math.min(100, (elapsed / job.duration) * 100);
            return (
              <div key={i} className="border border-border bg-card px-3 py-2 rounded-sm group relative">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex flex-col">
                    <span className="font-mono-game text-xs text-foreground">{ore?.name || job.oreId} {job.refined ? '(Refined)' : ''}</span>
                    <span className="font-mono-game text-[8px] text-muted-foreground uppercase">Active</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono-game text-[10px] text-primary">{Math.floor(pct)}%</span>
                    <button
                      onClick={() => handleCancelJob(i, false)}
                      className="p-1 hover:text-destructive text-muted-foreground transition-colors"
                      title="Cancel Smelting"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  </div>
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-100" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
          {state.smeltingJobs.length === 0 && (
            <p className="text-xs text-muted-foreground/50 text-center py-4">No active smelting jobs</p>
          )}
        </div>
      </div>

      {/* Smelting Queue */}
      {state.smeltingQueue.length > 0 && (
        <div className="space-y-2">
          <p className="font-mono-game text-[10px] uppercase tracking-wider text-muted-foreground">
            Smelting Queue ({state.smeltingQueue.reduce((acc, job) => acc + (job.quantity || 1), 0)})
          </p>
          <div className="max-h-[20vh] overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
            {state.smeltingQueue.map((job, i) => {
              const ore = ORE_MAP[job.oreId];
              const qty = job.quantity || 1;
              return (
                <div key={i} className="border border-border/50 bg-card/50 px-3 py-1.5 rounded-sm flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="font-mono-game text-[10px] text-foreground/80">{ore?.name || job.oreId} {job.refined ? '(Refined)' : ''} x{qty}</span>
                    <span className="font-mono-game text-[7px] text-muted-foreground/60 uppercase tracking-tighter">Waiting for slot...</span>
                  </div>
                  <button
                    onClick={() => handleCancelJob(i, true)}
                    className="p-1 hover:text-destructive text-muted-foreground/40 transition-colors"
                    title="Cancel Queue"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Smelt Controls */}
      <div className="space-y-2">
        <p className="font-mono-game text-[10px] uppercase tracking-wider text-muted-foreground">Smelt Ores</p>

        <ItemBrowser
          items={smeltItems}
          onSelect={item => setSelectedOre(item.id)}
          selectedId={selectedOre}
          placeholder="Search ores to smelt..."
          emptyMessage="No ores available"
          showRarityFilter={true}
          maxHeight="25vh"
        />

        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              onClick={handleSmeltOne}
              disabled={!selectedOre || state.smeltingJobs.length >= foundry.slots}
              className="flex-1 font-mono-game text-xs uppercase tracking-wider py-2 border border-primary text-primary hover:bg-primary/10 disabled:opacity-30 transition-colors"
            >
              Smelt 1
            </button>
            <button
              onClick={handleSmeltAll}
              disabled={!selectedOre}
              className="flex-1 font-mono-game text-xs uppercase tracking-wider py-2 border border-accent text-accent hover:bg-accent/10 disabled:opacity-30 transition-colors"
            >
              Smelt All
            </button>
          </div>
          {state.foundryTier >= 8 && (
            <button
              onClick={() => dispatch({ type: 'SMELT_EVERYTHING' })}
              className="w-full font-mono-game text-xs uppercase tracking-wider py-2 border border-purple-400 text-purple-400 hover:bg-purple-400/10 transition-colors"
            >
              Smelt All Inventory
            </button>
          )}
        </div>
      </div>

      {/* Foundry Upgrade */}
      {nextTier && (
        <div className="border border-accent/30 bg-accent/5 p-3 rounded-sm space-y-2">
          <p className="font-mono-game text-xs text-accent">Upgrade to {nextTier.name}</p>
          <p className="text-xs text-muted-foreground">{nextTier.description}</p>
          <div className="text-[10px] font-mono-game text-muted-foreground space-y-0.5">
            {nextTier.cost.map((c, i) => {
              const isClickable = c.type === 'item' && RECIPE_MAP[c.itemId];
              const itemName = c.type === 'currency' ? `${c.quantity.toLocaleString()}¤` : 
                              c.type === 'ingot' ? `${c.quantity}x ${ORE_MAP[c.itemId]?.name || c.itemId} ingots` : 
                              `${c.quantity}x ${RECIPE_MAP[c.itemId]?.name || c.itemId}`;
              
              return (
                <p 
                  key={i}
                  onClick={() => isClickable && handleItemClick(c)}
                  className={isClickable ? 'cursor-pointer hover:text-foreground transition-colors' : ''}
                >
                  {itemName}
                  {isClickable && <span className="ml-1 text-[6px] opacity-60">🔗</span>}
                </p>
              );
            })}
          </div>
          <button
            onClick={() => dispatch({ type: 'UPGRADE_FOUNDRY' })}
            className="font-mono-game text-[10px] uppercase px-3 py-1 border border-accent text-accent hover:bg-accent/10 transition-colors"
          >
            Upgrade
          </button>
        </div>
      )}
    </div>
  );
}

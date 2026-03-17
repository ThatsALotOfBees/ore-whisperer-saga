import { useGame } from '@/hooks/useGameState';
import { ORE_MAP } from '@/data/ores';
import { FOUNDRY_TIERS } from '@/data/recipes';
import { useState, useEffect } from 'react';

export function Foundry() {
  const { state, dispatch, foundry } = useGame();
  const [selectedOre, setSelectedOre] = useState<string | null>(null);
  const [useRefined, setUseRefined] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Reactive timer for progress bars
  useEffect(() => {
    if (state.smeltingJobs.length === 0) return;
    const interval = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(interval);
  }, [state.smeltingJobs.length]);

  const availableOres = useRefined
    ? Object.entries(state.refinedOres).filter(([, qty]) => qty > 0)
    : Object.entries(state.ores).filter(([, qty]) => qty > 0);

  const handleSmelt = () => {
    if (!selectedOre) return;
    dispatch({ type: 'START_SMELT', oreId: selectedOre, refined: useRefined });
  };

  const handleRefine = (oreId: string) => {
    dispatch({ type: 'REFINE_ORE', oreId, quantity: 1 });
  };

  const nextTier = FOUNDRY_TIERS[state.foundryTier];

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
              <div key={i} className="border border-border bg-card px-3 py-2 rounded-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono-game text-xs text-foreground">{ore?.name || job.oreId} {job.refined ? '(Refined)' : ''}</span>
                  <span className="font-mono-game text-[10px] text-primary">{Math.floor(pct)}%</span>
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-100"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
          {state.smeltingJobs.length === 0 && (
            <p className="text-xs text-muted-foreground/50 text-center py-4">No active smelting jobs</p>
          )}
        </div>
      </div>

      {/* Refinery Section */}
      <div className="space-y-2">
        <p className="font-mono-game text-[10px] uppercase tracking-wider text-muted-foreground">
          Refine Ores (costs currency, increases smelt yield)
        </p>
        <div className="grid gap-1 max-h-32 overflow-y-auto">
          {Object.entries(state.ores).filter(([, q]) => q > 0).map(([id, qty]) => {
            const ore = ORE_MAP[id];
            if (!ore) return null;
            return (
              <div key={id} className="flex items-center justify-between px-3 py-1.5 border border-border bg-card rounded-sm">
                <span className={`font-mono-game text-xs text-rarity-${ore.rarity}`}>{ore.name} ({qty})</span>
                <button
                  onClick={() => handleRefine(id)}
                  disabled={state.currency < ore.refineCost}
                  className="font-mono-game text-[10px] px-2 py-0.5 border border-accent/30 text-accent hover:bg-accent/10 disabled:opacity-30 transition-colors"
                >
                  Refine ({ore.refineCost}¤)
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Smelt Controls */}
      <div className="space-y-2">
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setUseRefined(false)}
            className={`font-mono-game text-[10px] uppercase px-2 py-1 border ${!useRefined ? 'border-primary text-primary bg-primary/10' : 'border-border text-muted-foreground'}`}
          >
            Raw
          </button>
          <button
            onClick={() => setUseRefined(true)}
            className={`font-mono-game text-[10px] uppercase px-2 py-1 border ${useRefined ? 'border-primary text-primary bg-primary/10' : 'border-border text-muted-foreground'}`}
          >
            Refined
          </button>
        </div>

        <div className="grid gap-1 max-h-32 overflow-y-auto">
          {availableOres.map(([id, qty]) => {
            const ore = ORE_MAP[id];
            if (!ore) return null;
            return (
              <button
                key={id}
                onClick={() => setSelectedOre(id)}
                className={`flex items-center justify-between px-3 py-1.5 border rounded-sm text-left transition-colors ${
                  selectedOre === id ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-muted-foreground/30'
                }`}
              >
                <span className={`font-mono-game text-xs text-rarity-${ore.rarity}`}>{ore.name}</span>
                <span className="font-mono-game text-xs text-muted-foreground">{qty}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleSmelt}
          disabled={!selectedOre || state.smeltingJobs.length >= foundry.slots}
          className="w-full font-mono-game text-xs uppercase tracking-wider py-2 border border-primary text-primary hover:bg-primary/10 disabled:opacity-30 transition-colors"
        >
          Start Smelting
        </button>
      </div>

      {/* Foundry Upgrade */}
      {nextTier && (
        <div className="border border-accent/30 bg-accent/5 p-3 rounded-sm space-y-2">
          <p className="font-mono-game text-xs text-accent">Upgrade to {nextTier.name}</p>
          <p className="text-xs text-muted-foreground">{nextTier.description}</p>
          <div className="text-[10px] font-mono-game text-muted-foreground space-y-0.5">
            {nextTier.cost.map((c, i) => (
              <p key={i}>
                {c.type === 'currency' ? `${c.quantity}¤` : `${c.quantity}x ${ORE_MAP[c.itemId]?.name || c.itemId} ingots`}
              </p>
            ))}
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

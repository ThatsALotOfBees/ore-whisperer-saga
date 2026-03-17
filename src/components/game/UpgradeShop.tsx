import { useGame } from '@/hooks/useGameState';
import { MINING_UPGRADES } from '@/data/recipes';

export function UpgradeShop() {
  const { state, dispatch } = useGame();

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-mono-game text-xs tracking-[0.2em] uppercase text-muted-foreground">Upgrades</h2>
        <span className="font-mono-game text-sm text-accent">{state.currency.toLocaleString()} ¤</span>
      </div>

      <div className="space-y-3">
        {MINING_UPGRADES.map(upgrade => {
          const level = state.miningUpgrades[upgrade.id] || 0;
          const maxed = level >= upgrade.maxLevel;
          const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, level));
          const canAfford = state.currency >= cost;

          return (
            <div key={upgrade.id} className="border border-border bg-card rounded-sm p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono-game text-xs text-foreground">{upgrade.name}</span>
                <span className="font-mono-game text-[10px] text-primary">
                  Lv.{level}/{upgrade.maxLevel}
                </span>
              </div>

              <p className="text-[10px] text-muted-foreground">{upgrade.description}</p>

              {/* Level bar */}
              <div className="flex gap-0.5">
                {Array.from({ length: upgrade.maxLevel }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-sm ${i < level ? 'bg-primary' : 'bg-muted'}`}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between">
                <span className="font-mono-game text-[10px] text-muted-foreground">
                  +{(upgrade.effectPerLevel * (level + 1) * 100).toFixed(0)}% {upgrade.effect}
                </span>
                <button
                  onClick={() => dispatch({ type: 'UPGRADE_MINING', upgradeId: upgrade.id })}
                  disabled={maxed || !canAfford}
                  className="font-mono-game text-[10px] uppercase px-3 py-1 border border-primary text-primary hover:bg-primary/10 disabled:opacity-30 transition-colors"
                >
                  {maxed ? 'MAX' : `${cost} ¤`}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

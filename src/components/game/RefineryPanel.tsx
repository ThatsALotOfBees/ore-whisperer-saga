import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '@/hooks/useGameState';
import { useNavigation } from '@/hooks/useNavigation';
import { ORE_MAP, ALL_ORES } from '@/data/ores';
import {
  ALL_REFINERY_UPGRADES, REFINERY_UPGRADE_MAP,
  HEAT_LOW_MAX, HEAT_MEDIUM_MAX, HEAT_MAX,
  getIdleSpeedMultiplier, getIdleQualityBonus, getIdleBatchBonus,
  getProcessTime, getBatchSize,
  type RefineryUpgradeCategory, type RefineryOutputType,
} from '@/data/refinery';
import { RECIPE_MAP } from '@/data/recipes';
import type { RefineryOutput } from '@/hooks/useGameState';

const OUTPUT_TYPE_COLORS: Record<RefineryOutputType, { text: string; bg: string; border: string; label: string }> = {
  refined: { text: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/30', label: 'Refined' },
  polished: { text: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/30', label: 'Polished' },
  perfect: { text: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30', label: 'Perfect' },
};

const CATEGORY_COLORS: Record<RefineryUpgradeCategory, { text: string; border: string; bg: string; label: string }> = {
  speed: { text: 'text-sky-400', border: 'border-sky-400/30', bg: 'bg-sky-400/10', label: '⚡ Speed' },
  value: { text: 'text-emerald-400', border: 'border-emerald-400/30', bg: 'bg-emerald-400/10', label: '💎 Value' },
  risk: { text: 'text-orange-400', border: 'border-orange-400/30', bg: 'bg-orange-400/10', label: '🔥 Risk / Power' },
  mutation: { text: 'text-pink-400', border: 'border-pink-400/30', bg: 'bg-pink-400/10', label: '🩸 Mutation Synergy' },
};

function formatMs(ms: number): string {
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  return `${Math.floor(ms / 60_000)}m ${Math.round((ms % 60_000) / 1000)}s`;
}

function formatDuration(minutes: number): string {
  if (minutes < 1) return '<1m';
  if (minutes < 60) return `${Math.floor(minutes)}m`;
  return `${Math.floor(minutes / 60)}h ${Math.floor(minutes % 60)}m`;
}

function HeatGauge({ heat }: { heat: number }) {
  const pct = Math.min(100, (heat / HEAT_MAX) * 100);
  const color = heat >= HEAT_MEDIUM_MAX ? 'bg-red-500' : heat >= HEAT_LOW_MAX ? 'bg-amber-500' : 'bg-emerald-500';
  const label = heat >= HEAT_MEDIUM_MAX ? 'HIGH — Risk of ore loss!' : heat >= HEAT_LOW_MAX ? 'MEDIUM — Bonus value' : 'LOW — Stable';
  const glowClass = heat >= HEAT_MEDIUM_MAX ? 'shadow-[0_0_12px_rgba(239,68,68,0.5)]' : '';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="font-mono-game text-[9px] uppercase tracking-wider text-muted-foreground">Heat</span>
        <span className={`font-mono-game text-[9px] ${heat >= HEAT_MEDIUM_MAX ? 'text-red-400' : heat >= HEAT_LOW_MAX ? 'text-amber-400' : 'text-emerald-400'}`}>
          {Math.round(heat)}° — {label}
        </span>
      </div>
      <div className={`w-full h-2 bg-muted rounded-full overflow-hidden ${glowClass}`}>
        <motion.div
          className={`h-full ${color} rounded-full`}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
}

function UpgradeCard({ upgradeId }: { upgradeId: string }) {
  const { state, dispatch } = useGame();
  const { navigateToTab } = useNavigation();
  const def = REFINERY_UPGRADE_MAP[upgradeId];
  if (!def || !state.refinery) return null;

  const currentLevel = state.refinery.upgrades[upgradeId] || 0;
  const isMaxed = currentLevel >= def.maxTier;
  const nextTier = !isMaxed ? def.tiers[currentLevel] : null;
  const catStyle = CATEGORY_COLORS[def.category];

  const canAfford = nextTier ? nextTier.cost.every(cost => {
    if (cost.type === 'currency') return state.currency >= cost.quantity;
    if (cost.type === 'item') return (state.items[cost.itemId] || 0) >= cost.quantity;
    if (cost.type === 'ingot') return (state.ingots[cost.itemId] || 0) >= cost.quantity;
    return false;
  }) : false;

  const getItemName = (itemId: string, type: string): string => {
    if (type === 'currency') return '¤';
    if (type === 'ingot') return ORE_MAP[itemId]?.name ? `${ORE_MAP[itemId].name} Ingot` : itemId;
    const recipe = RECIPE_MAP[itemId];
    return recipe?.name || itemId;
  };

  const handleItemClick = (cost: { itemId: string; type: string; quantity: number }) => {
    // Only navigate to crafting for 'item' type requirements
    if (cost.type === 'item') {
      const recipe = RECIPE_MAP[cost.itemId];
      if (recipe) {
        navigateToTab('craft', cost.itemId);
      }
    }
  };

  return (
    <div className={`border ${catStyle.border} ${catStyle.bg} rounded-sm p-2.5 space-y-1.5`}>
      <div className="flex items-center justify-between">
        <span className={`font-mono-game text-[10px] ${catStyle.text}`}>
          {def.icon} {def.name}
        </span>
        <span className="font-mono-game text-[8px] text-muted-foreground">
          {isMaxed ? 'MAX' : `${currentLevel}/${def.maxTier}`}
        </span>
      </div>

      {/* Current effect */}
      {currentLevel > 0 && (
        <p className="font-mono-game text-[8px] text-foreground/70">
          Current: {def.tiers[currentLevel - 1].description}
        </p>
      )}

      {/* Next tier */}
      {nextTier && (
        <div className="space-y-1">
          <p className="font-mono-game text-[8px] text-muted-foreground">
            Next: {nextTier.description}
          </p>
          <div className="flex flex-wrap gap-1">
            {nextTier.cost.map((cost, i) => {
              const isClickable = cost.type === 'item' && RECIPE_MAP[cost.itemId];
              return (
                <span
                  key={i}
                  onClick={() => isClickable && handleItemClick(cost)}
                  className={`font-mono-game text-[7px] px-1.5 py-0.5 border rounded-sm ${
                    isClickable 
                      ? 'cursor-pointer hover:bg-primary/10 hover:border-primary/50 transition-colors' 
                      : ''
                  } ${
                    (cost.type === 'currency' ? state.currency >= cost.quantity :
                     cost.type === 'item' ? (state.items[cost.itemId] || 0) >= cost.quantity :
                     (state.ingots[cost.itemId] || 0) >= cost.quantity)
                      ? 'border-border text-muted-foreground'
                      : 'border-red-500/30 text-red-400'
                  }`}
                >
                  {cost.quantity}x {getItemName(cost.itemId, cost.type)}
                  {isClickable && <span className="ml-1 text-[6px] opacity-60">🔗</span>}
                </span>
              );
            })}
          </div>
          <button
            onClick={() => dispatch({ type: 'UPGRADE_REFINERY', upgradeId })}
            disabled={!canAfford}
            className={`w-full font-mono-game text-[8px] uppercase py-1 border transition-colors ${
              canAfford
                ? `${catStyle.border} ${catStyle.text} hover:${catStyle.bg}`
                : 'border-border/30 text-muted-foreground/30 cursor-not-allowed'
            }`}
          >
            Upgrade to Tier {currentLevel + 1}
          </button>
        </div>
      )}

      {/* Tier pips */}
      <div className="flex gap-0.5">
        {Array.from({ length: def.maxTier }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${
              i < currentLevel ? catStyle.text.replace('text-', 'bg-') : 'bg-muted'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function OutputCard({ output }: { output: RefineryOutput }) {
  const { dispatch } = useGame();
  const ore = ORE_MAP[output.oreId];
  const style = OUTPUT_TYPE_COLORS[output.outputType];
  const value = ore ? Math.floor(ore.value * output.valueMultiplier * output.quantity) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={`border ${style.border} ${style.bg} rounded-sm p-2 flex items-center justify-between gap-2`}
    >
      <div className="min-w-0">
        <span className={`font-mono-game text-[10px] ${style.text}`}>
          {style.label} {ore?.name || output.oreId}
          {output.quantity > 1 && <span className="text-muted-foreground"> x{output.quantity}</span>}
        </span>
        <span className="font-mono-game text-[9px] text-accent ml-2">
          {value.toLocaleString()} ñ
        </span>
      </div>
      <button
        onClick={() => dispatch({ type: 'COLLECT_REFINERY_OUTPUT', outputId: output.id })}
        className={`font-mono-game text-[8px] uppercase px-2 py-1 border ${style.border} ${style.text} hover:bg-white/5 transition-colors shrink-0`}
      >
        Collect
      </button>
    </motion.div>
  );
}

export function RefineryPanel() {
  const { state, dispatch } = useGame();
  const [selectedOreId, setSelectedOreId] = useState('');
  const [insertQty, setInsertQty] = useState(1);
  const [upgradeTab, setUpgradeTab] = useState<RefineryUpgradeCategory>('speed');

  const hasRefinery = !!state.refinery;

  // Available ores to insert — only actual ores, not items
  const availableOres = useMemo(() =>
    Object.entries(state.ores)
      .filter(([id, qty]) => qty > 0 && ORE_MAP[id])
      .map(([id, qty]) => ({ id, name: ORE_MAP[id].name, qty, tier: ORE_MAP[id].tier }))
      .sort((a, b) => b.tier - a.tier),
    [state.ores]
  );

  if (!hasRefinery) {
    return (
      <div className="p-4 space-y-4">
        <h2 className="font-mono-game text-xs tracking-[0.2em] uppercase text-muted-foreground">🏭 Refinery</h2>
        <div className="border border-cyan-500/20 bg-cyan-500/5 rounded-sm p-6 text-center space-y-2">
          <p className="font-mono-game text-sm text-cyan-300">Ore Refinery</p>
          <p className="font-mono-game text-[10px] text-muted-foreground leading-relaxed">
            This structure is not yet built. Craft it in the Craft tab using<br/>
            <span className="text-cyan-300">1x Machine Chassis</span> + <span className="text-cyan-300">2x Thermal Regulator</span> +<br/>
            <span className="text-cyan-300">3x Gear Assembly</span> + <span className="text-cyan-300">2x Energy Channel</span> + <span className="text-cyan-300">1x Pressure Core</span>.
          </p>
          <p className="font-mono-game text-[9px] text-muted-foreground/60 italic">
            "Feed it ore. It will decide the rest."
          </p>
        </div>
      </div>
    );
  }

  const ref = state.refinery!;
  const sessionMs = Date.now() - ref.sessionStartTime;
  const sessionMinutes = sessionMs / 60_000;

  const processTime = getProcessTime(ref.upgrades, sessionMs, state.mutatedOres.length);
  const batchSize = getBatchSize(ref.upgrades, sessionMs);
  const progress = ref.processing
    ? Math.min(1, (Date.now() - ref.processStartTime) / ref.processDuration)
    : 0;
  const timeLeft = ref.processing
    ? Math.max(0, ref.processStartTime + ref.processDuration - Date.now())
    : 0;

  const idleSpeed = getIdleSpeedMultiplier(sessionMs);
  const idleQuality = getIdleQualityBonus(sessionMs);
  const idleBatch = getIdleBatchBonus(sessionMs);

  const categories: RefineryUpgradeCategory[] = ['speed', 'value', 'risk', 'mutation'];

  const handleInsert = () => {
    if (!selectedOreId) return;
    dispatch({ type: 'INSERT_ORE_REFINERY', oreId: selectedOreId, quantity: insertQty });
  };

  const totalOutputValue = state.refineryOutputs.reduce((sum, o) => {
    const ore = ORE_MAP[o.oreId];
    return sum + (ore ? Math.floor(ore.value * o.valueMultiplier * o.quantity) : 0);
  }, 0);

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-mono-game text-xs tracking-[0.2em] uppercase text-muted-foreground">🏭 Refinery</h2>
        <div className="flex items-center gap-3">
          <span className="font-mono-game text-[9px] text-muted-foreground">
            {ref.totalProcessed.toLocaleString()} ores processed
          </span>
          {state.refineryOutputs.length > 0 && (
            <span className="font-mono-game text-[9px] text-cyan-400 border border-cyan-400/30 px-2 py-0.5">
              {state.refineryOutputs.length} output{state.refineryOutputs.length !== 1 ? 's' : ''} ready
            </span>
          )}
        </div>
      </div>

      {/* Lore */}
      <p className="font-mono-game text-[9px] text-muted-foreground/60 italic border-l border-cyan-500/30 pl-3">
        "The machine hums. It knows the ore better than you ever will."
      </p>

      {/* Input + Processing */}
      <div className="border border-border bg-card rounded-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-mono-game text-[10px] uppercase tracking-wider text-cyan-400">
            Processing Bay
          </span>
          <span className={`font-mono-game text-[9px] uppercase px-2 py-0.5 border rounded-sm ${
            ref.processing ? 'border-cyan-400/40 text-cyan-400' : 'border-border text-muted-foreground'
          }`}>
            {ref.processing ? 'Active' : 'Idle'}
          </span>
        </div>

        {/* Active processing */}
        {ref.processing && ref.inputOreId && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono-game text-[10px] text-foreground">
                Refining: <span className="text-cyan-300">{ORE_MAP[ref.inputOreId]?.name || ref.inputOreId}</span>
                <span className="text-muted-foreground ml-2">({ref.inputQuantity} remaining)</span>
              </span>
              <span className="font-mono-game text-[9px] text-muted-foreground">
                {formatMs(timeLeft)} left
              </span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-cyan-500"
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="font-mono-game text-[9px] text-muted-foreground">
              Batch: {batchSize} · Cycle: {formatMs(processTime)}
            </p>
          </div>
        )}

        {/* Insert ores */}
        {!ref.processing && (
          <div className="space-y-2">
            <div className="space-y-1">
              <label className="font-mono-game text-[9px] uppercase tracking-wider text-muted-foreground">Select Ore to Refine</label>
              <select
                value={selectedOreId}
                onChange={e => setSelectedOreId(e.target.value)}
                className="w-full bg-background border border-border px-2 py-1.5 font-mono-game text-[10px] text-foreground focus:outline-none focus:border-cyan-400"
              >
                <option value="">-- Choose an ore --</option>
                {availableOres.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.name} (x{o.qty}) [Tier {o.tier}]
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <label className="font-mono-game text-[9px] uppercase tracking-wider text-muted-foreground">Quantity</label>
                <input
                  type="number"
                  min={1}
                  max={selectedOreId ? (state.ores[selectedOreId] || 0) : 1}
                  value={insertQty}
                  onChange={e => setInsertQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-background border border-border px-2 py-1.5 font-mono-game text-[10px] text-foreground focus:outline-none focus:border-cyan-400"
                />
              </div>
              <button
                onClick={() => setInsertQty(selectedOreId ? (state.ores[selectedOreId] || 0) : 1)}
                className="font-mono-game text-[8px] uppercase px-2 py-1.5 border border-border text-muted-foreground hover:text-foreground transition-colors"
              >
                Max
              </button>
            </div>

            {/* Preview */}
            {selectedOreId && (
              <div className="border border-border/50 bg-muted/20 rounded-sm p-2 space-y-0.5">
                <p className="font-mono-game text-[9px] text-muted-foreground">
                  Cycle time: <span className="text-foreground">{formatMs(processTime)}</span>
                  {'  ·  '}
                  Batch size: <span className="text-foreground">{batchSize}</span>
                </p>
                <p className="font-mono-game text-[9px] text-muted-foreground">
                  Est. cycles: <span className="text-foreground">{Math.ceil(insertQty / batchSize)}</span>
                </p>
              </div>
            )}

            <button
              onClick={handleInsert}
              disabled={!selectedOreId}
              className="w-full font-mono-game text-[10px] uppercase py-1.5 border border-cyan-500/60 text-cyan-400 hover:bg-cyan-500/10 disabled:opacity-30 transition-colors"
            >
              Insert & Begin Refining
            </button>
          </div>
        )}
      </div>

      {/* Heat Gauge */}
      <div className="border border-border bg-card rounded-sm p-3 space-y-2">
        <HeatGauge heat={ref.heat} />
        {ref.heat > 15 && (
          <button
            onClick={() => dispatch({ type: 'RESET_REFINERY_HEAT' })}
            className="font-mono-game text-[8px] uppercase px-3 py-1 border border-border text-muted-foreground hover:text-foreground hover:border-cyan-400/50 transition-colors"
          >
            Emergency Cooldown (−30°)
          </button>
        )}
      </div>

      {/* Idle bonuses */}
      <div className="border border-border/40 rounded-sm p-3 space-y-1.5">
        <p className="font-mono-game text-[9px] uppercase tracking-wider text-muted-foreground">Idle Session Bonuses</p>
        <div className="flex flex-wrap gap-3">
          <span className="font-mono-game text-[8px] text-sky-400">
            ⚡ Speed: x{idleSpeed.toFixed(2)}
          </span>
          <span className="font-mono-game text-[8px] text-emerald-400">
            ✨ Quality: +{(idleQuality * 100).toFixed(1)}%
          </span>
          <span className="font-mono-game text-[8px] text-purple-400">
            📦 Batch: +{idleBatch}
          </span>
        </div>
        <p className="font-mono-game text-[8px] text-muted-foreground/50">
          Session: {formatDuration(sessionMinutes)} — bonuses increase over time
        </p>
      </div>

      {/* Outputs */}
      {state.refineryOutputs.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-mono-game text-[10px] uppercase tracking-wider text-muted-foreground">Refined Outputs</p>
            <button
              onClick={() => dispatch({ type: 'COLLECT_ALL_REFINERY_OUTPUTS' })}
              className="font-mono-game text-[8px] uppercase px-3 py-1 border border-accent/60 text-accent hover:bg-accent/10 transition-colors"
            >
              Collect All ({totalOutputValue.toLocaleString()} ñ)
            </button>
          </div>
          <AnimatePresence>
            {state.refineryOutputs.slice(0, 20).map(o => (
              <OutputCard key={o.id} output={o} />
            ))}
          </AnimatePresence>
          {state.refineryOutputs.length > 20 && (
            <p className="font-mono-game text-[9px] text-muted-foreground text-center">
              +{state.refineryOutputs.length - 20} more outputs...
            </p>
          )}
        </div>
      )}

      {state.refineryOutputs.length === 0 && (
        <p className="font-mono-game text-[10px] text-muted-foreground/50 text-center py-2">
          No outputs yet. Insert ores above to begin refining.
        </p>
      )}

      {/* Upgrades */}
      <div className="space-y-3">
        <p className="font-mono-game text-[10px] uppercase tracking-wider text-muted-foreground">Refinery Upgrades</p>

        {/* Category tabs */}
        <div className="flex gap-1 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setUpgradeTab(cat)}
              className={`font-mono-game text-[8px] uppercase px-3 py-1.5 border rounded-sm transition-colors ${
                upgradeTab === cat
                  ? `${CATEGORY_COLORS[cat].border} ${CATEGORY_COLORS[cat].text} ${CATEGORY_COLORS[cat].bg}`
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {CATEGORY_COLORS[cat].label}
            </button>
          ))}
        </div>

        {/* Upgrade grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ALL_REFINERY_UPGRADES
            .filter(u => u.category === upgradeTab)
            .map(u => (
              <UpgradeCard key={u.id} upgradeId={u.id} />
            ))}
        </div>
      </div>

      {/* Progression info */}
      <div className="border border-border/20 rounded-sm p-3">
        <p className="font-mono-game text-[8px] text-muted-foreground/40 leading-relaxed">
          <span className="text-foreground/50">Early game:</span> Small value increases from refining.{' '}
          <span className="text-foreground/50">Mid game:</span> Main source of refined ores for mutation.{' '}
          <span className="text-foreground/50">Late game:</span> Feeds into higher-tier mutation and advanced systems.{' '}
          Balance between selling refined ores or using them for mutations.
        </p>
      </div>
    </div>
  );
}

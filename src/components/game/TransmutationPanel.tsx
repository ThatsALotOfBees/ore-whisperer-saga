import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '@/hooks/useGameState';
import { ORE_MAP } from '@/data/ores';
import { getTierFromBoost, getFailureChance, getTransmutationDuration } from '@/data/mutations';
import type { MutatedOre, TransmutationTable } from '@/hooks/useGameState';
import type { MutationType } from '@/data/mutations';

const MUTATION_TYPE_COLORS: Record<MutationType, string> = {
  positive: 'text-green-400 border-green-400/30 bg-green-400/10',
  corrupted: 'text-red-400 border-red-400/30 bg-red-400/10',
  sanguine: 'text-pink-400 border-pink-400/30 bg-pink-400/10',
};

const FAILURE_LABELS: Record<string, { label: string; color: string; desc: string }> = {
  degraded: { label: '❌ Degraded', color: 'text-orange-400', desc: 'Severely reduced value' },
  corrupt_mass: { label: '⚠️ Corrupt Mass', color: 'text-red-500', desc: 'Sells for nothing' },
  overgrowth: { label: '🧫 Overgrowth', color: 'text-yellow-400', desc: 'x3 quantity, 50% value' },
};

function formatDuration(ms: number): string {
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  return `${Math.floor(ms / 60_000)}m ${Math.round((ms % 60_000) / 1000)}s`;
}

function calcMutatedSellValue(mutated: MutatedOre, totalMined: number): number {
  const ore = ORE_MAP[mutated.oreId];
  const baseValue = ore ? ore.value * 2.5 : 50;
  let val = baseValue;
  for (const mod of mutated.mutations) {
    if (mod.sellValueMultiplier) val *= mod.sellValueMultiplier;
    if (mod.id === 'bloodbound') {
      const thousands = Math.floor(totalMined / 1000);
      val *= (1 + thousands * (mod.sellValueMultiplier! - 1));
    }
  }
  if (mutated.failureOutcome === 'degraded') val *= 0.3;
  if (mutated.failureOutcome === 'corrupt_mass') val = 0;
  if (mutated.failureOutcome === 'overgrowth') val *= 0.5;
  return Math.max(0, Math.floor(val * mutated.quantity));
}

function TableRow({ table }: { table: TransmutationTable }) {
  const { state, dispatch } = useGame();
  const [selectedOreId, setSelectedOreId] = useState('');
  const [veiniteBoost, setVeiniteBoost] = useState(0);
  const [biomassBoost, setBiomassBoost] = useState(false);

  const availableIngots = useMemo(() =>
    Object.entries(state.ingots)
      .filter(([id, qty]) => qty > 0 && ORE_MAP[id])
      .sort((a, b) => (ORE_MAP[b[0]]?.tier ?? 0) - (ORE_MAP[a[0]]?.tier ?? 0)),
    [state.ingots]
  );

  const maxBoost = Math.min(5, state.ingots['veinite'] || 0);
  const tier = getTierFromBoost(veiniteBoost);
  const failChance = getFailureChance(tier);
  const selectedOre = selectedOreId ? ORE_MAP[selectedOreId] : null;
  const duration = selectedOre ? getTransmutationDuration(selectedOre.tier, tier) : 0;
  const isProcessing = !!table.activeJob;

  const job = table.activeJob;
  const progress = job
    ? Math.min(1, (Date.now() - job.startTime) / job.duration)
    : 0;

  const jobOre = job ? ORE_MAP[job.oreId] : null;
  const timeLeft = job ? Math.max(0, job.startTime + job.duration - Date.now()) : 0;

  const handleStart = () => {
    if (!selectedOreId) return;
    dispatch({
      type: 'START_TRANSMUTATION',
      tableId: table.id,
      oreId: selectedOreId,
      veiniteBoost,
      biomassBoost,
    });
    setSelectedOreId('');
    setVeiniteBoost(0);
    setBiomassBoost(false);
  };

  return (
    <div className="border border-border bg-card rounded-sm p-4 space-y-3">
      {/* Table header */}
      <div className="flex items-center justify-between">
        <span className="font-mono-game text-[10px] uppercase tracking-wider text-pink-400">
          🩸 Transmutation Table
        </span>
        <span className={`font-mono-game text-[9px] uppercase px-2 py-0.5 border rounded-sm ${
          isProcessing ? 'border-pink-400/40 text-pink-400' : 'border-border text-muted-foreground'
        }`}>
          {isProcessing ? 'Processing' : 'Idle'}
        </span>
      </div>

      {/* Active job */}
      {isProcessing && job && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-mono-game text-[10px] text-foreground">
              Mutating: <span className="text-pink-300">{jobOre?.name ?? job.oreId}</span>
              <span className="text-muted-foreground ml-2">Tier {job.tier}</span>
            </span>
            <span className="font-mono-game text-[9px] text-muted-foreground">
              {formatDuration(timeLeft)} left
            </span>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-pink-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="font-mono-game text-[9px] text-muted-foreground">
            Fail chance: {Math.round(failChance * 100)}%
            {job.veiniteBoost > 0 && ` · ${job.veiniteBoost}x Veinite boost`}
            {job.biomassBoost && ' · Biomass active'}
          </p>
        </div>
      )}

      {/* Input form */}
      {!isProcessing && (
        <div className="space-y-2">
          {/* Ore select */}
          <div className="space-y-1">
            <label className="font-mono-game text-[9px] uppercase tracking-wider text-muted-foreground">Select Ingot</label>
            <select
              value={selectedOreId}
              onChange={e => setSelectedOreId(e.target.value)}
              className="w-full bg-background border border-border px-2 py-1.5 font-mono-game text-[10px] text-foreground focus:outline-none focus:border-pink-400"
            >
              <option value="">-- Choose an ingot --</option>
              {availableIngots.map(([id, qty]) => (
                <option key={id} value={id}>
                  {ORE_MAP[id]?.name} Ingot (x{qty}) [Tier {ORE_MAP[id]?.tier}]
                </option>
              ))}
            </select>
          </div>

          {/* Veinite boost */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-mono-game text-[9px] uppercase tracking-wider text-muted-foreground">
                Veinite Boost: {veiniteBoost}x
              </label>
              <span className="font-mono-game text-[9px] text-pink-400">
                → Tier {tier} · {Math.round(failChance * 100)}% fail
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={maxBoost}
              value={veiniteBoost}
              onChange={e => setVeiniteBoost(Number(e.target.value))}
              className="w-full accent-pink-500"
              disabled={maxBoost === 0}
            />
            <div className="flex justify-between font-mono-game text-[8px] text-muted-foreground/60">
              <span>0 = 1 mutation, T1</span>
              <span>2–3 = 2 mutations, T2</span>
              <span>4–5 = 3 mutations, T3</span>
            </div>
          </div>

          {/* Biomass toggle */}
          <button
            onClick={() => setBiomassBoost(b => !b)}
            className={`font-mono-game text-[9px] uppercase px-3 py-1 border transition-colors ${
              biomassBoost
                ? 'border-pink-400 bg-pink-400/10 text-pink-400'
                : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {biomassBoost ? '🩸 Biomass Active' : '+ Add Biomass (↑ Sanguine chance)'}
          </button>

          {/* Preview */}
          {selectedOre && (
            <div className="border border-border/50 bg-muted/20 rounded-sm p-2 space-y-0.5">
              <p className="font-mono-game text-[9px] text-muted-foreground">
                Duration: <span className="text-foreground">{formatDuration(duration)}</span>
                {'  ·  '}
                Mutations: <span className="text-foreground">{veiniteBoost === 0 ? 1 : veiniteBoost <= 2 ? 2 : 3}</span>
              </p>
              <p className="font-mono-game text-[9px] text-muted-foreground">
                Mutation pool: {biomassBoost ? '25% sanguine, 20% corrupted, 55% positive' : '10% sanguine, 20% corrupted, 70% positive'}
              </p>
            </div>
          )}

          <button
            onClick={handleStart}
            disabled={!selectedOreId}
            className="w-full font-mono-game text-[10px] uppercase py-1.5 border border-pink-500/60 text-pink-400 hover:bg-pink-500/10 disabled:opacity-30 transition-colors"
          >
            Begin Transmutation
          </button>
        </div>
      )}
    </div>
  );
}

function MutatedOreCard({ mutated, totalMined }: { mutated: MutatedOre; totalMined: number }) {
  const { dispatch } = useGame();
  const ore = ORE_MAP[mutated.oreId];
  const sellValue = calcMutatedSellValue(mutated, totalMined);
  const failure = mutated.failureOutcome ? FAILURE_LABELS[mutated.failureOutcome] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="border border-border bg-card rounded-sm p-3 space-y-2"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="font-mono-game text-xs text-pink-300 block">
            {ore?.name ?? mutated.oreId} Ingot
            {mutated.quantity > 1 && <span className="text-muted-foreground"> x{mutated.quantity}</span>}
          </span>
          {failure ? (
            <span className={`font-mono-game text-[9px] ${failure.color}`}>
              {failure.label} — {failure.desc}
            </span>
          ) : (
            <div className="flex flex-wrap gap-1 mt-1">
              {mutated.mutations.map((mod, i) => (
                <span
                  key={i}
                  className={`font-mono-game text-[8px] px-1.5 py-0.5 border rounded-sm ${MUTATION_TYPE_COLORS[mod.type]}`}
                >
                  {mod.name}
                </span>
              ))}
            </div>
          )}
        </div>
        <span className="font-mono-game text-sm text-accent flex-shrink-0">
          {sellValue.toLocaleString()} ñ
        </span>
      </div>

      {!failure && mutated.mutations.map((mod, i) => (
        <p key={i} className="font-mono-game text-[9px] text-muted-foreground leading-relaxed">
          <span className={MUTATION_TYPE_COLORS[mod.type].split(' ')[0]}>{mod.name}:</span> {mod.description}
        </p>
      ))}

      <div className="flex gap-2 pt-1">
        <button
          onClick={() => dispatch({ type: 'SELL_MUTATED_ORE', mutatedOreId: mutated.id })}
          className="flex-1 font-mono-game text-[9px] uppercase py-1 border border-accent/60 text-accent hover:bg-accent/10 transition-colors"
        >
          Sell ({sellValue.toLocaleString()} ñ)
        </button>
        <button
          onClick={() => dispatch({ type: 'DISCARD_MUTATED_ORE', mutatedOreId: mutated.id })}
          className="font-mono-game text-[9px] uppercase px-3 py-1 border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
        >
          Discard
        </button>
      </div>
    </motion.div>
  );
}

export function TransmutationPanel() {
  const { state } = useGame();
  const hasTables = state.transmutationTables.length > 0;

  if (!hasTables) {
    return (
      <div className="p-4 space-y-4">
        <h2 className="font-mono-game text-xs tracking-[0.2em] uppercase text-muted-foreground">🩸 Transmutation</h2>
        <div className="border border-pink-500/20 bg-pink-500/5 rounded-sm p-6 text-center space-y-2">
          <p className="font-mono-game text-sm text-pink-300">Sanguinite Transmutation Table</p>
          <p className="font-mono-game text-[10px] text-muted-foreground leading-relaxed">
            This structure is not yet built. Craft it in the Craft tab using<br/>
            <span className="text-pink-300">10x Veinite Ingot</span> + <span className="text-pink-300">1x Veinite Structural Core</span>.
          </p>
          <p className="font-mono-game text-[9px] text-muted-foreground/60 italic">
            "The ore remembers. Give it blood, and it will remember more."
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-mono-game text-xs tracking-[0.2em] uppercase text-muted-foreground">🩸 Transmutation</h2>
        {state.mutatedOres.length > 0 && (
          <span className="font-mono-game text-[9px] text-pink-400 border border-pink-400/30 px-2 py-0.5">
            {state.mutatedOres.length} mutated ore{state.mutatedOres.length !== 1 ? 's' : ''} ready
          </span>
        )}
      </div>

      {/* Lore */}
      <p className="font-mono-game text-[9px] text-muted-foreground/60 italic border-l border-pink-500/30 pl-3">
        "Insert an ingot. Channel Veinite. Let the blood decide."
      </p>

      {/* Tables */}
      <div className="space-y-3">
        {state.transmutationTables.map(table => (
          <TableRow key={table.id} table={table} />
        ))}
      </div>

      {/* Mutation legend */}
      <div className="border border-border/40 rounded-sm p-3 space-y-1.5">
        <p className="font-mono-game text-[9px] uppercase tracking-wider text-muted-foreground">Mutation Types</p>
        <div className="flex gap-3 flex-wrap">
          {(['positive', 'corrupted', 'sanguine'] as const).map(type => (
            <span key={type} className={`font-mono-game text-[8px] px-2 py-0.5 border rounded-sm capitalize ${MUTATION_TYPE_COLORS[type]}`}>
              {type}
            </span>
          ))}
        </div>
        <p className="font-mono-game text-[9px] text-muted-foreground/60">
          Higher Veinite boost → more mutations + higher tier. Add Biomass → increased Sanguine chance.
        </p>
      </div>

      {/* Mutated ore inventory */}
      {state.mutatedOres.length > 0 && (
        <div className="space-y-2">
          <p className="font-mono-game text-[10px] uppercase tracking-wider text-muted-foreground">Mutated Ore Inventory</p>
          <AnimatePresence>
            {state.mutatedOres.map(mo => (
              <MutatedOreCard key={mo.id} mutated={mo} totalMined={state.totalMined} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {state.mutatedOres.length === 0 && (
        <p className="font-mono-game text-[10px] text-muted-foreground/50 text-center py-4">
          No mutated ores yet. Start a transmutation above.
        </p>
      )}
    </div>
  );
}

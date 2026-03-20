import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame, getGrowSpeedMultiplier, getHarvestDupeChance, type Greenhouse } from '@/hooks/useGameState';
import {
  PLANT_MAP, ALL_PLANTS,
  PLOT_COST_BASE, PLOT_COST_MULTIPLIER,
  GROW_SPEED_UPGRADE_BASE, GROW_SPEED_UPGRADE_MULTIPLIER,
  HARVEST_UPGRADE_BASE, HARVEST_UPGRADE_MULTIPLIER,
  MAX_PLOTS_PER_GREENHOUSE, GROW_SPEED_MAX_LEVEL, HARVEST_MAX_LEVEL,
  PLANT_RARITY_COLORS, PLANT_RARITY_BORDER,
  type PlantRarity,
} from '@/data/garden';
import { playSound } from '@/lib/audio';
import { useEffect } from 'react';

export function GardenPanel() {
  const { state, dispatch } = useGame();
  const [selectedGH, setSelectedGH] = useState(0);
  const [plantingPlot, setPlantingPlot] = useState<number | null>(null);
  const [, setTick] = useState(0);

  // Force re-render every second for progress bars
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const gh = state.greenhouses[selectedGH];
  const seedEntries = useMemo(() => {
    return Object.entries(state.seeds)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => ({ plant: PLANT_MAP[id], qty }))
      .filter(e => e.plant)
      .sort((a, b) => {
        const order: PlantRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
        return order.indexOf(a.plant!.rarity) - order.indexOf(b.plant!.rarity);
      });
  }, [state.seeds]);

  const seedPackCount = state.items['seed_pack'] || 0;

  if (state.greenhouses.length === 0) {
    return (
      <div className="p-4 space-y-4">
        <h2 className="font-mono-game text-xs tracking-[0.2em] uppercase text-muted-foreground">Garden</h2>
        <div className="text-center py-12 space-y-3">
          <p className="font-mono-game text-[10px] text-muted-foreground/60">No greenhouses built yet.</p>
          <p className="font-mono-game text-[9px] text-muted-foreground/40">
            Find a "Plant In A Boot" while mining (1% chance) and craft a Greenhouse with 3 Veinite Ingots.
          </p>
        </div>
      </div>
    );
  }

  const plotCost = gh ? Math.floor(PLOT_COST_BASE * Math.pow(PLOT_COST_MULTIPLIER, gh.plots.length - 1)) : 0;
  const growCost = gh ? Math.floor(GROW_SPEED_UPGRADE_BASE * Math.pow(GROW_SPEED_UPGRADE_MULTIPLIER, gh.growSpeedLevel)) : 0;
  const harvestCost = gh ? Math.floor(HARVEST_UPGRADE_BASE * Math.pow(HARVEST_UPGRADE_MULTIPLIER, gh.harvestLevel)) : 0;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-mono-game text-xs tracking-[0.2em] uppercase text-muted-foreground">Garden</h2>
        <span className="font-mono-game text-sm text-accent">{state.currency.toLocaleString()} ¤</span>
      </div>

      {/* Greenhouse selector */}
      {state.greenhouses.length > 1 && (
        <div className="flex gap-1 flex-wrap">
          {state.greenhouses.map((_, i) => (
            <button
              key={i}
              onClick={() => { setSelectedGH(i); setPlantingPlot(null); }}
              className={`font-mono-game text-[10px] uppercase tracking-wider px-3 py-1.5 border transition-colors ${
                selectedGH === i ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              Greenhouse {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Seed Packs */}
      <div className="border border-border bg-card rounded-sm p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-mono-game text-[10px] uppercase tracking-wider text-muted-foreground">Seed Packs</span>
          <span className="font-mono-game text-xs text-foreground">{seedPackCount}</span>
        </div>
        {seedPackCount > 0 && (
          <button
            onClick={() => { dispatch({ type: 'OPEN_SEED_PACK' }); playSound('success'); }}
            className="w-full font-mono-game text-[10px] uppercase py-1.5 border border-accent text-accent hover:bg-accent/10 transition-colors"
          >
            Open Seed Pack
          </button>
        )}
        <p className="font-mono-game text-[8px] text-muted-foreground/40">
          Found while mining (1% chance). Contains a random seed.
        </p>
      </div>

      {/* Seeds inventory */}
      {seedEntries.length > 0 && (
        <div className="space-y-1">
          <span className="font-mono-game text-[10px] uppercase tracking-wider text-muted-foreground">Your Seeds</span>
          <div className="flex gap-1 flex-wrap">
            {seedEntries.map(({ plant, qty }) => (
              <span
                key={plant!.id}
                className={`font-mono-game text-[9px] px-2 py-1 border rounded-sm ${PLANT_RARITY_BORDER[plant!.rarity]} ${PLANT_RARITY_COLORS[plant!.rarity]}`}
              >
                {plant!.emoji} {plant!.name} ×{qty}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Plots grid */}
      {gh && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono-game text-[10px] uppercase tracking-wider text-muted-foreground">
              Plots ({gh.plots.length}/{MAX_PLOTS_PER_GREENHOUSE})
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { dispatch({ type: 'REPLANT_ALL', greenhouseIndex: selectedGH }); playSound('success'); }}
                disabled={seedEntries.length === 0 || gh.plots.every(p => p.plantId !== null)}
                className="font-mono-game text-[9px] uppercase px-2 py-0.5 border border-primary text-primary hover:bg-primary/10 disabled:opacity-30 transition-colors"
              >
                Harvest & Replant
              </button>
              <span className="font-mono-game text-[8px] text-muted-foreground/50">
                Speed Lv{gh.growSpeedLevel} · Dupe {getHarvestDupeChance(gh.harvestLevel) * 100}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {gh.plots.map((plot, pi) => {
              const plant = plot.plantId ? PLANT_MAP[plot.plantId] : null;
              const growSpeed = getGrowSpeedMultiplier(gh.growSpeedLevel);
              const adjustedGrowTime = plant ? plant.growTimeMs / growSpeed : 0;
              const elapsed = plot.plantedAt ? Date.now() - plot.plantedAt : 0;
              const progress = adjustedGrowTime > 0 ? Math.min(1, elapsed / adjustedGrowTime) : 0;
              const isReady = progress >= 1;
              const isPlanting = plantingPlot === pi;

              return (
                <div
                  key={pi}
                  className={`border rounded-sm p-2 min-h-[80px] flex flex-col items-center justify-center gap-1 transition-colors ${
                    plot.plantId
                      ? isReady
                        ? 'border-accent bg-accent/5 cursor-pointer hover:bg-accent/10'
                        : `${plant ? PLANT_RARITY_BORDER[plant.rarity] : 'border-border'} bg-card`
                      : isPlanting
                        ? 'border-primary bg-primary/5'
                        : 'border-border/50 bg-card/50 cursor-pointer hover:border-border'
                  }`}
                  onClick={() => {
                    if (isReady) {
                      dispatch({ type: 'HARVEST_PLANT', greenhouseIndex: selectedGH, plotIndex: pi });
                      playSound('success');
                    } else if (!plot.plantId) {
                      setPlantingPlot(isPlanting ? null : pi);
                    }
                  }}
                >
                  {plant ? (
                    <>
                      <span className="text-lg">{plant.emoji}</span>
                      <span className={`font-mono-game text-[8px] ${PLANT_RARITY_COLORS[plant.rarity]}`}>
                        {plant.name}
                      </span>
                      {isReady ? (
                        <span className="font-mono-game text-[8px] text-accent uppercase animate-pulse">Harvest!</span>
                      ) : (
                        <>
                          <div className="w-full bg-border/30 h-1 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-accent/60 transition-all duration-1000"
                              style={{ width: `${progress * 100}%` }}
                            />
                          </div>
                          <span className="font-mono-game text-[7px] text-muted-foreground/50">
                            {formatTimeRemaining(adjustedGrowTime - elapsed)}
                          </span>
                          <span className="font-mono-game text-[7px] text-accent/50">
                            +{plant.passiveIncomePerTick} ¤/tick
                          </span>
                        </>
                      )}
                    </>
                  ) : (
                    <span className="font-mono-game text-[9px] text-muted-foreground/30 uppercase">
                      {isPlanting ? 'Select seed ↓' : 'Empty'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Planting selector */}
          <AnimatePresence>
            {plantingPlot !== null && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="border border-primary/30 bg-primary/5 rounded-sm p-3 space-y-2">
                  <span className="font-mono-game text-[10px] uppercase tracking-wider text-primary">Select Seed for Plot {plantingPlot + 1}</span>
                  {seedEntries.length === 0 && (
                    <p className="font-mono-game text-[9px] text-muted-foreground/50">No seeds. Open seed packs or harvest plants.</p>
                  )}
                  <div className="flex gap-1 flex-wrap">
                    {seedEntries.map(({ plant, qty }) => (
                      <button
                        key={plant!.id}
                        onClick={() => {
                          dispatch({ type: 'PLANT_SEED', greenhouseIndex: selectedGH, plotIndex: plantingPlot, plantId: plant!.id });
                          playSound('click');
                          setPlantingPlot(null);
                        }}
                        className={`font-mono-game text-[9px] px-2 py-1.5 border rounded-sm hover:bg-card/80 transition-colors ${PLANT_RARITY_BORDER[plant!.rarity]} ${PLANT_RARITY_COLORS[plant!.rarity]}`}
                      >
                        {plant!.emoji} {plant!.name} ×{qty}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Upgrades */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            {gh.plots.length < MAX_PLOTS_PER_GREENHOUSE && (
              <button
                onClick={() => { dispatch({ type: 'ADD_PLOT', greenhouseIndex: selectedGH }); playSound('click'); }}
                disabled={state.currency < plotCost}
                className="font-mono-game text-[9px] uppercase py-2 border border-border text-muted-foreground hover:text-foreground hover:border-accent disabled:opacity-30 transition-colors"
              >
                + Plot<br />
                <span className="text-accent text-[8px]">{plotCost.toLocaleString()} ¤</span>
              </button>
            )}
            {gh.growSpeedLevel < GROW_SPEED_MAX_LEVEL && (
              <button
                onClick={() => { dispatch({ type: 'UPGRADE_GROW_SPEED', greenhouseIndex: selectedGH }); playSound('click'); }}
                disabled={state.currency < growCost}
                className="font-mono-game text-[9px] uppercase py-2 border border-border text-muted-foreground hover:text-foreground hover:border-accent disabled:opacity-30 transition-colors"
              >
                Grow Speed {gh.growSpeedLevel + 1}<br />
                <span className="text-accent text-[8px]">{growCost.toLocaleString()} ¤</span>
              </button>
            )}
            {gh.harvestLevel < HARVEST_MAX_LEVEL && (
              <button
                onClick={() => { dispatch({ type: 'UPGRADE_HARVEST', greenhouseIndex: selectedGH }); playSound('click'); }}
                disabled={state.currency < harvestCost}
                className="font-mono-game text-[9px] uppercase py-2 border border-border text-muted-foreground hover:text-foreground hover:border-accent disabled:opacity-30 transition-colors"
              >
                Dupe Chance {getHarvestDupeChance(gh.harvestLevel + 1) * 100}%<br />
                <span className="text-accent text-[8px]">{harvestCost.toLocaleString()} ¤</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return 'Ready!';
  const totalSec = Math.ceil(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

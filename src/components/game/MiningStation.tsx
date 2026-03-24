import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '@/hooks/useGameState';
import { type OreRarity, SPECIAL_MINING_DROPS } from '@/data/ores';
import { getItemRarity } from '@/lib/item-utils';

export function MiningStation() {
  const { state, dispatch, miningSpeed } = useGame();
  const [isMining, setIsMining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [drops, setDrops] = useState<{ id: number; name: string; rarity: OreRarity; qty: number; icon?: string }[]>([]);
  const dropIdRef = useRef(0);

  const activePoint = state.miningPoints.find(p => p.id === state.activeMiningPointId) || state.miningPoints[0];
  const isAutoMining = activePoint.autoMinerEnabled;
  const autoMinerLevel = activePoint.upgrades.auto_miner_speed || 0;
  const autoMinerInterval = Math.max(2000, 10000 * Math.pow(0.85, autoMinerLevel));

  const tickInterval = Math.max(30, Math.floor(50 / miningSpeed));
  const progressPerTick = 2 * miningSpeed;

  // Manual mining (disabled when auto-miner is on)
  useEffect(() => {
    if (!isMining || isAutoMining) {
      setProgress(0);
      return;
    }

    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + progressPerTick;
        if (next >= 100) {
          dispatch({ type: 'MINE_TICK' });
          return 0;
        }
        return next;
      });
    }, tickInterval);

    return () => clearInterval(interval);
  }, [isMining, isAutoMining, tickInterval, progressPerTick, dispatch]);

  // Auto-mining progress animation
  const [autoProgress, setAutoProgress] = useState(0);
  useEffect(() => {
    if (!isAutoMining) {
      setAutoProgress(0);
      return;
    }
    const tickMs = 50;
    const progressPerAutoTick = (100 / autoMinerInterval) * tickMs;
    const interval = setInterval(() => {
      setAutoProgress(prev => {
        const next = prev + progressPerAutoTick;
        if (next >= 100) return 0;
        return next;
      });
    }, tickMs);
    return () => clearInterval(interval);
  }, [isAutoMining, autoMinerInterval]);

  // Show drop notifications
  useEffect(() => {
    if (state.lastDrop) {
      const id = ++dropIdRef.current;
      setDrops(prev => [...prev.slice(-4), { id, name: state.lastDrop!.ore.name, rarity: state.lastDrop!.ore.rarity, qty: state.lastDrop!.quantity }]);
      setTimeout(() => setDrops(prev => prev.filter(d => d.id !== id)), 2000);
    }
  }, [state.lastDrop]);

  // Show special drop notifications
  useEffect(() => {
    if (state.lastSpecialDrop) {
      const id = ++dropIdRef.current;
      const special = SPECIAL_MINING_DROPS.find(s => s.id === state.lastSpecialDrop);
      const rarity = special?.rarity || getItemRarity(state.lastSpecialDrop);
      setDrops(prev => [...prev.slice(-4), { 
        id, 
        name: special?.name || state.lastSpecialDrop!, 
        rarity, 
        qty: 1,
        icon: special?.icon 
      }]);
      setTimeout(() => setDrops(prev => prev.filter(d => d.id !== id)), 3000);
    }
  }, [state.lastSpecialDrop]);

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const currentProgress = isAutoMining ? autoProgress : progress;
  const strokeDashoffset = circumference - (currentProgress / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-6 p-8">
      {state.miningPoints.length > 1 ? (
        <select
          value={state.activeMiningPointId}
          onChange={(e) => dispatch({ type: 'SWITCH_MINING_POINT', pointId: e.target.value })}
          className="bg-card text-foreground border border-border font-mono-game text-xs tracking-[0.2em] uppercase p-2 rounded-sm focus:outline-none focus:border-primary outline-none cursor-pointer"
        >
          {state.miningPoints.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      ) : (
        <h2 className="font-mono-game text-xs tracking-[0.2em] uppercase text-muted-foreground">
          {activePoint.name}
        </h2>
      )}

      {/* Auto-miner toggle */}
      <div className="flex items-center gap-3">
        <span className={`font-mono-game text-[10px] uppercase tracking-wider ${!isAutoMining ? 'text-primary' : 'text-muted-foreground'}`}>
          Manual
        </span>
        <button
          onClick={() => dispatch({ type: 'TOGGLE_AUTO_MINER' })}
          className={`relative w-12 h-6 rounded-full border transition-colors ${
            isAutoMining ? 'bg-accent/20 border-accent' : 'bg-card border-border'
          }`}
        >
          <div
            className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${
              isAutoMining ? 'left-6 bg-accent' : 'left-0.5 bg-muted-foreground'
            }`}
          />
        </button>
        <span className={`font-mono-game text-[10px] uppercase tracking-wider ${isAutoMining ? 'text-accent' : 'text-muted-foreground'}`}>
          Auto
        </span>
      </div>

      <div className="relative">
        {/* Manual mining button (disabled when auto-mining) */}
        <motion.button
          onPointerDown={() => !isAutoMining && setIsMining(true)}
          onPointerUp={() => setIsMining(false)}
          onPointerLeave={() => setIsMining(false)}
          whileTap={!isAutoMining ? { scale: 0.98 } : {}}
          transition={{ duration: 0.02 }}
          className={`relative h-48 w-48 rounded-full border flex items-center justify-center select-none focus:outline-none ${
            isAutoMining ? 'border-accent/30 cursor-default' : 'border-border cursor-pointer'
          }`}
        >
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="2" />
            <circle
              cx="100" cy="100" r={radius} fill="none"
              stroke={isAutoMining ? 'hsl(var(--accent))' : 'hsl(var(--primary))'}
              strokeWidth="3"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-75"
            />
          </svg>

          <div className="absolute inset-4 rounded-full bg-card/80 flex flex-col items-center justify-center">
            {isAutoMining ? (
              <>
                <span className="font-mono-game text-sm font-bold text-accent tracking-wider">AUTO</span>
                <span className="font-mono-game text-[10px] text-muted-foreground">{(autoMinerInterval / 1000).toFixed(1)}s</span>
              </>
            ) : (
              <span className="font-mono-game text-lg font-bold text-foreground tracking-wider">
                {isMining ? `${Math.floor(progress)}%` : 'EXTRACT'}
              </span>
            )}
          </div>

          {isAutoMining && (
            <motion.div
              animate={{ scale: [1, 1.03, 1], opacity: [0.2, 0.4, 0.2] }}
              transition={{ repeat: Infinity, duration: autoMinerInterval / 1000 }}
              className="absolute inset-0 rounded-full border border-accent"
            />
          )}

          {isMining && !isAutoMining && (
            <motion.div
              animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="absolute inset-0 rounded-full border border-primary"
            />
          )}
        </motion.button>

        {/* Drop notifications */}
        <div className="absolute -right-40 top-0 w-36 space-y-1">
          <AnimatePresence>
            {drops.map(drop => (
              <motion.div
                key={drop.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`font-mono-game text-xs px-2 py-1 border rounded-sm bg-card text-rarity-${drop.rarity} border-rarity-${drop.rarity}`}
              >
                <div className="flex items-center gap-1.5">
                  {drop.icon && <img src={drop.icon} alt="" className="w-4 h-4 object-contain" />}
                  <span>+{drop.qty} {drop.name}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="text-center space-y-1">
        <p className="font-mono-game text-xs text-muted-foreground">
          TOTAL MINED: <span className="text-primary">{state.totalMined}</span>
        </p>
        <p className="font-mono-game text-xs text-muted-foreground">
          {isAutoMining ? (
            <>AUTO-MINER: <span className="text-accent">Lv.{autoMinerLevel} ({(autoMinerInterval / 1000).toFixed(1)}s)</span></>
          ) : (
            <>SPEED: <span className="text-primary">{miningSpeed.toFixed(2)}x</span></>
          )}
        </p>
      </div>

      <p className="text-xs text-muted-foreground/60 max-w-xs text-center">
        {isAutoMining
          ? 'Auto-miner active. Mining happens automatically. Upgrade speed in the Upgrades tab.'
          : 'Hold the button to mine. Toggle auto-mine for hands-free extraction.'}
      </p>
    </div>
  );
}

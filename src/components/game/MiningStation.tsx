import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '@/hooks/useGameState';
import { type OreRarity } from '@/data/ores';

export function MiningStation() {
  const { state, dispatch, miningSpeed } = useGame();
  const [isMining, setIsMining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [drops, setDrops] = useState<{ id: number; name: string; rarity: OreRarity; qty: number }[]>([]);
  const dropIdRef = useRef(0);

  const tickInterval = Math.max(30, Math.floor(50 / miningSpeed));
  const progressPerTick = 2 * miningSpeed;

  useEffect(() => {
    if (!isMining) {
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
  }, [isMining, tickInterval, progressPerTick, dispatch]);

  // Show drop notifications
  useEffect(() => {
    if (state.lastDrop) {
      const id = ++dropIdRef.current;
      setDrops(prev => [...prev.slice(-4), { id, name: state.lastDrop!.ore.name, rarity: state.lastDrop!.ore.rarity, qty: state.lastDrop!.quantity }]);
      setTimeout(() => setDrops(prev => prev.filter(d => d.id !== id)), 2000);
    }
  }, [state.lastDrop]);

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-6 p-8">
      <h2 className="font-mono-game text-xs tracking-[0.2em] uppercase text-muted-foreground">
        Extraction Point 01
      </h2>

      <div className="relative">
        <motion.button
          onPointerDown={() => setIsMining(true)}
          onPointerUp={() => setIsMining(false)}
          onPointerLeave={() => setIsMining(false)}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.02 }}
          className="relative h-48 w-48 rounded-full border border-border flex items-center justify-center cursor-pointer select-none focus:outline-none"
        >
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="2" />
            <circle
              cx="100" cy="100" r={radius} fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="3"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-75"
            />
          </svg>

          <div className="absolute inset-4 rounded-full bg-card/80 flex items-center justify-center">
            <span className="font-mono-game text-lg font-bold text-foreground tracking-wider">
              {isMining ? `${Math.floor(progress)}%` : 'EXTRACT'}
            </span>
          </div>

          {isMining && (
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
                +{drop.qty} {drop.name}
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
          SPEED: <span className="text-primary">{miningSpeed.toFixed(2)}x</span>
        </p>
      </div>

      <p className="text-xs text-muted-foreground/60 max-w-xs text-center">
        Hold the button to mine. Upgrade your drill for faster extraction and rarer drops.
      </p>
    </div>
  );
}

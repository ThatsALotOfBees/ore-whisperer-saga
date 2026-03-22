import { useGame } from '@/hooks/useGameState';
import { motion } from 'framer-motion';

export function RebirthPanel() {
  const { state, dispatch } = useGame();

  const hasLab = state.unlockedMachines.includes('quantum_lab');
  const currencyReq = 30_000_000;
  const veiniteReq = 30;

  const currentCurrency = state.currency;
  const currentVeinite = state.ingots['veinite'] || 0;

  const canRebirth = hasLab && currentCurrency >= currencyReq && currentVeinite >= veiniteReq;

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto mt-8">
      <div className="text-center space-y-2 border-b border-border pb-6">
        <h2 className="font-mono-game text-xl tracking-[0.3em] text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
          THE CYCLE
        </h2>
        <p className="font-mono-game text-[11px] text-muted-foreground max-w-lg mx-auto leading-relaxed">
          Shatter your current reality to reconstruct a new timeline.
          You will lose all currency, inventory, recipes, machines, and upgrades.
          Your Total Mined and Achievements will persist.
        </p>
      </div>

      <div className="bg-card border border-border p-6 rounded-sm space-y-6">
        <h3 className="font-mono-game text-xs tracking-wider uppercase text-foreground">Rebirth Requirements</h3>
        
        <div className="space-y-3 font-mono-game text-[10px]">
          <div className="flex justify-between items-center bg-background/50 p-3 border border-border">
            <span className="text-muted-foreground">Quantum Lab Constructed</span>
            <span className={hasLab ? 'text-green-400' : 'text-red-400'}>{hasLab ? 'MET' : 'MISSING'}</span>
          </div>

          <div className="flex justify-between items-center bg-background/50 p-3 border border-border">
            <span className="text-muted-foreground">Currency: {currentCurrency.toLocaleString()} / {currencyReq.toLocaleString()} ¤</span>
            <span className={currentCurrency >= currencyReq ? 'text-green-400' : 'text-red-400'}>
              {currentCurrency >= currencyReq ? 'MET' : 'MISSING'}
            </span>
          </div>

          <div className="flex justify-between items-center bg-background/50 p-3 border border-border">
            <span className="text-muted-foreground">Veinite Ingots: {currentVeinite} / {veiniteReq}</span>
            <span className={currentVeinite >= veiniteReq ? 'text-green-400' : 'text-red-400'}>
              {currentVeinite >= veiniteReq ? 'MET' : 'MISSING'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-cyan-950/20 border border-cyan-500/30 p-6 rounded-sm text-center space-y-4">
        <h3 className="font-mono-game text-xs tracking-wider uppercase text-cyan-400">Rebirth Reward</h3>
        <p className="font-mono-game text-[10px] text-cyan-200/70">
          In the next cycle, you will awaken with <span className="text-cyan-400">{(state.rebirthCount + 2)} Extraction Points</span>. 
          Multiple mining points operate concurrently and have individual upgrade paths.
        </p>

        <motion.button
          whileHover={{ scale: canRebirth ? 1.02 : 1 }}
          whileTap={{ scale: canRebirth ? 0.98 : 1 }}
          disabled={!canRebirth}
          onClick={() => {
            if (confirm("WARNING: This will obliterate your current timeline. Proceed?")) {
              dispatch({ type: 'PERFORM_REBIRTH' });
            }
          }}
          className={`w-full py-4 mt-4 font-mono-game text-sm tracking-widest uppercase transition-all ${
            canRebirth 
              ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-50 hover:bg-cyan-500/30 cursor-pointer shadow-[0_0_15px_rgba(34,211,238,0.2)]'
              : 'bg-muted/10 border border-muted text-muted-foreground cursor-not-allowed opacity-50'
          }`}
        >
          Initiate Rebirth Sequence
        </motion.button>
      </div>

      {state.rebirthCount > 0 && (
        <p className="text-center font-mono-game text-[10px] text-muted-foreground tracking-widest">
          CYCLES COMPLETED: <span className="text-cyan-400">{state.rebirthCount}</span>
        </p>
      )}
    </div>
  );
}

import { useGame } from '@/hooks/useGameState';
import { motion, AnimatePresence } from 'framer-motion';

export function SaveIndicator() {
  const { saveStatus } = useGame();

  return (
    <AnimatePresence>
      {saveStatus !== 'idle' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-4 right-4 z-50"
        >
          <div className={`font-mono-game text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-sm border backdrop-blur-sm flex items-center gap-2 ${
            saveStatus === 'saving'
              ? 'border-accent/40 text-accent bg-accent/10'
              : saveStatus === 'saved'
              ? 'border-primary/40 text-primary bg-primary/10'
              : 'border-destructive/40 text-destructive bg-destructive/10'
          }`}>
            {saveStatus === 'saving' && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full"
              />
            )}
            {saveStatus === 'saved' && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              >
                ✓
              </motion.span>
            )}
            {saveStatus === 'error' && <span>✕</span>}
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Save failed'}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import { useGame } from '@/hooks/useGameState';
import { ACHIEVEMENTS } from '@/data/achievements';
import { motion } from 'framer-motion';

export function AchievementsPanel() {
  const { state } = useGame();

  const unlockedCount = state.unlockedAchievements.length;
  const totalCount = ACHIEVEMENTS.length;

  return (
    <div className="p-4 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-end justify-between border-b border-border pb-4">
        <div className="space-y-1">
          <h2 className="font-mono-game text-sm tracking-[0.2em] uppercase text-primary">Achievements</h2>
          <p className="font-mono-game text-[10px] text-muted-foreground">Milestones in the Void</p>
        </div>
        <div className="font-mono-game text-xs text-accent">
          {unlockedCount} / {totalCount}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ACHIEVEMENTS.map(ach => {
          const isUnlocked = state.unlockedAchievements.includes(ach.id);

          return (
            <motion.div
              key={ach.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 border rounded-sm flex items-start gap-4 transition-colors ${
                isUnlocked 
                  ? 'border-accent bg-accent/5' 
                  : 'border-border bg-card/50 opacity-60'
              }`}
            >
              <div className="text-3xl filter grayscale-0">
                {isUnlocked ? ach.icon : '❓'}
              </div>
              <div className="space-y-1">
                <h3 className={`font-mono-game text-xs uppercase ${isUnlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {ach.name}
                </h3>
                <p className="font-mono-game text-[10px] text-muted-foreground leading-relaxed">
                  {ach.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

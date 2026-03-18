import { useState, useEffect } from 'react';
import { GameProvider, useGame } from '@/hooks/useGameState';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { MiningStation } from '@/components/game/MiningStation';
import { Inventory } from '@/components/game/Inventory';
import { Foundry } from '@/components/game/Foundry';
import { CraftingStation } from '@/components/game/CraftingStation';
import { UpgradeShop } from '@/components/game/UpgradeShop';
import { ChatRoom } from '@/components/game/ChatRoom';
// Donations removed - dependent on Supabase tables not yet configured
import { AuthScreen } from '@/components/game/AuthScreen';
import { supabase } from '@/integrations/supabase/client';

type Tab = 'mine' | 'inventory' | 'foundry' | 'craft' | 'upgrades' | 'chat';

const TABS: { key: Tab; label: string }[] = [
  { key: 'mine', label: 'Mine' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'foundry', label: 'Foundry' },
  { key: 'craft', label: 'Craft' },
  { key: 'upgrades', label: 'Upgrades' },
  { key: 'chat', label: 'Chat' },
];

function GameStateSyncer() {
  const { state } = useGame();
  const { user } = useAuth();

  // Sync game state to DB periodically
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      const { lastDrop, smeltingJobs, ...saveable } = state;
      await supabase.from('profiles').update({
        game_state: saveable as any,
        total_mined: state.totalMined,
        currency: state.currency,
      }).eq('user_id', user.id);
    }, 10000);
    return () => clearInterval(interval);
  }, [user, state]);

  return null;
}

function GameContent() {
  const [tab, setTab] = useState<Tab>('mine');
  const { user, profile, signOut, loading, isGuest } = useAuth();

  if (loading && !isGuest) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-mono-game text-xs text-muted-foreground animate-pulse">INITIALIZING TERMINAL...</p>
      </div>
    );
  }

  if (!user && !isGuest) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-mono-game text-sm font-bold tracking-[0.15em] uppercase text-primary">
            VOID<span className="text-accent">—</span>MARKET
          </h1>
          <span className="font-mono-game text-[9px] text-muted-foreground tracking-wider">v0.2</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono-game text-[10px] text-accent">{profile?.username}</span>
          <button
            onClick={signOut}
            className="font-mono-game text-[9px] text-muted-foreground hover:text-destructive transition-colors uppercase"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Nav */}
      <nav className="border-b border-border flex overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`font-mono-game text-[11px] uppercase tracking-[0.15em] px-4 py-2.5 border-b-2 transition-colors whitespace-nowrap ${
              tab === t.key
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full">
        {tab === 'mine' && <MiningStation />}
        {tab === 'inventory' && <Inventory />}
        {tab === 'foundry' && <Foundry />}
        {tab === 'craft' && <CraftingStation />}
        {tab === 'upgrades' && <UpgradeShop />}
        {tab === 'chat' && <ChatRoom />}
      </main>

      <GameStateSyncer />

      {/* Footer */}
      <footer className="border-t border-border px-4 py-2 text-center">
        <p className="font-mono-game text-[9px] text-muted-foreground/40 tracking-wider uppercase">
          Market Stabilized. Proceed with Extraction.
        </p>
      </footer>
    </div>
  );
}

export default function Index() {
  return (
    <AuthProvider>
      <GameProvider>
        <GameContent />
      </GameProvider>
    </AuthProvider>
  );
}

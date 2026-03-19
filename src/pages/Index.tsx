import { useState, useEffect } from 'react';
import { GameProvider, useGame } from '@/hooks/useGameState';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { MiningStation } from '@/components/game/MiningStation';
import { Inventory } from '@/components/game/Inventory';
import { Foundry } from '@/components/game/Foundry';
import { CraftingStation } from '@/components/game/CraftingStation';
import { UpgradeShop } from '@/components/game/UpgradeShop';
import { ChatRoom } from '@/components/game/ChatRoom';
import { MachinesPanel } from '@/components/game/MachinesPanel';
import { Marketplace } from '@/components/game/Marketplace';
import { AuthScreen } from '@/components/game/AuthScreen';
import { DiscordButton } from '@/components/game/DiscordButton';
import { supabase } from '@/integrations/supabase/client';

type Tab = 'mine' | 'inventory' | 'foundry' | 'craft' | 'machines' | 'market' | 'upgrades' | 'chat';

// GameStateSyncer removed — saving is now handled inside GameProvider

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
    <GameProvider>
      <GameContentInner tab={tab} setTab={setTab} />
    </GameProvider>
  );
}

function GameContentInner({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const { user, profile, signOut, isGuest } = useAuth();
  const { state } = useGame();

  const hasMachines = state.unlockedMachines.length > 0;

  const TABS: { key: Tab; label: string; hidden?: boolean }[] = [
    { key: 'mine', label: 'Mine' },
    { key: 'inventory', label: 'Inventory' },
    { key: 'foundry', label: 'Foundry' },
    { key: 'craft', label: 'Craft' },
    { key: 'machines', label: 'Machines', hidden: !hasMachines },
    { key: 'market', label: 'Market' },
    { key: 'upgrades', label: 'Upgrades' },
    { key: 'chat', label: 'Chat' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-mono-game text-sm font-bold tracking-[0.15em] uppercase text-primary">
            VOID<span className="text-accent">—</span>MARKET
          </h1>
          <span className="font-mono-game text-[9px] text-muted-foreground tracking-wider">v0.3</span>
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

      <nav className="border-b border-border flex overflow-x-auto">
        {TABS.filter(t => !t.hidden).map(t => (
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

      <main className="flex-1 max-w-3xl mx-auto w-full">
        {tab === 'mine' && <MiningStation />}
        {tab === 'inventory' && <Inventory />}
        {tab === 'foundry' && <Foundry />}
        {tab === 'craft' && <CraftingStation />}
        {tab === 'machines' && <MachinesPanel />}
        {tab === 'market' && <Marketplace />}
        {tab === 'upgrades' && <UpgradeShop />}
        {tab === 'chat' && <ChatRoom />}
      </main>

      
      <DiscordButton />

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
      <GameContent />
    </AuthProvider>
  );
}

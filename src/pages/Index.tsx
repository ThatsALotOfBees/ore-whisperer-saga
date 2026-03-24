import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { GardenPanel } from '@/components/game/GardenPanel';
import { TransmutationPanel } from '@/components/game/TransmutationPanel';
import { AchievementsPanel } from '@/components/game/AchievementsPanel';
import { RebirthPanel } from '@/components/game/RebirthPanel';
import { AuthScreen } from '@/components/game/AuthScreen';
import { DiscordButton } from '@/components/game/DiscordButton';
import { SaveIndicator } from '@/components/game/SaveIndicator';
import { TabBackground } from '@/components/game/TabBackground';
import { SettingsPanel } from '@/components/game/SettingsPanel';
import LightPillar from '@/components/ui/LightPillar';

type Tab = 'mine' | 'inventory' | 'foundry' | 'craft' | 'machines' | 'garden' | 'transmute' | 'market' | 'upgrades' | 'chat' | 'achievements' | 'rebirth' | 'settings';

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

const CURRENT_VERSION = 'v0.691';

function UpdateNotification({ onAcknowledge }: { onAcknowledge: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
    >
      <div className="max-w-md w-full bg-card border border-accent p-6 space-y-4 shadow-2xl">
        <div className="space-y-1">
          <h2 className="font-mono-game text-sm text-accent tracking-widest uppercase">Major Update: Blood Arsenal</h2>
          <p className="font-mono-game text-[10px] text-muted-foreground">{CURRENT_VERSION}</p>
        </div>
        
        <div className="space-y-3 font-mono-game text-[11px] leading-relaxed text-foreground">
          <p>The ore remembers. Give it blood, and it will remember more. The <span className="text-pink-400">🩸 Blood Arsenal Update</span> introduces ore transmutation and corruption mechanics.</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>New Machine: <span className="text-pink-300">Sanguinite Transmutation Table</span></li>
            <li>Ore Mutations: 10 new modifiers across Positive, Corrupted, and Sanguine types</li>
            <li>Risk vs Reward: Boost outcomes with Veinite, influence rarity with Biomass</li>
            <li>Sell and trade potent end-game ingots with high value multipliers</li>
          </ul>
        </div>

        <button
          onClick={onAcknowledge}
          className="w-full font-mono-game text-xs uppercase py-3 border border-accent text-accent hover:bg-accent/10 transition-colors"
        >
          Acknowledge & Sync
        </button>
      </div>
    </motion.div>
  );
}

function GameContentInner({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const { user, profile, signOut, isGuest } = useAuth();
  const { state, dispatch } = useGame();

  const hasMachines = state.unlockedMachines.length > 0;
  const hasGarden = state.greenhouses.length > 0;
  const hasTransmuter = state.unlockedMachines.includes('sanguinite_transmutation_table');
  const hasRebirth = state.rebirthCount > 0 || state.unlockedMachines.includes('quantum_lab');

  const showUpdate = state.lastViewedVersion !== CURRENT_VERSION;

  const handleAcknowledge = () => {
    dispatch({ type: 'ACKNOWLEDGE_UPDATE', version: CURRENT_VERSION });
  };

  const TABS: { key: Tab; label: string; hidden?: boolean }[] = [
    { key: 'mine', label: 'Mine' },
    { key: 'inventory', label: 'Inventory' },
    { key: 'foundry', label: 'Foundry' },
    { key: 'craft', label: 'Craft' },
    { key: 'machines', label: 'Machines', hidden: !hasMachines },
    { key: 'garden', label: 'Garden', hidden: !hasGarden },
    { key: 'transmute', label: '🩸 Transmute', hidden: !hasTransmuter },
    { key: 'market', label: 'Market' },
    { key: 'upgrades', label: 'Upgrades' },
    { key: 'achievements', label: 'Trophies' },
    { key: 'rebirth', label: '🌌 Rebirth', hidden: !hasRebirth },
    { key: 'chat', label: 'Chat' },
    { key: 'settings', label: '⚙ Settings' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <AnimatePresence>
      </AnimatePresence>
      
      {/* Base Background Layer */}
      <div className="fixed inset-0 z-[-2] bg-background"></div>
      
      {/* Global Background Effect */}
      {state.settings?.showBackground !== false && (
        <div className="fixed inset-0 z-[-1] pointer-events-none opacity-50 overflow-hidden">
          <LightPillar
            topColor="#5227FF"
            bottomColor="#FF9FFC"
            intensity={0.6}
            rotationSpeed={0.2}
            glowAmount={0.002}
            pillarWidth={4}
            pillarHeight={0.3}
            noiseIntensity={0.3}
            pillarRotation={20}
            interactive={false}
            mixBlendMode="screen"
            quality="high"
          />
        </div>
      )}

      <header className="border-b border-border/20 px-2 sm:px-4 py-3 flex items-center justify-between sticky top-0 bg-background/40 backdrop-blur-sm z-50">
        <div className="flex items-center gap-2 sm:gap-3">
          <h1 className="font-mono-game text-[12px] sm:text-sm font-bold tracking-[0.15em] uppercase text-primary whitespace-nowrap">
            VOID<span className="text-accent">—</span>MARKET
          </h1>
          <span className="font-mono-game text-[8px] sm:text-[9px] text-muted-foreground tracking-wider">{CURRENT_VERSION}</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="font-mono-game text-[9px] sm:text-[10px] text-accent truncate max-w-[80px] sm:max-w-none">{profile?.username}</span>
          <button
            onClick={signOut}
            className="font-mono-game text-[8px] sm:text-[9px] text-muted-foreground hover:text-destructive transition-colors uppercase shrink-0"
          >
            Logout
          </button>
        </div>
      </header>

      <nav className="border-b border-border/20 flex overflow-x-auto scrollbar-hide sticky top-[57px] bg-background/40 backdrop-blur-sm z-40">
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

      <main className="flex-1 max-w-4xl mx-auto w-full p-2 sm:p-4 pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full h-full"
          >
            <TabBackground>
              {tab === 'mine' && <MiningStation />}
              {tab === 'inventory' && <Inventory />}
              {tab === 'foundry' && <Foundry />}
              {tab === 'craft' && <CraftingStation />}
              {tab === 'machines' && <MachinesPanel />}
              {tab === 'garden' && <GardenPanel />}
              {tab === 'transmute' && <TransmutationPanel />}
              {tab === 'market' && <Marketplace />}
              {tab === 'upgrades' && <UpgradeShop />}
              {tab === 'achievements' && <AchievementsPanel />}
              {tab === 'rebirth' && <RebirthPanel />}
              {tab === 'chat' && <ChatRoom />}
              {tab === 'settings' && <SettingsPanel />}
            </TabBackground>
          </motion.div>
        </AnimatePresence>
      </main>

      <SaveIndicator />
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

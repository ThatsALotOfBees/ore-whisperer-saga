import { useState } from 'react';
import { GameProvider } from '@/hooks/useGameState';
import { MiningStation } from '@/components/game/MiningStation';
import { Inventory } from '@/components/game/Inventory';
import { Foundry } from '@/components/game/Foundry';
import { CraftingStation } from '@/components/game/CraftingStation';
import { UpgradeShop } from '@/components/game/UpgradeShop';

type Tab = 'mine' | 'inventory' | 'foundry' | 'craft' | 'upgrades';

const TABS: { key: Tab; label: string }[] = [
  { key: 'mine', label: 'Mine' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'foundry', label: 'Foundry' },
  { key: 'craft', label: 'Craft' },
  { key: 'upgrades', label: 'Upgrades' },
];

function GameContent() {
  const [tab, setTab] = useState<Tab>('mine');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-mono-game text-sm font-bold tracking-[0.15em] uppercase text-primary">
            VOID<span className="text-accent">—</span>MARKET
          </h1>
          <span className="font-mono-game text-[9px] text-muted-foreground tracking-wider">v0.1</span>
        </div>
        <span className="font-mono-game text-[10px] text-muted-foreground/50">
          MIDNIGHT TERMINAL
        </span>
      </header>

      {/* Nav */}
      <nav className="border-b border-border flex">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`font-mono-game text-[11px] uppercase tracking-[0.15em] px-5 py-2.5 border-b-2 transition-colors ${
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
      </main>

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
    <GameProvider>
      <GameContent />
    </GameProvider>
  );
}

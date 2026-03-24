import { useGame } from '@/hooks/useGameState';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { Menu, Pin, PinOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SidebarNavProps {
  currentTab: string;
  setTab: (tab: any) => void;
  tabs: { key: string; label: string; hidden?: boolean }[];
}

export const SidebarNav = ({ currentTab, setTab, tabs }: SidebarNavProps) => {
  const { state, dispatch } = useGame();
  const pinnedTabs = state.pinnedTabs || [];

  const togglePin = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    dispatch({ type: 'TOGGLE_PIN_TAB', tabId });
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary transition-colors">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] bg-background/95 backdrop-blur-xl border-r-white/10 p-0 text-foreground">
        <SheetHeader className="p-6 border-b border-white/5 bg-black/20">
          <SheetTitle className="font-mono-game text-xs uppercase tracking-[0.3em] text-primary text-left">Navigation Hub</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-80px)] py-4">
          <div className="px-3 space-y-1">
            {tabs.filter(t => !t.hidden).map(t => {
              const isPinned = pinnedTabs.includes(t.key);
              const isActive = currentTab === t.key;
              
              return (
                <div 
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`group flex items-center justify-between px-4 py-3 rounded-md cursor-pointer transition-all duration-200 ${
                    isActive
                      ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.05)]' 
                      : 'hover:bg-white/5 text-muted-foreground hover:text-foreground border border-transparent'
                  }`}
                >
                  <span className="font-mono-game text-[10px] uppercase tracking-[0.15em]">{t.label}</span>
                  <button
                    onClick={(e) => togglePin(e, t.key)}
                    className={`p-1.5 rounded transition-all transform active:scale-90 ${
                      isPinned 
                        ? 'text-accent opacity-100' 
                        : 'opacity-0 group-hover:opacity-30 hover:opacity-100 text-muted-foreground hover:text-accent'
                    }`}
                    title={isPinned ? "Unpin from main bar" : "Pin to main bar"}
                  >
                    {isPinned ? <Pin className="w-3.5 h-3.5 fill-current" /> : <PinOff className="w-3.5 h-3.5" />}
                  </button>
                </div>
              );
            })}
          </div>
          
          <div className="p-6 mt-8 opacity-20 pointer-events-none">
             <div className="h-px bg-white/10 mb-4" />
             <p className="font-mono-game text-[8px] uppercase tracking-widest leading-loose">
               Void Operating System<br/>
               Kernel 6.9.1-LTS<br/>
               Status: Operational
             </p>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

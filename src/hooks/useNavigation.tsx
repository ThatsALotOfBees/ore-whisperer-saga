import { createContext, useContext, useState, ReactNode } from 'react';

type Tab = 'mine' | 'inventory' | 'foundry' | 'craft' | 'machines' | 'garden' | 'transmute' | 'refinery' | 'market' | 'upgrades' | 'chat' | 'achievements' | 'rebirth' | 'plot';

interface NavigationContextType {
  navigateToTab: (tab: Tab, selectedItem?: string, fromItem?: string) => void;
  goBack: () => void;
  clearHistory: () => void;
  canGoBack: boolean;
  currentTab: Tab | null;
  selectedItem: string | null;
  clearSelectedItem: () => void;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [currentTab, setCurrentTab] = useState<Tab | null>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<{ tab: Tab, selectedItem: string | null }>>([]);

  const navigateToTab = (tab: Tab, newSelectedItem?: string, fromItem?: string) => {
    setHistory(prev => {
      // If we are given a clear instruction of what item we are leaving, use it!
      const finalPrevItem = fromItem !== undefined ? fromItem : null;
      
      // If we have a current tab, push it. If we don't (e.g., initial state), use the destination tab
      const tabToPush = currentTab || tab;
      return [...prev, { tab: tabToPush, selectedItem: finalPrevItem }];
    });
    setCurrentTab(tab);
    setSelectedItem(newSelectedItem || null);
  };

  const goBack = () => {
    setHistory(prev => {
      if (prev.length === 0) return prev;
      const newHistory = [...prev];
      const previousState = newHistory.pop()!;
      setCurrentTab(previousState.tab);
      setSelectedItem(previousState.selectedItem);
      return newHistory;
    });
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const clearSelectedItem = () => {
    setSelectedItem(null);
  };

  const canGoBack = history.length > 0;

  return (
    <NavigationContext.Provider value={{ navigateToTab, goBack, clearHistory, canGoBack, currentTab, selectedItem, clearSelectedItem }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigation must be inside NavigationProvider');
  return ctx;
}

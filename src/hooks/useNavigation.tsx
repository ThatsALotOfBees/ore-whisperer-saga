import { createContext, useContext, useState, ReactNode } from 'react';

type Tab = 'mine' | 'inventory' | 'foundry' | 'craft' | 'machines' | 'garden' | 'transmute' | 'refinery' | 'market' | 'upgrades' | 'chat' | 'achievements' | 'rebirth';

interface NavigationContextType {
  navigateToTab: (tab: Tab, selectedItem?: string) => void;
  currentTab: Tab | null;
  selectedItem: string | null;
  clearSelectedItem: () => void;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [currentTab, setCurrentTab] = useState<Tab | null>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const navigateToTab = (tab: Tab, selectedItem?: string) => {
    setCurrentTab(tab);
    setSelectedItem(selectedItem || null);
  };

  const clearSelectedItem = () => {
    setSelectedItem(null);
  };

  return (
    <NavigationContext.Provider value={{ navigateToTab, currentTab, selectedItem, clearSelectedItem }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigation must be inside NavigationProvider');
  return ctx;
}

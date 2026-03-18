// Clan donations hook - stub (clan_requests/donations tables not yet created)
// This is a placeholder that returns empty data to prevent build errors.

import { useState, useCallback } from 'react';
import { useGame } from '@/hooks/useGameState';
import { ORE_MAP } from '@/data/ores';

export function useClanDonations() {
  const { state } = useGame();
  const [requests] = useState<any[]>([]);
  const [perks] = useState<any[]>([]);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  const createRequest = useCallback(async () => {}, []);
  const donate = useCallback(async () => {}, []);

  const isItemDiscovered = useCallback(
    (itemId: string): boolean => {
      if (ORE_MAP[itemId]) {
        return state.ores[itemId] !== undefined || state.refinedOres[itemId] !== undefined;
      }
      return state.items[itemId] !== undefined;
    },
    [state]
  );

  return {
    requests,
    perks,
    loading,
    error,
    createRequest,
    donate,
    isItemDiscovered,
    refetch: async () => {},
  };
}

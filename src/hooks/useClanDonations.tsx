import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { ClanRequest, ClanDonation, ClanPerk } from '@/types/clan';
import { useGame } from '@/hooks/useGameState';
import { ORE_MAP } from '@/data/ores';
import { RECIPE_MAP } from '@/data/recipes';

export function useClanDonations() {
  const { user, profile } = useAuth();
  const { state } = useGame();
  const [requests, setRequests] = useState<ClanRequest[]>([]);
  const [perks, setPerks] = useState<ClanPerk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clanId = profile?.clan_id;

  useEffect(() => {
    if (!clanId || !user) {
      setRequests([]);
      setPerks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const subscription = supabase
      .from('clan_requests')
      .on('*', (payload) => {
        if (payload.new?.clan_id === clanId) {
          if (payload.eventType === 'DELETE') {
            setRequests((prev) => prev.filter((r) => r.id !== payload.old.id));
          } else {
            setRequests((prev) => {
              const idx = prev.findIndex((r) => r.id === payload.new.id);
              if (idx >= 0) {
                const newRequests = [...prev];
                newRequests[idx] = payload.new;
                return newRequests;
              }
              return [...prev, payload.new];
            });
          }
        }
      })
      .subscribe();

    const perkSubscription = supabase
      .from('clan_perks')
      .on('*', (payload) => {
        if (payload.new?.clan_id === clanId) {
          setPerks((prev) => {
            const idx = prev.findIndex((p) => p.id === payload.new.id);
            if (idx >= 0) {
              const newPerks = [...prev];
              newPerks[idx] = payload.new;
              return newPerks;
            }
            return [...prev, payload.new];
          });
        }
      })
      .subscribe();

    loadRequests();
    loadPerks();

    return () => {
      subscription.unsubscribe();
      perkSubscription.unsubscribe();
    };
  }, [clanId, user]);

  const loadRequests = useCallback(async () => {
    if (!clanId) return;
    try {
      const { data, error: err } = await supabase
        .from('clan_requests')
        .select('*')
        .eq('clan_id', clanId)
        .eq('completed_at', null)
        .order('created_at', { ascending: false });

      if (err) throw err;
      setRequests(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, [clanId]);

  const loadPerks = useCallback(async () => {
    if (!clanId) return;
    try {
      const { data, error: err } = await supabase
        .from('clan_perks')
        .select('*')
        .eq('clan_id', clanId);

      if (err) throw err;
      setPerks(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load perks');
    }
  }, [clanId]);

  const createRequest = useCallback(
    async (itemId: string, itemType: string, quantity: number, rarity: string) => {
      if (!clanId || !user) return;
      try {
        const { error: err } = await supabase.from('clan_requests').insert({
          clan_id: clanId,
          requester_id: user.id,
          item_id: itemId,
          item_type: itemType,
          quantity_needed: quantity,
          quantity_fulfilled: 0,
          rarity,
          created_at: new Date().toISOString(),
          next_request_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        });

        if (err) throw err;
        await loadRequests();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create request');
      }
    },
    [clanId, user, loadRequests]
  );

  const donate = useCallback(
    async (requestId: string, quantity: number) => {
      if (!user) return;
      try {
        const request = requests.find((r) => r.id === requestId);
        if (!request) throw new Error('Request not found');

        const { error: err } = await supabase.from('clan_donations').insert({
          request_id: requestId,
          donor_id: user.id,
          quantity_donated: quantity,
          reward_amount: Math.floor(quantity * 10),
          created_at: new Date().toISOString(),
        });

        if (err) throw err;

        const newFulfilled = Math.min(
          request.quantity_fulfilled + quantity,
          request.quantity_needed
        );

        if (newFulfilled >= request.quantity_needed) {
          await supabase
            .from('clan_requests')
            .update({ completed_at: new Date().toISOString() })
            .eq('id', requestId);
        } else {
          await supabase
            .from('clan_requests')
            .update({ quantity_fulfilled: newFulfilled })
            .eq('id', requestId);
        }

        await loadRequests();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to donate');
      }
    },
    [user, requests, loadRequests]
  );

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
    refetch: loadRequests,
  };
}

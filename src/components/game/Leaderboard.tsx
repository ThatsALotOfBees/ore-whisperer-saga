import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface LeaderboardEntry {
  username: string;
  total_mined: number;
  currency: number;
  clan_tag?: string;
}

type SortBy = 'mined' | 'currency';

export function Leaderboard() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [sortBy, setSortBy] = useState<SortBy>('mined');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const orderCol = sortBy === 'mined' ? 'total_mined' : 'currency';
      const { data } = await supabase
        .from('profiles')
        .select('username, total_mined, currency, clan_id')
        .order(orderCol, { ascending: false })
        .limit(50);

      if (data) {
        // Fetch clan tags for players in clans
        const clanIds = [...new Set(data.filter(d => d.clan_id).map(d => d.clan_id!))];
        let clanMap: Record<string, string> = {};
        if (clanIds.length > 0) {
          const { data: clans } = await supabase
            .from('clans')
            .select('id, tag')
            .in('id', clanIds);
          clans?.forEach(c => { clanMap[c.id] = c.tag; });
        }

        setEntries(data.map(d => ({
          username: d.username,
          total_mined: d.total_mined || 0,
          currency: d.currency || 0,
          clan_tag: d.clan_id ? clanMap[d.clan_id] : undefined,
        })));
      }
      setLoading(false);
    };
    load();
  }, [sortBy]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-mono-game text-[10px] uppercase tracking-wider text-muted-foreground">Leaderboard</p>
        <div className="flex gap-1">
          <button
            onClick={() => setSortBy('mined')}
            className={`font-mono-game text-[9px] uppercase px-2 py-0.5 border transition-colors ${
              sortBy === 'mined' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
            }`}
          >
            Mined
          </button>
          <button
            onClick={() => setSortBy('currency')}
            className={`font-mono-game text-[9px] uppercase px-2 py-0.5 border transition-colors ${
              sortBy === 'currency' ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted-foreground'
            }`}
          >
            Wealth
          </button>
        </div>
      </div>

      {loading && (
        <p className="font-mono-game text-[10px] text-muted-foreground/50 text-center py-4 animate-pulse">Loading...</p>
      )}

      <div className="space-y-0.5 max-h-[30vh] overflow-y-auto custom-scrollbar">
        {entries.map((entry, i) => {
          const isTop3 = i < 3;
          const rankColors = ['text-accent', 'text-muted-foreground', 'text-rarity-epic'];

          return (
            <div
              key={entry.username}
              className={`flex items-center justify-between px-2 py-1.5 rounded-sm ${
                isTop3 ? 'bg-card border border-border' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`font-mono-game text-[10px] w-5 text-right ${isTop3 ? rankColors[i] : 'text-muted-foreground/50'}`}>
                  {i + 1}.
                </span>
                {entry.clan_tag && (
                  <span className="font-mono-game text-[9px] text-accent">[{entry.clan_tag}]</span>
                )}
                <span className={`font-mono-game text-[10px] ${isTop3 ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {entry.username}
                </span>
              </div>
              <span className={`font-mono-game text-[10px] ${sortBy === 'mined' ? 'text-primary' : 'text-accent'}`}>
                {sortBy === 'mined'
                  ? `${entry.total_mined.toLocaleString()} mined`
                  : `${entry.currency.toLocaleString()} ¤`
                }
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

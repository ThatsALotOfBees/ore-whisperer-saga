import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { DonationPanel } from '@/components/game/DonationPanel';

type TabType = 'clans' | 'donations';

interface Clan {
  id: string;
  name: string;
  tag: string;
  description: string | null;
  owner_id: string;
  max_members: number | null;
  created_at: string;
  member_count?: number;
}

export function ClansPanel() {
  const { user, profile, refreshProfile } = useAuth();
  const [tab, setTab] = useState<TabType>('clans');
  const [clans, setClans] = useState<Clan[]>([]);
  const [members, setMembers] = useState<{ username: string; display_name: string | null; total_mined: number | null }[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [desc, setDesc] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadClans = async () => {
    const { data } = await supabase.from('clans').select('*').order('created_at', { ascending: false });
    if (data) {
      // Get member counts
      const withCounts = await Promise.all(data.map(async (clan) => {
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('clan_id', clan.id);
        return { ...clan, member_count: count || 0 };
      }));
      setClans(withCounts);
    }
  };

  const loadMembers = async (clanId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('username, display_name, total_mined')
      .eq('clan_id', clanId)
      .order('total_mined', { ascending: false });
    setMembers(data || []);
  };

  useEffect(() => {
    loadClans();
  }, []);

  useEffect(() => {
    if (profile?.clan_id) loadMembers(profile.clan_id);
  }, [profile?.clan_id]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');
    setLoading(true);

    const { data, error: err } = await supabase.from('clans').insert({
      name: name.trim(),
      tag: tag.trim().toUpperCase(),
      description: desc.trim() || null,
      owner_id: user.id,
    }).select().single();

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    // Join the clan
    await supabase.from('profiles').update({ clan_id: data.id }).eq('user_id', user.id);
    await refreshProfile();
    setShowCreate(false);
    setName('');
    setTag('');
    setDesc('');
    setLoading(false);
    loadClans();
  };

  const handleJoin = async (clanId: string) => {
    if (!user) return;
    await supabase.from('profiles').update({ clan_id: clanId }).eq('user_id', user.id);
    await refreshProfile();
    loadClans();
    loadMembers(clanId);
  };

  const handleLeave = async () => {
    if (!user) return;
    await supabase.from('profiles').update({ clan_id: null }).eq('user_id', user.id);
    await refreshProfile();
    setMembers([]);
    loadClans();
  };

  const myClan = clans.find(c => c.id === profile?.clan_id);

  const tabs: { key: TabType; label: string }[] = [
    { key: 'clans', label: 'Clans' },
    ...(profile?.clan_id ? [{ key: 'donations', label: 'Donations' }] : []),
  ];

  return (
    <div>
      {tab === 'donations' ? (
        <DonationPanel />
      ) : (
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-mono-game text-xs tracking-[0.2em] uppercase text-muted-foreground">Clans</h2>
            {!profile?.clan_id && user && (
              <button
                onClick={() => setShowCreate(!showCreate)}
                className="font-mono-game text-[10px] uppercase px-3 py-1 border border-accent text-accent hover:bg-accent/10 transition-colors"
              >
                {showCreate ? 'Cancel' : 'Create Clan'}
              </button>
            )}
          </div>

          {tabs.length > 1 && (
            <div className="flex gap-1">
              {tabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`font-mono-game text-[10px] uppercase tracking-wider px-3 py-1.5 border transition-colors ${
                    tab === t.key ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}

      {!user && (
        <p className="text-xs text-muted-foreground/50 text-center py-8">Login to join or create clans</p>
      )}

      {/* Create Form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="space-y-2 border border-accent/30 bg-accent/5 p-3 rounded-sm">
          <input
            type="text"
            placeholder="Clan Name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="w-full bg-card border border-border px-3 py-1.5 font-mono-game text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent"
          />
          <input
            type="text"
            placeholder="Tag (e.g. VOID)"
            value={tag}
            onChange={e => setTag(e.target.value.slice(0, 5))}
            required
            className="w-full bg-card border border-border px-3 py-1.5 font-mono-game text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent"
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={desc}
            onChange={e => setDesc(e.target.value)}
            className="w-full bg-card border border-border px-3 py-1.5 font-mono-game text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent"
          />
          {error && <p className="font-mono-game text-[10px] text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full font-mono-game text-[10px] uppercase py-1.5 border border-accent text-accent hover:bg-accent/10 disabled:opacity-30 transition-colors"
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
        </form>
      )}

      {/* My Clan */}
      {myClan && (
        <div className="border border-primary/30 bg-primary/5 p-3 rounded-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono-game text-xs text-primary font-bold">[{myClan.tag}]</span>
              <span className="font-mono-game text-xs text-foreground ml-2">{myClan.name}</span>
            </div>
            <button
              onClick={handleLeave}
              className="font-mono-game text-[10px] uppercase px-2 py-0.5 border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
            >
              Leave
            </button>
          </div>
          {myClan.description && <p className="text-[10px] text-muted-foreground">{myClan.description}</p>}

          <div className="space-y-1">
            <p className="font-mono-game text-[10px] uppercase tracking-wider text-muted-foreground">Members ({members.length})</p>
            {members.map((m, i) => (
              <div key={i} className="flex items-center justify-between px-2 py-1 border border-border bg-card rounded-sm">
                <span className="font-mono-game text-[10px] text-foreground">{m.username}</span>
                <span className="font-mono-game text-[9px] text-muted-foreground">{m.total_mined || 0} mined</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Clans */}
      <div className="space-y-1.5 max-h-[40vh] overflow-y-auto">
        {clans.filter(c => c.id !== profile?.clan_id).map(clan => (
          <div key={clan.id} className="flex items-center justify-between px-3 py-2 border border-border bg-card rounded-sm">
            <div>
              <span className="font-mono-game text-[10px] text-accent font-bold">[{clan.tag}]</span>
              <span className="font-mono-game text-xs text-foreground ml-1.5">{clan.name}</span>
              <span className="font-mono-game text-[9px] text-muted-foreground ml-2">{clan.member_count}/{clan.max_members || 20}</span>
            </div>
            {user && !profile?.clan_id && (
              <button
                onClick={() => handleJoin(clan.id)}
                className="font-mono-game text-[10px] uppercase px-2 py-0.5 border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
              >
                Join
              </button>
            )}
          </div>
        ))}
        {clans.length === 0 && (
          <p className="text-xs text-muted-foreground/50 text-center py-4">No clans yet. Create the first one!</p>
        )}
      </div>
    </div>
      )}
    </div>
  );
}

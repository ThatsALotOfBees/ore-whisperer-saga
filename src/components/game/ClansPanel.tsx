import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { DonationPanel } from '@/components/game/DonationPanel';
import { ChatRoom } from '@/components/game/ChatRoom';

type TabType = 'clans' | 'chat' | 'donations';

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
  const { user, profile, refreshProfile, isGuest } = useAuth();
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
    try {
      const { data, error: err } = await supabase.from('clans').select('*').order('created_at', { ascending: false });
      if (err) {
        console.warn('Failed to load clans:', err.message);
        return;
      }
      if (data) {
        const withCounts = await Promise.all(data.map(async (clan) => {
          const { count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('clan_id', clan.id);
          return { ...clan, member_count: count || 0 };
        }));
        setClans(withCounts);
      }
    } catch (e) {
      console.warn('Clan load error:', e);
    }
  };

  const loadMembers = async (clanId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('username, display_name, total_mined')
        .eq('clan_id', clanId)
        .order('total_mined', { ascending: false });
      setMembers(data || []);
    } catch (e) {
      console.warn('Member load error:', e);
    }
  };

  useEffect(() => {
    if (!isGuest) loadClans();
  }, [isGuest]);

  useEffect(() => {
    if (profile?.clan_id) loadMembers(profile.clan_id);
  }, [profile?.clan_id]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');
    setLoading(true);

    // Create the clan
    const { data, error: createErr } = await supabase.from('clans').insert({
      name: name.trim(),
      tag: tag.trim().toUpperCase(),
      description: desc.trim() || null,
      owner_id: user.id,
    }).select().single();

    if (createErr) {
      setError(createErr.message);
      setLoading(false);
      return;
    }

    // Auto-join: set clan_id on profile
    const { error: joinErr } = await supabase
      .from('profiles')
      .update({ clan_id: data.id })
      .eq('user_id', user.id);

    if (joinErr) {
      setError('Clan created but failed to join: ' + joinErr.message);
      setLoading(false);
      loadClans();
      return;
    }

    await refreshProfile();
    setShowCreate(false);
    setName('');
    setTag('');
    setDesc('');
    setLoading(false);
    loadClans();
    loadMembers(data.id);
  };

  const handleJoin = async (clanId: string) => {
    if (!user) return;
    setError('');

    const { error: joinErr } = await supabase
      .from('profiles')
      .update({ clan_id: clanId })
      .eq('user_id', user.id);

    if (joinErr) {
      setError('Failed to join clan: ' + joinErr.message);
      return;
    }

    await refreshProfile();
    loadClans();
    loadMembers(clanId);
  };

  const handleLeave = async () => {
    if (!user) return;
    setError('');

    const { error: leaveErr } = await supabase
      .from('profiles')
      .update({ clan_id: null })
      .eq('user_id', user.id);

    if (leaveErr) {
      setError('Failed to leave clan: ' + leaveErr.message);
      return;
    }

    await refreshProfile();
    setMembers([]);
    loadClans();
  };

  const myClan = clans.find(c => c.id === profile?.clan_id);

  const tabs: { key: TabType; label: string }[] = [
    { key: 'clans', label: 'Clans' },
    ...(profile?.clan_id ? [
      { key: 'chat' as TabType, label: 'Clan Chat' },
      { key: 'donations' as TabType, label: 'Donations' },
    ] : []),
  ];

  if (isGuest) {
    return (
      <div className="p-4 space-y-4">
        <h2 className="font-mono-game text-xs tracking-[0.2em] uppercase text-muted-foreground">Clans</h2>
        <p className="text-xs text-muted-foreground/50 text-center py-8">
          Login with an account to join or create clans. Guest mode does not support multiplayer features.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Tab Bar */}
      {tabs.length > 1 && (
        <div className="flex gap-1 px-4 pt-4">
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

      {/* Clan Chat Tab */}
      {tab === 'chat' && profile?.clan_id && (
        <ChatRoom channel={`clan-${profile.clan_id}`} />
      )}

      {/* Donations Tab */}
      {tab === 'donations' && (
        <DonationPanel />
      )}

      {/* Clans Tab */}
      {tab === 'clans' && (
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

          {!user && (
            <p className="text-xs text-muted-foreground/50 text-center py-8">Login to join or create clans</p>
          )}

          {/* Error display */}
          {error && (
            <div className="border border-destructive/30 bg-destructive/5 px-3 py-2 rounded-sm">
              <p className="font-mono-game text-[10px] text-destructive">{error}</p>
            </div>
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
              <button
                type="submit"
                disabled={loading}
                className="w-full font-mono-game text-[10px] uppercase py-1.5 border border-accent text-accent hover:bg-accent/10 disabled:opacity-30 transition-colors"
              >
                {loading ? 'Creating...' : 'Create & Join'}
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

              {/* Quick links */}
              <div className="flex gap-2">
                <button
                  onClick={() => setTab('chat')}
                  className="font-mono-game text-[10px] uppercase px-2 py-1 border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
                >
                  Open Clan Chat
                </button>
                <button
                  onClick={() => setTab('donations')}
                  className="font-mono-game text-[10px] uppercase px-2 py-1 border border-accent/30 text-accent hover:bg-accent/10 transition-colors"
                >
                  Donations
                </button>
              </div>

              <div className="space-y-1">
                <p className="font-mono-game text-[10px] uppercase tracking-wider text-muted-foreground">Members ({members.length})</p>
                {members.map((m, i) => (
                  <div key={i} className="flex items-center justify-between px-2 py-1 border border-border bg-card rounded-sm">
                    <span className="font-mono-game text-[10px] text-foreground">{m.username}</span>
                    <span className="font-mono-game text-[9px] text-muted-foreground">{m.total_mined || 0} mined</span>
                  </div>
                ))}
                {members.length === 0 && (
                  <p className="text-[9px] text-muted-foreground/50 text-center py-2">No members loaded</p>
                )}
              </div>
            </div>
          )}

          {/* All Clans (joinable) */}
          <div className="space-y-1.5 max-h-[40vh] overflow-y-auto">
            <p className="font-mono-game text-[10px] uppercase tracking-wider text-muted-foreground">
              {profile?.clan_id ? 'Other Clans' : 'Available Clans'}
            </p>
            {clans.filter(c => c.id !== profile?.clan_id).map(clan => (
              <div key={clan.id} className="flex items-center justify-between px-3 py-2 border border-border bg-card rounded-sm">
                <div>
                  <span className="font-mono-game text-[10px] text-accent font-bold">[{clan.tag}]</span>
                  <span className="font-mono-game text-xs text-foreground ml-1.5">{clan.name}</span>
                  <span className="font-mono-game text-[9px] text-muted-foreground ml-2">
                    {clan.member_count}/{clan.max_members || 20}
                  </span>
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

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ChatRoom } from '@/components/game/ChatRoom';

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
  const [clans, setClans] = useState<Clan[]>([]);
  const [members, setMembers] = useState<{ username: string; display_name: string | null; total_mined: number | null }[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [desc, setDesc] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [clanView, setClanView] = useState<'chat' | 'members'>('chat');

  const loadClans = async () => {
    try {
      const { data, error: err } = await supabase.from('clans').select('*').order('created_at', { ascending: false });
      if (err || !data) return;
      const withCounts = await Promise.all(data.map(async (clan) => {
        const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('clan_id', clan.id);
        return { ...clan, member_count: count || 0 };
      }));
      setClans(withCounts);
    } catch (e) { console.warn('Clan load error:', e); }
  };

  const loadMembers = async (clanId: string) => {
    try {
      const { data } = await supabase.from('profiles').select('username, display_name, total_mined').eq('clan_id', clanId).order('total_mined', { ascending: false });
      setMembers(data || []);
    } catch (e) { console.warn('Member load error:', e); }
  };

  useEffect(() => { if (!isGuest) loadClans(); }, [isGuest]);
  useEffect(() => { if (profile?.clan_id) loadMembers(profile.clan_id); }, [profile?.clan_id]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');
    setLoading(true);

    const { data, error: createErr } = await supabase.from('clans').insert({
      name: name.trim(), tag: tag.trim().toUpperCase(), description: desc.trim() || null, owner_id: user.id,
    }).select().maybeSingle();

    if (createErr || !data) {
      setError(createErr?.message || 'Failed to create clan');
      setLoading(false);
      return;
    }

    const { error: joinErr } = await supabase.from('profiles').update({ clan_id: data.id }).eq('user_id', user.id);
    if (joinErr) {
      setError('Clan created but failed to join: ' + joinErr.message);
    } else {
      await refreshProfile();
      setShowCreate(false);
      setName(''); setTag(''); setDesc('');
      loadMembers(data.id);
    }
    setLoading(false);
    loadClans();
  };

  const handleJoin = async (clanId: string) => {
    if (!user) return;
    setError('');
    const { error: joinErr } = await supabase.from('profiles').update({ clan_id: clanId }).eq('user_id', user.id);
    if (joinErr) {
      setError('Failed to join: ' + joinErr.message);
      return;
    }
    await refreshProfile();
    loadClans();
    loadMembers(clanId);
  };

  const handleLeave = async () => {
    if (!user) return;
    const { error: leaveErr } = await supabase.from('profiles').update({ clan_id: null }).eq('user_id', user.id);
    if (leaveErr) {
      setError('Failed to leave: ' + leaveErr.message);
      return;
    }
    await refreshProfile();
    setMembers([]);
    loadClans();
  };

  // Guest mode
  if (isGuest) {
    return (
      <div className="p-4 space-y-4">
        <h2 className="font-mono-game text-xs tracking-[0.2em] uppercase text-muted-foreground">Clans</h2>
        <p className="text-xs text-muted-foreground/50 text-center py-8">Login to join or create clans.</p>
      </div>
    );
  }

  const myClan = clans.find(c => c.id === profile?.clan_id);

  // ─── IN A CLAN: Show clan hub (chat + members + leave) ───
  if (myClan) {
    return (
      <div className="flex flex-col h-full">
        {/* Clan header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="font-mono-game text-xs text-primary font-bold">[{myClan.tag}]</span>
            <span className="font-mono-game text-xs text-foreground">{myClan.name}</span>
            <span className="font-mono-game text-[9px] text-muted-foreground">({members.length} members)</span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setClanView('chat')}
              className={`font-mono-game text-[10px] uppercase px-2 py-1 border transition-colors ${
                clanView === 'chat' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setClanView('members')}
              className={`font-mono-game text-[10px] uppercase px-2 py-1 border transition-colors ${
                clanView === 'members' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
              }`}
            >
              Members
            </button>
          </div>
        </div>

        {/* Chat view */}
        {clanView === 'chat' && (
          <ChatRoom channel={`clan-${myClan.id}`} />
        )}

        {/* Members view */}
        {clanView === 'members' && (
          <div className="p-4 space-y-3">
            {myClan.description && <p className="text-[10px] text-muted-foreground">{myClan.description}</p>}

            <div className="space-y-1">
              <p className="font-mono-game text-[10px] uppercase tracking-wider text-muted-foreground">Members ({members.length})</p>
              {members.map((m, i) => (
                <div key={i} className="flex items-center justify-between px-2 py-1.5 border border-border bg-card rounded-sm">
                  <span className="font-mono-game text-[10px] text-foreground">{m.username}</span>
                  <span className="font-mono-game text-[9px] text-muted-foreground">{m.total_mined || 0} mined</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleLeave}
              className="w-full font-mono-game text-[10px] uppercase py-1.5 border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
            >
              Leave Clan
            </button>
          </div>
        )}
      </div>
    );
  }

  // ─── NOT IN A CLAN: Show clan browser ───
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-mono-game text-xs tracking-[0.2em] uppercase text-muted-foreground">Find a Clan</h2>
        {user && (
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

      {error && (
        <div className="border border-destructive/30 bg-destructive/5 px-3 py-2 rounded-sm">
          <p className="font-mono-game text-[10px] text-destructive">{error}</p>
        </div>
      )}

      {showCreate && (
        <form onSubmit={handleCreate} className="space-y-2 border border-accent/30 bg-accent/5 p-3 rounded-sm">
          <input type="text" placeholder="Clan Name" value={name} onChange={e => setName(e.target.value)} required
            className="w-full bg-card border border-border px-3 py-1.5 font-mono-game text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent" />
          <input type="text" placeholder="Tag (e.g. VOID)" value={tag} onChange={e => setTag(e.target.value.slice(0, 5))} required
            className="w-full bg-card border border-border px-3 py-1.5 font-mono-game text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent" />
          <input type="text" placeholder="Description (optional)" value={desc} onChange={e => setDesc(e.target.value)}
            className="w-full bg-card border border-border px-3 py-1.5 font-mono-game text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent" />
          <button type="submit" disabled={loading}
            className="w-full font-mono-game text-[10px] uppercase py-1.5 border border-accent text-accent hover:bg-accent/10 disabled:opacity-30 transition-colors">
            {loading ? 'Creating...' : 'Create & Join'}
          </button>
        </form>
      )}

      <div className="space-y-1.5 max-h-[50vh] overflow-y-auto">
        {clans.map(clan => (
          <div key={clan.id} className="flex items-center justify-between px-3 py-2 border border-border bg-card rounded-sm">
            <div>
              <span className="font-mono-game text-[10px] text-accent font-bold">[{clan.tag}]</span>
              <span className="font-mono-game text-xs text-foreground ml-1.5">{clan.name}</span>
              <span className="font-mono-game text-[9px] text-muted-foreground ml-2">{clan.member_count}/{clan.max_members || 20}</span>
            </div>
            {user && (
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
  );
}

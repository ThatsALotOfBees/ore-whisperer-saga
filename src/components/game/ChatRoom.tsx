import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ChatMessage {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  channel: string;
  username?: string;
}

export function ChatRoom({ channel = 'global' }: { channel?: string }) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const profileCache = useRef<Record<string, string>>({});

  // Load recent messages
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('channel', channel)
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) {
        const reversed = data.reverse();
        // Fetch usernames
        const userIds = [...new Set(reversed.map(m => m.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, username')
          .in('user_id', userIds);

        const nameMap: Record<string, string> = {};
        profiles?.forEach(p => { nameMap[p.user_id] = p.username; });
        profileCache.current = { ...profileCache.current, ...nameMap };

        setMessages(reversed.map(m => ({ ...m, username: nameMap[m.user_id] || 'unknown' })));
      }
    };
    load();
  }, [channel]);

  // Realtime subscription
  useEffect(() => {
    const sub = supabase
      .channel(`chat-${channel}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `channel=eq.${channel}`,
      }, async (payload) => {
        const msg = payload.new as ChatMessage;
        // Get username
        if (!profileCache.current[msg.user_id]) {
          const { data } = await supabase
            .from('profiles')
            .select('username')
            .eq('user_id', msg.user_id)
            .single();
          if (data) profileCache.current[msg.user_id] = data.username;
        }
        msg.username = profileCache.current[msg.user_id] || 'unknown';
        setMessages(prev => [...prev.slice(-99), msg]);
      })
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [channel]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;
    setSending(true);
    await supabase.from('chat_messages').insert({
      user_id: user.id,
      channel,
      content: input.trim(),
    });
    setInput('');
    setSending(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <h2 className="font-mono-game text-xs tracking-[0.2em] uppercase text-muted-foreground">
          {channel === 'global' ? 'Global Chat' : `#${channel}`}
        </h2>
        <span className="font-mono-game text-[9px] text-muted-foreground/50">{messages.length} messages</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-0" style={{ maxHeight: '50vh' }}>
        {messages.length === 0 && (
          <p className="text-xs text-muted-foreground/50 text-center py-8">No messages yet. Say something!</p>
        )}
        {messages.map(msg => {
          const isMe = msg.user_id === user?.id;
          return (
            <div key={msg.id} className={`flex gap-2 ${isMe ? 'justify-end' : ''}`}>
              <div className={`max-w-[80%] px-2.5 py-1.5 rounded-sm border ${
                isMe ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'
              }`}>
                <div className="flex items-baseline gap-2">
                  <span className={`font-mono-game text-[10px] font-bold ${isMe ? 'text-primary' : 'text-accent'}`}>
                    {msg.username}
                  </span>
                  <span className="font-mono-game text-[8px] text-muted-foreground/40">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-foreground break-words">{msg.content}</p>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSend} className="flex gap-2 p-3 border-t border-border">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={user ? 'Type a message...' : 'Login to chat'}
          disabled={!user || sending}
          maxLength={500}
          className="flex-1 bg-card border border-border px-3 py-1.5 font-mono-game text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary disabled:opacity-30"
        />
        <button
          type="submit"
          disabled={!user || sending || !input.trim()}
          className="font-mono-game text-[10px] uppercase px-4 py-1.5 border border-primary text-primary hover:bg-primary/10 disabled:opacity-30 transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}

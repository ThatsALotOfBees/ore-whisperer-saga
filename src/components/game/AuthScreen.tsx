import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function AuthScreen() {
  const { signIn, signUp, playAsGuest } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isSignUp) {
      if (!username.trim()) {
        setError('Username is required');
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, username.trim());
      if (error) setError(error.message);
    } else {
      const { error } = await signIn(email, password);
      if (error) setError(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="font-mono-game text-lg font-bold tracking-[0.15em] uppercase text-primary">
            VOID<span className="text-accent">—</span>MARKET
          </h1>
          <p className="font-mono-game text-[10px] text-muted-foreground tracking-wider uppercase">
            {isSignUp ? 'Register New Terminal' : 'Terminal Access'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {isSignUp && (
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-card border border-border px-3 py-2 font-mono-game text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full bg-card border border-border px-3 py-2 font-mono-game text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full bg-card border border-border px-3 py-2 font-mono-game text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary"
          />

          {error && (
            <p className="font-mono-game text-[10px] text-destructive">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full font-mono-game text-xs uppercase tracking-wider py-2.5 border border-primary text-primary hover:bg-primary/10 disabled:opacity-30 transition-colors"
          >
            {loading ? 'CONNECTING...' : isSignUp ? 'REGISTER' : 'LOGIN'}
          </button>
        </form>

        <button
          onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
          className="w-full font-mono-game text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          {isSignUp ? 'Already have access? Login' : 'Need access? Register'}
        </button>

        <div className="border-t border-border pt-4">
          <button
            onClick={playAsGuest}
            className="w-full font-mono-game text-xs uppercase tracking-wider py-2.5 border border-accent/50 text-accent hover:bg-accent/10 transition-colors"
          >
            Play as Guest
          </button>
          <p className="font-mono-game text-[9px] text-muted-foreground/50 text-center mt-2">
            Game saves locally. No cloud sync, chat, or clans.
          </p>
        </div>
      </div>
    </div>
  );
}

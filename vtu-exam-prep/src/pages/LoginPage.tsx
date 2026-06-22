import { useState } from 'react';
import { Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!name.trim() || !password.trim()) {
      setError('Please enter both a username and a password.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('authenticate_student', {
        p_name: name.trim(),
        p_password: password.trim(),
      });

      if (error) {
        throw error;
      }

      if (data) {
        // Success
        localStorage.setItem('vtu_auth_session', 'true');
        window.dispatchEvent(new Event('vtu-auth-changed'));
        onLogin();
      } else {
        setError('Incorrect password.');
      }
    } catch (err: any) {
      console.error(err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] -z-10" />

      <div className="w-full max-w-md bg-surface/80 backdrop-blur-xl border border-border/50 rounded-3xl p-8 shadow-2xl relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mb-6 border border-accent/20">
            <Lock className="text-accent" size={32} />
          </div>
          <h1 className="text-2xl font-bold mb-2">Login / Register</h1>
          <p className="text-sm text-muted-foreground">
            Enter a unique username and a password. If the username is new, it will be registered automatically!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder=""
                autoComplete="off"
                className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-muted"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=""
                autoComplete="new-password"
                className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-muted"
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400 text-center animate-in fade-in slide-in-from-top-1">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-3.5 bg-accent text-accent-foreground font-semibold rounded-xl hover:bg-accent/90 hover:scale-[1.02] active:scale-100 transition-all flex items-center justify-center gap-2 group shadow-lg shadow-accent/20 disabled:opacity-70 disabled:hover:scale-100"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                Continue <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Activity, Users } from 'lucide-react';

export default function StatsPage() {
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [activeUsers, setActiveUsers] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch total users
        const { count: total } = await supabase
          .from('site_visits')
          .select('*', { count: 'exact', head: true });
        
        // Fetch active users (active in the last 15 minutes)
        const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
        const { count: active } = await supabase
          .from('site_visits')
          .select('*', { count: 'exact', head: true })
          .gte('last_active_at', fifteenMinsAgo);

        setTotalUsers(total);
        setActiveUsers(active);
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <h1 className="text-2xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
          Anonymous Analytics
        </h1>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4 relative z-10">
            <div className="bg-surface/50 border border-border/50 rounded-xl p-6 flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <Activity size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-1">Active Now</p>
                <p className="text-3xl font-bold">{activeUsers ?? 0}</p>
              </div>
            </div>

            <div className="bg-surface/50 border border-border/50 rounded-xl p-6 flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg">
                <Users size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-1">Total Unique Users</p>
                <p className="text-3xl font-bold">{totalUsers ?? 0}</p>
              </div>
            </div>
            
            <p className="text-xs text-center text-muted-foreground mt-6">
              Active users = visited in the last 15 minutes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

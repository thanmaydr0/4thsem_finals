import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { RefreshCw, Terminal, User } from 'lucide-react';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';

interface Operative {
  id: string;
  name: string;
  created_at: string;
  status: 'online' | 'offline';
  lastPing: string | null;
  chatCount: number;
  studyInteractions: number;
}

interface DashboardData {
  liveActive: number;
  totalUnique: number;
  avgSessionMinutes: number;
  totalChatSessions: number;
  totalFeedback: number;
  progressStats: {
    not_started: number;
    reviewing: number;
    confident: number;
    total: number;
  };
  operatives: Operative[];
}

export default function StatsPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    setRefreshing(true);
    try {
      // 1. Live Analytics (site_visits)
      const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      
      const [visitsRes, activeRes, chatsRes, feedbackRes, progressRes, profilesRes] = await Promise.all([
        supabase.from('site_visits').select('created_at, last_active_at, student_name'),
        supabase.from('site_visits').select('*', { count: 'exact', head: true }).gte('last_active_at', fifteenMinsAgo),
        supabase.from('chat_sessions').select('student_name'),
        supabase.from('feedback').select('*', { count: 'exact', head: true }),
        supabase.from('study_progress').select('status, student_name'),
        supabase.from('student_profiles').select('id, name, created_at').order('created_at', { ascending: false })
      ]);

      // Calculate average session duration
      let totalMinutes = 0;
      let validSessions = 0;
      if (visitsRes.data) {
        visitsRes.data.forEach(v => {
          const created = new Date(v.created_at).getTime();
          const lastActive = new Date(v.last_active_at).getTime();
          const diffMinutes = (lastActive - created) / (1000 * 60);
          if (diffMinutes >= 0) {
            totalMinutes += diffMinutes;
            validSessions++;
          }
        });
      }
      const avgMinutes = validSessions > 0 ? Math.round(totalMinutes / validSessions) : 0;

      // Group study progress globally
      const pStats = { not_started: 0, reviewing: 0, confident: 0, total: 0 };
      if (progressRes.data) {
        pStats.total = progressRes.data.length;
        progressRes.data.forEach(p => {
          if (p.status === 'reviewing') pStats.reviewing++;
          else if (p.status === 'confident') pStats.confident++;
          else pStats.not_started++;
        });
      }

      // Build Operatives Roster
      const operatives: Operative[] = [];
      if (profilesRes.data) {
        profilesRes.data.forEach(profile => {
          // Find their latest visit
          const userVisits = visitsRes.data?.filter(v => v.student_name === profile.name) || [];
          let lastPingStr = profile.created_at; // default to creation
          let isOnline = false;
          
          if (userVisits.length > 0) {
            // Get most recent ping
            const pings = userVisits.map(v => new Date(v.last_active_at).getTime());
            const maxPing = Math.max(...pings);
            lastPingStr = new Date(maxPing).toISOString();
            if (maxPing > new Date(fifteenMinsAgo).getTime()) {
              isOnline = true;
            }
          }

          const userChats = chatsRes.data?.filter(c => c.student_name === profile.name) || [];
          const userProgress = progressRes.data?.filter(p => p.student_name === profile.name) || [];

          operatives.push({
            id: profile.id,
            name: profile.name,
            created_at: profile.created_at,
            status: isOnline ? 'online' : 'offline',
            lastPing: lastPingStr,
            chatCount: userChats.length,
            studyInteractions: userProgress.length
          });
        });
      }

      setData({
        liveActive: activeRes.count ?? 0,
        totalUnique: visitsRes.data?.length ?? 0,
        avgSessionMinutes: avgMinutes,
        totalChatSessions: chatsRes.data?.length ?? 0,
        totalFeedback: feedbackRes.count ?? 0,
        progressStats: pStats,
        operatives
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center font-mono">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
        <p className="text-emerald-500 animate-pulse tracking-widest text-sm uppercase">INITIATING SATELLITE UPLINK...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-8 overflow-x-hidden font-mono">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 border-b border-border/50 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-emerald-500/20 translate-y-full group-hover:translate-y-0 transition-transform" />
              <Terminal size={28} className="text-emerald-400 relative z-10" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-emerald-400 tracking-wider uppercase mb-1">
                Command Center // V2.0
              </h1>
              <p className="text-emerald-500/60 text-xs uppercase tracking-widest">
                Global Operations & Operative Tracking Network
              </p>
            </div>
          </div>
          <button
            onClick={fetchStats}
            disabled={refreshing}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg hover:bg-emerald-500/20 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all disabled:opacity-50 text-sm uppercase tracking-wider"
          >
            <RefreshCw size={14} className={clsx(refreshing && "animate-spin")} />
            {refreshing ? 'Syncing...' : 'Sync Data'}
          </button>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard title="Active Operatives" value={data?.liveActive ?? 0} color="emerald" pulse />
          <MetricCard title="Total Registered" value={data?.operatives.length ?? 0} color="blue" />
          <MetricCard title="Avg Engagement (m)" value={data?.avgSessionMinutes ?? 0} color="purple" />
          <MetricCard title="Global Chat Uplinks" value={data?.totalChatSessions ?? 0} color="amber" />
        </div>

        {/* SCI FI ROSTER */}
        <div className="bg-[#050B08] border border-emerald-500/30 rounded-2xl relative overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.05)] mb-8">
          {/* Scanline overlay */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.2)_50%)] bg-[length:100%_4px] opacity-20 z-10" />
          
          <div className="p-6 relative z-20 border-b border-emerald-500/20 bg-emerald-500/5">
            <h2 className="text-lg font-bold text-emerald-400 tracking-widest uppercase flex items-center gap-3">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Operative Roster
            </h2>
            <p className="text-xs text-emerald-500/60 mt-1 uppercase tracking-wider">
              Real-time tracking of authenticated personnel
            </p>
          </div>

          <div className="overflow-x-auto relative z-20">
            <table className="w-full text-left text-sm">
              <thead className="bg-emerald-500/5 text-emerald-500/80 text-xs uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4 font-normal">Operative Name</th>
                  <th className="px-6 py-4 font-normal">Status</th>
                  <th className="px-6 py-4 font-normal">Last Known Ping</th>
                  <th className="px-6 py-4 font-normal text-right">AI Intel Gathered</th>
                  <th className="px-6 py-4 font-normal text-right">Study Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-500/10">
                {data?.operatives.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-emerald-500/50 uppercase tracking-widest text-xs">
                      No operatives registered in database.
                    </td>
                  </tr>
                ) : (
                  data?.operatives.map(op => (
                    <tr key={op.id} className="hover:bg-emerald-500/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:border-emerald-500/50 transition-colors">
                            <User size={14} />
                          </div>
                          <div>
                            <p className="text-emerald-100 font-semibold uppercase tracking-wider">{op.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={clsx(
                            "w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]",
                            op.status === 'online' ? "bg-emerald-400 text-emerald-400 animate-pulse" : "bg-red-500 text-red-500 opacity-50"
                          )} />
                          <span className={clsx(
                            "text-xs uppercase tracking-wider",
                            op.status === 'online' ? "text-emerald-400" : "text-red-500/70"
                          )}>
                            {op.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-emerald-500/70 text-xs">
                        {op.lastPing ? formatDistanceToNow(new Date(op.lastPing), { addSuffix: true }) : 'UNKNOWN'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center justify-center px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-xs">
                          {op.chatCount} sessions
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center justify-center px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-xs">
                          {op.studyInteractions} logged
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Global Progress */}
        <div className="bg-[#050B08] border border-emerald-500/30 rounded-2xl p-6 relative overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.05)]">
           <h2 className="text-lg font-bold text-emerald-400 tracking-widest uppercase flex items-center gap-3 mb-6">
              Global Campaign Progress
           </h2>
            
            <div className="space-y-6">
              {(() => {
                const total = data?.progressStats.total || 1; // prevent div by zero
                const reviewing = data?.progressStats.reviewing || 0;
                const confident = data?.progressStats.confident || 0;
                
                const reviewingPct = Math.round((reviewing / total) * 100);
                const confidentPct = Math.round((confident / total) * 100);
                
                return (
                  <>
                    <ProgressRow 
                      label="MISSION CONFIDENT" 
                      count={confident} 
                      percentage={confidentPct} 
                      color="bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                    />
                    <ProgressRow 
                      label="IN REVIEW" 
                      count={reviewing} 
                      percentage={reviewingPct} 
                      color="bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" 
                    />
                  </>
                );
              })()}
            </div>
        </div>

      </div>
    </div>
  );
}

function MetricCard({ title, value, color, pulse }: { title: string, value: string | number, color: string, pulse?: boolean }) {
  const colorConfig = {
    emerald: 'bg-emerald-500/5 text-emerald-400 border-emerald-500/30',
    blue: 'bg-blue-500/5 text-blue-400 border-blue-500/30',
    purple: 'bg-purple-500/5 text-purple-400 border-purple-500/30',
    amber: 'bg-amber-500/5 text-amber-400 border-amber-500/30',
  }[color];

  return (
    <div className={clsx("rounded-xl p-5 relative overflow-hidden border", colorConfig)}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-current opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <p className="text-[10px] uppercase tracking-widest mb-2 opacity-80">{title}</p>
      <div className="flex items-center gap-3">
        <p className={clsx("text-3xl font-bold tracking-wider", pulse && "animate-pulse")}>{value}</p>
      </div>
    </div>
  );
}

function ProgressRow({ label, count, percentage, color }: { label: string, count: number, percentage: number, color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs uppercase tracking-widest mb-3">
        <span className="text-emerald-100">{label}</span>
        <span className="text-emerald-500/70">{count} data points ({percentage}%)</span>
      </div>
      <div className="h-1.5 w-full bg-emerald-950 rounded-full overflow-hidden border border-emerald-500/20">
        <div 
          className={clsx("h-full transition-all duration-1000 ease-out", color)} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

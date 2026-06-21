import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Activity, Users, MessageSquare, Target, Clock, Star, RefreshCw } from 'lucide-react';
import clsx from 'clsx';

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
      
      const [visitsRes, activeRes, chatsRes, feedbackRes, progressRes] = await Promise.all([
        supabase.from('site_visits').select('created_at, last_active_at'),
        supabase.from('site_visits').select('*', { count: 'exact', head: true }).gte('last_active_at', fifteenMinsAgo),
        supabase.from('chat_sessions').select('*', { count: 'exact', head: true }),
        supabase.from('feedback').select('*', { count: 'exact', head: true }),
        supabase.from('study_progress').select('status')
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

      // Group study progress
      const pStats = { not_started: 0, reviewing: 0, confident: 0, total: 0 };
      if (progressRes.data) {
        pStats.total = progressRes.data.length;
        progressRes.data.forEach(p => {
          if (p.status === 'reviewing') pStats.reviewing++;
          else if (p.status === 'confident') pStats.confident++;
          else pStats.not_started++;
        });
      }

      setData({
        liveActive: activeRes.count ?? 0,
        totalUnique: visitsRes.data?.length ?? 0,
        avgSessionMinutes: avgMinutes,
        totalChatSessions: chatsRes.count ?? 0,
        totalFeedback: feedbackRes.count ?? 0,
        progressStats: pStats
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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-muted-foreground animate-pulse">Aggregating historical data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-8 overflow-x-hidden">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-2">
              Command Center
            </h1>
            <p className="text-muted-foreground text-sm">
              Live analytics and historical usage metrics.
            </p>
          </div>
          <button
            onClick={fetchStats}
            disabled={refreshing}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg hover:bg-card transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={clsx(refreshing && "animate-spin")} />
            Refresh
          </button>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title="Active Now"
            value={data?.liveActive ?? 0}
            icon={Activity}
            color="emerald"
            pulse
          />
          <MetricCard
            title="Total Tracked Users"
            value={data?.totalUnique ?? 0}
            icon={Users}
            color="blue"
          />
          <MetricCard
            title="Avg Session Length"
            value={`${data?.avgSessionMinutes ?? 0}m`}
            icon={Clock}
            color="purple"
          />
          <MetricCard
            title="Historical Feedback"
            value={data?.totalFeedback ?? 0}
            icon={Star}
            color="amber"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Deep Usage Stats */}
          <div className="bg-surface/50 border border-border/50 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <MessageSquare size={18} className="text-accent" />
              Historical AI Engagement
            </h2>
            
            <div className="flex items-end gap-4 mb-2">
              <span className="text-5xl font-bold">{data?.totalChatSessions ?? 0}</span>
              <span className="text-muted-foreground pb-1">total chat sessions</span>
            </div>
            <p className="text-sm text-muted-foreground mb-8">
              Students have relied heavily on the AI Assistant for breaking down complex topics.
            </p>
          </div>

          {/* Global Study Progress */}
          <div className="bg-surface/50 border border-border/50 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Target size={18} className="text-emerald-400" />
              Global Study Progress
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
                      label="Confident" 
                      count={confident} 
                      percentage={confidentPct} 
                      color="bg-emerald-500" 
                    />
                    <ProgressRow 
                      label="Reviewing" 
                      count={reviewing} 
                      percentage={reviewingPct} 
                      color="bg-amber-500" 
                    />
                  </>
                );
              })()}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, color, pulse }: { title: string, value: string | number, icon: any, color: string, pulse?: boolean }) {
  const colorConfig = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  }[color];

  return (
    <div className="bg-surface/50 border border-border/50 rounded-xl p-5 hover:bg-surface transition-colors flex items-center gap-4">
      <div className={clsx("p-3 rounded-lg border", colorConfig, pulse && "animate-pulse")}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}

function ProgressRow({ label, count, percentage, color }: { label: string, count: number, percentage: number, color: string }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{count} interactions ({percentage}%)</span>
      </div>
      <div className="h-2 w-full bg-background rounded-full overflow-hidden">
        <div 
          className={clsx("h-full rounded-full transition-all duration-1000 ease-out", color)} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  BrainCircuit,
  Calendar,
  Clock,
  Target,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Circle,
  CheckCircle2,
} from 'lucide-react';
import clsx from 'clsx';
import { supabase } from '../lib/supabase';
import type { Question, StudyProgress } from '../types';

import FeedbackModal from '../components/FeedbackModal';

interface SubjectStats {
  total: number;
  notStarted: number;
  reviewing: number;
  confident: number;
}

export default function Home() {
  // Hooks
  const [questions, setQuestions] = useState<Question[]>([]);
  const [progress, setProgress] = useState<Record<string, StudyProgress>>({});
  const [loading, setLoading] = useState(true);

  // Exam dates state
  const [adaDateStr, setAdaDateStr] = useState(() => localStorage.getItem('vtu_ada_exam_date') || '');
  const [aiDateStr, setAiDateStr] = useState(() => localStorage.getItem('vtu_ai_exam_date') || '');

  useEffect(() => {
    localStorage.setItem('vtu_ada_exam_date', adaDateStr);
  }, [adaDateStr]);

  useEffect(() => {
    localStorage.setItem('vtu_ai_exam_date', aiDateStr);
  }, [aiDateStr]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const [qRes, pRes] = await Promise.all([
        supabase.from('questions').select('*'),
        supabase.from('study_progress').select('*'),
      ]);

      const qs = qRes.data ?? [];
      const ps = pRes.data ?? [];

      const pMap: Record<string, StudyProgress> = {};
      ps.forEach((p) => {
        pMap[p.question_id] = p;
      });

      setQuestions(qs);
      setProgress(pMap);
      setLoading(false);
    }

    fetchData();
  }, []);

  const stats = useMemo(() => {
    const s = {
      ada: { total: 0, notStarted: 0, reviewing: 0, confident: 0 },
      ai: { total: 0, notStarted: 0, reviewing: 0, confident: 0 },
    };

    questions.forEach((q) => {
      const subject = q.subject_id as 'ada' | 'ai';
      s[subject].total++;
      const status = progress[q.id]?.status ?? 'not_started';
      if (status === 'not_started') s[subject].notStarted++;
      if (status === 'reviewing') s[subject].reviewing++;
      if (status === 'confident') s[subject].confident++;
    });

    return s;
  }, [questions, progress]);

  // ADA Top 5 Not Started
  const adaTopPriority = useMemo(() => {
    return questions
      .filter((q) => q.subject_id === 'ada')
      .filter((q) => (progress[q.id]?.status ?? 'not_started') === 'not_started')
      .filter((q) => q.frequency != null)
      .sort((a, b) => (b.frequency ?? 0) - (a.frequency ?? 0))
      .slice(0, 5);
  }, [questions, progress]);

  // AI Top Themes
  const aiTopThemes = useMemo(() => {
    const tagCounts = new Map<string, number>();
    questions
      .filter((q) => q.subject_id === 'ai')
      .forEach((q) => {
        (q.topic_tags ?? []).forEach((tag) => {
          tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
        });
      });

    return [...tagCounts.entries()]
      .filter(([_, count]) => count >= 3)
      .sort((a, b) => b[1] - a[1]);
  }, [questions]);

  function getDaysUntil(dateStr: string) {
    if (!dateStr) return null;
    const diffTime = new Date(dateStr).getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  const adaDays = getDaysUntil(adaDateStr);
  const aiDays = getDaysUntil(aiDateStr);

  return (
    <div className="flex flex-col items-center min-h-screen py-10 px-4 max-w-4xl mx-auto space-y-12 relative">
      <FeedbackModal />
      
      {/* Header & Countdown */}
      <div className="w-full text-center space-y-6">
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-accent to-purple-400 bg-clip-text text-transparent">
            VTU Exam Prep
          </h1>
          <p className="text-muted text-lg">4th Semester Finals</p>
        </div>

        {/* Countdown Widget */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 p-4 rounded-2xl bg-card border border-border w-full max-w-md mx-auto sm:max-w-none sm:w-auto sm:inline-flex">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
              <Calendar className="text-accent" size={18} />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">ADA Exam:</span>
                <input
                  type="date"
                  value={adaDateStr}
                  onChange={(e) => setAdaDateStr(e.target.value)}
                  className="bg-transparent text-sm text-muted-foreground outline-none cursor-pointer hover:text-foreground transition-colors min-h-[44px]"
                />
              </div>
              {adaDays !== null && (
                <p
                  className={clsx(
                    'text-xs font-medium',
                    adaDays < 0
                      ? 'text-muted-foreground'
                      : adaDays <= 3
                      ? 'text-red-400'
                      : 'text-emerald-400'
                  )}
                >
                  {adaDays < 0
                    ? 'Exam passed'
                    : adaDays === 0
                    ? 'Exam today!'
                    : `${adaDays} days left`}
                </p>
              )}
            </div>
          </div>

          <div className="w-full h-px sm:w-px sm:h-10 bg-border" />

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
              <Calendar className="text-purple-400" size={18} />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">AI Exam:</span>
                <input
                  type="date"
                  value={aiDateStr}
                  onChange={(e) => setAiDateStr(e.target.value)}
                  className="bg-transparent text-sm text-muted-foreground outline-none cursor-pointer hover:text-foreground transition-colors min-h-[44px]"
                />
              </div>
              {aiDays !== null && (
                <p
                  className={clsx(
                    'text-xs font-medium',
                    aiDays < 0
                      ? 'text-muted-foreground'
                      : aiDays <= 3
                      ? 'text-red-400'
                      : 'text-emerald-400'
                  )}
                >
                  {aiDays < 0
                    ? 'Exam passed'
                    : aiDays === 0
                    ? 'Exam today!'
                    : `${aiDays} days left`}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <SubjectCard
          title="Analysis & Design of Algorithms"
          code="BCS401"
          shortName="ADA"
          icon={BookOpen}
          color="accent"
          link="/ada"
          stats={stats.ada}
          loading={loading}
        />
        <SubjectCard
          title="Artificial Intelligence"
          code="BAD402"
          shortName="AI"
          icon={BrainCircuit}
          color="purple"
          link="/ai"
          stats={stats.ai}
          loading={loading}
        />
      </div>

      {/* Smart Study Plan */}
      <div className="w-full bg-card border border-border rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-8">
          <Sparkles className="text-amber-400" size={24} />
          <h2 className="text-xl font-semibold">Smart Study Plan</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* ADA Top Priorities */}
          <div>
            <div className="flex items-center gap-2 mb-4 text-accent">
              <Target size={18} />
              <h3 className="font-semibold text-sm tracking-wide uppercase">
                ADA Guaranteed Patterns
              </h3>
            </div>
            <p className="text-xs text-muted mb-4">
              Focus on these first — they repeat almost every cycle and you
              haven't started them yet.
            </p>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-accent-subtle/10 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : adaTopPriority.length > 0 ? (
              <div className="space-y-3">
                {adaTopPriority.map((q) => (
                  <Link
                    key={q.id}
                    to="/ada"
                    className="block p-3 rounded-xl bg-background border border-border hover:border-accent/40 transition-colors group"
                  >
                    <p className="text-sm font-medium line-clamp-2 mb-3 group-hover:text-accent transition-colors">
                      {q.question_text}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-auto">
                      <span className="text-[11px] font-medium px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                        {q.frequency}× Frequency
                      </span>
                      <span className="text-[11px] text-muted flex items-center gap-1 px-2 py-1 bg-card rounded-full border border-border">
                        Module {q.module_id ? 'X' : '?'}
                        <ChevronRight size={10} />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-background border border-border text-center">
                <CheckCircle2 size={24} className="text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-medium">You're caught up!</p>
                <p className="text-xs text-muted">No unstarted high-frequency ADA questions.</p>
              </div>
            )}
          </div>

          {/* AI Recurring Themes */}
          <div>
            <div className="flex items-center gap-2 mb-4 text-purple-400">
              <Target size={18} />
              <h3 className="font-semibold text-sm tracking-wide uppercase">
                AI Core Themes
              </h3>
            </div>
            <p className="text-xs text-muted mb-4">
              These topics appear 3+ times. AI questions don't repeat exactly,
              so master the general concepts.
            </p>
            {loading ? (
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="w-20 h-7 bg-purple-500/10 rounded-full animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {aiTopThemes.map(([theme, count]) => (
                  <Link
                    key={theme}
                    to="/ai"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-background border border-border hover:border-purple-400/40 hover:bg-purple-500/5 transition-colors group"
                  >
                    <span className="text-xs font-medium group-hover:text-purple-400 transition-colors">
                      {theme}
                    </span>
                    <span className="text-[11px] font-bold px-1.5 rounded-full bg-purple-500/15 text-purple-400">
                      {count}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full pt-12 pb-6 text-center opacity-60 hover:opacity-100 transition-opacity">
        <p className="text-xs text-muted-foreground font-medium tracking-wide">
          Developed by Thanmay D R
        </p>
        <div className="flex items-center justify-center gap-4 mt-2">
          <p className="text-xs text-muted-foreground">
            <a href="mailto:thanmaydambekodi@gmail.com" className="hover:text-accent transition-colors">
              thanmaydambekodi@gmail.com
            </a>
          </p>
          <div className="w-px h-3 bg-border" />
          <p className="text-xs text-muted-foreground">
            <a href="https://github.com/thanmaydr0" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors flex items-center gap-1">
              <GithubIcon size={12} /> thanmaydr0
            </a>
          </p>
        </div>
      </footer>

    </div>
  );
}

function SubjectCard({
  title,
  code,
  shortName,
  icon: Icon,
  color,
  link,
  stats,
  loading,
}: {
  title: string;
  code: string;
  shortName: string;
  icon: any;
  color: 'accent' | 'purple';
  link: string;
  stats: SubjectStats;
  loading: boolean;
}) {
  const isAccent = color === 'accent';
  const colorClass = isAccent ? 'text-accent' : 'text-purple-400';
  const bgClass = isAccent ? 'bg-accent-subtle/30' : 'bg-purple-500/15';
  const borderHover = isAccent ? 'hover:border-accent/50 hover:shadow-accent/5' : 'hover:border-purple-400/50 hover:shadow-purple-500/5';

  const total = stats.total || 1; // avoid /0
  const confidentPct = (stats.confident / total) * 100;
  const reviewingPct = (stats.reviewing / total) * 100;

  return (
    <Link
      to={link}
      className={clsx(
        'group relative bg-card border border-border p-6 rounded-2xl hover:shadow-lg transition-all duration-300 flex flex-col',
        borderHover
      )}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div
            className={clsx(
              'w-14 h-14 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110',
              bgClass
            )}
          >
            <Icon size={26} className={colorClass} />
          </div>
          <div>
            <h2
              className={clsx(
                'text-2xl font-bold transition-colors',
                isAccent ? 'group-hover:text-accent' : 'group-hover:text-purple-400'
              )}
            >
              {shortName}
            </h2>
            <p className="text-sm font-medium text-muted-foreground">{code}</p>
          </div>
        </div>
        <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-muted group-hover:text-foreground group-hover:border-border-hover transition-all">
          <ArrowRight size={18} />
        </div>
      </div>

      <p className="text-muted text-sm font-medium mb-8 flex-1">{title}</p>

      {/* Progress Section */}
      <div className="mt-auto space-y-3">
        {loading ? (
          <div className="h-10 w-full animate-pulse bg-background rounded-lg" />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-1 text-[11px] sm:text-xs font-medium">
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={12} /> {stats.confident} confident
              </span>
              <span className="text-amber-400 flex items-center gap-1">
                <Clock size={12} /> {stats.reviewing} reviewing
              </span>
              <span className="text-zinc-500 flex items-center gap-1 w-full sm:w-auto mt-1 sm:mt-0">
                <Circle size={12} /> {stats.notStarted} to do
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden flex">
              <div
                className="h-full bg-emerald-500 transition-all duration-1000"
                style={{ width: `${confidentPct}%` }}
              />
              <div
                className="h-full bg-amber-500 transition-all duration-1000"
                style={{ width: `${reviewingPct}%` }}
              />
            </div>
            <p className="text-[11px] text-right text-muted-foreground uppercase tracking-wider font-semibold mt-1">
              {stats.total} total questions
            </p>
          </>
        )}
      </div>
    </Link>
  );
}

function GithubIcon({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3-.3 6-1.5 6-6.5a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 5 3 6.2 6 6.5a4.8 4.8 0 0 0-1 3.2v4" />
    </svg>
  );
}

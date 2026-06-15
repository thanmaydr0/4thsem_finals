import { useState, useEffect, useCallback } from 'react';
import {
  Play,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  StickyNote,
  Circle,
  Clock,
  CheckCircle2,
  ArrowUpDown,
  Tag,
  CalendarDays,
  Award,
} from 'lucide-react';
import clsx from 'clsx';
import { supabase } from '../../lib/supabase';
import { useStudyStore } from '../../hooks/useStudyStore';
import { useDebouncedCallback } from '../../hooks/useDebounce';
import type { Question, StudyProgress } from '../../types';

type SortMode = 'frequency' | 'recency' | 'sequence';

const FREQUENCY_LABELS: Record<number, { label: string; className: string }> = {
  4: {
    label: 'Asked every cycle',
    className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  },
  3: {
    label: 'Frequently asked',
    className: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  },
  2: {
    label: 'Frequently asked',
    className: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  },
  1: {
    label: 'Asked once',
    className: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
  },
};

const STATUS_CONFIG = {
  not_started: {
    label: 'Not Started',
    icon: Circle,
    border: 'border-l-zinc-600',
    btnActive: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/40',
    btnIdle: 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-500/10',
  },
  reviewing: {
    label: 'Reviewing',
    icon: Clock,
    border: 'border-l-amber-500',
    btnActive: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    btnIdle: 'text-zinc-500 hover:text-amber-300 hover:bg-amber-500/10',
  },
  confident: {
    label: 'Confident',
    icon: CheckCircle2,
    border: 'border-l-emerald-500',
    btnActive: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    btnIdle: 'text-zinc-500 hover:text-emerald-300 hover:bg-emerald-500/10',
  },
} as const;

type StatusType = keyof typeof STATUS_CONFIG;

// Recency score: higher = more recent exam cycle
const RECENCY_MAP: Record<string, number> = {
  'Jan 2024': 1,
  'July 2024': 2,
  'Jan 2025': 3,
  'July 2025': 4,
  'Jan 2026': 5,
};

function getRecencyScore(examCycles: string[] | null): number {
  if (!examCycles || examCycles.length === 0) return 0;
  return Math.max(...examCycles.map((c) => RECENCY_MAP[c] ?? 0));
}

interface ADAQuestionListProps {
  questions: Question[];
  loading?: boolean;
}

export default function ADAQuestionList({ questions, loading = false }: ADAQuestionListProps) {
  const { selectedModuleNumber, searchQuery, setChatQuestionContext } = useStudyStore();

  const [progressMap, setProgressMap] = useState<Record<string, StudyProgress>>({});
  const [sortMode, setSortMode] = useState<SortMode>('frequency');


  // Fetch study progress for loaded questions
  useEffect(() => {
    async function fetchProgress() {
      if (questions.length === 0) {
        setProgressMap({});
        return;
      }

      const qIds = questions.map((q) => q.id);
      const { data } = await supabase
        .from('study_progress')
        .select('*')
        .in('question_id', qIds);

      const map: Record<string, StudyProgress> = {};
      (data ?? []).forEach((p) => {
        map[p.question_id] = p;
      });
      setProgressMap(map);
    }

    fetchProgress();
  }, [questions]);

  // Filter by search query
  const filtered = questions.filter((q) => {
    if (!searchQuery) return true;
    const lower = searchQuery.toLowerCase();
    return (
      q.question_text.toLowerCase().includes(lower) ||
      (q.topic_tags ?? []).some((t) => t.toLowerCase().includes(lower)) ||
      (q.course_outcome ?? '').toLowerCase().includes(lower)
    );
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortMode === 'frequency') {
      return (b.frequency ?? 0) - (a.frequency ?? 0);
    }
    if (sortMode === 'recency') {
      return getRecencyScore(b.exam_cycles) - getRecencyScore(a.exam_cycles);
    }
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Sort Controls */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted">
          {sorted.length} question{sorted.length !== 1 ? 's' : ''}
          {selectedModuleNumber ? ` in Module ${selectedModuleNumber}` : ''}
        </p>

        <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-0.5">
          <ArrowUpDown size={13} className="text-muted ml-2 mr-1" />
          {(['frequency', 'recency', 'sequence'] as SortMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setSortMode(mode)}
              className={clsx(
                'px-3 py-1.5 text-xs rounded-md font-medium transition-colors capitalize',
                sortMode === mode
                  ? 'bg-accent text-white'
                  : 'text-muted hover:text-foreground'
              )}
            >
              {mode === 'recency' ? 'Exam Recency' : mode === 'sequence' ? 'Sequence' : 'Frequency'}
            </button>
          ))}
        </div>
      </div>

      {/* Question Cards */}
      <div className="space-y-4">
        {sorted.map((q, i) => (
          <QuestionCard
            key={q.id}
            question={q}
            index={i + 1}
            progress={progressMap[q.id]}
            onProgressChange={(updated) =>
              setProgressMap((prev) => ({ ...prev, [q.id]: updated }))
            }
            onOpenChat={(questionId, questionText) =>
              setChatQuestionContext(questionId, questionText)
            }
          />
        ))}
      </div>

      {sorted.length === 0 && (
        <div className="text-center py-20 text-muted">
          <p>No questions found.</p>
        </div>
      )}
    </div>
  );
}

// ── Individual Question Card ──

function QuestionCard({
  question: q,
  index,
  progress,
  onProgressChange,
  onOpenChat,
}: {
  question: Question;
  index: number;
  progress: StudyProgress | undefined;
  onProgressChange: (p: StudyProgress) => void;
  onOpenChat: (questionId: string, questionText: string) => void;
}) {
  const currentStatus: StatusType = (progress?.status as StatusType) ?? 'not_started';
  const statusConf = STATUS_CONFIG[currentStatus];

  const [notesOpen, setNotesOpen] = useState(false);
  const [notesText, setNotesText] = useState(progress?.notes_text ?? '');
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Sync notes text when progress changes externally
  useEffect(() => {
    setNotesText(progress?.notes_text ?? '');
  }, [progress?.notes_text]);

  // ── Status update ──
  const updateStatus = useCallback(
    async (newStatus: StatusType) => {
      if (progress) {
        // Update existing
        const { data } = await supabase
          .from('study_progress')
          .update({
            status: newStatus,
            last_reviewed_at: new Date().toISOString(),
          })
          .eq('id', progress.id)
          .select()
          .single();
        if (data) onProgressChange(data);
      } else {
        // Insert new
        const { data } = await supabase
          .from('study_progress')
          .insert({
            question_id: q.id,
            status: newStatus,
            last_reviewed_at: new Date().toISOString(),
          })
          .select()
          .single();
        if (data) onProgressChange(data);
      }
    },
    [progress, q.id, onProgressChange]
  );

  // ── Debounced notes auto-save ──
  const debouncedSaveNotes = useDebouncedCallback((text: any) => {
    (async () => {
      setSavingStatus('saving');
      if (progress) {
        const { data } = await supabase
          .from('study_progress')
          .update({ notes_text: text })
          .eq('id', progress.id)
          .select()
          .single();
        if (data) onProgressChange(data);
      } else {
        const { data } = await supabase
          .from('study_progress')
          .insert({
            question_id: q.id,
            status: 'not_started',
            notes_text: text,
          })
          .select()
          .single();
        if (data) onProgressChange(data);
      }
      setSavingStatus('saved');
      setTimeout(() => setSavingStatus('idle'), 1500);
    })();
  }, 1000);

  function handleNotesChange(text: string) {
    setNotesText(text);
    debouncedSaveNotes(text);
  }

  // ── Discuss with AI ──
  async function handleDiscussWithAI() {
    onOpenChat(q.id, q.question_text);
  }

  const freqInfo = q.frequency ? FREQUENCY_LABELS[q.frequency] : null;

  return (
    <div
      className={clsx(
        'relative rounded-xl bg-card border border-border',
        'border-l-4 transition-all duration-200',
        statusConf.border
      )}
    >
      <div className="p-5">
        {/* Top Row: Badge + Frequency + Status */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Question number */}
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-accent-subtle/40 text-accent text-xs font-bold shrink-0">
              {index}
            </span>

            {/* Frequency badge */}
            {freqInfo && (
              <span
                className={clsx(
                  'text-xs font-medium px-2.5 py-1 rounded-full border',
                  freqInfo.className
                )}
              >
                {freqInfo.label} ({q.frequency}×)
              </span>
            )}

            {/* Course outcome */}
            {q.course_outcome && (
              <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Award size={11} />
                {q.course_outcome}
              </span>
            )}
          </div>

          {/* Status Selector */}
          <div className="flex items-center gap-1 shrink-0">
            {(Object.entries(STATUS_CONFIG) as [StatusType, typeof STATUS_CONFIG[StatusType]][]).map(
              ([key, conf]) => {
                const Icon = conf.icon;
                const isActive = currentStatus === key;
                return (
                  <button
                    key={key}
                    onClick={() => updateStatus(key)}
                    title={conf.label}
                    className={clsx(
                      'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150',
                      isActive ? conf.btnActive : `border-transparent ${conf.btnIdle}`
                    )}
                  >
                    <Icon size={13} />
                    <span className="hidden sm:inline">{conf.label}</span>
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* Question Text */}
        <p className="text-[15px] leading-relaxed text-foreground/90 mb-4">
          {q.question_text}
        </p>

        {/* Exam Cycles */}
        {q.exam_cycles && q.exam_cycles.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mb-3">
            <CalendarDays size={13} className="text-muted-foreground mr-1" />
            {q.exam_cycles.map((cycle) => (
              <span
                key={cycle}
                className="text-[11px] px-2 py-0.5 rounded bg-card border border-border text-muted"
              >
                {cycle}
              </span>
            ))}
          </div>
        )}

        {/* Topic Tags */}
        {q.topic_tags && q.topic_tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mb-4">
            <Tag size={13} className="text-muted-foreground mr-1" />
            {q.topic_tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-accent-subtle/30 text-accent border border-accent/15"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Action Row */}
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-border/50">
          {/* YouTube Button */}
          {q.youtube_url ? (
            <a
              href={q.youtube_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors text-xs font-medium"
            >
              <Play size={15} />
              <span>
                Watch Tutorial
                {q.youtube_channel && (
                  <span className="ml-1 text-red-400/60">· {q.youtube_channel}</span>
                )}
              </span>
            </a>
          ) : (
            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border text-muted-foreground text-xs cursor-not-allowed">
              <Play size={15} />
              No video found
            </span>
          )}

          {/* Discuss with AI */}
          <button
            onClick={handleDiscussWithAI}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/10 border border-accent/20 text-accent hover:bg-accent/20 transition-colors text-xs font-medium"
          >
            <MessageSquare size={14} />
            Discuss with AI
          </button>

          {/* My Notes Toggle */}
          <button
            onClick={() => setNotesOpen(!notesOpen)}
            className={clsx(
              'inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ml-auto',
              notesOpen
                ? 'bg-accent/10 border-accent/20 text-accent'
                : 'bg-card border-border text-muted hover:text-foreground hover:border-border-hover'
            )}
          >
            <StickyNote size={14} />
            My Notes
            {notesOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>

        {/* Expandable Notes */}
        {notesOpen && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <textarea
              value={notesText}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Jot down your notes for this question... (auto-saves)"
              rows={4}
              className="w-full px-3 py-2.5 text-sm rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent resize-y transition-colors"
            />
            <div className="flex justify-end mt-1">
              <span
                className={clsx('text-[11px] transition-opacity', {
                  'text-muted-foreground opacity-0': savingStatus === 'idle',
                  'text-amber-400 opacity-100': savingStatus === 'saving',
                  'text-emerald-400 opacity-100': savingStatus === 'saved',
                })}
              >
                {savingStatus === 'saving' && 'Saving...'}
                {savingStatus === 'saved' && '✓ Saved'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

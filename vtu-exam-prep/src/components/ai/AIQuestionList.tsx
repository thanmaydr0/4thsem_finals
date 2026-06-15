import { useState, useEffect, useCallback, useMemo } from 'react';
import {
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
  Layers,
  List,
} from 'lucide-react';
import clsx from 'clsx';
import { supabase } from '../../lib/supabase';
import { useStudyStore } from '../../hooks/useStudyStore';
import { useDebouncedCallback } from '../../hooks/useDebounce';
import type { Question, StudyProgress } from '../../types';

type SortMode = 'sequence' | 'alphabetical' | 'outcome';
type ViewMode = 'list' | 'grouped';

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

interface AIQuestionListProps {
  questions: Question[];
  loading?: boolean;
}

export default function AIQuestionList({ questions, loading = false }: AIQuestionListProps) {
  const { selectedModuleNumber, searchQuery, setChatQuestionContext } = useStudyStore();

  const [progressMap, setProgressMap] = useState<Record<string, StudyProgress>>({});
  const [sortMode, setSortMode] = useState<SortMode>('sequence');
  const [viewMode, setViewMode] = useState<ViewMode>('list');


  // Fetch study progress
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

  // Filter by search
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
  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sortMode === 'alphabetical') {
      arr.sort((a, b) => a.question_text.localeCompare(b.question_text));
    } else if (sortMode === 'outcome') {
      arr.sort((a, b) =>
        (a.course_outcome ?? '').localeCompare(b.course_outcome ?? '')
      );
    } else {
      arr.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    }
    return arr;
  }, [filtered, sortMode]);

  // Group by topic
  const grouped = useMemo(() => {
    const tagMap = new Map<string, Question[]>();

    for (const q of sorted) {
      const tags = q.topic_tags ?? ['Uncategorized'];
      for (const tag of tags) {
        if (!tagMap.has(tag)) tagMap.set(tag, []);
        tagMap.get(tag)!.push(q);
      }
    }

    // Sort groups: most questions first (highlights repeated themes)
    return [...tagMap.entries()]
      .sort((a, b) => b[1].length - a[1].length)
      .map(([tag, qs]) => ({
        tag,
        questions: qs,
        // Deduplicate in case a question has multiple tags
        uniqueIds: new Set(qs.map((q) => q.id)),
      }));
  }, [sorted]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Controls Row */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <p className="text-sm text-muted">
          {sorted.length} question{sorted.length !== 1 ? 's' : ''}
          {selectedModuleNumber ? ` in Module ${selectedModuleNumber}` : ''}
        </p>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('list')}
              title="List view"
              className={clsx(
                'flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md font-medium transition-colors',
                viewMode === 'list'
                  ? 'bg-accent text-white'
                  : 'text-muted hover:text-foreground'
              )}
            >
              <List size={13} />
              List
            </button>
            <button
              onClick={() => setViewMode('grouped')}
              title="Group by topic"
              className={clsx(
                'flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md font-medium transition-colors',
                viewMode === 'grouped'
                  ? 'bg-accent text-white'
                  : 'text-muted hover:text-foreground'
              )}
            >
              <Layers size={13} />
              By Topic
            </button>
          </div>

          {/* Sort Toggle */}
          <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-0.5">
            <ArrowUpDown size={13} className="text-muted ml-2 mr-1" />
            {(['sequence', 'alphabetical', 'outcome'] as SortMode[]).map(
              (mode) => (
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
                  {mode === 'outcome' ? "Bloom's" : mode}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* ── List View ── */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {sorted.map((q, i) => (
            <AIQuestionCard
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
      )}

      {/* ── Grouped View ── */}
      {viewMode === 'grouped' && (
        <div className="space-y-8">
          {grouped.map(({ tag, questions: groupQs }) => (
            <TopicGroup
              key={tag}
              tag={tag}
              questions={groupQs}
              progressMap={progressMap}
              onProgressChange={(qid, updated) =>
                setProgressMap((prev) => ({ ...prev, [qid]: updated }))
              }
              onOpenChat={(questionId, questionText) =>
                setChatQuestionContext(questionId, questionText)
              }
            />
          ))}
        </div>
      )}

      {sorted.length === 0 && (
        <div className="text-center py-20 text-muted">
          <p>No questions found.</p>
        </div>
      )}
    </div>
  );
}

// ── Topic Group (for "Group by Topic" view) ──

function TopicGroup({
  tag,
  questions,
  progressMap,
  onProgressChange,
  onOpenChat,
}: {
  tag: string;
  questions: Question[];
  progressMap: Record<string, StudyProgress>;
  onProgressChange: (questionId: string, p: StudyProgress) => void;
  onOpenChat: (questionId: string, questionText: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const count = questions.length;

  return (
    <div>
      {/* Group Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-3 w-full mb-3 group"
      >
        <div className="flex items-center gap-2">
          {collapsed ? (
            <ChevronDown size={16} className="text-muted" />
          ) : (
            <ChevronUp size={16} className="text-muted" />
          )}
          <Tag size={14} className="text-accent" />
          <span className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors">
            {tag}
          </span>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-accent-subtle/40 text-accent border border-accent/20">
          {count} variation{count !== 1 ? 's' : ''}
        </span>
        {count >= 3 && (
          <span className="text-[11px] text-amber-400/80 italic">
            High-frequency theme — master the general method
          </span>
        )}
        <div className="flex-1 border-t border-border/40" />
      </button>

      {/* Group Body */}
      {!collapsed && (
        <div className="space-y-3 ml-4 pl-4 border-l-2 border-accent/20">
          {questions.map((q, i) => (
            <AIQuestionCard
              key={q.id}
              question={q}
              index={i + 1}
              progress={progressMap[q.id]}
              onProgressChange={(updated) =>
                onProgressChange(q.id, updated)
              }
              onOpenChat={onOpenChat}
              compact
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Individual Question Card ──

function AIQuestionCard({
  question: q,
  index,
  progress,
  onProgressChange,
  onOpenChat,
  compact = false,
}: {
  question: Question;
  index: number;
  progress: StudyProgress | undefined;
  onProgressChange: (p: StudyProgress) => void;
  onOpenChat: (questionId: string, questionText: string) => void;
  compact?: boolean;
}) {
  const currentStatus: StatusType =
    (progress?.status as StatusType) ?? 'not_started';
  const statusConf = STATUS_CONFIG[currentStatus];

  const [notesOpen, setNotesOpen] = useState(false);
  const [notesText, setNotesText] = useState(progress?.notes_text ?? '');
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved'>(
    'idle'
  );

  useEffect(() => {
    setNotesText(progress?.notes_text ?? '');
  }, [progress?.notes_text]);

  // ── Status update ──
  const updateStatus = useCallback(
    async (newStatus: StatusType) => {
      if (progress) {
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

  // Parse Bloom's level from course_outcome like "L2 / CO1" or "CO1 / L2"
  const bloomsMatch = q.course_outcome?.match(/L(\d)/);
  const bloomsLevel = bloomsMatch ? `L${bloomsMatch[1]}` : null;
  const coMatch = q.course_outcome?.match(/CO(\d)/);
  const courseOutcome = coMatch ? `CO${coMatch[1]}` : q.course_outcome;

  const BLOOMS_COLORS: Record<string, string> = {
    L1: 'bg-sky-500/15 text-sky-400 border-sky-500/25',
    L2: 'bg-teal-500/15 text-teal-400 border-teal-500/25',
    L3: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    L4: 'bg-rose-500/15 text-rose-400 border-rose-500/25',
  };

  return (
    <div
      className={clsx(
        'relative rounded-xl bg-card border border-border',
        'border-l-4 transition-all duration-200',
        statusConf.border,
        compact ? 'p-4' : 'p-5'
      )}
    >
      {/* Top Row */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Question number */}
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-accent-subtle/40 text-accent text-xs font-bold shrink-0">
            {index}
          </span>

          {/* Course outcome */}
          {courseOutcome && (
            <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Award size={11} />
              {courseOutcome}
            </span>
          )}

          {/* Bloom's level */}
          {bloomsLevel && (
            <span
              className={clsx(
                'text-xs font-medium px-2 py-1 rounded-full border',
                BLOOMS_COLORS[bloomsLevel] ??
                  'bg-zinc-500/15 text-zinc-400 border-zinc-500/25'
              )}
            >
              {bloomsLevel} —{' '}
              {bloomsLevel === 'L1'
                ? 'Remember'
                : bloomsLevel === 'L2'
                ? 'Understand'
                : bloomsLevel === 'L3'
                ? 'Apply'
                : 'Analyze'}
            </span>
          )}
        </div>

        {/* Status Selector */}
        <div className="flex items-center gap-1 shrink-0">
          {(
            Object.entries(STATUS_CONFIG) as [
              StatusType,
              (typeof STATUS_CONFIG)[StatusType],
            ][]
          ).map(([key, conf]) => {
            const Icon = conf.icon;
            const isActive = currentStatus === key;
            return (
              <button
                key={key}
                onClick={() => updateStatus(key)}
                title={conf.label}
                className={clsx(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150',
                  isActive
                    ? conf.btnActive
                    : `border-transparent ${conf.btnIdle}`
                )}
              >
                <Icon size={13} />
                <span className="hidden sm:inline">{conf.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Question Text */}
      <p
        className={clsx(
          'leading-relaxed text-foreground/90 mb-4',
          compact ? 'text-sm' : 'text-[15px]'
        )}
      >
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
  );
}

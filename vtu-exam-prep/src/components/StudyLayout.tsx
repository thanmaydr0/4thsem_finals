import { useState, useEffect, useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  ChevronDown,
  ChevronRight,
  Search,
  BookOpen,
  MessageSquare,
  Home,
  Layers,
  Maximize,
  Minimize,
  Keyboard,
  Download,
} from 'lucide-react';
import clsx from 'clsx';
import { supabase } from '../lib/supabase';
import { useStudyStore } from '../hooks/useStudyStore';
import AIAssistantPanel from './AIAssistantPanel';
import NotesViewer from './NotesViewer';
import ShortcutsModal from './ShortcutsModal';
import FeedbackModal from './FeedbackModal';
import type { ModuleWithStats, SubjectId } from '../types';

interface StudyLayoutProps {
  subjectId: SubjectId;
  subjectName: string;
  courseCode: string;
  children: ReactNode;
}

export default function StudyLayout({
  subjectId,
  subjectName,
  courseCode,
  children,
}: StudyLayoutProps) {
  const {
    leftSidebarOpen,
    rightSidebarOpen,
    toggleLeftSidebar,
    toggleRightSidebar,
    selectedModuleNumber,
    setSelectedModule,
    rightTab,
    setRightTab,
    searchQuery,
    setSearchQuery,
    setActiveSubject,
    focusMode,
    setFocusMode,
    toggleFocusMode,
    setShowShortcutsModal,
    setLeftSidebarOpen,
    setRightSidebarOpen,
    setShowFeedbackModal,
  } = useStudyStore();

  const [modules, setModules] = useState<ModuleWithStats[]>([]);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  const [progressCount, setProgressCount] = useState({ reviewed: 0, total: 0 });

  const mainRef = useRef<HTMLElement>(null);

  // Prevent mobile overlapping sidebars
  useEffect(() => {
    if (window.innerWidth < 1024) {
      if (leftSidebarOpen && rightSidebarOpen) {
        setLeftSidebarOpen(false);
        setRightSidebarOpen(false);
      }
    }
  }, [leftSidebarOpen, rightSidebarOpen, setLeftSidebarOpen, setRightSidebarOpen]);

  const handleToggleLeftSidebar = () => {
    if (!leftSidebarOpen && window.innerWidth < 1024 && rightSidebarOpen) {
      setRightSidebarOpen(false);
    }
    toggleLeftSidebar();
  };

  const handleToggleRightSidebar = () => {
    if (!rightSidebarOpen && window.innerWidth < 1024 && leftSidebarOpen) {
      setLeftSidebarOpen(false);
    }
    toggleRightSidebar();
  };

  // Keyboard Shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger if user is typing in an input/textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        if (e.key === 'Escape') {
          (document.activeElement as HTMLElement).blur();
        }
        return;
      }

      switch (e.key) {
        case 'j':
          mainRef.current?.scrollBy({ top: window.innerHeight * 0.4, behavior: 'smooth' });
          break;
        case 'k':
          mainRef.current?.scrollBy({ top: -window.innerHeight * 0.4, behavior: 'smooth' });
          break;
        case 'n':
          setRightTab('notes');
          setRightSidebarOpen(true);
          break;
        case 'a':
          setRightTab('chat');
          setRightSidebarOpen(true);
          break;
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
          setSelectedModule(parseInt(e.key));
          break;
        case '0':
          setSelectedModule(null);
          break;
        case 'f':
          toggleFocusMode();
          break;
        case '?':
          setShowShortcutsModal(true);
          break;
        case 'Escape':
          setShowShortcutsModal(false);
          // If in focus mode, exit it? Optional. Let's just exit focus mode on escape.
          setFocusMode(false);
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    setRightTab,
    setRightSidebarOpen,
    setSelectedModule,
    toggleFocusMode,
    setShowShortcutsModal,
    setFocusMode,
  ]);

  // Set active subject on mount
  useEffect(() => {
    setActiveSubject(subjectId);
  }, [subjectId, setActiveSubject]);

  // Fetch modules with question stats
  useEffect(() => {
    async function fetchModules() {
      const { data: modulesData } = await supabase
        .from('modules')
        .select('*')
        .eq('subject_id', subjectId)
        .order('module_number');

      if (!modulesData) return;

      const modulesWithStats: ModuleWithStats[] = await Promise.all(
        modulesData.map(async (mod) => {
          const { data: questions } = await supabase
            .from('questions')
            .select('id, frequency')
            .eq('module_id', mod.id);

          const count = questions?.length ?? 0;
          const frequencies = questions
            ?.map((q) => q.frequency)
            .filter((f): f is number => f !== null) ?? [];
          const avgFreq =
            frequencies.length > 0
              ? frequencies.reduce((a, b) => a + b, 0) / frequencies.length
              : null;

          return {
            ...mod,
            questionCount: count,
            avgFrequency: avgFreq,
          };
        })
      );
      setModules(modulesWithStats);
    }

    fetchModules();
  }, [subjectId]);

  // Fetch progress stats
  useEffect(() => {
    async function fetchProgress() {
      const { count: totalCount } = await supabase
        .from('questions')
        .select('id', { count: 'exact', head: true })
        .eq('subject_id', subjectId);

      const { count: reviewedCount } = await supabase
        .from('study_progress')
        .select('id, questions!inner(subject_id)', { count: 'exact', head: true })
        .eq('questions.subject_id', subjectId)
        .in('status', ['reviewing', 'confident']);

      setProgressCount({
        reviewed: reviewedCount ?? 0,
        total: totalCount ?? 0,
      });
    }

    fetchProgress();
  }, [subjectId]);


  function toggleModuleExpanded(moduleNumber: number) {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleNumber)) {
        next.delete(moduleNumber);
      } else {
        next.add(moduleNumber);
      }
      return next;
    });
  }

  const progressPercent =
    progressCount.total > 0
      ? Math.round((progressCount.reviewed / progressCount.total) * 100)
      : 0;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background relative">
      <ShortcutsModal />
      <FeedbackModal />

      {/* ── Sticky Header ── */}
      {!focusMode && (
        <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface/80 backdrop-blur-sm z-20 shrink-0">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 p-2 text-muted hover:text-foreground transition-colors"
          >
            <Home size={18} />
          </Link>

          <div className="h-5 w-px bg-border" />

          <div>
            <h1 className="text-base sm:text-lg font-semibold leading-tight truncate max-w-[120px] sm:max-w-xs">
              {subjectName}
            </h1>
            <p className="text-xs text-muted truncate max-w-[120px] sm:max-w-xs">{courseCode}</p>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center gap-3">
          <div className="text-right mr-2 hidden sm:block">
            <p className="text-sm font-medium">
              <span className="text-accent">{progressCount.reviewed}</span>
              <span className="text-muted"> / {progressCount.total} reviewed</span>
            </p>
          </div>
          <div className="w-20 sm:w-32 h-2 rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent to-purple-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs text-muted font-medium w-9 text-right hidden sm:block">
            {progressPercent}%
          </span>
          <div className="h-5 w-px bg-border mx-1" />
          <button
            onClick={() => setShowShortcutsModal(true)}
            className="p-1.5 rounded-md text-muted hover:text-foreground hover:bg-card transition-colors hidden sm:block"
            title="Keyboard Shortcuts (?)"
          >
            <Keyboard size={16} />
          </button>
          <button
            onClick={toggleFocusMode}
            className="p-2 rounded-md text-muted hover:text-accent hover:bg-accent-subtle/30 transition-colors"
            title="Focus Mode (f)"
          >
            <Maximize size={16} />
          </button>
        </div>
      </header>
      )}

      {/* ── 3-Panel Body ── */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar Overlay Backdrop (mobile) */}
        {!focusMode && leftSidebarOpen && (
          <div
            className="fixed inset-0 bg-background/50 backdrop-blur-sm z-30 lg:hidden"
            onClick={handleToggleLeftSidebar}
          />
        )}

        {/* ── Left Sidebar ── */}
        {!focusMode && (
          <aside
            className={clsx(
              'panel-transition flex flex-col border-r border-border bg-surface/95 lg:bg-surface/50 shrink-0 overflow-hidden',
              'fixed lg:relative inset-y-0 left-0 z-40 lg:z-auto h-full',
              leftSidebarOpen ? 'w-[280px] min-w-[280px] translate-x-0' : 'w-[280px] -translate-x-full lg:w-0 lg:min-w-0 lg:translate-x-0'
            )}
          >
          {leftSidebarOpen && (
            <div className="flex flex-col h-full">
              {/* Search */}
              <div className="p-3 border-b border-border">
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    type="text"
                    placeholder="Search questions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors min-h-[44px]"
                  />
                </div>
              </div>

              {/* All Modules toggle */}
              <button
                onClick={() => setSelectedModule(null)}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b border-border transition-colors',
                  selectedModuleNumber === null
                    ? 'text-accent bg-accent-subtle/30'
                    : 'text-muted hover:text-foreground hover:bg-card'
                )}
              >
                <Layers size={15} />
                All Modules
              </button>

              {/* Module List */}
              <nav className="flex-1 overflow-y-auto py-1 flex flex-col">
                <div>
                  {modules.map((mod) => {
                    const isSelected = selectedModuleNumber === mod.module_number;
                    const isExpanded = expandedModules.has(mod.module_number);

                    return (
                      <div key={mod.id}>
                        <button
                          onClick={() => {
                            setSelectedModule(mod.module_number);
                            toggleModuleExpanded(mod.module_number);
                          }}
                          className={clsx(
                            'w-full flex items-start gap-2 px-4 py-3 text-left transition-colors',
                            isSelected
                              ? 'bg-accent-subtle/30 text-accent'
                              : 'text-foreground/80 hover:bg-card hover:text-foreground'
                          )}
                        >
                          <span className="mt-0.5">
                            {isExpanded ? (
                              <ChevronDown size={14} />
                            ) : (
                              <ChevronRight size={14} />
                            )}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium truncate">
                                Module {mod.module_number}
                              </span>
                            </div>
                            <p className="text-xs text-muted truncate mt-0.5">
                              {mod.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-xs px-1.5 py-0.5 rounded bg-card border border-border text-muted">
                                {mod.questionCount} Qs
                              </span>
                              {subjectId === 'ada' && mod.avgFrequency !== null && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-accent-subtle/40 text-accent border border-accent/20">
                                  freq {mod.avgFrequency.toFixed(1)}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>

                        {/* Expanded description */}
                        {isExpanded && (
                          <div className="px-10 pb-3 text-xs text-muted leading-relaxed">
                            {mod.description}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Previous Papers Section */}
                <div className="mt-4 px-4 pb-2">
                  <h3 className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">
                    Previous Papers
                  </h3>
                  <div className="space-y-1">
                    {['july2024.pdf', 'jan2025.pdf', 'july2025.pdf', 'jan2026.pdf'].map((file) => (
                      <a
                        key={file}
                        href={`/papers/${subjectId}/${file}`}
                        download
                        className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-foreground/80 hover:bg-accent-subtle/20 hover:text-accent rounded-lg transition-colors group"
                      >
                        <Download size={14} className="text-muted group-hover:text-accent transition-colors shrink-0" />
                        <span className="truncate capitalize">{file.replace('.pdf', '')}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </nav>

              {/* Developer Credit Footer in Sidebar */}
              <div className="p-4 border-t border-border mt-auto shrink-0 flex flex-col items-center">
                <button
                  onClick={() => setShowFeedbackModal(true)}
                  className="w-full py-2.5 mb-4 text-xs font-semibold bg-accent/10 text-accent hover:bg-accent/20 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  Give Feedback
                </button>

                <div className="opacity-50 hover:opacity-100 transition-opacity text-center w-full">
                  <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-2">
                    Developed by Thanmay D R
                  </p>
                  <div className="flex flex-col items-center gap-1.5">
                    <p className="text-[11px] text-muted-foreground/70">
                      <a href="mailto:thanmaydambekodi@gmail.com" className="hover:text-accent transition-colors">
                        thanmaydambekodi@gmail.com
                      </a>
                    </p>
                    <p className="text-[11px] text-muted-foreground/70">
                      <a href="https://github.com/thanmaydr0" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors flex items-center gap-1">
                        <GithubIcon size={10} /> thanmaydr0
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          </aside>
        )}

        {/* Left sidebar toggle (always visible on desktop, visible on mobile if closed) */}
        {!focusMode && (
          <button
            onClick={handleToggleLeftSidebar}
            className="hidden lg:flex items-center justify-center w-6 shrink-0 border-r border-border hover:bg-card transition-colors group z-10"
            title={leftSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {leftSidebarOpen ? (
              <PanelLeftClose
                size={14}
                className="text-muted group-hover:text-foreground transition-colors"
              />
            ) : (
              <PanelLeftOpen
                size={14}
                className="text-muted group-hover:text-foreground transition-colors"
              />
            )}
          </button>
        )}

        {/* Mobile menu toggle (floating) */}
        {!focusMode && (
          <button
            onClick={handleToggleLeftSidebar}
            className={clsx(
              "lg:hidden fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-6 z-50 p-3.5 rounded-full border shadow-2xl transition-all duration-200",
              leftSidebarOpen ? "bg-accent border-accent text-white" : "bg-surface border-border text-foreground"
            )}
          >
            {leftSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
          </button>
        )}

        {/* ── Center Panel ── */}
        <main ref={mainRef} className="flex-1 overflow-y-auto p-4 sm:p-6 relative">
          {focusMode && (
            <button
              onClick={() => setFocusMode(false)}
              className="fixed top-4 right-6 z-50 flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-full bg-surface border border-border shadow-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:border-accent transition-colors"
            >
              <Minimize size={14} />
              Exit Focus
            </button>
          )}
          {children}
        </main>

        {/* Right sidebar toggle (always visible on desktop) */}
        {!focusMode && (
          <button
            onClick={handleToggleRightSidebar}
            className="hidden lg:flex items-center justify-center w-6 shrink-0 border-l border-border hover:bg-card transition-colors group z-10"
            title={rightSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {rightSidebarOpen ? (
              <PanelRightClose
                size={14}
                className="text-muted group-hover:text-foreground transition-colors"
              />
            ) : (
              <PanelRightOpen
                size={14}
                className="text-muted group-hover:text-foreground transition-colors"
              />
            )}
          </button>
        )}

        {/* Mobile notes toggle (floating) */}
        {!focusMode && (
          <button
            onClick={handleToggleRightSidebar}
            className={clsx(
              "lg:hidden fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] right-6 z-50 p-3.5 rounded-full border shadow-2xl transition-all duration-200",
              rightSidebarOpen ? "bg-accent border-accent text-white" : "bg-surface border-border text-foreground"
            )}
          >
            {rightSidebarOpen ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
          </button>
        )}

        {/* Right Sidebar Overlay Backdrop (mobile) */}
        {!focusMode && rightSidebarOpen && (
          <div
            className="fixed inset-0 bg-background/50 backdrop-blur-sm z-30 lg:hidden"
            onClick={handleToggleRightSidebar}
          />
        )}

        {/* ── Right Sidebar ── */}
        {!focusMode && (
          <aside
            className={clsx(
              'panel-transition flex flex-col border-l border-border bg-surface/95 lg:bg-surface/50 shrink-0 overflow-hidden',
              'fixed lg:relative inset-y-0 right-0 z-40 lg:z-auto h-full',
              rightSidebarOpen ? 'w-[min(320px,85vw)] min-w-[min(320px,85vw)] translate-x-0' : 'w-[min(320px,85vw)] translate-x-full lg:w-0 lg:min-w-0 lg:translate-x-0'
            )}
          >
          {rightSidebarOpen && (
            <div className="flex flex-col h-full">
              {/* Tabs */}
              <div className="flex border-b border-border shrink-0">
                <button
                  onClick={() => setRightTab('notes')}
                  className={clsx(
                    'flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
                    rightTab === 'notes'
                      ? 'text-accent border-b-2 border-accent'
                      : 'text-muted hover:text-foreground'
                  )}
                >
                  <BookOpen size={15} />
                  Notes
                </button>
                <button
                  onClick={() => setRightTab('chat')}
                  className={clsx(
                    'flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
                    rightTab === 'chat'
                      ? 'text-accent border-b-2 border-accent'
                      : 'text-muted hover:text-foreground'
                  )}
                >
                  <MessageSquare size={15} />
                  AI Assistant
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto">
                {rightTab === 'notes' && (
                  <NotesViewer subjectId={subjectId} modules={modules} />
                )}
                {rightTab === 'chat' && <AIAssistantPanel />}
              </div>
            </div>
          )}
          </aside>
        )}
      </div>
    </div>
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


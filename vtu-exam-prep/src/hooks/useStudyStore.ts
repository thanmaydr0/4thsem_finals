import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SubjectId } from '../types';

interface StudyLayoutState {
  // Sidebar visibility
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  setRightSidebarOpen: (open: boolean) => void;

  // Focus Mode
  focusMode: boolean;
  toggleFocusMode: () => void;
  setFocusMode: (active: boolean) => void;

  // Shortcuts Modal
  showShortcutsModal: boolean;
  setShowShortcutsModal: (show: boolean) => void;

  // Feedback Modal
  showFeedbackModal: boolean;
  setShowFeedbackModal: (show: boolean) => void;

  // Module selection (persisted per subject)
  selectedModuleNumber: number | null; // null = "All Modules"
  setSelectedModule: (moduleNumber: number | null) => void;

  // Right sidebar active tab
  rightTab: 'notes' | 'chat';
  setRightTab: (tab: 'notes' | 'chat') => void;

  // Search / filter
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Active subject context (set when entering a study page)
  activeSubject: SubjectId | null;
  setActiveSubject: (subject: SubjectId) => void;

  // Chat state
  chatSessionId: string | null;
  chatQuestionId: string | null;
  chatQuestionContext: string | null;
  setChatSession: (sessionId: string | null) => void;
  setChatQuestionContext: (
    questionId: string | null,
    questionText: string | null
  ) => void;
  clearChatContext: () => void;
  startNewChat: () => void;

  // AI Access Restriction
  hasAiAccess: boolean;
  setHasAiAccess: (access: boolean) => void;
}

export const useStudyStore = create<StudyLayoutState>()(
  persist(
    (set) => ({
      leftSidebarOpen: true,
      rightSidebarOpen: true,
      toggleLeftSidebar: () =>
        set((s) => ({ leftSidebarOpen: !s.leftSidebarOpen })),
      toggleRightSidebar: () =>
        set((s) => ({ rightSidebarOpen: !s.rightSidebarOpen })),
      setRightSidebarOpen: (open) => set({ rightSidebarOpen: open }),

      focusMode: false,
      toggleFocusMode: () => set((s) => ({ focusMode: !s.focusMode })),
      setFocusMode: (active) => set({ focusMode: active }),

      showShortcutsModal: false,
      setShowShortcutsModal: (show) => set({ showShortcutsModal: show }),

      showFeedbackModal: false,
      setShowFeedbackModal: (show) => set({ showFeedbackModal: show }),

      selectedModuleNumber: null,
      setSelectedModule: (moduleNumber) =>
        set({ selectedModuleNumber: moduleNumber }),

      rightTab: 'notes',
      setRightTab: (tab) => set({ rightTab: tab }),

      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),

      activeSubject: null,
      setActiveSubject: (subject) => set({ activeSubject: subject }),

      // Chat
      chatSessionId: null,
      chatQuestionId: null,
      chatQuestionContext: null,

      setChatSession: (sessionId) => set({ chatSessionId: sessionId }),

      setChatQuestionContext: (questionId, questionText) =>
        set({
          chatQuestionId: questionId,
          chatQuestionContext: questionText,
          // Also open the chat tab and right sidebar
          rightTab: 'chat',
          rightSidebarOpen: true,
        }),

      clearChatContext: () =>
        set({
          chatQuestionId: null,
          chatQuestionContext: null,
        }),

      startNewChat: () =>
        set({
          chatSessionId: null,
          chatQuestionId: null,
          chatQuestionContext: null,
        }),

      hasAiAccess: false,
      setHasAiAccess: (access) => set({ hasAiAccess: access }),
    }),
    {
      name: 'vtu-study-layout',
      partialize: (state) => ({
        leftSidebarOpen: state.leftSidebarOpen,
        rightSidebarOpen: state.rightSidebarOpen,
        selectedModuleNumber: state.selectedModuleNumber,
        rightTab: state.rightTab,
        activeSubject: state.activeSubject,
        chatSessionId: state.chatSessionId,
        hasAiAccess: state.hasAiAccess,
      }),
    }
  )
);

import { useState, useEffect, useRef } from 'react';
import {
  Send,
  X,
  Plus,
  Pin,
  RotateCcw,
  Sparkles,
  BookOpen,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';
import clsx from 'clsx';
import { supabase } from '../lib/supabase';
import { sendChatMessage } from '../lib/edgeFunctions';
import { sendDBMSChatMessage } from '../lib/openai';
import { useStudyStore } from '../hooks/useStudyStore';
import type { ChatMessage } from '../types';

type ChatMode = 'tutor' | 'notes';

const QUICK_ACTIONS = [
  { label: 'Explain this simply', icon: Sparkles },
  { label: 'Give me a worked solution', icon: BookOpen },
  { label: 'Quiz me on this topic', icon: HelpCircle },
];

const DBMS_QUICK_ACTIONS = [
  { label: '⭐ High frequency topics', icon: Sparkles },
  { label: 'Explain ER to Relational mapping', icon: BookOpen },
  { label: 'Walk me through 2PL', icon: HelpCircle },
  { label: 'Solve a normalization example', icon: Sparkles },
  { label: 'MongoDB CRUD syntax', icon: BookOpen },
];

export default function AIAssistantPanel() {
  const {
    activeSubject,
    chatSessionId,
    chatQuestionContext,
    setChatSession,
    clearChatContext,
    startNewChat,
  } = useStudyStore();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const [chatMode, setChatMode] = useState<ChatMode>('tutor');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Context injection: Pre-fill input when question context is set
  useEffect(() => {
    if (chatQuestionContext && activeSubject === 'dbms') {
      setInputValue(`Explain how to answer: ${chatQuestionContext}`);
      clearChatContext();
      inputRef.current?.focus();
    }
  }, [chatQuestionContext, activeSubject, clearChatContext]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Load existing chat history when session changes
  useEffect(() => {
    async function loadHistory() {
      if (!chatSessionId) {
        setMessages([]);
        return;
      }

      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', chatSessionId)
        .order('created_at', { ascending: true });

      setMessages(data ?? []);
    }

    loadHistory();
  }, [chatSessionId]);

  // Focus input when panel opens
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSend(text?: string) {
    const messageText = text ?? inputValue.trim();
    if (!messageText || !activeSubject || isLoading) return;

    setInputValue('');
    setError(null);
    setLastFailedMessage(null);

    // Optimistic: add user message to UI
    const optimisticUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      session_id: chatSessionId ?? '',
      role: 'user',
      content: messageText,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUserMsg]);
    setIsLoading(true);

    try {
      let studentName = null;
      try {
        const profileStr = localStorage.getItem('vtu_local_profile');
        if (profileStr) {
          studentName = JSON.parse(profileStr).name;
        }
      } catch (e) {}

      let result;
      
      if (activeSubject === 'dbms') {
        const dbmsRes = await sendDBMSChatMessage({
          sessionId: chatSessionId,
          message: messageText,
          questionContext: chatQuestionContext,
          studentName: null,
          useRag: chatMode === 'notes',
        });
        
        result = dbmsRes;
      } else {
        result = await sendChatMessage({
          sessionId: chatSessionId,
          message: messageText,
          subjectId: activeSubject,
          questionContext: chatQuestionContext,
          studentName,
        });
      }

      // Update session ID if newly created
      if (!chatSessionId) {
        setChatSession(result.sessionId);
      }

      // Add assistant reply
      const assistantMsg: ChatMessage = {
        id: `temp-reply-${Date.now()}`,
        session_id: result.sessionId,
        role: 'assistant',
        content: result.reply,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Something went wrong.';
      setError(errorMessage);
      setLastFailedMessage(messageText);
      // Remove optimistic user message on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUserMsg.id));
    } finally {
      setIsLoading(false);
    }
  }

  function handleRetry() {
    if (lastFailedMessage) {
      handleSend(lastFailedMessage);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleNewChat() {
    startNewChat();
    setMessages([]);
    setError(null);
    setLastFailedMessage(null);
  }

  const truncatedContext = chatQuestionContext
    ? chatQuestionContext.length > 60
      ? chatQuestionContext.slice(0, 60) + '…'
      : chatQuestionContext
    : null;

  return (
    <div className="flex flex-col h-full relative">
      {/* Clear Chat Button (Absolute Top Right) */}
      <div className="absolute top-2 right-2 flex gap-1 z-10">
        <button
          onClick={handleNewChat}
          className="p-2 text-muted hover:text-foreground transition-colors"
          title="Clear chat history"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* Mode Toggle */}
      {activeSubject === 'dbms' && (
        <div className="px-3 py-2 border-b border-border shrink-0 bg-background/50 backdrop-blur-sm z-10">
          <div className="flex p-1 bg-surface rounded-lg border border-border">
            <button
              onClick={() => {
                if (chatMode !== 'tutor') {
                  setChatMode('tutor');
                  handleNewChat();
                }
              }}
              className={clsx(
                "flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-2",
                chatMode === 'tutor' 
                  ? "bg-accent text-accent-foreground shadow" 
                  : "text-muted hover:text-foreground"
              )}
            >
              <Sparkles size={14} /> Tutor
            </button>
            <button
              onClick={() => {
                if (chatMode !== 'notes') {
                  setChatMode('notes');
                  handleNewChat();
                }
              }}
              className={clsx(
                "flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-2",
                chatMode === 'notes' 
                  ? "bg-emerald-500 text-white shadow" 
                  : "text-muted hover:text-foreground"
              )}
            >
              <BookOpen size={14} /> Doc Chat
            </button>
          </div>
        </div>
      )}

      {/* Question Context Banner */}
      {truncatedContext && chatMode === 'tutor' && (
        <div className="flex items-start gap-2 px-3 py-2.5 bg-accent-subtle/20 border-b border-accent/15 shrink-0">
          <Pin size={13} className="text-accent mt-0.5 shrink-0" />
          <p className="text-xs text-accent/80 leading-snug flex-1 min-w-0">
            <span className="font-medium text-accent">Discussing:</span>{' '}
            {truncatedContext}
          </p>
          <button
            onClick={clearChatContext}
            className="p-2 text-muted hover:text-foreground transition-colors shrink-0"
            title="Clear context"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            {chatMode === 'notes' ? (
              <>
                <BookOpen size={28} className="text-emerald-500/50 mb-3" />
                <p className="text-sm font-semibold text-emerald-500 mb-1">
                  Chat with Notes
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  I will answer your questions strictly based on the PDFs and handwritten notes you uploaded.
                </p>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-left max-w-[240px] mx-auto">
                  <p className="text-xs text-emerald-500/80 mb-2 font-medium">How it works:</p>
                  <ol className="text-[10px] text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Open the Notes tab on the left</li>
                    <li>Click <span className="text-emerald-400 font-semibold">Upload</span> to add your PDFs or images</li>
                    <li>The AI instantly reads and indexes them</li>
                    <li>Ask questions here and the AI will cite your notes!</li>
                  </ol>
                </div>
              </>
            ) : (
              <>
                <Sparkles size={28} className="text-muted-foreground mb-3" />
                <p className="text-sm text-muted mb-1">
                  Ask anything about{' '}
                  {activeSubject === 'ada' ? 'ADA' : activeSubject === 'dbms' ? 'DBMS' : activeSubject === 'uhv' ? 'UHV' : 'AI'}
                </p>
                <p className="text-xs text-muted-foreground">
                  I'll help you understand concepts and prepare for your exam.
                </p>
              </>
            )}
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full bg-accent-subtle/40 flex items-center justify-center shrink-0">
              <Sparkles size={12} className="text-accent" />
            </div>
            <div className="px-3 py-2.5 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
            <AlertTriangle size={14} className="text-red-400 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-red-400">{error}</p>
              {lastFailedMessage && (
                <button
                  onClick={handleRetry}
                  className="inline-flex items-center gap-1 mt-1.5 py-1.5 px-3 text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  <RotateCcw size={11} />
                  Retry
                </button>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions (only when there's a question context and no messages yet, or just no messages yet for DBMS) */}
      {messages.length === 0 && !isLoading && (
        <div className="flex items-center gap-1.5 px-3 pb-2 shrink-0 flex-wrap">
          {(activeSubject === 'dbms' ? DBMS_QUICK_ACTIONS : chatQuestionContext ? QUICK_ACTIONS : []).map((action) => (
            <button
              key={action.label}
              onClick={() => handleSend(action.label)}
              className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-card border border-border text-xs text-muted hover:text-accent hover:border-accent/30 transition-colors"
            >
              <action.icon size={12} />
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-border p-3 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={handleNewChat}
            className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-muted hover:text-foreground hover:bg-card border border-border transition-colors"
            title="New chat"
          >
            <Plus size={15} />
          </button>
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question..."
              rows={1}
              className="w-full px-3 py-2 text-sm rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent resize-none transition-colors"
              style={{ maxHeight: 80 }}
            />
          </div>
          <button
            onClick={() => handleSend()}
            disabled={!inputValue.trim() || isLoading}
            className={clsx(
              'shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all',
              inputValue.trim() && !isLoading
                ? 'bg-accent text-white hover:bg-accent-hover'
                : 'bg-card border border-border text-muted-foreground cursor-not-allowed'
            )}
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Message Bubble ──

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div
      className={clsx('flex items-start gap-2', isUser ? 'flex-row-reverse' : '')}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="w-6 h-6 rounded-full bg-accent-subtle/40 flex items-center justify-center shrink-0">
          <Sparkles size={12} className="text-accent" />
        </div>
      )}

      {/* Bubble */}
      <div
        className={clsx(
          'max-w-[85%] px-3 py-2.5 rounded-xl text-sm leading-relaxed',
          isUser
            ? 'bg-accent text-white rounded-tr-sm'
            : 'bg-card border border-border text-foreground/90 rounded-tl-sm'
        )}
      >
        {/* Render with basic line breaks */}
        {message.content.split('\n').map((line, i) => (
          <span key={i}>
            {line}
            {i < message.content.split('\n').length - 1 && <br />}
          </span>
        ))}
      </div>
    </div>
  );
}

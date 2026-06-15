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
import { useStudyStore } from '../hooks/useStudyStore';
import type { ChatMessage } from '../types';

const QUICK_ACTIONS = [
  { label: 'Explain this simply', icon: Sparkles },
  { label: 'Give me a worked solution', icon: BookOpen },
  { label: 'Quiz me on this topic', icon: HelpCircle },
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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
      const result = await sendChatMessage({
        sessionId: chatSessionId,
        message: messageText,
        subjectId: activeSubject,
        questionContext: chatQuestionContext,
      });

      // Update session ID if newly created
      if (!chatSessionId && result.sessionId) {
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
    <div className="flex flex-col h-full">
      {/* Question Context Banner */}
      {truncatedContext && (
        <div className="flex items-start gap-2 px-3 py-2.5 bg-accent-subtle/20 border-b border-accent/15 shrink-0">
          <Pin size={13} className="text-accent mt-0.5 shrink-0" />
          <p className="text-[11px] text-accent/80 leading-snug flex-1 min-w-0">
            <span className="font-medium text-accent">Discussing:</span>{' '}
            {truncatedContext}
          </p>
          <button
            onClick={clearChatContext}
            className="text-muted hover:text-foreground transition-colors shrink-0"
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
            <Sparkles size={28} className="text-muted-foreground mb-3" />
            <p className="text-sm text-muted mb-1">
              Ask anything about{' '}
              {activeSubject === 'ada' ? 'ADA' : 'AI'}
            </p>
            <p className="text-[11px] text-muted-foreground">
              I'll help you understand concepts and prepare for your exam.
            </p>
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
                  className="inline-flex items-center gap-1 mt-1.5 text-[11px] text-red-400 hover:text-red-300 transition-colors"
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

      {/* Quick Actions (only when there's a question context and no messages yet) */}
      {chatQuestionContext && messages.length === 0 && !isLoading && (
        <div className="flex items-center gap-1.5 px-3 pb-2 shrink-0 flex-wrap">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => handleSend(action.label)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-card border border-border text-[11px] text-muted hover:text-accent hover:border-accent/30 transition-colors"
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
            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-foreground hover:bg-card border border-border transition-colors"
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
              'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all',
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

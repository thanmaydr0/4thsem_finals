import { useState, useEffect, useRef } from 'react';
import { Send, KeyRound, MessageSquare, X, Ghost } from 'lucide-react';
import clsx from 'clsx';
import { supabase } from '../lib/supabase';
import { getStudentName } from '../lib/auth';

interface ChatMessage {
  id: string;
  student_name: string;
  message: string;
  created_at: string;
}

export default function SecretChatModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load unlock state
  useEffect(() => {
    if (localStorage.getItem('vtu_secret_chat_unlocked_v3') === 'true') {
      setIsUnlocked(true);
    }
  }, []);

  // Fetch messages and subscribe when unlocked
  useEffect(() => {
    if (!isOpen || !isUnlocked) return;

    async function fetchMessages() {
      const { data, error } = await supabase
        .from('secret_chat')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('Fetch error:', error);
        setError('Database error: Did you run the SQL migration?');
      } else if (data) {
        setMessages(data.reverse());
      }
    }

    fetchMessages();

    const channel = supabase
      .channel('public:secret_chat')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'secret_chat' },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, isUnlocked]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (!isOpen) return null;

  function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    if (token === 'iamscrewed') {
      setIsUnlocked(true);
      localStorage.setItem('vtu_secret_chat_unlocked_v3', 'true');
      setError('');
    } else {
      setError('Invalid token.');
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text || isSending) return;

    setIsSending(true);
    setNewMessage('');

    try {
      const studentName = getStudentName() || 'Anonymous Operative';
      const { error } = await supabase.from('secret_chat').insert({
        student_name: studentName,
        message: text,
      });
      if (error) {
        console.error('Insert error:', error);
        setError('Failed to send: ' + error.message);
      }
    } catch (err: any) {
      console.error('Failed to send:', err);
      setError('Failed to send: ' + err.message);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200 flex flex-col h-[600px] max-h-[80vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-border bg-surface flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ghost size={18} className="text-accent" />
            <h2 className="font-bold">Secret Channel</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-accent/10 rounded-lg text-muted-foreground transition-colors">
            <X size={18} />
          </button>
        </div>

        {!isUnlocked ? (
          // Gatekeeper UI
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-background/50">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-6">
              <KeyRound size={32} className="text-accent" />
            </div>
            <h3 className="text-xl font-bold mb-2">Encrypted Channel</h3>
            <p className="text-sm text-muted-foreground mb-8">
              Enter the access token to join the global operative channel.
            </p>
            <form onSubmit={handleUnlock} className="w-full space-y-4">
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Access Token"
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all text-center"
                autoFocus
              />
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button
                type="submit"
                className="w-full py-3 bg-accent text-accent-foreground font-semibold rounded-xl hover:bg-accent/90 transition-all"
              >
                Unlock
              </button>
            </form>
          </div>
        ) : (
          // Chat Room UI
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50 scroll-smooth">
              {error && (
                <div className="mx-4 mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl text-center">
                  {error}
                </div>
              )}
              {messages.length === 0 && !error && (
                <div className="h-full flex items-center justify-center text-center text-muted-foreground p-8">
                  <div>
                    <MessageSquare size={32} className="mx-auto mb-3 opacity-50" />
                    <p className="text-sm">The channel is quiet.</p>
                    <p className="text-xs opacity-70 mt-1">Be the first to drop a message.</p>
                  </div>
                </div>
              )}
              {messages.map((msg) => {
                const isMe = msg.student_name === getStudentName();
                return (
                  <div key={msg.id} className={clsx("flex flex-col", isMe ? "items-end" : "items-start")}>
                    <span className="text-[10px] text-muted-foreground px-1 mb-1 font-mono tracking-wider">
                      {msg.student_name}
                    </span>
                    <div className={clsx(
                      "px-4 py-2 rounded-2xl max-w-[85%] text-sm",
                      isMe 
                        ? "bg-accent text-accent-foreground rounded-tr-sm" 
                        : "bg-surface border border-border rounded-tl-sm"
                    )}>
                      {msg.message}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-surface border-t border-border">
              <form onSubmit={handleSend} className="relative flex items-center">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Broadcast message..."
                  className="w-full bg-background border border-border rounded-full pl-4 pr-12 py-3 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent text-sm transition-all"
                  disabled={isSending}
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || isSending}
                  className="absolute right-2 p-2 bg-accent text-accent-foreground rounded-full hover:bg-accent/90 disabled:opacity-50 disabled:hover:bg-accent transition-all"
                >
                  <Send size={16} className={clsx(isSending && "animate-pulse")} />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

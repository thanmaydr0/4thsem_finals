import { useState, useEffect } from 'react';
import {
  Lock,
  Ghost,
  Database,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAnalytics } from '../hooks/useAnalytics';
import { supabase } from '../lib/supabase';

import FeedbackModal from '../components/FeedbackModal';
import SecretChatModal from '../components/SecretChatModal';

export default function Home() {
  useAnalytics();
  const [isSecretChatOpen, setIsSecretChatOpen] = useState(false);
  const [dbmsCount, setDbmsCount] = useState<number | null>(null);

  useEffect(() => {
    document.title = "VTU Exam Prep";
    async function fetchCounts() {
      const { count } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('subject_id', 'dbms');
      if (count !== null) setDbmsCount(count);
    }
    fetchCounts();
  }, []);

  function handleLockSession() {
    localStorage.removeItem('vtu_auth_session');
    window.dispatchEvent(new Event('vtu-auth-changed'));
  }

  return (
    <div className="flex flex-col items-center min-h-screen py-10 px-4 max-w-4xl mx-auto space-y-12 relative">
      <button
        onClick={handleLockSession}
        className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
        title="Lock Session"
      >
        <Lock size={16} />
        <span className="hidden sm:inline">Lock Session</span>
      </button>

      <FeedbackModal />
      
      {/* Header & Countdown */}
      <div className="w-full text-center space-y-6">
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-accent to-purple-400 bg-clip-text text-transparent">
            VTU Exam Prep
          </h1>
          <p className="text-muted text-lg">4th Semester Finals</p>
        </div>

      </div>

      {/* Subjects Grid */}
      <div className="w-full max-w-xl mx-auto mt-4">
        <Link
          to="/dbms"
          className="group relative bg-card border border-border p-6 rounded-2xl hover:shadow-lg transition-all duration-300 flex flex-col hover:border-[#1E6B6B]/50 hover:shadow-[#1E6B6B]/5"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 bg-[#1E6B6B]/15">
                <Database size={26} className="text-[#1E6B6B]" />
              </div>
              <div>
                <h2 className="text-2xl font-bold transition-colors group-hover:text-[#1E6B6B]">
                  DBMS · BCS403
                </h2>
                <p className="text-sm font-medium text-muted-foreground">Database Management Systems</p>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-muted group-hover:text-foreground group-hover:border-border-hover transition-all">
              <ArrowRight size={18} />
            </div>
          </div>
          
          <p className="text-sm text-foreground/80 mb-6 italic">
            "From ER Models to MongoDB — Full Stack DB Theory"
          </p>

          <div className="mt-auto pt-4 border-t border-border/50">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#1E6B6B]/10 text-[#1E6B6B] text-[11px] font-semibold tracking-wide uppercase">
                5 Modules
              </span>
              {dbmsCount !== null && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#1E6B6B]/10 text-[#1E6B6B] text-[11px] font-semibold tracking-wide uppercase">
                  {dbmsCount} Questions
                </span>
              )}
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#1E6B6B]/10 text-[#1E6B6B] text-[11px] font-semibold tracking-wide uppercase">
                4 Cycles Analyzed
              </span>
            </div>
          </div>
        </Link>
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

      {/* Floating Secret Chat Button */}
      <button
        onClick={() => setIsSecretChatOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-surface border border-border shadow-2xl rounded-full text-accent hover:bg-accent hover:text-accent-foreground hover:scale-110 transition-all z-40 group"
        title="Open Secret Chat"
      >
        <Ghost size={24} className="group-hover:animate-pulse" />
      </button>

      <SecretChatModal 
        isOpen={isSecretChatOpen} 
        onClose={() => setIsSecretChatOpen(false)} 
      />
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

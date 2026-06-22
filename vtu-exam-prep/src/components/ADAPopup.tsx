import { useState, useEffect } from 'react';
import { Ghost, Bot, ShieldCheck, Zap, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getStudentName } from '../lib/auth';

export default function ADAPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Check if they have already completed the feedback
    const hasCompleted = localStorage.getItem('vtu_ada_feedback_done');
    if (!hasCompleted) {
      // Delay just a bit for smooth entry if they just loaded
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!isVisible) return null;

  async function handleSelect(difficulty: 'easy' | 'medium' | 'hard') {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const studentName = getStudentName() || 'Anonymous Operative';
      await supabase.from('ada_exam_feedback').insert({
        student_name: studentName,
        difficulty,
      });

      setSubmitted(true);
      localStorage.setItem('vtu_ada_feedback_done', 'true');

      // Dismiss after a short success state
      setTimeout(() => {
        setIsVisible(false);
      }, 1500);
    } catch (error) {
      console.error('Error submitting ADA feedback:', error);
      // Still dismiss to not block the user forever if DB fails
      localStorage.setItem('vtu_ada_feedback_done', 'true');
      setIsVisible(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/90 backdrop-blur-md p-4">
      <div className="w-full max-w-lg bg-surface border border-emerald-500/30 rounded-2xl shadow-[0_0_50px_rgba(16,185,129,0.15)] overflow-hidden relative animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header Graphic */}
        <div className="h-32 bg-gradient-to-br from-emerald-500/20 to-blue-500/10 relative overflow-hidden flex items-center justify-center border-b border-emerald-500/20">
          <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.2)_50%)] bg-[length:100%_4px] opacity-20" />
          <div className="relative z-10 text-center">
            <ShieldCheck size={48} className="text-emerald-400 mx-auto mb-2 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
            <h2 className="text-xl font-bold text-emerald-100 tracking-widest uppercase">System Update</h2>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          {submitted ? (
            <div className="text-center py-8 space-y-4 animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 size={32} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-emerald-100 uppercase tracking-widest">Feedback Secured</h3>
                <p className="text-emerald-500/70 mt-2 font-mono text-sm">Resuming operational dashboard...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Announcements Section */}
              <div className="mb-8 space-y-3">
                <p className="text-xs font-bold text-emerald-500 tracking-widest uppercase mb-4 flex items-center gap-2">
                  <Zap size={14} /> Intel Briefing
                </p>
                
                <div className="flex items-start gap-3 p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                  <Bot size={18} className="text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-blue-100">AI Restrictions Lifted</h4>
                    <p className="text-xs text-blue-200/70 leading-relaxed mt-0.5">
                      The access token requirement for the AI Chatbot has been permanently removed. Full access is now granted to all operatives.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-purple-500/5 border border-purple-500/20 rounded-xl">
                  <Ghost size={18} className="text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-purple-100">Secret Global Chat Online</h4>
                    <p className="text-xs text-purple-200/70 leading-relaxed mt-0.5">
                      A highly classified global chat room has been activated. Look for the floating Ghost icon on the Home Page to access it.
                    </p>
                  </div>
                </div>
              </div>

              {/* Compulsory Question Section */}
              <div className="border-t border-border/50 pt-6">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-bold text-foreground">How was the ADA Exam today?</h3>
                  <p className="text-xs text-muted-foreground mt-1">This is a compulsory checkpoint.</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => handleSelect('easy')}
                    disabled={isSubmitting}
                    className="flex flex-col items-center justify-center p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/10 hover:border-emerald-500/40 transition-all group disabled:opacity-50"
                  >
                    <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">😎</span>
                    <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Easy</span>
                  </button>
                  
                  <button
                    onClick={() => handleSelect('medium')}
                    disabled={isSubmitting}
                    className="flex flex-col items-center justify-center p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl hover:bg-amber-500/10 hover:border-amber-500/40 transition-all group disabled:opacity-50"
                  >
                    <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">🤔</span>
                    <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Medium</span>
                  </button>

                  <button
                    onClick={() => handleSelect('hard')}
                    disabled={isSubmitting}
                    className="flex flex-col items-center justify-center p-4 bg-red-500/5 border border-red-500/20 rounded-xl hover:bg-red-500/10 hover:border-red-500/40 transition-all group disabled:opacity-50"
                  >
                    <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">💀</span>
                    <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Hard</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

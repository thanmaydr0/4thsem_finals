import { useState, useEffect } from 'react';
import { Sparkles, Brain, CheckCircle2, Camera, Target, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AIPaperSurveyModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const hasCompleted = localStorage.getItem('hasCompletedAISurvey');
    if (!hasCompleted) {
      // Small delay so it pops up smoothly after load
      const timer = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAnswer = async (rating: 'easy' | 'medium' | 'hard') => {
    setIsSubmitting(true);
    try {
      // Fire and forget
      await supabase.from('ai_paper_survey').insert({ rating });
    } catch (err) {
      console.error('Failed to submit survey:', err);
    } finally {
      setIsSubmitting(false);
      setStep(2);
    }
  };

  const handleClose = () => {
    localStorage.setItem('hasCompletedAISurvey', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" />
      
      <div className="relative w-full max-w-xl bg-card border border-border shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        
        {step === 1 ? (
          <div className="p-6 sm:p-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-accent mb-6 animate-bounce">
              <Brain size={32} />
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-foreground">
              How was yesterday's AI paper?
            </h2>
            <p className="text-muted-foreground mb-10">
              Be honest! Your feedback helps us calibrate our predictive engines for future exams.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
              <button
                onClick={() => handleAnswer('easy')}
                disabled={isSubmitting}
                className="group relative overflow-hidden p-6 rounded-xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all hover:scale-105"
              >
                <div className="text-3xl mb-2">😎</div>
                <div className="font-bold text-emerald-500 uppercase tracking-wider">Easy</div>
              </button>
              
              <button
                onClick={() => handleAnswer('medium')}
                disabled={isSubmitting}
                className="group relative overflow-hidden p-6 rounded-xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-all hover:scale-105"
              >
                <div className="text-3xl mb-2">🤔</div>
                <div className="font-bold text-amber-500 uppercase tracking-wider">Medium</div>
              </button>
              
              <button
                onClick={() => handleAnswer('hard')}
                disabled={isSubmitting}
                className="group relative overflow-hidden p-6 rounded-xl border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 transition-all hover:scale-105"
              >
                <div className="text-3xl mb-2">😭</div>
                <div className="font-bold text-red-500 uppercase tracking-wider">Hard</div>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-10 flex flex-col items-center text-center animate-in slide-in-from-right-8 duration-500">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-6">
              <CheckCircle2 size={32} />
            </div>
            
            <h2 className="text-2xl font-bold mb-2 text-foreground">
              Noted. Now let's crush DBMS.
            </h2>
            <p className="text-muted-foreground mb-8">
              We've deployed massive upgrades to the platform specifically for your upcoming DBMS exam.
            </p>

            <div className="space-y-4 w-full text-left mb-10">
              <div className="p-4 rounded-xl border border-border bg-surface flex gap-4 items-start">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0">
                  <Camera size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-foreground">Strict Examiner</h4>
                  <p className="text-sm text-muted-foreground mt-1">Upload photos of your handwritten answers and GPT-4o will instantly grade them out of 10 marks.</p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border bg-surface flex gap-4 items-start">
                <div className="p-2 rounded-lg bg-red-500/10 text-red-500 shrink-0">
                  <Target size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-foreground">Exam Leak Engine</h4>
                  <p className="text-sm text-muted-foreground mt-1">A highly accurate predictive algorithm that generates a custom 10-question mock paper based on 10 years of VTU history.</p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border bg-surface flex gap-4 items-start">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 shrink-0">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-foreground">Chat with Your Notes (RAG)</h4>
                  <p className="text-sm text-muted-foreground mt-1">Upload your class PDFs or handwritten notes. The AI Assistant will now read them and cite them when answering your questions.</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="w-full sm:w-auto px-10 py-4 rounded-xl bg-accent text-white font-bold tracking-widest uppercase hover:bg-accent-hover transition-colors flex items-center justify-center gap-2 group"
            >
              <Sparkles size={18} className="group-hover:animate-pulse" />
              Access New Features
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

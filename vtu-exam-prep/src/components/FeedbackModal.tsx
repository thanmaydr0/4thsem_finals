import { useState, useRef, useEffect } from 'react';
import { Send, Heart, MessageSquareHeart } from 'lucide-react';
import clsx from 'clsx';
import { supabase } from '../lib/supabase';
import { useStudyStore } from '../hooks/useStudyStore';

const EMOJIS = [
  { value: 1, label: 'Terrible', emoji: '😞' },
  { value: 2, label: 'Bad', emoji: '😕' },
  { value: 3, label: 'Okay', emoji: '😐' },
  { value: 4, label: 'Good', emoji: '🙂' },
  { value: 5, label: 'Great', emoji: '🤩' },
];

export default function FeedbackModal() {
  const { showFeedbackModal, setShowFeedbackModal } = useStudyStore();
  
  const [rating, setRating] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset state when opened
  useEffect(() => {
    if (showFeedbackModal) {
      setRating(null);
      setMessage('');
      setSubmitted(false);
      setIsSubmitting(false);
    }
  }, [showFeedbackModal]);

  // Modal is now compulsory: removed click-outside-to-close logic

  if (!showFeedbackModal) return null;

  async function handleSubmit() {
    if (!rating) return;
    setIsSubmitting(true);

    try {
      await supabase.from('feedback').insert([
        {
          rating,
          message: message.trim() || null,
        },
      ]);
      setSubmitted(true);
      // Auto close after 2 seconds
      setTimeout(() => {
        setShowFeedbackModal(false);
      }, 2000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div
        ref={modalRef}
        className="w-full max-w-sm bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200"
      >


        <div className="p-6">
          {submitted ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                <Heart size={32} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Thank You!</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Your feedback helps make this app better for everyone.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquareHeart size={24} />
                </div>
                
                <div className="mb-6 bg-accent/5 border border-accent/20 rounded-xl p-4 text-left shadow-sm">
                  <p className="text-[15px] text-foreground font-semibold flex items-center gap-2 mb-1.5">
                    <span role="img" aria-label="rocket">🚀</span> Good luck on your AI exam!
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    We hope this tool helps you ace it. Note that the <strong>DBMS section</strong> will be added soon!
                  </p>
                </div>

                <h2 className="text-lg font-bold">How is your experience?</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  We'd love a quick rating before you go study.
                </p>
              </div>

              {/* Rating Selection */}
              <div className="flex items-center justify-between gap-2 mb-6">
                {EMOJIS.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setRating(item.value)}
                    className={clsx(
                      'flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all duration-200',
                      rating === item.value
                        ? 'bg-accent-subtle/30 scale-110'
                        : 'hover:bg-card hover:scale-105 grayscale opacity-50 hover:grayscale-0 hover:opacity-100'
                    )}
                  >
                    <span className="text-3xl leading-none" role="img" aria-label={item.label}>
                      {item.emoji}
                    </span>
                    <span
                      className={clsx(
                        'text-[10px] font-medium',
                        rating === item.value ? 'text-accent' : 'text-muted-foreground'
                      )}
                    >
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Optional Text Feedback */}
              <div
                className={clsx(
                  'transition-all duration-300 overflow-hidden',
                  rating ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                )}
              >
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us more (optional)..."
                  className="w-full h-24 p-3 text-sm bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent resize-none transition-colors mb-4"
                />

                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !rating}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-accent-foreground font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    'Submitting...'
                  ) : (
                    <>
                      <Send size={16} /> Submit Feedback
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

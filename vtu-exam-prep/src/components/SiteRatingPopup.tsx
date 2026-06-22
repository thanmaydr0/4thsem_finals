import { useState, useEffect } from 'react';
import { Star, CheckCircle2, Navigation, X, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { supabase } from '../lib/supabase';
import { getStudentName } from '../lib/auth';
import { useStudyStore } from '../hooks/useStudyStore';

export default function SiteRatingPopup() {
  const { showSiteRating, setShowSiteRating } = useStudyStore();
  
  const [isAutoVisible, setIsAutoVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [rating, setRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [review, setReview] = useState('');

  const hasCompleted = localStorage.getItem('vtu_site_rating_done') === 'true';

  useEffect(() => {
    // Check if they have already completed the site rating
    if (!hasCompleted && !showSiteRating) {
      // Delay slightly for smooth entry
      const timer = setTimeout(() => {
        setIsAutoVisible(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [hasCompleted, showSiteRating]);

  // Combined visibility check
  const isVisible = isAutoVisible || showSiteRating;

  // Cleanup on unmount/close
  useEffect(() => {
    if (!isVisible) {
      setSubmitted(false);
      setRating(null);
      setReview('');
    }
  }, [isVisible]);

  if (!isVisible) return null;

  function closePopup() {
    setIsAutoVisible(false);
    setShowSiteRating(false);
  }

  async function handleSubmit() {
    if (isSubmitting || rating === null) return;
    setIsSubmitting(true);

    try {
      const studentName = getStudentName() || 'Anonymous Operative';
      await supabase.from('site_rating_feedback').insert({
        student_name: studentName,
        rating,
        review: review.trim() || null,
      });

      setSubmitted(true);
      localStorage.setItem('vtu_site_rating_done', 'true');

      // Dismiss after a short success state
      setTimeout(() => {
        closePopup();
      }, 1500);
    } catch (error) {
      console.error('Error submitting site rating:', error);
      localStorage.setItem('vtu_site_rating_done', 'true');
      closePopup();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/90 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-surface border border-accent/30 rounded-2xl shadow-[0_0_50px_rgba(var(--accent),0.15)] overflow-hidden relative animate-in fade-in zoom-in-95 duration-300">
        
        {/* Allow closing if they manually triggered it or if they already completed it */}
        {(hasCompleted || showSiteRating) && !submitted && (
          <button 
            onClick={closePopup}
            className="absolute top-4 right-4 z-20 text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <X size={20} />
          </button>
        )}

        {/* Header Graphic */}
        <div className="h-32 bg-gradient-to-br from-accent/20 to-blue-500/10 relative overflow-hidden flex items-center justify-center border-b border-accent/20">
          <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.2)_50%)] bg-[length:100%_4px] opacity-20" />
          <div className="relative z-10 text-center">
            <Navigation size={42} className="text-accent mx-auto mb-3 drop-shadow-[0_0_15px_rgba(var(--accent),0.5)]" />
            <h2 className="text-xl font-bold text-accent-foreground/90 tracking-widest uppercase">System Evaluation</h2>
          </div>
        </div>

        <div className="p-6 sm:p-8 text-center">
          {submitted ? (
            <div className="py-8 space-y-4 animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto text-accent">
                <CheckCircle2 size={32} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground uppercase tracking-widest">Feedback Secured</h3>
                <p className="text-muted-foreground mt-2 font-mono text-sm">Thank you, Operative.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h3 className="text-xl font-bold text-foreground">How would you rate your experience with the site?</h3>
                <p className="text-xs text-muted-foreground mt-2">Your feedback calibrates the system.</p>
              </div>

              {/* Numbered Tiles Rating Scale */}
              <div className="flex justify-between items-center gap-2 mb-2">
                {[1, 2, 3, 4, 5].map((num) => {
                  const isSelected = rating === num;
                  const isHovered = hoveredRating !== null && hoveredRating >= num;
                  const isActive = isSelected || isHovered;

                  return (
                    <button
                      key={num}
                      onClick={() => setRating(num)}
                      onMouseEnter={() => setHoveredRating(num)}
                      onMouseLeave={() => setHoveredRating(null)}
                      disabled={isSubmitting}
                      className={clsx(
                        "flex-1 aspect-square flex flex-col items-center justify-center rounded-xl border transition-all duration-200 group relative overflow-hidden disabled:opacity-50",
                        isActive
                          ? "bg-accent/20 border-accent text-accent shadow-[0_0_15px_rgba(var(--accent),0.3)] scale-105"
                          : "bg-surface border-border text-muted-foreground hover:border-accent/50"
                      )}
                    >
                      <span className="text-2xl font-bold font-mono relative z-10">{num}</span>
                      {isActive && (
                        <Star size={12} className="absolute bottom-2 opacity-50 fill-accent/50" />
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground font-bold px-2 mb-6">
                <span>Needs Work</span>
                <span>Perfect</span>
              </div>

              {/* Optional Review */}
              {rating !== null && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-300 text-left">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1 mb-2 block">
                    Optional Review
                  </label>
                  <textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    placeholder="Tell us what you liked or how we can improve..."
                    className="w-full h-24 bg-background border border-border rounded-xl p-3 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none resize-none placeholder:text-muted mb-4 transition-all"
                    disabled={isSubmitting}
                  />

                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full py-3 bg-accent text-accent-foreground font-bold rounded-xl hover:bg-accent/90 hover:scale-[1.02] active:scale-100 transition-all flex items-center justify-center gap-2 group shadow-lg shadow-accent/20 disabled:opacity-70 disabled:hover:scale-100 uppercase tracking-widest text-sm"
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      'Submit Evaluation'
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

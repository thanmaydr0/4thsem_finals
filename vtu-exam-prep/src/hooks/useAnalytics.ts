import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useAnalytics() {
  useEffect(() => {
    async function trackVisit() {
      try {
        // Get or create anonymous ID
        let anonId = localStorage.getItem('vtu_anon_id');
        if (!anonId) {
          anonId = crypto.randomUUID();
          localStorage.setItem('vtu_anon_id', anonId);
        }

        // Upsert the visit
        await supabase
          .from('site_visits')
          .upsert(
            { id: anonId, last_active_at: new Date().toISOString() },
            { onConflict: 'id' }
          );
      } catch (err) {
        console.error('Failed to track visit:', err);
      }
    }

    // Track immediately on mount
    trackVisit();

    // Then ping every 5 minutes if the tab stays open
    const interval = setInterval(trackVisit, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);
}

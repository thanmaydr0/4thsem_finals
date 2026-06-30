import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Home from './pages/Home';
import StatsPage from './pages/StatsPage';
import DBMSPage from './pages/DBMSPage';
import UHVPage from './pages/UHVPage';
import AuthGate from './components/AuthGate';
import ADAPopup from './components/ADAPopup';
import SiteRatingPopup from './components/SiteRatingPopup';
import AIPaperSurveyModal from './components/AIPaperSurveyModal';
import { useAnalytics } from './hooks/useAnalytics';
import { useStudyStore } from './hooks/useStudyStore';
import { supabase } from './lib/supabase';

function App() {
  useAnalytics();
  const setShowFeedbackModal = useStudyStore((s) => s.setShowFeedbackModal);

  // Temporary script to confirm DBMS schema addition
  useEffect(() => {
    async function testDBMSSchema() {
      try {
        console.log('Testing DBMS Schema Integration...');
        
        // Check if subject exists
        const { data: subjectData, error: subjectError } = await supabase
          .from('subjects')
          .select('*')
          .eq('id', 'dbms')
          .single();
          
        if (subjectError) throw subjectError;
        
        console.log('✅ SUCCESS: Found DBMS in subjects table:', subjectData);
        
        // Test questions fetch
        const { data: qData, error: qError } = await supabase
          .from('questions')
          .select('*')
          .eq('subject_id', 'dbms');
          
        if (qError) throw qError;
        console.log(`✅ SUCCESS: Queried unified questions table for DBMS. Found ${qData.length} records.`);
        
      } catch (err) {
        console.error('❌ FAILURE: Could not verify DBMS schema extension.', err);
      }
    }
    
    testDBMSSchema();
  }, []);

  useEffect(() => {
    // Check if the user has already seen the popup
    const hasSeenPopup = localStorage.getItem('vtu_has_seen_feedback');
    if (!hasSeenPopup) {
      // Show after 2.5 seconds
      const timer = setTimeout(() => {
        setShowFeedbackModal(true);
        localStorage.setItem('vtu_has_seen_feedback', 'true');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [setShowFeedbackModal]);

  return (
    <BrowserRouter>
      <AuthGate>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dbms" element={<DBMSPage />} />
          <Route path="/uhv" element={<UHVPage />} />
          <Route path="/stats" element={<StatsPage />} />
        </Routes>
        <ADAPopup />
        <SiteRatingPopup />
        <AIPaperSurveyModal />
      </AuthGate>
    </BrowserRouter>
  );
}

export default App;

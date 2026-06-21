import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ADAPage from './pages/ADAPage';
import AIPage from './pages/AIPage';
import Home from './pages/Home';
import StatsPage from './pages/StatsPage';
import { useAnalytics } from './hooks/useAnalytics';
import { useStudyStore } from './hooks/useStudyStore';

function App() {
  useAnalytics();
  const setShowFeedbackModal = useStudyStore((s) => s.setShowFeedbackModal);

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
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ada" element={<ADAPage />} />
        <Route path="/ai" element={<AIPage />} />
        <Route path="/stats" element={<StatsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

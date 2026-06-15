import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ADAPage from './pages/ADAPage';
import AIPage from './pages/AIPage';
import Home from './pages/Home';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ada" element={<ADAPage />} />
        <Route path="/ai" element={<AIPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

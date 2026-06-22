import { useEffect, useState } from 'react';
import LoginPage from '../pages/LoginPage';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const authStatus = localStorage.getItem('vtu_auth_session') === 'true';
    setIsAuthenticated(authStatus);

    // Listen for custom login/logout events from other components
    const handleAuthChange = () => {
      setIsAuthenticated(localStorage.getItem('vtu_auth_session') === 'true');
    };
    window.addEventListener('vtu-auth-changed', handleAuthChange);
    return () => window.removeEventListener('vtu-auth-changed', handleAuthChange);
  }, []);

  if (isAuthenticated === null) {
    return null; // Avoid flash of login screen on initial load
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setIsAuthenticated(true)} />;
  }

  return <>{children}</>;
}

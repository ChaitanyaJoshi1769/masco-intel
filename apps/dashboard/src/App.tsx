import React, { useState } from 'react';
import { Login, Dashboard, ProductTerminal, Marketplace, Community, Billing, Analytics, AIConsole, Settings } from './views';
import { useAuth } from './hooks';

type PageType = 'dashboard' | 'terminal' | 'marketplace' | 'forum' | 'billing' | 'analytics' | 'ai' | 'settings';

export const App: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');

  const handleLoginSuccess = () => {
    setCurrentPage('dashboard');
  };

  const handleNavigate = (navId: string) => {
    switch (navId) {
      case 'dashboard':
        setCurrentPage('dashboard');
        break;
      case 'terminal':
        setCurrentPage('terminal');
        break;
      case 'marketplace':
        setCurrentPage('marketplace');
        break;
      case 'forum':
        setCurrentPage('forum');
        break;
      case 'billing':
        setCurrentPage('billing');
        break;
      case 'analytics':
        setCurrentPage('analytics');
        break;
      case 'ai':
        setCurrentPage('ai');
        break;
      case 'settings':
        setCurrentPage('settings');
        break;
    }
    window.scrollTo(0, 0);
  };

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  switch (currentPage) {
    case 'terminal':
      return <ProductTerminal />;
    case 'marketplace':
      return <Marketplace />;
    case 'forum':
      return <Community />;
    case 'billing':
      return <Billing />;
    case 'analytics':
      return <Analytics />;
    case 'ai':
      return <AIConsole />;
    case 'settings':
      return <Settings />;
    default:
      return <Dashboard />;
  }
};

export default App;

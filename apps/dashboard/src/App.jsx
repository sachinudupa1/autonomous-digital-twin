
import { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/layout/DashboardLayout';

import OverviewPage from './pages/OverviewPage';
import ProductionMonitoringPage from './pages/ProductionMonitoringPage';
import MachineHealthPage from './pages/MachineHealthPage';
import AIAgentsPage from './pages/AIAgentsPage';
import DigitalTwinPage from './pages/DigitalTwinPage';
import DecisionReportsPage from './pages/DecisionReportsPage';
import LogsHistoryPage from './pages/LogsHistoryPage';

import './App.css';

/**
 * Main dashboard routing and session state container.
 */
function DashboardAppContent() {
  const { isAuthenticated, isAuthLoading } = useAuth();
  const [activePage, setActivePage] = useState('overview');
  const [machineHealthInitialTab, setMachineHealthInitialTab] = useState('line-a');

  /**
   * Overview navigation can optionally specify which production
   * line should be selected when opening Machine Health.
   */
  const handleOverviewNavigate = (pageId, lineName) => {
    if (pageId === 'machine-health') {
      const normalizedLine = String(lineName || 'line-a')
        .trim()
        .toLowerCase()
        .replaceAll(' ', '-');

      setMachineHealthInitialTab(
        normalizedLine === 'line-b' ? 'line-b' : 'line-a'
      );
    }

    setActivePage(pageId);
  };

  // Loading indicator while Firebase checks initial authentication state
  if (isAuthLoading) {
    return (
      <main className="login-page">
        <section
          className="login-card"
          style={{
            width: '100%',
            maxWidth: '360px',
            textAlign: 'center',
          }}
        >
          <div className="brand-mark" style={{ margin: '0 auto 18px' }}>
            <span style={{ fontSize: '25px', fontWeight: 700 }}>A</span>
          </div>

          <h1 className="login-brand__name">AutoPack</h1>

          <p className="login-brand__subtitle" style={{ marginTop: '12px' }}>
            Checking administrator session...
          </p>
        </section>
      </main>
    );
  }

  // Unauthenticated users are redirected to administrator login
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Render active section based on sidebar selection
  const renderActivePage = () => {
    switch (activePage) {
      case 'overview':
        return (
          <OverviewPage
            onNavigate={handleOverviewNavigate}
          />
        );

      case 'production-monitoring':
        return <ProductionMonitoringPage />;

      case 'machine-health':
        return (
          <MachineHealthPage
            initialTab={machineHealthInitialTab}
          />
        );

      case 'ai-agents':
        return <AIAgentsPage />;

      case 'digital-twin':
        return <DigitalTwinPage />;

      case 'decision-reports':
        return <DecisionReportsPage />;

      case 'logs-history':
        return <LogsHistoryPage />;

      default:
        return (
          <OverviewPage
            onNavigate={handleOverviewNavigate}
          />
        );
    }
  };

  return (
    <DashboardLayout
      activePage={activePage}
      onNavigate={setActivePage}
    >
      {renderActivePage()}
    </DashboardLayout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DashboardAppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

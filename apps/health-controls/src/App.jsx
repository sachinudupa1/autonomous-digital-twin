import { useEffect, useState } from 'react';

import LoginPage from './pages/LoginPage';
import HealthControlsPage from './pages/HealthControlsPage';

import { ThemeProvider } from './context/ThemeContext';

import {
  login,
  logout,
  subscribeToAuthChanges,
} from './services/authService';

/* =========================================
   FIREBASE AUTHENTICATION
========================================= */

function AppContent() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Listen for Firebase authentication changes.
  // This restores an existing login session after a page refresh.
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Authenticate the operator through Firebase.
  const handleLogin = async (userId, password) => {
    await login(userId, password);
  };

  // Sign out through Firebase.
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('[App] Sign out failed:', error);
    }
  };

  // Wait until Firebase checks the existing session.
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
          <div
            className="brand-mark"
            style={{ margin: '0 auto 18px' }}
          >
            <span style={{ fontSize: '25px' }}>A</span>
          </div>

          <h1 className="login-brand__name">AutoPack</h1>

          <p
            className="login-brand__subtitle"
            style={{ marginTop: '12px' }}
          >
            Checking operator session...
          </p>
        </section>
      </main>
    );
  }

  // Show the login page when no operator is authenticated.
  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Show the operator console after successful authentication.
  return <HealthControlsPage onLogout={handleLogout} />;
}

/* =========================================
   ROOT APPLICATION
========================================= */

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
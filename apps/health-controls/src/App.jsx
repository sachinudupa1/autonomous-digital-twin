
import { useEffect, useRef, useState } from 'react';

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
  // This also restores an existing login session after a page refresh.
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

  // Wait until Firebase has checked the existing session.
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
   ANIMATED BACKGROUND
   Inspired by Customer Website PromoCarousel
========================================= */

function AnimatedBackground() {
  const backgroundRef = useRef(null);
  const pointerGlowRef = useRef(null);

  // Mouse-following lighting effect.
  // Direct DOM updates avoid re-rendering the entire application
  // every time the mouse moves.
  const handlePointerMove = (event) => {
    if (event.pointerType === 'touch') {
      return;
    }

    const background = backgroundRef.current;
    const pointerGlow = pointerGlowRef.current;

    if (!background || !pointerGlow) {
      return;
    }

    const x = (event.clientX / window.innerWidth) * 100;
    const y = (event.clientY / window.innerHeight) * 100;

    background.style.setProperty('--pointer-x', `${x}%`);
    background.style.setProperty('--pointer-y', `${y}%`);

    pointerGlow.style.opacity = '0.30';
  };

  const handlePointerLeave = () => {
    if (pointerGlowRef.current) {
      pointerGlowRef.current.style.opacity = '0';
    }
  };

  return (
    <>
      {/* Background visual elements */}
      <div
        ref={backgroundRef}
        className="ambient-decoration"
        aria-hidden="true"
        style={{
          zIndex: 0,
          '--pointer-x': '65%',
          '--pointer-y': '45%',
        }}
      >
        {/* Mouse-following lighting */}
        <div
          ref={pointerGlowRef}
          style={{
            position: 'absolute',
            inset: 0,
            background: `
              radial-gradient(
                280px circle at var(--pointer-x) var(--pointer-y),
                rgba(255, 255, 255, 0.30),
                transparent 72%
              )
            `,
            mixBlendMode: 'screen',
            opacity: 0,
            transition: 'opacity 300ms ease',
          }}
        />

        {/* Floating glowing orbs: orange, blue and green */}
        <div className="ambient-orb ambient-orb--orange" />
        <div className="ambient-orb ambient-orb--blue" />
        <div className="ambient-orb ambient-orb--green" />

        {/* Rotating geometric rings */}
        <div className="ambient-ring ambient-ring--one" />
        <div className="ambient-ring ambient-ring--two" />
        <div className="ambient-ring ambient-ring--three" />

        {/* Floating geometric shapes */}
        <div className="ambient-shape ambient-shape--one" />
        <div className="ambient-shape ambient-shape--two" />
      </div>

      {/* Application content stays above the animated background */}
      <div
        className="app-root"
        style={{
          position: 'relative',
          zIndex: 1,
          minHeight: '100vh',
        }}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <AppContent />
      </div>
    </>
  );
}


/* =========================================
   ROOT APPLICATION
========================================= */

function App() {
  return (
    <ThemeProvider>
      <AnimatedBackground />
    </ThemeProvider>
  );
}

export default App;

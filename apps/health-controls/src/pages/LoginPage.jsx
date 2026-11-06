import { useState } from 'react';
import LoginForm from '../components/auth/LoginForm';
import ThemeToggle from '../components/common/ThemeToggle';

function LoginPage({ onLogin }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (userId, password) => {
    setError(null);
    setIsLoading(true);

    try {
      if (onLogin) {
        await onLogin(userId, password);
      }
    } catch {
      setError(
        'Sign in failed. Please check your credentials and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="login-page">
      {/* Theme selector */}
      <div className="login-page__theme">
        <ThemeToggle />
      </div>

      <div className="login-shell">
        <section className="login-card">
          {/* AutoPack branding */}
          <div className="login-brand">
            <div className="brand-mark">
              <svg
                viewBox="0 0 32 32"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M5 11.5 16 5l11 6.5v9L16 27 5 20.5v-9Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path
                  d="m5.5 11.8 10.5 6.3 10.5-6.3M16 18.1V27"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path
                  d="m10.5 8.2 10.8 6.4"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  opacity="0.8"
                />
              </svg>
            </div>

            <h1 className="login-brand__name">AutoPack</h1>

            <p className="login-brand__subtitle">
              Autonomous Packaging Intelligence
            </p>
          </div>

          {/* Login heading */}
          <div className="login-heading">
            <h2 className="login-heading__title">
              Operator Sign In
            </h2>

            <p className="login-heading__description">
              Sign in to access the Health Controls console.
            </p>
          </div>

          {/* Login form */}
          <LoginForm
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
          />

          <p className="login-footer">
            AutoPack · Health Controls
          </p>
        </section>

        {/* Decorative colour accents */}
        <div
          aria-hidden="true"
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '7px',
            marginTop: '22px',
          }}
        >
          {[
            '#FF7900',
            '#16A34A',
            '#1677FF',
            '#FF4F9A',
            '#FFD400',
          ].map((color) => (
            <span
              key={color}
              style={{
                display: 'block',
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: color,
              }}
            />
          ))}
        </div>
      </div>
    </main>
  );
}

export default LoginPage;
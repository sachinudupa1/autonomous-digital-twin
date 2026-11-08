import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

/**
 * LoginPage — Dashboard administrator authentication.
 *
 * Uses the shared Firebase Email/Password authentication setup.
 * Credentials are entered at runtime and never stored in this component.
 */
function LoginPage() {
  const { login } = useAuth();
  const { toggleTheme, isDark } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError('');
    setIsLoading(true);

    try {
      await login(email.trim(), password);
    } catch (authError) {
      console.error('[LoginPage] Sign-in failed:', authError);

      if (authError?.code === 'auth/too-many-requests') {
        setError(
          'Too many unsuccessful attempts. Please try again later.'
        );
      } else if (authError?.code === 'auth/network-request-failed') {
        setError(
          'Unable to connect to Firebase. Check your internet connection.'
        );
      } else if (authError?.code === 'auth/unauthorized-admin') {
        setError(
          'This account is not authorised to access the Dashboard.'
        );
      } else {
        setError(
          'Sign in failed. Check your administrator email and password.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="login-page">

      {/* Theme toggle */}
      <div className="login-page__theme">
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
          <span className="theme-toggle__icon" aria-hidden="true">
            {isDark ? (
              <svg viewBox="0 0 24 24" fill="none">
                <circle
                  cx="12"
                  cy="12"
                  r="4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />

                <path
                  d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M20.2 15.2A8.5 8.5 0 0 1 8.8 3.8 8.5 8.5 0 1 0 20.2 15.2Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </span>

          <span className="theme-toggle__label">
            {isDark ? 'Light' : 'Dark'}
          </span>
        </button>
      </div>

      <div className="login-shell">
        <section className="login-card">

          {/* Brand */}
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

            <h1 className="login-brand__name">
              AutoPack
            </h1>

            <p className="login-brand__subtitle">
              Autonomous Packaging Intelligence
            </p>
          </div>

          {/* Login heading */}
          <div className="login-heading">
            <h2 className="login-heading__title">
              Administrator Sign In
            </h2>

            <p className="login-heading__description">
              Sign in to access the AutoPack Dashboard.
            </p>
          </div>

          {/* Email and password form */}
          <form
            onSubmit={handleSubmit}
            className="form-stack"
          >
            <div className="form-field">
              <label
                htmlFor="admin-email"
                className="form-label"
              >
                Email
              </label>

              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="Administrator email"
                className="form-input"
                disabled={isLoading}
              />
            </div>

            <div className="form-field">
              <label
                htmlFor="admin-password"
                className="form-label"
              >
                Password
              </label>

              <div className="login-password-wrap">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="form-input login-password-input"
                  disabled={isLoading}
                />

                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={
                    showPassword ? 'Hide password' : 'Show password'
                  }
                  title={showPassword ? 'Hide password' : 'Show password'}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <svg
                      width="19"
                      height="19"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M3 3L21 21M10.6 10.6a2 2 0 0 0 2.8 2.8"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />

                      <path
                        d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5.2 0 8.6 4.1 9.5 7-.3 1-1 2-1.8 2.9M6.2 6.2C3.9 7.7 2.5 10 2 12c.9 2.9 4.3 7 10 7 1 0 2-.2 2.9-.5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg
                      width="19"
                      height="19"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M2.5 12s3.4-7 9.5-7 9.5 7 9.5 7-3.4 7-9.5 7-9.5-7-9.5-7Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />

                      <circle
                        cx="12"
                        cy="12"
                        r="3"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Authentication error */}
            {error && (
              <p
                role="alert"
                aria-live="polite"
                className="form-error"
              >
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="primary-button login-submit-button"
            >
              {isLoading ? (
                <>
                  <span aria-hidden="true">⏳</span>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In

                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M5 12h14M13 6l6 6-6 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </>
              )}
            </button>
          </form>

          <p className="login-footer">
            AutoPack · Administrator Dashboard
          </p>
        </section>
      </div>
    </main>
  );
}

export default LoginPage;
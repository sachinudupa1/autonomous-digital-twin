import { useState } from 'react';

function LoginForm({ onSubmit, isLoading, error }) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (onSubmit && !isLoading) {
      onSubmit(userId, password);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-stack">
      {/* User ID */}
      <div className="form-field">
        <label htmlFor="userId" className="form-label">
          User ID
        </label>

        <input
          id="userId"
          type="text"
          value={userId}
          onChange={(event) => setUserId(event.target.value)}
          required
          autoComplete="username"
          autoCapitalize="none"
          spellCheck="false"
          placeholder="Enter your operator ID"
          className="form-input"
        />
      </div>

      {/* Password */}
      <div className="form-field">
        <label htmlFor="password" className="form-label">
          Password
        </label>

        <div style={{ position: 'relative' }}>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
            placeholder="Enter your password"
            className="form-input"
            style={{ paddingRight: '48px' }}
          />

          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            title={showPassword ? 'Hide password' : 'Show password'}
            style={{
              position: 'absolute',
              right: '13px',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              color: 'var(--text-muted)',
              background: 'transparent',
              border: 'none',
            }}
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
          id="login-error"
          role="alert"
          aria-live="polite"
          className="form-error"
        >
          {error}
        </p>
      )}

      {/* Sign In */}
      <button
        type="submit"
        disabled={isLoading}
        className="primary-button"
        style={{ width: '100%', marginTop: '5px' }}
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
  );
}

export default LoginForm;
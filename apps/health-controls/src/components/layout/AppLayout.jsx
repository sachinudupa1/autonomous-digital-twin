import ThemeToggle from '../common/ThemeToggle';

function AppLayout({ children, onLogout }) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__inner">
          {/* AutoPack branding */}
          <div className="app-brand">
            <div className="app-brand__mark">
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
              </svg>
            </div>

            <div>
              <h1 className="app-brand__name">AutoPack</h1>
              <span className="app-brand__meta">
                Operator Console
              </span>
            </div>
          </div>

          {/* Header actions */}
          <div className="app-header__actions">
            <ThemeToggle />

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="signout-button"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="app-main">
        {children}
      </main>
    </div>
  );
}

export default AppLayout;
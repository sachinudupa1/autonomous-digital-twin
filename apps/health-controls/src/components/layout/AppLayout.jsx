import ThemeToggle from '../common/ThemeToggle';

const LINE_ITEMS = [
  { id: 'line_1', label: 'Line 1' },
  { id: 'line_2', label: 'Line 2' },
];

function AppLayout({
  children,
  onLogout,
  activeLine,
  onLineChange,
  activeLineLabel,
}) {
  return (
    <div className="app-shell hc-layout">
      {/* Sidebar */}
      <aside className="hc-sidebar">
        <div className="hc-sidebar__brand">
          <div className="hc-sidebar__brand-mark">
            <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
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

          <div className="hc-sidebar__brand-copy">
            <h1 className="hc-sidebar__brand-name">AutoPack</h1>
            <span className="hc-sidebar__brand-meta">
              Digital Twin
            </span>
          </div>
        </div>

        <div className="hc-sidebar__divider" />

        {/* Line navigation */}
        <nav
          className="hc-sidebar__navigation"
          aria-label="Packaging line navigation"
        >
          <p className="hc-sidebar__section-label">
            PACKAGING LINES
          </p>

          {LINE_ITEMS.map((line) => {
            const isActive = activeLine === line.id;

            return (
              <button
                key={line.id}
                type="button"
                className={`hc-sidebar__nav-item hc-sidebar__nav-button ${
                  isActive ? 'hc-sidebar__nav-item--active' : ''
                }`}
                onClick={() => onLineChange?.(line.id)}
                aria-current={isActive ? 'page' : undefined}
                aria-pressed={isActive}
              >
                {isActive && (
                  <span className="hc-sidebar__nav-indicator" />
                )}

                <span className="hc-sidebar__nav-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <rect
                      x="3"
                      y="6"
                      width="18"
                      height="12"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="1.7"
                    />
                    <path
                      d="M7 10h10M7 14h10M8 18v2m8-2v2"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                    />
                    <circle cx="8" cy="12" r="1" fill="currentColor" />
                    <circle cx="16" cy="12" r="1" fill="currentColor" />
                  </svg>
                </span>

                <span className="hc-sidebar__nav-label">
                  {line.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="hc-sidebar__footer">
          <span className="hc-sidebar__footer-dot" />
          <span>Operator Console</span>
        </div>
      </aside>

      {/* Main workspace */}
      <div className="hc-workspace">
        <header className="hc-topbar">
          <div className="hc-topbar__context">
            <span className="hc-topbar__breadcrumb">
              AUTOPACK
            </span>

            <span className="hc-topbar__separator">/</span>

            <span className="hc-topbar__current">
              HEALTH CONTROLS
            </span>

            <span className="hc-topbar__separator">/</span>

            <span className="hc-topbar__line">
              {activeLineLabel || 'Line 1'}
            </span>
          </div>

          <div className="hc-topbar__actions">
            <ThemeToggle />

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="signout-button"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M10 17l5-5-5-5M15 12H3m9-8h6a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>

                <span>Sign Out</span>
              </button>
            )}
          </div>
        </header>

        <main className="app-main hc-main">
          <div className="hc-main__content">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
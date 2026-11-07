import { NAV_ITEMS } from '../../lib/navItems';

/**
 * Sidebar — collapsible left navigation.
 *
 * Props:
 *   activePage    — string id of the current page
 *   onNavigate    — (pageId: string) => void
 *   collapsed     — boolean
 *   onToggle      — () => void
 */

const NAV_ICON_COLORS = {
  overview: '#1677FF',
  'production-monitoring': '#16A34A',
  'machine-health': '#FF4F9A',
  'ai-agents': '#FFD400',
  'digital-twin': '#00C8D7',
  'decision-reports': '#FF7900',
  'logs-history': '#A1A1AA',
};

/* =====================================================
   COMPACT AUTOPACK BRAND MARK
===================================================== */

function AutoPackLogo() {
  return (
    <svg
      viewBox="0 0 36 36"
      width="32"
      height="32"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {/* Top face */}
      <path
        d="M18 2.5 33 10.5 18 19 3 10.5 18 2.5Z"
        fill="#FFC15A"
      />

      {/* Left face */}
      <path
        d="M3 10.5 18 19v16L3 26.5v-16Z"
        fill="#FF8A00"
      />

      {/* Right face */}
      <path
        d="M33 10.5 18 19v16l15-8.5v-16Z"
        fill="#E65E00"
      />

      {/* Clean geometric details */}
      <path
        d="M18 19v16M3 10.5 18 19l15-8.5"
        stroke="#172033"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Inner packaging detail */}
      <path
        d="m10 14.5 8 4.5 8-4.5"
        stroke="#FFF1D8"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M18 19v8"
        stroke="#FFF1D8"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* =====================================================
   SIDEBAR
===================================================== */

function Sidebar({ activePage, onNavigate, collapsed, onToggle }) {
  return (
    <aside
      className={`db-sidebar${collapsed ? ' db-sidebar--collapsed' : ''}`}
      aria-label="Main navigation"
    >
      {/* =================================================
          BRAND HEADER
      ================================================= */}

      <div className="db-sidebar__header">
        {!collapsed && (
          <div className="db-sidebar__brand">
            <div className="db-sidebar__brand-mark">
              <AutoPackLogo />
            </div>

            <div className="db-sidebar__brand-copy">
              <span className="db-sidebar__brand-name">
                AutoPack
              </span>

              <span className="db-sidebar__brand-meta">
                Smart Packaging. Smarter Control.
              </span>
            </div>
          </div>
        )}

        <button
          type="button"
          className="db-sidebar__toggle"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            width="18"
            height="18"
            aria-hidden="true"
          >
            <path
              d={collapsed ? 'm9 6 6 6-6 6' : 'm15 6-6 6 6 6'}
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* =================================================
          NAVIGATION LINKS
      ================================================= */}

      <nav className="db-sidebar__nav" aria-label="Sidebar">
        <ul className="db-sidebar__list" role="list">
          {NAV_ITEMS.map((item) => {
            const iconColor = NAV_ICON_COLORS[item.id] || '#1677FF';
            const isActive = activePage === item.id;

            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={`db-sidebar__link${
                    isActive ? ' db-sidebar__link--active' : ''
                  }`}
                  style={{
                    '--nav-accent': iconColor,
                    '--nav-accent-bg': `${iconColor}16`,
                  }}
                  onClick={() => onNavigate(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  title={collapsed ? item.label : undefined}
                >
                  <span
                    className="db-sidebar__icon"
                    style={{ color: iconColor }}
                  >
                    <NavIcon name={item.icon} />
                  </span>

                  {!collapsed && (
                    <span className="db-sidebar__label">
                      {item.label}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

/* =====================================================
   COMPACT COLOUR-CODED NAVIGATION ICONS
===================================================== */

function NavIcon({ name }) {
  const icons = {
    grid: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        width="18"
        height="18"
        aria-hidden="true"
      >
        <rect
          x="3"
          y="3"
          width="7"
          height="7"
          rx="1.5"
          fill="currentColor"
          fillOpacity="0.28"
          stroke="currentColor"
          strokeWidth="1.8"
        />

        <rect
          x="14"
          y="3"
          width="7"
          height="7"
          rx="1.5"
          fill="currentColor"
          fillOpacity="0.28"
          stroke="currentColor"
          strokeWidth="1.8"
        />

        <rect
          x="3"
          y="14"
          width="7"
          height="7"
          rx="1.5"
          fill="currentColor"
          fillOpacity="0.28"
          stroke="currentColor"
          strokeWidth="1.8"
        />

        <rect
          x="14"
          y="14"
          width="7"
          height="7"
          rx="1.5"
          fill="currentColor"
          fillOpacity="0.28"
          stroke="currentColor"
          strokeWidth="1.8"
        />
      </svg>
    ),

    activity: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        width="18"
        height="18"
        aria-hidden="true"
      >
        <rect
          x="3"
          y="12"
          width="4"
          height="9"
          rx="1"
          fill="currentColor"
          fillOpacity="0.65"
        />

        <rect
          x="10"
          y="7"
          width="4"
          height="14"
          rx="1"
          fill="currentColor"
          fillOpacity="0.8"
        />

        <rect
          x="17"
          y="3"
          width="4"
          height="18"
          rx="1"
          fill="currentColor"
          fillOpacity="0.95"
        />
      </svg>
    ),

    heart: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        width="18"
        height="18"
        aria-hidden="true"
      >
        <path
          d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21.2l7.8-7.7 1-1.1a5.5 5.5 0 0 0 0-7.8Z"
          fill="currentColor"
          fillOpacity="0.25"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />

        <path
          d="M4.5 12h4l2-4 3.1 8 2-4h3.9"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),

    cpu: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        width="18"
        height="18"
        aria-hidden="true"
      >
        <rect
          x="5"
          y="5"
          width="14"
          height="14"
          rx="2.5"
          fill="currentColor"
          fillOpacity="0.2"
          stroke="currentColor"
          strokeWidth="1.8"
        />

        <rect
          x="9"
          y="9"
          width="6"
          height="6"
          rx="1"
          fill="currentColor"
          fillOpacity="0.65"
          stroke="currentColor"
          strokeWidth="1.4"
        />

        <path
          d="M9 2v3m6-3v3M9 19v3m6-3v3M2 9h3m-3 6h3m14-6h3m-3 6h3"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),

    layers: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        width="18"
        height="18"
        aria-hidden="true"
      >
        <path
          d="m12 2 9 5-9 5-9-5 9-5Z"
          fill="currentColor"
          fillOpacity="0.38"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />

        <path
          d="m3 12 9 5 9-5M3 17l9 5 9-5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),

    'file-text': (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        width="18"
        height="18"
        aria-hidden="true"
      >
        <path
          d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z"
          fill="currentColor"
          fillOpacity="0.2"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />

        <path
          d="M14 2v6h6M8 13h8M8 17h8"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),

    clock: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        width="18"
        height="18"
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="9.5"
          fill="currentColor"
          fillOpacity="0.2"
          stroke="currentColor"
          strokeWidth="1.8"
        />

        <path
          d="M12 6.5V12l4 2.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  };

  return icons[name] ?? null;
}

export default Sidebar;
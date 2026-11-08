
import { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { NAV_ITEMS } from '../../lib/navItems';

/**
 * TopBar
 *
 * Includes:
 * - Global search across dashboard sections and supplied records.
 * - Manual refresh.
 * - Light/dark theme toggle.
 * - Notifications dropdown.
 * - Administrator profile and logout.
 *
 * Search record structure expected from the application:
 * {
 *   id: 'ORD-1001',
 *   type: 'order',
 *   title: 'Order ORD-1001',
 *   subtitle: 'Processing · Line A',
 *   pageId: 'decision-reports',
 *   searchText: 'ORD-1001 Processing Line A'
 * }
 *
 * Supported record types:
 * order, simulation-run, warning, error, agent-execution.
 */

function TopBar({
  onRefresh,
  onNavigate,
  searchRecords = [],
  onSearchResultSelect,
}) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const [searchValue, setSearchValue] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeResultIndex, setActiveResultIndex] = useState(0);

  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);

  /**
   * Resolve the Dashboard section for a record.
   * Explicit pageId supplied by a data source takes priority.
   */
  const getRecordPage = (record) => {
    if (record.pageId) return record.pageId;

    const type = String(record.type || record.category || '')
      .toLowerCase()
      .replaceAll('_', '-');

    if (['order', 'decision-report'].includes(type)) {
      return 'decision-reports';
    }

    if (
      [
        'simulation',
        'simulation-run',
        'run',
        'warning',
        'error',
        'error-log',
        'system-activity',
      ].includes(type)
    ) {
      return 'logs-history';
    }

    if (['agent', 'agent-execution', 'plan'].includes(type)) {
      return 'ai-agents';
    }

    if (['production', 'production-order'].includes(type)) {
      return 'production-monitoring';
    }

    if (['machine', 'machine-health'].includes(type)) {
      return 'machine-health';
    }

    if (type === 'digital-twin') {
      return 'digital-twin';
    }

    return 'overview';
  };

  /**
   * Create searchable text from the fields used by project records.
   * This supports records received from different backend components.
   */
  const getRecordSearchText = (record) => {
    const searchableFields = [
      record.id,
      record.title,
      record.name,
      record.type,
      record.category,
      record.subtitle,
      record.description,
      record.searchText,
      record.orderId,
      record.runId,
      record.simulationRunId,
      record.warningId,
      record.errorId,
      record.executionId,
      record.agentId,
      record.agentName,
      record.status,
      record.line,
      record.source,
      record.component,
      record.planId,
    ];

    return searchableFields
      .filter((value) => value !== null && value !== undefined)
      .map((value) => String(value).toLowerCase())
      .join(' ');
  };

  /**
   * Build results from:
   * 1. The seven Dashboard navigation sections.
   * 2. Real records supplied by the application.
   *
   * No sample or fabricated records are added here.
   */
  const searchResults = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    if (!query) return [];

    const queryWords = query.split(/\s+/).filter(Boolean);

    const pageResults = NAV_ITEMS
      .filter((item) => {
        const searchableText = `${item.label} ${item.id}`.toLowerCase();

        return queryWords.every((word) => searchableText.includes(word));
      })
      .map((item) => ({
        id: `page-${item.id}`,
        type: 'page',
        typeLabel: 'Dashboard section',
        title: item.label,
        subtitle: 'Open Dashboard section',
        pageId: item.id,
        isPage: true,
      }));

    const recordResults = (
      Array.isArray(searchRecords) ? searchRecords : []
    )
      .filter((record) => {
        const searchableText = getRecordSearchText(record);

        return queryWords.every((word) => searchableText.includes(word));
      })
      .map((record) => {
        const type = String(record.type || record.category || 'record')
          .toLowerCase()
          .replaceAll('_', '-');

        const typeLabels = {
          order: 'Order',
          'decision-report': 'Order report',
          'simulation-run': 'Simulation run',
          simulation: 'Simulation',
          warning: 'Warning',
          error: 'Error',
          'error-log': 'Error log',
          'system-activity': 'System activity',
          agent: 'Agent',
          'agent-execution': 'Agent execution',
          plan: 'Agent plan',
          production: 'Production',
          'production-order': 'Production order',
          'machine-health': 'Machine health',
          'digital-twin': 'Digital Twin',
        };

        const identifier =
          record.id ||
          record.orderId ||
          record.runId ||
          record.warningId ||
          record.executionId ||
          'Record';

        const title =
          record.title ||
          record.name ||
          `${typeLabels[type] || 'Record'} — ${identifier}`;

        const subtitle =
          record.subtitle ||
          [
            identifier,
            record.line,
            record.status,
          ]
            .filter(Boolean)
            .join(' · ');

        return {
          ...record,
          id: String(identifier),
          type,
          typeLabel: typeLabels[type] || 'Record',
          title,
          subtitle,
          pageId: getRecordPage(record),
          isPage: false,
        };
      });

    // Prefer record matches over general section matches.
    return [...recordResults, ...pageResults].slice(0, 10);
  }, [searchValue, searchRecords]);

  // Close open menus when clicking outside them.
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }

      if (
        notifRef.current &&
        !notifRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }

      if (
        searchRef.current &&
        !searchRef.current.contains(event.target)
      ) {
        setSearchOpen(false);
        setActiveResultIndex(0);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Reset keyboard selection whenever the results change.
  useEffect(() => {
    setActiveResultIndex(0);
  }, [searchValue]);

  const closeSearch = () => {
    setSearchOpen(false);
    setActiveResultIndex(0);
  };

  const clearSearch = () => {
    setSearchValue('');
    setSearchOpen(false);
    setActiveResultIndex(0);
    searchInputRef.current?.focus();
  };

  /**
   * Open a selected section or record.
   *
   * Record-specific detail opening is delegated to the application
   * through onSearchResultSelect.
   */
  const handleSelectSearchResult = (result) => {
    if (!result) return;

    onNavigate?.(result.pageId);

    if (!result.isPage) {
      onSearchResultSelect?.(result);
    }

    setSearchValue('');
    closeSearch();
  };

  // Keyboard navigation inside the search results.
  const handleSearchKeyDown = (event) => {
    if (event.key === 'Escape') {
      closeSearch();
      return;
    }

    if (event.key === 'ArrowDown' && searchResults.length > 0) {
      event.preventDefault();
      setSearchOpen(true);

      setActiveResultIndex((current) =>
        current >= searchResults.length - 1 ? 0 : current + 1
      );

      return;
    }

    if (event.key === 'ArrowUp' && searchResults.length > 0) {
      event.preventDefault();
      setSearchOpen(true);

      setActiveResultIndex((current) =>
        current <= 0 ? searchResults.length - 1 : current - 1
      );

      return;
    }

    if (event.key === 'Enter' && searchResults.length > 0) {
      event.preventDefault();
      handleSelectSearchResult(searchResults[activeResultIndex]);
    }
  };

  const handleLogout = async () => {
    setProfileOpen(false);

    try {
      await logout();
    } catch (err) {
      console.error('[TopBar] Sign out failed:', err);
    }
  };

  const normalizedSearch = searchValue.trim();

  return (
    <header className="db-topbar">
      <div className="db-topbar__inner">

        {/* ================================================
            GLOBAL SEARCH
        ================================================ */}

        <div
          className="db-topbar__search"
          ref={searchRef}
        >
          <svg
            className="db-topbar__search-icon"
            viewBox="0 0 24 24"
            fill="none"
            width="16"
            height="16"
            aria-hidden="true"
          >
            <circle
              cx="11"
              cy="11"
              r="8"
              stroke="currentColor"
              strokeWidth="1.8"
            />

            <path
              d="m21 21-4.35-4.35"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>

          <input
            ref={searchInputRef}
            type="search"
            value={searchValue}
            onChange={(event) => {
              setSearchValue(event.target.value);
              setSearchOpen(Boolean(event.target.value.trim()));
            }}
            onFocus={() => {
              if (searchValue.trim()) setSearchOpen(true);
            }}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search orders, runs, warnings, agents..."
            className="db-topbar__search-input"
            aria-label="Global search"
            aria-autocomplete="list"
            aria-expanded={searchOpen && Boolean(normalizedSearch)}
            aria-controls="db-global-search-results"
            autoComplete="off"
            role="combobox"
          />

          {searchValue && (
            <button
              type="button"
              className="db-topbar__search-clear"
              onClick={clearSearch}
              aria-label="Clear search"
              title="Clear search"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                width="15"
                height="15"
                aria-hidden="true"
              >
                <path
                  d="m18 6-12 12M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}

          {/* Search results dropdown */}
          {searchOpen && normalizedSearch && (
            <div
              className="db-dropdown db-dropdown--search"
              id="db-global-search-results"
              role="listbox"
              aria-label="Global search results"
            >
              {searchResults.length > 0 ? (
                <>
                  <div className="db-dropdown__header">
                    <span className="db-dropdown__title">
                      Search Results
                    </span>

                    <span className="db-dropdown__sub">
                      {searchResults.length} matching result
                      {searchResults.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div className="db-search-results">
                    {searchResults.map((result, index) => (
                      <button
                        key={`${result.type}-${result.id}`}
                        type="button"
                        className={`db-search-result${
                          index === activeResultIndex
                            ? ' db-search-result--active'
                            : ''
                        }`}
                        onMouseEnter={() => setActiveResultIndex(index)}
                        onClick={() => handleSelectSearchResult(result)}
                        role="option"
                        aria-selected={index === activeResultIndex}
                      >
                        <span className="db-search-result__content">
                          <span className="db-search-result__title">
                            {result.title}
                          </span>

                          <span className="db-search-result__subtitle">
                            {result.subtitle}
                          </span>
                        </span>

                        <span className="db-search-result__type">
                          {result.typeLabel}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="db-dropdown__footer">
                    <span>Use ↑ ↓ to navigate</span>
                    <span>Enter to open · Esc to close</span>
                  </div>
                </>
              ) : (
                <div className="db-dropdown__empty">
                  <p>No matching results found.</p>

                  <small>
                    Search for an Order ID, Simulation Run ID, warning or
                    agent execution record. Results appear when the
                    corresponding project data is available.
                  </small>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ================================================
            RIGHT-SIDE ACTIONS
        ================================================ */}

        <div className="db-topbar__actions">

          {/* Manual refresh */}
          <button
            type="button"
            className="db-topbar__icon-btn"
            onClick={onRefresh}
            aria-label="Refresh data"
            title="Refresh data"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              width="18"
              height="18"
              aria-hidden="true"
            >
              <path
                d="M23 4v6h-6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <path
                d="M1 20v-6h6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <path
                d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Theme toggle */}
          <button
            type="button"
            className="db-topbar__icon-btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          >
            {isDark ? (
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
              <svg
                viewBox="0 0 24 24"
                fill="none"
                width="18"
                height="18"
                aria-hidden="true"
              >
                <path
                  d="M20.2 15.2A8.5 8.5 0 0 1 8.8 3.8 8.5 8.5 0 1 0 20.2 15.2Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>

          {/* ==============================================
              NOTIFICATIONS
          ============================================== */}

          <div
            className="db-topbar__dropdown-wrap"
            ref={notifRef}
          >
            <button
              type="button"
              className="db-topbar__icon-btn"
              onClick={() => {
                setNotificationsOpen((value) => !value);
                setProfileOpen(false);
              }}
              aria-label="Notifications"
              title="Notifications"
              aria-expanded={notificationsOpen}
              aria-haspopup="dialog"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                width="18"
                height="18"
                aria-hidden="true"
              >
                <path
                  d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <path
                  d="M13.73 21a2 2 0 0 1-3.46 0"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {notificationsOpen && (
              <div
                className="db-dropdown db-dropdown--notif"
                role="dialog"
                aria-label="Notifications"
              >
                <div className="db-dropdown__header">
                  <span className="db-dropdown__title">
                    Notifications
                  </span>
                </div>

                <div className="db-dropdown__empty">
                  <p>No notifications yet.</p>

                  <small>
                    Alerts and system events will appear here.
                  </small>
                </div>
              </div>
            )}
          </div>

          {/* ==============================================
              ADMINISTRATOR PROFILE
          ============================================== */}

          <div
            className="db-topbar__dropdown-wrap"
            ref={profileRef}
          >
            <button
              type="button"
              className="db-topbar__profile-btn"
              onClick={() => {
                setProfileOpen((value) => !value);
                setNotificationsOpen(false);
              }}
              aria-label="Administrator profile menu"
              aria-expanded={profileOpen}
              aria-haspopup="menu"
            >
              <span
                className="db-topbar__avatar"
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="21"
                  height="21"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    cx="12"
                    cy="8"
                    r="3.5"
                    fill="currentColor"
                  />

                  <path
                    d="M4.5 20a7.5 7.5 0 0 1 15 0"
                    fill="currentColor"
                  />
                </svg>
              </span>

              <span className="db-topbar__username">
                Admin
              </span>

              <svg
                viewBox="0 0 24 24"
                fill="none"
                width="14"
                height="14"
                aria-hidden="true"
              >
                <path
                  d="M6 9l6 6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {profileOpen && (
              <div
                className="db-dropdown db-dropdown--profile"
                role="menu"
                aria-label="Profile menu"
              >
                <div className="db-dropdown__header">
                  <span className="db-dropdown__title">
                    Administrator
                  </span>

                  <span className="db-dropdown__sub">
                    {user?.email ?? '—'}
                  </span>
                </div>

                <div className="db-dropdown__divider" />

                <button
                  type="button"
                  className="db-dropdown__item db-dropdown__item--danger"
                  role="menuitem"
                  onClick={handleLogout}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    width="15"
                    height="15"
                    aria-hidden="true"
                  >
                    <path
                      d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    <polyline
                      points="16 17 21 12 16 7"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    <line
                      x1="21"
                      y1="12"
                      x2="9"
                      y2="12"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>

                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default TopBar;

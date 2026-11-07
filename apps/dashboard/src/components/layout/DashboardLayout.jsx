import { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

/**
 * DashboardLayout — main application shell.
 *
 * Props:
 *   activePage             — ID of the current Dashboard page
 *   onNavigate             — (pageId) => void
 *   children               — Current page content
 *   searchRecords          — Actual records available for global search
 *   onSearchResultSelect   — Optional callback when a record is selected
 *   onRefresh              — Optional callback to refresh Dashboard data
 */
function DashboardLayout({
  activePage,
  onNavigate,
  children,
  searchRecords = [],
  onSearchResultSelect,
  onRefresh,
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleRefresh = () => {
    if (typeof onRefresh === 'function') {
      onRefresh();
      return;
    }

    // Temporary fallback until backend refresh integration.
    console.info('[Dashboard] Manual refresh requested. Data integration pending.');
  };

  return (
    <div
      className={`db-shell${sidebarCollapsed ? ' db-shell--collapsed' : ''}`}
    >
      <Sidebar
        activePage={activePage}
        onNavigate={onNavigate}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((value) => !value)}
      />

      <div className="db-main-area">
        <TopBar
          onRefresh={handleRefresh}
          onNavigate={onNavigate}
          searchRecords={searchRecords}
          onSearchResultSelect={onSearchResultSelect}
        />

        <main className="db-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
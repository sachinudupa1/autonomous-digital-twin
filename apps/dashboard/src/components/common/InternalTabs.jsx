/**
 * InternalTabs — horizontal tab strip for page-level sub-sections.
 *
 * Props:
 *   tabs        — Array<{ id: string, label: string }>
 *   activeTab   — string id of the active tab
 *   onTabChange — (tabId: string) => void
 */
function InternalTabs({ tabs, activeTab, onTabChange }) {
  return (
    <div className="tabs" role="tablist" aria-label="Section tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          className="tab-button"
          aria-selected={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export default InternalTabs;

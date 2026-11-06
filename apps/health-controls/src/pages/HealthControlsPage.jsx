import { useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import ManualInputTab from '../components/health/ManualInputTab';
import SyntheticInputTab from '../components/health/SyntheticInputTab';

const TABS = [
  {
    id: 'manual',
    label: 'Manual Input',
    description: 'Enter operating conditions yourself',
  },
  {
    id: 'synthetic',
    label: 'Synthetic Input',
    description: 'Generate simulated operating conditions',
  },
];

function HealthControlsPage({ onLogout }) {
  const [activeTab, setActiveTab] = useState('manual');

  return (
    <AppLayout onLogout={onLogout}>
      {/* Page heading */}
      <section className="page-heading">
        <p className="page-eyebrow">Machine monitoring configuration</p>

        <h2 className="page-title">
          Health Controls
        </h2>

        <p className="page-description">
          Configure simulated health conditions for the AutoPack packaging
          line. Review the calculated health status before applying changes.
        </p>
      </section>

      {/* Input method selection */}
      <div className="tabs" role="tablist" aria-label="Input method">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            id={`${tab.id}-tab`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`${tab.id}-panel`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => setActiveTab(tab.id)}
            className="tab-button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Selected input method */}
      <section
        id={`${activeTab}-panel`}
        role="tabpanel"
        aria-labelledby={`${activeTab}-tab`}
        tabIndex={0}
      >
        {activeTab === 'manual' && <ManualInputTab />}

        {activeTab === 'synthetic' && <SyntheticInputTab />}
      </section>
    </AppLayout>
  );
}

export default HealthControlsPage;
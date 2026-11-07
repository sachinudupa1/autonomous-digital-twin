import { useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import ManualInputTab from '../components/health/ManualInputTab';
import SyntheticInputTab from '../components/health/SyntheticInputTab';

const LINES = [
  {
    id: 'line_1',
    label: 'Line 1',
  },
  {
    id: 'line_2',
    label: 'Line 2',
  },
];

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

/*
 * Each LineControls instance owns its own tab selection.
 * Its ManualInputTab and SyntheticInputTab also own independent values.
 */
function LineControls({ line, isActive }) {
  const [activeTab, setActiveTab] = useState('manual');

  return (
    <section
      className="hc-line-view"
      hidden={!isActive}
      aria-label={`${line.label} health controls`}
      data-line-id={line.id}
    >
      {/* Page heading */}
      <section className="page-heading hc-page-heading">
        <div className="hc-page-heading__topline">
          <p className="page-eyebrow">MACHINE MONITORING</p>

          <span className="hc-environment-label">
            <span className="hc-environment-label__dot" />
            {line.label} · Simulation Environment
          </span>
        </div>

        <h2 className="page-title">
          {line.label} Health Controls
        </h2>

        <p className="page-description">
          Configure the operating conditions of {line.label} independently.
          Review the calculated health assessment before applying any
          changes to this packaging line.
        </p>
      </section>

      {/* Input method selection */}
      <section className="hc-input-section">
        <div className="hc-input-section__heading">
          <div>
            <h3 className="hc-input-section__title">
              Input Configuration
            </h3>

            <p className="hc-input-section__description">
              Choose how {line.label} operating conditions will be provided.
            </p>
          </div>
        </div>

        <div
          className="tabs hc-input-tabs"
          role="tablist"
          aria-label={`${line.label} input method`}
        >
          {TABS.map((tab) => {
            const isTabActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`${line.id}-${tab.id}-tab`}
                type="button"
                role="tab"
                aria-selected={isTabActive}
                aria-controls={`${line.id}-${tab.id}-panel`}
                aria-describedby={`${line.id}-${tab.id}-description`}
                tabIndex={isTabActive ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                className="tab-button hc-input-tab"
              >
                <span className="hc-input-tab__label">
                  {tab.label}
                </span>

                <span
                  id={`${line.id}-${tab.id}-description`}
                  className="hc-input-tab__description"
                >
                  {tab.description}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Selected input method */}
      <section
        id={`${line.id}-${activeTab}-panel`}
        className="hc-tab-content"
        role="tabpanel"
        aria-labelledby={`${line.id}-${activeTab}-tab`}
        tabIndex={0}
      >
        {activeTab === 'manual' && (
          <ManualInputTab lineId={line.id} />
        )}

        {activeTab === 'synthetic' && (
          <SyntheticInputTab lineId={line.id} />
        )}
      </section>
    </section>
  );
}

function HealthControlsPage({ onLogout }) {
  const [activeLine, setActiveLine] = useState('line_1');

  const activeLineConfig =
    LINES.find((line) => line.id === activeLine) || LINES[0];

  return (
    <AppLayout
      onLogout={onLogout}
      activeLine={activeLine}
      onLineChange={setActiveLine}
      activeLineLabel={activeLineConfig.label}
    >
      {/*
       * Both line instances remain mounted.
       * The inactive one is hidden, not unmounted, so its input values
       * and selected input method are preserved when changing lines.
       */}
      {LINES.map((line) => (
        <LineControls
          key={line.id}
          line={line}
          isActive={activeLine === line.id}
        />
      ))}
    </AppLayout>
  );
}

export default HealthControlsPage;
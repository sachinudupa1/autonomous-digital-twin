import { useState } from 'react';
import PageHeader from '../components/common/PageHeader';
import InternalTabs from '../components/common/InternalTabs';
import PlaceholderSection from '../components/common/PlaceholderSection';

/* =====================================================
   DIGITAL TWIN NAVIGATION
===================================================== */

const TABS = [
  { id: 'line-a', label: 'Line A' },
  { id: 'line-b', label: 'Line B' },
  { id: 'system-overview', label: 'System Overview' },
];

/* =====================================================
   DATA FORMATTING HELPERS
===================================================== */

function formatLabel(value) {
  if (value === null || value === undefined || value === '') {
    return 'Not available';
  }

  return String(value)
    .replaceAll('_', ' ')
    .replaceAll('-', ' ');
}

function formatTimestamp(value) {
  if (!value) return 'Not available';

  let date;

  if (typeof value.toDate === 'function') {
    date = value.toDate();
  } else if (typeof value === 'object' && typeof value.seconds === 'number') {
    date = new Date(value.seconds * 1000);
  } else if (typeof value === 'number') {
    date = new Date(
      value < 1000000000000 ? value * 1000 : value
    );
  } else {
    date = new Date(value);
  }

  if (Number.isNaN(date.getTime())) {
    return 'Not available';
  }

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatValue(value) {
  if (value === null || value === undefined || value === '') {
    return 'Not available';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (typeof value === 'object') {
    if (typeof value.toDate === 'function') {
      return formatTimestamp(value);
    }

    if (
      typeof value.seconds === 'number' &&
      Object.keys(value).length <= 2
    ) {
      return formatTimestamp(value);
    }

    if (
      Object.prototype.hasOwnProperty.call(value, 'value')
    ) {
      return [
        value.value,
        value.unit,
      ].filter(Boolean).join(' ');
    }

    try {
      return JSON.stringify(value);
    } catch {
      return 'Data unavailable';
    }
  }

  return String(value);
}

function getStatusClass(status) {
  const normalized = String(status || '').toLowerCase();

  if (
    ['connected', 'synchronised', 'synchronized', 'healthy', 'running', 'online', 'active']
      .some((value) => normalized.includes(value))
  ) {
    return 'db-twin-status--success';
  }

  if (
    ['failed', 'error', 'disconnected', 'critical', 'offline']
      .some((value) => normalized.includes(value))
  ) {
    return 'db-twin-status--danger';
  }

  if (
    ['warning', 'delayed', 'degraded', 'pending', 'partial']
      .some((value) => normalized.includes(value))
  ) {
    return 'db-twin-status--warning';
  }

  return 'db-twin-status--neutral';
}

/* =====================================================
   REUSABLE DATA FIELD
===================================================== */

function DataField({ label, value }) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const isStatus =
    String(label).toLowerCase().includes('status') ||
    String(label).toLowerCase().includes('state');

  return (
    <div className="db-twin-data-field">
      <span className="db-twin-data-field__label">
        {label}
      </span>

      {isStatus ? (
        <span
          className={`db-twin-status ${getStatusClass(value)}`}
        >
          {formatLabel(formatValue(value))}
        </span>
      ) : (
        <span className="db-twin-data-field__value">
          {formatValue(value)}
        </span>
      )}
    </div>
  );
}

/* =====================================================
   REUSABLE DATA PANEL
===================================================== */

/**
 * DataPanel
 *
 * Displays actual data when supplied by the application.
 * Otherwise, displays a clear integration placeholder.
 *
 * Objects are displayed as individual fields.
 * Arrays are displayed as record lists.
 */
function DataPanel({
  title,
  description,
  data,
  emptyNote = 'Waiting for data integration',
  minHeight = '120px',
}) {
  const hasData =
    data !== undefined &&
    data !== null &&
    (
      typeof data !== 'object' ||
      (Array.isArray(data) ? data.length > 0 : Object.keys(data).length > 0)
    );

  let entries = [];

  if (hasData && !Array.isArray(data) && typeof data === 'object') {
    entries = Object.entries(data)
      .filter(([key, value]) => {
        return (
          value !== undefined &&
          value !== null &&
          value !== '' &&
          typeof value !== 'function' &&
          key !== 'id'
        );
      })
      .map(([key, value]) => ({
        label: formatLabel(key),
        value,
      }));
  }

  return (
    <div className="content-panel db-twin-panel">
      <div className="section-heading">
        <h2 className="section-title">{title}</h2>

        {description && (
          <p className="section-description">
            {description}
          </p>
        )}
      </div>

      {!hasData ? (
        <PlaceholderSection
          note={emptyNote}
          height={minHeight}
        />
      ) : Array.isArray(data) ? (
        <TwinRecordList records={data} />
      ) : entries.length > 0 ? (
        <div className="db-twin-data-grid">
          {entries.map((entry) => (
            <DataField
              key={entry.label}
              label={entry.label}
              value={entry.value}
            />
          ))}
        </div>
      ) : (
        <div className="db-twin-data-grid">
          <DataField
            label="Value"
            value={data}
          />
        </div>
      )}
    </div>
  );
}

/* =====================================================
   LATEST UPDATES / COMMUNICATION RECORDS
===================================================== */

function TwinRecordList({ records = [] }) {
  if (!Array.isArray(records) || records.length === 0) {
    return (
      <PlaceholderSection
        note="No records available."
      />
    );
  }

  return (
    <div className="db-twin-record-list">
      {records.map((record, index) => (
        <div
          key={
            record.id ||
            record.timestamp ||
            `${record.title || record.message || 'record'}-${index}`
          }
          className="db-twin-record"
        >
          <div className="db-twin-record__header">
            <span className="db-twin-record__title">
              {record.title ||
                record.message ||
                record.event ||
                record.type ||
                'Recorded event'}
            </span>

            {record.status && (
              <span
                className={`db-twin-status ${getStatusClass(record.status)}`}
              >
                {formatLabel(record.status)}
              </span>
            )}
          </div>

          {record.description && (
            <p className="db-twin-record__description">
              {record.description}
            </p>
          )}

          <div className="db-twin-record__meta">
            {record.source && <span>{record.source}</span>}

            {record.timestamp && (
              <span>{formatTimestamp(record.timestamp)}</span>
            )}

            {record.runId && (
              <span>Run ID: {record.runId}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* =====================================================
   LINE DIGITAL TWIN VIEW
===================================================== */

/**
 * Each production line has its own:
 *
 * - Model 1 status
 * - Model 2 status
 * - Connection state
 * - Current simulation state and Run ID
 * - Data exchange
 * - Synchronisation information
 * - Latest CoppeliaSim updates
 * - Communication errors
 *
 * Model 1 and Model 2 results remain separate.
 *
 * No animation or simulation controls are rendered here.
 */
function LineTwinView({ lineName, lineData = {} }) {
  const model1 = lineData.model1 || null;
  const model2 = lineData.model2 || null;

  const connection = lineData.connection || null;
  const dataExchange = lineData.dataExchange || null;
  const synchronization = lineData.synchronization || null;

  const currentSimulation = lineData.currentSimulation || null;

  const latestUpdates = lineData.latestUpdates || [];
  const communicationErrors = lineData.communicationErrors || [];

  const receivedData =
    lineData.latestDataReceived ||
    dataExchange?.latestReceivedData ||
    null;

  return (
    <div className="db-tab-content">

      {/* Model 1 and Model 2 */}
      <div className="db-grid db-grid--2">
        <DataPanel
          title={`${lineName} — Model 1 Status`}
          description="Simulation model representing the physical prototype."
          data={model1}
          emptyNote="Waiting for Model 1 status and simulation information."
          minHeight="130px"
        />

        <DataPanel
          title={`${lineName} — Model 2 Status`}
          description="Proto replacement/final model running in CoppeliaSim. Status monitoring only."
          data={model2}
          emptyNote="Waiting for Model 2 execution and status information from CoppeliaSim."
          minHeight="130px"
        />
      </div>

      {/* Connection and current run */}
      <div className="db-grid db-grid--2" style={{ marginTop: '20px' }}>
        <DataPanel
          title={`${lineName} — Connection Status`}
          description="Communication state between the Digital Twin, backend and CoppeliaSim."
          data={connection}
          emptyNote="Waiting for connection and communication status."
        />

        <DataPanel
          title={`${lineName} — Current Simulation State`}
          description="Current state and identifiers for the active simulation attempt."
          data={currentSimulation}
          emptyNote="No current simulation state has been received."
        />
      </div>

      {/* Data exchange and synchronisation */}
      <div className="db-grid db-grid--2" style={{ marginTop: '20px' }}>
        <DataPanel
          title={`${lineName} — Data Exchange`}
          description="Information sent to and received from the simulation models."
          data={dataExchange}
          emptyNote="Waiting for sent/received data exchange records."
        />

        <DataPanel
          title={`${lineName} — Synchronisation`}
          description="Model synchronisation state, latest sync time and any recorded delay."
          data={synchronization}
          emptyNote="Waiting for model synchronisation information."
        />
      </div>

      {/* Latest received data and communication issues */}
      <div className="db-grid db-grid--2" style={{ marginTop: '20px' }}>
        <DataPanel
          title={`${lineName} — Latest Data Received from CoppeliaSim`}
          description="Latest telemetry and execution information received by the Digital Twin."
          data={receivedData}
          emptyNote="Waiting for the latest CoppeliaSim data."
        />

        <DataPanel
          title={`${lineName} — Communication Errors`}
          description="Recorded communication failures, timeout events and data exchange errors."
          data={communicationErrors}
          emptyNote="No communication error records have been supplied."
        />
      </div>

      {/* Latest updates */}
      <div style={{ marginTop: '20px' }}>
        <div className="content-panel db-twin-panel">
          <div className="section-heading">
            <h2 className="section-title">
              {lineName} — Latest Updates
            </h2>

            <p className="section-description">
              Recent model-state changes, data exchanges and synchronisation events.
            </p>
          </div>

          <TwinRecordList records={latestUpdates} />
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   SYSTEM OVERVIEW
===================================================== */

/**
 * Combined view across both lines.
 *
 * It monitors the two independent production lines.
 * It does not assume that the lines are physically connected.
 */
function SystemTwinView({
  systemData = {},
  lineAData = {},
  lineBData = {},
}) {
  const lineAStatus = systemData.lineAStatus || null;
  const lineBStatus = systemData.lineBStatus || null;

  const overallConnections = systemData.connectionStatus || null;
  const overallExchange = systemData.dataExchange || null;
  const overallSynchronization = systemData.synchronization || null;

  const communicationErrors =
    systemData.communicationErrors || [];

  return (
    <div className="db-tab-content">

      {/* Overall system information */}
      <div className="db-grid db-grid--2">
        <DataPanel
          title="Overall Digital Twin Status"
          description="Combined status of the Digital Twin across both independent production lines."
          data={systemData.overallStatus || null}
          emptyNote="Waiting for overall Digital Twin status."
        />

        <DataPanel
          title="System Connection Status"
          description="Overall communication and connection status."
          data={overallConnections}
          emptyNote="Waiting for system connection data."
        />
      </div>

      {/* Individual line summaries */}
      <div className="db-grid db-grid--2" style={{ marginTop: '20px' }}>
        <DataPanel
          title="Line A — Twin Status"
          description="Model and connection status for Line A."
          data={
            lineAStatus || {
              model1: lineAData.model1?.status,
              model2: lineAData.model2?.status,
              connection: lineAData.connection?.status,
              synchronization: lineAData.synchronization?.status,
            }
          }
          emptyNote="Waiting for Line A status information."
        />

        <DataPanel
          title="Line B — Twin Status"
          description="Model and connection status for Line B."
          data={
            lineBStatus || {
              model1: lineBData.model1?.status,
              model2: lineBData.model2?.status,
              connection: lineBData.connection?.status,
              synchronization: lineBData.synchronization?.status,
            }
          }
          emptyNote="Waiting for Line B status information."
        />
      </div>

      {/* Combined data exchange and synchronization */}
      <div className="db-grid db-grid--2" style={{ marginTop: '20px' }}>
        <DataPanel
          title="Overall Data Exchange"
          description="Combined communication and data exchange summary across both lines."
          data={overallExchange}
          emptyNote="Waiting for combined data exchange metrics."
        />

        <DataPanel
          title="System Synchronisation"
          description="Overall synchronisation state and line-specific synchronisation information."
          data={overallSynchronization}
          emptyNote="Waiting for system synchronisation information."
        />
      </div>

      {/* System communication errors */}
      <div style={{ marginTop: '20px' }}>
        <DataPanel
          title="System Communication Errors"
          description="Communication failures and synchronization issues across Line A and Line B."
          data={communicationErrors}
          emptyNote="No system communication error records have been supplied."
          minHeight="150px"
        />
      </div>

    </div>
  );
}

/* =====================================================
   MAIN DIGITAL TWIN PAGE
===================================================== */

/**
 * DigitalTwinPage — Section E
 *
 * Optional props:
 *
 * lineAData:
 *   Digital Twin information for Line A.
 *
 * lineBData:
 *   Digital Twin information for Line B.
 *
 * systemData:
 *   Combined system status, communication and synchronisation information.
 *
 * Expected line data structure:
 *
 * {
 *   model1: {},
 *   model2: {},
 *   connection: {},
 *   currentSimulation: {},
 *   dataExchange: {},
 *   synchronization: {},
 *   latestDataReceived: {},
 *   latestUpdates: [],
 *   communicationErrors: []
 * }
 *
 * No direct CoppeliaSim connection is created by this page.
 * The backend supplies the relevant records.
 */
function DigitalTwinPage({
  lineAData = {},
  lineBData = {},
  systemData = {},
}) {
  const [activeTab, setActiveTab] = useState('line-a');

  return (
    <div className="db-page">
      <PageHeader
        eyebrow="Simulation"
        title="Digital Twin"
        description="Monitor Model 1 and Model 2 status, data exchange, synchronisation and communication health across both production lines."
      />

      <InternalTabs
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === 'line-a' && (
        <LineTwinView
          lineName="Line A"
          lineData={lineAData}
        />
      )}

      {activeTab === 'line-b' && (
        <LineTwinView
          lineName="Line B"
          lineData={lineBData}
        />
      )}

      {activeTab === 'system-overview' && (
        <SystemTwinView
          systemData={systemData}
          lineAData={lineAData}
          lineBData={lineBData}
        />
      )}
    </div>
  );
}

export default DigitalTwinPage;
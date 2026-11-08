import { useMemo, useState } from 'react';
import PageHeader from '../components/common/PageHeader';
import InternalTabs from '../components/common/InternalTabs';
import Modal from '../components/common/Modal';

const TABS = [
  { id: 'warnings', label: 'Warnings' },
  { id: 'error-logs', label: 'Error Logs' },
  { id: 'system-activity', label: 'System Activity' },
  { id: 'simulation-history', label: 'Simulation History' },
];

const SEVERITY_ORDER = {
  critical: 0,
  high: 1,
  medium: 2,
  warning: 2,
  low: 3,
  info: 4,
};

const SEVERITY_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'critical', label: 'Critical' },
  { id: 'high', label: 'High' },
  { id: 'medium', label: 'Medium' },
  { id: 'low', label: 'Low' },
];

/**
 * Converts different backend timestamp formats into milliseconds.
 * Supports JavaScript dates, date strings, Unix timestamps
 * and Firestore Timestamp objects.
 */
function getTimestampValue(value) {
  if (!value) return null;

  if (typeof value.toDate === 'function') {
    const date = value.toDate();
    return Number.isNaN(date.getTime()) ? null : date.getTime();
  }

  if (typeof value === 'object' && typeof value.seconds === 'number') {
    return value.seconds * 1000;
  }

  if (typeof value === 'number') {
    return value < 1000000000000 ? value * 1000 : value;
  }

  const parsed = new Date(value).getTime();

  return Number.isNaN(parsed) ? null : parsed;
}

function formatTimestamp(value) {
  const timestamp = getTimestampValue(value);

  if (timestamp === null) return 'Not available';

  return new Date(timestamp).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function getRecordTimestamp(record) {
  return (
    record.timestamp ||
    record.createdAt ||
    record.occurredAt ||
    record.startedAt ||
    record.startTimestamp ||
    null
  );
}

function getRecordId(record) {
  return (
    record.id ||
    record.warningId ||
    record.errorId ||
    record.activityId ||
    record.runId ||
    record.simulationRunId ||
    record.executionId ||
    'ID unavailable'
  );
}

function normalizeSeverity(value) {
  return String(value || 'unknown').trim().toLowerCase();
}

function getSeverityClass(severity) {
  const normalized = normalizeSeverity(severity);

  if (normalized === 'critical' || normalized === 'high') {
    return 'db-badge--danger';
  }

  if (normalized === 'medium' || normalized === 'warning') {
    return 'db-badge--warning';
  }

  if (normalized === 'low' || normalized === 'info') {
    return 'db-badge--info';
  }

  return 'db-badge--primary';
}

function normalizeStatus(value) {
  return String(value || 'unknown')
    .trim()
    .toLowerCase()
    .replaceAll('_', '-')
    .replaceAll(' ', '-');
}

function formatLabel(value) {
  if (value === null || value === undefined || value === '') {
    return 'Not available';
  }

  return String(value)
    .replaceAll('_', ' ')
    .replaceAll('-', ' ');
}

function getWarningType(warning) {
  const type = String(
    warning.warningType ||
    warning.type ||
    warning.category ||
    ''
  ).toLowerCase();

  if (type.includes('predict')) return 'predicted';

  return 'detected';
}

function getAffectedLine(record) {
  return (
    record.line ||
    record.productionLine ||
    record.affectedLine ||
    'Not specified'
  );
}

function getAffectedComponent(record) {
  return (
    record.component ||
    record.machine ||
    record.affectedComponent ||
    record.source ||
    'Not specified'
  );
}

function getRelatedOrderId(record) {
  return record.orderId || record.relatedOrderId || null;
}

function getRelatedRunId(record) {
  return (
    record.runId ||
    record.simulationRunId ||
    record.relatedRunId ||
    null
  );
}

/**
 * Converts readings and reference values into displayable rows.
 * Supports arrays of readings and simple objects.
 */
function getValueEntries(data) {
  if (!data) return [];

  if (Array.isArray(data)) {
    return data.map((item, index) => ({
      label: item.name || item.label || `Reading ${index + 1}`,
      value: [
        item.value,
        item.unit,
      ].filter(Boolean).join(' '),
      reference: item.reference || item.referenceValue,
      status: item.status,
    }));
  }

  if (typeof data === 'object') {
    return Object.entries(data).map(([key, value]) => {
      if (value && typeof value === 'object') {
        return {
          label: formatLabel(key),
          value: [
            value.value,
            value.unit,
          ].filter(Boolean).join(' ') || JSON.stringify(value),
          reference: value.reference || value.referenceValue,
          status: value.status,
        };
      }

      return {
        label: formatLabel(key),
        value: String(value),
      };
    });
  }

  return [{ label: 'Value', value: String(data) }];
}

/**
 * Reusable detail section.
 */
function DetailSection({ title, children }) {
  return (
    <section className="db-log-detail-section">
      <h3 className="section-title db-log-detail-section__title">
        {title}
      </h3>
      {children}
    </section>
  );
}

/**
 * Reusable detail field.
 */
function DetailField({ label, value }) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  return (
    <div className="db-log-detail-field">
      <span className="db-log-detail-field__label">
        {label}
      </span>

      <span className="db-log-detail-field__value">
        {String(value)}
      </span>
    </div>
  );
}

/**
 * Displays a real collection of readings or an honest empty state.
 */
function ReadingsList({ data, emptyMessage }) {
  const entries = getValueEntries(data);

  if (entries.length === 0) {
    return (
      <div className="db-placeholder">
        <span className="db-placeholder__note">
          {emptyMessage}
        </span>
      </div>
    );
  }

  return (
    <div className="db-log-readings">
      {entries.map((item, index) => (
        <div
          className="db-log-reading"
          key={`${item.label}-${index}`}
        >
          <span className="db-log-reading__label">
            {item.label}
          </span>

          <span className="db-log-reading__value">
            {item.value || 'Not available'}
          </span>

          {item.reference && (
            <span className="db-log-reading__reference">
              Reference: {item.reference}
            </span>
          )}

          {item.status && (
            <span className="db-log-reading__status">
              {formatLabel(item.status)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Entry list shared by Warnings, Error Logs,
 * System Activity and Simulation History.
 */
function EntryList({ entries, onSelect, emptyTitle, emptyNote, renderEntry }) {
  if (entries.length === 0) {
    return (
      <div className="db-placeholder">
        <span className="db-placeholder__label">
          {emptyTitle}
        </span>

        <span className="db-placeholder__note">
          {emptyNote}
        </span>
      </div>
    );
  }

  return (
    <div className="db-entries-list">
      {entries.map((entry, index) => (
        <button
          key={`${getRecordId(entry)}-${index}`}
          type="button"
          className="db-entry-item"
          onClick={() => onSelect(entry)}
        >
          {renderEntry(entry)}
        </button>
      ))}
    </div>
  );
}

/**
 * LogsHistoryPage — Section G
 *
 * Props:
 *
 * warnings:
 *   Currently active warnings. Resolved warnings should remain
 *   available in the error/history records, not the active list.
 *
 * errors:
 *   Complete error records, including resolved warnings retained
 *   for historical inspection.
 *
 * activities:
 *   Persisted system activity records.
 *
 * simulationRuns:
 *   Complete simulation attempts, including failed and abandoned runs.
 *
 * onAcknowledgeWarning:
 *   Optional backend callback receiving (warningId, warning).
 *
 * onResolveWarning:
 *   Optional backend callback receiving (warningId, warning).
 *
 * No demonstration records are generated by this page.
 */
function LogsHistoryPage({
  warnings = [],
  errors = [],
  activities = [],
  simulationRuns = [],
  onAcknowledgeWarning,
  onResolveWarning,
}) {
  const [activeTab, setActiveTab] = useState('warnings');
  const [selectedEntry, setSelectedEntry] = useState(null);

  const [warningSeverityFilter, setWarningSeverityFilter] = useState('all');
  const [warningTypeFilter, setWarningTypeFilter] = useState('all');

  const [errorSearch, setErrorSearch] = useState('');
  const [errorSeverityFilter, setErrorSeverityFilter] = useState('all');
  const [errorComponentFilter, setErrorComponentFilter] = useState('all');
  const [errorDateFrom, setErrorDateFrom] = useState('');
  const [errorDateTo, setErrorDateTo] = useState('');

  const [activitySearch, setActivitySearch] = useState('');
  const [simulationSearch, setSimulationSearch] = useState('');

  const [actionPending, setActionPending] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');

  /*
   * Warnings:
   * Critical → High → Medium → Low.
   * Within the same severity, newest warnings appear first.
   */
  const activeWarnings = useMemo(() => {
    const records = Array.isArray(warnings) ? warnings : [];

    return records
      .filter((warning) => {
        return normalizeStatus(warning.status) !== 'resolved';
      })
      .filter((warning) => {
        const severity = normalizeSeverity(warning.severity);

        return (
          warningSeverityFilter === 'all' ||
          severity === warningSeverityFilter
        );
      })
      .filter((warning) => {
        return (
          warningTypeFilter === 'all' ||
          getWarningType(warning) === warningTypeFilter
        );
      })
      .sort((a, b) => {
        const severityDifference =
          (SEVERITY_ORDER[normalizeSeverity(a.severity)] ?? 99) -
          (SEVERITY_ORDER[normalizeSeverity(b.severity)] ?? 99);

        if (severityDifference !== 0) {
          return severityDifference;
        }

        return (
          (getTimestampValue(getRecordTimestamp(b)) || 0) -
          (getTimestampValue(getRecordTimestamp(a)) || 0)
        );
      });
  }, [warnings, warningSeverityFilter, warningTypeFilter]);

  /*
   * Error logs:
   * Searchable by error ID, component, Order ID and Simulation Run ID.
   * Includes retained resolved-warning records when supplied by backend.
   */
  const filteredErrors = useMemo(() => {
    const records = Array.isArray(errors) ? errors : [];
    const query = errorSearch.trim().toLowerCase();

    return records
      .filter((record) => {
        const severity = normalizeSeverity(record.severity);

        return (
          errorSeverityFilter === 'all' ||
          severity === errorSeverityFilter
        );
      })
      .filter((record) => {
        return (
          errorComponentFilter === 'all' ||
          getAffectedComponent(record) === errorComponentFilter
        );
      })
      .filter((record) => {
        const searchableText = [
          getRecordId(record),
          record.title,
          record.description,
          record.message,
          record.source,
          record.component,
          record.orderId,
          record.runId,
          record.simulationRunId,
          record.errorCode,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return !query || searchableText.includes(query);
      })
      .filter((record) => {
        const timestamp = getTimestampValue(getRecordTimestamp(record));

        if (timestamp === null) {
          return !errorDateFrom && !errorDateTo;
        }

        const date = new Date(timestamp);
        const localDate = [
          date.getFullYear(),
          String(date.getMonth() + 1).padStart(2, '0'),
          String(date.getDate()).padStart(2, '0'),
        ].join('-');

        if (errorDateFrom && localDate < errorDateFrom) return false;
        if (errorDateTo && localDate > errorDateTo) return false;

        return true;
      })
      .sort((a, b) => {
        return (
          (getTimestampValue(getRecordTimestamp(b)) || 0) -
          (getTimestampValue(getRecordTimestamp(a)) || 0)
        );
      });
  }, [
    errors,
    errorSearch,
    errorSeverityFilter,
    errorComponentFilter,
    errorDateFrom,
    errorDateTo,
  ]);

  /*
   * Extract real component names for the Error Logs filter.
   */
  const errorComponents = useMemo(() => {
    const records = Array.isArray(errors) ? errors : [];

    return [
      ...new Set(
        records
          .map(getAffectedComponent)
          .filter((component) => component !== 'Not specified')
      ),
    ].sort();
  }, [errors]);

  /*
   * System activity:
   * Newest activity first.
   */
  const filteredActivities = useMemo(() => {
    const records = Array.isArray(activities) ? activities : [];
    const query = activitySearch.trim().toLowerCase();

    return records
      .filter((record) => {
        const searchableText = [
          getRecordId(record),
          record.title,
          record.description,
          record.event,
          record.source,
          record.actor,
          record.orderId,
          record.runId,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return !query || searchableText.includes(query);
      })
      .sort((a, b) => {
        return (
          (getTimestampValue(getRecordTimestamp(b)) || 0) -
          (getTimestampValue(getRecordTimestamp(a)) || 0)
        );
      });
  }, [activities, activitySearch]);

  /*
   * Simulation history:
   * Every attempt is retained, regardless of its status.
   */
  const filteredSimulationRuns = useMemo(() => {
    const records = Array.isArray(simulationRuns) ? simulationRuns : [];
    const query = simulationSearch.trim().toLowerCase();

    return records
      .filter((record) => {
        const searchableText = [
          getRecordId(record),
          record.title,
          record.description,
          record.runId,
          record.simulationRunId,
          record.line,
          record.productionLine,
          record.status,
          record.model1Status,
          record.model2Status,
          record.orderId,
          record.selectedPlan,
          record.planId,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return !query || searchableText.includes(query);
      })
      .sort((a, b) => {
        return (
          (getTimestampValue(getRecordTimestamp(b)) || 0) -
          (getTimestampValue(getRecordTimestamp(a)) || 0)
        );
      });
  }, [simulationRuns, simulationSearch]);

  const handleEntryClick = (entry, type) => {
    setSelectedEntry({
      ...entry,
      recordType: type,
    });

    setActionMessage('');
    setActionError('');
  };

  /**
   * Warning acknowledgement/resolution is handled by the backend.
   * This page does not pretend that an action succeeded when
   * the corresponding integration callback is unavailable.
   */
  const handleWarningAction = async (action) => {
    if (!selectedEntry || actionPending) return;

    const callback =
      action === 'acknowledge'
        ? onAcknowledgeWarning
        : onResolveWarning;

    if (typeof callback !== 'function') {
      setActionError(
        'Warning updates are not connected yet. Backend integration is required.'
      );
      return;
    }

    setActionPending(true);
    setActionMessage('');
    setActionError('');

    try {
      await callback(getRecordId(selectedEntry), selectedEntry);

      setActionMessage(
        action === 'acknowledge'
          ? 'Acknowledgement request submitted.'
          : 'Resolution request submitted.'
      );
    } catch (error) {
      console.error('[LogsHistoryPage] Warning action failed:', error);

      setActionError(
        error?.message || 'Unable to update this warning. Please try again.'
      );
    } finally {
      setActionPending(false);
    }
  };

  const renderWarningEntry = (warning) => {
    const severity = normalizeSeverity(warning.severity);
    const warningType = getWarningType(warning);

    return (
      <>
        <div className="db-entry-item__header">
          <span className={`db-badge ${getSeverityClass(severity)}`}>
            {formatLabel(severity)}
          </span>

          <span className="db-badge db-badge--primary">
            {warningType}
          </span>

          <span className="db-entry-item__id">
            {getRecordId(warning)}
          </span>

          <span className="db-entry-item__source">
            {getAffectedLine(warning)} · {getAffectedComponent(warning)}
          </span>
        </div>

        <div className="db-entry-item__title">
          {warning.title || warning.description || 'Warning details unavailable'}
        </div>

        <span className="db-entry-item__source">
          {formatTimestamp(getRecordTimestamp(warning))}
          {' · '}
          {formatLabel(warning.status || 'active')}
        </span>
      </>
    );
  };

  const renderErrorEntry = (error) => (
    <>
      <div className="db-entry-item__header">
        <span className={`db-badge ${getSeverityClass(error.severity)}`}>
          {formatLabel(error.severity)}
        </span>

        <span className="db-entry-item__id">
          {getRecordId(error)}
        </span>

        <span className="db-entry-item__source">
          {getAffectedComponent(error)}
        </span>
      </div>

      <div className="db-entry-item__title">
        {error.title || error.message || 'Error details unavailable'}
      </div>

      <span className="db-entry-item__source">
        {formatTimestamp(getRecordTimestamp(error))}
        {getRelatedOrderId(error) ? ` · Order ${getRelatedOrderId(error)}` : ''}
        {getRelatedRunId(error) ? ` · Run ${getRelatedRunId(error)}` : ''}
      </span>
    </>
  );

  const renderActivityEntry = (activity) => (
    <>
      <div className="db-entry-item__header">
        <span className="db-badge db-badge--info">
          {formatLabel(activity.eventType || activity.severity || 'Activity')}
        </span>

        <span className="db-entry-item__id">
          {getRecordId(activity)}
        </span>

        <span className="db-entry-item__source">
          {activity.source || activity.actor || 'System'}
        </span>
      </div>

      <div className="db-entry-item__title">
        {activity.title || activity.description || activity.event || 'Activity details unavailable'}
      </div>

      <span className="db-entry-item__source">
        {formatTimestamp(getRecordTimestamp(activity))}
      </span>
    </>
  );

  const renderSimulationEntry = (simulation) => (
    <>
      <div className="db-entry-item__header">
        <span className="db-badge db-badge--primary">
          {getRecordId(simulation)}
        </span>

        <span className="db-badge db-badge--info">
          {formatLabel(simulation.status || 'Status unavailable')}
        </span>

        <span className="db-entry-item__source">
          {getAffectedLine(simulation)}
        </span>
      </div>

      <div className="db-entry-item__title">
        {simulation.title ||
          simulation.description ||
          'Simulation run'}
      </div>

      <span className="db-entry-item__source">
        Started: {formatTimestamp(
          simulation.startedAt || simulation.startTimestamp
        )}
        {' · '}
        Model 1: {formatLabel(simulation.model1Status || 'Not available')}
        {' · '}
        Model 2: {formatLabel(simulation.model2Status || 'Not available')}
      </span>
    </>
  );

  return (
    <div className="db-page">
      <PageHeader
        eyebrow="Audit & Logs"
        title="Logs & History"
        description="Review warnings, system failures, important activity and permanently retained simulation attempts."
      />

      <InternalTabs
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* =================================================
          WARNINGS
      ================================================= */}

      {activeTab === 'warnings' && (
        <div className="db-tab-content">
          <div className="content-panel">
            <div className="section-heading">
              <h2 className="section-title">
                Active Warnings
              </h2>

              <p className="section-description">
                Current detected conditions and predicted future risks.
                Critical and High warnings appear first.
              </p>
            </div>

            <div className="db-filter-bar" style={{ marginBottom: '18px' }}>
              <div className="db-filter-chips">
                {SEVERITY_FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    className={`db-chip${
                      warningSeverityFilter === filter.id
                        ? ' db-chip--active'
                        : ''
                    }`}
                    onClick={() => setWarningSeverityFilter(filter.id)}
                    aria-pressed={warningSeverityFilter === filter.id}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              <div
                className="db-filter-chips"
                style={{ marginTop: '10px' }}
              >
                {[
                  { id: 'all', label: 'All Types' },
                  { id: 'detected', label: 'Detected' },
                  { id: 'predicted', label: 'Predicted' },
                ].map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    className={`db-chip${
                      warningTypeFilter === filter.id
                        ? ' db-chip--active'
                        : ''
                    }`}
                    onClick={() => setWarningTypeFilter(filter.id)}
                    aria-pressed={warningTypeFilter === filter.id}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <EntryList
              entries={activeWarnings}
              onSelect={(entry) => handleEntryClick(entry, 'warning')}
              emptyTitle={
                warnings.length === 0
                  ? 'No warning records available'
                  : 'No matching active warnings'
              }
              emptyNote={
                warnings.length === 0
                  ? 'Warning records will appear here when the machine monitoring system and agents supply real data.'
                  : 'Try another severity or warning-type filter.'
              }
              renderEntry={renderWarningEntry}
            />
          </div>
        </div>
      )}

      {/* =================================================
          ERROR LOGS
      ================================================= */}

      {activeTab === 'error-logs' && (
        <div className="db-tab-content">
          <div className="content-panel">
            <div className="section-heading">
              <h2 className="section-title">
                System Error Logs
              </h2>

              <p className="section-description">
                Historical records of agent, model, backend, database and
                communication failures, including resolved warnings.
              </p>
            </div>

            <div className="db-log-filter-grid">
              <div className="form-field">
                <label className="form-label" htmlFor="error-search">
                  Search records
                </label>

                <input
                  id="error-search"
                  type="search"
                  className="form-input"
                  placeholder="Error ID, component, Order ID, Run ID..."
                  value={errorSearch}
                  onChange={(event) => setErrorSearch(event.target.value)}
                />
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="error-severity">
                  Severity
                </label>

                <select
                  id="error-severity"
                  className="form-input"
                  value={errorSeverityFilter}
                  onChange={(event) => setErrorSeverityFilter(event.target.value)}
                >
                  <option value="all">All severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="error-component">
                  Component
                </label>

                <select
                  id="error-component"
                  className="form-input"
                  value={errorComponentFilter}
                  onChange={(event) => setErrorComponentFilter(event.target.value)}
                >
                  <option value="all">All components</option>

                  {errorComponents.map((component) => (
                    <option key={component} value={component}>
                      {component}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="error-date-from">
                  From date
                </label>

                <input
                  id="error-date-from"
                  type="date"
                  className="form-input"
                  value={errorDateFrom}
                  onChange={(event) => setErrorDateFrom(event.target.value)}
                />
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="error-date-to">
                  To date
                </label>

                <input
                  id="error-date-to"
                  type="date"
                  className="form-input"
                  value={errorDateTo}
                  onChange={(event) => setErrorDateTo(event.target.value)}
                />
              </div>
            </div>

            <EntryList
              entries={filteredErrors}
              onSelect={(entry) => handleEntryClick(entry, 'error')}
              emptyTitle={
                errors.length === 0
                  ? 'No error records available'
                  : 'No matching error records'
              }
              emptyNote={
                errors.length === 0
                  ? 'System errors and resolved warning records will appear here when supplied by the backend.'
                  : 'Try changing the search terms, component, severity or date range.'
              }
              renderEntry={renderErrorEntry}
            />
          </div>
        </div>
      )}

      {/* =================================================
          SYSTEM ACTIVITY
      ================================================= */}

      {activeTab === 'system-activity' && (
        <div className="db-tab-content">
          <div className="content-panel">
            <div className="section-heading">
              <h2 className="section-title">
                System Activity
              </h2>

              <p className="section-description">
                Important system events, order changes, agent executions,
                Main Agent decisions, health updates and Twin synchronization.
              </p>
            </div>

            <div className="db-log-filter-grid">
              <div className="form-field">
                <label className="form-label" htmlFor="activity-search">
                  Search activity
                </label>

                <input
                  id="activity-search"
                  type="search"
                  className="form-input"
                  placeholder="Search events, agents, orders or runs..."
                  value={activitySearch}
                  onChange={(event) => setActivitySearch(event.target.value)}
                />
              </div>
            </div>

            <EntryList
              entries={filteredActivities}
              onSelect={(entry) => handleEntryClick(entry, 'activity')}
              emptyTitle={
                activities.length === 0
                  ? 'No activity records available'
                  : 'No matching activity records'
              }
              emptyNote={
                activities.length === 0
                  ? 'Persisted system activity will appear here when the backend supplies it.'
                  : 'Try another activity search.'
              }
              renderEntry={renderActivityEntry}
            />
          </div>
        </div>
      )}

      {/* =================================================
          SIMULATION HISTORY
      ================================================= */}

      {activeTab === 'simulation-history' && (
        <div className="db-tab-content">
          <div className="content-panel">
            <div className="section-heading">
              <h2 className="section-title">
                Simulation History
              </h2>

              <p className="section-description">
                Complete history of simulation attempts, including completed,
                failed and abandoned runs. Each attempt retains its own Run ID.
              </p>
            </div>

            <div className="db-log-filter-grid">
              <div className="form-field">
                <label className="form-label" htmlFor="simulation-search">
                  Search simulation runs
                </label>

                <input
                  id="simulation-search"
                  type="search"
                  className="form-input"
                  placeholder="Run ID, line, status, Order ID..."
                  value={simulationSearch}
                  onChange={(event) => setSimulationSearch(event.target.value)}
                />
              </div>
            </div>

            <EntryList
              entries={filteredSimulationRuns}
              onSelect={(entry) => handleEntryClick(entry, 'simulation')}
              emptyTitle={
                simulationRuns.length === 0
                  ? 'No simulation runs available'
                  : 'No matching simulation runs'
              }
              emptyNote={
                simulationRuns.length === 0
                  ? 'Every simulation attempt will appear here once run-history integration is connected.'
                  : 'Try another Run ID, line, status or Order ID.'
              }
              renderEntry={renderSimulationEntry}
            />
          </div>
        </div>
      )}

      {/* =================================================
          DETAIL POPUP
      ================================================= */}

      <Modal
        open={selectedEntry !== null}
        onClose={() => {
          setSelectedEntry(null);
          setActionMessage('');
          setActionError('');
        }}
        title={
          selectedEntry
            ? `${
                selectedEntry.recordType === 'simulation'
                  ? 'Simulation Run'
                  : selectedEntry.recordType === 'activity'
                    ? 'System Activity'
                    : selectedEntry.recordType === 'warning'
                      ? 'Warning'
                      : 'Error Log'
              } Detail — ${getRecordId(selectedEntry)}`
            : 'Record Detail'
        }
        wide
      >
        {selectedEntry && (
          <div className="db-log-detail-modal">

            {/* =========================================
                WARNING DETAILS
            ========================================= */}

            {selectedEntry.recordType === 'warning' && (
              <>
                <div className="db-report-detail-header">
                  <DetailField
                    label="Warning ID"
                    value={getRecordId(selectedEntry)}
                  />

                  <DetailField
                    label="Severity"
                    value={formatLabel(selectedEntry.severity)}
                  />

                  <DetailField
                    label="Status"
                    value={formatLabel(selectedEntry.status || 'active')}
                  />
                </div>

                <DetailSection title="Warning Description">
                  <p className="db-log-detail-description">
                    {selectedEntry.description ||
                      selectedEntry.title ||
                      'No description supplied.'}
                  </p>

                  <div className="db-log-detail-grid">
                    <DetailField
                      label="Warning Type"
                      value={getWarningType(selectedEntry)}
                    />

                    <DetailField
                      label="Timestamp"
                      value={formatTimestamp(getRecordTimestamp(selectedEntry))}
                    />

                    <DetailField
                      label="Affected Line"
                      value={getAffectedLine(selectedEntry)}
                    />

                    <DetailField
                      label="Affected Component"
                      value={getAffectedComponent(selectedEntry)}
                    />

                    <DetailField
                      label="Source"
                      value={selectedEntry.source}
                    />

                    <DetailField
                      label="Predicting Agent"
                      value={selectedEntry.agentName || selectedEntry.agentId}
                    />

                    <DetailField
                      label="Related Order ID"
                      value={getRelatedOrderId(selectedEntry)}
                    />

                    <DetailField
                      label="Simulation Run ID"
                      value={getRelatedRunId(selectedEntry)}
                    />
                  </div>
                </DetailSection>

                <DetailSection title="Actual Machine Readings">
                  <ReadingsList
                    data={
                      selectedEntry.actualReadings ||
                      selectedEntry.readings ||
                      selectedEntry.telemetry
                    }
                    emptyMessage="Actual readings have not been supplied."
                  />
                </DetailSection>

                <DetailSection title="Reference Values">
                  <ReadingsList
                    data={
                      selectedEntry.referenceValues ||
                      selectedEntry.thresholds
                    }
                    emptyMessage="Reference or threshold values have not been supplied."
                  />
                </DetailSection>

                <DetailSection title="Recommended Action">
                  <p className="db-log-detail-description">
                    {selectedEntry.recommendedAction ||
                      'No recommended action has been supplied.'}
                  </p>
                </DetailSection>

                <DetailSection title="Warning Management">
                  <div className="db-log-warning-actions">
                    {normalizeStatus(selectedEntry.status) !== 'acknowledged' &&
                      normalizeStatus(selectedEntry.status) !== 'resolved' && (
                        <button
                          type="button"
                          className="secondary-button"
                          disabled={actionPending || !onAcknowledgeWarning}
                          onClick={() => handleWarningAction('acknowledge')}
                          title={
                            !onAcknowledgeWarning
                              ? 'Backend integration is required'
                              : 'Acknowledge warning'
                          }
                        >
                          Acknowledge Warning
                        </button>
                      )}

                    {normalizeStatus(selectedEntry.status) !== 'resolved' && (
                      <button
                        type="button"
                        className="primary-button"
                        disabled={actionPending || !onResolveWarning}
                        onClick={() => handleWarningAction('resolve')}
                        title={
                          !onResolveWarning
                            ? 'Backend integration is required'
                            : 'Mark warning as resolved'
                        }
                      >
                        {actionPending ? 'Updating...' : 'Mark as Resolved'}
                      </button>
                    )}
                  </div>

                  {actionMessage && (
                    <p className="db-log-action-message">
                      {actionMessage}
                    </p>
                  )}

                  {actionError && (
                    <p className="form-error">
                      {actionError}
                    </p>
                  )}

                  <p className="db-modal-note">
                    A resolved warning must be retained in Error Logs
                    with its resolution status and timestamp.
                  </p>
                </DetailSection>
              </>
            )}

            {/* =========================================
                ERROR LOG DETAILS
            ========================================= */}

            {selectedEntry.recordType === 'error' && (
              <>
                <div className="db-report-detail-header">
                  <DetailField
                    label="Error ID"
                    value={getRecordId(selectedEntry)}
                  />

                  <DetailField
                    label="Severity"
                    value={formatLabel(selectedEntry.severity)}
                  />

                  <DetailField
                    label="Timestamp"
                    value={formatTimestamp(getRecordTimestamp(selectedEntry))}
                  />
                </div>

                <DetailSection title="Error Description">
                  <p className="db-log-detail-description">
                    {selectedEntry.description ||
                      selectedEntry.message ||
                      selectedEntry.title ||
                      'No error description supplied.'}
                  </p>

                  <div className="db-log-detail-grid">
                    <DetailField
                      label="Source"
                      value={selectedEntry.source}
                    />

                    <DetailField
                      label="Component"
                      value={getAffectedComponent(selectedEntry)}
                    />

                    <DetailField
                      label="Affected Line"
                      value={getAffectedLine(selectedEntry)}
                    />

                    <DetailField
                      label="Error Code"
                      value={selectedEntry.errorCode}
                    />

                    <DetailField
                      label="Related Order ID"
                      value={getRelatedOrderId(selectedEntry)}
                    />

                    <DetailField
                      label="Simulation Run ID"
                      value={getRelatedRunId(selectedEntry)}
                    />

                    <DetailField
                      label="Resolution Status"
                      value={formatLabel(selectedEntry.resolutionStatus)}
                    />

                    <DetailField
                      label="Resolved At"
                      value={formatTimestamp(selectedEntry.resolvedAt)}
                    />
                  </div>
                </DetailSection>

                <DetailSection title="Technical Details">
                  <pre className="db-log-code-block">
                    {selectedEntry.stackTrace ||
                      selectedEntry.technicalDetails ||
                      selectedEntry.details ||
                      'No technical details supplied.'}
                  </pre>
                </DetailSection>

                <DetailSection title="Related Data">
                  <ReadingsList
                    data={
                      selectedEntry.metadata ||
                      selectedEntry.context
                    }
                    emptyMessage="No additional error context supplied."
                  />
                </DetailSection>
              </>
            )}

            {/* =========================================
                SYSTEM ACTIVITY DETAILS
            ========================================= */}

            {selectedEntry.recordType === 'activity' && (
              <>
                <div className="db-report-detail-header">
                  <DetailField
                    label="Activity ID"
                    value={getRecordId(selectedEntry)}
                  />

                  <DetailField
                    label="Timestamp"
                    value={formatTimestamp(getRecordTimestamp(selectedEntry))}
                  />

                  <DetailField
                    label="Source"
                    value={selectedEntry.source || selectedEntry.actor}
                  />
                </div>

                <DetailSection title="Activity Description">
                  <p className="db-log-detail-description">
                    {selectedEntry.description ||
                      selectedEntry.title ||
                      selectedEntry.event ||
                      'No activity description supplied.'}
                  </p>

                  <div className="db-log-detail-grid">
                    <DetailField
                      label="Event Type"
                      value={formatLabel(selectedEntry.eventType)}
                    />

                    <DetailField
                      label="Actor"
                      value={selectedEntry.actor}
                    />

                    <DetailField
                      label="Affected Line"
                      value={getAffectedLine(selectedEntry)}
                    />

                    <DetailField
                      label="Related Order ID"
                      value={getRelatedOrderId(selectedEntry)}
                    />

                    <DetailField
                      label="Simulation Run ID"
                      value={getRelatedRunId(selectedEntry)}
                    />
                  </div>
                </DetailSection>

                <DetailSection title="Event Details">
                  <ReadingsList
                    data={
                      selectedEntry.metadata ||
                      selectedEntry.details ||
                      selectedEntry.payload
                    }
                    emptyMessage="No additional event details supplied."
                  />
                </DetailSection>
              </>
            )}

            {/* =========================================
                SIMULATION RUN DETAILS
            ========================================= */}

            {selectedEntry.recordType === 'simulation' && (
              <>
                <div className="db-report-detail-header">
                  <DetailField
                    label="Simulation Run ID"
                    value={getRecordId(selectedEntry)}
                  />

                  <DetailField
                    label="Status"
                    value={formatLabel(selectedEntry.status)}
                  />

                  <DetailField
                    label="Production Line"
                    value={getAffectedLine(selectedEntry)}
                  />
                </div>

                <DetailSection title="Run Information">
                  <div className="db-log-detail-grid">
                    <DetailField
                      label="Start Time"
                      value={formatTimestamp(
                        selectedEntry.startedAt ||
                        selectedEntry.startTimestamp
                      )}
                    />

                    <DetailField
                      label="Completion Time"
                      value={formatTimestamp(
                        selectedEntry.completedAt ||
                        selectedEntry.completionTimestamp
                      )}
                    />

                    <DetailField
                      label="Model 1 Status"
                      value={formatLabel(selectedEntry.model1Status)}
                    />

                    <DetailField
                      label="Model 2 Status"
                      value={formatLabel(selectedEntry.model2Status)}
                    />

                    <DetailField
                      label="Associated Order ID"
                      value={getRelatedOrderId(selectedEntry)}
                    />

                    <DetailField
                      label="Plan ID"
                      value={selectedEntry.planId}
                    />

                    <DetailField
                      label="Plan Version"
                      value={selectedEntry.planVersion}
                    />
                  </div>
                </DetailSection>

                <DetailSection title="Input Conditions & Production Parameters">
                  <ReadingsList
                    data={
                      selectedEntry.inputConditions ||
                      selectedEntry.productionParameters ||
                      selectedEntry.parameters
                    }
                    emptyMessage="Input conditions and production parameters have not been supplied."
                  />
                </DetailSection>

                <DetailSection title="AI-Selected Approach">
                  <p className="db-log-detail-description">
                    {selectedEntry.selectedPlan ||
                      selectedEntry.selectedApproach ||
                      selectedEntry.approach ||
                      'No selected approach supplied.'}
                  </p>
                </DetailSection>

                <DetailSection title="Predicted Results">
                  <ReadingsList
                    data={
                      selectedEntry.predictedResults ||
                      selectedEntry.predictions
                    }
                    emptyMessage="Predicted results have not been supplied."
                  />
                </DetailSection>

                <DetailSection title="Model 2 Execution Results">
                  <ReadingsList
                    data={
                      selectedEntry.model2ExecutionResults ||
                      selectedEntry.model2Results
                    }
                    emptyMessage="Model 2 execution results have not been supplied."
                  />
                </DetailSection>

                <DetailSection title="Completion Time & Delays">
                  <div className="db-log-detail-grid">
                    <DetailField
                      label="Actual Duration"
                      value={selectedEntry.actualDuration}
                    />

                    <DetailField
                      label="Expected Duration"
                      value={selectedEntry.predictedDuration}
                    />

                    <DetailField
                      label="Delay"
                      value={selectedEntry.delay}
                    />

                    <DetailField
                      label="Delay Reason"
                      value={selectedEntry.delayReason}
                    />
                  </div>
                </DetailSection>

                <DetailSection title="Errors, Failures & Warnings">
                  <ReadingsList
                    data={
                      selectedEntry.errors ||
                      selectedEntry.failures ||
                      selectedEntry.warnings
                    }
                    emptyMessage="No error, failure or warning details have been supplied for this run."
                  />
                </DetailSection>

                <p className="db-modal-note">
                  Model 1 status and simulation evaluation are tracked
                  separately from Model 2 execution results and final
                  production outcomes. Model 1 simulation output is not
                  presented as actual production performance.
                </p>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default LogsHistoryPage;

import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import PageHeader from '../components/common/PageHeader';
import InternalTabs from '../components/common/InternalTabs';
import PlaceholderSection from '../components/common/PlaceholderSection';

/* =====================================================
   NAVIGATION
===================================================== */

const TABS = [
  { id: 'line-a', label: 'Line A' },
  { id: 'line-b', label: 'Line B' },
  { id: 'combined', label: 'Combined Overview' },
];

/* =====================================================
   DATA HELPERS
===================================================== */

function formatLabel(value) {
  if (value === null || value === undefined || value === '') {
    return 'Not available';
  }

  return String(value)
    .replaceAll('_', ' ')
    .replaceAll('-', ' ');
}

function normalizeLine(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replaceAll(' ', '-');
}

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
  });
}

function formatMeasurement(value, defaultUnit = '') {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  if (typeof value === 'object') {
    const measurement = value.value;
    const unit = value.unit || defaultUnit;

    if (measurement === null || measurement === undefined) {
      return '—';
    }

    return `${measurement}${unit ? ` ${unit}` : ''}`;
  }

  return `${value}${defaultUnit ? ` ${defaultUnit}` : ''}`;
}

function getClassificationClass(classification) {
  const value = normalizeLine(classification);

  if (value.includes('normal') || value.includes('healthy')) {
    return 'db-health-status--normal';
  }

  if (value.includes('warning')) {
    return 'db-health-status--warning';
  }

  if (value.includes('abnormal')) {
    return 'db-health-status--abnormal';
  }

  if (value.includes('critical')) {
    return 'db-health-status--critical';
  }

  return 'db-health-status--unknown';
}

function getWarningSeverityClass(severity) {
  const value = String(severity || '').toLowerCase();

  if (value === 'critical' || value === 'high') {
    return 'db-badge--danger';
  }

  if (value === 'medium' || value === 'warning') {
    return 'db-badge--warning';
  }

  return 'db-badge--info';
}

/* =====================================================
   HEALTH DATA NORMALIZATION
===================================================== */

function getOverallHealth(lineData) {
  return (
    lineData?.overallHealth ||
    lineData?.healthSummary ||
    lineData?.overall ||
    lineData ||
    {}
  );
}

function getHealthScore(health) {
  const value =
    health?.overallHealthScore ??
    health?.healthScore ??
    health?.score;

  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function getClassification(health) {
  return (
    health?.classification ||
    health?.healthClassification ||
    health?.healthStatus ||
    null
  );
}

function getComponents(lineData, health) {
  const components =
    lineData?.components ||
    lineData?.componentReadings ||
    health?.components ||
    [];

  if (Array.isArray(components)) {
    return components;
  }

  if (components && typeof components === 'object') {
    return Object.entries(components).map(([id, component]) => ({
      id,
      name: component?.name || formatLabel(id),
      ...(component || {}),
    }));
  }

  return [];
}

function getHealthTrend(lineData, health) {
  return (
    lineData?.healthTrend ||
    lineData?.healthHistory ||
    health?.healthTrend ||
    []
  );
}

function getHistoricalReadings(lineData, health) {
  return (
    lineData?.historicalReadings ||
    lineData?.readingsHistory ||
    health?.historicalReadings ||
    []
  );
}

function getActiveLineWarnings(warnings, lineName) {
  if (!Array.isArray(warnings)) return [];

  const selectedLine = normalizeLine(lineName);

  return warnings.filter((warning) => {
    const warningLine = normalizeLine(
      warning.line ||
      warning.productionLine ||
      warning.affectedLine
    );

    const status = normalizeLine(warning.status);

    return (
      warningLine === selectedLine &&
      status !== 'resolved'
    );
  });
}

/* =====================================================
   HEALTH SCORE SUMMARY
===================================================== */

function HealthScoreSummary({
  lineName,
  health,
  availabilityStatus,
  lastUpdated,
}) {
  const score = getHealthScore(health);
  const classification = getClassification(health);

  const safeScore =
    score === null
      ? 0
      : Math.max(0, Math.min(100, score));

  const hasHealthData =
    score !== null || Boolean(classification);

  return (
    <div className="db-health-summary">
      <div className="db-health-summary__main">
        <div>
          <span className="db-health-summary__eyebrow">
            {lineName} OVERALL HEALTH
          </span>

          <div className="db-health-score">
            {score !== null ? (
              <>
                <span className="db-health-score__value">
                  {score}
                </span>

                <span className="db-health-score__suffix">
                  /100
                </span>
              </>
            ) : (
              <span className="db-health-score__unavailable">
                —
              </span>
            )}
          </div>

          <div className="db-health-summary__classification">
            {hasHealthData && classification ? (
              <span
                className={`db-health-status ${getClassificationClass(classification)}`}
              >
                {formatLabel(classification)}
              </span>
            ) : (
              <span className="db-health-status db-health-status--unknown">
                Awaiting health data
              </span>
            )}
          </div>
        </div>

        <div
          className="db-health-score__ring"
          style={{
            '--health-progress': `${safeScore}%`,
          }}
          aria-label={
            score !== null
              ? `Health score ${score} out of 100`
              : 'Health score unavailable'
          }
        >
          <div className="db-health-score__ring-inner">
            {score !== null ? (
              <span>{score}%</span>
            ) : (
              <span>—</span>
            )}
          </div>
        </div>
      </div>

      <div className="db-health-summary__details">
        <div className="db-health-summary__detail">
          <span>Line Availability</span>
          <strong>
            {availabilityStatus
              ? formatLabel(availabilityStatus)
              : 'Not available'}
          </strong>
        </div>

        <div className="db-health-summary__detail">
          <span>Last Health Update</span>
          <strong>
            {formatTimestamp(lastUpdated)}
          </strong>
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   COMPONENT HEALTH TABLE
===================================================== */

function ComponentHealthTable({ components }) {
  if (!components.length) {
    return (
      <PlaceholderSection
        note="Individual machine component readings will appear here when health data integration is connected."
        height="140px"
      />
    );
  }

  return (
    <div className="db-health-table-wrapper">
      <table className="db-health-table">
        <thead>
          <tr>
            <th>Component</th>
            <th>Health</th>
            <th>Temperature</th>
            <th>Vibration</th>
            <th>Wear</th>
            <th>Operating Duration</th>
          </tr>
        </thead>

        <tbody>
          {components.map((component, index) => {
            const name =
              component.name ||
              component.componentName ||
              component.id ||
              `Component ${index + 1}`;

            const classification =
              component.classification ||
              component.healthClassification ||
              component.status;

            const score =
              component.healthScore ??
              component.score;

            return (
              <tr
                key={component.id || `${name}-${index}`}
              >
                <td className="db-health-table__component">
                  {name}
                </td>

                <td>
                  <div className="db-health-table__health">
                    {score !== undefined && score !== null ? (
                      <strong>{score}/100</strong>
                    ) : (
                      <span>—</span>
                    )}

                    {classification && (
                      <span
                        className={`db-health-status ${getClassificationClass(classification)}`}
                      >
                        {formatLabel(classification)}
                      </span>
                    )}
                  </div>
                </td>

                <td>
                  {formatMeasurement(
                    component.temperature,
                    '°C'
                  )}
                </td>

                <td>
                  {formatMeasurement(
                    component.vibration
                  )}
                </td>

                <td>
                  {formatMeasurement(
                    component.wear,
                    '%'
                  )}
                </td>

                <td>
                  {formatMeasurement(
                    component.operatingDuration ??
                    component.operatingHours ??
                    component.runningDuration
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* =====================================================
   HEALTH TRENDS
===================================================== */

/**
 * Displays actual historical health scores.
 * No data points are generated or interpolated.
 */
function HealthTrendChart({ data }) {
  const chartData = useMemo(() => {
    if (!Array.isArray(data)) return [];

    return data
      .map((item, index) => {
        const score = Number(
          item.healthScore ?? item.score
        );

        if (!Number.isFinite(score)) return null;

        const timestamp =
          item.timestamp ||
          item.recordedAt ||
          item.createdAt;

        return {
          label: timestamp
            ? formatTimestamp(timestamp)
            : `Reading ${index + 1}`,
          score,
          timestampValue: getTimestampValue(timestamp),
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (
          a.timestampValue === null ||
          b.timestampValue === null
        ) {
          return 0;
        }

        return a.timestampValue - b.timestampValue;
      });
  }, [data]);

  if (!chartData.length) {
    return (
      <PlaceholderSection
        note="Health trend chart will appear when historical health scores are available."
        height="180px"
      />
    );
  }

  return (
    <div className="db-health-chart">
      <ResponsiveContainer width="100%" height={240}>
        <LineChart
          data={chartData}
          margin={{
            top: 12,
            right: 15,
            left: -15,
            bottom: 8,
          }}
        >
          <CartesianGrid
            stroke="var(--border)"
            strokeDasharray="3 4"
            vertical={false}
          />

          <XAxis
            dataKey="label"
            tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
            minTickGap={25}
          />

          <YAxis
            domain={[0, 100]}
            tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            ticks={[0, 25, 50, 75, 100]}
          />

          <Tooltip
            contentStyle={{
              background: 'var(--surface-solid)',
              border: '1px solid var(--border-strong)',
              borderRadius: '9px',
              color: 'var(--text-primary)',
              fontSize: '12px',
            }}
            formatter={(value) => [`${value}/100`, 'Health Score']}
          />

          <Line
            type="monotone"
            dataKey="score"
            name="Health Score"
            stroke="var(--brand-blue)"
            strokeWidth={2.5}
            dot={{
              r: 3,
              fill: 'var(--brand-blue)',
              strokeWidth: 0,
            }}
            activeDot={{
              r: 5,
              stroke: 'var(--surface-solid)',
              strokeWidth: 2,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* =====================================================
   HISTORICAL READINGS
===================================================== */

function HistoricalReadings({ readings }) {
  if (!Array.isArray(readings) || readings.length === 0) {
    return (
      <PlaceholderSection
        note="Historical component readings will appear here when records are available."
        height="160px"
      />
    );
  }

  const orderedReadings = [...readings].sort((a, b) => {
    return (
      (getTimestampValue(
        b.timestamp || b.recordedAt || b.createdAt
      ) || 0) -
      (getTimestampValue(
        a.timestamp || a.recordedAt || a.createdAt
      ) || 0)
    );
  });

  return (
    <div className="db-health-table-wrapper">
      <table className="db-health-table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Component</th>
            <th>Health Score</th>
            <th>Temperature</th>
            <th>Vibration</th>
            <th>Wear</th>
          </tr>
        </thead>

        <tbody>
          {orderedReadings.map((reading, index) => (
            <tr key={reading.id || `reading-${index}`}>
              <td>
                {formatTimestamp(
                  reading.timestamp ||
                  reading.recordedAt ||
                  reading.createdAt
                )}
              </td>

              <td>
                {reading.componentName ||
                  reading.component ||
                  'Overall line'}
              </td>

              <td>
                {reading.healthScore ?? reading.score ?? '—'}
              </td>

              <td>
                {formatMeasurement(reading.temperature, '°C')}
              </td>

              <td>
                {formatMeasurement(reading.vibration)}
              </td>

              <td>
                {formatMeasurement(reading.wear, '%')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* =====================================================
   ACTIVE WARNINGS
===================================================== */

function ActiveWarnings({ warnings }) {
  if (warnings === null) {
    return (
      <PlaceholderSection
        note="Waiting for active warning records from the monitoring system and agents."
        height="100px"
      />
    );
  }

  if (!warnings.length) {
    return (
      <div className="db-placeholder">
        <span className="db-placeholder__label">
          No active warnings
        </span>

        <span className="db-placeholder__note">
          No unresolved warnings have been supplied for this line.
        </span>
      </div>
    );
  }

  return (
    <div className="db-health-warnings">
      {warnings.map((warning, index) => (
        <div
          className="db-health-warning"
          key={warning.id || warning.warningId || index}
        >
          <div className="db-health-warning__header">
            <span
              className={`db-badge ${getWarningSeverityClass(warning.severity)}`}
            >
              {formatLabel(warning.severity || 'Unknown')}
            </span>

            <span className="db-health-warning__id">
              {warning.id || warning.warningId || 'Warning'}
            </span>

            <span className="db-health-warning__type">
              {String(
                warning.warningType ||
                warning.type ||
                'Detected'
              ).toLowerCase().includes('predict')
                ? 'Predicted'
                : 'Detected'}
            </span>
          </div>

          <p className="db-health-warning__title">
            {warning.title ||
              warning.description ||
              'Warning details unavailable'}
          </p>

          <div className="db-health-warning__meta">
            <span>
              Component: {warning.component || warning.machine || 'Not specified'}
            </span>

            <span>
              {formatTimestamp(
                warning.timestamp ||
                warning.createdAt
              )}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* =====================================================
   LINE HEALTH VIEW
===================================================== */

function LineHealthView({
  lineName,
  lineData,
  warnings,
}) {
  const health = getOverallHealth(lineData);

  const components = getComponents(lineData, health);

  const trend = getHealthTrend(lineData, health);

  const history = getHistoricalReadings(lineData, health);

  const score = getHealthScore(health);

  const availabilityStatus =
    lineData?.availabilityStatus ||
    lineData?.lineStatus ||
    health?.availabilityStatus ||
    health?.lineStatus;

  const lastUpdated =
    lineData?.lastUpdated ||
    health?.lastUpdated;

  return (
    <div className="db-tab-content">

      {/* Overall health score and line status */}
      <div className="content-panel">
        <div className="section-heading">
          <h2 className="section-title">
            {lineName} — Overall Health
          </h2>

          <p className="section-description">
            Overall condition of the production line and its monitored components.
          </p>
        </div>

        <HealthScoreSummary
          lineName={lineName}
          health={health}
          availabilityStatus={availabilityStatus}
          lastUpdated={lastUpdated}
        />
      </div>

      {/* Active warnings */}
      <div className="content-panel" style={{ marginTop: '20px' }}>
        <div className="section-heading">
          <h2 className="section-title">
            {lineName} — Active Warnings
          </h2>

          <p className="section-description">
            Detected abnormal conditions and predicted future risks.
          </p>
        </div>

        <ActiveWarnings warnings={warnings} />
      </div>

      {/* Component readings */}
      <div className="content-panel" style={{ marginTop: '20px' }}>
        <div className="section-heading">
          <h2 className="section-title">
            {lineName} — Component Readings &amp; Statuses
          </h2>

          <p className="section-description">
            Individual component health, temperature, vibration, wear and operating duration.
          </p>
        </div>

        <ComponentHealthTable
          components={components}
        />
      </div>

      {/* Health trends */}
      <div className="content-panel" style={{ marginTop: '20px' }}>
        <div className="section-heading">
          <h2 className="section-title">
            {lineName} — Health Trends
          </h2>

          <p className="section-description">
            Historical changes in the overall health score.
          </p>
        </div>

        <HealthTrendChart data={trend} />
      </div>

      {/* Historical readings */}
      <div className="content-panel" style={{ marginTop: '20px' }}>
        <div className="section-heading">
          <h2 className="section-title">
            {lineName} — Historical Readings
          </h2>

          <p className="section-description">
            Previously recorded health readings for the line and its components.
          </p>
        </div>

        <HistoricalReadings readings={history} />
      </div>
    </div>
  );
}

/* =====================================================
   COMBINED HEALTH SUMMARY CARD
===================================================== */

function CombinedLineCard({
  lineName,
  lineData,
  warnings,
}) {
  const health = getOverallHealth(lineData);

  const score = getHealthScore(health);

  const classification = getClassification(health);

  const components = getComponents(lineData, health);

  const availability =
    lineData?.availabilityStatus ||
    lineData?.lineStatus ||
    health?.availabilityStatus ||
    health?.lineStatus;

  const hasData = Boolean(
    lineData &&
    Object.keys(lineData).length > 0
  );

  return (
    <div className="content-panel db-health-combined-card">
      <div className="section-heading">
        <h2 className="section-title">
          {lineName} — Health Overview
        </h2>
      </div>

      {hasData ? (
        <>
          <div className="db-health-combined-card__score">
            <div>
              <span className="db-health-combined-card__label">
                Health Score
              </span>

              <strong>
                {score !== null ? `${score}/100` : '—'}
              </strong>
            </div>

            {classification && (
              <span
                className={`db-health-status ${getClassificationClass(classification)}`}
              >
                {formatLabel(classification)}
              </span>
            )}
          </div>

          <div className="db-health-combined-card__details">
            <div>
              <span>Line Availability</span>
              <strong>{formatLabel(availability)}</strong>
            </div>

            <div>
              <span>Monitored Components</span>
              <strong>
                {components.length || 'Not available'}
              </strong>
            </div>

            <div>
              <span>Active Warnings</span>
              <strong>
                {warnings === null ? 'Not available' : warnings.length}
              </strong>
            </div>
          </div>
        </>
      ) : (
        <PlaceholderSection
          note={`${lineName} health information is waiting for data integration.`}
        />
      )}
    </div>
  );
}

/* =====================================================
   COMBINED HEALTH VIEW
===================================================== */

/**
 * Combined Overview intentionally preserves independent
 * Line A and Line B health data.
 *
 * No combined average health score is calculated because
 * the lines are independent production systems.
 */
function CombinedHealthView({
  lineAData,
  lineBData,
  warnings,
}) {
  const lineAWarnings = warnings === null
    ? null
    : getActiveLineWarnings(warnings, 'Line A');

  const lineBWarnings = warnings === null
    ? null
    : getActiveLineWarnings(warnings, 'Line B');

  return (
    <div className="db-tab-content">

      <div className="db-grid db-grid--2">
        <CombinedLineCard
          lineName="Line A"
          lineData={lineAData}
          warnings={lineAWarnings}
        />

        <CombinedLineCard
          lineName="Line B"
          lineData={lineBData}
          warnings={lineBWarnings}
        />
      </div>

      <div className="db-grid db-grid--2" style={{ marginTop: '20px' }}>
        <div className="content-panel">
          <div className="section-heading">
            <h2 className="section-title">
              Line A — Health Trend
            </h2>
          </div>

          <HealthTrendChart
            data={getHealthTrend(
              lineAData,
              getOverallHealth(lineAData)
            )}
          />
        </div>

        <div className="content-panel">
          <div className="section-heading">
            <h2 className="section-title">
              Line B — Health Trend
            </h2>
          </div>

          <HealthTrendChart
            data={getHealthTrend(
              lineBData,
              getOverallHealth(lineBData)
            )}
          />
        </div>
      </div>

      <div className="content-panel" style={{ marginTop: '20px' }}>
        <div className="section-heading">
          <h2 className="section-title">
            Combined Active Warnings
          </h2>

          <p className="section-description">
            Warnings remain associated with their respective production lines.
          </p>
        </div>

        {warnings === null ? (
          <PlaceholderSection
            note="Waiting for warning integration from both production lines."
          />
        ) : (
          <div className="db-health-warnings">
            {[
              ...lineAWarnings.map((warning) => ({
                ...warning,
                displayLine: 'Line A',
              })),
              ...lineBWarnings.map((warning) => ({
                ...warning,
                displayLine: 'Line B',
              })),
            ].length > 0 ? (
              [
                ...lineAWarnings.map((warning) => ({
                  ...warning,
                  displayLine: 'Line A',
                })),
                ...lineBWarnings.map((warning) => ({
                  ...warning,
                  displayLine: 'Line B',
                })),
              ].map((warning, index) => (
                <div
                  className="db-health-warning"
                  key={warning.id || warning.warningId || index}
                >
                  <div className="db-health-warning__header">
                    <span
                      className={`db-badge ${getWarningSeverityClass(warning.severity)}`}
                    >
                      {formatLabel(warning.severity)}
                    </span>

                    <span className="db-health-warning__id">
                      {warning.displayLine}
                    </span>

                    <span className="db-health-warning__type">
                      {String(
                        warning.warningType ||
                        warning.type ||
                        'Detected'
                      ).toLowerCase().includes('predict')
                        ? 'Predicted'
                        : 'Detected'}
                    </span>
                  </div>

                  <p className="db-health-warning__title">
                    {warning.title ||
                      warning.description ||
                      'Warning details unavailable'}
                  </p>
                </div>
              ))
            ) : (
              <div className="db-placeholder">
                <span className="db-placeholder__label">
                  No active warnings
                </span>

                <span className="db-placeholder__note">
                  No unresolved warning records have been supplied for either line.
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* =====================================================
   MAIN MACHINE HEALTH PAGE
===================================================== */

/**
 * MachineHealthPage — Section C.
 *
 * Props:
 *   lineAData — real health readings and history for Line A
 *   lineBData — real health readings and history for Line B
 *   warnings  — real warning records from the monitoring system/agents
 *   initialTab — optional initial tab ('line-a', 'line-b' or 'combined')
 *
 * This page only monitors health.
 * Manual and synthetic health-data entry remain in Health Controls.
 */
function MachineHealthPage({
  lineAData = null,
  lineBData = null,
  warnings = null,
  initialTab = 'line-a',
}) {
  const [activeTab, setActiveTab] = useState(() => {
    return TABS.some((tab) => tab.id === initialTab)
      ? initialTab
      : 'line-a';
  });

  const lineAWarnings = useMemo(() => {
    return warnings === null
      ? null
      : getActiveLineWarnings(warnings, 'Line A');
  }, [warnings]);

  const lineBWarnings = useMemo(() => {
    return warnings === null
      ? null
      : getActiveLineWarnings(warnings, 'Line B');
  }, [warnings]);

  return (
    <div className="db-page">
      <PageHeader
        eyebrow="Monitoring"
        title="Machine Health"
        description="Monitor independent production-line health, component conditions, historical trends and active warnings."
      />

      <InternalTabs
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === 'line-a' && (
        <LineHealthView
          lineName="Line A"
          lineData={lineAData}
          warnings={lineAWarnings}
        />
      )}

      {activeTab === 'line-b' && (
        <LineHealthView
          lineName="Line B"
          lineData={lineBData}
          warnings={lineBWarnings}
        />
      )}

      {activeTab === 'combined' && (
        <CombinedHealthView
          lineAData={lineAData}
          lineBData={lineBData}
          warnings={warnings}
        />
      )}
    </div>
  );
}

export default MachineHealthPage;

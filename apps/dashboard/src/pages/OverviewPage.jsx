
import { useMemo, useState } from 'react';
import PageHeader from '../components/common/PageHeader';
import PlaceholderSection from '../components/common/PlaceholderSection';
import Modal from '../components/common/Modal';

/* =====================================================
   GENERAL HELPERS
===================================================== */

function normalizeStatus(value) {
  return String(value || '')
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
    hour: '2-digit',
    minute: '2-digit',
  });
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

function formatMetric(value, defaultUnit = '') {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  if (typeof value === 'object') {
    if (value.value === undefined || value.value === null) {
      return '—';
    }

    const unit = value.unit || defaultUnit;

    return `${value.value}${unit ? ` ${unit}` : ''}`;
  }

  return `${value}${defaultUnit ? ` ${defaultUnit}` : ''}`;
}

function normalizeLine(value) {
  return normalizeStatus(value).replaceAll('-', '');
}

function getStatusTone(status) {
  const value = normalizeStatus(status);

  if (
    ['healthy', 'normal', 'running', 'connected', 'operational', 'active', 'online']
      .some((item) => value.includes(item))
  ) {
    return 'success';
  }

  if (
    ['critical', 'failed', 'failure', 'offline', 'disconnected', 'abnormal']
      .some((item) => value.includes(item))
  ) {
    return 'danger';
  }

  if (
    ['warning', 'degraded', 'delayed', 'pending']
      .some((item) => value.includes(item))
  ) {
    return 'warning';
  }

  return 'neutral';
}

/* =====================================================
   ORDER HELPERS
===================================================== */

function getOrderStatus(order) {
  return normalizeStatus(order.status);
}

function getOrderLine(order) {
  return (
    order.productionLine ||
    order.assignedLine ||
    order.line ||
    order.lineId ||
    null
  );
}

function getActiveOrderCounts(orders) {
  if (!Array.isArray(orders)) return null;

  const waiting = orders.filter((order) => {
    return [
      'waiting',
      'pending',
      'queued',
      'accepted',
      'not-started',
    ].includes(getOrderStatus(order));
  }).length;

  const processing = orders.filter((order) => {
    return [
      'processing',
      'in-progress',
      'in-production',
      'running',
    ].includes(getOrderStatus(order));
  }).length;

  const completed = orders.filter((order) => {
    return ['completed', 'complete', 'finished'].includes(
      getOrderStatus(order)
    );
  }).length;

  return {
    waiting,
    processing,
    completed,
    active: waiting + processing,
    total: orders.length,
  };
}

function getOrderId(order) {
  return order.orderId || order.id || 'Order ID unavailable';
}

/* =====================================================
   HEALTH HELPERS
===================================================== */

function getLineHealth(lineData) {
  return (
    lineData?.overallHealth ||
    lineData?.healthSummary ||
    lineData?.health ||
    {}
  );
}

function getHealthScore(lineData) {
  const health = getLineHealth(lineData);

  const score =
    health.overallHealthScore ??
    health.healthScore ??
    health.score;

  if (score === null || score === undefined || score === '') {
    return null;
  }

  const numeric = Number(score);

  return Number.isFinite(numeric) ? numeric : null;
}

function getHealthClassification(lineData) {
  const health = getLineHealth(lineData);

  return (
    health.classification ||
    health.healthClassification ||
    health.healthStatus ||
    null
  );
}

function getLineAvailability(lineData) {
  return (
    lineData?.availabilityStatus ||
    lineData?.lineStatus ||
    lineData?.status ||
    null
  );
}

/* =====================================================
   PRODUCTION HELPERS
===================================================== */

function getLineMetrics(lineData) {
  return (
    lineData?.metrics ||
    lineData?.productionSummary ||
    lineData?.summary ||
    lineData ||
    {}
  );
}

function getBoxesProduced(lineData) {
  const metrics = getLineMetrics(lineData);

  return (
    metrics.totalBoxesProduced ??
    metrics.boxesProduced ??
    metrics.producedBoxes ??
    null
  );
}

function getProductionRate(lineData) {
  const metrics = getLineMetrics(lineData);

  return (
    metrics.productionRate ??
    metrics.boxesPerMinute ??
    null
  );
}

/* =====================================================
   INTEGRATION CONNECTION DEFINITIONS
===================================================== */

/**
 * These are the integration checks displayed on the Overview page.
 *
 * integrationStatus prop structure:
 *
 * {
 *   system: {
 *     backendApi: 'connected',
 *     firebaseAuth: 'connected',
 *     firestore: 'connected',
 *     realtimeSync: 'connected',
 *   },
 *   orders: {
 *     customerWebsite: 'connected',
 *     orderApi: 'connected',
 *     orderQueue: 'connected',
 *     inventory: 'connected',
 *   },
 *   production: {
 *     mainAgent: 'connected',
 *     rlAgent: 'connected',
 *     mlAgent: 'connected',
 *     ruleAgent: 'connected',
 *     digitalTwin: 'connected',
 *     lineAHealth: 'connected',
 *     lineBHealth: 'connected',
 *   },
 * }
 *
 * Each value may also be an object:
 * { status: 'connected', message: 'Optional detail' }
 *
 * Supported statuses:
 * connected, disconnected, warning, degraded, unknown.
 *
 * Missing values are always treated as unverified.
 */

const INTEGRATION_GROUPS = [
  {
    id: 'system',
    title: 'System & Backend',
    variant: 'system',
    icon: 'healthy',
    description: 'Core services connecting the Dashboard and backend.',
    checks: [
      {
        id: 'backendApi',
        label: 'Backend API',
        description: 'Communication with the FastAPI backend service.',
      },
      {
        id: 'firebaseAuth',
        label: 'Firebase Authentication',
        description: 'Administrator authentication service.',
      },
      {
        id: 'firestore',
        label: 'Firestore Database',
        description: 'Database connectivity and read/write access.',
      },
      {
        id: 'realtimeSync',
        label: 'Realtime Data Sync',
        description: 'Live updates between backend, database and Dashboard.',
      },
    ],
  },
  {
    id: 'orders',
    title: 'Orders & Inventory',
    variant: 'orders',
    icon: 'orders',
    description: 'Customer orders, production queue and stock connectivity.',
    checks: [
      {
        id: 'customerWebsite',
        label: 'Customer Website',
        description: 'Customer ordering website connectivity.',
      },
      {
        id: 'orderApi',
        label: 'Order Submission',
        description: 'Order creation and submission to the backend.',
      },
      {
        id: 'orderQueue',
        label: 'Production Order Queue',
        description: 'Order assignment and queue updates.',
      },
      {
        id: 'inventory',
        label: 'Inventory & Stock',
        description: 'Stock availability and inventory synchronization.',
      },
    ],
  },
  {
    id: 'production',
    title: 'AI & Production',
    variant: 'production',
    icon: 'production',
    description: 'Agents, digital twin and both machine-health feeds.',
    checks: [
      {
        id: 'mainAgent',
        label: 'Main Agent',
        description: 'Final decision-making agent connectivity.',
      },
      {
        id: 'rlAgent',
        label: 'RL Agent',
        description: 'Reinforcement-learning agent connectivity.',
      },
      {
        id: 'mlAgent',
        label: 'ML Agent',
        description: 'Machine-learning agent connectivity.',
      },
      {
        id: 'ruleAgent',
        label: 'Rule-based Agent',
        description: 'Rule-based planning agent connectivity.',
      },
      {
        id: 'digitalTwin',
        label: 'Digital Twin / CoppeliaSim',
        description: 'Simulation connection and animation stream.',
      },
      {
        id: 'lineAHealth',
        label: 'Health Controls — Line A',
        description: 'Line A machine-health data feed.',
      },
      {
        id: 'lineBHealth',
        label: 'Health Controls — Line B',
        description: 'Line B machine-health data feed.',
      },
    ],
  },
];

/**
 * Converts the supplied integration value into a known state.
 * Missing or unrecognized values remain unverified.
 */
function getConnectionState(value) {
  if (typeof value === 'boolean') {
    return value ? 'connected' : 'disconnected';
  }

  if (value && typeof value === 'object') {
    if (typeof value.connected === 'boolean') {
      return value.connected ? 'connected' : 'disconnected';
    }

    if (typeof value.isConnected === 'boolean') {
      return value.isConnected ? 'connected' : 'disconnected';
    }

    value =
      value.status ||
      value.state ||
      value.connectionState ||
      null;
  }

  const status = normalizeStatus(value);

  if (
    [
      'connected',
      'online',
      'operational',
      'ready',
      'healthy',
      'active',
      'success',
    ].includes(status)
  ) {
    return 'connected';
  }

  if (
    [
      'disconnected',
      'offline',
      'failed',
      'failure',
      'error',
      'unavailable',
      'not-connected',
    ].includes(status)
  ) {
    return 'disconnected';
  }

  if (
    [
      'warning',
      'degraded',
      'partial',
      'partially-connected',
    ].includes(status)
  ) {
    return 'warning';
  }

  return 'unknown';
}

function getConnectionStateLabel(status) {
  switch (status) {
    case 'connected':
      return 'Connected';

    case 'disconnected':
      return 'Disconnected';

    case 'warning':
      return 'Degraded';

    default:
      return 'Not verified';
  }
}

/**
 * Builds the connected count and overall state for one integration group.
 */
function getIntegrationGroupSummary(group, integrationStatus) {
  const suppliedGroupStatus = integrationStatus?.[group.id] || {};

  const checks = group.checks.map((check) => ({
    ...check,
    status: getConnectionState(suppliedGroupStatus[check.id]),
  }));

  const connectedCount = checks.filter(
    (check) => check.status === 'connected'
  ).length;

  const disconnectedCount = checks.filter(
    (check) => check.status === 'disconnected'
  ).length;

  const warningCount = checks.filter(
    (check) => check.status === 'warning'
  ).length;

  const unknownCount = checks.filter(
    (check) => check.status === 'unknown'
  ).length;

  const totalCount = checks.length;

  let tone = 'neutral';
  let statusLabel = 'Not verified';

  if (connectedCount === totalCount) {
    tone = 'success';
    statusLabel = 'All connected';
  } else if (disconnectedCount > 0) {
    tone = 'danger';
    statusLabel = 'Connection issue';
  } else if (connectedCount > 0 || warningCount > 0) {
    tone = 'warning';
    statusLabel = 'Partially connected';
  }

  let description;

  if (connectedCount === totalCount) {
    description = 'All required integration checks passed.';
  } else if (unknownCount === totalCount) {
    description = 'Awaiting live connection checks.';
  } else {
    const remainingParts = [];

    if (disconnectedCount > 0) {
      remainingParts.push(`${disconnectedCount} disconnected`);
    }

    if (warningCount > 0) {
      remainingParts.push(`${warningCount} degraded`);
    }

    if (unknownCount > 0) {
      remainingParts.push(`${unknownCount} unverified`);
    }

    description = remainingParts.join(' · ');
  }

  return {
    checks,
    connectedCount,
    disconnectedCount,
    warningCount,
    unknownCount,
    totalCount,
    tone,
    statusLabel,
    description,
    value:
      unknownCount === totalCount
        ? `— / ${totalCount} connected`
        : `${connectedCount} / ${totalCount} connected`,
  };
}

/* =====================================================
   WARNING HELPERS
===================================================== */

const SEVERITY_ORDER = {
  critical: 0,
  high: 1,
  medium: 2,
  warning: 2,
  low: 3,
  info: 4,
};

function getWarningSeverity(warning) {
  return normalizeStatus(warning.severity);
}

function getActiveWarnings(warnings) {
  if (!Array.isArray(warnings)) return [];

  return warnings
    .filter((warning) => {
      return normalizeStatus(warning.status) !== 'resolved';
    })
    .sort((a, b) => {
      const severityDifference =
        (SEVERITY_ORDER[getWarningSeverity(a)] ?? 99) -
        (SEVERITY_ORDER[getWarningSeverity(b)] ?? 99);

      if (severityDifference !== 0) {
        return severityDifference;
      }

      return (
        (getTimestampValue(
          b.timestamp || b.createdAt
        ) || 0) -
        (getTimestampValue(
          a.timestamp || a.createdAt
        ) || 0)
      );
    });
}

/* =====================================================
   ACTIVITY HELPERS
===================================================== */

function getRecentActivities(activities) {
  if (!Array.isArray(activities)) return [];

  return [...activities]
    .sort((a, b) => {
      return (
        (getTimestampValue(
          b.timestamp || b.createdAt || b.occurredAt
        ) || 0) -
        (getTimestampValue(
          a.timestamp || a.createdAt || a.occurredAt
        ) || 0)
      );
    })
    .slice(0, 5);
}

/* =====================================================
   INLINE ICONS
===================================================== */

function OverviewIcon({ name, size = 25 }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };

  const icons = {
    healthy: (
      <svg {...common}>
        <path d="M20 6 9 17l-5-5" strokeWidth="2.5" />
      </svg>
    ),

    orders: (
      <svg {...common}>
        <path d="M3 3h2l2.3 12.2a2 2 0 0 0 2 1.6h8.9a2 2 0 0 0 1.9-1.4L22 8H6" />
        <circle cx="10" cy="20" r="1.4" fill="currentColor" />
        <circle cx="18" cy="20" r="1.4" fill="currentColor" />
      </svg>
    ),

    production: (
      <svg {...common}>
        <path d="M3 21V10l5 3V9l5 3V5h8v16H3Z" />
        <path d="M7 17h2m3 0h2m3 0h2M16 8h2" />
        <path d="M5 21v-3m5 3v-3m5 3v-3" />
      </svg>
    ),

    twin: (
      <svg {...common}>
        <path d="m12 2 9 5v10l-9 5-9-5V7l9-5Z" />
        <path d="m3 7 9 5 9-5M12 12v10" />
      </svg>
    ),

    health: (
      <svg {...common}>
        <path d="M20.8 8.6c0 5.5-8.8 11-8.8 11s-8.8-5.5-8.8-11a4.7 4.7 0 0 1 8.8-2.3 4.7 4.7 0 0 1 8.8 2.3Z" />
        <path d="M4 12h4l2-4 3.2 8 2-4H20" />
      </svg>
    ),

    alerts: (
      <svg {...common}>
        <path d="M12 3 2.8 20h18.4L12 3Z" />
        <path d="M12 9v5m0 3h.01" />
      </svg>
    ),

    activity: (
      <svg {...common}>
        <path d="M3 12h4l3-8 4 16 3-8h4" />
      </svg>
    ),
  };

  return icons[name] || null;
}

/* =====================================================
   INTEGRATION STATUS CARD
===================================================== */

function IntegrationStatusCard({
  group,
  summary,
  onClick,
}) {
  return (
    <button
      type="button"
      className={[
        'content-panel',
        'db-overview-summary-card',
        `db-overview-summary-card--${group.variant}`,
        'db-overview-summary-card--clickable',
      ].join(' ')}
      onClick={onClick}
      aria-label={`${group.title}: ${summary.value}. ${summary.statusLabel}. View connection details.`}
    >
      <div className="db-overview-summary-card__icon">
        <OverviewIcon name={group.icon} size={27} />
      </div>

      <div className="db-overview-summary-card__content">
        <div className="db-overview-summary-card__header">
          <span className="db-overview-summary-card__title">
            {group.title}
          </span>

          <span
            className={`db-overview-connection-state db-overview-connection-state--${summary.tone}`}
          >
            <span
              className={`db-overview-status-dot db-overview-status-dot--${summary.tone}`}
            />

            {summary.statusLabel}
          </span>
        </div>

        <strong className="db-overview-summary-card__value">
          {summary.value}
        </strong>

        <span className="db-overview-summary-card__description">
          {summary.description}
        </span>

        <span className="db-overview-summary-card__link">
          View connection details <span aria-hidden="true">→</span>
        </span>
      </div>
    </button>
  );
}

/* =====================================================
   INTEGRATION DETAIL POPUP CONTENT
===================================================== */

function IntegrationDetails({
  group,
  summary,
}) {
  return (
    <div className="db-overview-integration-modal">
      <div
        className={`db-overview-integration-modal__summary db-overview-integration-modal__summary--${summary.tone}`}
      >
        <div className="db-overview-integration-modal__summary-main">
          <span className="db-overview-integration-modal__eyebrow">
            CONNECTION SUMMARY
          </span>

          <strong className="db-overview-integration-modal__count">
            {summary.value}
          </strong>

          <span className="db-overview-integration-modal__state">
            {summary.statusLabel}
          </span>
        </div>

        <span
          className={`db-overview-status-dot db-overview-status-dot--${summary.tone}`}
        />
      </div>

      <div className="db-overview-integration-modal__section">
        <div className="db-overview-integration-modal__section-header">
          <h3>Integration Components</h3>

          <span>
            {summary.totalCount} checks
          </span>
        </div>

        <div className="db-overview-integration-list">
          {summary.checks.map((check) => (
            <div
              className={`db-overview-integration-item db-overview-integration-item--${check.status}`}
              key={check.id}
            >
              <span
                className={`db-overview-integration-item__indicator db-overview-integration-item__indicator--${check.status}`}
              />

              <div className="db-overview-integration-item__content">
                <strong>{check.label}</strong>

                <span>{check.description}</span>
              </div>

              <span
                className={`db-overview-integration-item__status db-overview-integration-item__status--${check.status}`}
              >
                {getConnectionStateLabel(check.status)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="db-overview-integration-modal__note">
        A component is marked Connected only when its connection check
        reports a successful status. Missing connection data is shown
        as Not verified.
      </p>
    </div>
  );
}

/* =====================================================
   LINE HEALTH SUMMARY
===================================================== */

function LineHealthSummary({
  lineName,
  lineData,
  onClick,
}) {
  const score = getHealthScore(lineData);
  const classification = getHealthClassification(lineData);
  const availability = getLineAvailability(lineData);
  const tone = getStatusTone(classification || availability);

  const safeScore = score === null
    ? 0
    : Math.max(0, Math.min(100, score));

  return (
    <button
      type="button"
      className={`db-overview-line-health db-overview-line-health--${tone}`}
      onClick={() => onClick(lineName)}
    >
      <div className="db-overview-line-health__header">
        <strong>{lineName}</strong>

        <span className={`db-health-status db-health-status--${tone === 'success' ? 'normal' : tone === 'danger' ? 'critical' : tone === 'warning' ? 'warning' : 'unknown'}`}>
          {classification
            ? formatLabel(classification)
            : 'Awaiting data'}
        </span>
      </div>

      <div className="db-overview-line-health__body">
        <div
          className="db-overview-line-health__ring"
          style={{
            '--health-progress': `${safeScore}%`,
          }}
          aria-label={
            score !== null
              ? `${score} out of 100 health score`
              : 'Health score unavailable'
          }
        >
          <div className="db-overview-line-health__ring-inner">
            <strong>{score !== null ? score : '—'}</strong>
            <span> / 100</span>
          </div>
        </div>

        <div className="db-overview-line-health__details">
          <span className="db-overview-line-health__detail">
            <span className={`db-overview-line-health__detail-dot db-overview-line-health__detail-dot--${tone}`} />
            <span>Health score</span>
            <strong>{score !== null ? `${score}/100` : '—'}</strong>
          </span>

          <span className="db-overview-line-health__detail">
            <span className="db-overview-line-health__detail-dot db-overview-line-health__detail-dot--blue" />
            <span>Availability</span>
            <strong>
              {availability ? formatLabel(availability) : '—'}
            </strong>
          </span>
        </div>
      </div>

      <div className="db-overview-line-health__footer">
        View line health <span aria-hidden="true">→</span>
      </div>
    </button>
  );
}

/* =====================================================
   MACHINE HEALTH PANEL
===================================================== */

function MachineHealthOverview({
  lineAData,
  lineBData,
  onNavigate,
}) {
  return (
    <div className="content-panel db-overview-health">
      <div className="db-overview-panel-header">
        <div className="db-overview-panel-title-group">
          <span className="db-overview-panel-icon db-overview-panel-icon--pink">
            <OverviewIcon name="health" size={22} />
          </span>

          <div>
            <h2 className="section-title">
              Machine Health
            </h2>

            <p className="section-description">
              Independent health status of both lines
            </p>
          </div>
        </div>

        <button
          type="button"
          className="db-overview-panel-link"
          onClick={() => onNavigate()}
        >
          View details <span aria-hidden="true">→</span>
        </button>
      </div>

      <div className="db-overview-line-health-grid">
        <LineHealthSummary
          lineName="Line A"
          lineData={lineAData}
          onClick={onNavigate}
        />

        <LineHealthSummary
          lineName="Line B"
          lineData={lineBData}
          onClick={onNavigate}
        />
      </div>

      <div className="db-overview-health-footer">
        <span className="db-overview-health-footer__dot" />
        <span>
          Scores and availability are displayed independently for each line.
        </span>
      </div>
    </div>
  );
}

/* =====================================================
   SIMULATION PREVIEW
===================================================== */

/**
 * SimulationPreview
 *
 * lineAnimation:
 *   React component/element supplied by the Digital Twin integration
 *   for the live Model 1 preview.
 *
 * expandedAnimation:
 *   Optional larger view of the same underlying simulation stream.
 *
 * No simulation controls are exposed.
 */
function SimulationPreview({
  lineName,
  status,
  animation,
  active,
  onOpen,
  onSelect,
}) {
  return (
    <div className={`db-overview-twin-view${active ? ' db-overview-twin-view--active' : ''}`}>
      <button
        type="button"
        className="db-overview-twin-view__tab"
        onClick={onSelect}
        aria-pressed={active}
      >
        {lineName}
      </button>

      <div className="db-overview-twin-view__status">
        <span className={`db-overview-twin-view__status-dot db-overview-twin-view__status-dot--${getStatusTone(status)}`} />
        {status ? formatLabel(status) : 'Awaiting connection'}
      </div>

      {active && (
        <div className="db-overview-twin-view__selected">
          <div className="db-overview-twin-view__selected-header">
            <span className="db-overview-twin-view__selected-title">
              {lineName} — Model 1 Simulation
            </span>

            <span className="db-overview-twin-view__live-label">
              <span />
              {getStatusTone(status) === 'success' ? 'Connected' : 'View only'}
            </span>
          </div>

          <button
            type="button"
            className="db-overview-twin-view__canvas"
            onClick={onOpen}
            aria-label={`Expand ${lineName} Model 1 simulation`}
          >
            {animation || (
              <div className="db-overview-twin-view__empty">
                <span className="db-overview-twin-view__empty-icon">
                  <OverviewIcon name="twin" size={34} />
                </span>

                <strong>Simulation preview unavailable</strong>

                <span>
                  The {lineName} Model 1 animation will appear here after
                  Digital Twin integration.
                </span>
              </div>
            )}

            <span className="db-overview-twin-view__expand">
              <span aria-hidden="true">⛶</span>
              Expand preview
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

/* =====================================================
   DIGITAL TWIN PANEL
===================================================== */

function DigitalTwinOverview({
  lineAData,
  lineBData,
  lineAAnimation,
  lineBAnimation,
  activeTwinLine,
  onSelectLine,
  onOpen,
}) {
  const lineAModelStatus =
    lineAData?.model1?.status ||
    lineAData?.model1Status ||
    lineAData?.simulationStatus ||
    null;

  const lineBModelStatus =
    lineBData?.model1?.status ||
    lineBData?.model1Status ||
    lineBData?.simulationStatus ||
    null;

  return (
    <div className="content-panel db-overview-twin-panel">
      <div className="db-overview-panel-header">
        <div className="db-overview-panel-title-group">
          <span className="db-overview-panel-icon db-overview-panel-icon--blue">
            <OverviewIcon name="twin" size={22} />
          </span>

          <div>
            <h2 className="section-title">
              Digital Twin — Live Simulation
            </h2>

            <p className="section-description">
              Model 1 · Production line visualization
            </p>
          </div>
        </div>

        <span className="db-overview-view-only">
          View only
        </span>
      </div>

      <div className="db-overview-twin-tabs">
        <SimulationPreview
          lineName="Line A"
          status={lineAModelStatus}
          animation={lineAAnimation}
          active={activeTwinLine === 'lineA'}
          onSelect={() => onSelectLine('lineA')}
          onOpen={() => onOpen('lineA')}
        />

        <SimulationPreview
          lineName="Line B"
          status={lineBModelStatus}
          animation={lineBAnimation}
          active={activeTwinLine === 'lineB'}
          onSelect={() => onSelectLine('lineB')}
          onOpen={() => onOpen('lineB')}
        />
      </div>
    </div>
  );
}

/* =====================================================
   PRODUCTION SUMMARY
===================================================== */

function ProductionOverview({
  lineAData,
  lineBData,
  productionSummary,
  orders,
  onNavigate,
}) {
  const boxesA =
    productionSummary?.lineA?.boxesProduced ??
    getBoxesProduced(lineAData);

  const boxesB =
    productionSummary?.lineB?.boxesProduced ??
    getBoxesProduced(lineBData);

  const rateA =
    productionSummary?.lineA?.productionRate ??
    getProductionRate(lineAData);

  const rateB =
    productionSummary?.lineB?.productionRate ??
    getProductionRate(lineBData);

  const numericBoxesA =
    boxesA !== null && boxesA !== undefined
      ? Number(typeof boxesA === 'object' ? boxesA.value : boxesA)
      : null;

  const numericBoxesB =
    boxesB !== null && boxesB !== undefined
      ? Number(typeof boxesB === 'object' ? boxesB.value : boxesB)
      : null;

  const totalBoxes =
    productionSummary?.totalBoxesProduced ??
    (
      numericBoxesA !== null &&
      numericBoxesB !== null &&
      Number.isFinite(numericBoxesA) &&
      Number.isFinite(numericBoxesB)
        ? numericBoxesA + numericBoxesB
        : null
    );

  const orderCounts = getActiveOrderCounts(orders);

  const hasProductionData =
    productionSummary !== null ||
    Boolean(lineAData?.metrics) ||
    Boolean(lineBData?.metrics);

  return (
    <div className="content-panel db-overview-production">
      <div className="db-overview-panel-header">
        <div className="db-overview-panel-title-group">
          <span className="db-overview-panel-icon db-overview-panel-icon--blue">
            <OverviewIcon name="production" size={22} />
          </span>

          <div>
            <h2 className="section-title">
              Production Summary
            </h2>

            <p className="section-description">
              Output across both production lines
            </p>
          </div>
        </div>

        <button
          type="button"
          className="db-overview-panel-link"
          onClick={onNavigate}
        >
          View details <span aria-hidden="true">→</span>
        </button>
      </div>

      {hasProductionData ? (
        <div className="db-overview-production__content">
          <div className="db-overview-production__total">
            <span>Total Boxes Produced</span>
            <strong>{formatMetric(totalBoxes)}</strong>
          </div>

          <div className="db-overview-production__lines">
            <div className="db-overview-production__line db-overview-production__line--a">
              <div className="db-overview-production__line-header">
                <span className="db-overview-production__line-dot" />
                <span>Line A</span>
              </div>

              <strong>{formatMetric(boxesA)}</strong>

              <small>
                Rate: {formatMetric(rateA)}
              </small>
            </div>

            <div className="db-overview-production__line db-overview-production__line--b">
              <div className="db-overview-production__line-header">
                <span className="db-overview-production__line-dot" />
                <span>Line B</span>
              </div>

              <strong>{formatMetric(boxesB)}</strong>

              <small>
                Rate: {formatMetric(rateB)}
              </small>
            </div>
          </div>
        </div>
      ) : (
        <PlaceholderSection
          note="Production totals and throughput will appear when actual production data is connected."
          height="110px"
        />
      )}

      {orderCounts && (
        <div className="db-overview-production__order-counts">
          <span>
            Waiting <strong>{orderCounts.waiting}</strong>
          </span>

          <span>
            Processing <strong>{orderCounts.processing}</strong>
          </span>

          <span>
            Completed <strong>{orderCounts.completed}</strong>
          </span>
        </div>
      )}
    </div>
  );
}

/* =====================================================
   ALERTS SUMMARY
===================================================== */

function ImportantAlerts({
  warnings,
  onNavigate,
}) {
  const activeWarnings = useMemo(
    () => getActiveWarnings(warnings),
    [warnings]
  );

  const visibleWarnings = activeWarnings.slice(0, 4);

  return (
    <div className="content-panel db-overview-alerts">
      <div className="db-overview-panel-header">
        <div className="db-overview-panel-title-group">
          <span className="db-overview-panel-icon db-overview-panel-icon--red">
            <OverviewIcon name="alerts" size={22} />
          </span>

          <div>
            <h2 className="section-title">
              Recent Alerts
            </h2>

            <p className="section-description">
              Active warnings requiring attention
            </p>
          </div>
        </div>

        <button
          type="button"
          className="db-overview-panel-link"
          onClick={onNavigate}
        >
          View all <span aria-hidden="true">→</span>
        </button>
      </div>

      {warnings === null ? (
        <PlaceholderSection
          note="Waiting for active warning records."
        />
      ) : visibleWarnings.length > 0 ? (
        <div className="db-overview-alert-list">
          {visibleWarnings.map((warning, index) => (
            <button
              type="button"
              className="db-overview-alert"
              key={
                warning.id ||
                warning.warningId ||
                index
              }
              onClick={onNavigate}
            >
              <span
                className={`db-overview-alert__marker db-overview-alert__marker--${['critical', 'high'].includes(getWarningSeverity(warning)) ? 'danger' : getWarningSeverity(warning) === 'medium' || getWarningSeverity(warning) === 'warning' ? 'warning' : 'info'}`}
              />

              <span className="db-overview-alert__content">
                <strong>
                  {warning.title ||
                    warning.description ||
                    'Warning details unavailable'}
                </strong>

                <small>
                  {warning.line ||
                    warning.productionLine ||
                    warning.affectedLine ||
                    'Line not specified'}
                </small>
              </span>

              <span className="db-overview-alert__meta">
                {formatTimestamp(
                  warning.timestamp ||
                  warning.createdAt
                )}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="db-placeholder">
          <span className="db-placeholder__label">
            No active warnings
          </span>

          <span className="db-placeholder__note">
            No unresolved warnings have been supplied.
          </span>
        </div>
      )}
    </div>
  );
}

/* =====================================================
   RECENT SYSTEM ACTIVITY
===================================================== */

function RecentActivity({
  activities,
  onNavigate,
}) {
  const recent = useMemo(
    () => getRecentActivities(activities),
    [activities]
  );

  return (
    <div className="content-panel db-overview-activity">
      <div className="db-overview-panel-header">
        <div className="db-overview-panel-title-group">
          <span className="db-overview-panel-icon db-overview-panel-icon--purple">
            <OverviewIcon name="activity" size={22} />
          </span>

          <div>
            <h2 className="section-title">
              Recent Activity
            </h2>

            <p className="section-description">
              Latest recorded system events
            </p>
          </div>
        </div>

        <button
          type="button"
          className="db-overview-panel-link"
          onClick={onNavigate}
        >
          View all <span aria-hidden="true">→</span>
        </button>
      </div>

      {activities === null ? (
        <PlaceholderSection
          note="Waiting for system activity records."
        />
      ) : recent.length > 0 ? (
        <div className="db-overview-activity-list">
          {recent.map((activity, index) => (
            <button
              type="button"
              className="db-overview-activity-item"
              key={
                activity.id ||
                activity.activityId ||
                index
              }
              onClick={onNavigate}
            >
              <span className="db-overview-activity-item__marker" />

              <span className="db-overview-activity-item__content">
                <strong>
                  {activity.title ||
                    activity.description ||
                    activity.event ||
                    'Activity record'}
                </strong>

                <small>
                  {activity.source ||
                    activity.actor ||
                    'System'}
                </small>
              </span>

              <span className="db-overview-activity-item__meta">
                {formatTimestamp(
                  activity.timestamp ||
                  activity.createdAt ||
                  activity.occurredAt
                )}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="db-placeholder">
          <span className="db-placeholder__label">
            No recent activity
          </span>

          <span className="db-placeholder__note">
            Recorded system activity will appear here when integration is connected.
          </span>
        </div>
      )}
    </div>
  );
}

/* =====================================================
   OVERVIEW PAGE
===================================================== */

/**
 * OverviewPage — Section A.
 *
 * Existing data integration props are retained:
 *
 * orders:
 *   Actual order records used for production summary counts.
 *
 * lineAData / lineBData:
 *   Separate line-specific production and machine-health data.
 *
 * productionSummary:
 *   Optional aggregated production metrics.
 *
 * warnings:
 *   Active warning records.
 *
 * activities:
 *   Persisted system activity records.
 *
 * lineAAnimation / lineBAnimation:
 *   Live Model 1 preview components/elements.
 *
 * lineAExpandedAnimation / lineBExpandedAnimation:
 *   Optional expanded simulation views.
 *
 * integrationStatus:
 *   Live connection states for System, Orders and Production integrations.
 *   Missing values are displayed as Not verified.
 *
 * onNavigate:
 *   Navigates to the relevant Dashboard section.
 *
 * UI behavior:
 *   Integration summary cards open detail popups.
 *   Line A / Line B health buttons navigate to their respective tabs.
 *   Line A / Line B preview selection is local presentation state.
 *   No production or simulation controls are provided.
 *   Model 2 is not rendered on this page.
 */
function OverviewPage({
  orders = null,
  lineAData = {},
  lineBData = {},
  productionSummary = null,
  warnings = null,
  activities = null,
  lineAAnimation = null,
  lineBAnimation = null,
  lineAExpandedAnimation = null,
  lineBExpandedAnimation = null,
  integrationStatus = null,
  onNavigate,
}) {
  const [simModal, setSimModal] = useState(null);
  const [activeTwinLine, setActiveTwinLine] = useState('lineA');
  const [selectedIntegrationId, setSelectedIntegrationId] = useState(null);

  const orderCounts = useMemo(
    () => getActiveOrderCounts(orders),
    [orders]
  );

  const integrationGroups = useMemo(() => {
    return INTEGRATION_GROUPS.map((group) => ({
      group,
      summary: getIntegrationGroupSummary(group, integrationStatus),
    }));
  }, [integrationStatus]);

  const selectedIntegration = integrationGroups.find(
    (item) => item.group.id === selectedIntegrationId
  ) || null;

  const selectedAnimation =
    simModal === 'lineA'
      ? lineAExpandedAnimation || lineAAnimation
      : lineBExpandedAnimation || lineBAnimation;

  const handleNavigate = (pageId, detail) => {
    if (typeof onNavigate === 'function') {
      onNavigate(pageId, detail);
    }
  };

  return (
    <div className="db-page db-overview-page">
      <PageHeader
        eyebrow="Dashboard"
        title="Overview"
        description="A concise operational snapshot of the AutoPack system and both production lines."
      />

      {/* =================================================
          ROW 1 — INTEGRATION STATUS CARDS
      ================================================= */}

      <div className="db-overview-summary-grid">
        {integrationGroups.map(({ group, summary }) => (
          <IntegrationStatusCard
            key={group.id}
            group={group}
            summary={summary}
            onClick={() => setSelectedIntegrationId(group.id)}
          />
        ))}
      </div>

      {/* =================================================
          ROW 2 — LIVE TWIN + MACHINE HEALTH
      ================================================= */}

      <div className="db-overview-main-grid">
        <DigitalTwinOverview
          lineAData={lineAData}
          lineBData={lineBData}
          lineAAnimation={lineAAnimation}
          lineBAnimation={lineBAnimation}
          activeTwinLine={activeTwinLine}
          onSelectLine={setActiveTwinLine}
          onOpen={setSimModal}
        />

        <MachineHealthOverview
          lineAData={lineAData}
          lineBData={lineBData}
          onNavigate={(lineName) => handleNavigate('machine-health', lineName)}
        />
      </div>

      {/* =================================================
          ROW 3 — PRODUCTION, ALERTS AND ACTIVITY
      ================================================= */}

      <div className="db-overview-bottom-grid">
        <ProductionOverview
          lineAData={lineAData}
          lineBData={lineBData}
          productionSummary={productionSummary}
          orders={orders}
          onNavigate={() => handleNavigate('production-monitoring')}
        />

        <ImportantAlerts
          warnings={warnings}
          onNavigate={() => handleNavigate('logs-history')}
        />

        <RecentActivity
          activities={activities}
          onNavigate={() => handleNavigate('logs-history')}
        />
      </div>

      {/* =================================================
          INTEGRATION DETAILS POPUP
      ================================================= */}

      <Modal
        open={selectedIntegration !== null}
        onClose={() => setSelectedIntegrationId(null)}
        title={
          selectedIntegration
            ? `${selectedIntegration.group.title} — Connection Details`
            : 'Integration Details'
        }
        wide
      >
        {selectedIntegration && (
          <IntegrationDetails
            group={selectedIntegration.group}
            summary={selectedIntegration.summary}
          />
        )}
      </Modal>

      {/* =================================================
          EXPANDED SIMULATION VIEW
      ================================================= */}

      <Modal
        open={simModal !== null}
        onClose={() => setSimModal(null)}
        title={
          simModal === 'lineA'
            ? 'Line A — Model 1 Simulation'
            : 'Line B — Model 1 Simulation'
        }
        wide
      >
        <div className="db-sim-modal-body">
          <div className="db-overview-expanded-simulation">
            {selectedAnimation || (
              <PlaceholderSection
                height="420px"
                note="The expanded Model 1 simulation view will appear here when the Digital Twin rendering component is integrated."
              />
            )}
          </div>

          <p className="db-modal-note">
            This is a view-only simulation. The simulation continues
            independently; the Dashboard does not provide Play, Pause,
            Reset, speed or production parameter controls.
          </p>
        </div>
      </Modal>
    </div>
  );
}

export default OverviewPage;

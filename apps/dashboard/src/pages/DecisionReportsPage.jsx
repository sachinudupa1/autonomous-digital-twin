import { useMemo, useState } from 'react';
import PageHeader from '../components/common/PageHeader';
import PlaceholderSection from '../components/common/PlaceholderSection';
import Modal from '../components/common/Modal';

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'processing', label: 'Processing' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'failed', label: 'Failed' },
];

/**
 * Normalizes order statuses so that filters work consistently
 * even when different backend components use slightly different labels.
 */
function normalizeStatus(status) {
  const normalized = String(status || '')
    .trim()
    .toLowerCase()
    .replaceAll('_', '-')
    .replaceAll(' ', '-');

  if (['cancelled', 'canceled'].includes(normalized)) {
    return 'cancelled';
  }

  if (['processing', 'in-progress', 'in-production'].includes(normalized)) {
    return 'processing';
  }

  if (normalized === 'completed' || normalized === 'complete') {
    return 'completed';
  }

  if (normalized === 'failed' || normalized === 'failure') {
    return 'failed';
  }

  return normalized;
}

/**
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

  if (timestamp === null) return null;

  return new Date(timestamp).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * DecisionReportsPage
 *
 * Props:
 *   orders — array of actual order records received from the application.
 *
 * The component does not create sample orders.
 * It retains completed, cancelled and failed reports when supplied
 * by the backend.
 */
function DecisionReportsPage({ orders = [] }) {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  /**
   * Apply the Order ID search and status filters.
   * Newest orders are displayed first whenever timestamps are available.
   */
  const filteredOrders = useMemo(() => {
    if (!Array.isArray(orders)) return [];

    const normalizedQuery = searchQuery.trim().toLowerCase();

    return orders
      .filter((order) => {
        const orderId = String(
          order.orderId || order.id || ''
        ).toLowerCase();

        const matchesSearch =
          !normalizedQuery || orderId.includes(normalizedQuery);

        const status = normalizeStatus(order.status);

        const matchesStatus =
          selectedFilter === 'all' || status === selectedFilter;

        return matchesSearch && matchesStatus;
      })
      .map((order, originalIndex) => ({
        order,
        originalIndex,
        timestamp: getTimestampValue(
          order.updatedAt || order.createdAt || order.timestamp
        ),
      }))
      .sort((a, b) => {
        if (a.timestamp === null && b.timestamp === null) {
          return a.originalIndex - b.originalIndex;
        }

        if (a.timestamp === null) return 1;
        if (b.timestamp === null) return -1;

        return b.timestamp - a.timestamp;
      })
      .map(({ order }) => order);
  }, [orders, searchQuery, selectedFilter]);

  const handleOpenDetail = (order) => {
    setSelectedOrder(order);
  };

  const getOrderId = (order) => order.orderId || order.id || '—';

  const getStatusLabel = (order) => {
    return order.status
      ? String(order.status).replaceAll('_', ' ')
      : 'Status unavailable';
  };

  const getLine = (order) => {
    return order.productionLine || order.line || order.assignedLine || 'Not assigned';
  };

  const getOrderTimestamp = (order) => {
    return formatTimestamp(
      order.updatedAt || order.createdAt || order.timestamp
    );
  };

  return (
    <div className="db-page">
      <PageHeader
        eyebrow="Reports"
        title="Decision Reports"
        description="Review the final decisions, reasoning and execution outcomes recorded for each order."
      />

      {/* Filter and Search Bar */}
      <div
        className="content-panel db-filter-bar"
        style={{ marginBottom: '24px' }}
      >
        <div className="db-filter-bar__inner">

          {/* Order ID Search */}
          <div className="db-search-field">
            <svg
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
              type="search"
              placeholder="Search Order ID..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="db-search-field__input"
              aria-label="Search Order ID"
            />
          </div>

          {/* Status Filter Chips */}
          <div
            className="db-filter-chips"
            role="group"
            aria-label="Status filters"
          >
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                className={`db-chip${
                  selectedFilter === filter.id ? ' db-chip--active' : ''
                }`}
                onClick={() => setSelectedFilter(filter.id)}
                aria-pressed={selectedFilter === filter.id}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Order Reports List */}
      <div className="content-panel">
        <div className="section-heading">
          <h2 className="section-title">
            Order Decision Reports
          </h2>

          <p className="section-description">
            Each order retains its own decision report and execution history.
            Select an order to inspect its detailed report.
          </p>
        </div>

        <div className="db-orders-list" aria-live="polite">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => {
              const orderId = getOrderId(order);
              const status = normalizeStatus(order.status);
              const timestamp = getOrderTimestamp(order);

              return (
                <div
                  key={orderId}
                  className="db-order-row"
                >
                  <div className="db-order-row__info">
                    <span className="db-order-row__id">
                      {orderId}
                    </span>

                    <span
                      className={`db-status-badge db-status-badge--${status}`}
                    >
                      {getStatusLabel(order)}
                    </span>

                    <span className="db-order-row__meta">
                      {getLine(order)}
                    </span>

                    {timestamp && (
                      <span className="db-order-row__meta">
                        Updated: {timestamp}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => handleOpenDetail(order)}
                    aria-label={`View detailed report for ${orderId}`}
                  >
                    View Detailed Report
                  </button>
                </div>
              );
            })
          ) : (
            <div className="db-placeholder">
              <span className="db-placeholder__label">
                {orders.length === 0
                  ? 'No order reports available yet'
                  : 'No matching order reports'}
              </span>

              <span className="db-placeholder__note">
                {orders.length === 0
                  ? 'Order reports will appear here when the backend integration supplies real order records.'
                  : 'Try another Order ID or select a different status filter.'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Report Modal */}
      <Modal
        open={selectedOrder !== null}
        onClose={() => setSelectedOrder(null)}
        title={`Decision Report — ${
          selectedOrder ? getOrderId(selectedOrder) : ''
        }`}
        wide
      >
        {selectedOrder && (
          <div className="db-report-detail-modal">

            {/* Order Summary */}
            <div className="db-report-detail-header">
              <div>
                <strong>Order ID:</strong>{' '}
                {getOrderId(selectedOrder)}
              </div>

              <div>
                <strong>Status:</strong>{' '}
                {getStatusLabel(selectedOrder)}
              </div>

              <div>
                <strong>Production Line:</strong>{' '}
                {getLine(selectedOrder)}
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <h3 className="section-title" style={{ fontSize: '15px', marginBottom: '8px' }}>
                Original Order Requirements &amp; Input Conditions
              </h3>

              <PlaceholderSection
                note="Order requirements, product quantities and input conditions will be displayed from the order record."
                height="120px"
              />
            </div>

            <div style={{ marginTop: '20px' }}>
              <h3 className="section-title" style={{ fontSize: '15px', marginBottom: '8px' }}>
                Individual Agent Plans
              </h3>

              <PlaceholderSection
                note="The independently selected plans from the RL Agent, ML Agent and Rule-Based Agent will be displayed here."
                height="140px"
              />
            </div>

            <div style={{ marginTop: '20px' }}>
              <h3 className="section-title" style={{ fontSize: '15px', marginBottom: '8px' }}>
                Main Agent Evaluation &amp; Comparison
              </h3>

              <PlaceholderSection
                note="The Main Agent's comparison of the three evaluated plans and its recorded reasoning will appear here."
                height="140px"
              />
            </div>

            <div style={{ marginTop: '20px' }}>
              <h3 className="section-title" style={{ fontSize: '15px', marginBottom: '8px' }}>
                Mistake Logs &amp; Verification
              </h3>

              <PlaceholderSection
                note="Relevant mistake logs, verification checks and recorded findings will appear here."
                height="120px"
              />
            </div>

            <div style={{ marginTop: '20px' }}>
              <h3 className="section-title" style={{ fontSize: '15px', marginBottom: '8px' }}>
                Why the Final Approach Was Selected
              </h3>

              <PlaceholderSection
                note="The Main Agent's recorded explanation for selecting the final plan, including rejected alternatives, will appear here."
                height="120px"
              />
            </div>

            <div style={{ marginTop: '20px' }}>
              <h3 className="section-title" style={{ fontSize: '15px', marginBottom: '8px' }}>
                Final Plan &amp; Instructions
              </h3>

              <PlaceholderSection
                note="The final consolidated plan and order-specific instructions sent to the proto replacement model will appear here."
                height="140px"
              />
            </div>

            <div style={{ marginTop: '20px' }}>
              <h3 className="section-title" style={{ fontSize: '15px', marginBottom: '8px' }}>
                Predictions &amp; Model 2 Execution Results
              </h3>

              <PlaceholderSection
                note="Predicted timing and outcomes will be shown separately from the corresponding Model 2 execution results. Model 1 simulation outputs will not be misrepresented as actual production results."
                height="140px"
              />
            </div>

            <div style={{ marginTop: '20px' }}>
              <h3 className="section-title" style={{ fontSize: '15px', marginBottom: '8px' }}>
                Execution History &amp; Final Order Outcome
              </h3>

              <PlaceholderSection
                note="Order execution events, timestamps, delays, failures and final production outcome will appear here."
                height="130px"
              />
            </div>

          </div>
        )}
      </Modal>
    </div>
  );
}

export default DecisionReportsPage;
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
import Modal from '../components/common/Modal';

/* =====================================================
   NAVIGATION & FILTER DEFINITIONS
===================================================== */

const TABS = [
  { id: 'line-a', label: 'Line A' },
  { id: 'line-b', label: 'Line B' },
  { id: 'combined', label: 'Combined Overview' },
];

const DATE_RANGES = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: 'Last 7 Days' },
  { id: '30d', label: 'Last 30 Days' },
  { id: 'custom', label: 'Custom Range' },
];

const ORDER_STATUS_FILTERS = [
  { id: 'all', label: 'All Orders' },
  { id: 'waiting', label: 'Waiting' },
  { id: 'processing', label: 'Processing' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'failed', label: 'Failed' },
];

/* =====================================================
   GENERAL DATA HELPERS
===================================================== */

function normalizeValue(value) {
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
    year: 'numeric',
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

function getLocalDateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function getRecordTimestamp(record) {
  return (
    record.timestamp ||
    record.recordedAt ||
    record.createdAt ||
    record.completedAt ||
    record.updatedAt ||
    null
  );
}

/* =====================================================
   METRIC HELPERS
===================================================== */

function getMetricValue(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'object') {
    if (value.value === null || value.value === undefined) {
      return null;
    }

    return value.value;
  }

  return value;
}

function getMetricUnit(value, defaultUnit = '') {
  if (value && typeof value === 'object') {
    return value.unit || defaultUnit;
  }

  return defaultUnit;
}

function formatMetric(value, defaultUnit = '') {
  const metric = getMetricValue(value);

  if (metric === null) return '—';

  const unit = getMetricUnit(value, defaultUnit);

  return `${metric}${unit ? ` ${unit}` : ''}`;
}

function getNumericMetric(value) {
  const metric = Number(getMetricValue(value));

  return Number.isFinite(metric) ? metric : null;
}

function combineMetrics(valueA, valueB) {
  const numberA = getNumericMetric(valueA);
  const numberB = getNumericMetric(valueB);

  if (numberA === null || numberB === null) {
    return null;
  }

  const unitA = getMetricUnit(valueA);
  const unitB = getMetricUnit(valueB);

  if (unitA !== unitB) {
    return null;
  }

  return {
    value: numberA + numberB,
    unit: unitA,
  };
}

/* =====================================================
   ORDER HELPERS
===================================================== */

function getOrderId(order) {
  return order.orderId || order.id || 'ID unavailable';
}

function getOrderStatus(order) {
  const status = normalizeValue(order.status);

  if (
    ['waiting', 'pending', 'queued', 'accepted', 'not-started']
      .includes(status)
  ) {
    return 'waiting';
  }

  if (
    ['processing', 'in-progress', 'in-production', 'running']
      .includes(status)
  ) {
    return 'processing';
  }

  if (['completed', 'complete', 'finished'].includes(status)) {
    return 'completed';
  }

  if (['cancelled', 'canceled'].includes(status)) {
    return 'cancelled';
  }

  if (['failed', 'failure', 'aborted'].includes(status)) {
    return 'failed';
  }

  return status || 'unknown';
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

function normalizeLine(value) {
  return normalizeValue(value).replaceAll('-', '');
}

function getPriority(order) {
  const value = normalizeValue(
    order.priority ||
    order.orderType ||
    order.type ||
    ''
  );

  return (
    order.isRush === true ||
    order.rush === true ||
    value === 'rush' ||
    value === 'urgent'
  )
    ? 'Rush'
    : 'Normal';
}

function getOrderProgress(order) {
  const value =
    order.progressPercent ??
    order.progress ??
    order.completionPercentage ??
    order.productionProgress;

  if (value === null || value === undefined || value === '') {
    return null;
  }

  const number = Number(
    typeof value === 'object' ? value.value : value
  );

  return Number.isFinite(number)
    ? Math.max(0, Math.min(100, number))
    : null;
}

function getOrderProducts(order) {
  return (
    order.productQuantities ||
    order.products ||
    order.items ||
    order.quantities ||
    null
  );
}

function formatProductQuantity(product) {
  if (!product || typeof product !== 'object') {
    return 'Not available';
  }

  const name =
    product.productName ||
    product.name ||
    product.product ||
    product.id ||
    'Product';

  const quantity =
    product.quantity ??
    product.count ??
    product.qty;

  return `${name}${quantity !== undefined ? ` × ${quantity}` : ''}`;
}

/* =====================================================
   DATE RANGE FILTERING
===================================================== */

function getDateRangeBounds(range, dateFrom, dateTo) {
  const now = new Date();

  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  if (range === 'today') {
    return {
      start: todayStart.getTime(),
      end: now.getTime(),
    };
  }

  if (range === '7d') {
    const start = new Date(todayStart);
    start.setDate(start.getDate() - 6);

    return {
      start: start.getTime(),
      end: now.getTime(),
    };
  }

  if (range === '30d') {
    const start = new Date(todayStart);
    start.setDate(start.getDate() - 29);

    return {
      start: start.getTime(),
      end: now.getTime(),
    };
  }

  if (range === 'custom') {
    const start = dateFrom
      ? new Date(`${dateFrom}T00:00:00`).getTime()
      : null;

    const end = dateTo
      ? new Date(`${dateTo}T23:59:59.999`).getTime()
      : null;

    return {
      start: start !== null && !Number.isNaN(start) ? start : null,
      end: end !== null && !Number.isNaN(end) ? end : null,
    };
  }

  return {
    start: null,
    end: now.getTime(),
  };
}

function isInsideRange(timestamp, bounds) {
  if (timestamp === null || timestamp === undefined) {
    return false;
  }

  if (bounds.start !== null && timestamp < bounds.start) {
    return false;
  }

  if (bounds.end !== null && timestamp > bounds.end) {
    return false;
  }

  return true;
}

/* =====================================================
   PRODUCTION HISTORY HELPERS
===================================================== */

function getProductionHistory(lineData) {
  return (
    lineData?.productionHistory ||
    lineData?.history ||
    lineData?.trend ||
    []
  );
}

function getHistoryOutput(record) {
  return (
    record.boxesProduced ??
    record.producedBoxes ??
    record.producedCount ??
    record.productionOutput ??
    record.output ??
    record.totalBoxesProduced ??
    record.boxCount ??
    null
  );
}

function normalizeHistory(records, bounds) {
  if (!Array.isArray(records)) return [];

  return records
    .map((record, index) => {
      const timestamp = getTimestampValue(
        getRecordTimestamp(record)
      );

      const output = Number(getHistoryOutput(record));

      if (
        timestamp === null ||
        !Number.isFinite(output) ||
        !isInsideRange(timestamp, bounds)
      ) {
        return null;
      }

      const date = new Date(timestamp);

      return {
        timestamp,
        label: date.toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          ...(bounds.start !== null &&
          bounds.end !== null &&
          bounds.end - bounds.start <= 24 * 60 * 60 * 1000
            ? {
                hour: '2-digit',
                minute: '2-digit',
              }
            : {}),
        }),
        boxesProduced: output,
        key: record.id || `history-${index}`,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.timestamp - b.timestamp);
}

function combineProductionHistory(historyA, historyB, bounds) {
  const map = new Map();

  const addRecords = (records, key) => {
    if (!Array.isArray(records)) return;

    records.forEach((record) => {
      const timestamp = getTimestampValue(
        getRecordTimestamp(record)
      );

      const output = Number(getHistoryOutput(record));

      if (
        timestamp === null ||
        !Number.isFinite(output) ||
        !isInsideRange(timestamp, bounds)
      ) {
        return;
      }

      const date = new Date(timestamp);
      const id = timestamp;

      if (!map.has(id)) {
        map.set(id, {
          timestamp,
          label: date.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          }),
          lineA: null,
          lineB: null,
        });
      }

      map.get(id)[key] = output;
    });
  };

  addRecords(historyA, 'lineA');
  addRecords(historyB, 'lineB');

  return [...map.values()].sort(
    (a, b) => a.timestamp - b.timestamp
  );
}

/* =====================================================
   METRIC CARD
===================================================== */

function MetricCard({
  label,
  value,
  description,
  accent = 'orange',
}) {
  return (
    <div
      className={`db-production-metric db-production-metric--${accent}`}
    >
      <span className="db-production-metric__label">
        {label}
      </span>

      <strong className="db-production-metric__value">
        {value}
      </strong>

      {description && (
        <span className="db-production-metric__description">
          {description}
        </span>
      )}
    </div>
  );
}

/* =====================================================
   DATE RANGE CONTROL
===================================================== */

function DateRangeFilter({
  range,
  setRange,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
}) {
  return (
    <div className="content-panel db-production-date-filter">
      <div className="db-production-date-filter__header">
        <div>
          <h2 className="section-title">
            Production Time Range
          </h2>

          <p className="section-description">
            Select the period used for production trends and historical records.
          </p>
        </div>
      </div>

      <div
        className="db-filter-chips"
        role="group"
        aria-label="Production date range"
      >
        {DATE_RANGES.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`db-chip${
              range === item.id ? ' db-chip--active' : ''
            }`}
            onClick={() => setRange(item.id)}
            aria-pressed={range === item.id}
          >
            {item.label}
          </button>
        ))}
      </div>

      {range === 'custom' && (
        <div className="db-production-date-filter__custom">
          <div className="form-field">
            <label className="form-label" htmlFor="production-date-from">
              From
            </label>

            <input
              id="production-date-from"
              type="date"
              className="form-input"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="production-date-to">
              To
            </label>

            <input
              id="production-date-to"
              type="date"
              className="form-input"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* =====================================================
   PRODUCTION TREND CHART
===================================================== */

function ProductionTrendChart({
  data,
  combined = false,
}) {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <PlaceholderSection
        height="190px"
        note="Production trend will appear when timestamped production records are available."
      />
    );
  }

  return (
    <div className="db-production-chart">
      <ResponsiveContainer width="100%" height={270}>
        <LineChart
          data={data}
          margin={{
            top: 12,
            right: 18,
            bottom: 8,
            left: -15,
          }}
        >
          <CartesianGrid
            stroke="var(--border)"
            strokeDasharray="3 4"
            vertical={false}
          />

          <XAxis
            dataKey="label"
            tick={{
              fill: 'var(--text-muted)',
              fontSize: 10,
            }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
            minTickGap={25}
          />

          <YAxis
            allowDecimals={false}
            tick={{
              fill: 'var(--text-muted)',
              fontSize: 10,
            }}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip
            contentStyle={{
              background: 'var(--surface-solid)',
              border: '1px solid var(--border-strong)',
              borderRadius: '9px',
              color: 'var(--text-primary)',
              fontSize: '12px',
            }}
            formatter={(value, name) => [
              value === null || value === undefined
                ? 'No data'
                : `${value} boxes`,
              name,
            ]}
          />

          {combined ? (
            <>
              <Line
                type="monotone"
                dataKey="lineA"
                name="Line A"
                stroke="#FF7900"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                connectNulls={false}
              />

              <Line
                type="monotone"
                dataKey="lineB"
                name="Line B"
                stroke="#1677FF"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                connectNulls={false}
              />
            </>
          ) : (
            <Line
              type="monotone"
              dataKey="boxesProduced"
              name="Boxes Produced"
              stroke="var(--brand-green)"
              strokeWidth={2.5}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>

      <p className="db-modal-note">
        Values are displayed from timestamped production records.
        Missing readings are not replaced with estimated data.
      </p>
    </div>
  );
}

/* =====================================================
   PRODUCTION HISTORY TABLE
===================================================== */

function ProductionHistoryTable({ data }) {
  if (!data.length) {
    return (
      <PlaceholderSection
        height="130px"
        note="No historical production records are available for this time range."
      />
    );
  }

  return (
    <div className="db-health-table-wrapper">
      <table className="db-health-table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Boxes Produced</th>
          </tr>
        </thead>

        <tbody>
          {[...data]
            .sort((a, b) => b.timestamp - a.timestamp)
            .map((record, index) => (
              <tr key={record.key || index}>
                <td>{formatTimestamp(record.timestamp)}</td>
                <td>{record.boxesProduced}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

/* =====================================================
   DELAYS & BOTTLENECKS
===================================================== */

function DelayList({ delays, bottlenecks }) {
  const records = [
    ...(Array.isArray(delays) ? delays : []),
    ...(Array.isArray(bottlenecks) ? bottlenecks : []),
  ];

  if (!records.length) {
    return (
      <PlaceholderSection
        note="Delay and bottleneck records will appear here when supplied by the production monitoring system."
      />
    );
  }

  return (
    <div className="db-production-issue-list">
      {records.map((record, index) => (
        <div
          className="db-production-issue"
          key={record.id || index}
        >
          <div className="db-production-issue__header">
            <span className="db-production-issue__title">
              {record.title ||
                record.reason ||
                record.description ||
                record.type ||
                'Production issue'}
            </span>

            {record.severity && (
              <span className="db-badge db-badge--warning">
                {formatLabel(record.severity)}
              </span>
            )}
          </div>

          {record.description && record.title && (
            <p className="db-production-issue__description">
              {record.description}
            </p>
          )}

          <div className="db-production-issue__meta">
            {record.component && (
              <span>Component: {record.component}</span>
            )}

            {record.affectedComponent && (
              <span>Component: {record.affectedComponent}</span>
            )}

            {record.orderId && (
              <span>Order: {record.orderId}</span>
            )}

            {record.duration && (
              <span>Duration: {formatMetric(record.duration)}</span>
            )}

            {record.timestamp && (
              <span>{formatTimestamp(record.timestamp)}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* =====================================================
   ORDER STATUS & PRIORITY HELPERS
===================================================== */

function getStatusBadgeClass(status) {
  if (status === 'completed') return 'completed';
  if (status === 'failed') return 'failed';
  if (status === 'cancelled') return 'cancelled';
  if (status === 'processing') return 'processing';
  return 'waiting';
}

/* =====================================================
   ORDER QUEUE
===================================================== */

function OrderQueue({
  orders,
  onSelectOrder,
  showLine = false,
}) {
  const [orderSearch, setOrderSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredOrders = useMemo(() => {
    const query = orderSearch.trim().toLowerCase();

    return orders.filter((order) => {
      const orderId = String(getOrderId(order)).toLowerCase();
      const status = getOrderStatus(order);

      const matchesSearch =
        !query || orderId.includes(query);

      const matchesStatus =
        statusFilter === 'all' || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, orderSearch, statusFilter]);

  return (
    <div className="db-order-queue">
      <div className="db-order-queue__filters">
        <input
          type="search"
          className="form-input"
          placeholder="Search Order ID..."
          value={orderSearch}
          onChange={(event) => setOrderSearch(event.target.value)}
          aria-label="Search production orders"
        />

        <select
          className="form-input"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter order status"
        >
          {ORDER_STATUS_FILTERS.map((filter) => (
            <option key={filter.id} value={filter.id}>
              {filter.label}
            </option>
          ))}
        </select>
      </div>

      {filteredOrders.length > 0 ? (
        <div className="db-orders-list">
          {filteredOrders.map((order, index) => {
            const id = getOrderId(order);
            const status = getOrderStatus(order);
            const progress = getOrderProgress(order);

            return (
              <div
                className="db-order-row db-production-order-row"
                key={order.id || order.orderId || index}
              >
                <div className="db-production-order-row__main">
                  <div className="db-order-row__info">
                    <span className="db-order-row__id">
                      {id}
                    </span>

                    <span
                      className={`db-status-badge db-status-badge--${getStatusBadgeClass(status)}`}
                    >
                      {formatLabel(status)}
                    </span>

                    {showLine && getOrderLine(order) && (
                      <span className="db-order-row__meta">
                        {formatLabel(getOrderLine(order))}
                      </span>
                    )}

                    <span
                      className={`db-priority-badge ${
                        getPriority(order) === 'Rush'
                          ? 'db-priority-badge--rush'
                          : 'db-priority-badge--normal'
                      }`}
                    >
                      {getPriority(order)}
                    </span>
                  </div>

                  {progress !== null && (
                    <div className="db-production-order-progress">
                      <div className="db-production-order-progress__track">
                        <span
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      <span>{progress}%</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => onSelectOrder(order)}
                >
                  View Details
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <PlaceholderSection
          note={
            orders.length === 0
              ? 'No real order records are available yet. The queue will populate when backend order data is connected.'
              : 'No orders match the current search or status filter.'
          }
          height="115px"
        />
      )}
    </div>
  );
}

/* =====================================================
   ORDER DETAIL MODAL
===================================================== */

function OrderDetailsModal({
  order,
  onClose,
  onNavigate,
}) {
  if (!order) return null;

  const products = getOrderProducts(order);
  const status = getOrderStatus(order);
  const progress = getOrderProgress(order);

  const productRows = Array.isArray(products)
    ? products
    : products && typeof products === 'object'
      ? Object.entries(products).map(([name, item]) => ({
          name,
          ...(typeof item === 'object'
            ? item
            : { quantity: item }),
        }))
      : [];

  return (
    <Modal
      open={order !== null}
      onClose={onClose}
      title={`Order Details — ${getOrderId(order)}`}
      wide
    >
      <div className="db-production-order-detail">

        {/* Order summary */}
        <div className="db-report-detail-header">
          <div>
            <strong>Order ID:</strong>{' '}
            {getOrderId(order)}
          </div>

          <div>
            <strong>Status:</strong>{' '}
            {formatLabel(status)}
          </div>

          <div>
            <strong>Production Line:</strong>{' '}
            {formatLabel(getOrderLine(order))}
          </div>
        </div>

        {/* Requirements */}
        <section className="db-production-detail-section">
          <h3 className="section-title">
            Order Requirements
          </h3>

          {productRows.length > 0 ? (
            <div className="db-production-product-list">
              {productRows.map((product, index) => (
                <div
                  className="db-production-product"
                  key={product.id || product.name || index}
                >
                  <span>
                    {formatProductQuantity(product)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <PlaceholderSection
              note="Product quantities have not been supplied for this order."
            />
          )}
        </section>

        {/* Progress */}
        <section className="db-production-detail-section">
          <h3 className="section-title">
            Production Progress
          </h3>

          {progress !== null ? (
            <div className="db-production-order-progress db-production-order-progress--large">
              <div className="db-production-order-progress__track">
                <span style={{ width: `${progress}%` }} />
              </div>

              <strong>{progress}%</strong>
            </div>
          ) : (
            <PlaceholderSection
              note="Current production progress has not been supplied."
            />
          )}
        </section>

        {/* Timing */}
        <section className="db-production-detail-section">
          <h3 className="section-title">
            Predicted &amp; Actual Timing
          </h3>

          <div className="db-production-detail-grid">
            <DetailField
              label="Predicted Start"
              value={formatTimestamp(
                order.predictedStartTime ||
                order.estimatedStartTime
              )}
            />

            <DetailField
              label="Predicted Completion"
              value={formatTimestamp(
                order.predictedCompletionTime ||
                order.estimatedCompletionTime
              )}
            />

            <DetailField
              label="Actual Start"
              value={formatTimestamp(
                order.actualStartTime ||
                order.startedAt
              )}
            />

            <DetailField
              label="Actual Completion"
              value={formatTimestamp(
                order.actualCompletionTime ||
                order.completedAt
              )}
            />

            <DetailField
              label="Predicted Processing Duration"
              value={formatMetric(
                order.predictedProcessingDuration ??
                order.predictedDuration
              )}
            />

            <DetailField
              label="Actual Processing Duration"
              value={formatMetric(
                order.actualProcessingDuration ??
                order.actualDuration
              )}
            />

            <DetailField
              label="Delay"
              value={formatMetric(order.delay)}
            />

            <DetailField
              label="Delay Reason"
              value={order.delayReason}
            />
          </div>
        </section>

        {/* Other useful information */}
        <section className="db-production-detail-section">
          <h3 className="section-title">
            Order Information
          </h3>

          <div className="db-production-detail-grid">
            <DetailField
              label="Priority"
              value={getPriority(order)}
            />

            <DetailField
              label="Order Received"
              value={formatTimestamp(
                order.createdAt ||
                order.receivedAt
              )}
            />

            <DetailField
              label="Last Updated"
              value={formatTimestamp(order.updatedAt)}
            />

            <DetailField
              label="Production Line"
              value={formatLabel(getOrderLine(order))}
            />
          </div>
        </section>

        <p className="db-modal-note">
          Detailed agent proposals and decision reasoning are retained
          in Decision Reports. They are not duplicated in this order
          monitoring popup.
        </p>

        {typeof onNavigate === 'function' && (
          <div className="db-production-detail-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                onClose();
                onNavigate('decision-reports');
              }}
            >
              Open Decision Reports
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

/* Detail field shared by order modal */

function DetailField({ label, value }) {
  if (
    value === undefined ||
    value === null ||
    value === '' ||
    value === 'Not available'
  ) {
    return (
      <div className="db-production-detail-field">
        <span>{label}</span>
        <strong>Not available</strong>
      </div>
    );
  }

  return (
    <div className="db-production-detail-field">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

/* =====================================================
   ORDER SUMMARY COUNTS
===================================================== */

function calculateOrderCounts(orders) {
  return {
    waiting: orders.filter(
      (order) => getOrderStatus(order) === 'waiting'
    ).length,

    processing: orders.filter(
      (order) => getOrderStatus(order) === 'processing'
    ).length,

    completed: orders.filter(
      (order) => getOrderStatus(order) === 'completed'
    ).length,

    rush: orders.filter(
      (order) => getPriority(order) === 'Rush'
    ).length,

    normal: orders.filter(
      (order) => getPriority(order) === 'Normal'
    ).length,

    queueLength: orders.filter((order) =>
      ['waiting', 'processing'].includes(getOrderStatus(order))
    ).length,
  };
}

function getOrdersForLine(orders, lineName) {
  return orders.filter((order) => {
    const line = normalizeLine(getOrderLine(order));
    const selectedLine = normalizeLine(lineName);

    return line === selectedLine;
  });
}

/* =====================================================
   LINE PRODUCTION METRICS
===================================================== */

function getLineMetrics(lineData, orders) {
  const metrics =
    lineData?.metrics ||
    lineData?.summary ||
    lineData ||
    {};

  const counts = calculateOrderCounts(orders);

  return {
    boxesProduced:
      metrics.totalBoxesProduced ??
      metrics.boxesProduced ??
      metrics.producedBoxes ??
      null,

    productionRate:
      metrics.productionRate ??
      metrics.boxesPerMinute ??
      null,

    queueLength:
      metrics.queueLength ??
      counts.queueLength,

    waitingOrders:
      metrics.waitingOrders ??
      metrics.pendingOrders ??
      counts.waiting,

    processingOrders:
      metrics.processingOrders ??
      counts.processing,

    completedOrders:
      metrics.completedOrders ??
      counts.completed,

    rushOrders:
      metrics.rushOrders ??
      counts.rush,

    normalOrders:
      metrics.normalOrders ??
      counts.normal,
  };
}

/* =====================================================
   LINE VIEW
===================================================== */

function LineView({
  lineName,
  lineData,
  orders,
  onNavigate,
}) {
  const [dateRange, setDateRange] = useState('7d');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const lineOrders = useMemo(
    () => getOrdersForLine(orders, lineName),
    [orders, lineName]
  );

  const metrics = useMemo(
    () => getLineMetrics(lineData, lineOrders),
    [lineData, lineOrders]
  );

  const bounds = useMemo(
    () => getDateRangeBounds(dateRange, dateFrom, dateTo),
    [dateRange, dateFrom, dateTo]
  );

  const history = useMemo(
    () => normalizeHistory(getProductionHistory(lineData), bounds),
    [lineData, bounds]
  );

  const delays = lineData?.delays || [];
  const bottlenecks = lineData?.bottlenecks || [];

  return (
    <div className="db-tab-content">

      {/* Date filters */}
      <DateRangeFilter
        range={dateRange}
        setRange={setDateRange}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
      />

      {/* Production metrics */}
      <div className="content-panel" style={{ marginTop: '20px' }}>
        <div className="section-heading">
          <h2 className="section-title">
            {lineName} — Production Metrics
          </h2>

          <p className="section-description">
            Current production output, throughput and order distribution.
          </p>
        </div>

        <div className="db-production-metrics-grid">
          <MetricCard
            label="Total Boxes Produced"
            value={formatMetric(metrics.boxesProduced)}
            accent="orange"
          />

          <MetricCard
            label="Production Rate"
            value={formatMetric(metrics.productionRate)}
            description="As reported by the production system"
            accent="blue"
          />

          <MetricCard
            label="Queue Length"
            value={formatMetric(metrics.queueLength)}
            accent="yellow"
          />

          <MetricCard
            label="Waiting Orders"
            value={formatMetric(metrics.waitingOrders)}
            accent="yellow"
          />

          <MetricCard
            label="Processing Orders"
            value={formatMetric(metrics.processingOrders)}
            accent="blue"
          />

          <MetricCard
            label="Completed Orders"
            value={formatMetric(metrics.completedOrders)}
            accent="green"
          />

          <MetricCard
            label="Rush Orders"
            value={formatMetric(metrics.rushOrders)}
            accent="pink"
          />

          <MetricCard
            label="Normal Orders"
            value={formatMetric(metrics.normalOrders)}
            accent="orange"
          />
        </div>
      </div>

      {/* Production progress */}
      <div className="content-panel" style={{ marginTop: '20px' }}>
        <div className="section-heading">
          <h2 className="section-title">
            {lineName} — Production Progress
          </h2>

          <p className="section-description">
            Historical production output over the selected period.
          </p>
        </div>

        <ProductionTrendChart data={history} />
      </div>

      {/* Order queue */}
      <div className="content-panel" style={{ marginTop: '20px' }}>
        <div className="section-heading">
          <h2 className="section-title">
            {lineName} — Order Queue &amp; Statuses
          </h2>

          <p className="section-description">
            Current waiting, processing, completed, cancelled and failed orders.
          </p>
        </div>

        <OrderQueue
          orders={lineOrders}
          onSelectOrder={setSelectedOrder}
        />
      </div>

      {/* Delays and bottlenecks */}
      <div className="content-panel" style={{ marginTop: '20px' }}>
        <div className="section-heading">
          <h2 className="section-title">
            {lineName} — Delays &amp; Bottlenecks
          </h2>

          <p className="section-description">
            Recorded delays and production constraints for this line.
          </p>
        </div>

        <DelayList
          delays={delays}
          bottlenecks={bottlenecks}
        />
      </div>

      {/* Production history */}
      <div className="content-panel" style={{ marginTop: '20px' }}>
        <div className="section-heading">
          <h2 className="section-title">
            {lineName} — Production History
          </h2>

          <p className="section-description">
            Historical output records filtered by the selected date range.
          </p>
        </div>

        <ProductionHistoryTable data={history} />
      </div>

      {/* Order details */}
      <OrderDetailsModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onNavigate={onNavigate}
      />
    </div>
  );
}

/* =====================================================
   COMBINED OVERVIEW
===================================================== */

function CombinedView({
  lineAData,
  lineBData,
  orders,
  onNavigate,
}) {
  const [dateRange, setDateRange] = useState('7d');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const lineAOrders = useMemo(
    () => getOrdersForLine(orders, 'Line A'),
    [orders]
  );

  const lineBOrders = useMemo(
    () => getOrdersForLine(orders, 'Line B'),
    [orders]
  );

  const metricsA = useMemo(
    () => getLineMetrics(lineAData, lineAOrders),
    [lineAData, lineAOrders]
  );

  const metricsB = useMemo(
    () => getLineMetrics(lineBData, lineBOrders),
    [lineBData, lineBOrders]
  );

  const allOrders = useMemo(
    () => [...lineAOrders, ...lineBOrders],
    [lineAOrders, lineBOrders]
  );

  const combinedCounts = useMemo(
    () => calculateOrderCounts(allOrders),
    [allOrders]
  );

  const combinedBoxes = combineMetrics(
    metricsA.boxesProduced,
    metricsB.boxesProduced
  );

  const combinedRate = combineMetrics(
    metricsA.productionRate,
    metricsB.productionRate
  );

  const combinedQueueLength = Number(metricsA.queueLength) +
    Number(metricsB.queueLength);

  const bounds = useMemo(
    () => getDateRangeBounds(dateRange, dateFrom, dateTo),
    [dateRange, dateFrom, dateTo]
  );

  const historyA = useMemo(
    () => getProductionHistory(lineAData),
    [lineAData]
  );

  const historyB = useMemo(
    () => getProductionHistory(lineBData),
    [lineBData]
  );

  const combinedHistory = useMemo(
    () => combineProductionHistory(historyA, historyB, bounds),
    [historyA, historyB, bounds]
  );

  const latestLineAHistory = useMemo(
    () => normalizeHistory(historyA, bounds),
    [historyA, bounds]
  );

  const latestLineBHistory = useMemo(
    () => normalizeHistory(historyB, bounds),
    [historyB, bounds]
  );

  return (
    <div className="db-tab-content">

      {/* Date filters */}
      <DateRangeFilter
        range={dateRange}
        setRange={setDateRange}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
      />

      {/* Separate line contributions */}
      <div className="db-grid db-grid--2" style={{ marginTop: '20px' }}>
        <div className="content-panel">
          <div className="section-heading">
            <h2 className="section-title">
              Line A Contribution
            </h2>
          </div>

          <div className="db-production-line-summary">
            <MetricCard
              label="Boxes Produced"
              value={formatMetric(metricsA.boxesProduced)}
              accent="orange"
            />

            <MetricCard
              label="Production Rate"
              value={formatMetric(metricsA.productionRate)}
              accent="blue"
            />

            <MetricCard
              label="Queue Length"
              value={formatMetric(metricsA.queueLength)}
              accent="yellow"
            />
          </div>
        </div>

        <div className="content-panel">
          <div className="section-heading">
            <h2 className="section-title">
              Line B Contribution
            </h2>
          </div>

          <div className="db-production-line-summary">
            <MetricCard
              label="Boxes Produced"
              value={formatMetric(metricsB.boxesProduced)}
              accent="orange"
            />

            <MetricCard
              label="Production Rate"
              value={formatMetric(metricsB.productionRate)}
              accent="blue"
            />

            <MetricCard
              label="Queue Length"
              value={formatMetric(metricsB.queueLength)}
              accent="yellow"
            />
          </div>
        </div>
      </div>

      {/* Combined metrics */}
      <div className="content-panel" style={{ marginTop: '20px' }}>
        <div className="section-heading">
          <h2 className="section-title">
            Combined Production Information
          </h2>

          <p className="section-description">
            Combined output across both independent production lines.
          </p>
        </div>

        <div className="db-production-metrics-grid">
          <MetricCard
            label="Total Boxes Produced"
            value={formatMetric(combinedBoxes)}
            accent="orange"
          />

          <MetricCard
            label="Combined Production Rate"
            value={formatMetric(combinedRate)}
            accent="blue"
          />

          <MetricCard
            label="Total Queue Length"
            value={formatMetric(combinedQueueLength)}
            accent="yellow"
          />

          <MetricCard
            label="Waiting Orders"
            value={combinedCounts.waiting}
            accent="yellow"
          />

          <MetricCard
            label="Processing Orders"
            value={combinedCounts.processing}
            accent="blue"
          />

          <MetricCard
            label="Completed Orders"
            value={combinedCounts.completed}
            accent="green"
          />

          <MetricCard
            label="Rush Orders"
            value={combinedCounts.rush}
            accent="pink"
          />

          <MetricCard
            label="Normal Orders"
            value={combinedCounts.normal}
            accent="orange"
          />
        </div>
      </div>

      {/* Combined production chart */}
      <div className="content-panel" style={{ marginTop: '20px' }}>
        <div className="section-heading">
          <h2 className="section-title">
            Production Progress — Both Lines
          </h2>

          <p className="section-description">
            Line A and Line B output are displayed separately for comparison.
          </p>
        </div>

        <ProductionTrendChart
          data={combinedHistory}
          combined
        />
      </div>

      {/* Combined history */}
      <div className="db-grid db-grid--2" style={{ marginTop: '20px' }}>
        <div className="content-panel">
          <div className="section-heading">
            <h2 className="section-title">
              Line A — Production History
            </h2>
          </div>

          <ProductionHistoryTable
            data={latestLineAHistory}
          />
        </div>

        <div className="content-panel">
          <div className="section-heading">
            <h2 className="section-title">
              Line B — Production History
            </h2>
          </div>

          <ProductionHistoryTable
            data={latestLineBHistory}
          />
        </div>
      </div>

      {/* Combined order queue */}
      <div className="content-panel" style={{ marginTop: '20px' }}>
        <div className="section-heading">
          <h2 className="section-title">
            Combined Order Queue
          </h2>

          <p className="section-description">
            All orders with their respective production-line assignments.
          </p>
        </div>

        <OrderQueue
          orders={allOrders}
          onSelectOrder={setSelectedOrder}
          showLine
        />
      </div>

      {/* Order detail popup */}
      <OrderDetailsModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onNavigate={onNavigate}
      />
    </div>
  );
}

/* =====================================================
   PRODUCTION MONITORING PAGE
===================================================== */

/**
 * ProductionMonitoringPage — Section B.
 *
 * Props:
 *
 * orders:
 *   Actual customer order records from the backend.
 *
 * lineAData:
 *   Line A production metrics, history, delays and bottlenecks.
 *
 * lineBData:
 *   Line B production metrics, history, delays and bottlenecks.
 *
 * onNavigate:
 *   Allows the order popup to open the corresponding Decision Reports page.
 *
 * Example lineData structure:
 *
 * {
 *   metrics: {
 *     totalBoxesProduced: 120,
 *     productionRate: { value: 5, unit: 'boxes/min' },
 *     queueLength: 4
 *   },
 *   productionHistory: [
 *     {
 *       timestamp: '2026-11-07T08:00:00',
 *       boxesProduced: 10
 *     }
 *   ],
 *   delays: [],
 *   bottlenecks: []
 * }
 *
 * The example is a schema illustration only.
 * No example data is generated by this component.
 */
function ProductionMonitoringPage({
  orders = [],
  lineAData = {},
  lineBData = {},
  onNavigate,
}) {
  const [activeTab, setActiveTab] = useState('line-a');

  const safeOrders = Array.isArray(orders) ? orders : [];

  return (
    <div className="db-page">
      <PageHeader
        eyebrow="Production"
        title="Production Monitoring"
        description="Monitor production output, order queues, throughput, delays and historical performance across both independent production lines."
      />

      <InternalTabs
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === 'line-a' && (
        <LineView
          lineName="Line A"
          lineData={lineAData}
          orders={safeOrders}
          onNavigate={onNavigate}
        />
      )}

      {activeTab === 'line-b' && (
        <LineView
          lineName="Line B"
          lineData={lineBData}
          orders={safeOrders}
          onNavigate={onNavigate}
        />
      )}

      {activeTab === 'combined' && (
        <CombinedView
          lineAData={lineAData}
          lineBData={lineBData}
          orders={safeOrders}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
}

export default ProductionMonitoringPage;
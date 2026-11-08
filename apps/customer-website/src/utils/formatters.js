/**
 * Utility functions for currency, dates, duration, and IDs.
 */

export function formatCurrency(amount) {
  const numeric = Number(amount) || 0;
  return `₹${numeric.toLocaleString('en-IN')}`;
}

export function formatDateTime(dateInput) {
  if (!dateInput) return '—';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return String(dateInput);

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date);
}

export function formatTimeOnly(dateInput) {
  if (!dateInput) return '—';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return String(dateInput);

  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date);
}

export function formatSecondsToCountdown(secondsRemaining) {
  if (secondsRemaining <= 0) return '00:00';
  const mins = Math.floor(secondsRemaining / 60);
  const secs = Math.floor(secondsRemaining % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Generates an Order ID in the exact format: ORD_2026_000001
 */
export function formatOrderId(seq, year = new Date().getFullYear()) {
  const num = parseInt(seq, 10) || 1;
  return `ORD_${year}_${String(num).padStart(6, '0')}`;
}

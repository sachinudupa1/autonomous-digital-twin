function ConfirmationModal({
  conditions,
  source,
  isRunning = false,
  onConfirm,
  onCancel,
}) {
  if (!conditions) return null;

  const displayValue = (value) => {
    return value === '' || value === null || value === undefined
      ? '—'
      : value;
  };

  const summaryItems = [
    {
      label: 'Temperature',
      value: displayValue(conditions.temperature),
      unit: '°C',
    },
    {
      label: 'Vibration',
      value: displayValue(conditions.vibration),
      unit: null,
    },
    {
      label: 'Operating Duration',
      value: displayValue(conditions.operatingDuration),
      unit: null,
    },
    {
      label: 'Machine Wear',
      value: displayValue(conditions.machineWear),
      unit: '%',
    },
  ];

  return (
    <div
      className="hc-modal-overlay"
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-description"
        className="hc-confirmation-modal"
      >
        {/* Modal heading */}
        <div className="hc-modal-heading">
          <div
            className="hc-modal-heading__icon"
            aria-hidden="true"
          >
            <svg
              width="21"
              height="21"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="m5 12.5 4.5 4.5L19 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h2 id="confirm-modal-title">
            Apply Conditions?
          </h2>

          <p id="confirm-modal-description">
            Review the following operating conditions before applying
            them to the packaging line.
          </p>
        </div>

        {/* Input source */}
        <div className="hc-modal-source">
          <span className="hc-modal-source__label">
            Input Source
          </span>

          <span className="hc-modal-source__value">
            {source}
          </span>
        </div>

        {/* Conditions summary */}
        <div className="hc-modal-summary">
          {summaryItems.map((item, index) => (
            <div
              key={item.label}
              className={`hc-modal-summary__row ${
                index === summaryItems.length - 1
                  ? 'hc-modal-summary__row--last'
                  : ''
              }`}
            >
              <span className="hc-modal-summary__label">
                {item.label}
              </span>

              <span className="hc-modal-summary__value">
                {item.value}
                {item.unit && item.value !== '—'
                  ? ` ${item.unit}`
                  : ''}
              </span>
            </div>
          ))}
        </div>

        {/* Packaging run warning */}
        {isRunning && (
          <div
            className="hc-modal-warning"
            role="alert"
          >
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M12 3 2.8 19h18.4L12 3Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
              <path
                d="M12 9v4m0 3h.01"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>

            <span>
              Packaging is currently running. These changes may affect
              the ongoing run.
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="hc-modal-actions">
          <button
            type="button"
            onClick={onCancel}
            className="secondary-button"
          >
            Go Back
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="primary-button"
          >
            Confirm &amp; Apply
          </button>
        </div>
      </section>
    </div>
  );
}

export default ConfirmationModal;
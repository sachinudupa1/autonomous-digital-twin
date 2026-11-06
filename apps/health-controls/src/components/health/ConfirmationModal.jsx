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
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        background: 'rgba(5, 12, 24, 0.58)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-description"
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '460px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '27px',
          background: 'var(--surface-solid)',
          borderRadius: '21px',
          animation: 'modal-appear 0.2s ease-out',
        }}
      >
        {/* Modal heading */}
        <div style={{ marginBottom: '23px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '43px',
              height: '43px',
              marginBottom: '16px',
              color: 'var(--accent)',
              background: 'var(--accent-soft)',
              borderRadius: '13px',
              fontSize: '21px',
            }}
            aria-hidden="true"
          >
            ✓
          </div>

          <h2
            id="confirm-modal-title"
            style={{
              margin: 0,
              color: 'var(--text-primary)',
              fontSize: '21px',
              fontWeight: 750,
              letterSpacing: '-0.5px',
            }}
          >
            Apply Conditions?
          </h2>

          <p
            id="confirm-modal-description"
            style={{
              margin: '7px 0 0',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              lineHeight: 1.6,
            }}
          >
            Review the following operating conditions before applying
            them to the packaging line.
          </p>
        </div>

        {/* Source */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '12px 14px',
            marginBottom: '13px',
            background: 'var(--surface-hover)',
            border: '1px solid var(--border)',
            borderRadius: '11px',
          }}
        >
          <span
            style={{
              color: 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            Input Source
          </span>

          <span
            style={{
              padding: '5px 10px',
              color: 'var(--accent)',
              background: 'var(--accent-soft)',
              borderRadius: '7px',
              fontSize: '11px',
              fontWeight: 700,
            }}
          >
            {source}
          </span>
        </div>

        {/* Conditions summary */}
        <div
          style={{
            padding: '5px 15px',
            background: 'var(--surface-hover)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
          }}
        >
          {summaryItems.map((item, index) => (
            <div
              key={item.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '15px',
                padding: '13px 0',
                borderBottom:
                  index !== summaryItems.length - 1
                    ? '1px solid var(--border)'
                    : 'none',
              }}
            >
              <span
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                }}
              >
                {item.label}
              </span>

              <span
                style={{
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: 700,
                  textAlign: 'right',
                }}
              >
                {item.value}
                {item.unit && item.value !== '—' ? ` ${item.unit}` : ''}
              </span>
            </div>
          ))}
        </div>

        {/* Packaging run warning */}
        {isRunning && (
          <div
            role="alert"
            style={{
              display: 'flex',
              gap: '11px',
              padding: '13px',
              marginTop: '16px',
              color: '#B7791F',
              background: 'rgba(255, 212, 0, 0.10)',
              border: '1px solid rgba(255, 212, 0, 0.45)',
              borderRadius: '11px',
              fontSize: '12px',
              lineHeight: 1.6,
            }}
          >
            <span aria-hidden="true">⚠</span>

            <span>
              Packaging is currently running. These changes may affect
              the ongoing run.
            </span>
          </div>
        )}

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            flexWrap: 'wrap',
            gap: '10px',
            marginTop: '23px',
          }}
        >
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
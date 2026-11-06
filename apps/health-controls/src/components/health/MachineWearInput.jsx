function MachineWearInput({ value, onChange, readOnly = false }) {
  const numericValue =
    value === '' || value === null || value === undefined
      ? 0
      : Number(value);

  // Keep the slider within its visual range without changing the
  // actual entered value in the parent component.
  const sliderValue = Number.isFinite(numericValue)
    ? Math.min(100, Math.max(0, numericValue))
    : 0;

  const handleNumberChange = (event) => {
    if (!readOnly) {
      onChange?.(event.target.value);
    }
  };

  const handleSliderChange = (event) => {
    if (!readOnly) {
      onChange?.(event.target.value);
    }
  };

  return (
    <div className="form-field">
      {/* Machine Wear label and outline illustration */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '11px',
        }}
      >
        <div
          aria-hidden="true"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '38px',
            height: '38px',
            flexShrink: 0,
            color: '#FF7900',
            background: 'var(--surface-hover)',
            border: '1px solid var(--border)',
            borderRadius: '11px',
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width="21"
            height="21"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3.2" />
            <path
              d="m19.4 15 .1.1a1.7 1.7 0 0 1-2.4 2.4l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a1.7 1.7 0 0 1-3.4 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a1.7 1.7 0 0 1-2.4-2.4l.1-.1a1.7 1.7 0 0 0-1.2-2.9H4a1.7 1.7 0 0 1 0-3.4h.2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a1.7 1.7 0 0 1 2.4-2.4l.1.1a1.7 1.7 0 0 0 2.9-1.2V2.9a1.7 1.7 0 0 1 3.4 0v.2a1.7 1.7 0 0 0 2.9 1.2l.1-.1a1.7 1.7 0 0 1 2.4 2.4l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a1.7 1.7 0 0 1 0 3.4h-.2a1.7 1.7 0 0 0-1.2 2.9Z"
            />
          </svg>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
          }}
        >
          <label
            htmlFor="machine-wear-number"
            className="form-label"
          >
            Machine Wear
            <span
              style={{
                marginLeft: '6px',
                color: 'var(--text-secondary)',
                fontWeight: 400,
              }}
            >
              (0–100%)
            </span>
          </label>

          <span className="form-hint">
            Represents how worn out the packaging line is.
          </span>
        </div>
      </div>

      {/* Number input and percentage */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <input
            id="machine-wear-number"
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            step={1}
            value={value ?? ''}
            onChange={handleNumberChange}
            readOnly={readOnly}
            placeholder="0"
            className="form-input"
            aria-label="Machine Wear percentage"
            aria-describedby="machine-wear-range"
            style={{
              textAlign: 'center',
              cursor: readOnly ? 'default' : 'text',
            }}
          />
        </div>

        <span
          style={{
            color: 'var(--text-secondary)',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          %
        </span>
      </div>

      {/* Slider */}
      <div style={{ marginTop: '3px' }}>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={sliderValue}
          onChange={handleSliderChange}
          disabled={readOnly}
          aria-label="Machine Wear slider"
          aria-valuetext={`${sliderValue}%`}
          style={{
            width: '100%',
            accentColor: 'var(--accent)',
            cursor: readOnly ? 'default' : 'pointer',
          }}
        />

        <div
          id="machine-wear-range"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            color: 'var(--text-muted)',
            fontSize: '11px',
          }}
        >
          <span>0% · New</span>
          <span>100% · Fully worn</span>
        </div>
      </div>
    </div>
  );
}

export default MachineWearInput;
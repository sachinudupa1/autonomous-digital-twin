/**
 * ParameterInput
 *
 * Styled number input for a single health parameter.
 *
 * Includes a small outline illustration corresponding to the parameter.
 *
 * Exact ranges and units will be configured after coordination
 * with Teammate 5. No unconfirmed validation is applied.
 */

const PARAMETER_ICONS = {
  temperature: {
    color: '#FF4F9A',
    svg: (
      <>
        <path
          d="M14 14.5V5a2 2 0 0 0-4 0v9.5a4 4 0 1 0 4 0Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 11v7"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </>
    ),
  },

  vibration: {
    color: '#1677FF',
    svg: (
      <>
        <path
          d="M3 12h2l2-5 4 10 3-10 3 10 2-5h2"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
  },

  'operating-duration': {
    color: '#16A34A',
    svg: (
      <>
        <circle
          cx="12"
          cy="12"
          r="8.5"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path
          d="M12 7v5l3.5 2"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
  },
};

function ParameterInput({
  label,
  unit,
  value,
  onChange,
  readOnly = false,
  placeholder = 'Enter value',
}) {
  const inputId = `parameter-${label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')}`;

  const parameterKey = label
    .toLowerCase()
    .replace(/\s+/g, '-');

  const parameterIcon = PARAMETER_ICONS[parameterKey];

  return (
    <div className="form-field">
      {/* Parameter label and outline illustration */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '11px',
        }}
      >
        {parameterIcon && (
          <div
            aria-hidden="true"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '38px',
              height: '38px',
              flexShrink: 0,
              color: parameterIcon.color,
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
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {parameterIcon.svg}
            </svg>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
          }}
        >
          <label htmlFor={inputId} className="form-label">
            {label}
          </label>

          <span
            style={{
              color: 'var(--text-secondary)',
              fontSize: '11px',
              fontWeight: 400,
            }}
          >
            {unit || 'Unit to be confirmed'}
          </span>
        </div>
      </div>

      {/* Number input */}
      <input
        id={inputId}
        type="number"
        inputMode="decimal"
        step="any"
        value={value ?? ''}
        onChange={
          readOnly
            ? undefined
            : (event) => onChange?.(event.target.value)
        }
        readOnly={readOnly}
        placeholder={placeholder}
        className="form-input"
        aria-label={`${label}${unit ? ` in ${unit}` : ''}`}
        style={{
          cursor: readOnly ? 'default' : 'text',
          opacity: readOnly ? 0.8 : 1,
        }}
      />

      {/* Accepted range information */}
      <span className="form-hint">
        Accepted range: To be confirmed
      </span>
    </div>
  );
}

export default ParameterInput;
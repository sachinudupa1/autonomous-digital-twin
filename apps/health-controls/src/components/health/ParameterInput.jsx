/**
 * ParameterInput
 *
 * Styled number input for a single health parameter.
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
      <path
        d="M3 12h2l2-5 4 10 3-10 3 10 2-5h2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
    <div className="form-field hc-parameter-field">
      {/* Parameter label and outline illustration */}
      <div className="hc-parameter-heading">
        {parameterIcon && (
          <div
            className={`hc-parameter-icon hc-parameter-icon--${parameterKey}`}
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 24 24"
              width="21"
              height="21"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {parameterIcon.svg}
            </svg>
          </div>
        )}

        <div className="hc-parameter-copy">
          <label htmlFor={inputId} className="form-label">
            {label}
          </label>

          <span className="hc-parameter-unit">
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
        className={`form-input hc-parameter-input ${
          readOnly ? 'hc-parameter-input--readonly' : ''
        }`}
        aria-label={`${label}${unit ? ` in ${unit}` : ''}`}
      />

      {/* Accepted range information */}
      <span className="form-hint">
        Accepted range: To be confirmed
      </span>
    </div>
  );
}

export default ParameterInput;
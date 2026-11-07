function MachineWearInput({ value, onChange, readOnly = false }) {
  const numericValue =
    value === '' || value === null || value === undefined
      ? 0
      : Number(value);

  // Keep the slider within its visual range without changing
  // the actual entered value in the parent component.
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
    <div className="form-field hc-parameter-field hc-machine-wear">
      {/* Machine Wear label and outline illustration */}
      <div className="hc-parameter-heading">
        <div
          className="hc-parameter-icon hc-parameter-icon--wear"
          aria-hidden="true"
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

        <div className="hc-parameter-copy">
          <label
            htmlFor="machine-wear-number"
            className="form-label"
          >
            Machine Wear
            <span className="hc-machine-wear__range-label">
              (0–100%)
            </span>
          </label>

          <span className="form-hint">
            Represents how worn out the packaging line is.
          </span>
        </div>
      </div>

      {/* Number input and percentage */}
      <div className="hc-machine-wear__number-row">
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
          className={`form-input hc-parameter-input hc-machine-wear__number ${
            readOnly ? 'hc-parameter-input--readonly' : ''
          }`}
          aria-label="Machine Wear percentage"
          aria-describedby="machine-wear-range"
        />

        <span className="hc-machine-wear__unit">%</span>
      </div>

      {/* Slider */}
      <div className="hc-machine-wear__slider-wrap">
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
          className="hc-machine-wear__slider"
        />

        <div
          id="machine-wear-range"
          className="hc-machine-wear__scale"
        >
          <span>0% · New</span>
          <span>100% · Fully worn</span>
        </div>
      </div>
    </div>
  );
}

export default MachineWearInput;
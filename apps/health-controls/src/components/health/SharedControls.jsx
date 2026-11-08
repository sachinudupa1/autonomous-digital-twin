function SharedControls({ onReset, onApply, isApplying = false }) {
  return (
    <div className="hc-shared-controls__actions">
      <button
        type="button"
        onClick={onReset}
        disabled={isApplying}
        className="secondary-button hc-reset-button"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3 12a9 9 0 1 0 2.64-6.36L3 8"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M3 3v5h5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        Reset to Normal
      </button>

      <button
        type="button"
        onClick={onApply}
        disabled={isApplying}
        className="primary-button hc-apply-button"
      >
        {isApplying ? (
          'Applying...'
        ) : (
          <>
            Apply Conditions

            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </>
        )}
      </button>
    </div>
  );
}

export default SharedControls;
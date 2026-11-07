function HealthResult({ score, classification }) {
  const isCalculated =
    score !== null &&
    score !== undefined &&
    classification !== null &&
    classification !== undefined;

  const hasValidScore =
    typeof score === 'number' &&
    Number.isFinite(score) &&
    score >= 0 &&
    score <= 100;

  return (
    <section
      className="hc-health-result-card"
      aria-label="Calculated health result"
    >
      <div className="hc-health-result-card__header">
        <div>
          <h3 className="hc-health-result-card__title">
            Health Result
          </h3>

          <p className="hc-health-result-card__description">
            Calculated packaging line condition
          </p>
        </div>

        <span
          className="hc-health-result-card__icon"
          aria-hidden="true"
        >
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M3 12h4l3-7 4 14 3-7h4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>

      <div className="hc-health-result-grid">
        {/* Health score */}
        <div className="hc-health-metric">
          <p className="hc-health-metric__label">
            HEALTH SCORE
          </p>

          <div className="hc-health-metric__score">
            <span className="hc-health-metric__value">
              {hasValidScore ? score : '—'}
            </span>

            <span className="hc-health-metric__unit">
              / 100
            </span>
          </div>
        </div>

        {/* Health classification */}
        <div className="hc-health-metric">
          <p className="hc-health-metric__label">
            CLASSIFICATION
          </p>

          <span className="hc-health-classification">
            {isCalculated ? classification : 'Awaiting result'}
          </span>
        </div>
      </div>

      {!isCalculated && (
        <p className="hc-health-result-card__pending">
          Health calculation will be displayed here once the health
          assessment service is connected.
        </p>
      )}
    </section>
  );
}

export default HealthResult;
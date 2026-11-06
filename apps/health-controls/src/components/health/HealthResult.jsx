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
      aria-label="Calculated health result"
      style={{
        padding: '20px',
        background: 'var(--surface-hover)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '18px',
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              color: 'var(--text-primary)',
              fontSize: '15px',
              fontWeight: 750,
            }}
          >
            Health Result
          </h3>

          <p
            style={{
              margin: '5px 0 0',
              color: 'var(--text-secondary)',
              fontSize: '12px',
            }}
          >
            Calculated packaging line condition
          </p>
        </div>

        <span
          aria-hidden="true"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '34px',
            height: '34px',
            flexShrink: 0,
            color: 'var(--accent)',
            background: 'var(--accent-soft)',
            borderRadius: '11px',
            fontSize: '17px',
          }}
        >
          ◈
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '14px',
        }}
      >
        {/* Health score */}
        <div
          style={{
            padding: '15px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
          }}
        >
          <p
            style={{
              margin: '0 0 9px',
              color: 'var(--text-secondary)',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            HEALTH SCORE
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '5px',
            }}
          >
            <span
              style={{
                color: 'var(--text-primary)',
                fontSize: '30px',
                fontWeight: 800,
                letterSpacing: '-1px',
                lineHeight: 1,
              }}
            >
              {hasValidScore ? score : '—'}
            </span>

            <span
              style={{
                color: 'var(--text-muted)',
                fontSize: '11px',
              }}
            >
              / 100
            </span>
          </div>
        </div>

        {/* Health classification */}
        <div
          style={{
            padding: '15px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            minWidth: 0,
          }}
        >
          <p
            style={{
              margin: '0 0 9px',
              color: 'var(--text-secondary)',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            CLASSIFICATION
          </p>

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              minHeight: '29px',
              maxWidth: '100%',
              padding: '5px 10px',
              color: 'var(--text-secondary)',
              background: 'var(--surface-hover)',
              border: '1px solid var(--border-strong)',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              overflowWrap: 'anywhere',
            }}
          >
            {isCalculated ? classification : 'Awaiting result'}
          </span>
        </div>
      </div>

      {!isCalculated && (
        <p
          style={{
            margin: '15px 0 0',
            color: 'var(--text-muted)',
            fontSize: '11px',
            lineHeight: 1.6,
          }}
        >
          Health calculation will be displayed here once the health
          assessment service is connected.
        </p>
      )}
    </section>
  );
}

export default HealthResult;
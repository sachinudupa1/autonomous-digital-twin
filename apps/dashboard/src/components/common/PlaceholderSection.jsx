/**
 * PlaceholderSection — a visual placeholder for sections not yet connected.
 *
 * Props:
 *   title   — section heading
 *   height  — optional min-height (default '120px')
 *   note    — optional sub-text (default 'Waiting for data integration')
 */
function PlaceholderSection({ title, height = '120px', note = 'Waiting for data integration' }) {
  return (
    <div className="db-placeholder" style={{ minHeight: height }}>
      {title && <span className="db-placeholder__label">{title}</span>}
      <span className="db-placeholder__note">{note}</span>
    </div>
  );
}

export default PlaceholderSection;

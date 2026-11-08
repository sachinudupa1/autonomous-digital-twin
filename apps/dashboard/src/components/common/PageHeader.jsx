/**
 * PageHeader — standard page-level heading.
 *
 * Props:
 *   eyebrow      — small label above the title
 *   title        — page title
 *   description  — optional subtitle
 */
function PageHeader({ eyebrow, title, description }) {
  return (
    <div className="page-heading">
      {eyebrow && <p className="page-eyebrow">{eyebrow}</p>}
      <h1 className="page-title">{title}</h1>
      {description && <p className="page-description">{description}</p>}
    </div>
  );
}

export default PageHeader;

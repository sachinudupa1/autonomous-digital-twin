import { useEffect, useId, useRef } from 'react';

/**
 * Modal — reusable accessible popup.
 *
 * Props:
 *   open       — boolean
 *   onClose    — () => void
 *   title      — string header title
 *   children   — modal body content
 *   wide       — boolean, uses wider modal width when true
 *
 * Features:
 *   - Escape key closes the popup.
 *   - Backdrop click closes the popup.
 *   - Keyboard focus remains inside the popup.
 *   - Focus returns to the previously focused element on close.
 *   - Background scrolling is disabled while open.
 */
function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}) {
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previousFocusRef = useRef(null);

  const titleId = useId();

  useEffect(() => {
    if (!open) return undefined;

    // Remember which element opened the popup.
    previousFocusRef.current = document.activeElement;

    // Prevent background scrolling.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus the close button when the popup opens.
    closeButtonRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose?.();
        return;
      }

      // Keep keyboard navigation inside the modal.
      if (event.key === 'Tab') {
        const dialog = dialogRef.current;

        if (!dialog) return;

        const focusableElements = dialog.querySelectorAll(
          [
            'a[href]',
            'button:not(:disabled)',
            'input:not(:disabled)',
            'select:not(:disabled)',
            'textarea:not(:disabled)',
            '[tabindex]:not([tabindex="-1"])',
          ].join(',')
        );

        const visibleElements = Array.from(focusableElements).filter(
          (element) =>
            element.getAttribute('aria-hidden') !== 'true' &&
            element.getClientRects().length > 0
        );

        if (visibleElements.length === 0) {
          event.preventDefault();
          closeButtonRef.current?.focus();
          return;
        }

        const firstElement = visibleElements[0];
        const lastElement = visibleElements[visibleElements.length - 1];

        if (
          event.shiftKey &&
          document.activeElement === firstElement
        ) {
          event.preventDefault();
          lastElement.focus();
        } else if (
          !event.shiftKey &&
          document.activeElement === lastElement
        ) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      document.body.style.overflow = previousOverflow;

      // Return focus to the element that opened the popup.
      if (
        previousFocusRef.current &&
        typeof previousFocusRef.current.focus === 'function'
      ) {
        previousFocusRef.current.focus();
      }
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="db-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className={`db-modal${wide ? ' db-modal--wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="db-modal__header">
          <h2
            id={titleId}
            className="db-modal__title"
          >
            {title}
          </h2>

          <button
            ref={closeButtonRef}
            type="button"
            className="db-modal__close"
            onClick={onClose}
            aria-label="Close popup"
            title="Close"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              width="18"
              height="18"
              aria-hidden="true"
            >
              <path
                d="M18 6 6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="db-modal__body">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Modal;
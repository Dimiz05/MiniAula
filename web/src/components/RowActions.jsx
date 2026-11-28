import { useEffect, useId, useRef, useState } from 'react';
import Icon from './Icon.jsx';

export default function RowActions({ label, primary, items = [], disabled = false }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return undefined;

    function closeOnOutside(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }

    function closeOnEscape(event) {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener('pointerdown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  if (items.length === 0) {
    return <div className="flex shrink-0 items-center justify-end gap-1">{primary}</div>;
  }

  return (
    <div ref={rootRef} className="relative flex shrink-0 items-center justify-end gap-1">
      {primary}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        disabled={disabled}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={label}
        title="Más acciones"
        className="flex h-11 w-11 items-center justify-center rounded-control text-on-surface-variant transition-colors hover:bg-surface-variant hover:text-secondary disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Icon name="more_vert" className="text-[20px]" />
      </button>

      {open && (
        <div
          id={panelId}
          className="absolute right-0 top-full z-20 mt-1 w-44 rounded-control border border-outline bg-surface p-1 shadow-modal"
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                triggerRef.current?.focus();
                item.onClick();
              }}
              className={`flex min-h-11 w-full items-center gap-2 rounded px-2.5 text-left text-label-md transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                item.danger
                  ? 'text-error hover:bg-error-light'
                  : 'text-secondary hover:bg-surface-variant'
              }`}
            >
              <Icon name={item.icon} className="text-[18px]" />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

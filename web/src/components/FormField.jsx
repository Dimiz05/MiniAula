import { useId, useState } from 'react';
import Icon from './Icon.jsx';

export default function FormField({
  id,
  label,
  type = 'text',
  icon,
  error,
  hint,
  revealable = false,
  className = '',
  inputClassName = '',
  required = false,
  ...inputProps
}) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const [visible, setVisible] = useState(false);
  const resolvedType = revealable && visible ? 'text' : type;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;
  const describedBy = [error ? errorId : null, hint && !error ? hintId : null]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className}>
      <label
        htmlFor={fieldId}
        className="mb-1.5 block text-xs font-semibold text-secondary"
      >
        {label}
        {required && <span className="ml-0.5 text-error">*</span>}
      </label>

      <div className="relative flex items-center">
        {icon && (
          <Icon
            name={icon}
            className="pointer-events-none absolute left-3 text-[20px] text-on-surface-variant"
          />
        )}

        <input
          id={fieldId}
          type={resolvedType}
          required={required}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy || undefined}
          className={`w-full rounded-[10px] border bg-surface py-2.5 text-sm text-secondary placeholder:text-on-surface-variant/70 transition-colors focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:bg-surface-variant ${
            icon ? 'pl-10' : 'pl-3.5'
          } ${revealable ? 'pr-11' : 'pr-3.5'} ${
            error
              ? 'border-error focus:border-error focus:ring-error'
              : 'border-outline focus:border-primary focus:ring-primary'
          } ${inputClassName}`}
          {...inputProps}
        />

        {revealable && (
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={visible}
            className="absolute right-1.5 flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-variant hover:text-secondary"
          >
            <Icon
              name={visible ? 'visibility_off' : 'visibility'}
              className="text-[20px]"
            />
          </button>
        )}
      </div>

      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-xs text-on-surface-variant">
          {hint}
        </p>
      )}

      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-1.5 text-xs font-medium text-error"
        >
          {error}
        </p>
      )}
    </div>
  );
}

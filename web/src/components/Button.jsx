import Icon from './Icon.jsx';

const variants = {
  primary:
    'bg-primary text-on-primary shadow-card hover:bg-primary-dark disabled:hover:bg-primary',
  secondary:
    'border border-outline bg-surface text-secondary hover:bg-surface-variant disabled:hover:bg-surface',
  ghost:
    'text-on-surface-variant hover:bg-surface-variant hover:text-secondary disabled:hover:bg-transparent',
  danger:
    'border border-transparent text-error hover:bg-error-light disabled:hover:bg-transparent',
  dangerSolid:
    'bg-error text-on-error hover:bg-error/90 disabled:hover:bg-error',
};

const sizes = {
  md: 'min-h-11 px-4 py-2.5',
  sm: 'min-h-9 px-3 py-1.5',
};

const shapes = {
  control: 'rounded-control',
  pill: 'rounded-full',
};

export default function Button({
  children,
  as: Component = 'button',
  variant = 'primary',
  size = 'md',
  shape = 'control',
  icon,
  iconPosition = 'end',
  loading = false,
  className = '',
  type = 'button',
  disabled = false,
  ...props
}) {
  const isNativeButton = Component === 'button';
  const isDisabled = loading || disabled;
  const iconElement = loading ? (
    <Icon name="progress_activity" className="animate-spin text-[20px]" />
  ) : (
    icon && <Icon name={icon} className="text-[20px]" />
  );

  return (
    <Component
      {...props}
      {...(isNativeButton
        ? { type, disabled: isDisabled }
        : { 'aria-disabled': isDisabled || undefined })}
      className={`inline-flex items-center justify-center gap-2 ${shapes[shape] ?? shapes.control} text-label-md font-semibold transition-all duration-150 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 aria-disabled:cursor-not-allowed aria-disabled:opacity-60 ${sizes[size] ?? sizes.md} ${variants[variant] ?? variants.primary} ${className}`}
    >
      {iconPosition === 'start' && iconElement}
      {children}
      {iconPosition === 'end' && iconElement}
    </Component>
  );
}

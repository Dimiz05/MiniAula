import Icon from './Icon.jsx';

const variants = {
  primary:
    'bg-primary text-on-primary shadow-control hover:bg-primary-dark hover:shadow-card disabled:hover:bg-primary disabled:hover:shadow-control',
  secondary:
    'border border-outline bg-surface text-secondary shadow-control hover:border-primary/30 hover:bg-surface-variant hover:shadow-card disabled:hover:border-outline disabled:hover:bg-surface disabled:hover:shadow-control',
  soft:
    'border border-outline bg-surface text-secondary shadow-control hover:border-primary/30 hover:bg-primary/10 hover:text-primary hover:shadow-card disabled:hover:border-outline disabled:hover:bg-surface disabled:hover:text-secondary disabled:hover:shadow-control',
  ghost:
    'text-on-surface-variant hover:bg-surface-variant hover:text-secondary disabled:hover:bg-transparent',
  danger:
    'border border-transparent text-error hover:bg-error-light disabled:hover:bg-transparent',
  dangerSolid:
    'bg-error text-on-error shadow-control hover:bg-error/90 hover:shadow-card disabled:hover:bg-error disabled:hover:shadow-control',
};

const sizes = {
  md: 'min-h-11 px-4 py-2.5',
  sm: 'min-h-11 px-3 py-2',
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
      className={`inline-flex cursor-pointer items-center justify-center gap-2 ${shapes[shape] ?? shapes.control} text-label-md font-semibold transition-all duration-150 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 aria-disabled:cursor-not-allowed aria-disabled:opacity-60 ${sizes[size] ?? sizes.md} ${variants[variant] ?? variants.primary} ${className}`}
    >
      {iconPosition === 'start' && iconElement}
      {children}
      {iconPosition === 'end' && iconElement}
    </Component>
  );
}

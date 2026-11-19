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
};

export default function Button({
  children,
  variant = 'primary',
  icon,
  iconPosition = 'end',
  loading = false,
  className = '',
  type = 'button',
  ...props
}) {
  const iconElement = loading ? (
    <Icon name="progress_activity" className="animate-spin text-[20px]" />
  ) : (
    icon && <Icon name={icon} className="text-[20px]" />
  );

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-[10px] px-4 py-2.5 text-sm font-semibold transition-all duration-150 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 ${variants[variant]} ${className}`}
      {...props}
      disabled={loading || props.disabled}
    >
      {iconPosition === 'start' && iconElement}
      {children}
      {iconPosition === 'end' && iconElement}
    </button>
  );
}

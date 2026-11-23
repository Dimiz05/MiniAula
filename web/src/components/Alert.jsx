import Icon from './Icon.jsx';

const variants = {
  error: {
    box: 'border-error/30 bg-error-light text-error',
    icon: 'error',
    title: 'text-error',
  },
  success: {
    box: 'border-success/25 bg-success-light text-success',
    icon: 'check_circle',
    title: 'text-success',
  },
  warning: {
    box: 'border-warning/30 bg-warning-light text-warning',
    icon: 'warning',
    title: 'text-warning',
  },
  info: {
    box: 'border-primary/20 bg-primary/5 text-primary',
    icon: 'info',
    title: 'text-primary',
  },
};

export default function Alert({ variant = 'info', title, children, className = '' }) {
  const style = variants[variant] ?? variants.info;

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-control border px-4 py-3 text-body-md ${style.box} ${className}`}
    >
      <Icon name={style.icon} filled className="mt-0.5 shrink-0 text-[20px]" />
      <div className="min-w-0">
        {title && <p className={`font-semibold ${style.title}`}>{title}</p>}
        <div className={title ? 'mt-0.5 opacity-90' : 'opacity-90'}>{children}</div>
      </div>
    </div>
  );
}

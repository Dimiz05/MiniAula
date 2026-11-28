const radii = {
  card: 'rounded-card',
  panel: 'rounded-panel',
};

export default function Card({
  as: Tag = 'div',
  radius = 'card',
  padded = true,
  interactive = false,
  flat = false,
  className = '',
  children,
  ...props
}) {
  return (
    <Tag
      {...props}
      className={`border border-outline bg-surface ${
        radii[radius] ?? radii.card
      } ${padded ? 'p-4' : ''} ${
        flat
          ? ''
          : interactive
            ? 'shadow-card transition-[border-color,box-shadow] duration-200 hover:border-primary/30 hover:shadow-hover'
            : 'shadow-card'
      } ${className}`}
    >
      {children}
    </Tag>
  );
}

import Card from './Card.jsx';
import Icon from './Icon.jsx';

const tones = {
  primary: 'text-primary',
  success: 'text-success',
  neutral: 'text-on-surface-variant',
};

export default function StatCard({
  label,
  value,
  detail,
  icon,
  tone = 'neutral',
  className = '',
}) {
  return (
    <Card as="article" className={className}>
      <div className="mb-2 flex items-start justify-between gap-3 text-on-surface-variant">
        <span className="text-label-sm">{label}</span>
        <Icon name={icon} className={`text-[22px] ${tones[tone] ?? tones.neutral}`} />
      </div>
      <p className="font-mono text-[22px] leading-7 tabular-nums text-secondary">{value}</p>
      <span className="text-label-sm text-on-surface-variant">{detail}</span>
    </Card>
  );
}

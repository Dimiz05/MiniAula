import { Link } from 'react-router';
import Icon from './Icon.jsx';

const sizes = {
  sm: {
    mark: 'h-9 w-9 rounded-lg',
    icon: 'text-[22px]',
    name: 'text-[18px] leading-6',
  },
  md: {
    mark: 'h-10 w-10 rounded-control',
    icon: 'text-[24px]',
    name: 'text-[20px] leading-7',
  },
};

export default function Logo({ to = '/', tone = 'dark', showName = true, size = 'md' }) {
  const style = sizes[size] ?? sizes.md;

  return (
    <Link
      to={to}
      aria-label="MiniAula, ir al inicio"
      className="group inline-flex shrink-0 items-center gap-2.5 rounded-lg"
    >
      <span
        className={`flex shrink-0 items-center justify-center bg-primary text-on-primary shadow-card transition-transform duration-150 group-hover:scale-[1.03] ${style.mark}`}
      >
        <Icon name="school" className={style.icon} />
      </span>
      {showName && (
        <span
          className={`font-mono tracking-tight ${style.name} ${
            tone === 'light' ? 'text-white' : 'text-secondary'
          }`}
        >
          MiniAula
        </span>
      )}
    </Link>
  );
}

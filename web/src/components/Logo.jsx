import { Link } from 'react-router';
import Icon from './Icon.jsx';

export default function Logo({ to = '/', tone = 'dark', showName = true }) {
  return (
    <Link
      to={to}
      aria-label="MiniAula, ir al inicio"
      className="group inline-flex items-center gap-2.5 rounded-lg"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-card bg-primary text-on-primary shadow-card transition-transform duration-150 group-hover:scale-[1.03]">
        <Icon name="school" className="text-[24px]" />
      </span>
      {showName && (
        <span
          className={`text-lg font-bold tracking-tight ${
            tone === 'light' ? 'text-white' : 'text-secondary'
          }`}
        >
          MiniAula
        </span>
      )}
    </Link>
  );
}

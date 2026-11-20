export default function Icon({ name, className = '', filled = false }) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined select-none ${filled ? 'icon-filled' : ''} ${className}`}
    >
      {name}
    </span>
  );
}

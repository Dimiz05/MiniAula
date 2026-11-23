import { useEffect, useState } from 'react';
import { API_URL } from '../config/http.js';
import Icon from './Icon.jsx';

function origenApi() {
  try {
    return new URL(API_URL).origin;
  } catch {
    return '';
  }
}

export function resolverPortada(portada) {
  if (!portada) {
    return null;
  }

  if (/^[a-z][a-z0-9+.-]*:/i.test(portada)) {
    return portada;
  }

  return `${origenApi()}${portada.startsWith('/') ? '' : '/'}${portada}`;
}

export default function CourseCover({
  portada,
  alt = '',
  icon = 'auto_stories',
  className = '',
  iconClassName = 'absolute right-4 top-4 text-[64px] text-white/15',
  gradientClassName = 'bg-gradient-to-br from-primary to-secondary',
  children,
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [portada]);

  const mostrarImagen = Boolean(portada) && !failed;

  return (
    <div className={`relative overflow-hidden ${gradientClassName} ${className}`}>
      {mostrarImagen ? (
        <img
          src={resolverPortada(portada)}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
      ) : (
        <Icon name={icon} className={iconClassName} />
      )}
      {children}
    </div>
  );
}

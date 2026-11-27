import loginIllustration from '../assets/login-illustration.png';
import estudianteIllustration from '../assets/signup-estudiante.jpg';
import instructorIllustration from '../assets/signup-instructor.jpg';

const illustrations = {
  login: {
    src: loginIllustration,
    alt: 'Ilustración de una estudiante celebrando con los brazos abiertos',
    frame: 'aspect-[4/3] object-center',
    width: 400,
    height: 300,
  },
  estudiante: {
    src: estudianteIllustration,
    alt: 'Ilustración de una estudiante con lentes y una libreta',
    frame: 'aspect-[3/4] object-top',
    width: 600,
    height: 850,
  },
  instructor: {
    src: instructorIllustration,
    alt: 'Ilustración de una instructora con un libro y una credencial',
    frame: 'aspect-[3/4] object-top',
    width: 600,
    height: 1068,
  },
};

export default function AuthIllustration({ variant = 'login', className = '' }) {
  const entry = illustrations[variant] ?? illustrations.login;

  return (
    <img
      src={entry.src}
      alt={entry.alt}
      width={entry.width}
      height={entry.height}
      loading="lazy"
      decoding="async"
      className={`block h-auto w-full object-cover ${entry.frame} ${className}`}
    />
  );
}

import loginIllustration from '../assets/login-illustration.jpg';
import estudianteIllustration from '../assets/signup-estudiante.jpg';
import instructorIllustration from '../assets/signup-instructor.jpg';

const illustrations = {
  login: {
    src: loginIllustration,
    alt: 'Ilustración de una persona subiendo escalones de cursos completados hacia una meta',
    frame: 'aspect-square object-center',
    width: 736,
    height: 736,
  },
  estudiante: {
    src: estudianteIllustration,
    alt: 'Ilustración de una silueta de graduado con una planta de estudiantes aprendiendo',
    frame: 'aspect-[1/2] object-center',
    width: 373,
    height: 736,
  },
  instructor: {
    src: instructorIllustration,
    alt: 'Ilustración de un docente rodeado de escenas de enseñanza',
    frame: 'aspect-[1/2] object-center',
    width: 600,
    height: 800,
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

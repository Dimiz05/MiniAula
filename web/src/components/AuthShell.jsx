import AuthIllustration from './AuthIllustration.jsx';

const copy = {
  login: {
    headline: 'Aprende a tu propio ritmo',
    description:
      'Cursos estructurados con lecciones interactivas, avance secuencial y evaluaciones prácticas en tiempo real.',
    footerLeft: '© 2026 MiniAula LMS',
    footerRight: 'Soporte académico',
  },
  estudiante: {
    headline: 'Empieza hoy con MiniAula',
    description:
      'Ya sea como estudiante explorando nuevos temas o como instructor compartiendo tu conocimiento, todo está listo en tu panel.',
    footerLeft: 'Términos y privacidad',
    footerRight: '© 2026 MiniAula',
  },
  instructor: {
    headline: 'Comparte lo que sabes',
    description:
      'Publica cursos, organiza lecciones y evalúa a tus estudiantes desde un solo panel.',
    footerLeft: 'Términos y privacidad',
    footerRight: '© 2026 MiniAula',
  },
};

export default function AuthShell({ variant = 'login', children }) {
  const content = copy[variant] ?? copy.login;

  return (
    <div className="flex min-h-screen justify-center bg-background p-4 md:p-8">
      <main className="my-auto grid w-full max-w-5xl overflow-hidden rounded-panel border border-outline bg-surface shadow-hover md:grid-cols-2">
        <div className="flex flex-col justify-between p-5 sm:p-8 lg:p-12">
          {children}
        </div>

        <aside className="hidden flex-col justify-center border-l border-outline bg-surface-variant/70 p-8 md:flex lg:p-12">
          <div className="my-auto text-center">
            <div className="mx-auto mb-6 w-full max-w-72 overflow-hidden rounded-panel border border-outline bg-surface shadow-card">
              <AuthIllustration variant={variant} />
            </div>

            <h2 className="mb-2 text-headline-sm text-secondary">
              {content.headline}
            </h2>
            <p className="mx-auto max-w-sm text-body-md text-on-surface-variant">
              {content.description}
            </p>
          </div>

          <div className="flex items-center justify-between text-label-sm text-on-surface-variant">
            <span>{content.footerLeft}</span>
            <span>{content.footerRight}</span>
          </div>
        </aside>
      </main>
    </div>
  );
}

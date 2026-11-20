import AuthIllustration from './AuthIllustration.jsx';
import Icon from './Icon.jsx';

const copy = {
  login: {
    badgeIcon: 'bolt',
    badge: 'Plataforma activa v1.0',
    headline: 'Todo tu progreso, en un solo lugar',
    description:
      'Inicia sesión para retomar tus cursos, continuar donde te quedaste y revisar tus resultados al instante.',
    footerLeft: '© 2026 MiniAula LMS',
    footerRight: 'Soporte académico',
  },
  estudiante: {
    badgeIcon: 'school',
    badge: 'Cuenta de estudiante',
    headline: 'Aprende a tu propio ritmo',
    description:
      'Inscríbete a cursos, avanza lección por lección y guarda tu progreso automáticamente.',
    footerLeft: 'Términos y privacidad',
    footerRight: '© 2026 MiniAula',
  },
  instructor: {
    badgeIcon: 'co_present',
    badge: 'Cuenta de instructor',
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
    <div className="flex min-h-screen justify-center bg-background p-4 sm:p-6 md:p-8">
      <main className="my-auto grid w-full max-w-5xl overflow-hidden rounded-[20px] border border-outline bg-surface shadow-hover md:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)]">
        <div className="flex flex-col justify-between p-6 sm:p-8 md:p-12">
          {children}
        </div>

        <aside className="hidden border-l border-outline bg-surface-variant/60 p-10 md:flex md:flex-col md:justify-between">
          <div className="flex justify-end">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-outline bg-surface px-3 py-1 text-[11px] font-medium text-secondary shadow-card">
              <Icon
                name={content.badgeIcon}
                filled
                className="text-[16px] text-primary"
              />
              {content.badge}
            </span>
          </div>

          <div className="my-auto px-2 py-8 text-center">
            <div className="mx-auto mb-7 w-full max-w-sm overflow-hidden rounded-panel border border-outline bg-surface shadow-card">
              <AuthIllustration variant={variant} />
            </div>

            <h2 className="mb-2 text-lg font-semibold text-secondary">
              {content.headline}
            </h2>
            <p className="mx-auto max-w-sm text-sm leading-6 text-on-surface-variant">
              {content.description}
            </p>
          </div>

          <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
            <span>{content.footerLeft}</span>
            <span>{content.footerRight}</span>
          </div>
        </aside>
      </main>
    </div>
  );
}

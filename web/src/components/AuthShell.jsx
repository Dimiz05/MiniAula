import Icon from './Icon.jsx';

const copy = {
  login: {
    badgeIcon: 'bolt',
    badge: 'Plataforma activa v1.0',
    headline: 'Aprende a tu propio ritmo',
    description:
      'Cursos estructurados con lecciones interactivas, avance secuencial y evaluaciones prácticas en tiempo real.',
    footerLeft: '© 2026 MiniAula LMS',
    footerRight: 'Soporte académico',
  },
  register: {
    badgeIcon: 'verified',
    badge: 'Comunidad educativa',
    headline: 'Empieza hoy con MiniAula',
    description:
      'Ya sea como estudiante explorando nuevos temas o como instructor compartiendo tu conocimiento, todo está listo en tu panel.',
    footerLeft: 'Términos y privacidad',
    footerRight: '© 2026 MiniAula',
  },
};

function LessonRow({ icon, iconClass, title, detail, progress }) {
  return (
    <div className="rounded-xl border border-white/15 bg-white/10 p-3">
      <div className="flex items-center gap-2.5">
        <Icon name={icon} filled className={`text-[20px] ${iconClass}`} />
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-white">{title}</p>
          <p className="text-[11px] text-white/70">{detail}</p>
        </div>
      </div>
      {progress !== undefined && (
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-white/90"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

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

          <div className="my-auto px-2 py-10 text-center">
            <div className="relative mx-auto mb-7 max-w-xs overflow-hidden rounded-panel bg-primary p-5 text-left shadow-modal">
              <span className="absolute -right-10 -top-10 h-32 w-32 rounded-full border border-white/15" />
              <span className="absolute -bottom-14 -left-10 h-36 w-36 rounded-full bg-white/5" />

              <div className="relative">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
                  Ruta de aprendizaje
                </p>
                <p className="mt-1 text-sm font-bold text-white">
                  Diseño de experiencias
                </p>

                <div className="mt-4 space-y-2">
                  <LessonRow
                    icon="check_circle"
                    iconClass="text-white"
                    title="Fundamentos del curso"
                    detail="Lección completada"
                  />
                  <LessonRow
                    icon="play_circle"
                    iconClass="text-white"
                    title="Práctica guiada"
                    detail="En curso · 60 %"
                    progress={60}
                  />
                  <LessonRow
                    icon="lock"
                    iconClass="text-white/60"
                    title="Evaluación final"
                    detail="Completa la lección anterior"
                  />
                </div>
              </div>
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

import { Link } from 'react-router';
import Icon from '../components/Icon.jsx';
import { useAuth } from '../hooks/useAuth.jsx';

const primaryLink =
  'inline-flex items-center justify-center gap-2 rounded-control bg-primary px-4 py-2.5 text-label-md font-semibold text-on-primary shadow-card transition-all duration-150 hover:bg-primary-dark active:scale-[0.99]';
const secondaryLink =
  'inline-flex items-center justify-center gap-2 rounded-control border border-outline bg-surface px-4 py-2.5 text-label-md font-semibold text-secondary transition-colors hover:bg-surface-variant';

const features = [
  {
    icon: 'route',
    title: 'Aprendizaje guiado',
    description:
      'Cursos organizados en lecciones cortas para avanzar sin perder el hilo.',
  },
  {
    icon: 'trending_up',
    title: 'Progreso secuencial',
    description:
      'Desbloquea cada lección al completar la anterior y revisa tu avance.',
  },
  {
    icon: 'quiz',
    title: 'Evaluaciones reales',
    description:
      'Practica con cuestionarios calificados por el servidor y recibe tu resultado.',
  },
];

function OutlineRow({ icon, iconClass, title, detail }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 p-3">
      <Icon name={icon} filled className={`text-[20px] ${iconClass}`} />
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-white">{title}</p>
        <p className="text-[11px] text-white/70">{detail}</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { isAuthenticated, usuario } = useAuth();
  const firstName = usuario?.nombre?.trim().split(/\s+/)[0];

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-panel border border-outline bg-surface shadow-card">
        <div
          className={`grid gap-8 p-6 sm:p-10 lg:items-center ${
            isAuthenticated ? 'lg:grid-cols-[1.12fr_0.88fr]' : ''
          }`}
        >
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-[11px] font-semibold text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              {isAuthenticated && firstName
                ? `Hola, ${firstName}`
                : 'Plataforma educativa'}
            </span>

            <h1 className="mt-4 text-display-lg-mobile text-secondary sm:text-display-lg">
              Aprende una lección a la vez.
            </h1>
            <p className="mt-3 max-w-xl text-body-md text-on-surface-variant sm:text-body-lg">
              MiniAula reúne cursos breves, lecciones guiadas y evaluaciones
              prácticas para que avances con claridad, a tu propio ritmo.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              {isAuthenticated ? (
                <>
                  <Link to="/perfil" className={primaryLink}>
                    Ir a mi perfil
                    <Icon name="arrow_forward" className="text-[20px]" />
                  </Link>
                  <Link to="/catalog" className={secondaryLink}>
                    Explorar catálogo
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/registro" className={primaryLink}>
                    Crear cuenta gratis
                    <Icon name="arrow_forward" className="text-[20px]" />
                  </Link>
                  <Link to="/login" className={secondaryLink}>
                    Iniciar sesión
                  </Link>
                </>
              )}
            </div>

            <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs text-on-surface-variant">
              {['Cursos estructurados', 'Avance secuencial', 'Evaluaciones prácticas'].map(
                (item) => (
                  <li key={item} className="inline-flex items-center gap-1.5">
                    <Icon
                      name="check_circle"
                      filled
                      className="text-[16px] text-success"
                    />
                    {item}
                  </li>
                ),
              )}
            </ul>
          </div>

          {isAuthenticated && (
            <div className="relative overflow-hidden rounded-panel bg-primary p-5 text-left shadow-modal sm:p-6">
              <span className="absolute -right-12 -top-12 h-40 w-40 rounded-full border border-white/15" />
              <span className="absolute -bottom-16 -left-12 h-44 w-44 rounded-full bg-white/5" />

              <div className="relative">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
                  Tu ruta de aprendizaje
                </p>
                <p className="mt-1 text-base font-bold text-white">
                  Curso de ejemplo
                </p>

                <div className="mt-4 space-y-2">
                  <OutlineRow
                    icon="check_circle"
                    iconClass="text-white"
                    title="Lección 1 · Fundamentos"
                    detail="Completada"
                  />
                  <OutlineRow
                    icon="play_circle"
                    iconClass="text-white"
                    title="Lección 2 · Práctica guiada"
                    detail="En curso"
                  />
                  <OutlineRow
                    icon="lock"
                    iconClass="text-white/60"
                    title="Lección 3 · Evaluación"
                    detail="Completa la lección anterior"
                  />
                </div>

                <div className="mt-4 flex items-center justify-between rounded-xl bg-white/10 px-3 py-2 text-[11px] text-white/80">
                  <span>Progreso del curso</span>
                  <span className="font-semibold text-white">40 %</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section aria-labelledby="features-heading">
        <div className="mb-4">
          <h2
            id="features-heading"
            className="text-xl font-semibold text-secondary"
          >
            Una experiencia pensada para aprender
          </h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Todo lo que necesitas para organizar tu estudio en un solo lugar.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-card border border-outline bg-surface p-5 shadow-card transition-shadow hover:shadow-hover"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-primary/5 text-primary">
                <Icon name={feature.icon} className="text-[22px]" />
              </span>
              <h3 className="mt-4 text-sm font-semibold text-secondary">
                {feature.title}
              </h3>
              <p className="mt-1.5 text-sm leading-6 text-on-surface-variant">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

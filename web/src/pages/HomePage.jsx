import { Link } from 'react-router';
import Icon from '../components/Icon.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import heroBanner from '../assets/hero-banner.jpg';

const primaryLink =
  'group inline-flex items-center justify-center gap-2 rounded-control bg-primary px-5 py-3 text-label-lg text-on-primary shadow-card transition-[background-color,box-shadow,transform] duration-200 ease-out-quint hover:bg-primary-dark hover:shadow-hover active:scale-[0.98] motion-reduce:active:scale-100';
const secondaryLink =
  'group inline-flex items-center justify-center gap-2 rounded-control border border-outline bg-surface px-5 py-3 text-label-lg text-secondary shadow-xs transition-[background-color,border-color,transform] duration-200 ease-out-quint hover:border-primary/30 hover:bg-surface-variant active:scale-[0.98] motion-reduce:active:scale-100';
const lightLink =
  'group inline-flex items-center justify-center gap-2 rounded-control bg-surface px-5 py-3 text-label-lg text-primary shadow-card transition-[background-color,transform] duration-200 ease-out-quint hover:bg-white active:scale-[0.98] focus-visible:outline-white motion-reduce:active:scale-100';
const outlineLightLink =
  'group inline-flex items-center justify-center gap-2 rounded-control border border-white/30 bg-white/5 px-5 py-3 text-label-lg text-white transition-[background-color,border-color,transform] duration-200 ease-out-quint hover:border-white/50 hover:bg-white/10 active:scale-[0.98] focus-visible:outline-white motion-reduce:active:scale-100';

const reassurances = [
  'Cursos estructurados',
  'Avance secuencial',
  'Evaluaciones prácticas',
];

const values = [
  {
    icon: 'bolt',
    title: 'Lecciones cortas',
    description: 'Avanza en sesiones de pocos minutos, sin perder el hilo.',
  },
  {
    icon: 'route',
    title: 'Ruta secuencial',
    description: 'Cada lección completada desbloquea la siguiente.',
  },
  {
    icon: 'verified',
    title: 'Resultados reales',
    description: 'El servidor califica tus cuestionarios y guarda tu avance.',
  },
];

const steps = [
  {
    title: 'Explora el catálogo',
    description:
      'Filtra por categoría y encuentra un curso que encaje con lo que quieres aprender.',
  },
  {
    title: 'Inscríbete',
    description: 'Crea tu cuenta y únete al curso en segundos.',
  },
  {
    title: 'Aprende y comprueba',
    description:
      'Mira la lección, responde el cuestionario y desbloquea la siguiente.',
  },
];

function Arrow({ className = '' }) {
  return (
    <Icon
      name="arrow_forward"
      className={`text-[20px] transition-transform duration-200 ease-out-quint group-hover:translate-x-0.5 motion-reduce:group-hover:translate-x-0 ${className}`}
    />
  );
}

function SectionHeading({ eyebrow, title, description, id }) {
  return (
    <div className="max-w-2xl">
      <span className="text-label-sm font-semibold uppercase tracking-[0.16em] text-primary">
        {eyebrow}
      </span>
      <h2
        id={id}
        className="mt-2 text-[1.75rem] font-bold leading-tight tracking-[-0.02em] text-secondary text-balance sm:text-[2.125rem]"
      >
        {title}
      </h2>
      {description && (
        <p className="mt-2 text-body-md leading-6 text-on-surface-variant text-pretty sm:text-body-lg sm:leading-7">
          {description}
        </p>
      )}
    </div>
  );
}

function FeatureMark({ name }) {
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-control bg-primary/[0.08] text-primary">
      <Icon name={name} className="text-[22px]" />
    </span>
  );
}

function LessonRow({ title, detail, status = 'done' }) {
  const isCurrent = status === 'current';
  const isLocked = status === 'locked';

  return (
    <div
      className={`flex items-center gap-3 rounded-[10px] border px-2.5 py-2 ${
        isCurrent ? 'border-primary/20 bg-primary/[0.06]' : 'border-transparent'
      }`}
    >
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
          isCurrent
            ? 'bg-primary text-on-primary'
            : isLocked
              ? 'bg-surface-variant text-on-surface-variant/70'
              : 'bg-success-light text-primary'
        }`}
      >
        <Icon
          name={isLocked ? 'lock' : isCurrent ? 'play_arrow' : 'check'}
          filled
          className="text-[13px]"
        />
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-[12px] font-semibold ${
            isLocked ? 'text-on-surface-variant' : 'text-secondary'
          }`}
        >
          {title}
        </p>
        <p className="truncate text-[10px] text-on-surface-variant">{detail}</p>
      </div>
      {isCurrent && (
        <span className="shrink-0 text-[10px] font-semibold text-primary">
          En curso
        </span>
      )}
    </div>
  );
}

function RouteRow({ icon, iconClass, title, detail }) {
  return (
    <div className="flex items-center gap-3 rounded-[10px] border border-white/15 bg-white/10 p-2.5">
      <Icon name={icon} filled className={`text-[19px] ${iconClass}`} />
      <div className="min-w-0">
        <p className="truncate text-label-sm font-semibold text-white">
          {title}
        </p>
        <p className="truncate text-[10px] text-white/70">{detail}</p>
      </div>
    </div>
  );
}

function RoutePanel() {
  return (
    <div className="relative mx-auto w-full max-w-[460px] overflow-hidden rounded-panel bg-primary p-5 text-left text-on-primary shadow-modal sm:p-6">
      <span
        aria-hidden="true"
        className="absolute -right-12 -top-12 h-40 w-40 rounded-full border border-white/15"
      />
      <span
        aria-hidden="true"
        className="absolute -bottom-16 -left-12 h-44 w-44 rounded-full bg-white/5"
      />

      <div className="relative">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
          Tu ruta de aprendizaje
        </p>
        <p className="mt-1 text-headline-sm text-white">Curso de ejemplo</p>

        <div className="mt-4 space-y-2">
          <RouteRow
            icon="check_circle"
            iconClass="text-white"
            title="Lección 1 · Fundamentos"
            detail="Completada"
          />
          <RouteRow
            icon="play_circle"
            iconClass="text-white"
            title="Lección 2 · Práctica guiada"
            detail="En curso"
          />
          <RouteRow
            icon="lock"
            iconClass="text-white/60"
            title="Lección 3 · Evaluación"
            detail="Completa la lección anterior"
          />
        </div>

        <div className="mt-4 rounded-[10px] bg-white/10 px-3 py-2.5">
          <div className="flex items-center justify-between text-[11px] text-white/80">
            <span>Progreso del curso</span>
            <span className="font-semibold text-white">40 %</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/20">
            <div className="h-full w-[40%] rounded-full bg-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroCopy({ isAuthenticated, firstName }) {
  return (
    <div>
      <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.06] px-3 py-1.5 text-label-sm font-semibold text-primary">
        <span className="h-1.5 w-1.5 rounded-full bg-success" />
        {isAuthenticated && firstName ? `Hola, ${firstName}` : 'Plataforma educativa'}
      </span>

      <h1 className="mt-5 text-[2.125rem] font-bold leading-[1.04] tracking-[-0.035em] text-secondary text-balance sm:text-[3rem] xl:text-[3.5rem]">
        Aprende una lección a la vez.
      </h1>

      <p className="mt-5 max-w-[46ch] text-body-lg leading-7 text-on-surface-variant text-pretty">
        {isAuthenticated
          ? 'Retoma tus cursos, revisa tu avance y desbloquea la siguiente lección sin perder el hilo.'
          : 'MiniAula reúne cursos breves, lecciones guiadas y evaluaciones prácticas para que avances con claridad, a tu propio ritmo.'}
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        {isAuthenticated ? (
          <>
            <Link to="/perfil" className={primaryLink}>
              Ir a mi perfil
              <Arrow />
            </Link>
            <Link to="/catalog" className={secondaryLink}>
              Explorar catálogo
            </Link>
          </>
        ) : (
          <>
            <Link to="/registro" className={primaryLink}>
              Crear cuenta
              <Arrow />
            </Link>
            <Link to="/catalog" className={secondaryLink}>
              Explorar cursos
            </Link>
          </>
        )}
      </div>

      <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-body-sm text-on-surface-variant">
        {reassurances.map((item) => (
          <li key={item} className="inline-flex items-center gap-1.5">
            <Icon
              name="check_circle"
              filled
              className="text-[16px] text-success"
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function HomePage() {
  const { isAuthenticated, usuario } = useAuth();
  const firstName = usuario?.nombre?.trim().split(/\s+/)[0];

  return (
    <div className="space-y-14 sm:space-y-16 lg:space-y-20">
      <section
        aria-label={
          isAuthenticated
            ? 'Tu espacio de aprendizaje'
            : 'Presentación de MiniAula'
        }
        className="hero-rise relative isolate -mt-2 overflow-hidden rounded-panel border border-paper-line bg-paper text-on-surface shadow-card"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <span className="absolute -right-28 -top-32 h-[420px] w-[420px] rounded-full border border-primary/10" />
          <span className="absolute -right-8 top-12 h-[300px] w-[300px] rounded-full border border-primary/10" />
          <span className="absolute -bottom-44 -left-36 h-[460px] w-[460px] rounded-full bg-primary/[0.04]" />
        </div>

        <div className="relative grid items-center gap-8 px-5 py-8 sm:px-8 sm:py-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12 lg:px-12 lg:py-12">
          <HeroCopy
            isAuthenticated={isAuthenticated}
            firstName={firstName}
          />

          <div className="relative flex justify-center lg:justify-end">
            {isAuthenticated ? (
              <RoutePanel />
            ) : (
              <div className="relative w-full max-w-[460px] overflow-hidden rounded-panel shadow-card">
                <img
                  src={heroBanner}
                  alt="Mujer con lentes trabajando en su laptop durante una lección en línea"
                  width="1416"
                  height="1111"
                  fetchPriority="high"
                  className="block aspect-[14/11] w-full object-cover object-center"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      <section
        aria-label="Ventajas de MiniAula"
        className="border-t border-paper-line pt-10 sm:pt-12"
      >
        <div className="grid gap-px overflow-hidden rounded-panel border border-outline bg-outline sm:grid-cols-3">
          {values.map((value) => (
            <div
              key={value.title}
              className="flex items-start gap-3 bg-surface p-4 sm:block sm:p-6"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-primary/[0.08] text-primary">
                <Icon name={value.icon} className="text-[20px]" />
              </span>
              <div className="min-w-0 sm:mt-3">
                <p className="text-label-lg text-secondary">{value.title}</p>
                <p className="mt-1 text-body-sm leading-5 text-on-surface-variant">
                  {value.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="how-heading"
        className="border-t border-paper-line pt-10 sm:pt-12"
      >
        <SectionHeading
          id="how-heading"
          eyebrow="Cómo funciona"
          title="Empezar es la parte fácil."
          description="Elige un curso, inscríbete y avanza lección por lección. Sin configuraciones ni pasos extra."
        />

        <ol className="mt-8 grid gap-6 sm:grid-cols-3 sm:gap-8">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="group relative border-t border-outline pt-6"
            >
              <span
                aria-hidden="true"
                className="absolute -top-px left-0 h-px w-10 origin-left bg-primary transition-transform duration-300 ease-out-quint group-hover:scale-x-150 motion-reduce:group-hover:scale-x-100"
              />
              <span className="text-label-sm font-semibold tabular-nums text-primary">
                Paso {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-2 text-headline-sm text-secondary">
                {step.title}
              </h3>
              <p className="mt-1.5 max-w-[34ch] text-body-md leading-6 text-on-surface-variant text-pretty">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section
        aria-labelledby="features-heading"
        className="border-t border-paper-line pt-10 sm:pt-12"
      >
        <SectionHeading
          id="features-heading"
          eyebrow="Dentro de MiniAula"
          title="Diseñado para que no pierdas el hilo."
          description="Una estructura clara, progreso visible y evaluaciones que confirman lo que aprendiste."
        />

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <article className="flex flex-col rounded-panel border border-outline bg-surface p-6 shadow-card transition-shadow duration-300 ease-out-quint hover:shadow-hover">
            <FeatureMark name="route" />
            <h3 className="mt-4 text-headline-sm text-secondary">
              Progreso secuencial
            </h3>
            <p className="mt-1.5 text-body-md leading-6 text-on-surface-variant text-pretty">
              Cada lección completada desbloquea la siguiente y actualiza tu
              avance del curso.
            </p>

            <div aria-hidden="true" className="mt-auto pt-5">
              <div className="rounded-card border border-outline-light bg-background p-3">
                <div className="flex items-center justify-between px-1 pb-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                    Tu avance
                  </span>
                  <span className="text-[11px] font-bold tabular-nums text-primary">
                    40 %
                  </span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-surface-variant">
                  <div className="h-full w-[40%] rounded-full bg-primary" />
                </div>
                <div className="mt-3 space-y-1">
                  <LessonRow title="01 · Fundamentos" detail="Completada" />
                  <LessonRow
                    title="02 · Práctica guiada"
                    detail="Video · 12 min"
                    status="current"
                  />
                  <LessonRow
                    title="03 · Evaluación"
                    detail="Bloqueada"
                    status="locked"
                  />
                </div>
              </div>
            </div>
          </article>

          <article className="flex flex-col rounded-panel border border-outline bg-surface p-6 shadow-card transition-shadow duration-300 ease-out-quint hover:shadow-hover">
            <FeatureMark name="quiz" />
            <h3 className="mt-4 text-headline-sm text-secondary">
              Evaluaciones prácticas
            </h3>
            <p className="mt-1.5 text-body-md leading-6 text-on-surface-variant text-pretty">
              Responde cuestionarios al final de cada lección y recibe el
              resultado que calcula el servidor.
            </p>

            <div aria-hidden="true" className="mt-auto pt-5">
              <div className="rounded-card border border-outline-light bg-background p-3">
                <p className="text-[10px] font-medium text-on-surface-variant">
                  Pregunta 3 de 5
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-secondary">
                  ¿Qué etiqueta define un título principal?
                </p>
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/[0.06] px-2.5 py-1.5">
                    <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-primary">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </span>
                    <span className="text-[11px] font-medium text-secondary">
                      &lt;h1&gt;
                    </span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-outline-light px-2.5 py-1.5">
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-outline" />
                    <span className="text-[11px] text-on-surface-variant">
                      &lt;p&gt;
                    </span>
                  </div>
                </div>
                <div className="mt-2.5 flex items-center justify-between border-t border-outline-light pt-2">
                  <span className="text-[10px] text-on-surface-variant">
                    Calificada por el servidor
                  </span>
                  <span className="rounded-full bg-success-light px-2 py-0.5 text-[10px] font-semibold text-primary">
                    Aprobada
                  </span>
                </div>
              </div>
            </div>
          </article>

          <article className="flex flex-col rounded-panel border border-outline bg-surface p-6 shadow-card transition-shadow duration-300 ease-out-quint hover:shadow-hover">
            <FeatureMark name="play_lesson" />
            <h3 className="mt-4 text-headline-sm text-secondary">
              Aprendizaje guiado
            </h3>
            <p className="mt-1.5 text-body-md leading-6 text-on-surface-variant text-pretty">
              Lecciones cortas con video y contenido ordenado para avanzar sin
              perderte.
            </p>

            <div aria-hidden="true" className="mt-auto pt-5">
              <div className="relative overflow-hidden rounded-card bg-gradient-to-br from-primary to-secondary p-3">
                <Icon
                  name="play_circle"
                  filled
                  className="absolute -right-2 -top-3 text-[56px] text-white/10"
                />
                <div className="relative flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white">
                    <Icon name="play_arrow" filled className="text-[18px]" />
                  </span>
                  <div>
                    <p className="text-[11px] font-semibold text-white">
                      Práctica guiada
                    </p>
                    <p className="text-[10px] text-white/70">
                      Lección 02 · 12 min
                    </p>
                  </div>
                </div>
                <div className="relative mt-3 h-1 overflow-hidden rounded-full bg-white/20">
                  <div className="h-full w-1/3 rounded-full bg-white" />
                </div>
                <div className="relative mt-3 flex items-center justify-between rounded-lg bg-white/10 px-2 py-1.5">
                  <span className="text-[10px] text-white/80">
                    Siguiente · Evaluación
                  </span>
                  <Icon name="lock" className="text-[13px] text-white/50" />
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      <div className="border-t border-paper-line pt-10 sm:pt-12">
        <section
          aria-labelledby="instructors-heading"
          className="relative overflow-hidden rounded-panel bg-secondary p-7 text-on-secondary shadow-card sm:p-10"
        >
          <Icon
            name="co_present"
            className="pointer-events-none absolute -right-6 -top-8 text-[150px] text-white/[0.05]"
          />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <span className="text-label-sm font-semibold uppercase tracking-[0.16em] text-white/60">
                Para instructores
              </span>
              <h2
                id="instructors-heading"
                className="mt-2 text-headline-lg-mobile text-white text-balance sm:text-headline-lg"
              >
                Publica tu curso y sigue el avance de tu grupo.
              </h2>
              <p className="mt-2 max-w-[58ch] text-body-md leading-6 text-white/75 text-pretty">
                Crea cursos, organiza lecciones y revisa las métricas de tus
                estudiantes desde un solo panel.
              </p>
            </div>

            <Link
              to="/registro"
              className="group inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-control bg-surface px-5 py-3 text-label-lg text-secondary transition-[background-color,transform] duration-200 ease-out-quint hover:bg-white active:scale-[0.98] motion-reduce:active:scale-100 lg:self-auto"
            >
              Quiero enseñar
              <Arrow />
            </Link>
          </div>
        </section>
      </div>

      <div className="border-t border-paper-line pt-10 sm:pt-12">
        <section
          aria-labelledby="cta-heading"
          className="relative overflow-hidden rounded-panel bg-primary px-6 py-10 text-on-primary shadow-modal sm:px-10 sm:py-14"
        >
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <span className="absolute -right-20 -top-28 h-64 w-64 rounded-full border border-white/10" />
            <span className="absolute -right-8 -top-16 h-52 w-52 rounded-full border border-white/10" />
            <span className="absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-white/[0.04]" />
          </div>

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <h2
                id="cta-heading"
                className="text-[1.75rem] font-bold leading-tight tracking-[-0.02em] text-white text-balance sm:text-[2.25rem]"
              >
                {isAuthenticated
                  ? 'Sigue donde lo dejaste.'
                  : 'Tu próxima lección empieza hoy.'}
              </h2>
              <p className="mt-3 text-body-md leading-6 text-white/80 text-pretty sm:text-body-lg sm:leading-7">
                {isAuthenticated
                  ? 'Vuelve a tus cursos, revisa tu progreso y desbloquea la siguiente lección.'
                  : 'Crea tu cuenta, elige un curso y avanza a tu propio ritmo. Tu progreso se guarda en cada paso.'}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
              {isAuthenticated ? (
                <>
                  <Link to="/perfil" className={lightLink}>
                    Ir a mi perfil
                    <Arrow />
                  </Link>
                  <Link to="/catalog" className={outlineLightLink}>
                    Explorar catálogo
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/registro" className={lightLink}>
                    Crear cuenta
                    <Arrow />
                  </Link>
                  <Link to="/catalog" className={outlineLightLink}>
                    Explorar catálogo
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

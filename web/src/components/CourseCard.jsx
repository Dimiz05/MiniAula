import CourseCover from './CourseCover.jsx';

export default function CourseCard({
  portada,
  alt = '',
  cover = null,
  title,
  description,
  meta = null,
  children = null,
  action = null,
  className = '',
}) {
  return (
    <article
      className={`flex flex-col justify-between overflow-hidden rounded-card border border-outline bg-surface shadow-card transition-shadow hover:shadow-hover ${className}`}
    >
      <div>
        <CourseCover
          portada={portada}
          alt={alt}
          className="h-28"
          iconClassName="absolute right-3 top-3 text-[48px] text-white/15"
        >
          {cover}
        </CourseCover>

        <div className="p-4">
          <h3 className="mb-1 break-words text-balance text-headline-sm leading-snug text-secondary">
            {title}
          </h3>
          {description && (
            <p className="mb-3 line-clamp-2 min-h-8 text-body-sm text-on-surface-variant">
              {description}
            </p>
          )}
          {children}
          {meta && (
            <div className="flex items-center justify-between gap-3 text-label-sm text-on-surface-variant">
              {meta}
            </div>
          )}
        </div>
      </div>

      {action && <div className="p-4 pt-0">{action}</div>}
    </article>
  );
}

export default function CourseProgress({
  porcentaje,
  leccionesCompletadas = 0,
  totalLecciones = 0,
  titulo = 'curso',
}) {
  const completado = porcentaje >= 100;

  return (
    <div className="mb-4">
      <div className="mb-1 flex items-center justify-between gap-2 text-label-sm">
        <span className="text-on-surface-variant">Avance</span>
        <span
          className={`font-semibold tabular-nums ${
            completado ? 'text-success' : 'text-primary'
          }`}
        >
          {porcentaje}% completado
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={`Avance de ${titulo}`}
        aria-valuenow={porcentaje}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`${porcentaje}% completado`}
        className="h-2 w-full overflow-hidden rounded-full bg-surface-variant"
      >
        <div
          className={`h-2 rounded-full ${completado ? 'bg-success' : 'bg-primary'}`}
          style={{ width: `${porcentaje}%` }}
        />
      </div>
      {totalLecciones > 0 && (
        <p className="mt-1 text-label-sm text-on-surface-variant">
          {leccionesCompletadas} de {totalLecciones} lecciones completadas
        </p>
      )}
    </div>
  );
}

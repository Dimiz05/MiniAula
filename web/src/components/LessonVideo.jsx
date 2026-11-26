import Icon from './Icon.jsx';
import { obtenerFuenteVideo } from '../utils/media.js';

// El video vive dentro de la lección: nada de botones que saquen al estudiante
// de MiniAula. YouTube y Vimeo se embeben; los archivos usan el reproductor
// nativo del navegador.
export default function LessonVideo({ videoUrl, titulo }) {
  const fuente = obtenerFuenteVideo(videoUrl);

  if (!fuente) {
    return null;
  }

  return (
    <section
      aria-label="Video de la lección"
      className="overflow-hidden rounded-panel border border-outline bg-surface shadow-card"
    >
      <div className="aspect-video w-full bg-secondary">
        {fuente.tipo === 'archivo' ? (
          <video
            controls
            preload="metadata"
            playsInline
            className="h-full w-full"
            src={fuente.src}
          >
            Tu navegador no puede reproducir este video.
          </video>
        ) : (
          <iframe
            src={fuente.src}
            title={titulo ? `Video: ${titulo}` : 'Video de la lección'}
            className="h-full w-full"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        )}
      </div>
      <div className="flex items-start gap-3 p-4">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon name="play_circle" className="text-[22px]" />
        </span>
        <div>
          <h2 className="text-headline-sm text-secondary">Video de la lección</h2>
          <p className="text-body-sm text-on-surface-variant">
            Reproduce el video aquí mismo, antes de leer el contenido.
          </p>
        </div>
      </div>
    </section>
  );
}

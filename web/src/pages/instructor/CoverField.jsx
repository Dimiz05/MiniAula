import { useId, useState } from 'react';
import Button from '../../components/Button.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import CourseCover from '../../components/CourseCover.jsx';
import Icon from '../../components/Icon.jsx';
import {
  PORTADA_TIPOS,
  analizarArchivosSoltados,
  esArrastreDeArchivos,
} from './courseForm.js';

const zonaBase =
  'flex flex-col items-center justify-center gap-1.5 rounded-control border-2 border-dashed px-4 py-6 text-center transition-[border-color,background-color,box-shadow] duration-200 ease-out-quint peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2';
const zonaInactiva =
  'border-outline bg-surface-variant/40 hover:border-primary/40 hover:bg-surface-variant/70';
const zonaActiva = 'border-primary bg-primary/[0.06] ring-2 ring-primary/20';

export default function CoverField({
  previewPortada,
  alt,
  nombrePortada,
  error,
  busy = false,
  uploading = false,
  onFile,
  onRemove,
  onError,
}) {
  const inputId = useId();
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const [arrastrando, setArrastrando] = useState(false);
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false);
  const tienePreview = Boolean(previewPortada);

  function resaltar(event) {
    if (busy || !esArrastreDeArchivos(event.dataTransfer)) {
      return;
    }

    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
    setArrastrando(true);
  }

  function handleDragLeave(event) {
    if (event.currentTarget.contains(event.relatedTarget)) {
      return;
    }

    setArrastrando(false);
  }

  function handleDrop(event) {
    // Without preventDefault the browser opens the dropped image in a new tab.
    event.preventDefault();
    setArrastrando(false);

    if (busy || !esArrastreDeArchivos(event.dataTransfer)) {
      return;
    }

    const { archivo, error: errorSoltado } = analizarArchivosSoltados(
      event.dataTransfer?.files,
    );

    if (errorSoltado) {
      onError(errorSoltado);
      return;
    }

    onFile(archivo);
  }

  function handleInputChange(event) {
    const archivo = event.target.files?.[0];
    event.target.value = '';

    if (!archivo || busy) {
      return;
    }

    onFile(archivo);
  }

  return (
    <div>
      <p className="mb-1.5 text-label-md text-secondary">Imagen de portada</p>

      <input
        id={inputId}
        type="file"
        accept={PORTADA_TIPOS.join(',')}
        onChange={handleInputChange}
        disabled={busy}
        className="peer sr-only"
        aria-label="Elegir imagen de portada"
        aria-describedby={
          [tienePreview ? null : hintId, error ? errorId : null]
            .filter(Boolean)
            .join(' ') || undefined
        }
      />

      <label
        htmlFor={inputId}
        onDragEnter={resaltar}
        onDragOver={resaltar}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`${
          tienePreview
            ? 'group relative block overflow-hidden rounded-control border border-outline'
            : `${zonaBase} ${arrastrando ? zonaActiva : zonaInactiva}`
        } ${
          busy ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
        }`}
      >
        {tienePreview ? (
          <>
            <CourseCover
              portada={previewPortada}
              alt={alt}
              className="aspect-[16/9] max-h-64 w-full"
            />
            <span className="pointer-events-none absolute inset-0 flex items-end justify-end bg-gradient-to-t from-secondary/60 via-transparent to-transparent p-3 opacity-100 transition-opacity duration-200">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface/95 px-3 py-1.5 text-label-sm font-semibold text-secondary shadow-sm">
                <Icon name="upload" className="text-[16px]" />
                Cambiar imagen
              </span>
            </span>
            {arrastrando && (
              <span className="absolute inset-0 rounded-control border-2 border-primary bg-primary/10" />
            )}
          </>
        ) : (
          <>
            <Icon name="upload" className="text-[26px] text-primary" />
            <span className="text-label-md font-semibold text-secondary">
              Arrastra una imagen aquí o haz clic para seleccionarla
            </span>
            <span id={hintId} className="text-label-sm text-on-surface-variant">
              PNG, JPG o WebP · máximo 5 MB.
            </span>
          </>
        )}
      </label>

      <div className={`mt-2 flex flex-wrap items-center gap-2 ${tienePreview ? 'min-h-9' : ''}`}>
        {tienePreview && (
          <Button
            variant="danger"
            icon="delete"
            onClick={() => setConfirmandoBorrado(true)}
            disabled={busy}
          >
            Quitar portada
          </Button>
        )}
        {uploading && (
          <span role="status" className="text-label-sm text-on-surface-variant">
            Subiendo…
          </span>
        )}
      </div>

      {nombrePortada && (
        <p className="mt-1.5 text-label-sm text-on-surface-variant">
          Archivo: {nombrePortada}.
        </p>
      )}

      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-label-sm font-medium text-error">
          {error}
        </p>
      )}

      <ConfirmDialog
        open={confirmandoBorrado}
        title="¿Quitar la portada?"
        description="La imagen se eliminará de este curso y no se puede recuperar desde aquí."
        confirmLabel="Quitar portada"
        busy={uploading}
        onCancel={() => setConfirmandoBorrado(false)}
        onConfirm={() => {
          setConfirmandoBorrado(false);
          onRemove();
        }}
      />
    </div>
  );
}

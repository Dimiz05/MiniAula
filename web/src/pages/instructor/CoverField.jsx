import { useId, useRef, useState } from 'react';
import Button from '../../components/Button.jsx';
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
  const inputRef = useRef(null);
  const [arrastrando, setArrastrando] = useState(false);

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
        ref={inputRef}
        id={inputId}
        type="file"
        accept={PORTADA_TIPOS.join(',')}
        onChange={handleInputChange}
        disabled={busy}
        className="peer sr-only"
        aria-label="Elegir imagen de portada"
        aria-describedby={error ? `${hintId} ${errorId}` : hintId}
      />

      <label
        htmlFor={inputId}
        onDragEnter={resaltar}
        onDragOver={resaltar}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`${zonaBase} ${arrastrando ? zonaActiva : zonaInactiva} ${
          busy ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
        }`}
      >
        <Icon name="upload" className="text-[26px] text-primary" />
        <span className="text-label-md font-semibold text-secondary">
          Arrastra una imagen aquí o haz clic para seleccionarla
        </span>
        <span id={hintId} className="text-label-sm text-on-surface-variant">
          PNG, JPG o WebP · máximo 5 MB.
        </span>
      </label>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          icon="upload"
          iconPosition="start"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          {uploading ? 'Subiendo…' : previewPortada ? 'Cambiar imagen' : 'Elegir imagen'}
        </Button>
        {previewPortada && (
          <Button variant="danger" icon="delete" onClick={onRemove} disabled={busy}>
            Quitar portada
          </Button>
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

      <CourseCover
        portada={previewPortada}
        alt={alt}
        className="mt-3 aspect-video w-full rounded-control border border-outline"
      />
    </div>
  );
}

const tones = {
  muted: 'text-on-surface-variant',
  success: 'text-success',
  error: 'text-error',
};

export default function FormActions({
  status = null,
  tone = 'muted',
  sticky = false,
  flush = false,
  className = '',
  children,
}) {
  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${
        sticky
          ? 'sticky bottom-4 z-20 rounded-panel border border-outline bg-surface/95 px-4 py-3 shadow-hover backdrop-blur'
          : flush
            ? 'pt-0'
            : 'border-t border-outline pt-4'
      } ${className}`}
    >
      {status && (
        <p role="status" className={`text-label-sm ${tones[tone] ?? tones.muted}`}>
          {status}
        </p>
      )}
      <div
        className={`flex flex-wrap items-center gap-2 ${
          sticky ? 'sm:ml-auto sm:justify-end' : ''
        }`}
      >
        {children}
      </div>
    </div>
  );
}

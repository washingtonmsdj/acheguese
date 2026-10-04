export function AppBootstrapLoader() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-territory-canvas text-territory-ink"
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-3 px-6 text-center">
        <span
          className="h-8 w-8 animate-spin rounded-full border-2 border-territory-brand/30 border-t-territory-brand"
          aria-hidden="true"
        />
        <span className="text-sm text-territory-muted">
          Preparando seu território...
        </span>
      </div>
    </div>
  );
}

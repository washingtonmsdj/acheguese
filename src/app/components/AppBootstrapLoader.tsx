export function AppBootstrapLoader() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background text-foreground"
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-3 px-6 text-center">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        <span className="text-sm text-muted-foreground">Carregando...</span>
      </div>
    </div>
  );
}

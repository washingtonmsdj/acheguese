import { Component, type ErrorInfo, type ReactNode } from "react";

interface BootstrapErrorBoundaryProps {
  children: ReactNode;
}

interface BootstrapErrorBoundaryState {
  error: Error | null;
}

export class BootstrapErrorBoundary extends Component<
  BootstrapErrorBoundaryProps,
  BootstrapErrorBoundaryState
> {
  state: BootstrapErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BootstrapErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error("Bootstrap failed:", error, errorInfo);
      return;
    }

    void import("@/shared/config/sentry.config")
      .then(({ captureSentryException }) => {
        captureSentryException(error, {
          surface: "bootstrap",
          componentStack: errorInfo.componentStack ?? "",
        });
      })
      .catch(() => undefined);
  }

  render(): ReactNode {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <main
        className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground"
        role="alert"
        aria-live="assertive"
      >
        <div className="w-full max-w-md rounded-lg border bg-card p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold">
            Não foi possível iniciar o Achegue-se
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Recarregue a página para tentar novamente.
          </p>
          <button
            className="mt-5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            type="button"
            onClick={() => window.location.reload()}
          >
            Recarregar
          </button>
        </div>
      </main>
    );
  }
}

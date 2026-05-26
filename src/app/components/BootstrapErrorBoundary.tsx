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
    }
  }

  render(): ReactNode {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
        <div className="w-full max-w-md rounded-lg border bg-card p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold">Nao foi possivel iniciar o Achegue-se</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Recarregue a pagina para tentar novamente.
          </p>
          <button
            className="mt-5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            type="button"
            onClick={() => window.location.reload()}
          >
            Recarregar
          </button>
        </div>
      </div>
    );
  }
}

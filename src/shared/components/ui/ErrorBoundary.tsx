import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { logger } from "@/shared/utils/logger";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; retry: () => void }>;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent error={this.state.error} retry={this.retry} />
        );
      }

      return (
        <DefaultErrorFallback error={this.state.error} retry={this.retry} />
      );
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({
  error,
  retry,
}: {
  error?: Error;
  retry: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
        <AlertTriangle className="mx-auto mb-4 text-red-500" size={48} />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Ops! Algo deu errado
        </h2>
        <p className="text-gray-600 mb-6">
          Ocorreu um erro inesperado. Tente novamente ou recarregue a página.
        </p>
        {error && (
          <details className="text-left mb-6">
            <summary className="cursor-pointer text-sm text-gray-500 mb-2">
              Detalhes técnicos
            </summary>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
              {error.message}
            </pre>
          </details>
        )}
        <div className="space-y-3">
          <Button onClick={retry} className="w-full">
            <RefreshCw className="mr-2" size={16} />
            Tentar Novamente
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="w-full"
          >
            Reload Página
          </Button>
        </div>
      </div>
    </div>
  );
}

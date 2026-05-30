/**
 * 🛡️ EVENTS ERROR BOUNDARY
 * 
 * Error boundary para capturar e tratar erros na aplicação de eventos
 * Evita que a aplicação inteira quebre por causa de um erro
 * 
 * @version 1.0.0
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class EventsErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('EventsErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
          <div className="w-full max-w-md text-center">
            {/* Icon */}
            <div className="mb-6 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-10 w-10 text-destructive" />
              </div>
            </div>

            {/* Title */}
            <h1 className="mb-3 text-2xl font-bold text-foreground">
              Algo deu errado
            </h1>

            {/* Description */}
            <p className="mb-6 text-muted-foreground">
              Desculpe, ocorreu um erro inesperado. Tente recarregar a página ou voltar para a página inicial.
            </p>

            {/* Error Details (only in development) */}
            {import.meta.env.DEV && this.state.error && (
              <details className="mb-6 rounded-lg border border-border bg-muted/50 p-4 text-left">
                <summary className="cursor-pointer text-sm font-semibold text-foreground">
                  Detalhes do erro (dev only)
                </summary>
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-destructive">
                    <strong>Erro:</strong> {this.state.error.message}
                  </p>
                  {this.state.errorInfo && (
                    <pre className="overflow-auto text-xs text-muted-foreground">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                onClick={this.handleReload}
                className="gap-2"
                size="lg"
              >
                <RefreshCw className="h-4 w-4" />
                Recarregar página
              </Button>
              <Button
                asChild
                variant="outline"
                className="gap-2"
                size="lg"
              >
                <a href="/">
                  <Home className="h-4 w-4" />
                Ir para início
                </a>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

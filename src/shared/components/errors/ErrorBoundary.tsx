/**
 * ErrorBoundary canônico da aplicação.
 *
 * Responsabilidade única para erros de renderização React:
 * - captura e observabilidade;
 * - fallback visual consistente;
 * - reset opcional controlado pelo consumidor.
 */

import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { captureSentryException } from "@/shared/config/sentry.config";
import { logger } from "@/shared/utils/logger";
import { navigateToSafeRedirect } from "@/shared/utils/safeRedirect";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const context = {
      component: "ErrorBoundary",
      action: "componentDidCatch",
      componentStack: errorInfo.componentStack,
    };

    if (import.meta.env.DEV) {
      logger.error("ErrorBoundary caught an error:", error, context);
    } else {
      captureSentryException(error, context);
    }

    this.props.onError?.(error, errorInfo);
  }

  private handleReset = (): void => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  private handleGoHome = (): void => {
    navigateToSafeRedirect("/", { context: "error-boundary-home" });
  };

  render(): ReactNode {
    const { error } = this.state;

    if (!error) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Algo deu errado</h1>
            <p className="text-sm text-muted-foreground">
              Encontramos um erro inesperado. Nossa equipe foi notificada.
            </p>
          </div>

          {import.meta.env.DEV && (
            <details className="bg-muted/50 rounded-lg p-4 text-left">
              <summary className="cursor-pointer text-sm font-medium text-foreground">
                Detalhes do erro
              </summary>
              <pre className="mt-2 text-xs text-destructive whitespace-pre-wrap break-words">
                {error.stack ?? error.message}
              </pre>
            </details>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={this.handleReset}
              variant="outline"
              className="flex-1 gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar novamente
            </Button>
            <Button onClick={this.handleGoHome} className="flex-1 gap-2">
              <Home className="w-4 h-4" />
              Ir para início
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

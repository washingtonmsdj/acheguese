/**
 * 🛡️ GLOBAL ERROR BOUNDARY (NÍVEL AAA)
 *
 * Captura erros em toda a aplicação e exibe UI amigável
 *
 * Features:
 * - Captura erros de renderização
 * - Logging automático
 * - UI de fallback profissional
 * - Botão de reload
 * - Informações de debug (dev only)
 *
 * @version 1.0.0
 */

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { logger } from "@/shared/utils/logger";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error("🚨 Error Boundary caught an error:", error, {
      component: "ErrorBoundary",
      action: "componentDidCatch",
    });

    this.setState({
      error,
      errorInfo,
    });

    // Log to external service (Sentry, LogRocket, etc.)
    if (import.meta.env.PROD) {
      // TODO: Send to error tracking service
      // logErrorToService(error, errorInfo);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Oops! Algo deu errado
            </h1>

            <p className="text-gray-600 mb-6">
              Encontramos um erro inesperado. Não se preocupe, você pode tentar
              recarregar a página ou voltar para o início.
            </p>

            <div className="flex gap-3 justify-center mb-6">
              <Button
                onClick={this.handleReload}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Recarregar
              </Button>

              <Button
                onClick={this.handleGoHome}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Ir para Início
              </Button>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <details className="text-left mt-6 p-4 bg-gray-50 rounded-lg">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                  Detalhes do erro (dev only)
                </summary>
                <pre className="text-xs text-red-600 overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Error Boundary Component
 *
 * Captura erros React e exibe fallback UI.
 * O SDK do Sentry e carregado sob demanda para preservar o bundle inicial.
 *
 * @version 1.1.0
 */

import React from "react";
import {
  captureSentryException,
  showSentryReportDialog,
} from "@/shared/config/sentry.config";
import { ErrorFallback } from "./ErrorFallback";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{
    error: Error;
    resetError: () => void;
  }>;
  showDialog?: boolean;
}

interface ErrorBoundaryState {
  error: Error | null;
}

const SENTRY_DIALOG_OPTIONS = {
  title: "Algo deu errado",
  subtitle: "Nossa equipe foi notificada.",
  subtitle2: "Se você quiser nos ajudar, conte-nos o que aconteceu.",
  labelName: "Nome",
  labelEmail: "Email",
  labelComments: "O que aconteceu?",
  labelClose: "Fechar",
  labelSubmit: "Enviar",
  errorGeneric:
    "Ocorreu um erro desconhecido ao enviar seu relatório. Por favor, tente novamente.",
  errorFormEntry:
    "Alguns campos são inválidos. Por favor, corrija os erros e tente novamente.",
  successMessage: "Seu feedback foi enviado. Obrigado!",
};

/**
 * Error Boundary que captura erros React e reporta para Sentry.
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    captureSentryException(error, {
      component: "SharedErrorBoundary",
      componentStack: errorInfo.componentStack,
    });

    if (this.props.showDialog) {
      showSentryReportDialog(SENTRY_DIALOG_OPTIONS);
    }
  }

  resetError = (): void => {
    this.setState({ error: null });
  };

  render(): React.ReactNode {
    const FallbackComponent = this.props.fallback || ErrorFallback;

    if (this.state.error) {
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
        />
      );
    }

    return <>{this.props.children}</>;
  }
}

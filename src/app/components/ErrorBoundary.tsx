/**
 * GLOBAL ERROR BOUNDARY (NÍVEL AAA)
 *
 * Captura erros em toda a aplicação e exibe UI amigável
 * Integrado com Sentry para tracking automático
 *
 * Features:
 * - Captura erros de renderização
 * - Logging automático para Sentry
 * - UI de fallback profissional
 * - Botão de reload
 * - Informações de debug (dev only)
 * - Dialog de feedback do usuário (opcional)
 *
 * @version 2.0.0
 */

import React, { ReactNode } from "react";
import { ErrorBoundary as SentryErrorBoundary } from "@sentry/react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { logger } from "@/shared/utils/logger";
import { navigateToSafeRedirect } from "@/shared/utils/safeRedirect";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  showDialog?: boolean;
}

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

function ErrorFallbackUI({ error, resetError }: ErrorFallbackProps) {
  const handleReload = () => {
    resetError();
    window.location.reload();
  };

  const handleGoHome = () => {
    navigateToSafeRedirect("/", { context: "app-error-boundary-home" });
  };

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
          Encontramos um erro inesperado. Nossa equipe foi notificada automaticamente.
          Você pode tentar recarregar a página ou voltar para o início.
        </p>

        <div className="flex gap-3 justify-center mb-6">
          <Button
            onClick={handleReload}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Recarregar
          </Button>

          <Button
            onClick={handleGoHome}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Ir para Início
          </Button>
        </div>

        {import.meta.env.DEV && error && (
          <details className="text-left mt-6 p-4 bg-gray-50 rounded-lg">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
              Detalhes do erro (dev only)
            </summary>
            <pre className="text-xs text-red-600 overflow-auto max-h-40">
              {error.toString()}
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

export function ErrorBoundary({ children, fallback, showDialog = false }: Props) {
  return (
    <SentryErrorBoundary
      fallback={({ error, resetError }) => {
        // Normalizar erro (Sentry pode passar unknown)
        const normalizedError =
          error instanceof Error
            ? error
            : new Error(typeof error === "string" ? error : JSON.stringify(error));

        // Log para console em desenvolvimento
        if (import.meta.env.DEV) {
          logger.error("Error Boundary caught an error:", normalizedError, {
            component: "ErrorBoundary",
            action: "componentDidCatch",
          });
        }

        // Usar fallback customizado se fornecido
        if (fallback) {
          return <>{fallback}</>;
        }

        // Usar UI padrão
        return <ErrorFallbackUI error={normalizedError} resetError={resetError} />;
      }}
      showDialog={showDialog}
      dialogOptions={{
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
      }}
    >
      {children}
    </SentryErrorBoundary>
  );
}

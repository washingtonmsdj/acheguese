/**
 * Error Boundary Component
 * 
 * Captura erros React e exibe fallback UI
 * Integrado com Sentry para tracking automático
 * 
 * @version 1.0.0
 */

import React from 'react';
import { ErrorBoundary as SentryErrorBoundary } from '@sentry/react';
import { ErrorFallback } from './ErrorFallback';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{
    error: Error;
    resetError: () => void;
  }>;
  showDialog?: boolean;
}

/**
 * Error Boundary que captura erros React e reporta para Sentry
 * 
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 * ```
 */
export function ErrorBoundary({
  children,
  fallback,
  showDialog = false,
}: ErrorBoundaryProps) {
  const FallbackComponent = fallback || ErrorFallback;

  return (
    <SentryErrorBoundary
      fallback={({ error, resetError }) => (
        <FallbackComponent error={error as Error} resetError={resetError} />
      )}
      showDialog={showDialog}
      dialogOptions={{
        title: 'Algo deu errado',
        subtitle: 'Nossa equipe foi notificada.',
        subtitle2: 'Se você quiser nos ajudar, conte-nos o que aconteceu.',
        labelName: 'Nome',
        labelEmail: 'Email',
        labelComments: 'O que aconteceu?',
        labelClose: 'Fechar',
        labelSubmit: 'Enviar',
        errorGeneric: 'Ocorreu um erro desconhecido ao enviar seu relatório. Por favor, tente novamente.',
        errorFormEntry: 'Alguns campos são inválidos. Por favor, corrija os erros e tente novamente.',
        successMessage: 'Seu feedback foi enviado. Obrigado!',
      }}
    >
      {children}
    </SentryErrorBoundary>
  );
}

/**
 * Error Fallback Component
 * 
 * UI exibida quando um erro é capturado pelo ErrorBoundary
 * 
 * @version 1.0.0
 */

import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { navigateToSafeRedirect } from '@/shared/utils/safeRedirect';

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

/**
 * Componente de fallback exibido quando ocorre um erro
 */
export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const isDev = import.meta.env.DEV;

  const handleGoHome = () => {
    navigateToSafeRedirect('/', { context: 'shared-error-fallback-home' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive mb-2">
            <AlertTriangle className="h-6 w-6" />
            <CardTitle>Algo deu errado</CardTitle>
          </div>
          <CardDescription>
            Desculpe, ocorreu um erro inesperado. Nossa equipe foi notificada automaticamente.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {isDev && (
            <div className="bg-muted p-4 rounded-md">
              <p className="text-sm font-mono text-muted-foreground mb-2">
                <strong>Erro (apenas em desenvolvimento):</strong>
              </p>
              <p className="text-sm font-mono text-destructive break-all">
                {error.message}
              </p>
              {error.stack && (
                <details className="mt-2">
                  <summary className="text-sm font-mono cursor-pointer hover:text-foreground">
                    Stack trace
                  </summary>
                  <pre className="text-xs mt-2 overflow-auto max-h-40 text-muted-foreground">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            <p>Você pode tentar:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Recarregar a página</li>
              <li>Voltar para a página inicial</li>
              <li>Limpar o cache do navegador</li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex gap-2">
          <Button
            onClick={resetError}
            variant="default"
            className="flex-1"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar novamente
          </Button>
          <Button
            onClick={handleGoHome}
            variant="outline"
            className="flex-1"
          >
            <Home className="mr-2 h-4 w-4" />
            Ir para início
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

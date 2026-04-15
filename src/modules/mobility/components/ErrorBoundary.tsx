/**
 * ErrorBoundary - Componente de Error Handling Visual
 *
 * Captura erros e exibe UI amigável com opção de retry.
 *
 * @module components/mobilidade/ErrorBoundary
 * @version 1.0.0
 */

import React, { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { logger } from "@/shared/utils/logger";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="bg-card border-border p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">
            Algo deu errado
          </h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            {this.state.error?.message ||
              "Ocorreu um erro inesperado. Tente novamente."}
          </p>
          <Button
            onClick={this.handleReset}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </Card>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based error state component
 */
interface ErrorStateProps {
  error: Error | null;
  onRetry: () => void;
  title?: string;
  description?: string;
}

export function ErrorState({
  error,
  onRetry,
  title = "Erro ao carregar dados",
  description,
}: ErrorStateProps) {
  return (
    <Card className="bg-card border-border p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
        {description ||
          error?.message ||
          "Ocorreu um erro ao carregar os dados."}
      </p>
      <Button
        onClick={onRetry}
        className="bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Tentar Novamente
      </Button>
    </Card>
  );
}

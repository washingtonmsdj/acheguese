import { useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

interface PageLoaderProps {
  message?: string;
  fullScreen?: boolean;
  recoveryAfterMs?: number | null;
  recoveryTitle?: string;
  recoveryDescription?: string;
  onRecovery?: (() => void) | null;
}

/**
 * PageLoader - Loading state customizado para páginas
 * 
 * @param message - Mensagem opcional de loading
 * @param fullScreen - Se true, ocupa tela inteira (default: false)
 */
export function PageLoader({ 
  message = "Carregando...", 
  fullScreen = false,
  recoveryAfterMs = null,
  recoveryTitle = "Está demorando mais que o normal",
  recoveryDescription = "Verifique sua conexão e tente recarregar a página.",
  onRecovery = null,
}: PageLoaderProps) {
  const [showRecovery, setShowRecovery] = useState(false);

  useEffect(() => {
    if (!recoveryAfterMs || recoveryAfterMs <= 0) {
      setShowRecovery(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setShowRecovery(true);
    }, recoveryAfterMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [recoveryAfterMs]);

  const containerClass = fullScreen 
    ? "flex items-center justify-center min-h-screen"
    : "flex items-center justify-center min-h-[40vh]";

  return (
    <div className={containerClass}>
      <div className="text-center space-y-3 max-w-sm px-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground">{message}</p>
        {showRecovery && (
          <div className="space-y-3 rounded-xl border border-border bg-card/80 p-4">
            <p className="text-sm font-medium text-foreground">{recoveryTitle}</p>
            <p className="text-xs text-muted-foreground">{recoveryDescription}</p>
            <Button
              size="sm"
              type="button"
              className="w-full"
              onClick={() => (onRecovery ? onRecovery() : window.location.reload())}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Recarregar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Variantes específicas para contextos diferentes
 */
export const AdminPageLoader = () => (
  <PageLoader message="Carregando painel..." />
);

export const ModulePageLoader = () => (
  <PageLoader message="Carregando conteúdo..." />
);

export const FullScreenLoader = () => (
  <PageLoader
    message="Carregando aplicação..."
    fullScreen
    recoveryAfterMs={8000}
    recoveryTitle="Aplicação ainda não respondeu"
    recoveryDescription="Se a tela continuar travada, recarregue para tentar novamente."
  />
);

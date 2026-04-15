import { Loader2 } from "lucide-react";

interface PageLoaderProps {
  message?: string;
  fullScreen?: boolean;
}

/**
 * PageLoader - Loading state customizado para páginas
 * 
 * @param message - Mensagem opcional de loading
 * @param fullScreen - Se true, ocupa tela inteira (default: false)
 */
export function PageLoader({ 
  message = "Carregando...", 
  fullScreen = false 
}: PageLoaderProps) {
  const containerClass = fullScreen 
    ? "flex items-center justify-center min-h-screen"
    : "flex items-center justify-center min-h-[40vh]";

  return (
    <div className={containerClass}>
      <div className="text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground">{message}</p>
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
  <PageLoader message="Carregando aplicação..." fullScreen />
);

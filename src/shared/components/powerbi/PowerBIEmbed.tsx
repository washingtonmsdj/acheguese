/**
 * Componente para embedar dashboards do Power BI
 * 
 * Permite visualizar relatórios do Power BI diretamente no sistema
 * com loading states e tratamento de erros.
 * 
 * @example
 * ```tsx
 * <PowerBIEmbed
 *   reportUrl="https://app.powerbi.com/view?r=..."
 *   title="Dashboard Geral"
 *   height="800px"
 * />
 * ```
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';

interface PowerBIEmbedProps {
  /** URL do relatório do Power BI */
  reportUrl: string;
  /** Título do dashboard */
  title?: string;
  /** Altura do iframe */
  height?: string;
  /** Classes CSS adicionais */
  className?: string;
  /** Callback quando o dashboard carrega */
  onLoad?: () => void;
  /** Callback quando ocorre erro */
  onError?: (error: Error) => void;
}

export function PowerBIEmbed({
  reportUrl,
  title = 'Dashboard',
  height = '600px',
  className = '',
  onLoad,
  onError,
}: PowerBIEmbedProps) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const handleLoad = () => {
    setLoading(false);
    setError(null);
    onLoad?.();
  };

  const handleError = () => {
    const errorMsg = 'Erro ao carregar dashboard do Power BI';
    setLoading(false);
    setError(errorMsg);
    onError?.(new Error(errorMsg));
  };

  // Validar URL
  React.useEffect(() => {
    if (!reportUrl || !reportUrl.includes('powerbi.com')) {
      setError('URL do Power BI inválida');
      setLoading(false);
    }
  }, [reportUrl]);

  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {title}
            {loading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-0">
        {error ? (
          <Alert variant="destructive" className="m-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <div className="relative" style={{ height }}>
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                <div className="text-center space-y-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    Carregando dashboard...
                  </p>
                </div>
              </div>
            )}
            <iframe
              src={reportUrl}
              frameBorder="0"
              allowFullScreen
              className="w-full h-full"
              onLoad={handleLoad}
              onError={handleError}
              title={title}
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

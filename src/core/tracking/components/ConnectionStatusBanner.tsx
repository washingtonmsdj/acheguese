/**
 * GATE 4: Banner de Status de Conexão
 * 
 * Mostra estado de conexão e permite reconexão manual
 */

import { AlertCircle, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';
import { useConnectionState } from '../hooks/useConnectionState';

export interface ConnectionStatusBannerProps {
  /** Se deve mostrar apenas quando desconectado */
  showOnlyWhenDisconnected?: boolean;
  /** Callback ao reconectar com sucesso */
  onReconnected?: () => void;
}

/**
 * Banner que mostra estado de conexão e permite reconexão manual
 * 
 * @example
 * ```tsx
 * <ConnectionStatusBanner showOnlyWhenDisconnected />
 * ```
 */
export function ConnectionStatusBanner({
  showOnlyWhenDisconnected = true,
  onReconnected,
}: ConnectionStatusBannerProps) {
  const {
    isConnected,
    isReconnecting,
    isFailed,
    isStale,
    reconnectAttempts,
    forceReconnect,
  } = useConnectionState();

  // Não mostrar se conectado e configurado para mostrar apenas quando desconectado
  if (isConnected && !isStale && showOnlyWhenDisconnected) {
    return null;
  }

  const handleReconnect = async () => {
    await forceReconnect();
    if (onReconnected) {
      onReconnected();
    }
  };

  // Conectado
  if (isConnected && !isStale) {
    return (
      <Alert className="bg-green-50 border-green-200">
        <Wifi className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          Conectado
        </AlertDescription>
      </Alert>
    );
  }

  // Reconectando
  if (isReconnecting) {
    return (
      <Alert className="bg-yellow-50 border-yellow-200">
        <RefreshCw className="h-4 w-4 text-yellow-600 animate-spin" />
        <AlertDescription className="text-yellow-800">
          Reconectando... (tentativa {reconnectAttempts + 1})
        </AlertDescription>
      </Alert>
    );
  }

  // Falhou permanentemente
  if (isFailed) {
    return (
      <Alert className="bg-red-50 border-red-200">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800 flex items-center justify-between">
          <span>Falha na conexão. Verifique sua internet.</span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleReconnect}
            className="ml-2"
          >
            Tentar novamente
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Desconectado ou stale
  return (
    <Alert className="bg-orange-50 border-orange-200">
      <WifiOff className="h-4 w-4 text-orange-600" />
      <AlertDescription className="text-orange-800 flex items-center justify-between">
        <span>
          {isStale ? 'Conexão instável' : 'Desconectado'}
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={handleReconnect}
          className="ml-2"
        >
          Reconectar
        </Button>
      </AlertDescription>
    </Alert>
  );
}

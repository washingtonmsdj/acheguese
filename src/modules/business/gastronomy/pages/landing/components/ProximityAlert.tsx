/**
 * Componente de alerta de proximidade quando ordenação por distância está ativa
 */

import { LocateFixed, MapPin } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

interface ProximityAlertProps {
  hasDistanceData: boolean;
  nearestDistanceLabel: string | null;
  fallbackMessage: string;
  canUseGeolocation: boolean;
  locationPermissionState: PermissionState | null;
  isLocatingUser: boolean;
  hasDistanceReference: boolean;
  onActivateLocation: () => void;
}

export function ProximityAlert(props: ProximityAlertProps) {
  const {
    hasDistanceData,
    nearestDistanceLabel,
    fallbackMessage,
    canUseGeolocation,
    locationPermissionState,
    isLocatingUser,
    hasDistanceReference,
    onActivateLocation,
  } = props;

  const showLocationButton =
    !hasDistanceReference && canUseGeolocation && locationPermissionState !== 'denied';

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-card/80 px-3 py-2 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1 font-medium text-foreground">
        <MapPin className="h-3.5 w-3.5 text-primary" />
        Mais proximos de voce
      </span>

      {hasDistanceData ? (
        <span>
          Ordenacao por distancia ativa (restaurantes)
          {nearestDistanceLabel ? ` - restaurante mais proximo em ${nearestDistanceLabel}.` : '.'}
        </span>
      ) : (
        <span className="flex items-center gap-2">
          {fallbackMessage}
          {showLocationButton && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1 rounded-full px-2 text-[11px]"
              onClick={onActivateLocation}
              disabled={isLocatingUser}
            >
              <LocateFixed className="h-3.5 w-3.5" />
              {isLocatingUser ? 'Localizando...' : 'Usar localizacao'}
            </Button>
          )}
        </span>
      )}
    </div>
  );
}

/**
 * LocationButton - Botão robusto para obter localização do usuário
 * 
 * Usa useRobustGeolocation com feedback visual completo
 */

import { useState } from 'react';
import { Navigation, Loader2, MapPin, Wifi, Database } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { useRobustGeolocation } from '@/shared/hooks';
import { cn } from '@/shared/utils/cn';

interface LocationButtonProps {
  onLocationObtained?: (coords: { latitude: number; longitude: number }) => void;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showAccuracy?: boolean;
}

export function LocationButton({
  onLocationObtained,
  className,
  variant = 'outline',
  size = 'default',
  showAccuracy = true,
}: LocationButtonProps) {
  const [showDetails, setShowDetails] = useState(false);

  const {
    coords,
    loading,
    error,
    source,
    isHighAccuracy,
    requestLocation,
  } = useRobustGeolocation({
    onSuccess: (coords) => {
      onLocationObtained?.({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
    },
  });

  const getSourceIcon = () => {
    switch (source) {
      case 'gps':
        return <Navigation className="h-4 w-4" />;
      case 'ip':
        return <Wifi className="h-4 w-4" />;
      case 'cache':
        return <Database className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  const getSourceLabel = () => {
    switch (source) {
      case 'gps':
        return 'GPS';
      case 'ip':
        return 'IP';
      case 'cache':
        return 'Cache';
      default:
        return 'Localização';
    }
  };

  const getAccuracyColor = () => {
    if (!coords) return 'text-muted-foreground';
    if (coords.accuracy < 50) return 'text-success';
    if (coords.accuracy < 200) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="relative">
      <Button
        variant={variant}
        size={size}
        onClick={requestLocation}
        disabled={loading}
        className={cn('gap-2', className)}
        onMouseEnter={() => setShowDetails(true)}
        onMouseLeave={() => setShowDetails(false)}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Obtendo...
          </>
        ) : coords ? (
          <>
            {getSourceIcon()}
            {isHighAccuracy && <span className="text-success">●</span>}
            Localização
          </>
        ) : (
          <>
            <MapPin className="h-4 w-4" />
            Minha Localização
          </>
        )}
      </Button>

      {/* Tooltip com detalhes */}
      {showDetails && coords && showAccuracy && (
        <div className="absolute top-full mt-2 left-0 z-50 w-64 p-3 bg-popover border border-border rounded-lg shadow-lg text-sm">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Fonte:</span>
              <span className="font-medium flex items-center gap-1">
                {getSourceIcon()}
                {getSourceLabel()}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Precisão:</span>
              <span className={cn('font-medium', getAccuracyColor())}>
                {Math.round(coords.accuracy)}m
              </span>
            </div>

            {coords.speed !== null && coords.speed > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Velocidade:</span>
                <span className="font-medium">
                  {Math.round(coords.speed * 3.6)} km/h
                </span>
              </div>
            )}

            {coords.altitude !== null && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Altitude:</span>
                <span className="font-medium">
                  {Math.round(coords.altitude)}m
                </span>
              </div>
            )}

            <div className="pt-2 border-t border-border text-xs text-muted-foreground">
              <div>Lat: {coords.latitude.toFixed(6)}</div>
              <div>Lng: {coords.longitude.toFixed(6)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Erro */}
      {error && !loading && (
        <div className="absolute top-full mt-2 left-0 z-50 w-64 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}

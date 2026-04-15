/**
 * NearbyToggle - Toggle para ordenar por proximidade
 * 
 * Permite alternar entre ordenação padrão e "perto de mim".
 * 
 * @module core/geospatial/components
 */

import React from 'react';
import { Button } from '@/shared/components/ui/button';
import { MapPin, Loader2 } from 'lucide-react';
import { useRobustGeolocation } from '@/shared/hooks';

export interface NearbyToggleProps {
  /** Estado atual (ativo/inativo) */
  active: boolean;
  /** Callback quando toggle muda */
  onToggle: (active: boolean) => void;
  /** Texto quando ativo */
  activeText?: string;
  /** Texto quando inativo */
  inactiveText?: string;
  /** Classe CSS adicional */
  className?: string;
}

/**
 * Toggle para ordenar por proximidade
 * 
 * @example
 * ```tsx
 * const [nearbyMode, setNearbyMode] = useState(false);
 * 
 * <NearbyToggle
 *   active={nearbyMode}
 *   onToggle={setNearbyMode}
 * />
 * ```
 */
export function NearbyToggle({
  active,
  onToggle,
  activeText = 'Perto de mim',
  inactiveText = 'Ordenar por proximidade',
  className = '',
}: NearbyToggleProps) {
  const { coords, loading, requestLocation } = useRobustGeolocation({ useCache: true });

  const handleClick = () => {
    if (!coords && !loading) {
      // Solicitar localização se não tiver
      requestLocation();
      return;
    }

    if (coords) {
      onToggle(!active);
    }
  };

  return (
    <Button
      variant={active ? 'default' : 'outline'}
      size="sm"
      onClick={handleClick}
      disabled={loading}
      className={className}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Localizando...
        </>
      ) : (
        <>
          <MapPin className="w-4 h-4 mr-2" />
          {active ? activeText : inactiveText}
        </>
      )}
    </Button>
  );
}

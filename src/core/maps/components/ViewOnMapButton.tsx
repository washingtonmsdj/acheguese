/**
 * ViewOnMapButton — Botão para ver item no mapa.
 * Navega para a página do mapa com as coordenadas do item.
 */

import { Map } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';

interface ViewOnMapButtonProps {
  latitude?: number | null;
  longitude?: number | null;
  itemId?: string;
  itemType?: string;
  itemName?: string;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  className?: string;
}

export function ViewOnMapButton({
  latitude,
  longitude,
  itemName,
  size = 'sm',
  variant = 'outline',
  className,
}: ViewOnMapButtonProps) {
  const hasValidCoordinates =
    typeof latitude === 'number' &&
    Number.isFinite(latitude) &&
    typeof longitude === 'number' &&
    Number.isFinite(longitude);

  if (!hasValidCoordinates) return null;

  const mapUrl = `/mapa?lat=${latitude}&lng=${longitude}&zoom=16${itemName ? `&highlight=${encodeURIComponent(itemName)}` : ''}`;

  return (
    <Button
      asChild
      size={size}
      variant={variant}
      className={cn('gap-1.5', className)}
    >
      <Link to={mapUrl}>
        <Map className="h-3.5 w-3.5" />
        Ver no Mapa
      </Link>
    </Button>
  );
}

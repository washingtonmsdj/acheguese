/**
 * ViewOnMapButton — Botão para ver item no mapa.
 * Navega para a página do mapa com as coordenadas do item.
 */

import { Map } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { useFriendlyModuleUrls } from '@/core/routing/hooks/useFriendlyModuleUrls';
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
  const moduleUrls = useFriendlyModuleUrls();

  if (!latitude || !longitude) return null;

  const mapUrl = `${moduleUrls.map}?lat=${latitude}&lng=${longitude}&zoom=16${itemName ? `&highlight=${encodeURIComponent(itemName)}` : ''}`;

  return (
    <Button
      asChild
      size={size}
      variant={variant}
      className={cn('gap-1.5', className)}
    >
      <a href={mapUrl}>
        <Map className="h-3.5 w-3.5" />
        Ver no Mapa
      </a>
    </Button>
  );
}
